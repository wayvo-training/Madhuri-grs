import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (user?.roles?.role_name !== "END_USER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const grievanceId = BigInt(id);

    const body = await request.json().catch(() => ({}));
    const { rating, comments } = body || {};

    if (rating === undefined || rating === null || rating === "") {
      return NextResponse.json(
        {
          success: false,
          message: "Rating is mandatory when submitting feedback",
        },
        { status: 400 },
      );
    }

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        {
          success: false,
          message: "Rating must be an integer between 1 and 5",
        },
        { status: 400 },
      );
    }

    let validatedComments: string | null = null;
    if (comments !== undefined && comments !== null && comments !== "") {
      if (typeof comments !== "string") {
        return NextResponse.json(
          { success: false, message: "Comments must be a string" },
          { status: 400 },
        );
      }
      if (comments.trim().length > 1000) {
        return NextResponse.json(
          {
            success: false,
            message: "Feedback comments must not exceed 1000 characters",
          },
          { status: 400 },
        );
      }
      validatedComments = comments.trim();
    }

    // Verify grievance existence and ownership
    const grievance = await prisma.grievances.findUnique({
      where: { grievance_id: grievanceId },
    });

    if (!grievance || grievance.submitted_by !== user.user_id) {
      return NextResponse.json(
        { success: false, message: "Grievance not found" },
        { status: 404 },
      );
    }

    // Feedback is only permitted for CLOSED grievances
    if (grievance.status !== "CLOSED") {
      return NextResponse.json(
        {
          success: false,
          message: "Feedback is only available for closed grievances",
        },
        { status: 400 },
      );
    }

    // Enforce exactly one feedback per grievance
    const existingFeedback = await prisma.grievance_feedback.findUnique({
      where: { grievance_id: grievanceId },
    });

    if (existingFeedback) {
      return NextResponse.json(
        {
          success: false,
          message: "Feedback has already been submitted for this grievance",
        },
        { status: 409 },
      );
    }

    const feedback = await prisma.$transaction(async (tx) => {
      const created = await tx.grievance_feedback.create({
        data: {
          grievance_id: grievanceId,
          employee_id: user.user_id,
          rating: numRating,
          comments: validatedComments,
          submitted_at: new Date(),
        },
      });

      // Audit log (comments are intentionally omitted from metadata for privacy)
      await tx.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          user_id: user.user_id,
          action: "FEEDBACK_SUBMITTED",
          entity_type: "GRIEVANCE_FEEDBACK",
          entity_id: created.feedback_id,
          new_value: {
            rating: numRating,
            hasComments: Boolean(
              validatedComments && validatedComments.length > 0,
            ),
            submittedByRole: "END_USER",
          },
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      feedback: {
        feedback_id: feedback.feedback_id.toString(),
        rating: feedback.rating,
        comments: feedback.comments,
        submitted_at: feedback.submitted_at.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit feedback" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const grievanceId = BigInt(id);

    const feedback = await prisma.grievance_feedback.findUnique({
      where: { grievance_id: grievanceId },
      include: {
        grievances: {
          select: {
            submitted_by: true,
            grievance_departments: { select: { department_id: true } },
            assignments: { select: { staff_id: true } },
          },
        },
      },
    });

    if (!feedback) {
      return NextResponse.json({
        success: true,
        feedback: null,
      });
    }

    const roleName = user.roles?.role_name;
    const isOwner = feedback.grievances.submitted_by === user.user_id;
    const isAdmin = roleName === "ADMIN";
    const isDeptHead =
      roleName === "DEPARTMENT_HEAD" &&
      user.department_id &&
      feedback.grievances.grievance_departments.some(
        (gd) => gd.department_id === user.department_id,
      );
    const isAssignedStaff =
      roleName === "STAFF" &&
      feedback.grievances.assignments.some((a) => a.staff_id === user.user_id);

    if (!isOwner && !isAdmin && !isDeptHead && !isAssignedStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      feedback: {
        feedback_id: feedback.feedback_id.toString(),
        rating: feedback.rating,
        comments: feedback.comments,
        submitted_at: feedback.submitted_at.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve feedback" },
      { status: 500 },
    );
  }
}
