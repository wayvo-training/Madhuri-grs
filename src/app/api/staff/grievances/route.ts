import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveStaffAuth } from "@/lib/staff/permissions";
import { calculateSlaStatus } from "@/lib/staff/utils";
import type {
  StaffGrievanceItem,
  StaffPriority,
  StaffSlaState,
} from "@/types/staff";

export async function GET(req: NextRequest) {
  try {
    const authResult = await resolveStaffAuth();
    if ("error" in authResult) return authResult.error;
    const { staffId } = authResult;

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const priorityParam = searchParams.get("priority");
    const searchParam = searchParams.get("search");

    const assignmentQuery = {
      include: {
        grievances: {
          include: {
            categories: true,
            subcategories: true,
            users: {
              select: {
                first_name: true,
                last_name: true,
                email: true,
                roles: true,
              },
            },
            attachments: true,
            resolutions: {
              orderBy: { submitted_at: "desc" as const },
              take: 1,
              include: {
                users: {
                  include: { roles: true },
                },
                knowledge_articles: {
                  select: { article_id: true },
                },
              },
            },
          },
        },
      },
    };

    // Fetch grievances where this staff member is currently or previously assigned
    let assignments = await prisma.assignments.findMany({
      where: {
        staff_id: staffId,
        assignment_status: { in: ["ASSIGNED", "COMPLETED"] },
      },
      ...assignmentQuery,
      orderBy: { assigned_at: "desc" },
    });

    if (assignments.length === 0 && authResult.isAdmin) {
      assignments = await prisma.assignments.findMany({
        where: {
          assignment_status: "ASSIGNED",
          ...(authResult.departmentId
            ? {
                grievance_departments: {
                  department_id: authResult.departmentId,
                },
              }
            : {}),
        },
        take: 40,
        ...assignmentQuery,
        orderBy: { assigned_at: "desc" },
      });
    }

    const items: StaffGrievanceItem[] = assignments.map((a) => {
      const g = a.grievances;
      const submitter = g.users;
      const submitterFullName = submitter
        ? `${submitter.first_name} ${submitter.last_name || ""}`.trim()
        : "Complainant";

      const slaCalc = calculateSlaStatus(g.created_at, g.due_at, g.sla_status);

      return {
        id: String(g.grievance_id),
        grievanceNumber: g.grievance_number,
        title: g.title,
        description: g.description,
        category: g.categories?.category_name || "General",
        subcategory: g.subcategories?.subcategory_name || "General",
        priority: g.priority as StaffPriority,
        status: g.status as StaffGrievanceItem["status"],
        reopenCount: g.reopen_count,
        manualReviewCount: g.manual_review_count,
        slaStatus: slaCalc.state as StaffSlaState,
        slaConsumptionPercent: slaCalc.consumptionPercent,
        slaTimeLeft: slaCalc.timeRemaining,
        dueAt: g.due_at ? g.due_at.toISOString() : null,
        submittedAt: g.created_at.toISOString(),
        assignedAt: a.assigned_at.toISOString(),
        submitterName: submitterFullName,
        submitterEmail: submitter?.email || "",
        submitterRole: submitter?.roles?.role_name || "EMPLOYEE",
        hasResolution: g.resolutions.length > 0,
        hasProposedKb:
          ((
            g.resolutions[0] as unknown as {
              knowledge_articles?: unknown[];
            }
          )?.knowledge_articles?.length ?? 0) > 0,
        submittedResolution: g.resolutions[0]
          ? {
              id: g.resolutions[0].resolution_id.toString(),
              submittedByUserId: g.resolutions[0].submitted_by.toString(),
              submittedByRole:
                g.resolutions[0].users?.roles?.role_name || undefined,
              problemSummary: g.resolutions[0].problem_summary,
              findings: g.resolutions[0].findings,
              actionTaken: g.resolutions[0].action_taken,
              outcome: g.resolutions[0].outcome,
              evidence: g.resolutions[0].evidence,
              submittedAt: g.resolutions[0].submitted_at.toISOString(),
            }
          : null,
      };
    });

    // Optional query parameter filtering
    let filtered = items;
    if (statusParam && statusParam !== "ALL") {
      filtered = filtered.filter(
        (i) => i.status.toUpperCase() === statusParam.toUpperCase(),
      );
    }
    if (priorityParam && priorityParam !== "ALL") {
      filtered = filtered.filter(
        (i) => i.priority.toUpperCase() === priorityParam.toUpperCase(),
      );
    }
    if (searchParam?.trim()) {
      const q = searchParam.toLowerCase().trim();
      filtered = filtered.filter(
        (i) =>
          i.grievanceNumber.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.submitterName.toLowerCase().includes(q),
      );
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      grievances: filtered,
    });
  } catch (error) {
    console.error("Staff grievances API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
