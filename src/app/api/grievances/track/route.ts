import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawNumber = searchParams.get("number")?.trim();

    if (!rawNumber) {
      return NextResponse.json(
        { error: "Grievance reference number is required." },
        { status: 400 },
      );
    }

    const grievance = await prisma.grievances.findFirst({
      where: {
        grievance_number: {
          equals: rawNumber,
          mode: "insensitive",
        },
      },
      include: {
        categories: { select: { category_name: true } },
        subcategories: { select: { subcategory_name: true } },
        grievance_departments: {
          include: {
            departments: { select: { department_name: true } },
          },
        },
        grievance_status_history: {
          select: {
            old_status: true,
            new_status: true,
            changed_at: true,
          },
          orderBy: { changed_at: "asc" },
        },
      },
    });

    if (!grievance) {
      return NextResponse.json(
        {
          error: `No grievance found matching reference "${rawNumber}". Please check the ID or log in to view your dashboard.`,
        },
        { status: 404 },
      );
    }

    // Determine current stage (1: Submitted, 2: Routed & Assigned, 3: Under Investigation, 4: Resolved & Closed)
    let currentStage = 1;
    const statusUpper = grievance.status.toUpperCase();

    if (statusUpper === "ASSIGNED") {
      currentStage = 2;
    } else if (
      ["UNDER_INVESTIGATION", "IN_PROGRESS", "ESCALATED"].includes(statusUpper)
    ) {
      currentStage = 3;
    } else if (["RESOLVED", "CLOSED"].includes(statusUpper)) {
      currentStage = 4;
    }

    const primaryDept =
      grievance.grievance_departments?.departments?.department_name ||
      "General Queue";

    const assignedHistory = grievance.grievance_status_history.find(
      (h) => h.new_status === "ASSIGNED",
    );

    const investigatingHistory = grievance.grievance_status_history.find((h) =>
      ["IN_PROGRESS", "UNDER_INVESTIGATION", "ESCALATED"].includes(
        h.new_status,
      ),
    );

    return NextResponse.json({
      success: true,
      grievance: {
        number: grievance.grievance_number,
        title: grievance.title,
        status: grievance.status,
        slaStatus: grievance.sla_status || "ON_TRACK",
        priority: grievance.priority,
        category: grievance.categories?.category_name || "General",
        subcategory: grievance.subcategories?.subcategory_name || "Standard",
        primaryDepartment: primaryDept,
        submittedAt: grievance.created_at,
        dueAt: grievance.due_at,
        resolvedAt: grievance.closed_at,
        currentStage,
        stages: [
          {
            stage: 1,
            label: "Submitted",
            date: grievance.created_at,
            isCompleted: currentStage >= 1,
            isCurrent: currentStage === 1,
          },
          {
            stage: 2,
            label: "Routed & Assigned",
            date:
              currentStage >= 2 ? assignedHistory?.changed_at || null : null,
            isCompleted: currentStage >= 2,
            isCurrent: currentStage === 2,
          },
          {
            stage: 3,
            label:
              statusUpper === "ESCALATED"
                ? "Escalated Review"
                : "Under Investigation",
            date:
              currentStage >= 3
                ? investigatingHistory?.changed_at || null
                : null,
            isCompleted: currentStage >= 3,
            isCurrent: currentStage === 3,
          },
          {
            stage: 4,
            label: "Resolved & Closed",
            date: grievance.closed_at,
            isCompleted: currentStage === 4,
            isCurrent: currentStage === 4,
          },
        ],
      },
    });
  } catch (error) {
    console.error("Grievance tracking error:", error);
    return NextResponse.json(
      {
        error:
          "An internal server error occurred while retrieving grievance status.",
      },
      { status: 500 },
    );
  }
}
