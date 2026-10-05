import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  formatFriendlyDate,
  formatRelativeTime,
  formatSlaTimeLeft,
  resolveDepartmentHeadAuth,
} from "@/lib/department-head";
import { calculateSlaConsumption } from "@/lib/engines/sla-engine";
import { getPaginationParams, paginatedJsonResponse } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

function formatAuditEntryDetails(action: string, newValue: unknown): string {
  if (!newValue) return "Action recorded during grievance processing.";

  let parsed: unknown = newValue;
  if (typeof newValue === "string") {
    const trimmed = newValue.trim();
    if (trimmed.startsWith("{")) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = trimmed;
      }
    } else {
      return trimmed;
    }
  }

  if (typeof parsed === "object" && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    if (obj.details && typeof obj.details === "string") return obj.details;
    if (obj.note && typeof obj.note === "string") return obj.note;
    if (obj.remarks && typeof obj.remarks === "string") return obj.remarks;
    if (obj.outcome && typeof obj.outcome === "string")
      return String(obj.outcome);

    const act = action.toUpperCase();

    if (
      act.includes("SLA_100") ||
      act.includes("BREACH") ||
      obj.newStatus === "ESCALATED"
    ) {
      const escalatedTo = obj.escalatedTo
        ? ` to ${obj.escalatedTo}`
        : " to Department Head";
      return `SLA resolution deadline elapsed. Case automatically escalated${escalatedTo} for intervention directives.`;
    }

    if (
      act.includes("SLA_75") ||
      act.includes("AT_RISK") ||
      obj.slaStatus === "AT_RISK"
    ) {
      return "SLA reached 75% elapsed warning threshold. Department Head notified for proactive review.";
    }

    if (act.includes("ROUTE") || obj.status === "ROUTED") {
      return "Grievance triaged and successfully routed to department queue.";
    }

    if (act.includes("CREATE") || obj.status === "SUBMITTED") {
      const prio = obj.priority ? ` with ${obj.priority} priority` : "";
      return `Grievance registered and submitted by complainant${prio}.`;
    }

    if (act.includes("ASSIGN") || obj.staff_id) {
      return "Case assigned to designated department officer for inquiry and investigation.";
    }

    if (act.includes("SUBMIT_RESOLUTION")) {
      return "Investigating officer submitted resolution findings.";
    }

    if (act.includes("RESOLUTION") && obj.decision) {
      return `Resolution review decided: ${obj.decision}.`;
    }

    const summary = Object.entries(obj)
      .filter(
        ([k, v]) =>
          typeof v !== "object" &&
          v !== null &&
          v !== undefined &&
          k !== "threshold",
      )
      .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").toLowerCase()}: ${v}`)
      .join(" • ");
    if (summary) return summary;
  }

  return String(newValue || "Action recorded.");
}

