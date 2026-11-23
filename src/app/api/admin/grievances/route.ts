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
    const department = searchParams.get("department")?.trim() || "ALL";
    const priority = searchParams.get("priority")?.trim() || "ALL";
    const status = searchParams.get("status")?.trim() || "ALL";
    const slaStatus = searchParams.get("sla_status")?.trim() || "ALL";

    const conditions: Prisma.grievancesWhereInput[] = [];

    // 1. Tab condition
    if (tab === "EXCEPTIONS") {
      conditions.push({
        status: { in: ["SUBMITTED", "AWAITING_ROUTING"] },
        grievance_departments: { none: {} },
      });
    } else if (tab === "ACTIVE" || tab === "IN_PROGRESS") {
      conditions.push({
        status: {
          notIn: ["CLOSED", "RESOLVED"],
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
          {
            status: {
              in: [
                "REOPENED",
                "RESOLUTION_PENDING_APPROVAL",
                "REWORK",
                "REOPEN_REVIEW",
              ],
            },
          },
        ],
      });
    } else if (tab === "ESCALATED") {
      conditions.push({
        OR: [
          { status: "ESCALATED" },
          { sla_status: "BREACHED" },
          { escalations: { some: { status: "OPEN" } } },
        ],
      });
    } else if (tab === "CLOSED") {
      conditions.push({
        status: { in: ["CLOSED", "RESOLVED"] },
      });
    }

    // 2. Search keyword condition
    if (search) {
      if (search.startsWith("!")) {
        const neg = search.slice(1).trim();
        if (neg) {
          conditions.push({
            NOT: {
              OR: [
                { grievance_number: { contains: neg, mode: "insensitive" } },
                { title: { contains: neg, mode: "insensitive" } },
                { description: { contains: neg, mode: "insensitive" } },
                {
                  users: {
                    first_name: { contains: neg, mode: "insensitive" },
                  },
                },
                {
                  users: { last_name: { contains: neg, mode: "insensitive" } },
                },
                { users: { email: { contains: neg, mode: "insensitive" } } },
                {
                  categories: {
                    category_name: { contains: neg, mode: "insensitive" },
                  },
                },
                {
                  subcategories: {
                    subcategory_name: { contains: neg, mode: "insensitive" },
                  },
                },
              ],
            },
          });
        }
      } else {
        conditions.push({
          OR: [
            { grievance_number: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            {
              users: { first_name: { contains: search, mode: "insensitive" } },
            },
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
    }

    // 3. Department filter
    if (department && department !== "ALL") {
      const depts = department
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);
      const pos = depts.filter((d) => !d.startsWith("!"));
      const neg = depts.filter((d) => d.startsWith("!")).map((d) => d.slice(1));
      if (pos.length > 0) {
        conditions.push({
          grievance_departments: {
            some: {
              departments: {
                department_name: { in: pos },
              },
            },
          },
        });
      }
      if (neg.length > 0) {
        conditions.push({
          grievance_departments: {
            none: {
              departments: {
                department_name: { in: neg },
              },
            },
          },
        });
      }
    }

    // 4. Priority filter
    if (priority && priority !== "ALL") {
      const prios = priority
        .split(",")
        .map((p) => p.trim().toUpperCase())
        .filter(Boolean);
      const pos = prios.filter((p) => !p.startsWith("!"));
      const neg = prios.filter((p) => p.startsWith("!")).map((p) => p.slice(1));
      if (pos.length > 0) {
        conditions.push({ priority: { in: pos } });
      }
      if (neg.length > 0) {
        conditions.push({ priority: { notIn: neg } });
      }
    }

    // 5. Status filter
    if (status && status !== "ALL") {
      const stats = status
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      const negRaw = stats
        .filter((s) => s.startsWith("!"))
        .map((s) => s.slice(1));
      let pos = stats.filter((s) => !s.startsWith("!"));

      // Expand UNASSIGNED to SUBMITTED, AWAITING_ROUTING, and AWAITING_ASSIGNMENT
      if (pos.includes("UNASSIGNED")) {
        pos = pos
          .filter((s) => s !== "UNASSIGNED")
          .concat([
            "SUBMITTED",
            "AWAITING_ROUTING",
            "AWAITING_ASSIGNMENT",
            "ROUTED",
          ]);
      }
      // Expand IN_PROGRESS to include AWAITING_INFORMATION, REWORK, RESOLUTION_PENDING_APPROVAL
      if (pos.includes("IN_PROGRESS")) {
        if (!pos.includes("AWAITING_INFORMATION"))
          pos.push("AWAITING_INFORMATION");
        if (!pos.includes("REWORK")) pos.push("REWORK");
        if (!pos.includes("RESOLUTION_PENDING_APPROVAL"))
          pos.push("RESOLUTION_PENDING_APPROVAL");
        if (!pos.includes("UNDER_REVIEW")) pos.push("UNDER_REVIEW");
      }
      // Expand REOPENED to include RESOLUTION_PENDING_APPROVAL and REWORK
      if (pos.includes("REOPENED")) {
        if (!pos.includes("REWORK")) pos.push("REWORK");
        if (!pos.includes("RESOLUTION_PENDING_APPROVAL"))
          pos.push("RESOLUTION_PENDING_APPROVAL");
        if (!pos.includes("REOPEN_REVIEW")) pos.push("REOPEN_REVIEW");
      }

      if (pos.length > 0) {
        conditions.push({ status: { in: pos } });
      }
      if (negRaw.length > 0) {
        conditions.push({ status: { notIn: negRaw } });
      }
    }

    // 6. SLA Status filter
    if (slaStatus && slaStatus !== "ALL") {
      let slas = slaStatus
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      slas = slas.map((s) => {
        if (s.endsWith("SLA_CRITICAL"))
          return s.startsWith("!") ? "!BREACHED" : "BREACHED";
        if (s.endsWith("SLA_RISK"))
          return s.startsWith("!") ? "!AT_RISK" : "AT_RISK";
        return s;
      });
      const pos = slas.filter((s) => !s.startsWith("!"));
      const neg = slas.filter((s) => s.startsWith("!")).map((s) => s.slice(1));
      if (pos.length > 0) {
        conditions.push({ sla_status: { in: pos } });
      }
      if (neg.length > 0) {
        conditions.push({ sla_status: { notIn: neg } });
      }
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
            WHERE status IN ('SUBMITTED', 'AWAITING_ROUTING') 
            OR NOT EXISTS (SELECT 1 FROM grievance_departments gd WHERE gd.grievance_id = grievances.grievance_id)
          )::int AS exception_count,
          COUNT(*) FILTER (
            WHERE status IN ('AWAITING_ASSIGNMENT', 'ROUTED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_INFORMATION', 'REWORK', 'RESOLUTION_PENDING_APPROVAL', 'UNDER_REVIEW')
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
            WHERE reopen_count > 0 OR status IN ('REOPENED', 'RESOLUTION_PENDING_APPROVAL', 'REWORK', 'REOPEN_REVIEW')
          )::int AS reopened_count,
          COUNT(*) FILTER (
            WHERE sla_status = 'BREACHED' OR status = 'ESCALATED' OR EXISTS (SELECT 1 FROM escalations e WHERE e.grievance_id = grievances.grievance_id AND e.status = 'OPEN')
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
          grievance_feedback: true,
          users: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          grievance_departments: {
            include: {
              departments: {
                include: {
                  users: {
                    where: {
                      status: "ACTIVE",
                      roles: { role_name: "DEPARTMENT_HEAD" },
                    },
                    select: {
                      user_id: true,
                      first_name: true,
                      last_name: true,
                      email: true,
                    },
                    take: 1,
                  },
                },
              },
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

      const primaryHead =
        primaryLink?.departments?.users?.[0] ||
        equalLinks[0]?.departments?.users?.[0] ||
        getPrimaryDepartment(g)?.departments?.users?.[0];

      const otherEqualDepts = equalLinks.slice(1).map((s) => {
        const head = s.departments.users?.[0];
        return {
          department_id: s.department_id.toString(),
          department_name: `${s.departments.department_name} (Joint Co-Lead)`,
          head_name: head
            ? `${head.first_name} ${head.last_name || ""}`.trim()
            : null,
          head_email: head?.email || null,
        };
      });

      const normalSupporting = supportingLinks.map((s) => {
        const head = s.departments.users?.[0];
        return {
          department_id: s.department_id.toString(),
          department_name: s.departments.department_name,
          head_name: head
            ? `${head.first_name} ${head.last_name || ""}`.trim()
            : null,
          head_email: head?.email || null,
        };
      });

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
        department_head_name: primaryHead
          ? `${primaryHead.first_name} ${primaryHead.last_name || ""}`.trim()
          : null,
        department_head_email: primaryHead?.email || null,
        involvement_type: isEqualInvolvement
          ? "EQUAL"
          : primaryLink
            ? "PRIMARY"
            : null,
        supporting_departments: [...otherEqualDepts, ...normalSupporting],
        reopen_count: g.reopen_count,
        manual_review_count: g.manual_review_count,
        feedback: g.grievance_feedback
          ? {
              rating: g.grievance_feedback.rating,
              comments: g.grievance_feedback.comments,
              submitted_at: g.grievance_feedback.submitted_at.toISOString(),
            }
          : null,
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
