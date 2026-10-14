import {
  AdminGrievanceTable,
  type SerializedGrievance,
} from "@/components/dashboard/admin/admin-grievance-management";
import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getPrimaryDepartment } from "@/lib/utils/grievance-departments";

export default async function AdminGrievancesPage() {
  const user = await requirePageRole("ADMIN");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  interface AggregatedCountsRow {
    all_count: number;
    exception_count: number;
    active_count: number;
    sla_risk_count: number;
    closed_count: number;
    sla_critical_count: number;
    reopened_count: number;
    escalated_count: number;
  }

  const [rawGrievances, departments, countsResult, categoriesData] =
    await Promise.all([
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
      prisma.$queryRaw<AggregatedCountsRow[]>`
        SELECT
          COUNT(*)::int AS all_count,
          COUNT(*) FILTER (
            WHERE status = 'SUBMITTED' 
            OR NOT EXISTS (SELECT 1 FROM grievance_departments gd WHERE gd.grievance_id = grievances.grievance_id)
          )::int AS exception_count,
          COUNT(*) FILTER (
            WHERE status IN ('ROUTED', 'ASSIGNED', 'IN_PROGRESS', 'UNDER_REVIEW')
          )::int AS active_count,
          COUNT(*) FILTER (
            WHERE sla_status = 'AT_RISK'
          )::int AS sla_risk_count,
          COUNT(*) FILTER (
            WHERE status IN ('CLOSED', 'RESOLVED')
          )::int AS closed_count,
          COUNT(*) FILTER (
            WHERE sla_status = 'BREACHED' OR status = 'ESCALATED'
          )::int AS sla_critical_count,
          COUNT(*) FILTER (
            WHERE reopen_count > 0 OR status IN ('REOPENED', 'REOPEN_REVIEW')
          )::int AS reopened_count,
          COUNT(*) FILTER (
            WHERE status = 'ESCALATED'
          )::int AS escalated_count
        FROM grievances;
      `,
      prisma.categories.findMany({
        select: { category_name: true },
        orderBy: { category_name: "asc" },
      }),
    ]);

  const countsRow = countsResult[0] || {
    all_count: 0,
    exception_count: 0,
    active_count: 0,
    sla_risk_count: 0,
    closed_count: 0,
    sla_critical_count: 0,
    reopened_count: 0,
    escalated_count: 0,
  };

  const serializedGrievances: SerializedGrievance[] = rawGrievances.map((g) => {
    const ticketLinks = g.grievance_departments;
    const primaryLink = ticketLinks.find(
      (l) => l.involvement_type === "PRIMARY",
    );
    const supportingLinks = ticketLinks.filter(
      (l) => l.involvement_type === "SUPPORTING",
    );

    return {
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
        primaryLink?.departments?.department_name ||
        getPrimaryDepartment(g)?.departments?.department_name ||
        null,
      supporting_departments: supportingLinks.map((s) => ({
        department_id: s.department_id.toString(),
        department_name: s.departments.department_name,
      })),
      reopen_count: g.reopen_count,
      manual_review_count: g.manual_review_count,
    };
  });

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
      designation="System Administrator"
      departmentName={
        user.departments?.department_name || "Central Administration"
      }
      title="Grievance Central & Routing Exceptions"
      subtitle="Complete organizational ticket log, SLA tracking & manual assignment exceptions"
    >
      <AdminGrievanceTable
        initialGrievances={serializedGrievances}
        initialTotalCount={countsRow.all_count}
        initialCounts={{
          all: countsRow.all_count,
          exceptions: countsRow.exception_count,
          active: countsRow.active_count,
          inProgress: countsRow.active_count,
          slaRisk: countsRow.sla_risk_count,
          slaCritical: countsRow.sla_critical_count,
          reopened: countsRow.reopened_count,
          escalated: countsRow.escalated_count,
          closed: countsRow.closed_count,
        }}
        departments={serializedDepartments}
        categories={categoriesData.map((c) => c.category_name)}
      />
    </DashboardShell>
  );
}
