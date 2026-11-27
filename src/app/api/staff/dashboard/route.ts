import { NextResponse } from "next/server";
import { filterAuthorizedAttachments } from "@/lib/attachments/access-control";
import { canDepartmentSubmitFinalResolution } from "@/lib/engines/routing-engine";
import { prisma } from "@/lib/prisma";
import { resolveStaffAuth } from "@/lib/staff/permissions";
import {
  calculateSlaStatus,
  formatAuditActionTitle,
  formatRelativeTime,
  isStaffRelevantAuditAction,
} from "@/lib/staff/utils";
import type {
  StaffAuditItem,
  StaffDashboardData,
  StaffGrievanceItem,
  StaffInternalNote,
  StaffPriority,
  StaffResolutionData,
  SupportingDepartmentFinding,
} from "@/types/staff";

export async function GET(request: Request) {
  const auth = await resolveStaffAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { user, staffId, departmentId, isAdmin } = auth;

  try {
    // 1. Fetch Staff User details
    const staffUser = await prisma.users.findUnique({
      where: { user_id: staffId },
      include: {
        departments: true,
        roles: true,
      },
    });

    if (!staffUser) {
      return NextResponse.json(
        { success: false, message: "Staff record not found" },
        { status: 404 },
      );
    }

    // 2. Fetch HOD of this department
    let hodUser: {
      first_name: string;
      last_name: string | null;
      email: string;
    } | null = null;

    if (departmentId) {
      hodUser = await prisma.users.findFirst({
        where: {
          department_id: departmentId,
          roles: { role_name: "DEPARTMENT_HEAD" },
          status: "ACTIVE",
        },
        select: {
          first_name: true,
          last_name: true,
          email: true,
        },
      });
    }

    const assignmentQuery = {
      include: {
        grievance_departments: true,
        grievances: {
          include: {
            categories: true,
            subcategories: true,
            users: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                roles: true,
              },
            },
            grievance_departments: {
              include: {
                departments: true,
                assignments: {
                  include: { users_assignments_staff_idTousers: true },
                },
              },
            },
            attachments: {
              include: {
                attachment_department_grants: true,
              },
            },
            resolutions: {
              orderBy: { submitted_at: "desc" as const },
              take: 5,
              include: {
                attachments: true,
                users: {
                  include: { roles: true },
                },
                resolution_reviews: {
                  orderBy: { reviewed_at: "desc" as const },
                  take: 1,
                },
                knowledge_articles: {
                  select: { article_id: true },
                },
              },
            },
            audit_logs: {
              orderBy: { created_at: "desc" as const },
              take: 50,
              include: {
                users: {
                  select: {
                    first_name: true,
                    last_name: true,
                    roles: true,
                    department_id: true,
                  },
                },
              },
            },
            sla_tracking: {
              orderBy: { sla_tracking_id: "desc" as const },
              take: 1,
              include: {
                sla_policies: true,
              },
            },
            sla_extensions: {
              orderBy: { created_at: "desc" as const },
              take: 1,
            },
          },
        },
      },
    };

    // 3. Fetch active and completed assignments for this staff member
    let assignments = await prisma.assignments.findMany({
      where: {
        staff_id: staffId,
        assignment_status: { in: ["ASSIGNED", "CO_ASSIGNED", "COMPLETED"] },
      },
      ...assignmentQuery,
      orderBy: { assigned_at: "desc" },
    });

    // If Admin or Department Head has no direct assignments, show department / system active assignments
    const isDeptHead = auth.user.roles.role_name === "DEPARTMENT_HEAD";
    if (assignments.length === 0 && (isAdmin || isDeptHead)) {
      assignments = await prisma.assignments.findMany({
        where: {
          assignment_status: { in: ["ASSIGNED", "COMPLETED"] },
          ...(departmentId
            ? { grievance_departments: { department_id: departmentId } }
            : {}),
        },
        take: 40,
        ...assignmentQuery,
        orderBy: { assigned_at: "desc" },
      });
    }

    // 4. Deduplicate assignments by grievance_id (prefer active ASSIGNED, then newest)
    const uniqueAssignments: typeof assignments = [];
    const seenGrievanceIds = new Set<string>();

    const sortedAssignments = [...assignments]
      .filter((a) => Boolean(a.grievances))
      .sort((a, b) => {
        if (
          a.assignment_status === "ASSIGNED" &&
          b.assignment_status !== "ASSIGNED"
        )
          return -1;
        if (
          b.assignment_status === "ASSIGNED" &&
          a.assignment_status !== "ASSIGNED"
        )
          return 1;
        return (
          new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime()
        );
      });

    for (const a of sortedAssignments) {
      const gid = a.grievance_id.toString();
      if (!seenGrievanceIds.has(gid)) {
        seenGrievanceIds.add(gid);
        uniqueAssignments.push(a);
      }
    }

    // Map grievances and calculate SLA
    const grievanceItems: StaffGrievanceItem[] = uniqueAssignments.map((a) => {
      const g = a.grievances;
      const submitter = g.users;
      const submitterFullName = submitter
        ? `${submitter.first_name} ${submitter.last_name || ""}`.trim()
        : "Employee";

      const myInvolvementType =
        (a.grievance_departments?.involvement_type as
          | "PRIMARY"
          | "SUPPORTING"
          | "EQUAL") || "PRIMARY";
      const isPrimaryOwner =
        myInvolvementType === "PRIMARY" ||
        myInvolvementType === "EQUAL" ||
        isAdmin;

      const isMyDeptCompleted =
        a.grievance_departments?.status === "COMPLETED" ||
        a.assignment_status === "COMPLETED" ||
        Boolean(a.grievance_departments?.completed_at);
      const completedAt =
        a.grievance_departments?.completed_at ||
        a.completed_at ||
        (isMyDeptCompleted ? new Date() : null);

      let slaCalc: ReturnType<typeof calculateSlaStatus>;
      if (a.grievance_departments?.status === "BLOCKED") {
        slaCalc = {
          consumptionPercent: 0,
          timeRemaining: "Pending Prerequisites",
          state: "ON_TRACK",
          stateLabel: "Blocked",
        };
      } else {
        const activeSla = g.sla_tracking?.[0];
        const deptStart =
          a.grievance_departments?.activated_at ||
          a.grievance_departments?.assigned_at ||
          activeSla?.started_at ||
          g.created_at;
        const deptDue =
          a.grievance_departments?.due_at || activeSla?.due_at || g.due_at;
        const deptSlaStatus =
          a.grievance_departments?.sla_status || g.sla_status;
        const policyTc =
          (activeSla?.sla_policies?.trigger_condition as Record<
            string,
            unknown
          >) || {};
        const policyAtRisk = Number(
          policyTc.at_risk_threshold_percent ||
            activeSla?.sla_policies?.escalation_threshold_percent ||
            75,
        );
        slaCalc = calculateSlaStatus(
          deptStart,
          deptDue,
          deptSlaStatus,
          activeSla?.accumulated_paused_minutes || 0,
          activeSla?.paused_at,
          g.status,
          completedAt,
          policyAtRisk,
        );
      }

      const latestResolution = g.resolutions?.[0];
      const latestReview = latestResolution?.resolution_reviews?.[0];
      let submittedResolution: StaffResolutionData | null = null;

      if (latestResolution) {
        submittedResolution = {
          id: latestResolution.resolution_id.toString(),
          submittedByUserId: latestResolution.submitted_by.toString(),
          submittedByRole:
            latestResolution.users?.roles?.role_name || undefined,
          problemSummary: latestResolution.problem_summary,
          findings: latestResolution.findings,
          actionTaken: latestResolution.action_taken,
          outcome: latestResolution.outcome,
          evidence: latestResolution.evidence,
          submittedAt: latestResolution.submitted_at
            ? new Date(latestResolution.submitted_at).toISOString()
            : new Date().toISOString(),
          reviewStatus: latestReview?.decision as
            | "PENDING"
            | "ACCEPTED"
            | "REJECTED"
            | undefined,
          attachments: filterAuthorizedAttachments(
            user,
            latestResolution.attachments || [],
            {
              grievance_id: g.grievance_id,
              submitted_by: g.submitted_by,
              status: g.status,
            },
            (g.grievance_departments || []).map((gd) => ({
              grievance_department_id: gd.grievance_department_id,
              department_id: gd.department_id,
              department_name: gd.departments?.department_name || "",
              involvement_type: gd.involvement_type,
              status: gd.status,
            })),
            [
              {
                staff_id: a.staff_id,
                grievance_department_id: a.grievance_department_id,
                assignment_status: a.assignment_status,
              },
            ],
            (g.attachments || []).flatMap((att) =>
              (att.attachment_department_grants || []).map((gr) => ({
                grant_id: gr.grant_id,
                attachment_id: gr.attachment_id,
                department_id: gr.department_id,
                granted_by: gr.granted_by,
                granted_at: gr.granted_at,
              })),
            ),
          ).map((att) => ({
            id: att.attachment_id.toString(),
            name: att.file_name,
            size: att.file_size
              ? `${Math.round(Number(att.file_size) / 1024)} KB`
              : "Document",
            type: att.file_type,
            path: att.file_path,
            downloadUrl: `/api/attachments/${att.attachment_id}/download`,
            uploadedAt: att.uploaded_at
              ? new Date(att.uploaded_at).toISOString()
              : new Date().toISOString(),
          })),
        };
      }

      const attachments = filterAuthorizedAttachments(
        user,
        (g.attachments || []).filter(
          (att) =>
            !att.resolution_id &&
            !att.grievance_department_id &&
            BigInt(att.uploaded_by) === BigInt(g.submitted_by),
        ),
        {
          grievance_id: g.grievance_id,
          submitted_by: g.submitted_by,
          status: g.status,
        },
        (g.grievance_departments || []).map((gd) => ({
          grievance_department_id: gd.grievance_department_id,
          department_id: gd.department_id,
          department_name: gd.departments?.department_name || "",
          involvement_type: gd.involvement_type,
          status: gd.status,
        })),
        [
          {
            staff_id: a.staff_id,
            grievance_department_id: a.grievance_department_id,
            assignment_status: a.assignment_status,
          },
        ],
      ).map((att) => ({
        id: att.attachment_id.toString(),
        name: att.file_name,
        size: att.file_size
          ? `${Math.round(Number(att.file_size) / 1024)} KB`
          : "Document",
        type: att.file_type,
        path: att.file_path,
        downloadUrl: `/api/attachments/${att.attachment_id}/download`,
        uploadedAt: formatRelativeTime(g.created_at),
      }));

      // Extract two-way internal case notes from audit logs (chronological: oldest to newest)
      const internalNotes: StaffInternalNote[] = (g.audit_logs || [])
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
          let val: {
            note?: string;
            details?: string;
            author?: string;
            role?: string;
            parentId?: string;
            replyToAuthor?: string;
          } | null = null;

          if (typeof l.new_value === "string") {
            try {
              val = JSON.parse(l.new_value);
            } catch {
              val = { note: l.new_value };
            }
          } else if (l.new_value && typeof l.new_value === "object") {
            val = l.new_value as unknown as typeof val;
          }

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
            parentId: val?.parentId ? String(val.parentId) : undefined,
            replyToAuthor: val?.replyToAuthor || undefined,
            createdAt: l.created_at
              ? new Date(l.created_at).toISOString()
              : new Date().toISOString(),
          };
        });

      const auditTrail: StaffAuditItem[] = (g.audit_logs || [])
        .filter((log) => {
          if (!isStaffRelevantAuditAction(log.action)) return false;

          let logVal: {
            details?: string;
            note?: string;
            author?: string;
            scope?: string;
            department_id?: string | number;
          } | null = null;
          if (typeof log.new_value === "string") {
            try {
              logVal = JSON.parse(log.new_value);
            } catch {
              logVal = { note: log.new_value };
            }
          } else if (log.new_value && typeof log.new_value === "object") {
            logVal = log.new_value as unknown as typeof logVal;
          }

          const isInternalAction =
            log.action === "HOD_DIRECTIVE_NOTE" ||
            log.action === "INVESTIGATION_NOTE_ADDED" ||
            log.action === "INTERNAL_NOTE_ADDED" ||
            log.action === "HEAD_DIRECTIVE_ISSUED" ||
            logVal?.scope === "INTERNAL";

          const isCollab =
            log.action === "COLLABORATION_NOTE_ADDED" ||
            logVal?.scope === "COLLABORATION";

          if (isCollab) {
            return true;
          }

          if (isInternalAction && !isAdmin && departmentId) {
            const authorDeptId =
              log.users?.department_id?.toString() ||
              (logVal?.department_id ? String(logVal.department_id) : null);
            if (authorDeptId && authorDeptId !== departmentId.toString()) {
              return false;
            }
          }
          return true;
        })
        .map((log) => {
          let logVal: {
            details?: string;
            note?: string;
            author?: string;
            who?: { name?: string; email?: string; role?: string };
            submittedBy?: string;
            staffName?: string;
            headName?: string;
            routed_by_email?: string;
            created_by?: string;
          } | null = null;

          if (typeof log.new_value === "string") {
            try {
              logVal = JSON.parse(log.new_value);
            } catch {
              logVal = { details: log.new_value };
            }
          } else if (log.new_value && typeof log.new_value === "object") {
            logVal = log.new_value as unknown as typeof logVal;
          }

          const user = log.users;
          const userRole = user?.roles?.role_name;
          let actorName = "System";
          if (user) {
            const rawName = `${user.first_name} ${user.last_name || ""}`.trim();
            if (userRole === "DEPARTMENT_HEAD") {
              actorName = `Department Head — ${rawName}`;
            } else if (userRole === "STAFF") {
              actorName = `Staff — ${rawName}`;
            } else if (userRole === "ADMIN") {
              actorName = `Admin — ${rawName}`;
            } else if (userRole === "END_USER") {
              actorName = `${rawName} (Complainant)`;
            } else {
              actorName = `${rawName} (${userRole || "User"})`;
            }
          } else {
            const authorFromVal =
              logVal?.who?.name ||
              logVal?.submittedBy ||
              logVal?.author ||
              logVal?.staffName ||
              logVal?.headName ||
              logVal?.routed_by_email ||
              logVal?.created_by;

            if (authorFromVal && typeof authorFromVal === "string") {
              actorName = authorFromVal;
            } else if (
              log.action.startsWith("GRIEVANCE_CREATED") ||
              log.action.startsWith("GRIEVANCE_SUBMITTED") ||
              log.action === "REWORK_REQUESTED" ||
              log.action === "REOPEN_REQUESTED" ||
              log.action === "USER_INFO_SUBMITTED" ||
              log.action === "USER_ADDITIONAL_INFO_PROVIDED" ||
              log.action === "ACCEPT_RESOLUTION"
            ) {
              const complainantName = g.users
                ? `${g.users.first_name} ${g.users.last_name || ""}`.trim()
                : "";
              actorName = complainantName
                ? `${complainantName} (Complainant)`
                : "Complainant";
            } else if (
              log.action.includes("SLA_") ||
              log.action.includes("AUTO_") ||
              log.action.includes("TIMER")
            ) {
              actorName = "System Automated";
            }
          }

          const details =
            logVal?.note ||
            logVal?.details ||
            formatAuditActionTitle(log.action);
          return {
            id: log.audit_log_id.toString(),
            action: formatAuditActionTitle(log.action),
            details,
            actor: actorName,
            timestamp: log.created_at
              ? new Date(log.created_at).toISOString()
              : new Date().toISOString(),
            relativeTime: formatRelativeTime(log.created_at),
            grievanceNumber: g.grievance_number,
          };
        });

      const supportingFindings: SupportingDepartmentFinding[] = (
        g.audit_logs || []
      )
        .filter((l) => {
          let val: Record<string, unknown> | null = null;
          if (typeof l.new_value === "string") {
            try {
              val = JSON.parse(l.new_value);
            } catch {
              val = null;
            }
          } else if (l.new_value && typeof l.new_value === "object") {
            val = l.new_value as Record<string, unknown>;
          }
          return (
            l.action === "SUPPORTING_FINDINGS_SUBMITTED" ||
            val?.isFindings === true ||
            String(val?.note || "").includes("[Department Findings")
          );
        })
        .slice()
        .reverse()
        .map((l) => {
          let val: Record<string, unknown> | null = null;
          if (typeof l.new_value === "string") {
            try {
              val = JSON.parse(l.new_value);
            } catch {
              val = null;
            }
          } else if (l.new_value && typeof l.new_value === "object") {
            val = l.new_value as Record<string, unknown>;
          }
          const u = l.users;
          const authorName = u
            ? `${u.first_name} ${u.last_name || ""}`.trim()
            : (val?.submittedBy as string) || "Staff Member";
          const deptName =
            (val?.department as string) ||
            (val?.departmentName as string) ||
            "Supporting Department";

          let findings = (val?.findings as string) || "";
          let actionTaken = (val?.actionTaken as string) || "";
          let notes = (val?.notes as string) || "";

          if (!findings && typeof val?.note === "string") {
            const noteStr = val.note;
            const findingsMatch = noteStr.match(
              /Findings:\s*([\s\S]*?)(?=\n\nAction Taken:|$)/,
            );
            const actionMatch = noteStr.match(
              /Action Taken:\s*([\s\S]*?)(?=\n\nNotes:|$)/,
            );
            const notesMatch = noteStr.match(/Notes:\s*([\s\S]*?)$/);
            if (findingsMatch) findings = findingsMatch[1].trim();
            if (actionMatch) actionTaken = actionMatch[1].trim();
            if (notesMatch) notes = notesMatch[1].trim();
            if (!findings) findings = noteStr;
          }

          const attList = Array.isArray(val?.attachments)
            ? (val.attachments as Array<{
                id: string;
                name: string;
                size?: string;
                type?: string;
                path: string;
                downloadUrl?: string;
              }>)
            : undefined;

          return {
            id: l.audit_log_id.toString(),
            departmentName: deptName,
            submittedBy: (val?.submittedBy as string) || authorName,
            findings,
            actionTaken: actionTaken || undefined,
            notes: notes || undefined,
            attachments: attList,
            createdAt: l.created_at
              ? new Date(l.created_at).toISOString()
              : new Date().toISOString(),
            timestamp: formatRelativeTime(l.created_at),
          };
        });

      const rawDepts = g.grievance_departments || [];
      const departmentsInvolved = rawDepts.map((gd) => {
        const activeAssignments = (gd.assignments || []).filter(
          (assign) =>
            assign.assignment_status === "ASSIGNED" ||
            assign.assignment_status === "CO_ASSIGNED" ||
            assign.assignment_status === "COMPLETED",
        );
        const primaryAssignment =
          activeAssignments.find(
            (assign) =>
              assign.assignment_role === "PRIMARY" &&
              assign.assignment_status === "ASSIGNED",
          ) ||
          activeAssignments.find(
            (assign) =>
              assign.assignment_status === "ASSIGNED" &&
              assign.assignment_role !== "SUPPORTING",
          ) ||
          activeAssignments.find(
            (assign) => assign.assignment_role === "PRIMARY",
          ) ||
          activeAssignments[0];
        const supportingAssignments = activeAssignments.filter(
          (assign) => assign !== primaryAssignment,
        );

        const staffUser = primaryAssignment?.users_assignments_staff_idTousers;
        const assignedStaff = staffUser
          ? `${staffUser.first_name} ${staffUser.last_name || ""}`.trim()
          : null;

        return {
          id: gd.grievance_department_id.toString(),
          departmentName:
            gd.departments?.department_name || "Unknown Department",
          involvementType:
            (gd.involvement_type as "PRIMARY" | "SUPPORTING" | "EQUAL") ||
            "PRIMARY",
          status: gd.status,
          assignedStaff,
          primaryStaff: staffUser
            ? {
                id: primaryAssignment.staff_id.toString(),
                name: `${staffUser.first_name} ${staffUser.last_name || ""}`.trim(),
              }
            : null,
          supportingStaff: supportingAssignments.map((sa) => {
            const su = sa.users_assignments_staff_idTousers;
            return {
              id: sa.staff_id.toString(),
              name: `${su.first_name} ${su.last_name || ""}`.trim(),
            };
          }),
          slaPercentAllocation: gd.sla_percent_allocation
            ? Number(gd.sla_percent_allocation)
            : null,
          allocatedDurationMinutes: gd.allocated_duration_minutes || null,
          executionOrder: gd.execution_order || 1,
          isMyAssignment:
            gd.grievance_department_id === a.grievance_department_id,
        };
      });

      const activeDept = rawDepts.find(
        (gd) =>
          gd.status === "IN_PROGRESS" ||
          gd.status === "ASSIGNED" ||
          gd.status === "PENDING_ASSIGNMENT",
      );
      const activeDepartmentName =
        activeDept?.departments?.department_name || undefined;

      const myDeptId = a.grievance_departments?.department_id || departmentId;
      const resolutionAuth = myDeptId
        ? canDepartmentSubmitFinalResolution(myDeptId, rawDepts)
        : {
            canResolve: isPrimaryOwner,
            canSubmitFindings: !(
              a.grievance_departments?.status === "COMPLETED" ||
              a.assignment_status === "COMPLETED"
            ),
            isFinalSequentialDept: false,
          };

      const isSupportingStaff =
        a.assignment_role === "SUPPORTING" ||
        a.assignment_status === "CO_ASSIGNED";
      const isPrimaryStaff =
        !isSupportingStaff && a.assignment_role === "PRIMARY";

      const canSubmitFinalResolution =
        !isSupportingStaff && (isAdmin || resolutionAuth.canResolve);
      const canSubmitFindings =
        !canSubmitFinalResolution && resolutionAuth.canSubmitFindings;
      const isFinalSequentialDepartment = resolutionAuth.isFinalSequentialDept;

      const latestExt = g.sla_extensions?.[0];
      const latestExtension = latestExt
        ? {
            id: latestExt.extension_id.toString(),
            status: latestExt.status as "PENDING" | "APPROVED" | "REJECTED",
            requestedMinutes: latestExt.requested_duration_minutes,
            grantedMinutes: latestExt.granted_duration_minutes,
            reason: latestExt.reason,
            createdAt: latestExt.created_at.toISOString(),
          }
        : null;

      const escThreshold = Number(
        g.sla_tracking?.[0]?.sla_policies?.escalation_threshold_percent || 75,
      );
      const isEscalatedByThreshold =
        (slaCalc.consumptionPercent >= escThreshold ||
          slaCalc.state === "BREACHED" ||
          g.status === "ESCALATED") &&
        g.status !== "CLOSED" &&
        g.status !== "RESOLVED" &&
        g.status !== "AWAITING_INFORMATION" &&
        g.status !== "WAITING_ON_USER" &&
        g.status !== "WAITING_ON_EMPLOYEE" &&
        !isMyDeptCompleted;

      return {
        id: g.grievance_id.toString(),
        grievanceNumber: g.grievance_number,
        title: g.title,
        description: g.description,
        category: g.categories?.category_name || "General",
        subcategory: g.subcategories?.subcategory_name || "General",
        priority: (g.priority?.toUpperCase() as StaffPriority) || "MEDIUM",
        status: (() => {
          if (g.status === "CLOSED") return "CLOSED";
          if (g.status === "RESOLVED") return "RESOLVED";
          if (
            g.status === "AWAITING_INFORMATION" ||
            g.status === "WAITING_ON_USER" ||
            g.status === "WAITING_ON_EMPLOYEE"
          ) {
            return "AWAITING_INFORMATION";
          }
          if (
            g.status === "RESOLUTION_PENDING_APPROVAL" ||
            g.status === "UNDER_REVIEW"
          ) {
            return "RESOLUTION_PENDING_APPROVAL";
          }
          if (g.status === "REWORK") return "REWORK";
          if (isMyDeptCompleted) return "RESOLVED";
          if (a.grievance_departments?.status === "ASSIGNED") return "ASSIGNED";
          if (a.grievance_departments?.status === "IN_PROGRESS")
            return "IN_PROGRESS";
          return g.status;
        })() as StaffGrievanceItem["status"],
        isEscalated: isEscalatedByThreshold,
        reopenCount: g.reopen_count || 0,
        manualReviewCount: g.manual_review_count || 0,
        slaStatus: slaCalc.state,
        slaConsumptionPercent: slaCalc.consumptionPercent,
        slaTimeLeft: slaCalc.timeRemaining,
        dueAt: g.due_at ? new Date(g.due_at).toISOString() : null,
        slaPercentAllocation: a.grievance_departments?.sla_percent_allocation
          ? Number(a.grievance_departments.sla_percent_allocation)
          : null,
        allocatedDurationMinutes: (() => {
          const isReworkCase =
            g.status === "REWORK" ||
            g.sla_tracking?.[0]?.cycle_type === "REWORK";
          const rawPolicyMins =
            g.sla_tracking?.[0]?.sla_policies?.target_duration_minutes;
          const effPolicyMins =
            rawPolicyMins && isReworkCase
              ? Math.max(1, Math.round(rawPolicyMins * 0.5))
              : rawPolicyMins;

          if (
            a.grievance_departments?.allocated_duration_minutes &&
            (!isReworkCase ||
              !effPolicyMins ||
              a.grievance_departments.allocated_duration_minutes <=
                effPolicyMins)
          ) {
            return a.grievance_departments.allocated_duration_minutes;
          }

          if (
            effPolicyMins &&
            a.grievance_departments?.sla_percent_allocation
          ) {
            return Math.round(
              (effPolicyMins *
                Number(a.grievance_departments.sla_percent_allocation)) /
                100,
            );
          }

          return a.grievance_departments?.allocated_duration_minutes || null;
        })(),
        warningThresholdPercent: Number(
          g.sla_tracking?.[0]?.sla_policies?.warning_threshold_percent || 50,
        ),
        escalationThresholdPercent: Number(
          g.sla_tracking?.[0]?.sla_policies?.escalation_threshold_percent || 75,
        ),
        targetDurationMinutes: (() => {
          const isReworkCase =
            g.status === "REWORK" ||
            g.sla_tracking?.[0]?.cycle_type === "REWORK";
          const rawPolicyMins =
            g.sla_tracking?.[0]?.sla_policies?.target_duration_minutes;
          return rawPolicyMins && isReworkCase
            ? Math.max(1, Math.round(rawPolicyMins * 0.5))
            : rawPolicyMins || null;
        })(),
        submittedAt: formatRelativeTime(g.created_at),
        assignedAt: formatRelativeTime(a.assigned_at),
        submitterName: submitterFullName,
        submitterEmail: submitter?.email || "",
        submitterRole: submitter?.roles?.role_name || "Employee",
        hasResolution: Boolean(latestResolution),
        hasProposedKb:
          (
            g.resolutions as unknown as Array<{
              knowledge_articles?: unknown[];
            }>
          )?.some((r) => (r.knowledge_articles?.length ?? 0) > 0) ?? false,
        submittedResolution,
        attachments,
        internalNotes,
        supportingFindings,
        auditTrail,
        departmentsInvolved,
        myInvolvementType,
        isPrimaryOwner,
        isPrimaryStaff,
        isSupportingStaff,
        myDepartmentStatus: a.grievance_departments?.status || "ASSIGNED",
        isMyDepartmentCompleted: isMyDeptCompleted,
        canSubmitFinalResolution,
        canSubmitFindings,
        isFinalSequentialDepartment,
        hasPendingSupportingDepartments:
          resolutionAuth.hasPendingSupporting ?? false,
        pendingSupportingDepartmentNames:
          resolutionAuth.pendingSupportingDeptNames ?? [],
        overallStatus: g.status,
        activeDepartmentName,
        latestExtension,
      };
    });

    // 5. Aggregate KPIs
    const isItemFinishedForMe = (item: StaffGrievanceItem) =>
      item.status === "CLOSED" ||
      item.status === "COMPLETED" ||
      item.isMyDepartmentCompleted;

    const activeGrievances = grievanceItems.filter(
      (item) => !isItemFinishedForMe(item),
    ).length;

    const slaAtRisk = grievanceItems.filter(
      (item) => item.slaStatus === "AT_RISK" && !isItemFinishedForMe(item),
    ).length;

    const slaBreached = grievanceItems.filter(
      (item) => item.slaStatus === "BREACHED" && !isItemFinishedForMe(item),
    ).length;

    const resolutionPending = grievanceItems.filter(
      (item) =>
        (item.status === "ASSIGNED" || item.status === "IN_PROGRESS") &&
        !item.hasResolution &&
        !isItemFinishedForMe(item),
    ).length;

    const reopenedCount = grievanceItems.filter(
      (item) =>
        (item.reopenCount > 0 || item.status === "REOPENED") &&
        !isItemFinishedForMe(item),
    ).length;

    const completedCount = grievanceItems.filter(
      (item) =>
        item.status === "CLOSED" ||
        item.status === "RESOLVED" ||
        item.status === "UNDER_REVIEW" ||
        item.status === "COMPLETED" ||
        item.isMyDepartmentCompleted,
    ).length;

    // 6. Attention Grievances (requiring immediate action: breached, at risk, critical, reopened)
    const attentionGrievances = grievanceItems
      .filter(
        (item) =>
          !isItemFinishedForMe(item) &&
          (item.slaStatus === "BREACHED" ||
            item.slaStatus === "AT_RISK" ||
            item.priority === "CRITICAL" ||
            item.reopenCount > 0 ||
            item.status === "REOPENED"),
      )
      .slice(0, 5);

    // 7. Recent Activity logs across all assigned grievances
    const allActivities: StaffAuditItem[] = [];
    for (const g of grievanceItems) {
      if (g.auditTrail) {
        allActivities.push(...g.auditTrail);
      }
    }
    const recentActivity = allActivities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 4);

    const staffFullName =
      `${staffUser.first_name} ${staffUser.last_name || ""}`.trim();
    const hodFullName = hodUser
      ? `${hodUser.first_name} ${hodUser.last_name || ""}`.trim()
      : null;

    // 8. Fetch all active categories taxonomy for comprehensive filtering
    const activeCategories = await prisma.categories.findMany({
      where: { status: "ACTIVE" },
      select: { category_name: true },
      orderBy: { category_name: "asc" },
    });
    const categoriesList = activeCategories.map((c) => c.category_name);

    const responsePayload: StaffDashboardData = {
      profile: {
        id: staffUser.user_id.toString(),
        name: staffFullName,
        email: staffUser.email,
        employeeCode: staffUser.employee_code,
        departmentName:
          staffUser.departments?.department_name || "General Redressal",
        departmentId: staffUser.department_id
          ? staffUser.department_id.toString()
          : undefined,
        roleName: "Staff Member",
        activeWorkload: activeGrievances,
        maxCapacity: 10,
        hodName: hodFullName,
        hodEmail: hodUser?.email || null,
      },
      stats: {
        activeGrievances,
        slaAtRisk,
        slaBreached,
        resolutionPending,
        reopenedCount,
        completedCount,
      },
      attentionGrievances,
      assignedGrievances: grievanceItems,
      recentActivity,
      categories: categoriesList,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Error in /api/staff/dashboard:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to load staff dashboard data";
    return NextResponse.json(
      {
        success: false,
        message: `Failed to load staff dashboard data: ${errorMessage}`,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
