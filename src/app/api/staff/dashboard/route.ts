import { NextResponse } from "next/server";
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
} from "@/types/staff";

export async function GET(request: Request) {
  const auth = await resolveStaffAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { staffId, departmentId, isAdmin } = auth;

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

    // Evaluate active grievances SLA thresholds
    try {
      const { evaluateAllActiveGrievancesSla } = await import(
        "@/lib/engines/sla-engine"
      );
      await evaluateAllActiveGrievancesSla(departmentId ?? undefined);
    } catch (slaErr) {
      console.error("SLA evaluation error in staff dashboard:", slaErr);
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
            attachments: true,
            resolutions: {
              orderBy: { submitted_at: "desc" as const },
              take: 5,
              include: {
                attachments: true,
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
                  },
                },
              },
            },
          },
        },
      },
    };

    // 3. Fetch active assignments for this staff member
    let assignments = await prisma.assignments.findMany({
      where: {
        staff_id: staffId,
        assignment_status: "ASSIGNED",
      },
      ...assignmentQuery,
      orderBy: { assigned_at: "desc" },
    });

    // If Admin or Department Head has no direct assignments, show department / system active assignments
    if (assignments.length === 0 && isAdmin) {
      assignments = await prisma.assignments.findMany({
        where: {
          assignment_status: "ASSIGNED",
          ...(departmentId
            ? { grievance_departments: { department_id: departmentId } }
            : {}),
        },
        take: 40,
        ...assignmentQuery,
        orderBy: { assigned_at: "desc" },
      });
    }

    // 4. Map grievances and calculate SLA
    const grievanceItems: StaffGrievanceItem[] = assignments.map((a) => {
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
      const isPrimaryOwner = myInvolvementType === "PRIMARY" || isAdmin;

      const slaCalc = calculateSlaStatus(g.created_at, g.due_at, g.sla_status);

      const latestResolution = g.resolutions?.[0];
      const latestReview = latestResolution?.resolution_reviews?.[0];
      let submittedResolution: StaffResolutionData | null = null;

      if (latestResolution) {
        submittedResolution = {
          id: latestResolution.resolution_id.toString(),
          problemSummary: latestResolution.problem_summary,
          findings: latestResolution.findings,
          actionTaken: latestResolution.action_taken,
          outcome: latestResolution.outcome,
          evidence: latestResolution.evidence,
          submittedAt: latestResolution.submitted_at.toISOString(),
          reviewStatus: latestReview?.decision as
            | "PENDING"
            | "ACCEPTED"
            | "REJECTED"
            | undefined,
          rejectionReason: latestReview?.rejection_reason || null,
          attachments: (latestResolution.attachments || []).map((att) => ({
            id: att.attachment_id.toString(),
            name: att.file_name,
            size: att.file_size
              ? `${Math.round(Number(att.file_size) / 1024)} KB`
              : "Document",
            type: att.file_type,
            path: att.file_path,
            uploadedAt: att.uploaded_at.toISOString(),
          })),
        };
      }

      const attachments = (g.attachments || [])
        .filter((att) => !att.resolution_id)
        .map((att) => ({
          id: att.attachment_id.toString(),
          name: att.file_name,
          size: att.file_size
            ? `${Math.round(Number(att.file_size) / 1024)} KB`
            : "Document",
          type: att.file_type,
          path: att.file_path,
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
          const val = l.new_value as {
            note?: string;
            details?: string;
            author?: string;
            role?: string;
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
          };
        });

      const auditTrail: StaffAuditItem[] = (g.audit_logs || [])
        .filter((log) => isStaffRelevantAuditAction(log.action))
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

          const logVal = log.new_value as {
            details?: string;
            note?: string;
            author?: string;
          } | null;
          const details =
            logVal?.note ||
            logVal?.details ||
            formatAuditActionTitle(log.action);
          return {
            id: log.audit_log_id.toString(),
            action: formatAuditActionTitle(log.action),
            details,
            actor: actorName,
            timestamp: log.created_at.toISOString(),
            relativeTime: formatRelativeTime(log.created_at),
            grievanceNumber: g.grievance_number,
          };
        });

      return {
        id: g.grievance_id.toString(),
        grievanceNumber: g.grievance_number,
        title: g.title,
        description: g.description,
        category: g.categories?.category_name || "General",
        subcategory: g.subcategories?.subcategory_name || "General",
        priority: (g.priority?.toUpperCase() as StaffPriority) || "MEDIUM",
        status: g.status as StaffGrievanceItem["status"],
        reopenCount: g.reopen_count || 0,
        manualReviewCount: g.manual_review_count || 0,
        slaStatus: slaCalc.state,
        slaConsumptionPercent: slaCalc.consumptionPercent,
        slaTimeLeft: slaCalc.timeRemaining,
        dueAt: g.due_at ? g.due_at.toISOString() : null,
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
        auditTrail,
        myInvolvementType,
        isPrimaryOwner,
        myDepartmentStatus: a.grievance_departments?.status || "ASSIGNED",
        isMyDepartmentCompleted: a.grievance_departments?.status === "COMPLETED",
      };
    });

    // 5. Aggregate KPIs
    const activeGrievances = grievanceItems.filter(
      (item) => item.status !== "CLOSED",
    ).length;

    const slaAtRisk = grievanceItems.filter(
      (item) => item.slaStatus === "AT_RISK" && item.status !== "CLOSED",
    ).length;

    const slaBreached = grievanceItems.filter(
      (item) => item.slaStatus === "BREACHED" && item.status !== "CLOSED",
    ).length;

    const resolutionPending = grievanceItems.filter(
      (item) =>
        (item.status === "ASSIGNED" || item.status === "IN_PROGRESS") &&
        !item.hasResolution,
    ).length;

    const reopenedCount = grievanceItems.filter(
      (item) => item.reopenCount > 0 || item.status === "REOPENED",
    ).length;

    const completedCount = grievanceItems.filter(
      (item) => item.status === "CLOSED" || item.status === "UNDER_REVIEW",
    ).length;

    // 6. Attention Grievances (requiring immediate action: breached, at risk, critical, reopened)
    const attentionGrievances = grievanceItems
      .filter(
        (item) =>
          item.status !== "CLOSED" &&
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
    return NextResponse.json(
      { success: false, message: "Failed to load staff dashboard data" },
      { status: 500 },
    );
  }
}
