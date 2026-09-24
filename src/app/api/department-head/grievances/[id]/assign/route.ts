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
    const { staffId, note } = body;

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

    // 2. Verify grievance belongs to head's department (or Admin preview)
    const grievanceDept = await prisma.grievance_departments.findFirst({
      where: {
        grievance_id: grievanceId,
        ...(isAdmin ? {} : { department_id: departmentId }),
      },
      include: { grievances: true },
    });

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
          recommendation_reasons: note ? { note } : undefined,
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
            details: `Dispatched to ${staffName}`,
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
      message: `Dispatched ${grievance.grievance_number} to ${staffName}.`,
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
