import { type NextRequest, NextResponse } from "next/server";
import { evaluateAllActiveGrievancesSla } from "@/lib/engines/sla-engine";
import { prisma } from "@/lib/prisma";
import { resolveStaffAuth } from "@/lib/staff/permissions";
import { calculateSlaStatus } from "@/lib/staff/utils";
import type {
  StaffGrievanceItem,
  StaffInvolvedDepartment,
  StaffPriority,
  StaffSlaState,
} from "@/types/staff";

export async function GET(req: NextRequest) {
  try {
    const authResult = await resolveStaffAuth();
    if ("error" in authResult) return authResult.error;
    const { staffId } = authResult;

    if (authResult.departmentId) {
      try {
        await evaluateAllActiveGrievancesSla(authResult.departmentId);
      } catch (slaErr) {
        console.warn("[Staff Queue API] SLA evaluation error:", slaErr);
      }
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const priorityParam = searchParams.get("priority");
    const searchParam = searchParams.get("search");

    const assignmentQuery = {
      include: {
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
            grievance_departments: {
              include: {
                departments: true,
                assignments: {
                  include: { users_assignments_staff_idTousers: true },
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
        grievance_departments: {
          include: {
            departments: true,
          },
        },
      },
    };

    // Fetch grievances where this staff member is currently or previously assigned
    let assignments = await prisma.assignments.findMany({
      where: {
        staff_id: staffId,
        assignment_status: { in: ["ASSIGNED", "CO_ASSIGNED", "COMPLETED"] },
      },
      ...assignmentQuery,
      orderBy: { assigned_at: "desc" },
    });

    if (assignments.length === 0 && authResult.isAdmin) {
      assignments = await prisma.assignments.findMany({
        where: {
          assignment_status: "ASSIGNED",
          ...(authResult.departmentId
            ? {
                grievance_departments: {
                  department_id: authResult.departmentId,
                },
              }
            : {}),
        },
        take: 40,
        ...assignmentQuery,
        orderBy: { assigned_at: "desc" },
      });
    }

    // Deduplicate assignments by grievance_id
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

    const items: StaffGrievanceItem[] = uniqueAssignments.map((a) => {
      const g = a.grievances;
      const submitter = g.users;
      const submitterFullName = submitter
        ? `${submitter.first_name} ${submitter.last_name || ""}`.trim()
        : "Complainant";

      const myDeptStatus = a.grievance_departments?.status || "ASSIGNED";
      const isMyDeptCompleted =
        myDeptStatus === "COMPLETED" ||
        a.assignment_status === "COMPLETED" ||
        Boolean(a.grievance_departments?.completed_at);
      const completedAt =
        a.grievance_departments?.completed_at ||
        a.completed_at ||
        (isMyDeptCompleted ? new Date() : null);

      const activeSla = g.sla_tracking?.[0];
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
          activeSla?.started_at ||
          g.created_at;
        const deptDue =
          a.grievance_departments?.due_at || activeSla?.due_at || g.due_at;
        const deptSlaStatus =
          a.grievance_departments?.sla_status || g.sla_status;
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

      const activeDept = g.grievance_departments?.find(
        (gd) =>
          gd.status === "IN_PROGRESS" ||
          gd.status === "ASSIGNED" ||
          gd.status === "PENDING_ASSIGNMENT",
      );
      const activeDepartmentName =
        activeDept?.departments?.department_name || undefined;

      const isEscalatedByThreshold =
        (slaCalc.consumptionPercent >= policyAtRisk ||
          slaCalc.state === "BREACHED" ||
          g.status === "ESCALATED") &&
        g.status !== "CLOSED" &&
        g.status !== "RESOLVED" &&
        g.status !== "AWAITING_INFORMATION" &&
        g.status !== "WAITING_ON_USER" &&
        !isMyDeptCompleted;

      const effectiveStatus = (
        isEscalatedByThreshold
          ? "ESCALATED"
          : g.status === "CLOSED"
            ? "CLOSED"
            : g.status === "RESOLVED"
              ? "RESOLVED"
              : g.status === "AWAITING_INFORMATION" ||
                  g.status === "WAITING_ON_USER"
                ? "AWAITING_INFORMATION"
                : g.status === "RESOLUTION_PENDING_APPROVAL" ||
                    g.status === "UNDER_REVIEW"
                  ? "RESOLUTION_PENDING_APPROVAL"
                  : g.status === "REWORK"
                    ? "REWORK"
                    : isMyDeptCompleted
                      ? "COMPLETED"
                      : myDeptStatus === "ASSIGNED"
                        ? "ASSIGNED"
                        : myDeptStatus === "IN_PROGRESS"
                          ? "IN_PROGRESS"
                          : g.status
      ) as StaffGrievanceItem["status"];

      const rawDepts = g.grievance_departments || [];
      const departmentsInvolved: StaffInvolvedDepartment[] = rawDepts.map(
        (gd) => {
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

          const staffUser =
            primaryAssignment?.users_assignments_staff_idTousers;
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
            isMyAssignment:
              gd.grievance_department_id === a.grievance_department_id,
          };
        },
      );

      const isCrossDepartment = departmentsInvolved.length > 1;
      const collaboratingDepartments = departmentsInvolved.map(
        (d) => d.departmentName,
      );

      return {
        id: String(g.grievance_id),
        grievanceNumber: g.grievance_number,
        title: g.title,
        description: g.description,
        category: g.categories?.category_name || "General",
        subcategory: g.subcategories?.subcategory_name || "General",
        priority: g.priority as StaffPriority,
        status: effectiveStatus,
        reopenCount: g.reopen_count,
        manualReviewCount: g.manual_review_count,
        slaStatus: slaCalc.state as StaffSlaState,
        slaConsumptionPercent: slaCalc.consumptionPercent,
        slaTimeLeft: slaCalc.timeRemaining,
        dueAt: g.due_at ? g.due_at.toISOString() : null,
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
          (
            g.sla_tracking?.[0]?.sla_policies?.trigger_condition as
              | Record<string, unknown>
              | undefined
          )?.warning_threshold_percent ||
            g.sla_tracking?.[0]?.sla_policies?.warning_threshold_percent ||
            50,
        ),
        escalationThresholdPercent: Number(
          (
            g.sla_tracking?.[0]?.sla_policies?.trigger_condition as
              | Record<string, unknown>
              | undefined
          )?.at_risk_threshold_percent ||
            (
              g.sla_tracking?.[0]?.sla_policies?.trigger_condition as
                | Record<string, unknown>
                | undefined
            )?.escalation_threshold_percent ||
            g.sla_tracking?.[0]?.sla_policies?.escalation_threshold_percent ||
            75,
        ),
        targetDurationMinutes:
          g.sla_tracking?.[0]?.sla_policies?.target_duration_minutes || null,
        submittedAt: g.created_at.toISOString(),
        assignedAt: a.assigned_at.toISOString(),
        submitterName: submitterFullName,
        submitterEmail: submitter?.email || "",
        submitterRole: submitter?.roles?.role_name || "EMPLOYEE",
        hasResolution: g.resolutions.length > 0,
        hasProposedKb:
          ((
            g.resolutions[0] as unknown as {
              knowledge_articles?: unknown[];
            }
          )?.knowledge_articles?.length ?? 0) > 0,
        submittedResolution: g.resolutions[0]
          ? {
              id: g.resolutions[0].resolution_id.toString(),
              submittedByUserId: g.resolutions[0].submitted_by.toString(),
              submittedByRole:
                g.resolutions[0].users?.roles?.role_name || undefined,
              problemSummary: g.resolutions[0].problem_summary,
              findings: g.resolutions[0].findings,
              actionTaken: g.resolutions[0].action_taken,
              outcome: g.resolutions[0].outcome,
              evidence: g.resolutions[0].evidence,
              submittedAt: g.resolutions[0].submitted_at.toISOString(),
            }
          : null,
        overallStatus: g.status,
        activeDepartmentName,
        myDepartmentStatus: myDeptStatus,
        isMyDepartmentCompleted: isMyDeptCompleted,
        departmentsInvolved,
        isCrossDepartment,
        collaboratingDepartments,
        latestExtension: g.sla_extensions?.[0]
          ? {
              id: g.sla_extensions[0].extension_id.toString(),
              status: g.sla_extensions[0].status as
                | "PENDING"
                | "APPROVED"
                | "REJECTED",
              requestedMinutes: g.sla_extensions[0].requested_duration_minutes,
              grantedMinutes: g.sla_extensions[0].granted_duration_minutes,
              reason: g.sla_extensions[0].reason,
              createdAt: g.sla_extensions[0].created_at.toISOString(),
            }
          : null,
      };
    });

    // Optional query parameter filtering
    let filtered = items;
    if (statusParam && statusParam !== "ALL") {
      filtered = filtered.filter(
        (i) => i.status.toUpperCase() === statusParam.toUpperCase(),
      );
    }
    if (priorityParam && priorityParam !== "ALL") {
      filtered = filtered.filter(
        (i) => i.priority.toUpperCase() === priorityParam.toUpperCase(),
      );
    }
    if (searchParam?.trim()) {
      const q = searchParam.toLowerCase().trim();
      filtered = filtered.filter(
        (i) =>
          i.grievanceNumber.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.submitterName.toLowerCase().includes(q),
      );
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      grievances: filtered,
    });
  } catch (error) {
    console.error("Staff grievances API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
