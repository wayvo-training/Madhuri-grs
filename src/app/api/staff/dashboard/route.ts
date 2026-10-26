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
              },
            },
            attachments: true,
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
          },
        },
      },
    };

    // 3. Fetch active and completed assignments for this staff member
    let assignments = await prisma.assignments.findMany({
      where: {
        staff_id: staffId,
        assignment_status: { in: ["ASSIGNED", "COMPLETED"] },
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

      let slaCalc: ReturnType<typeof calculateSlaStatus>;
      if (a.grievance_departments?.status === "BLOCKED") {
        slaCalc = {
          consumptionPercent: 0,
          timeRemaining: "Pending Prerequisites",
          state: "ON_TRACK",
          stateLabel: "Blocked",
        };
      } else {
        const deptStart =
          a.grievance_departments?.activated_at ||
          a.grievance_departments?.assigned_at ||
          g.created_at;
        const deptDue = a.grievance_departments?.due_at || g.due_at;
        const deptSlaStatus =
          a.grievance_departments?.sla_status || g.sla_status;
        slaCalc = calculateSlaStatus(deptStart, deptDue, deptSlaStatus);
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
          const user = log.users;
          const userRole = user?.roles?.role_name;
          let actorName = "System";
          if (user) {
            const rawName = `${user.first_name} ${user.last_name || ""}`.trim();
            if (userRole === "DEPARTMENT_HEAD") {
              actorName = `Department Head — ${rawName}`;
            } else if (userRole === "STAFF") {
              actorName = `Staff — ${rawName}`;
            } else {
              actorName = rawName;
            }
          }

          let logVal: {
            details?: string;
            note?: string;
            author?: string;
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
      const departmentsInvolved = rawDepts.map((d) => ({
        id: d.grievance_department_id.toString(),
        departmentName: d.departments?.department_name || "Unknown Department",
        involvementType:
          (d.involvement_type as "PRIMARY" | "SUPPORTING" | "EQUAL") ||
          "PRIMARY",
        status: d.status,
        slaPercentAllocation: d.sla_percent_allocation
          ? Number(d.sla_percent_allocation)
          : null,
        allocatedDurationMinutes: d.allocated_duration_minutes || null,
        executionOrder: d.execution_order || 1,
        isMyAssignment: a.grievance_department_id === d.grievance_department_id,
      }));

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

      const isMyDeptCompleted =
        a.grievance_departments?.status === "COMPLETED" ||
        a.assignment_status === "COMPLETED";

      const canSubmitFinalResolution = isAdmin || resolutionAuth.canResolve;
      const canSubmitFindings =
        !canSubmitFinalResolution && resolutionAuth.canSubmitFindings;
      const isFinalSequentialDepartment = resolutionAuth.isFinalSequentialDept;

      return {
        id: g.grievance_id.toString(),
        grievanceNumber: g.grievance_number,
        title: g.title,
        description: g.description,
        category: g.categories?.category_name || "General",
        subcategory: g.subcategories?.subcategory_name || "General",
        priority: (g.priority?.toUpperCase() as StaffPriority) || "MEDIUM",
        status: (g.status === "CLOSED"
          ? "CLOSED"
          : g.status === "RESOLVED"
            ? "RESOLVED"
            : isMyDeptCompleted
              ? "COMPLETED"
              : a.grievance_departments?.status === "ASSIGNED"
                ? "ASSIGNED"
                : a.grievance_departments?.status === "IN_PROGRESS"
                  ? "IN_PROGRESS"
                  : g.status) as StaffGrievanceItem["status"],
        reopenCount: g.reopen_count || 0,
        manualReviewCount: g.manual_review_count || 0,
        slaStatus: slaCalc.state,
        slaConsumptionPercent: slaCalc.consumptionPercent,
        slaTimeLeft: slaCalc.timeRemaining,
        dueAt: g.due_at ? new Date(g.due_at).toISOString() : null,
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
        myDepartmentStatus: a.grievance_departments?.status || "ASSIGNED",
        isMyDepartmentCompleted: isMyDeptCompleted,
        canSubmitFinalResolution,
        canSubmitFindings,
        isFinalSequentialDepartment,
        overallStatus: g.status,
        activeDepartmentName,
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
