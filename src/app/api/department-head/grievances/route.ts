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
          none: { assignment_status: "ASSIGNED" },
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
          { assignments: { none: { assignment_status: "ASSIGNED" } } },
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
        sla_status: { in: ["AT_RISK", "BREACHED"] },
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
                where: { assignment_status: "ASSIGNED" },
                include: {
                  users_assignments_staff_idTousers: true,
                },
              },
            },
          },
          assignments: {
            where: { assignment_status: "ASSIGNED" },
            include: {
              users_assignments_staff_idTousers: true,
            },
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
            include: { users: true },
          },
          attachments: true,
          audit_logs: {
            orderBy: { created_at: "desc" },
            include: {
              users: { include: { roles: true } },
            },
            take: 20,
          },
        },
        orderBy: [{ priority: "desc" }, { created_at: "desc" }],
        skip,
        take: limit,
      }),
      prisma.grievances.count({ where }),
    ]);

    // Format into frontend GrievanceItem shape
    const items = rawGrievances.map((g) => {
      const activeAssignment = g.assignments[0];
      const assignedStaff = activeAssignment?.users_assignments_staff_idTousers;
      const latestEscalation = g.escalations[0];
      const latestResolution = g.resolutions[0];

      // Extract internal directives and audit history from audit logs
      const internalNotes = g.audit_logs
        .filter((l) => l.action === "HOD_DIRECTIVE_NOTE")
        .map((l) => {
          const val = l.new_value as { note?: string } | null;
          const authorName = l.users
            ? `${l.users.first_name} ${l.users.last_name || ""}`.trim()
            : "Department Head";
          return {
            id: l.audit_log_id.toString(),
            author: authorName,
            role: l.users?.roles?.role_name || "Department Head",
            timestamp: formatRelativeTime(l.created_at),
            note: val?.note || String(l.new_value || ""),
          };
        });

      const auditTrail = g.audit_logs.map((l) => {
        const actor = l.users
          ? `${l.users.first_name} ${l.users.last_name || ""}`.trim()
          : "System";
        const val = l.new_value as {
          details?: string;
          bottleneck?: string;
          stage?: string;
        } | null;

        return {
          id: l.audit_log_id.toString(),
          timestamp: formatRelativeTime(l.created_at),
          actor: `${actor} (${l.users?.roles?.role_name || "System"})`,
          action: l.action.replace(/_/g, " "),
          bottleneck: val?.bottleneck,
          details:
            val?.details ||
            (typeof l.new_value === "object"
              ? JSON.stringify(l.new_value)
              : String(l.new_value || "")),
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
              | "REASSIGN"
              | "CROSS_DEPT"
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

      // Check cross-department collaboration
      const deptList: string[] = [];
      if (g.grievance_departments) {
        deptList.push(g.grievance_departments.departments.department_name);
      }
      const isCrossDepartment = deptList.length > 1;

      return {
        id: g.grievance_id.toString(),
        ticketCode: g.grievance_number,
        title: g.title,
        description: g.description,
        category: g.categories.category_name,
        subcategory: g.subcategories.subcategory_name,
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
        slaTimeLeft: formatSlaTimeLeft(g.due_at, g.sla_status),
        slaConsumptionPercent: calculateSlaConsumption(
          g.created_at,
          g.due_at,
          g.priority,
        ).consumptionPercent,
        assignedStaffId: assignedStaff
          ? assignedStaff.user_id.toString()
          : null,
        assignedStaffName: assignedStaff
          ? `${assignedStaff.first_name} ${assignedStaff.last_name || ""}`.trim()
          : null,
        createdAt: formatFriendlyDate(g.created_at),
        isReopened: g.reopen_count > 0 || g.status === "REOPENED",
        reopenCount: g.reopen_count,
        isCrossDepartment,
        collaboratingDepartments: deptList,
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
              staffName:
                `${latestResolution.users.first_name} ${latestResolution.users.last_name || ""}`.trim(),
              note: `${latestResolution.problem_summary}: ${latestResolution.action_taken}`,
              submittedAt: formatRelativeTime(latestResolution.submitted_at),
            }
          : null,
        auditTrail,
        attachments: g.attachments.map((a) => ({
          name: a.file_name,
          size: a.file_size
            ? `${Math.round(Number(a.file_size) / 1024)} KB`
            : "150 KB",
          type: a.file_type,
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
