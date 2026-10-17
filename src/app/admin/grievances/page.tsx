import type { Prisma } from "@prisma/client";
import {
  AdminGrievanceTable,
  type SerializedGrievance,
} from "@/components/dashboard/admin/admin-grievance-management";
import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getPrimaryDepartment } from "@/lib/utils/grievance-departments";
import type { TableTab } from "@/types/admin/grievances";

export default async function AdminGrievancesPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requirePageRole("ADMIN");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  const searchParams = props.searchParams ? await props.searchParams : {};
  const rawTab = (
    typeof searchParams.tab === "string" ? searchParams.tab : "ALL"
  ).toUpperCase();
  const rawStatus =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const rawPriority =
    typeof searchParams.priority === "string"
      ? searchParams.priority
      : undefined;
  const rawSla =
    typeof searchParams.sla_status === "string"
      ? searchParams.sla_status
      : typeof searchParams.sla === "string"
        ? searchParams.sla
        : undefined;
  const rawSearch =
    typeof searchParams.search === "string" ? searchParams.search.trim() : "";
  const rawDept =
    typeof searchParams.department === "string"
      ? searchParams.department
      : undefined;

  const conditions: Prisma.grievancesWhereInput[] = [];

  // 1. Tab condition
  if (rawTab === "EXCEPTIONS") {
    conditions.push({
      status: "SUBMITTED",
      grievance_departments: { none: {} },
    });
  } else if (rawTab === "ACTIVE" || rawTab === "IN_PROGRESS") {
    conditions.push({
      status: {
        notIn: ["CLOSED", "RESOLVED"],
      },
    });
  } else if (rawTab === "SLA_RISK") {
    conditions.push({
      sla_status: "AT_RISK",
    });
  } else if (rawTab === "SLA_CRITICAL") {
    conditions.push({
      OR: [{ sla_status: "BREACHED" }, { status: "ESCALATED" }],
    });
  } else if (rawTab === "REOPENED") {
    conditions.push({
      OR: [
        { reopen_count: { gt: 0 } },
        { status: { in: ["REOPENED", "REOPEN_REVIEW"] } },
      ],
    });
  } else if (rawTab === "ESCALATED") {
    conditions.push({
      status: "ESCALATED",
    });
  } else if (rawTab === "CLOSED") {
    conditions.push({
      status: { in: ["CLOSED", "RESOLVED"] },
    });
  }

  // 2. Status filter
  let parsedStatuses: string[] = [];
  if (rawStatus && rawStatus !== "ALL") {
    let stats = rawStatus.split(",").map((s) => s.trim().toUpperCase());
    if (stats.includes("UNASSIGNED")) {
      stats = stats
        .filter((s) => s !== "UNASSIGNED")
        .concat(["SUBMITTED", "ROUTED"]);
    }
    if (stats.includes("IN_PROGRESS")) {
      if (!stats.includes("UNDER_REVIEW")) stats.push("UNDER_REVIEW");
      if (!stats.includes("ESCALATED")) stats.push("ESCALATED");
    }
    if (stats.includes("REOPENED") && !stats.includes("REOPEN_REVIEW")) {
      stats.push("REOPEN_REVIEW");
    }
    parsedStatuses = stats;
    conditions.push({ status: { in: stats } });
  }

  // 3. Priority filter
  let parsedPriorities: string[] = [];
  if (rawPriority && rawPriority !== "ALL") {
    parsedPriorities = rawPriority
      .split(",")
      .map((p) => p.trim().toUpperCase());
    conditions.push({ priority: { in: parsedPriorities } });
  }

  // 4. SLA filter
  let parsedSlas: string[] = [];
  if (rawSla && rawSla !== "ALL") {
    let slas = rawSla.split(",").map((s) => s.trim().toUpperCase());
    slas = slas.map((s) => {
      if (s === "SLA_CRITICAL") return "BREACHED";
      if (s === "SLA_RISK") return "AT_RISK";
      return s;
    });
    parsedSlas = slas;
    conditions.push({ sla_status: { in: slas } });
  }

  // 5. Department filter
  let parsedDepts: string[] = [];
  if (rawDept && rawDept !== "ALL") {
    parsedDepts = rawDept.split(",");
    conditions.push({
      grievance_departments: {
        some: {
          departments: {
            department_name: { in: parsedDepts },
          },
        },
      },
    });
  }

  // 6. Search keyword
  if (rawSearch) {
    conditions.push({
      OR: [
        { grievance_number: { contains: rawSearch, mode: "insensitive" } },
        { title: { contains: rawSearch, mode: "insensitive" } },
        { description: { contains: rawSearch, mode: "insensitive" } },
        { users: { first_name: { contains: rawSearch, mode: "insensitive" } } },
        { users: { last_name: { contains: rawSearch, mode: "insensitive" } } },
        { users: { email: { contains: rawSearch, mode: "insensitive" } } },
        {
          categories: {
            category_name: { contains: rawSearch, mode: "insensitive" },
          },
        },
        {
          subcategories: {
            subcategory_name: { contains: rawSearch, mode: "insensitive" },
          },
        },
      ],
    });
  }

  const where: Prisma.grievancesWhereInput =
    conditions.length > 0 ? { AND: conditions } : {};

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

  const [
    rawGrievances,
    filteredCount,
    departments,
    countsResult,
    categoriesData,
  ] = await Promise.all([
    prisma.grievances.findMany({
      where,
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
    conditions.length > 0
      ? prisma.grievances.count({ where })
      : Promise.resolve(null),
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

  const initialTotalCount = filteredCount ?? countsRow.all_count;

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

  const initialTabValue: TableTab = [
    "ALL",
    "EXCEPTIONS",
    "ACTIVE",
    "IN_PROGRESS",
    "SLA_RISK",
    "SLA_CRITICAL",
    "REOPENED",
    "ESCALATED",
    "CLOSED",
  ].includes(rawTab)
    ? (rawTab as TableTab)
    : "ALL";

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
        initialTotalCount={initialTotalCount}
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
        initialTab={initialTabValue}
        initialPriority={parsedPriorities}
        initialStatus={parsedStatuses}
        initialSla={parsedSlas}
        initialSearch={rawSearch}
        initialDept={parsedDepts}
      />
    </DashboardShell>
  );
}
