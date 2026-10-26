import { AdminDashboard } from "@/components/dashboard/admin/admin-dashboard";
import {
  PRIORITY_COLORS,
  SLA_COLORS,
  STATUS_COLORS,
} from "@/lib/constants/chart-colors";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getPrimaryDepartment } from "@/lib/utils/grievance-departments";
import type {
  DashboardDepartmentSummary,
  DashboardRecentGrievance,
} from "@/types/admin/dashboard";

export default async function AdminDashboardPage() {
  await requirePageRole("ADMIN");

  // 1. Fetch real database metrics and overview records with database-level aggregations
  const [
    routingExceptionsCount,
    departments,
    recentGrievances,
    statusGroups,
    priorityGroups,
    slaGroups,
  ] = await Promise.all([
    prisma.grievances.count({
      where: {
        status: "SUBMITTED",
        grievance_departments: { none: {} },
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
      take: 50,
      orderBy: { created_at: "desc" },
      select: {
        grievance_id: true,
        grievance_number: true,
        title: true,
        priority: true,
        status: true,
        created_at: true,
        categories: {
          select: { category_name: true },
        },
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        grievance_departments: {
          where: { involvement_type: "PRIMARY" },
          select: {
            involvement_type: true,
            departments: {
              select: {
                department_name: true,
              },
            },
          },
        },
      },
    }),
    prisma.grievances.groupBy({
      by: ["status"],
      where: {
        status: { notIn: ["CLOSED", "RESOLVED"] },
      },
      _count: { _all: true },
    }),
    prisma.grievances.groupBy({
      by: ["priority"],
      where: {
        status: { notIn: ["CLOSED", "RESOLVED"] },
      },
      _count: { _all: true },
    }),
    prisma.grievances.groupBy({
      by: ["sla_status"],
      where: {
        status: { notIn: ["CLOSED", "RESOLVED"] },
      },
      _count: { _all: true },
    }),
  ]);

  let inProgress = 0,
    assigned = 0,
    unassigned = 0,
    reopened = 0;
  for (const sg of statusGroups) {
    const count = sg._count._all;
    if (sg.status === "SUBMITTED" || sg.status === "ROUTED")
      unassigned += count;
    else if (sg.status === "ASSIGNED") assigned += count;
    else if (sg.status === "REOPENED" || sg.status === "REOPEN_REVIEW")
      reopened += count;
    else inProgress += count;
  }

  let critical = 0,
    high = 0,
    medium = 0,
    low = 0;
  for (const pg of priorityGroups) {
    const count = pg._count._all;
    if (pg.priority === "CRITICAL") critical += count;
    else if (pg.priority === "HIGH") high += count;
    else if (pg.priority === "MEDIUM") medium += count;
    else low += count;
  }

  let onTrack = 0,
    atRisk = 0,
    breached = 0;
  for (const slg of slaGroups) {
    const count = slg._count._all;
    if (slg.sla_status === "BREACHED") breached += count;
    else if (slg.sla_status === "AT_RISK") atRisk += count;
    else onTrack += count;
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
        getPrimaryDepartment(g)?.departments?.department_name || null,
      category_name: g.categories?.category_name || null,
    }));

  return (
    <AdminDashboard
      routingExceptionsCount={routingExceptionsCount}
      departments={serializedDepartments}
      recentGrievances={serializedRecentGrievances}
      pieCharts={pieCharts}
    />
  );
}
