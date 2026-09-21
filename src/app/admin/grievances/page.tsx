import {
  AdminGrievanceTable,
  type SerializedGrievance,
} from "@/components/dashboard/admin/admin-grievance-table";
import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function AdminGrievancesPage() {
  const user = await requirePageRole("ADMIN");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  const [
    rawGrievances,
    departments,
    totalGrievancesCount,
    [allCount, exceptionCount, activeCount, slaRiskCount, closedCount],
  ] = await Promise.all([
    prisma.grievances.findMany({
      take: 10,
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
    prisma.departments.findMany({
      where: { status: "ACTIVE" },
      select: {
        department_id: true,
        department_name: true,
        _count: {
          select: { grievance_departments: true },
        },
      },
      orderBy: { department_name: "asc" },
    }),
    prisma.grievances.count(),
    Promise.all([
      prisma.grievances.count(),
      prisma.grievances.count({
        where: {
          OR: [
            { status: "SUBMITTED" },
            { grievance_departments: { is: null } },
          ],
        },
      }),
      prisma.grievances.count({
        where: {
          status: {
            in: [
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
      prisma.grievances.count({
        where: { sla_status: { in: ["AT_RISK", "BREACHED"] } },
      }),
      prisma.grievances.count({
        where: { status: "CLOSED" },
      }),
    ]),
  ]);

  const serializedGrievances: SerializedGrievance[] = rawGrievances.map(
    (g) => ({
      grievance_id: g.grievance_id.toString(),
      grievance_number: g.grievance_number,
      title: g.title,
      description: g.description,
      priority: g.priority,
      status: g.status,
      sla_status: g.sla_status,
      due_at: g.due_at ? g.due_at.toISOString() : null,
      created_at: g.created_at.toISOString(),
      category_name: g.categories.category_name,
      subcategory_name: g.subcategories.subcategory_name,
      submitted_by_name:
        `${g.users.first_name} ${g.users.last_name || ""}`.trim(),
      submitted_by_email: g.users.email,
      department_name:
        g.grievance_departments?.departments?.department_name || null,
      reopen_count: g.reopen_count,
      manual_review_count: g.manual_review_count,
    }),
  );

  const serializedDepartments = departments.map((d) => ({
    department_id: d.department_id.toString(),
    department_name: d.department_name,
    grievance_count: d._count.grievance_departments,
  }));

  return (
    <DashboardShell
      userRole="ADMIN"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Grievance Central & Routing Exceptions"
      subtitle="Complete organizational ticket log, SLA tracking & manual assignment exceptions"
    >
      <AdminGrievanceTable
        initialGrievances={serializedGrievances}
        initialTotalCount={totalGrievancesCount}
        initialCounts={{
          all: allCount,
          exceptions: exceptionCount,
          active: activeCount,
          slaRisk: slaRiskCount,
          closed: closedCount,
        }}
        departments={serializedDepartments}
      />
    </DashboardShell>
  );
}
