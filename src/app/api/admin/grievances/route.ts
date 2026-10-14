import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getPrimaryDepartment } from "@/lib/utils/grievance-departments";

export async function GET(request: Request) {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("limit") || "10", 10)),
    );
    const tab = (searchParams.get("tab") || "ALL").toUpperCase();
    const search = searchParams.get("search")?.trim() || "";
    const department = searchParams.get("department") || "ALL";
    const priority = searchParams.get("priority") || "ALL";
    const status = searchParams.get("status") || "ALL";
    const slaStatus = searchParams.get("sla_status") || "ALL";

    const conditions: Prisma.grievancesWhereInput[] = [];

    // 1. Tab condition
    if (tab === "EXCEPTIONS") {
      conditions.push({
        status: "SUBMITTED",
        grievance_departments: { none: {} },
      });
    } else if (tab === "ACTIVE" || tab === "IN_PROGRESS") {
      conditions.push({
        status: {
          in: ["ROUTED", "ASSIGNED", "IN_PROGRESS", "UNDER_REVIEW"],
        },
      });
    } else if (tab === "SLA_RISK") {
      conditions.push({
        sla_status: "AT_RISK",
      });
    } else if (tab === "SLA_CRITICAL") {
      conditions.push({
        OR: [{ sla_status: "BREACHED" }, { status: "ESCALATED" }],
      });
    } else if (tab === "REOPENED") {
      conditions.push({
        OR: [
          { reopen_count: { gt: 0 } },
          { status: { in: ["REOPENED", "REOPEN_REVIEW"] } },
        ],
      });
    } else if (tab === "ESCALATED") {
      conditions.push({
        status: "ESCALATED",
      });
    } else if (tab === "CLOSED") {
      conditions.push({
        status: { in: ["CLOSED", "RESOLVED"] },
      });
    }

    // 2. Search keyword condition
    if (search) {
      conditions.push({
        OR: [
          { grievance_number: { contains: search, mode: "insensitive" } },
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { users: { first_name: { contains: search, mode: "insensitive" } } },
          { users: { last_name: { contains: search, mode: "insensitive" } } },
          { users: { email: { contains: search, mode: "insensitive" } } },
          {
            categories: {
              category_name: { contains: search, mode: "insensitive" },
            },
          },
          {
            subcategories: {
              subcategory_name: { contains: search, mode: "insensitive" },
            },
          },
        ],
      });
    }

    // 3. Department filter
    if (department !== "ALL") {
      const depts = department.split(",");
      conditions.push({
        grievance_departments: {
          some: {
            departments: {
              department_name: { in: depts },
            },
          },
        },
      });
    }

    // 4. Priority filter
    if (priority !== "ALL") {
      const prios = priority.split(",");
      conditions.push({ priority: { in: prios } });
    }

    // 5. Status filter
    if (status !== "ALL") {
      const stats = status.split(",");
      conditions.push({ status: { in: stats } });
    }

    // 6. SLA Status filter
    if (slaStatus !== "ALL") {
      const slas = slaStatus.split(",");
      conditions.push({ sla_status: { in: slas } });
    }

    const where: Prisma.grievancesWhereInput =
      conditions.length > 0 ? { AND: conditions } : {};

    const skip = (page - 1) * limit;

    const isUnfilteredAll = conditions.length === 0;

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

    const [countsResult, rawGrievances, filteredCount] = await Promise.all([
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
      prisma.grievances.findMany({
        where,
        skip,
        take: limit,
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
      isUnfilteredAll
        ? Promise.resolve(null)
        : prisma.grievances.count({ where }),
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

    const total = filteredCount ?? countsRow.all_count;

    const serializedGrievances = rawGrievances.map((g) => {
      const ticketLinks = g.grievance_departments;
      const primaryLink = ticketLinks.find(
        (l) => l.involvement_type === "PRIMARY",
      );
      const equalLinks = ticketLinks.filter(
        (l) => l.involvement_type === "EQUAL",
      );
      const supportingLinks = ticketLinks.filter(
        (l) => l.involvement_type === "SUPPORTING",
      );

      const isEqualInvolvement = equalLinks.length > 0;
      const primaryDeptName =
        primaryLink?.departments?.department_name ||
        equalLinks[0]?.departments?.department_name ||
        getPrimaryDepartment(g)?.departments?.department_name ||
        null;

      const otherEqualDepts = equalLinks.slice(1).map((s) => ({
        department_id: s.department_id.toString(),
        department_name: `${s.departments.department_name} (Joint Co-Lead)`,
      }));

      const normalSupporting = supportingLinks.map((s) => ({
        department_id: s.department_id.toString(),
        department_name: s.departments.department_name,
      }));

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
        department_name: primaryDeptName,
        involvement_type: isEqualInvolvement
          ? "EQUAL"
          : primaryLink
            ? "PRIMARY"
            : null,
        supporting_departments: [...otherEqualDepts, ...normalSupporting],
        reopen_count: g.reopen_count,
        manual_review_count: g.manual_review_count,
      };
    });

    return NextResponse.json({
      success: true,
      grievances: serializedGrievances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      counts: {
        all: countsRow.all_count,
        exceptions: countsRow.exception_count,
        active: countsRow.active_count,
        inProgress: countsRow.active_count,
        slaRisk: countsRow.sla_risk_count,
        closed: countsRow.closed_count,
        slaCritical: countsRow.sla_critical_count,
        reopened: countsRow.reopened_count,
        escalated: countsRow.escalated_count,
      },
    });
  } catch (error) {
    console.error("Failed to fetch grievances with pagination:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error fetching grievances.",
      },
      { status: 500 },
    );
  }
}