export async function GET(request: Request) {
  const auth = await resolveDepartmentHeadAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { departmentId } = auth;
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(request, 20);

  const tab = (searchParams.get("tab") || "ALL").toUpperCase();
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const priority = (searchParams.get("priority") || "ALL").toUpperCase();
  const staffId = searchParams.get("staffId") || "ALL";

  try {
    // Base condition: Must belong to Head's department
    const conditions: Prisma.grievancesWhereInput[] = [
      {
        grievance_departments: {
          department_id: departmentId,
        },
      },
    ];

    // Priority filter
    if (priority !== "ALL") {
      conditions.push({ priority });
    }

    // Search filter
    if (search) {
      conditions.push({
        OR: [
          { grievance_number: { contains: search, mode: "insensitive" } },
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          {
            users: {
              OR: [
                { first_name: { contains: search, mode: "insensitive" } },
                { last_name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
          {
            categories: {
              category_name: { contains: search, mode: "insensitive" },
            },
          },
        ],
      });
    }

    // Staff filter
    if (staffId === "UNASSIGNED") {
      conditions.push({
        assignments: {
          none: {
            assignment_status: "ASSIGNED",
            grievance_departments: { department_id: departmentId },
          },
        },
      });
    } else if (staffId !== "ALL") {
      try {
        const staffBigInt = BigInt(staffId);
        conditions.push({
          assignments: {
            some: {
              staff_id: staffBigInt,
              assignment_status: "ASSIGNED",
              grievance_departments: { department_id: departmentId },
            },
          },
        });
      } catch {
        // invalid staffId, ignore
      }
    }

    // Tab filter
    if (tab === "UNASSIGNED") {
      conditions.push({
        OR: [
          {
            assignments: {
              none: {
                assignment_status: "ASSIGNED",
                grievance_departments: { department_id: departmentId },
              },
            },
          },
          { status: "SUBMITTED" },
          { status: "ROUTED" },
        ],
      });
    } else if (tab === "IN_PROGRESS") {
      conditions.push({
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      });
    } else if (tab === "HIGH_CRITICAL") {
      conditions.push({
        priority: { in: ["HIGH", "CRITICAL"] },
      });
    } else if (tab === "AT_RISK") {
      conditions.push({
        sla_status: "AT_RISK",
        status: { notIn: ["ESCALATED", "CLOSED", "RESOLVED"] },
      });
    } else if (tab === "ESCALATED") {
      conditions.push({
        status: "ESCALATED",
      });
    } else if (tab === "REOPENED") {
      conditions.push({
        OR: [
          { reopen_count: { gt: 0 } },
          { status: { in: ["REOPENED", "REOPEN_REVIEW"] } },
        ],
      });
    } else if (tab === "RESOLUTION_REVIEW") {
      conditions.push({
        status: "UNDER_REVIEW",
      });
    } else if (tab === "CLOSED") {
      conditions.push({
        status: { in: ["CLOSED", "RESOLVED"] },
      });
    }

    const where: Prisma.grievancesWhereInput = { AND: conditions };

    const [rawGrievances, total] = await Promise.all([
      prisma.grievances.findMany({
        where,
        include: {
          users: {
            include: { roles: true },
          },
          categories: true,
          subcategories: true,
          grievance_departments: {
            include: {
              departments: true,
              assignments: {
                where: { assignment_status: { in: ["ASSIGNED", "COMPLETED"] } },
                include: {
                  users_assignments_staff_idTousers: true,
                },
              },
            },
          },
          assignments: {
            where: {
              assignment_status: { in: ["ASSIGNED", "COMPLETED"] },
              grievance_departments: { department_id: departmentId },
            },
            include: {
              users_assignments_staff_idTousers: true,
            },
            orderBy: { assigned_at: "desc" },
            take: 1,
          },
          escalations: {
            orderBy: { created_at: "desc" },
            take: 1,
            include: { users: true },
          },
          resolutions: {
            orderBy: { submitted_at: "desc" },
            take: 1,
            include: {
              users: {
                include: { roles: true },
              },
              knowledge_articles: {
                select: { article_id: true },
              },
            },
          },
          attachments: true,
          audit_logs: {
            orderBy: { created_at: "desc" },
            include: {
              users: { include: { roles: true } },
            },
            take: 50,
          },
        },
        orderBy: [{ priority: "desc" }, { created_at: "desc" }],
        skip,
        take: limit,
      }),
      prisma.grievances.count({ where }),
    ]);

    // Fetch all involved departments and their assignments across grievances
    const gIds = rawGrievances.map((g) => g.grievance_id);
    const [allDeptRecords, allAssignments] = await Promise.all([
      prisma.grievance_departments.findMany({
        where: { grievance_id: { in: gIds } },
        include: { departments: true },
      }),
      prisma.assignments.findMany({
        where: {
          grievance_id: { in: gIds },
          assignment_status: { in: ["ASSIGNED", "COMPLETED"] },
        },
        include: {
          users_assignments_staff_idTousers: true,
          grievance_departments: { include: { departments: true } },
        },
        orderBy: { assigned_at: "desc" },
      }),
    ]);

    // Format into frontend GrievanceItem shape
    const items = rawGrievances.map((g) => {
      const grievanceAssignments = allAssignments.filter(
        (a) => a.grievance_id === g.grievance_id,
      );

      // Find assignment in this head's department
      const myDeptAssignment = departmentId
        ? grievanceAssignments.find(
            (a) => a.grievance_departments?.department_id === departmentId,
          )
        : null;

      // Find partner co-lead assignment (for EQUAL involvement)
      const otherCoLeadAssignment = departmentId
        ? grievanceAssignments.find(
            (a) =>
              a.grievance_departments?.department_id !== departmentId &&
              a.grievance_departments?.involvement_type === "EQUAL",
          )
        : null;

      const activeAssignment =
        myDeptAssignment || g.assignments[0] || grievanceAssignments[0];
      const assignedStaff = activeAssignment?.users_assignments_staff_idTousers;

      // Compute display name for Assigned To column
      let resolvedAssignedStaffName: string | null = null;
      if (myDeptAssignment) {
        const myStaff = myDeptAssignment.users_assignments_staff_idTousers;
        const myStaffName =
          `${myStaff.first_name} ${myStaff.last_name || ""}`.trim();
        if (otherCoLeadAssignment) {
          const partnerStaff =
            otherCoLeadAssignment.users_assignments_staff_idTousers;
          const partnerDept =
            otherCoLeadAssignment.grievance_departments?.departments
              ?.department_name || "Partner";
          resolvedAssignedStaffName =
            `${myStaffName} (${partnerDept}: ${partnerStaff.first_name} ${partnerStaff.last_name || ""}`.trim() +
            ")";
        } else {
          resolvedAssignedStaffName = myStaffName;
        }
      } else if (otherCoLeadAssignment) {
        const partnerStaff =
          otherCoLeadAssignment.users_assignments_staff_idTousers;
        const partnerDept =
          otherCoLeadAssignment.grievance_departments?.departments
            ?.department_name || "Partner";
        resolvedAssignedStaffName =
          `Unassigned (${partnerDept}: ${partnerStaff.first_name} ${partnerStaff.last_name || ""}`.trim() +
          ")";
      } else if (!departmentId && grievanceAssignments.length > 0) {
        resolvedAssignedStaffName = grievanceAssignments
          .map((a) =>
            `${a.users_assignments_staff_idTousers.first_name} ${a.users_assignments_staff_idTousers.last_name || ""}`.trim(),
          )
          .join(", ");
      } else if (assignedStaff) {
        resolvedAssignedStaffName =
          `${assignedStaff.first_name} ${assignedStaff.last_name || ""}`.trim();
      }

      const latestEscalation = g.escalations[0];
      const latestResolution = g.resolutions[0];

      // Extract two-way internal notes from audit logs (chronological: oldest to newest)
      const internalNotes = g.audit_logs
        .filter(
          (l) =>
            l.action === "HOD_DIRECTIVE_NOTE" ||
            l.action === "INVESTIGATION_NOTE_ADDED" ||
            l.action === "INTERNAL_NOTE_ADDED" ||
            l.action === "HEAD_DIRECTIVE_ISSUED",
        )
        .slice()
        .reverse()
        .map((l) => {
          const user = l.users;
          const userRole = user?.roles?.role_name;
          const val = l.new_value as {
            note?: string;
            details?: string;
            author?: string;
            role?: string;
            parentId?: string;
            replyToAuthor?: string;
          } | null;

          const roleDisplay =
            val?.role ||
            (userRole === "DEPARTMENT_HEAD"
              ? "Department Head"
              : userRole === "STAFF"
                ? "Staff"
                : userRole || "Staff");

          const rawName = user
            ? `${user.first_name} ${user.last_name || ""}`.trim()
            : "User";

          const authorDisplay =
            val?.author ||
            (userRole === "DEPARTMENT_HEAD"
              ? `Department Head — ${rawName}`
              : userRole === "STAFF"
                ? `Staff — ${rawName}`
                : rawName);

          return {
            id: l.audit_log_id.toString(),
            author: authorDisplay,
            role: roleDisplay,
            timestamp: formatRelativeTime(l.created_at),
            note: val?.note || val?.details || String(l.new_value || ""),
            parentId: val?.parentId || undefined,
            replyToAuthor: val?.replyToAuthor || undefined,
            createdAt: l.created_at.toISOString(),
          };
        });

      const auditTrail = g.audit_logs.map((l) => {
        const user = l.users;
        const userRole = user?.roles?.role_name;
        let actor = "System";
        if (user) {
          const rawName = `${user.first_name} ${user.last_name || ""}`.trim();
          if (userRole === "DEPARTMENT_HEAD") {
            actor = `Department Head — ${rawName}`;
          } else if (userRole === "STAFF") {
            actor = `Staff — ${rawName}`;
          } else {
            actor = `${rawName} (${userRole || "User"})`;
          }
        }

        const val = l.new_value as {
          details?: string;
          note?: string;
          bottleneck?: string;
          stage?: string;
        } | null;

        let actionTitle = l.action.replace(/_/g, " ");
        if (l.action === "HOD_DIRECTIVE_NOTE") {
          actionTitle = "Internal Note";
        } else if (
          l.action === "INVESTIGATION_NOTE_ADDED" ||
          l.action === "INTERNAL_NOTE_ADDED"
        ) {
          actionTitle = "Investigation Note";
        }

        return {
          id: l.audit_log_id.toString(),
          timestamp: formatRelativeTime(l.created_at),
          actor,
          action: actionTitle,
          bottleneck: val?.bottleneck,
          details: formatAuditEntryDetails(l.action, l.new_value),
          stage: val?.stage || g.status,
        };
      });

      // Find any HOD intervention record from audit logs
      const interventionLog = g.audit_logs.find(
        (l) =>
          l.action === "HOD_INTERVENTION_TAKEN" ||
          l.action === "Step 6: Intervention Action Taken",
      );
      let hodIntervention = null;
      if (interventionLog?.new_value) {
        const iv = interventionLog.new_value as Record<string, unknown>;
        hodIntervention = {
          actionType:
            (iv.actionType as
              | "MONITOR"
              | "REQUEST_STATUS_UPDATE"
              | "NOTIFY_STAFF"
              | "REASSIGN"
              | "CROSS_DEPT"
              | "DIRECT_OVERSIGHT"
              | "EXTEND_SLA"
              | "EXPEDITE"
              | "OVERRIDE"
              | "SLA_EXTENSION") || "REASSIGN",
          actionLabel: (iv.actionLabel as string) || "HOD Intervention",
          note: (iv.note as string) || "",
          intervenedAt: formatRelativeTime(interventionLog.created_at),
          intervenedBy:
            (iv.intervenedBy as string) ||
            (interventionLog.users
              ? `${interventionLog.users.first_name} ${interventionLog.users.last_name || ""}`.trim()
              : "Department Head"),
          targetStaffName: iv.targetStaffName as string | undefined,
          targetDepartment: iv.targetDepartment as string | undefined,
        };
      }

      // Check cross-department collaboration and involvement
      const relatedDepts = allDeptRecords.filter(
        (d) => d.grievance_id === g.grievance_id,
      );
      const deptList: string[] = relatedDepts.map(
        (d) => d.departments.department_name,
      );
      if (deptList.length === 0 && g.grievance_departments) {
        deptList.push(g.grievance_departments.departments.department_name);
      }
      const isCrossDepartment = deptList.length > 1;

      const myDeptRecord = relatedDepts.find(
        (d) => d.department_id === departmentId,
      );
      const myInvolvementType =
        (myDeptRecord?.involvement_type as
          | "PRIMARY"
          | "SUPPORTING"
          | "EQUAL") || "PRIMARY";
      const isPrimaryDepartment =
        myInvolvementType === "PRIMARY" ||
        myInvolvementType === "EQUAL" ||
        !departmentId;

      return {
        id: g.grievance_id.toString(),
        ticketCode: g.grievance_number,
        title: g.title,
        description: g.description,
        category: g.categories.category_name,
        subcategory: g.subcategories.subcategory_name,
        categoryId: g.category_id ? g.category_id.toString() : null,
        subcategoryId: g.subcategory_id ? g.subcategory_id.toString() : null,
        submitterName:
          `${g.users.first_name} ${g.users.last_name || ""}`.trim(),
        submitterRole: g.users.roles?.role_name || "Employee",
        submitterEmail: g.users.email,
        priority: g.priority as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
        status: g.status as
          | "SUBMITTED"
          | "ROUTED"
          | "ASSIGNED"
          | "IN_PROGRESS"
          | "UNDER_REVIEW"
          | "REOPENED"
          | "ESCALATED"
          | "CLOSED",
        slaStatus: (g.sla_status || "ON_TRACK") as
          | "ON_TRACK"
          | "AT_RISK"
          | "BREACHED",
        slaDeadline: formatFriendlyDate(g.due_at),
        slaTimeLeft: formatSlaTimeLeft(
          g.due_at,
          g.sla_status,
          g.priority,
          g.created_at,
        ),
        slaConsumptionPercent: calculateSlaConsumption(
          g.created_at,
          g.due_at,
          g.priority,
        ).consumptionPercent,
        assignedStaffId: assignedStaff
          ? assignedStaff.user_id.toString()
          : null,
        assignedStaffName: resolvedAssignedStaffName,
        createdAt: formatFriendlyDate(g.created_at),
        isReopened: g.reopen_count > 0 || g.status === "REOPENED",
        reopenCount: g.reopen_count,
        hasProposedKb: (latestResolution?.knowledge_articles?.length ?? 0) > 0,
        isCrossDepartment,
        collaboratingDepartments: deptList,
        isPrimaryDepartment,
        myInvolvementType,
        escalationReason: latestEscalation?.reason || undefined,
        escalationLevel: latestEscalation?.escalation_level || undefined,
        escalationStage:
          g.status === "ESCALATED"
            ? ("GRIEVANCE_ESCALATED" as const)
            : g.status === "UNDER_REVIEW"
              ? ("RESOLUTION_SUBMITTED" as const)
              : g.status === "CLOSED"
                ? ("ESCALATION_CLEARED" as const)
                : ("IN_PROGRESS" as const),
        hodIntervention,
        submittedResolution: latestResolution
          ? {
              id: latestResolution.resolution_id.toString(),
              submittedByUserId: latestResolution.submitted_by.toString(),
              submittedByRole: latestResolution.users.roles?.role_name || null,
              staffName:
                `${latestResolution.users.first_name} ${latestResolution.users.last_name || ""}`.trim(),
              problemSummary: latestResolution.problem_summary,
              actionTaken: latestResolution.action_taken,
              findings: latestResolution.findings,
              outcome: latestResolution.outcome,
              note:
                latestResolution.action_taken ||
                latestResolution.problem_summary,
              submittedAt: formatRelativeTime(latestResolution.submitted_at),
            }
          : null,
        auditTrail,
        attachments: g.attachments.map((a) => ({
          id: a.attachment_id.toString(),
          name: a.file_name,
          size: a.file_size
            ? `${Math.round(Number(a.file_size) / 1024)} KB`
            : "150 KB",
          type: a.file_type,
          path: a.file_path,
          uploadedAt: formatFriendlyDate(a.uploaded_at),
        })),
        internalNotes,
      };
    });

    return paginatedJsonResponse("grievances", items, total, page, limit);
  } catch (error) {
    console.error("Error in /api/department-head/grievances:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch grievances",
      },
      { status: 500 },
    );
  }
}
