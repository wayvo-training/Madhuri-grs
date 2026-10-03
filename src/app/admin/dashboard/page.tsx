import { AdminDashboard } from "@/components/dashboard/admin/admin-dashboard";
import { DashboardShell } from "@/components/dashboard/shell";
import {
  PRIORITY_COLORS,
  SLA_COLORS,
  STATUS_COLORS,
} from "@/lib/constants/chart-colors";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type {
  DashboardDepartmentSummary,
  DashboardRecentGrievance,
} from "@/types/admin/dashboard";

export default async function AdminDashboardPage() {
  const user = await requirePageRole("ADMIN");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  // 1. Fetch real database metrics and overview records
  const [
    totalGrievances,
    activeGrievances,
    escalatedCount,
    closedCount,
    atRiskSlaCount,
    routingExceptionsCount,
    departments,
    recentGrievances,
    allGrievances,
  ] = await Promise.all([
    prisma.grievances.count(),
    prisma.grievances.count({
      where: {
        status: {
          in: [
            "SUBMITTED",
            "ROUTED",
            "ASSIGNED",
            "IN_PROGRESS",
            "UNDER_REVIEW",
            "REOPENED",
            "REOPEN_REVIEW",
          ],
        },
      },
    }),
    prisma.grievances.count({ where: { status: "ESCALATED" } }),
    prisma.grievances.count({ where: { status: "CLOSED" } }),
    prisma.grievances.count({
      where: { sla_status: { in: ["AT_RISK", "BREACHED"] } },
    }),
    prisma.grievances.count({
      where: {
        status: "SUBMITTED",
        grievance_departments: { is: null },
      },
    }),
    prisma.departments.findMany({
      where: { status: "ACTIVE" },
      select: {
        department_id: true,
        department_name: true,
        status: true,
        _count: {
          select: { grievance_departments: true, users: true },
        },
      },
      orderBy: { department_name: "asc" },
    }),
    prisma.grievances.findMany({
      take: 6,
      orderBy: { created_at: "desc" },
      include: {
        categories: true,
        subcategories: true,
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        grievance_departments: {
          where: { involvement_type: "PRIMARY" },
          include: {
            departments: true,
          },
        },
      },
    }),
    prisma.grievances.findMany({
      select: {
        status: true,
        priority: true,
        sla_status: true,
      },
    }),
  ]);

  let inProgress = 0,
    assigned = 0,
    unassigned = 0,
    reopened = 0;
  let critical = 0,
    high = 0,
    medium = 0,
    low = 0;
  let onTrack = 0,
    atRisk = 0,
    breached = 0;

  for (const g of allGrievances) {
    if (g.status === "CLOSED" || g.status === "RESOLVED") continue;

    // Status Breakdown (Active only)
    if (g.status === "SUBMITTED" || g.status === "ROUTED") unassigned++;
    else if (g.status === "ASSIGNED") assigned++;
    else if (g.status === "REOPENED" || g.status === "REOPEN_REVIEW")
      reopened++;
    else inProgress++;

    // Priority and SLA (only for active)
    if (g.priority === "CRITICAL") critical++;
    else if (g.priority === "HIGH") high++;
    else if (g.priority === "MEDIUM") medium++;
    else low++;

    if (g.sla_status === "BREACHED") breached++;
    else if (g.sla_status === "AT_RISK") atRisk++;
    else onTrack++;
  }

  const pieCharts = {
    statusData: [
      {
        name: "In Progress",
        value: inProgress,
        fill: STATUS_COLORS.IN_PROGRESS,
        description: "Being processed",
      },
      {
        name: "Assigned",
        value: assigned,
        fill: STATUS_COLORS.ASSIGNED,
        description: "Assigned to staff",
      },
      {
        name: "Unassigned",
        value: unassigned,
        fill: STATUS_COLORS.UNASSIGNED,
        description: "Awaiting assignment",
      },
      {
        name: "Reopened",
        value: reopened,
        fill: STATUS_COLORS.REOPENED,
        description: "Reopened for review",
      },
    ],
    priorityData: [
      {
        name: "Critical",
        value: critical,
        fill: PRIORITY_COLORS.CRITICAL,
        description: "Requires immediate attention",
      },
      {
        name: "High",
        value: high,
        fill: PRIORITY_COLORS.HIGH,
        description: "High priority, early resolution required",
      },
      {
        name: "Medium",
        value: medium,
        fill: PRIORITY_COLORS.MEDIUM,
        description: "Normal priority",
      },
      {
        name: "Low",
        value: low,
        fill: PRIORITY_COLORS.LOW,
        description: "Low priority",
      },
    ],
    slaData: [
      {
        name: "On Track",
        value: onTrack,
        fill: SLA_COLORS.ON_TRACK,
        description: "Within SLA targets",
      },
      {
        name: "At Risk",
        value: atRisk,
        fill: SLA_COLORS.AT_RISK,
        description: "Approaching SLA limit",
      },
      {
        name: "Breached",
        value: breached,
        fill: SLA_COLORS.BREACHED,
        description: "Exceeded SLA limit",
      },
    ],
    totalActive: inProgress + assigned + unassigned + reopened,
    totalPriority: critical + high + medium + low,
    totalSla: onTrack + atRisk + breached,
  };

  const serializedDepartments: DashboardDepartmentSummary[] = departments.map(
    (d) => ({
      department_id: d.department_id.toString(),
      department_name: d.department_name,
      status: d.status,
      user_count: d._count.users,
      grievance_count: d._count.grievance_departments,
    }),
  );

  const serializedRecentGrievances: DashboardRecentGrievance[] =
    recentGrievances.map((g) => ({
      grievance_id: g.grievance_id.toString(),
      grievance_number: g.grievance_number,
      title: g.title,
      priority: g.priority,
      status: g.status,
      created_at: g.created_at.toISOString(),
      submitter_name: g.users
        ? `${g.users.first_name} ${g.users.last_name || ""}`.trim()
        : "Anonymous",
      department_name:
        (
          g.grievance_departments as unknown as {
            departments?: { department_name?: string };
          }
        )?.departments?.department_name || null,
      category_name: g.categories?.category_name || null,
    }));

  return (
    <DashboardShell
      userRole="ADMIN"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Admin Control Center"
      subtitle="Executive system oversight, operational health & enterprise governance"
    >
      <AdminDashboard
        routingExceptionsCount={routingExceptionsCount}
        departments={serializedDepartments}
        recentGrievances={serializedRecentGrievances}
        pieCharts={pieCharts}
      />
    </DashboardShell>
  );
}
