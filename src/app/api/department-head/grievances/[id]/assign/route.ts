import { NextResponse } from "next/server";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await resolveDepartmentHeadAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { user, departmentId, isAdmin } = auth;
  const { id } = await params;

  try {
    const grievanceId = BigInt(id);
    const body = await request.json();
    const { staffId, note, recommendationScore, recommendationReasons } = body;

    if (!staffId) {
      return NextResponse.json(
        { success: false, message: "Staff ID is required for assignment" },
        { status: 400 },
      );
    }

    const targetStaffId = BigInt(staffId);

    // 1. Verify staff exists and is active
    const staff = await prisma.users.findUnique({
      where: { user_id: targetStaffId },
      include: { roles: true },
    });

    if (staff?.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Selected staff member is not active or found",
        },
        { status: 404 },
      );
    }

    // 2. Enforce maximum active workload capacity of 10 grievances
    const activeAssignedCount = await prisma.assignments.count({
      where: {
        staff_id: targetStaffId,
        assignment_status: "ASSIGNED",
        grievance_id: { not: grievanceId },
        grievances: {
          status: { notIn: ["CLOSED"] },
        },
      },
    });

    if (activeAssignedCount >= 10) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This Staff member has reached the maximum active workload of 10 grievances.",
        },
        { status: 400 },
      );
    }

    // 3. Resolve the target grievance_department
    // First priority: Match the selected staff member's department
    // Fallback: Match the active head's department
    let grievanceDept = await prisma.grievance_departments.findFirst({
      where: {
        grievance_id: grievanceId,
        department_id: staff.department_id ? BigInt(staff.department_id) : departmentId,
      },
      include: { grievances: true },
    });

    if (!grievanceDept) {
      grievanceDept = await prisma.grievance_departments.findFirst({
        where: {
          grievance_id: grievanceId,
          ...(isAdmin ? {} : { department_id: departmentId }),
        },
        include: { grievances: true },
      });
    }

    if (!grievanceDept) {
      return NextResponse.json(
        {
          success: false,
          message: "Grievance does not belong to your department queue",
        },
        { status: 403 },
      );
    }

    const grievance = grievanceDept.grievances;
    const staffName = `${staff.first_name} ${staff.last_name || ""}`.trim();

    // Prepare recommendation payload if provided
    const reasonsPayload = recommendationReasons
      ? {
          ...(typeof recommendationReasons === "object"
            ? recommendationReasons
            : {}),
          ...(note ? { directive_note: note } : {}),
        }
      : note
        ? { note }
        : undefined;

    // 3. Database transaction: Complete prior active assignment, create new assignment, update status and logs
    await prisma.$transaction(async (tx) => {
      // Mark any existing active assignment as REASSIGNED
      await tx.assignments.updateMany({
        where: {
          grievance_department_id: grievanceDept.grievance_department_id,
          assignment_status: "ASSIGNED",
        },
        data: {
          assignment_status: "REASSIGNED",
          completed_at: new Date(),
        },
      });

      // Insert new active assignment
      await tx.assignments.create({
        data: {
          grievance_id: grievanceId,
          grievance_department_id: grievanceDept.grievance_department_id,
          staff_id: targetStaffId,
          assigned_by: user.user_id,
          assigned_at: new Date(),
          assignment_status: "ASSIGNED",
          recommendation_score:
            recommendationScore !== undefined && recommendationScore !== null
              ? Number(recommendationScore)
              : null,
          recommendation_reasons: reasonsPayload,
        },
      });

      // Insert active assignment notification for target staff member
      await tx.notifications.create({
        data: {
          user_id: targetStaffId,
          grievance_id: grievanceId,
          notification_type: "ASSIGNMENT",
          channel: "IN_APP",
          title: `New Case Assigned: ${grievance.grievance_number}`,
          message: note
            ? `You have been assigned Grievance ${grievance.grievance_number} (${grievance.title}). Note: "${note}"`
            : `You have been assigned Grievance ${grievance.grievance_number} (${grievance.title}) by Department Head.`,
          status: "PENDING",
          created_at: new Date(),
        },
      });

      // Update grievance_departments status
      await tx.grievance_departments.update({
        where: {
          grievance_department_id: grievanceDept.grievance_department_id,
        },
        data: {
          status: "ASSIGNED",
          assigned_at: new Date(),
        },
      });

      // Update grievance status to ASSIGNED if SUBMITTED or ROUTED
      const newStatus =
        grievance.status === "SUBMITTED" || grievance.status === "ROUTED"
          ? "ASSIGNED"
          : grievance.status;

      await tx.grievances.update({
        where: { grievance_id: grievanceId },
        data: {
          status: newStatus,
          updated_at: new Date(),
        },
      });

      // Record audit log
      await tx.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          user_id: user.user_id,
          action: "ASSIGNED_TO_STAFF",
          entity_type: "grievance",
          entity_id: grievanceId,
          new_value: {
            staff_id: staff.user_id.toString(),
            staff_name: staffName,
            note: note || "Assigned by Department Head",
            stage: "ASSIGNED",
            recommendation_score: recommendationScore ?? null,
            recommendation_reasons: reasonsPayload ?? null,
            details: `Assigned to ${staffName}${recommendationScore ? ` (Match score: ${recommendationScore}%)` : ""}`,
          },
        },
      });

      // Record status history
      await tx.grievance_status_history.create({
        data: {
          grievance_id: grievanceId,
          old_status: grievance.status,
          new_status: newStatus,
          changed_by: user.user_id,
          remarks: note || `Assigned to ${staffName}`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Assigned grievance ${grievance.grievance_number} to ${staffName}.`,
      assignedStaff: {
        id: staff.user_id.toString(),
        name: staffName,
        email: staff.email,
      },
    });
  } catch (error) {
    console.error("Error in assign route:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to assign staff member",
      },
      { status: 500 },
    );
  }
}
