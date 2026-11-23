import { NextResponse } from "next/server";
import { filterAuthorizedAttachments } from "@/lib/attachments/access-control";
import { DEFAULT_SLA_THRESHOLDS } from "@/lib/constants/sla";
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

  const { user, departmentId, isAdmin } = auth;
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
          orderBy: { assigned_at: "asc" },
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
                department_id: true,
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
        grievance_departments: {
          include: {
            departments: true,
          },
        },
        attachments: {
          include: {
            attachment_department_grants: true,
          },
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
            attachments: true,
          },
        },
        sla_tracking: {
          orderBy: { sla_tracking_id: "desc" },
          take: 1,
          include: {
            sla_pause_logs: true,
          },
        },
        sla_extensions: {
          orderBy: { extension_id: "desc" },
          take: 1,
          include: {
            users_requested_by: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        staff_investigation_findings: {
          include: {
            users: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
              },
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

    // Proactively evaluate SLA threshold notifications only when grievance is active and not paused
    if (
      grievance.status !== "CLOSED" &&
      grievance.status !== "RESOLVED" &&
      grievance.status !== "AWAITING_INFORMATION" &&
      grievance.status !== "WAITING_ON_USER"
    ) {
      try {
        const { evaluateGrievanceSla } = await import(
          "@/lib/engines/sla-engine"
        );
        await evaluateGrievanceSla(grievanceId);
      } catch (slaErr) {
        console.error("SLA evaluation error in progress route:", slaErr);
      }
    }

    // Fetch involved departments dynamically
    const rawDepartments = await prisma.grievance_departments.findMany({
      where: { grievance_id: grievanceId },
      include: {
        departments: true,
      },
      orderBy: { involvement_type: "asc" },
    });

    // Fetch all assignments directly from assignments table so staff names persist whether status is ASSIGNED, CO_ASSIGNED, or COMPLETED
    const allDeptAssignments = await prisma.assignments.findMany({
      where: {
        grievance_id: grievanceId,
        assignment_status: { in: ["ASSIGNED", "CO_ASSIGNED", "COMPLETED"] },
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
      orderBy: { assigned_at: "asc" },
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

    const now = new Date();
    const activeSla = grievance.sla_tracking?.[0];

    const isPaused = Boolean(
      activeSla?.paused_at ||
        grievance.status === "AWAITING_INFORMATION" ||
        grievance.status === "WAITING_ON_USER" ||
        grievance.status === "WAITING_ON_EMPLOYEE" ||
        grievance.status === "RESOLUTION_PENDING_APPROVAL" ||
        grievance.status === "UNDER_REVIEW" ||
        grievance.status === "RESOLVED",
    );
    const effectiveNow = isPaused
      ? activeSla?.paused_at
        ? new Date(activeSla.paused_at)
        : now
      : now;

    // Fetch active SLA policy for dynamic thresholds
    const activeSlaPolicy = await prisma.sla_policies.findFirst({
      where: {
        priority_level: grievance.priority,
        status: "ACTIVE",
        sla_type: "RESOLUTION",
      },
      orderBy: { updated_at: "desc" },
    });
    const warningThreshold = Number(
      activeSlaPolicy?.warning_threshold_percent ||
        DEFAULT_SLA_THRESHOLDS.WARNING_PERCENT,
    );
    const escalationThreshold = Number(
      activeSlaPolicy?.escalation_threshold_percent ||
        DEFAULT_SLA_THRESHOLDS.AT_RISK_PERCENT,
    );

    // Lifecycle scoping: Interventions from previous cycles (before latest REOPEN_APPROVED, REWORK_APPROVED, or CLOSED)
    // belong to closed/historical cycles and must not bleed into the current active cycle.
    const latestLifecycleReset = (grievance.audit_logs || []).find(
      (l) =>
        l.action === "REOPEN_APPROVED" ||
        l.action === "REWORK_APPROVED" ||
        l.action === "CLOSED",
    );
    const currentCycleStart = latestLifecycleReset
      ? new Date(latestLifecycleReset.created_at).getTime()
      : 0;

    const earlyInterventionLog = (grievance.audit_logs || []).find((l) => {
      if (
        l.action !== "HOD_INTERVENTION_TAKEN" &&
        !l.action.includes("INTERVENTION")
      ) {
        return false;
      }
      if (
        currentCycleStart > 0 &&
        new Date(l.created_at).getTime() < currentCycleStart - 1000
      ) {
        return false;
      }
      return true;
    });
    const ivRawStr = earlyInterventionLog?.new_value
      ? typeof earlyInterventionLog.new_value === "string"
        ? earlyInterventionLog.new_value
        : JSON.stringify(earlyInterventionLog.new_value)
      : "";
    const assistedStaffMatch = ivRawStr.match(/to assist ([^(",\n]+)/);
    const assistedStaffName = assistedStaffMatch?.[1]?.trim();

    const departmentsInvolved = rawDepartments.map((rawD) => {
      const d = rawD;
      const deptAssignments = allDeptAssignments.filter(
        (a) => a.grievance_department_id === d.grievance_department_id,
      );
      const activeAssignments = deptAssignments.filter(
        (a) =>
          a.assignment_status === "ASSIGNED" ||
          a.assignment_status === "CO_ASSIGNED" ||
          a.assignment_status === "COMPLETED",
      );
      const isInterventionForThisDept = Boolean(
        assistedStaffName &&
          ivRawStr &&
          (d.departments?.department_name
            ? ivRawStr
                .toLowerCase()
                .includes(d.departments.department_name.toLowerCase())
            : false),
      );

      const primaryAssignment =
        (isInterventionForThisDept && assistedStaffName
          ? activeAssignments.find((a) => {
              const su = a.users_assignments_staff_idTousers;
              const name = `${su?.first_name} ${su?.last_name || ""}`.trim();
              return name.toLowerCase() === assistedStaffName.toLowerCase();
            })
          : null) ||
        activeAssignments.find(
          (a) =>
            a.assignment_role === "PRIMARY" &&
            a.assignment_status === "ASSIGNED",
        ) ||
        activeAssignments.find(
          (a) =>
            a.assignment_status === "ASSIGNED" &&
            a.assignment_role !== "SUPPORTING",
        ) ||
        activeAssignments.find((a) => a.assignment_role === "PRIMARY") ||
        activeAssignments[0] ||
        deptAssignments.find((a) => a.assignment_role === "PRIMARY") ||
        deptAssignments.find((a) => a.assignment_status === "COMPLETED") ||
        deptAssignments[0];
      const supportingAssignments = activeAssignments.filter(
        (a) => a !== primaryAssignment,
      );

      let deptStatus = d.status;
      if (
        primaryAssignment &&
        (primaryAssignment.assignment_status === "ASSIGNED" ||
          primaryAssignment.assignment_status === "CO_ASSIGNED")
      ) {
        if (deptStatus === "PENDING_ASSIGNMENT") {
          deptStatus = "ASSIGNED";
        }
      } else if (!primaryAssignment && deptStatus === "ASSIGNED") {
        deptStatus = "PENDING_ASSIGNMENT";
      }

      const staffUser = primaryAssignment?.users_assignments_staff_idTousers;
      let assignedStaff =
        deptStatus === "PENDING_ASSIGNMENT" ||
        !primaryAssignment ||
        (primaryAssignment.assignment_status !== "ASSIGNED" &&
          primaryAssignment.assignment_status !== "CO_ASSIGNED" &&
          primaryAssignment.assignment_status !== "COMPLETED")
          ? null
          : staffUser
            ? `${staffUser.first_name} ${staffUser.last_name || ""}`.trim()
            : null;

      // Fallback: If findings are submitted or department is completed, resolve author from findings or audit logs
      if (
        !assignedStaff &&
        (deptStatus === "COMPLETED" || d.status === "COMPLETED")
      ) {
        const findingAuthor = (
          grievance.staff_investigation_findings || []
        ).find(
          (sf) => sf.grievance_department_id === d.grievance_department_id,
        )?.users;
        if (findingAuthor) {
          assignedStaff =
            `${findingAuthor.first_name} ${findingAuthor.last_name || ""}`.trim();
        } else {
          const deptFindingLog = (grievance.audit_logs || []).find((l) => {
            const val = l.new_value as {
              department_id?: string | number;
              details?: string;
              note?: string;
            } | null;
            return (
              ((val?.department_id &&
                String(val.department_id) === String(d.department_id)) ||
                String(val?.details || val?.note || "").includes(
                  d.departments?.department_name || "",
                )) &&
              (l.action.includes("FINDING") || l.action.includes("SUBMITTED"))
            );
          });
          if (deptFindingLog?.users) {
            assignedStaff =
              `${deptFindingLog.users.first_name} ${deptFindingLog.users.last_name || ""}`.trim();
          }
        }
      }

      const primaryStaff = staffUser
        ? {
            id: staffUser.user_id.toString(),
            name: `${staffUser.first_name} ${staffUser.last_name || ""}`.trim(),
          }
        : null;

      const supportingStaff = supportingAssignments
        .map((sa) => {
          const su = sa.users_assignments_staff_idTousers;
          return su
            ? {
                id: su.user_id.toString(),
                name: `${su.first_name} ${su.last_name || ""}`.trim(),
              }
            : null;
        })
        .filter((s): s is { id: string; name: string } => Boolean(s));

      // Calculate individual SLA metrics for this department
      const dIsBlocked = deptStatus === "BLOCKED";
      const dIsCompleted = deptStatus === "COMPLETED";
      const dActivatedAt = d.activated_at
        ? new Date(d.activated_at)
        : d.assigned_at
          ? new Date(d.assigned_at)
          : null;
      const dDueAt = d.due_at ? new Date(d.due_at) : null;
      const dCompletedAt = d.completed_at ? new Date(d.completed_at) : null;
      const dAllocatedMins =
        d.allocated_duration_minutes ||
        (dDueAt && dActivatedAt
          ? Math.max(
              1,
              Math.round((dDueAt.getTime() - dActivatedAt.getTime()) / 60000),
            )
          : 60);

      // Determine pause duration strictly scoped to this department's activation window
      const startTime =
        dActivatedAt ||
        (grievance.created_at ? new Date(grievance.created_at) : now);

      let deptPauseMs = 0;
      if (activeSla?.sla_pause_logs && activeSla.sla_pause_logs.length > 0) {
        deptPauseMs = activeSla.sla_pause_logs
          .filter(
            (l) =>
              (l.paused_at && new Date(l.paused_at) >= startTime) ||
              (l.resumed_at && new Date(l.resumed_at) > startTime),
          )
          .reduce((sum, l) => sum + (l.duration_minutes || 0) * 60 * 1000, 0);
      } else if (
        rawDepartments.length <= 1 ||
        d.involvement_type === "PRIMARY"
      ) {
        deptPauseMs = Math.max(
          0,
          (activeSla?.accumulated_paused_minutes || 0) * 60 * 1000,
        );
      }

      let dConsumptionPercent = 0;
      let dTimeRemaining = dIsBlocked ? "Pending Prerequisite" : "N/A";
      let dSlaState = "ON_TRACK";
      let dSlaStateLabel = "Within SLA";

      if (dIsBlocked) {
        dSlaState = "BLOCKED";
        dSlaStateLabel = "Waiting for Prerequisite";
        dTimeRemaining = "Pending Prerequisite";
      } else if (dIsCompleted) {
        const completedTime = dCompletedAt || now;
        if (dDueAt && dActivatedAt) {
          const totalDuration = Math.max(
            1,
            dDueAt.getTime() - dActivatedAt.getTime() - deptPauseMs,
          );
          const actualTime = Math.max(
            0,
            completedTime.getTime() - dActivatedAt.getTime() - deptPauseMs,
          );
          dConsumptionPercent = Math.min(
            100,
            Math.round((actualTime / totalDuration) * 100),
          );
        } else {
          dConsumptionPercent = 100;
        }

        if (dDueAt && completedTime > dDueAt) {
          dSlaState = "COMPLETED_BREACHED";
          dSlaStateLabel = "Completed Past SLA";
        } else {
          dSlaState = "COMPLETED_ON_TRACK";
          dSlaStateLabel = "Completed Within SLA";
        }
        dTimeRemaining = dCompletedAt
          ? `Done ${formatRelativeTime(dCompletedAt)}`
          : "Findings Submitted";
      } else if (dDueAt) {
        const rawTotalDuration = dDueAt.getTime() - startTime.getTime();
        const totalDuration = Math.max(1, rawTotalDuration - deptPauseMs);
        const rawElapsed = Math.max(
          0,
          effectiveNow.getTime() - startTime.getTime(),
        );
        const activeElapsed = Math.max(0, rawElapsed - deptPauseMs);
        dConsumptionPercent = Math.min(
          100,
          Math.max(0, Math.round((activeElapsed / totalDuration) * 100)),
        );

        if (!isPaused && now > dDueAt) {
          dSlaState = "BREACHED";
          dSlaStateLabel = "SLA Breached";
          const diffMs = now.getTime() - dDueAt.getTime();
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffHours / 24);
          dTimeRemaining =
            diffDays > 0
              ? `Breached ${diffDays}d ago`
              : `Breached ${diffHours}h ago`;
        } else {
          const diffMs = Math.max(0, dDueAt.getTime() - effectiveNow.getTime());
          const diffHours = Math.floor(diffMs / 3600000);
          const diffMins = Math.floor((diffMs % 3600000) / 60000);
          dTimeRemaining = isPaused
            ? `${diffHours}h ${diffMins}m remaining (Paused)`
            : `${diffHours}h ${diffMins}m remaining`;

          if (dConsumptionPercent >= escalationThreshold) {
            dSlaState = "SLA_AT_RISK";
            dSlaStateLabel = "SLA At Risk";
          } else if (dConsumptionPercent >= warningThreshold) {
            dSlaState = "ON_TRACK";
            dSlaStateLabel = "SLA Warning";
          } else {
            dSlaState = "ON_TRACK";
            dSlaStateLabel = "Within SLA";
          }
        }
      }

      return {
        id: d.grievance_department_id.toString(),
        departmentId: d.department_id.toString(),
        departmentName: d.departments?.department_name || "Unknown Department",
        involvementType: d.involvement_type as
          | "PRIMARY"
          | "SUPPORTING"
          | "EQUAL",
        status: deptStatus,
        assignedStaff,
        primaryStaff,
        supportingStaff,
        slaPercentAllocation: d.sla_percent_allocation
          ? Number(d.sla_percent_allocation)
          : null,
        allocatedDurationMinutes: dAllocatedMins,
        executionOrder: d.execution_order || 1,
        activatedAt: dActivatedAt ? formatFullDateTime(dActivatedAt) : null,
        dueAt: dDueAt ? formatFullDateTime(dDueAt) : null,
        completedAt: dCompletedAt ? formatFullDateTime(dCompletedAt) : null,
        slaState: dSlaState,
        slaStateLabel: dSlaStateLabel,
        consumptionPercent: dConsumptionPercent,
        timeRemaining: dTimeRemaining,
      };
    });

    // 1. Assignment details
    const myDeptRecord = rawDepartments.find(
      (d) => d.department_id === departmentId,
    );

    // Target department resolution:
    // Focus on user's active department, or the active department in workflow if user's is completed / user is Admin
    const activeDeptInWorkflow = rawDepartments.find(
      (d) => d.status !== "COMPLETED" && d.status !== "BLOCKED",
    );
    const primaryDept =
      rawDepartments.find((d) => d.involvement_type === "PRIMARY") ||
      rawDepartments[0];

    const targetDeptRecord =
      isAdmin && activeDeptInWorkflow
        ? activeDeptInWorkflow
        : myDeptRecord?.status === "COMPLETED" && activeDeptInWorkflow
          ? activeDeptInWorkflow
          : myDeptRecord || activeDeptInWorkflow || primaryDept;

    const isDeptPending =
      targetDeptRecord?.status === "PENDING_ASSIGNMENT" ||
      grievance.status === "SUBMITTED" ||
      grievance.status === "ROUTED" ||
      grievance.status === "AWAITING_ROUTING" ||
      grievance.status === "AWAITING_ASSIGNMENT" ||
      (grievance.status === "REOPENED" &&
        targetDeptRecord?.status === "PENDING_ASSIGNMENT");

    const primaryAssignment = targetDeptRecord
      ? isDeptPending
        ? null
        : allDeptAssignments.find(
            (a) =>
              a.grievance_department_id ===
                targetDeptRecord.grievance_department_id &&
              a.assignment_status === "ASSIGNED",
          ) || null
      : isDeptPending
        ? null
        : allDeptAssignments.find((a) => a.assignment_status === "ASSIGNED") ||
          (grievance.assignments?.[0]?.assignment_status === "ASSIGNED"
            ? grievance.assignments[0]
            : null);

    const assignedUser = primaryAssignment?.users_assignments_staff_idTousers;
    const isAssignedToHead = Boolean(
      !isDeptPending &&
        assignedUser &&
        (assignedUser.roles?.role_name === "DEPARTMENT_HEAD" ||
          (user?.user_id &&
            assignedUser.user_id &&
            BigInt(assignedUser.user_id) === BigInt(user.user_id))),
    );
    const assignment = {
      isAssigned: !isDeptPending && !!assignedUser,
      isAssignedToHead,
      staffId:
        !isDeptPending && assignedUser ? assignedUser.user_id.toString() : null,
      staffName:
        !isDeptPending && assignedUser
          ? `${assignedUser.first_name} ${assignedUser.last_name || ""}`.trim()
          : targetDeptRecord?.status === "BLOCKED"
            ? "Blocked (Waiting for Prerequisite)"
            : "Unassigned",
      designation: assignedUser?.roles?.role_name || "Investigating Officer",
      email: assignedUser?.email || null,
      assignedAt: primaryAssignment?.assigned_at
        ? formatFullDateTime(primaryAssignment.assigned_at)
        : null,
      assignedAtRelative: primaryAssignment?.assigned_at
        ? formatRelativeTime(primaryAssignment.assigned_at)
        : null,
      status:
        primaryAssignment?.assignment_status ||
        (targetDeptRecord?.status === "BLOCKED" ? "BLOCKED" : "PENDING"),
    };

    // Check if there is an HOD intervention strictly scoped to this department in multi-dept cases
    const isMultiDeptCase = rawDepartments.length > 1;
    const interventionLog = (grievance.audit_logs || []).find((l) => {
      if (
        l.action !== "HOD_INTERVENTION_TAKEN" &&
        l.action !== "Step 6: Intervention Action Taken"
      ) {
        return false;
      }

      // Exclude interventions from previous closed/reopened cycles
      if (
        currentCycleStart > 0 &&
        new Date(l.created_at).getTime() < currentCycleStart - 1000
      ) {
        return false;
      }

      if (!isMultiDeptCase || !departmentId) {
        return true;
      }

      let parsedVal: Record<string, unknown> | null = null;
      if (l.new_value) {
        if (typeof l.new_value === "string") {
          try {
            parsedVal = JSON.parse(l.new_value);
          } catch {
            parsedVal = null;
          }
        } else if (typeof l.new_value === "object") {
          parsedVal = l.new_value as Record<string, unknown>;
        }
      }

      if (
        typeof parsedVal?.targetDepartment === "string" &&
        myDeptRecord?.departments?.department_name
      ) {
        const target = parsedVal.targetDepartment.toLowerCase().trim();
        const currDept = myDeptRecord.departments.department_name
          .toLowerCase()
          .trim();
        return target.includes(currDept) || currDept.includes(target);
      }

      if (parsedVal?.departmentId || parsedVal?.department_id) {
        return (
          BigInt(String(parsedVal.departmentId || parsedVal.department_id)) ===
          departmentId
        );
      }

      if (
        l.users?.department_id &&
        BigInt(l.users.department_id) === departmentId
      ) {
        return true;
      }

      return false;
    });
    let ivData: Record<string, unknown> | null = null;
    if (interventionLog?.new_value) {
      if (typeof interventionLog.new_value === "string") {
        try {
          ivData = JSON.parse(interventionLog.new_value);
        } catch {
          ivData = {};
        }
      } else if (typeof interventionLog.new_value === "object") {
        ivData = interventionLog.new_value as Record<string, unknown>;
      }
    }

    const isSlaExtensionActive =
      ivData?.actionType === "EXTEND_SLA" ||
      (typeof ivData?.actionLabel === "string" &&
        ivData.actionLabel.includes("Deadline Extended"));

    // 2. SLA calculations
    const targetDeptData =
      departmentsInvolved.find(
        (d) => d.id === targetDeptRecord?.grievance_department_id.toString(),
      ) || departmentsInvolved[0];

    const isDeptBlocked = targetDeptRecord?.status === "BLOCKED";
    const isDeptCompleted = targetDeptRecord?.status === "COMPLETED";

    const deptAllocatedMins =
      targetDeptData?.allocatedDurationMinutes ||
      targetDeptRecord?.allocated_duration_minutes ||
      (targetDeptRecord?.due_at && targetDeptRecord?.activated_at
        ? Math.max(
            1,
            Math.round(
              (new Date(targetDeptRecord.due_at).getTime() -
                new Date(targetDeptRecord.activated_at).getTime()) /
                60000,
            ),
          )
        : 60);

    const dueAtLabel = isDeptBlocked
      ? `${Math.round(deptAllocatedMins / 60)}h allocated (${Number(targetDeptRecord?.sla_percent_allocation || 100)}%)`
      : targetDeptData?.dueAt ||
        (targetDeptRecord?.due_at
          ? formatFullDateTime(targetDeptRecord.due_at)
          : "No Target Set");

    const pauseLabel =
      grievance.status === "AWAITING_INFORMATION" ||
      grievance.status === "WAITING_ON_USER" ||
      grievance.status === "WAITING_ON_EMPLOYEE"
        ? "Waiting on User"
        : grievance.status === "RESOLUTION_PENDING_APPROVAL" ||
            grievance.status === "UNDER_REVIEW"
          ? "Under Review"
          : grievance.status === "RESOLVED"
            ? "Awaiting Employee Confirmation"
            : "Paused";

    const targetSlaState = targetDeptData?.slaState || "ON_TRACK";
    const targetSlaStateLabel = targetDeptData?.slaStateLabel || "Within SLA";
    const isBreached =
      targetSlaState === "BREACHED" || targetSlaState === "COMPLETED_BREACHED";
    const isApproaching = targetSlaState === "SLA_AT_RISK";

    const sla = {
      consumptionPercent: targetDeptData?.consumptionPercent ?? 0,
      timeRemaining: targetDeptData?.timeRemaining ?? "N/A",
      dueAt: dueAtLabel,
      state: isPaused ? "PAUSED" : targetSlaState,
      stateLabel: isBreached
        ? "SLA Breached"
        : isPaused
          ? `SLA Paused (${pauseLabel})`
          : isDeptCompleted
            ? isBreached
              ? "Completed Past SLA"
              : "Findings Completed (Within SLA)"
            : isSlaExtensionActive
              ? isApproaching
                ? "Approaching Extended SLA"
                : "Within Extended SLA"
              : targetSlaStateLabel,
      label: isBreached
        ? "SLA BREACHED"
        : isPaused
          ? `PAUSED (${pauseLabel})`
          : isDeptCompleted
            ? isBreached
              ? "COMPLETED PAST SLA"
              : "COMPLETED"
            : isSlaExtensionActive
              ? isApproaching
                ? "APPROACHING EXTENDED SLA"
                : "WITHIN EXTENDED SLA"
              : targetSlaStateLabel.toUpperCase(),
      color: isBreached
        ? "text-rose-600 bg-rose-50 border-rose-200"
        : isPaused
          ? "text-amber-800 bg-amber-50 border-amber-200"
          : isDeptCompleted
            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
            : isApproaching || targetSlaState === "SLA_AT_RISK"
              ? "text-amber-600 bg-amber-50 border-amber-200"
              : "text-emerald-600 bg-emerald-50 border-emerald-200",
      slaPercentAllocation: targetDeptRecord?.sla_percent_allocation
        ? Number(targetDeptRecord.sla_percent_allocation)
        : 100,
      allocatedDurationMinutes: deptAllocatedMins,
      targetDepartmentName:
        targetDeptRecord?.departments?.department_name ||
        primaryDept?.departments?.department_name ||
        null,
    };

    // 3. Current Stage & Stepper (Department-Scoped)
    const rawPrereqs = Array.isArray(
      targetDeptRecord?.prerequisite_department_ids,
    )
      ? (
          targetDeptRecord.prerequisite_department_ids as (
            | number
            | string
            | bigint
          )[]
        ).map(String)
      : [];
    const prereqDepts = rawDepartments.filter((d) =>
      rawPrereqs.includes(d.department_id.toString()),
    );
    const prereqNames = prereqDepts.map(
      (d) => d.departments?.department_name || "Supporting Department",
    );
    const prereqSummary =
      prereqNames.length > 0
        ? prereqNames.join(", ")
        : "Prerequisite Department";

    let currentStageKey = "SUBMITTED";
    let currentStageLabel = "Grievance Registered";
    let currentStageNumber = 1;

    const st = grievance.status;
    const hasAssignedOfficer = !!assignedUser;
    const isReopened =
      (grievance.reopen_count || 0) > 0 ||
      st === "REOPENED" ||
      st === "REOPEN_REVIEW";

    const latestResolution = grievance.resolutions[0];
    const isHeadResolution =
      latestResolution?.users?.roles?.role_name === "DEPARTMENT_HEAD" ||
      latestResolution?.users?.roles?.role_name === "ADMIN";

    if (isDeptBlocked) {
      currentStageKey = "BLOCKED";
      currentStageLabel = `Blocked — Waiting on ${prereqSummary} findings`;
      currentStageNumber = 2;
    } else if (st === "CLOSED" || st === "RESOLVED") {
      currentStageKey = "CLOSED";
      currentStageLabel = "Grievance Closed";
      currentStageNumber = 5;
    } else if (st === "UNDER_REVIEW") {
      currentStageKey = "RESOLUTION_SUBMITTED";
      currentStageLabel = isHeadResolution
        ? "Resolution Submitted — Under Employee Review"
        : "Resolution Submitted — Pending HOD Approval";
      currentStageNumber = 4;
    } else if (targetDeptRecord?.status === "COMPLETED") {
      currentStageKey = "COMPLETED";
      currentStageLabel = "Department Findings Submitted (Completed)";
      currentStageNumber = 3;
    } else if (st === "AWAITING_USER_RESPONSE") {
      currentStageKey = "AWAITING_USER_RESPONSE";
      currentStageLabel = "Awaiting Complainant Response";
      currentStageNumber = 3;
    } else if (
      targetDeptRecord &&
      (targetDeptRecord.status === "PENDING_ASSIGNMENT" ||
        (!hasAssignedOfficer && targetDeptRecord.status !== "IN_PROGRESS"))
    ) {
      currentStageKey = "SUBMITTED";
      currentStageLabel = "Pending Staff Assignment";
      currentStageNumber = 1;
    } else if (targetDeptRecord && targetDeptRecord.status === "ASSIGNED") {
      currentStageKey = "ASSIGNED";
      const officerName = assignedUser
        ? `${assignedUser.first_name} ${assignedUser.last_name || ""}`.trim()
        : "Investigating Officer";
      currentStageLabel = isReopened
        ? `Reopened — Assigned to ${officerName}`
        : `Assigned to ${officerName}`;
      currentStageNumber = 2;
    } else if (
      targetDeptRecord?.status === "IN_PROGRESS" ||
      (!targetDeptRecord &&
        (st === "IN_PROGRESS" ||
          st === "INVESTIGATING" ||
          st === "ESCALATED" ||
          st === "REOPENED" ||
          st === "REOPEN_REVIEW"))
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
        st === "ROUTED" || myDeptRecord?.status === "PENDING_ASSIGNMENT"
          ? "Pending Staff Assignment"
          : isReopened
            ? "Reopened — Pending Assignment"
            : "Grievance Registered";
      currentStageNumber = 1;
    }

    const progressSteps = isDeptBlocked
      ? [
          {
            key: "SUBMITTED",
            label: "Submitted",
            isComplete: true,
            isCurrent: false,
          },
          {
            key: "BLOCKED",
            label: "Blocked (Waiting on Prerequisite)",
            isComplete: false,
            isCurrent: true,
            isBlocked: true,
          },
          {
            key: "INVESTIGATION",
            label: "Investigation",
            isComplete: false,
            isCurrent: false,
          },
          {
            key: "RESOLUTION",
            label: "Resolution",
            isComplete: false,
            isCurrent: false,
          },
        ]
      : myDeptRecord?.status === "COMPLETED"
        ? [
            {
              key: "SUBMITTED",
              label: "Submitted",
              isComplete: true,
              isCurrent: false,
            },
            {
              key: "ASSIGNED",
              label: "Assigned",
              isComplete: true,
              isCurrent: false,
            },
            {
              key: "INVESTIGATION",
              label: "Findings Completed",
              isComplete: true,
              isCurrent: true,
            },
            {
              key: "RESOLUTION",
              label: "Lead Dept Resolution",
              isComplete: false,
              isCurrent: false,
            },
          ]
        : !hasAssignedOfficer &&
            (st === "ROUTED" ||
              st === "SUBMITTED" ||
              myDeptRecord?.status === "PENDING_ASSIGNMENT")
          ? [
              {
                key: "SUBMITTED",
                label: "Submitted",
                isComplete: true,
                isCurrent: true,
              },
              {
                key: "ASSIGNED",
                label: "Pending Assignment",
                isComplete: false,
                isCurrent: false,
              },
              {
                key: "INVESTIGATION",
                label: "Investigation",
                isComplete: false,
                isCurrent: false,
              },
              {
                key: "RESOLUTION",
                label: "Resolution Review",
                isComplete: false,
                isCurrent: false,
              },
            ]
          : [
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
                    : "Resolution",
                isComplete: currentStageNumber >= 4,
                isCurrent: currentStageNumber === 4,
              },
              {
                key: "CLOSED",
                label: "Closed",
                isComplete: currentStageNumber >= 5,
                isCurrent: currentStageNumber === 5,
              },
            ];

    const timeline = (grievance.audit_logs || [])
      .filter((log) => {
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

        const isInternalAction =
          log.action === "HOD_DIRECTIVE_NOTE" ||
          log.action === "INVESTIGATION_NOTE_ADDED" ||
          log.action === "INTERNAL_NOTE_ADDED" ||
          log.action === "HEAD_DIRECTIVE_ISSUED" ||
          val.scope === "INTERNAL";

        const isCollab =
          log.action === "COLLABORATION_NOTE_ADDED" ||
          val.scope === "COLLABORATION";

        if (isCollab) {
          return true;
        }

        if (isInternalAction && !isAdmin && departmentId) {
          const authorDeptId =
            log.users?.department_id?.toString() ||
            (val.department_id ? String(val.department_id) : null);
          if (authorDeptId && authorDeptId !== departmentId.toString()) {
            return false;
          }
        }
        return true;
      })
      .map((log: (typeof grievance.audit_logs)[0]) => {
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
        if (act === "REWORK_REQUESTED") {
          title = "Resolution Rework Requested";
          description =
            (val.remarks as string) ||
            (val.reason as string) ||
            (val.details as string) ||
            "Complainant requested resolution rework.";
        } else if (act === "REWORK_APPROVED") {
          title = "Rework Request Approved & Assigned";
          description =
            (val.details as string) ||
            (val.remarks as string) ||
            "Rework approved by Department Head and assigned for re-investigation.";
        } else if (act === "REWORK_REJECTED") {
          title = "Rework Request Rejected";
          description =
            (val.remarks as string) ||
            (val.reason as string) ||
            (val.details as string) ||
            "Rework request declined by Department Head. Proposed resolution stands.";
        } else if (act === "REWORK_REJECTED_FINAL") {
          title = "Rework Request Permanently Declined";
          description =
            (val.remarks as string) ||
            (val.reason as string) ||
            (val.details as string) ||
            "Maximum rework attempts reached. Grievance permanently closed.";
        } else if (act === "REOPEN_REQUESTED") {
          title = "Case Reopening Requested";
          description =
            (val.reason as string) ||
            (val.remarks as string) ||
            (val.details as string) ||
            "Complainant requested grievance reopening within allowed window.";
        } else if (act === "REOPEN_APPROVED") {
          title = "Case Reopening Approved & Assigned";
          description =
            (val.details as string) ||
            (val.remarks as string) ||
            "Reopening approved by Department Head. Case reopened for re-investigation.";
        } else if (act === "REOPEN_REJECTED") {
          title = "Case Reopening Rejected";
          description =
            (val.remarks as string) ||
            (val.reason as string) ||
            (val.details as string) ||
            "Reopening request declined by Department Head. Grievance remains closed.";
        } else if (act === "REOPEN_REJECTED_FINAL") {
          title = "Case Reopening Permanently Declined";
          description =
            (val.remarks as string) ||
            (val.reason as string) ||
            (val.details as string) ||
            "Maximum reopening attempts reached. Grievance permanently closed.";
        } else if (
          act === "RESOLUTION_SUBMITTED" ||
          act === "SUBMIT_RESOLUTION"
        ) {
          title = "Resolution Findings Submitted";
          description =
            (val.resolution as string) ||
            (val.findings as string) ||
            (val.details as string) ||
            "Investigating officer submitted resolution findings for review.";
        } else if (
          act === "ACCEPT_RESOLUTION" ||
          act === "RESOLUTION_ACCEPTED"
        ) {
          title = "Resolution Accepted & Case Closed";
          description =
            (val.details as string) ||
            "Resolution accepted by complainant. Case successfully closed.";
        } else if (act === "ADDITIONAL_INFO_REQUESTED") {
          title = "Additional Information Requested";
          description =
            (val.details as string) ||
            (val.note as string) ||
            (val.remarks as string) ||
            "Clarification and supporting documents requested from complainant.";
        } else if (
          act === "ADDITIONAL_INFO_SUBMITTED" ||
          act === "USER_INFO_SUBMITTED"
        ) {
          title = "Additional Information Submitted";
          description =
            (val.details as string) ||
            (val.note as string) ||
            "Complainant submitted requested information and documents.";
        } else if (act === "GRACE_PERIOD_REQUESTED") {
          title = "SLA Extension Requested";
          description =
            (val.reason as string) ||
            (val.details as string) ||
            "Staff requested SLA extension due to investigation complexity.";
        } else if (act === "GRACE_PERIOD_APPROVED") {
          title = "SLA Extension Approved";
          description =
            (val.details as string) ||
            "SLA extension approved by Department Head.";
        } else if (act === "GRACE_PERIOD_REJECTED") {
          title = "SLA Extension Rejected";
          description =
            (val.rejectionReason as string) ||
            (val.reason as string) ||
            "SLA extension request declined by Department Head.";
        } else if (act.includes("ASSIGN")) {
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
        } else if (
          act === "COLLABORATION_NOTE_ADDED" ||
          val.scope === "COLLABORATION"
        ) {
          title = "Collaboration Note Added";
          description =
            (val.note as string) ||
            (val.details as string) ||
            "Cross-department collaboration note.";
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
        } else if (
          act.includes("FINDINGS") ||
          act === "SUPPORTING_FINDINGS_SUBMITTED"
        ) {
          title = "Department Findings Submitted";
          description =
            (val.findings as string) ||
            (val.details as string) ||
            "Supporting departmental investigation findings submitted.";
        } else if (
          act.includes("SUBMIT_RESOLUTION") ||
          act.includes("RESOLUTION_SUBMITTED")
        ) {
          title = "Resolution Findings Submitted";
        } else if (act.includes("ROUTE")) {
          title = "Department Routing";
          description =
            (val.details as string) ||
            "Grievance triaged and routed into department queue.";
        } else if (
          act === "GRIEVANCE_CREATED" ||
          act === "GRIEVANCE_SUBMITTED" ||
          act === "CREATE" ||
          act === "SUBMIT" ||
          act.includes("CREATE")
        ) {
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
          } else if (actorRole === "ADMIN") {
            actor = `Admin — ${rawName}`;
          } else if (actorRole === "END_USER") {
            actor = `${rawName} (Complainant)`;
          } else {
            actor = `${rawName} (${actorRole || "User"})`;
          }
        } else {
          const authorFromVal =
            (val.who as { name?: string })?.name ||
            (val.submittedBy as string) ||
            (val.submitted_by as string) ||
            (val.author as string) ||
            (val.staffName as string) ||
            (val.headName as string) ||
            (val.routed_by_email as string) ||
            (val.routed_by as string) ||
            (val.created_by as string) ||
            (val.updated_by as string) ||
            (val.deleted_by as string) ||
            (val.deactivatedBy as string);

          if (authorFromVal && typeof authorFromVal === "string") {
            actor = authorFromVal;
          } else if (
            act.startsWith("GRIEVANCE_CREATED") ||
            act.startsWith("GRIEVANCE_SUBMITTED") ||
            act === "REWORK_REQUESTED" ||
            act === "REOPEN_REQUESTED" ||
            act === "USER_INFO_SUBMITTED" ||
            act === "USER_ADDITIONAL_INFO_PROVIDED" ||
            act === "ACCEPT_RESOLUTION"
          ) {
            const complainantName = grievance.users
              ? `${grievance.users.first_name} ${grievance.users.last_name || ""}`.trim()
              : "";
            actor = complainantName
              ? `${complainantName} (Complainant)`
              : "Complainant";
          } else if (
            act.includes("SLA_") ||
            act.includes("AUTO_") ||
            act.includes("TIMER")
          ) {
            actor = "System Automated";
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

    // Helper to parse audit log new_value
    const parseLogVal = (
      l: (typeof grievance.audit_logs)[0],
    ): Record<string, unknown> => {
      if (typeof l.new_value === "string") {
        try {
          return JSON.parse(l.new_value);
        } catch {
          return { note: l.new_value };
        }
      } else if (l.new_value && typeof l.new_value === "object") {
        return l.new_value as Record<string, unknown>;
      }
      return {};
    };

    const formatNoteItem = (
      l: (typeof grievance.audit_logs)[0],
      val: Record<string, unknown>,
    ) => {
      const user = l.users;
      const userRole = user?.roles?.role_name;
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
    };

    // Extract internal notes (department-private, strictly for user's department)
    const internalNotes = (grievance.audit_logs || [])
      .filter((l) => {
        const val = parseLogVal(l);
        const isCollab =
          l.action === "COLLABORATION_NOTE_ADDED" ||
          l.action === "SUPPORTING_FINDINGS_SUBMITTED" ||
          val.scope === "COLLABORATION";
        if (isCollab) return false;

        const isInternalAction =
          l.action === "HOD_DIRECTIVE_NOTE" ||
          l.action === "INVESTIGATION_NOTE_ADDED" ||
          l.action === "INTERNAL_NOTE_ADDED" ||
          l.action === "HEAD_DIRECTIVE_ISSUED";
        if (!isInternalAction) return false;

        if (!isAdmin && departmentId) {
          const authorDeptId =
            l.users?.department_id?.toString() ||
            (val.department_id ? String(val.department_id) : null);
          if (authorDeptId && authorDeptId !== departmentId.toString()) {
            return false;
          }
        }
        return true;
      })
      .slice()
      .reverse()
      .map((l) => formatNoteItem(l, parseLogVal(l)));

    // Extract collaboration notes (cross-department, visible to all involved departments)
    const collaborationNotes = (grievance.audit_logs || [])
      .filter((l) => {
        const val = parseLogVal(l);
        return (
          l.action === "COLLABORATION_NOTE_ADDED" ||
          l.action === "SUPPORTING_FINDINGS_SUBMITTED" ||
          val.scope === "COLLABORATION"
        );
      })
      .slice()
      .reverse()
      .map((l) => formatNoteItem(l, parseLogVal(l)));

    // 5. Latest Activity
    const latestEvent = timeline[0] || null;
    const latestActivity = latestEvent
      ? `${latestEvent.title} · ${latestEvent.relativeTime}`
      : "Grievance registered";

    // 6. Find HOD intervention
    let hodIntervention = null;
    if (interventionLog?.new_value) {
      let iv: Record<string, unknown> = {};
      if (typeof interventionLog.new_value === "string") {
        try {
          iv = JSON.parse(interventionLog.new_value);
        } catch {
          iv = {};
        }
      } else if (typeof interventionLog.new_value === "object") {
        iv = interventionLog.new_value as Record<string, unknown>;
      }

      const isResAuth = Boolean(
        iv.isResolutionAuthority ||
          iv.actionType === "ASSUME_RESOLUTION_AUTHORITY" ||
          iv.actionType === "DIRECT_OVERSIGHT",
      );

      let actionLabel = (iv.actionLabel as string) || "HOD Intervention";
      let resolvedTargetStaffName = (iv.targetStaffName as string) || undefined;

      // Self-healing: if actionLabel or targetStaffName contains "(Unassigned)" for CO_ASSIGN
      // Dynamic resolution: Ensure the co-assigned staff name in actionLabel matches the department's actual co-assigned staff
      if (
        (iv.actionType === "CO_ASSIGN" ||
          actionLabel.includes("Secondary Staff Co-Assigned")) &&
        (actionLabel.includes("(Unassigned)") ||
          !resolvedTargetStaffName ||
          resolvedTargetStaffName === "Unassigned")
      ) {
        // Target the specific department of this intervention
        const targetDeptName = iv.targetDepartment
          ? String(iv.targetDepartment).toLowerCase().trim()
          : "";
        const targetDeptRecord =
          rawDepartments.find(
            (d) =>
              (iv.departmentId &&
                String(d.grievance_department_id) ===
                  String(iv.departmentId)) ||
              (targetDeptName &&
                (d.departments?.department_name || "")
                  .toLowerCase()
                  .includes(targetDeptName)),
          ) ||
          myDeptRecord ||
          rawDepartments[0];

        // Find assignments belonging to THIS department only (excluding other departments like Legal)
        const deptSpecificAssignments = allDeptAssignments.filter(
          (a) =>
            a.users_assignments_staff_idTousers &&
            (a.assignment_role === "SUPPORTING" ||
              a.assignment_status === "CO_ASSIGNED" ||
              (assistedStaffName &&
                `${a.users_assignments_staff_idTousers.first_name} ${a.users_assignments_staff_idTousers.last_name || ""}`
                  .trim()
                  .toLowerCase() !== assistedStaffName.toLowerCase())) &&
            Boolean(
              targetDeptRecord &&
                String(a.grievance_department_id) ===
                  String(targetDeptRecord.grievance_department_id),
            ),
        );

        const supportingAssignment = deptSpecificAssignments.find((a) => {
          const su = a.users_assignments_staff_idTousers;
          if (!su) return false;
          const name = `${su.first_name} ${su.last_name || ""}`.trim();
          if (
            assistedStaffName &&
            name.toLowerCase() === assistedStaffName.toLowerCase()
          )
            return false;
          return true;
        });

        if (supportingAssignment?.users_assignments_staff_idTousers) {
          const su = supportingAssignment.users_assignments_staff_idTousers;
          const foundName = `${su.first_name} ${su.last_name || ""}`.trim();
          resolvedTargetStaffName = foundName;
          actionLabel = actionLabel.replace(
            /\(Unassigned\)/g,
            `(${foundName})`,
          );
          actionLabel = actionLabel.replace(
            /Secondary Staff Co-Assigned( \([^)]+\))?/,
            `Secondary Staff Co-Assigned (${foundName})`,
          );
        } else {
          actionLabel = actionLabel.replace(" (Unassigned)", "");
          actionLabel = actionLabel.replace(
            /Secondary Staff Co-Assigned( \([^)]+\))?/,
            "Secondary Staff Co-Assigned",
          );
        }
      }

      hodIntervention = {
        actionType: (iv.actionType as string) || "MONITOR",
        actionLabel,
        note: (iv.note as string) || "",
        intervenedAt: formatRelativeTime(interventionLog.created_at),
        intervenedBy:
          (iv.intervenedBy as string) ||
          (interventionLog.users
            ? `${interventionLog.users.first_name} ${interventionLog.users.last_name || ""}`.trim()
            : "Department Head"),
        isResolutionAuthority: isResAuth,
        targetStaffName: resolvedTargetStaffName,
        departmentId:
          (iv.departmentId as string) ||
          (iv.department_id as string) ||
          undefined,
        targetDepartment:
          (iv.targetDepartment as string) ||
          (iv.target_department as string) ||
          undefined,
        resolutionAuthorityName:
          (iv.resolutionAuthorityName as string) ||
          (iv.intervenedBy as string) ||
          (interventionLog.users
            ? `${interventionLog.users.first_name} ${interventionLog.users.last_name || ""}`.trim()
            : "Department Head"),
        resolutionAuthorityUserId: iv.resolutionAuthorityUserId as
          | string
          | undefined,
        rootBottleneck: (iv.bottleneck as string) || undefined,
        bottleneckExplanation:
          (iv.bottleneckExplanation as string) || undefined,
        directiveJustification: (iv.note as string) || "",
      };
    } else if (
      latestLifecycleReset &&
      (latestLifecycleReset.action === "REOPEN_APPROVED" ||
        latestLifecycleReset.action === "REWORK_APPROVED")
    ) {
      let rVal: Record<string, unknown> | null = null;
      if (latestLifecycleReset.new_value) {
        if (typeof latestLifecycleReset.new_value === "string") {
          try {
            rVal = JSON.parse(latestLifecycleReset.new_value);
          } catch {
            rVal = null;
          }
        } else if (typeof latestLifecycleReset.new_value === "object") {
          rVal = latestLifecycleReset.new_value as Record<string, unknown>;
        }
      }

      const remarks = String(rVal?.remarks || "");
      const isAssumedAuth =
        remarks.toLowerCase().includes("assumed direct authority") ||
        String(rVal?.assignedStaffId) === String(latestLifecycleReset.user_id);

      const resetUserDeptId = latestLifecycleReset.users?.department_id;
      const isForMyDept =
        !departmentId ||
        (resetUserDeptId && BigInt(resetUserDeptId) === departmentId) ||
        (myDeptRecord?.involvement_type === "PRIMARY" &&
          (!resetUserDeptId || BigInt(resetUserDeptId) === departmentId));

      if (isAssumedAuth && isForMyDept) {
        const actorName = latestLifecycleReset.users
          ? `${latestLifecycleReset.users.first_name} ${latestLifecycleReset.users.last_name || ""}`.trim()
          : "Department Head";
        const primaryDeptRecord = rawDepartments.find(
          (d) => d.involvement_type === "PRIMARY",
        );
        const targetDeptName =
          myDeptRecord?.departments?.department_name ||
          primaryDeptRecord?.departments?.department_name;

        hodIntervention = {
          actionType: "ASSUME_RESOLUTION_AUTHORITY",
          actionLabel: `Resolution Authority Assumed by ${actorName}`,
          note:
            remarks || "Department Head assumed direct authority to resolve",
          intervenedAt: formatRelativeTime(latestLifecycleReset.created_at),
          intervenedBy: actorName,
          targetStaffName: actorName,
          departmentId: resetUserDeptId
            ? resetUserDeptId.toString()
            : undefined,
          targetDepartment: targetDeptName || undefined,
          isResolutionAuthority: true,
          resolutionAuthorityUserId: latestLifecycleReset.user_id?.toString(),
          resolutionAuthorityName: actorName,
          rootBottleneck: "Direct Department Head Intervention on Reopening",
          directiveJustification: remarks,
        };
      }
    }

    const supportingFindings = (grievance.audit_logs || [])
      .filter((l) => {
        const val =
          typeof l.new_value === "string"
            ? (JSON.parse(l.new_value || "{}") as Record<string, unknown>)
            : (l.new_value as Record<string, unknown> | null);
        if (val?.isResolution === true) return false;
        return (
          l.action === "SUPPORTING_FINDINGS_SUBMITTED" ||
          val?.isFindings === true ||
          String(val?.note || "").includes("[Department Findings")
        );
      })
      .map((l) => {
        const val =
          typeof l.new_value === "string"
            ? (JSON.parse(l.new_value || "{}") as Record<string, unknown>)
            : (l.new_value as Record<string, unknown> | null);
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

        const rawAttList = Array.isArray(val?.attachments)
          ? (val.attachments as Array<{
              id?: string;
              name?: string;
              fileName?: string;
              size?: string;
              type?: string;
              path?: string;
              filePath?: string;
              downloadUrl?: string;
            }>)
          : [];

        const attList = rawAttList.map((att, idx) => ({
          id: att.id || `${l.audit_log_id}-att-${idx}`,
          name: att.name || att.fileName || "Finding-Attachment",
          size: att.size,
          type: att.type,
          path: att.path || att.filePath || "",
          downloadUrl:
            att.downloadUrl ||
            (att.id ? `/api/attachments/${att.id}/download` : undefined),
        }));

        return {
          id: l.audit_log_id.toString(),
          departmentName: deptName,
          submittedBy: (val?.submittedBy as string) || authorName,
          findings,
          actionTaken: actionTaken || undefined,
          notes: notes || undefined,
          attachments: attList,
          createdAt: l.created_at.toISOString(),
          timestamp: formatRelativeTime(l.created_at),
        };
      });

    const latestExt = grievance.sla_extensions?.[0];
    const latestExtension = latestExt
      ? {
          id: latestExt.extension_id.toString(),
          status: latestExt.status as "PENDING" | "APPROVED" | "REJECTED",
          requestedMinutes: latestExt.requested_duration_minutes,
          grantedMinutes: latestExt.granted_duration_minutes,
          reason: latestExt.reason,
          createdAt: latestExt.created_at.toISOString(),
          requestedByName: latestExt.users_requested_by
            ? `${latestExt.users_requested_by.first_name} ${latestExt.users_requested_by.last_name || ""}`.trim()
            : "Staff Member",
        }
      : null;

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
          isAssignedToHead,
          latestExtension,
          hasPendingExtension: latestExtension?.status === "PENDING",
          createdAt: formatFullDateTime(grievance.created_at),
          submitterName:
            `${grievance.users?.first_name || ""} ${grievance.users?.last_name || ""}`.trim() ||
            "Complainant",
          submitterEmail: grievance.users?.email || "N/A",
          submitterRole: grievance.users?.roles?.role_name || "END_USER",
          attachments: filterAuthorizedAttachments(
            user,
            (grievance.attachments || []).filter(
              (att) =>
                !att.resolution_id &&
                !att.grievance_department_id &&
                BigInt(att.uploaded_by) === BigInt(grievance.submitted_by),
            ),
            {
              grievance_id: grievance.grievance_id,
              submitted_by: grievance.submitted_by,
              status: grievance.status,
              title: grievance.title,
              description: grievance.description,
              categoryName: grievance.categories?.category_name,
              subcategoryName: grievance.subcategories?.subcategory_name,
            },
            (rawDepartments || []).map((gd) => ({
              grievance_department_id: gd.grievance_department_id,
              department_id: gd.department_id,
              department_name: gd.departments?.department_name || "",
              involvement_type: gd.involvement_type,
              status: gd.status,
            })),
            (allDeptAssignments || []).map((a) => ({
              staff_id: a.staff_id,
              grievance_department_id: a.grievance_department_id,
              assignment_status: a.assignment_status,
            })),
            (grievance.attachments || []).flatMap((att) =>
              (att.attachment_department_grants || []).map((gr) => ({
                grant_id: gr.grant_id,
                attachment_id: gr.attachment_id,
                department_id: gr.department_id,
                granted_by: gr.granted_by,
                granted_at: gr.granted_at,
              })),
            ),
          ).map((a) => ({
            id: a.attachment_id.toString(),
            name: a.file_name,
            size: a.file_size
              ? `${Math.round(Number(a.file_size) / 1024)} KB`
              : "N/A",
            type: a.file_type || "Document",
            path: a.file_path,
            downloadUrl: `/api/attachments/${a.attachment_id}/download`,
            uploadedAt: formatFullDateTime(a.uploaded_at),
          })),
          internalNotes,
          hodIntervention,
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
                attachments: (
                  (
                    grievance.resolutions[0] as unknown as {
                      attachments?: Array<{
                        attachment_id: bigint | number;
                        file_name: string;
                        file_size?: bigint | number | null;
                        file_type?: string | null;
                        file_path: string;
                        uploaded_at: Date;
                      }>;
                    }
                  ).attachments || []
                ).map((att) => ({
                  id: att.attachment_id.toString(),
                  name: att.file_name,
                  size: att.file_size
                    ? `${Math.round(Number(att.file_size) / 1024)} KB`
                    : undefined,
                  type: att.file_type || undefined,
                  path: att.file_path,
                  downloadUrl: `/api/attachments/${att.attachment_id}/download`,
                  uploadedAt: formatFullDateTime(att.uploaded_at),
                })),
              }
            : null,
          hasProposedKb:
            ((
              grievance.resolutions?.[0] as unknown as {
                knowledge_articles?: unknown[];
              }
            )?.knowledge_articles?.length ?? 0) > 0,
        },
        isBlocked: isDeptBlocked,
        blockedReason: isDeptBlocked
          ? `Waiting for findings from ${prereqSummary} before investigation can begin.`
          : undefined,
        prerequisiteDepartments: prereqNames,
        currentStage: {
          key: currentStageKey,
          label: currentStageLabel,
          stageNumber: currentStageNumber,
          progressSteps,
        },
        assignment: {
          ...assignment,
          isResolutionAuthority: Boolean(
            hodIntervention?.isResolutionAuthority,
          ),
          resolutionAuthorityName:
            hodIntervention?.resolutionAuthorityName || undefined,
        },
        sla,
        latestActivity,
        timeline,
        internalNotes,
        collaborationNotes,
        supportingFindings,
        departmentsInvolved,
        hodIntervention,
        latestExtension,
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
