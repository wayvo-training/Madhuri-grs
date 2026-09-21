import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

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

    const conditions: Prisma.grievancesWhereInput[] = [];

    // 1. Tab condition
    if (tab === "EXCEPTIONS") {
      conditions.push({
        OR: [{ status: "SUBMITTED" }, { grievance_departments: { is: null } }],
      });
    } else if (tab === "ACTIVE") {
      conditions.push({
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
      });
    } else if (tab === "SLA_RISK") {
      conditions.push({
        sla_status: { in: ["AT_RISK", "BREACHED"] },
      });
    } else if (tab === "CLOSED") {
      conditions.push({
        status: "CLOSED",
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
      conditions.push({
        grievance_departments: {
          departments: {
            department_name: department,
          },
        },
      });
    }

    // 4. Priority filter
    if (priority !== "ALL") {
      conditions.push({ priority });
    }

    // 5. Status filter
    if (status !== "ALL") {
      conditions.push({ status });
    }

    const where: Prisma.grievancesWhereInput =
      conditions.length > 0 ? { AND: conditions } : {};

    const skip = (page - 1) * limit;

    const [
      total,
      rawGrievances,
      [allCount, exceptionCount, activeCount, slaRiskCount, closedCount],
    ] = await Promise.all([
      prisma.grievances.count({ where }),
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
            where: { involvement_type: "PRIMARY" },
            include: {
              departments: true,
            },
          },
        },
      }),
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

    const serializedGrievances = rawGrievances.map((g) => ({
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
    }));

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
        all: allCount,
        exceptions: exceptionCount,
        active: activeCount,
        slaRisk: slaRiskCount,
        closed: closedCount,
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
