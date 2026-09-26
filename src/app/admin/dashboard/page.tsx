import { AdminDashboard } from "@/components/dashboard/admin/admin-dashboard";
import { DashboardShell } from "@/components/dashboard/shell";
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
      where: { status: "SUBMITTED" },
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
  ]);

  const resolutionRate =
    totalGrievances > 0
      ? ((closedCount / totalGrievances) * 100).toFixed(1)
      : "100";

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
        totalGrievances={totalGrievances}
        activeGrievances={activeGrievances}
        atRiskSlaCount={atRiskSlaCount}
        escalatedCount={escalatedCount}
        closedCount={closedCount}
        resolutionRate={resolutionRate}
        routingExceptionsCount={routingExceptionsCount}
        departments={serializedDepartments}
        recentGrievances={serializedRecentGrievances}
      />
    </DashboardShell>
  );
}
