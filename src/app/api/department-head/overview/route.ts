import { NextResponse } from "next/server";
import {
  formatRelativeTime,
  resolveDepartmentHeadAuth,
} from "@/lib/department-head";
import { evaluateAllActiveGrievancesSla } from "@/lib/engines/sla-engine";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await resolveDepartmentHeadAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { departmentId, department, isAdmin } = auth;

  try {
    // 0. Proactively evaluate SLA threshold rules for department's active queue
    await evaluateAllActiveGrievancesSla(departmentId);

    // 1. Fetch grievance department records for this department
    const deptGrievances = await prisma.grievance_departments.findMany({
      where: { department_id: departmentId },
      include: {
        grievances: {
          include: {
            assignments: {
              where: { assignment_status: "ASSIGNED" },
              select: { assignment_id: true, staff_id: true },
            },
            grievance_departments: {
              select: { department_id: true, involvement_type: true },
            },
          },
        },
      },
    });

    const grievances = deptGrievances.map((dg) => dg.grievances);
    const grievanceIds = grievances.map((g) => g.grievance_id);

    // Compute Department Metrics
    const totalGrievances = grievances.length;
    let unassignedCount = 0;
    let inProgressCount = 0;
    let atRiskCount = 0;
    let escalatedCount = 0;
    let reopenedCount = 0;
    let crossDeptCount = 0;
    let resolutionReviewCount = 0;
    let highCriticalCount = 0;

    for (const dg of deptGrievances) {
      const g = dg.grievances;
      const hasActiveAssignment = g.assignments.length > 0;
      if (
        !hasActiveAssignment ||
        g.status === "SUBMITTED" ||
        g.status === "ROUTED"
      ) {
        unassignedCount++;
      }
      if (g.status === "IN_PROGRESS" || g.status === "ASSIGNED") {
        inProgressCount++;
      }
      if (g.sla_status === "AT_RISK" || g.sla_status === "BREACHED") {
        atRiskCount++;
      }
      if (g.status === "ESCALATED") {
        escalatedCount++;
      }
      if (
        g.reopen_count > 0 ||
        g.status === "REOPENED" ||
        g.status === "REOPEN_REVIEW"
      ) {
        reopenedCount++;
      }
      if (dg.involvement_type === "SUPPORTING") {
        crossDeptCount++;
      }
      if (g.status === "UNDER_REVIEW") {
        resolutionReviewCount++;
      }
      if (g.priority === "CRITICAL" || g.priority === "HIGH") {
        highCriticalCount++;
      }
    }

    // 2. Fetch staff members belonging to this department
    const staffMembers = await prisma.users.findMany({
      where: {
        department_id: departmentId,
        roles: { role_name: { in: ["STAFF", "DEPARTMENT_HEAD"] } },
      },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        status: true,
        assignments_assignments_staff_idTousers: {
          where: { assignment_status: "ASSIGNED" },
          select: { assignment_id: true },
        },
      },
    });

    const totalStaffCount = staffMembers.length;
    const activeStaffCount = staffMembers.filter(
      (s) => s.status === "ACTIVE",
    ).length;
    const onLeaveStaffCount = staffMembers.filter(
      (s) => s.status === "ON_LEAVE",
    ).length;
    const totalStaffCapacity = totalStaffCount * 8; // standard 8 ticket capacity per officer
    const totalActiveTickets = staffMembers.reduce(
      (acc, s) => acc + s.assignments_assignments_staff_idTousers.length,
      0,
    );
    const capacityUtilization =
      totalStaffCapacity > 0
        ? Math.min(
            100,
            Math.round((totalActiveTickets / totalStaffCapacity) * 100),
          )
        : 0;

    // 3. Fetch recent audit logs for this department's grievances
    const recentAuditLogs =
      grievanceIds.length > 0
        ? await prisma.audit_logs.findMany({
            where: {
              grievance_id: { in: grievanceIds },
            },
            include: {
              users: {
                select: {
                  first_name: true,
                  last_name: true,
                  roles: { select: { role_name: true } },
                },
              },
              grievances: {
                select: { grievance_number: true, status: true },
              },
            },
            orderBy: { created_at: "desc" },
            take: 10,
          })
        : [];

    const formattedAuditFeed = recentAuditLogs.map((log) => {
      const isSystemAction =
        log.action.startsWith("SLA_") ||
        log.action.startsWith("AUTO_") ||
        log.action.startsWith("RULE_") ||
        !log.users;

      const actorName = isSystemAction
        ? "SLA Governance Engine"
        : log.users
          ? `${log.users.first_name} ${log.users.last_name || ""}`.trim()
          : "Automated System";

      const actorRole = isSystemAction
        ? "Automated Engine"
        : log.users?.roles?.role_name || "System";

      const ticketNum = log.grievances?.grievance_number || "Grievance";

      // User-friendly action title
      let formattedAction = `${ticketNum}: ${log.action.replace(/_/g, " ")}`;
      if (log.action === "SLA_100_BREACH_ESCALATED") {
        formattedAction = `${ticketNum}: SLA Breached & Case Escalated`;
      } else if (log.action === "SLA_75_PERCENT_HOD_ALERT") {
        formattedAction = `${ticketNum}: SLA At Risk (75% Threshold Alert)`;
      } else if (log.action === "SLA_50_PERCENT_WARNING") {
        formattedAction = `${ticketNum}: 50% SLA Priority Warning`;
      } else if (log.action === "INTERVENTION_MONITOR") {
        formattedAction = `${ticketNum}: HOD Continuing Monitoring`;
      } else if (log.action === "INTERVENTION_NOTIFY_STAFF") {
        formattedAction = `${ticketNum}: HOD Staff Directive Dispatched`;
      } else if (log.action === "INTERVENTION_REASSIGN") {
        formattedAction = `${ticketNum}: Case Reassigned by HOD`;
      } else if (log.action === "INTERVENTION_CROSS_DEPT") {
        formattedAction = `${ticketNum}: Cross-Department Review Initiated`;
      }

      // Friendly human-readable summary without raw JSON dumping
      let formattedDetails = "";
      const val = log.new_value as Record<string, unknown> | null;

      if (val && typeof val === "object") {
        if (log.action === "SLA_100_BREACH_ESCALATED") {
          const consumption =
            val.consumptionPercent != null
              ? `${Math.round(Number(val.consumptionPercent))}%`
              : "100%";
          const escalatedTo = val.escalatedTo
            ? ` to ${String(val.escalatedTo)}`
            : "";
          formattedDetails = `Critical SLA breach (${consumption} elapsed). Auto-escalated${escalatedTo} for intervention.`;
        } else if (log.action === "SLA_75_PERCENT_HOD_ALERT") {
          const consumption =
            val.consumptionPercent != null
              ? `${Math.round(Number(val.consumptionPercent))}%`
              : "75%";
          formattedDetails = `SLA reached ${consumption} capacity. Department Head alerted for monitoring without auto-reassignment.`;
        } else if (log.action === "SLA_50_PERCENT_WARNING") {
          const consumption =
            val.consumptionPercent != null
              ? `${Math.round(Number(val.consumptionPercent))}%`
              : "50%";
          formattedDetails = `50% SLA consumed (${consumption}). Priority alert dispatched to assigned staff member.`;
        } else if (val.note) {
          formattedDetails = String(val.note);
        } else if (val.remarks) {
          formattedDetails = String(val.remarks);
        } else if (val.reason) {
          formattedDetails = String(val.reason);
        } else if (val.newStatus) {
          formattedDetails = `Status transitioned to ${val.newStatus}.`;
        } else {
          formattedDetails =
            Object.entries(val)
              .filter(
                ([k, v]) =>
                  typeof v !== "object" &&
                  v !== null &&
                  v !== undefined &&
                  k !== "threshold",
              )
              .map(
                ([k, v]) =>
                  `${k.replace(/([A-Z])/g, " $1").toLowerCase()}: ${v}`,
              )
              .join(" • ") || `${log.action} executed on ${ticketNum}`;
        }
      } else if (typeof log.new_value === "string") {
        try {
          const parsed = JSON.parse(log.new_value);
          if (parsed && typeof parsed === "object") {
            const consumption = parsed.consumptionPercent
              ? `${Math.round(parsed.consumptionPercent)}%`
              : "";
            const escalatedTo = parsed.escalatedTo
              ? ` to ${parsed.escalatedTo}`
              : "";
            formattedDetails = consumption
              ? `Critical SLA breach (${consumption} elapsed). Auto-escalated${escalatedTo} for intervention.`
              : `${log.action.replace(/_/g, " ")} on ${ticketNum}`;
          } else {
            formattedDetails = log.new_value;
          }
        } catch {
          formattedDetails = log.new_value;
        }
      } else {
        formattedDetails = `${log.action.replace(/_/g, " ")} executed on ${ticketNum}`;
      }

      return {
        id: log.audit_log_id.toString(),
        timestamp: formatRelativeTime(log.created_at),
        actor: `${actorName} (${actorRole})`,
        action: formattedAction,
        details: formattedDetails,
        stage: log.grievances?.status || "IN_PROGRESS",
      };
    });

    const seenAuditKeys = new Set<string>();
    const deduplicatedFeed = formattedAuditFeed.filter((item) => {
      const key = `${item.action}`;
      if (seenAuditKeys.has(key)) return false;
      seenAuditKeys.add(key);
      return true;
    });

    // 4. Fetch Department Head details for this department
    const deptHead = await prisma.users.findFirst({
      where: {
        department_id: departmentId,
        roles: { role_name: "DEPARTMENT_HEAD" },
        status: "ACTIVE",
      },
      select: {
        first_name: true,
        last_name: true,
        email: true,
        employee_code: true,
      },
    });

    // 5. Fetch all active departments for Admin preview department-switcher
    const allDepartments = isAdmin
      ? (
          await prisma.departments.findMany({
            where: { status: "ACTIVE" },
            orderBy: { department_name: "asc" },
            select: { department_id: true, department_name: true },
          })
        ).map((d) => ({
          id: d.department_id.toString(),
          name: d.department_name,
        }))
      : [];

    return NextResponse.json({
      success: true,
      department: {
        id: department.department_id.toString(),
        name: department.department_name,
        description: department.description,
      },
      head: deptHead
        ? {
            name: `${deptHead.first_name} ${deptHead.last_name || ""}`.trim(),
            email: deptHead.email,
            employeeCode: deptHead.employee_code || "HOD-DEPT-01",
          }
        : null,
      metrics: {
        totalGrievances,
        unassignedCount,
        inProgressCount,
        atRiskCount,
        escalatedCount,
        reopenedCount,
        crossDeptCount,
        resolutionReviewCount,
        highCriticalCount,
        totalStaffCount,
        activeStaffCount,
        onLeaveStaffCount,
        totalStaffCapacity,
        totalActiveTickets,
        capacityUtilization,
      },
      auditFeed: deduplicatedFeed,
      availableDepartments: allDepartments,
    });
  } catch (error) {
    console.error("Error in /api/department-head/overview:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch department overview",
      },
      { status: 500 },
    );
  }
}
