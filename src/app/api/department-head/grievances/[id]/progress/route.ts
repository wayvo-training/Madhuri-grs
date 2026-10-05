import { NextResponse } from "next/server";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import { prisma } from "@/lib/prisma";

function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const now = new Date();
  const d = new Date(date);
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatFullDateTime(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await resolveDepartmentHeadAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { departmentId, isAdmin } = auth;
  const { id } = await params;

  try {
    const grievanceId = BigInt(id);

    // Fetch grievance with related assignment, category, audit logs, and status history
    const grievance = await prisma.grievances.findUnique({
      where: { grievance_id: grievanceId },
      include: {
        categories: true,
        subcategories: true,
        users: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
            roles: true,
          },
        },

        assignments: {
          where: { assignment_status: { in: ["ASSIGNED", "COMPLETED"] } },
          orderBy: { assigned_at: "desc" },
          include: {
            users_assignments_staff_idTousers: {
              select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
                status: true,
                roles: true,
              },
            },
          },
          take: 1,
        },
        audit_logs: {
          orderBy: { created_at: "desc" },
          include: {
            users: {
              select: {
                user_id: true,
                first_name: true,
                last_name: true,
                roles: true,
              },
            },
          },
        },
        grievance_status_history: {
          orderBy: { changed_at: "desc" },
          include: {
            users: {
              select: {
                user_id: true,
                first_name: true,
                last_name: true,
                roles: true,
              },
            },
          },
        },
        attachments: true,
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
      },
    });

    if (!grievance) {
      return NextResponse.json(
        { success: false, message: "Grievance not found" },
        { status: 404 },
      );
    }

    // Fetch involved departments dynamically
    const rawDepartments = await prisma.grievance_departments.findMany({
      where: { grievance_id: grievanceId },
      include: {
        departments: true,
      },
      orderBy: { involvement_type: "asc" },
    });

    // Fetch all assignments directly from assignments table so staff names persist whether status is ASSIGNED or COMPLETED
    const allDeptAssignments = await prisma.assignments.findMany({
      where: {
        grievance_id: grievanceId,
        assignment_status: { in: ["ASSIGNED", "COMPLETED"] },
      },
      include: {
        users_assignments_staff_idTousers: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
            status: true,
            roles: true,
          },
        },
      },
      orderBy: { assigned_at: "desc" },
    });

    // Security check: belongs to head's department unless admin preview
    if (!isAdmin && departmentId) {
      const belongs = rawDepartments.some(
        (d) => d.department_id === departmentId,
      );
      if (!belongs) {
        return NextResponse.json(
          { success: false, message: "Grievance not in department scope" },
          { status: 403 },
        );
      }
    }

    const departmentsInvolved = rawDepartments.map((rawD) => {
      const d = rawD;
      const deptAssignment = allDeptAssignments.find(
        (a) => a.grievance_department_id === d.grievance_department_id,
      );
      const staffUser = deptAssignment?.users_assignments_staff_idTousers;
      const assignedStaff = staffUser
        ? `${staffUser.first_name} ${staffUser.last_name || ""}`.trim()
        : null;

      return {
        id: d.grievance_department_id.toString(),
        departmentName: d.departments?.department_name || "Unknown Department",
        involvementType: d.involvement_type as
          | "PRIMARY"
          | "SUPPORTING"
          | "EQUAL",
        status: d.status,
        assignedStaff,
      };
    });

    // 1. Assignment details
    const myDeptRecord = rawDepartments.find(
      (d) => d.department_id === departmentId,
    );
    const primaryAssignment =
      (myDeptRecord
        ? allDeptAssignments.find(
            (a) =>
              a.grievance_department_id ===
              myDeptRecord.grievance_department_id,
          )
        : null) ||
      allDeptAssignments[0] ||
      grievance.assignments?.[0];

    const assignedUser = primaryAssignment?.users_assignments_staff_idTousers;
    const assignment = {
      isAssigned: !!assignedUser,
      staffId: assignedUser ? assignedUser.user_id.toString() : null,
      staffName: assignedUser
        ? `${assignedUser.first_name} ${assignedUser.last_name || ""}`.trim()
        : "Unassigned",
      designation: assignedUser?.roles?.role_name || "Investigating Officer",
      email: assignedUser?.email || null,
      assignedAt: primaryAssignment?.assigned_at
        ? formatFullDateTime(primaryAssignment.assigned_at)
        : null,
      assignedAtRelative: primaryAssignment?.assigned_at
        ? formatRelativeTime(primaryAssignment.assigned_at)
        : null,
      status: primaryAssignment?.assignment_status || "PENDING",
    };

    // 2. SLA calculations
    const now = new Date();
    const createdAt = new Date(grievance.created_at);
    const dueAt = grievance.due_at ? new Date(grievance.due_at) : null;
    let consumptionPercent = 0;
    let timeRemainingStr = "N/A";
    let isBreached = false;
    let isApproaching = false;

    if (dueAt) {
      const totalDuration = dueAt.getTime() - createdAt.getTime();
      const elapsedDuration = now.getTime() - createdAt.getTime();
      if (totalDuration > 0) {
        consumptionPercent = Math.min(
          Math.max(Math.round((elapsedDuration / totalDuration) * 100), 0),
          100,
        );
      }
      if (now > dueAt) {
        isBreached = true;
        const diffMs = now.getTime() - dueAt.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
        timeRemainingStr =
          diffDays > 0
            ? `Breached ${diffDays}d ago`
            : `Breached ${diffHours}h ago`;
      } else {
        const diffMs = dueAt.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs / (1000 * 60)) % 60);
        timeRemainingStr = `${diffHours}h ${diffMins}m remaining`;
        if (consumptionPercent >= 75) {
          isApproaching = true;
        }
      }
    }

    const sla = {
      consumptionPercent,
      timeRemaining: timeRemainingStr,
      dueAt: dueAt ? formatFullDateTime(dueAt) : "No Target Set",
      state: isBreached
        ? "BREACHED"
        : isApproaching || grievance.sla_status === "AT_RISK"
          ? "SLA_AT_RISK"
          : "ON_TRACK",
      stateLabel: isBreached
        ? "SLA Breached"
        : isApproaching || grievance.sla_status === "AT_RISK"
          ? "SLA At Risk"
          : "Within SLA",
    };

    // 3. Current Stage & Stepper
    let currentStageKey = "SUBMITTED";
    let currentStageLabel = "Grievance Registered";
    let currentStageNumber = 1;

    const st = grievance.status;
    const hasAssignedOfficer = !!assignedUser;
    const isReopened =
      (grievance.reopen_count || 0) > 0 ||
      st === "REOPENED" ||
      st === "REOPEN_REVIEW";

    if (st === "CLOSED" || st === "RESOLVED") {
      currentStageKey = "CLOSED";
      currentStageLabel = "Grievance Closed";
      currentStageNumber = 4;
    } else if (st === "UNDER_REVIEW") {
      currentStageKey = "RESOLUTION_SUBMITTED";
      currentStageLabel = "Resolution Submitted — Pending HOD Approval";
      currentStageNumber = 4;
    } else if (st === "AWAITING_USER_RESPONSE") {
      currentStageKey = "AWAITING_USER_RESPONSE";
      currentStageLabel = "Awaiting Complainant Response";
      currentStageNumber = 3;
    } else if (
      st === "IN_PROGRESS" ||
      st === "INVESTIGATING" ||
      st === "ESCALATED" ||
      st === "REOPENED" ||
      st === "REOPEN_REVIEW"
    ) {
      currentStageKey = "INVESTIGATION";
      currentStageLabel =
        st === "ESCALATED"
          ? isReopened
            ? "Reopened — Escalated for Intervention"
            : "Under Active Investigation (Escalated)"
          : isReopened
            ? "Reopened — Under Active Investigation"
            : "Under Active Investigation";
      currentStageNumber = 3;
    } else if (
      st === "ASSIGNED" ||
      (hasAssignedOfficer && (st === "ROUTED" || st === "SUBMITTED"))
    ) {
      currentStageKey = "ASSIGNED";
      const officerName = assignedUser
        ? `${assignedUser.first_name} ${assignedUser.last_name || ""}`.trim()
        : "Investigating Officer";
      currentStageLabel = isReopened
        ? `Reopened — Assigned to ${officerName}`
        : `Assigned to ${officerName}`;
      currentStageNumber = 2;
    } else {
      currentStageKey = "SUBMITTED";
      currentStageLabel =
        st === "ROUTED"
          ? "Pending Staff Assignment"
          : isReopened
            ? "Reopened — Pending Assignment"
            : "Grievance Registered";
      currentStageNumber = 1;
    }

    const progressSteps = [
      {
        key: "SUBMITTED",
        label: "Submitted",
        isComplete: true,
        isCurrent: currentStageNumber === 1,
      },
      {
        key: "ASSIGNED",
        label: "Assigned",
        isComplete: currentStageNumber >= 2,
        isCurrent: currentStageNumber === 2,
      },
      {
        key: "INVESTIGATION",
        label: "Investigation",
        isComplete: currentStageNumber >= 3,
        isCurrent: currentStageNumber === 3,
      },
      {
        key: "RESOLUTION",
        label:
          st === "AWAITING_USER_RESPONSE"
            ? "Awaiting Response"
            : st === "CLOSED" || st === "RESOLVED"
              ? "Grievance Closed"
              : "Resolution Review",
        isComplete: currentStageNumber >= 4,
        isCurrent: currentStageNumber === 4,
      },
    ];

    // 4. Activity Timeline
    // biome-ignore lint/suspicious/noExplicitAny: complex prisma type
    const timeline = (grievance.audit_logs || []).map((log: any) => {
      const user = log.users;
      const actorRole = user?.roles?.role_name || "System";

      let val: Record<string, unknown> = {};
      if (typeof log.new_value === "string") {
        try {
          val = JSON.parse(log.new_value);
        } catch {
          val = { details: log.new_value };
        }
      } else if (log.new_value && typeof log.new_value === "object") {
        val = log.new_value as Record<string, unknown>;
      }

      let title = log.action
        .toLowerCase()
        .split("_")
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      let description =
        (val.details as string) ||
        (val.note as string) ||
        (val.remarks as string) ||
        (val.outcome as string) ||
        "";

      // Professional formatting
      const act = log.action.toUpperCase();
      if (act.includes("ASSIGN")) {
        title = "Grievance Assigned";
        description = val.details
          ? String(val.details)
          : `Assigned to ${assignment.staffName}`;
      } else if (act.includes("HOD_INTERVENTION")) {
        title = "Department Head Intervention";
      } else if (
        act === "HOD_DIRECTIVE_NOTE" ||
        act === "HEAD_DIRECTIVE_ISSUED"
      ) {
        title = "Internal Note";
        description =
          (val.note as string) ||
          (val.details as string) ||
          "Department Head internal note.";
      } else if (
        act === "INVESTIGATION_NOTE_ADDED" ||
        act === "INTERNAL_NOTE_ADDED"
      ) {
        title = "Investigation Note";
        description =
          (val.note as string) ||
          (val.details as string) ||
          "Staff investigation note.";
      } else if (act.includes("ACCEPT_RESOLUTION") || act.includes("APPROVE")) {
        title = "Resolution Approved & Case Closed";
      } else if (act.includes("REJECT_RESOLUTION") || act.includes("REOPEN")) {
        title = "Resolution Rejected — Grievance Reopened";
        description =
          (val.reason as string) ||
          (val.details as string) ||
          "Previous resolution was rejected and case reopened for re-investigation.";
      } else if (act.includes("SUBMIT_RESOLUTION")) {
        title = "Resolution Findings Submitted";
      } else if (act.includes("SLA_100") || act.includes("BREACH")) {
        title = "SLA Deadline Breached (Escalated)";
        description =
          (val.details as string) ||
          "SLA resolution deadline elapsed without resolution.";
      } else if (act.includes("SLA_75") || act.includes("AT_RISK")) {
        title = "SLA 75% Warning (Head Review Required)";
        description =
          (val.note as string) ||
          (val.details as string) ||
          "Automated SLA threshold warning: Case approached 75% elapsed SLA.";
      } else if (act.includes("APPEAL_PANEL")) {
        title = "Appeal Review Panel Convened";
        description =
          (val.details as string) || "Independent evaluation panel convened.";
      } else if (
        act.includes("CONTRIBUTION_AUDIT") ||
        act.includes("AUDIT_VERIFIED")
      ) {
        title = "Deliverables Audit Verified";
        description =
          (val.details as string) || "Audit verification conducted.";
      } else if (act.includes("SCORECARD")) {
        title = "Scorecard Rating Recomputed";
        description =
          (val.details as string) || "Evaluation rating recomputed.";
      } else if (act.includes("ROUTE")) {
        title = "Department Routing";
        description =
          (val.details as string) ||
          "Grievance triaged and routed into department queue.";
      } else if (act.includes("CREATE") || act.includes("SUBMIT")) {
        title = "Grievance Submitted";
        description =
          (val.details as string) ||
          `Submitted by ${grievance.users?.first_name || ""} ${grievance.users?.last_name || ""}`.trim();
      }

      let actor = "System";
      if (user) {
        const rawName = `${user.first_name} ${user.last_name || ""}`.trim();
        if (actorRole === "DEPARTMENT_HEAD") {
          actor = `Department Head — ${rawName}`;
        } else if (actorRole === "STAFF") {
          actor = `Staff — ${rawName}`;
        } else {
          actor = `${rawName} (${actorRole})`;
        }
      }

      return {
        id: log.audit_log_id.toString(),
        timestamp: formatFullDateTime(log.created_at),
        relativeTime: formatRelativeTime(log.created_at),
        title,
        description:
          description || "Action recorded in grievance governance trail.",
        actor,
      };
    });

    // Extract internal notes (chronological: oldest to newest)
    const internalNotes = (grievance.audit_logs || [])
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
        let val: Record<string, unknown> = {};
        if (typeof l.new_value === "string") {
          try {
            val = JSON.parse(l.new_value);
          } catch {
            val = { note: l.new_value };
          }
        } else if (l.new_value && typeof l.new_value === "object") {
          val = l.new_value as Record<string, unknown>;
        }

        const roleDisplay =
          (val?.role as string) ||
          (userRole === "DEPARTMENT_HEAD"
            ? "Department Head"
            : userRole === "STAFF"
              ? "Staff"
              : userRole || "Staff");

        const rawName = user
          ? `${user.first_name} ${user.last_name || ""}`.trim()
          : "User";

        const authorDisplay =
          (val?.author as string) ||
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
          note:
            (val?.note as string) ||
            (val?.details as string) ||
            String(l.new_value || ""),
          parentId: (val?.parentId as string) || undefined,
          replyToAuthor: (val?.replyToAuthor as string) || undefined,
          createdAt: l.created_at.toISOString(),
        };
      });

    // 5. Latest Activity
    const latestEvent = timeline[0] || null;
    const latestActivity = latestEvent
      ? `${latestEvent.title} · ${latestEvent.relativeTime}`
      : "Grievance registered";

    return NextResponse.json({
      success: true,
      data: {
        grievance: {
          id: grievance.grievance_id.toString(),
          ticketCode: grievance.grievance_number,
          title: grievance.title,
          description: grievance.description,
          category: grievance.categories?.category_name || "General",
          subcategory: grievance.subcategories?.subcategory_name || "General",
          priority: grievance.priority,
          status: grievance.status,
          createdAt: formatFullDateTime(grievance.created_at),
          submitterName:
            `${grievance.users?.first_name || ""} ${grievance.users?.last_name || ""}`.trim() ||
            "Complainant",
          submitterEmail: grievance.users?.email || "N/A",
          submitterRole: grievance.users?.roles?.role_name || "END_USER",
          // biome-ignore lint/suspicious/noExplicitAny: complex prisma type
          attachments: (grievance.attachments || []).map((a: any) => ({
            id: a.attachment_id.toString(),
            name: a.file_name,
            size: a.file_size
              ? `${Math.round(Number(a.file_size) / 1024)} KB`
              : "N/A",
            type: a.file_type || "Document",
            path: a.file_path,
            uploadedAt: formatFullDateTime(a.uploaded_at),
          })),
          internalNotes,
          submittedResolution: grievance.resolutions?.[0]
            ? {
                id: grievance.resolutions[0].resolution_id.toString(),
                submittedByUserId:
                  grievance.resolutions[0].submitted_by.toString(),
                submittedByRole:
                  (
                    grievance.resolutions[0] as unknown as {
                      users?: { roles?: { role_name?: string } };
                    }
                  ).users?.roles?.role_name || null,
                staffName:
                  `${(grievance.resolutions[0] as unknown as { users?: { first_name?: string; last_name?: string } }).users?.first_name || ""} ${(grievance.resolutions[0] as unknown as { users?: { first_name?: string; last_name?: string } }).users?.last_name || ""}`.trim(),
                problemSummary: grievance.resolutions[0].problem_summary,
                actionTaken: grievance.resolutions[0].action_taken,
                findings: grievance.resolutions[0].findings,
                outcome: grievance.resolutions[0].outcome,
                note:
                  grievance.resolutions[0].action_taken ||
                  grievance.resolutions[0].problem_summary,
                submittedAt: formatRelativeTime(
                  grievance.resolutions[0].submitted_at,
                ),
              }
            : null,
          hasProposedKb:
            ((
              grievance.resolutions?.[0] as unknown as {
                knowledge_articles?: unknown[];
              }
            )?.knowledge_articles?.length ?? 0) > 0,
        },
        currentStage: {
          key: currentStageKey,
          label: currentStageLabel,
          stageNumber: currentStageNumber,
          progressSteps,
        },
        assignment,
        sla,
        latestActivity,
        timeline,
        internalNotes,
        departmentsInvolved,
      },
    });
  } catch (error) {
    console.error("Error fetching grievance progress:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
