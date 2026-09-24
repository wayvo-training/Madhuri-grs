import { NextResponse } from "next/server";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/department-head/staff/[id]
 * Toggle officer status between ACTIVE and ON_LEAVE (persisted as ACTIVE / INACTIVE in DB)
 */
export async function PATCH(
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
    const staffId = BigInt(id);
    const body = await request.json();
    const requestedStatus = body?.status;
    const dbStatus = requestedStatus === "ON_LEAVE" ? "INACTIVE" : "ACTIVE";
    const displayStatus = dbStatus === "INACTIVE" ? "ON_LEAVE" : "ACTIVE";

    // Verify staff belongs to department (or Admin)
    const staffMember = await prisma.users.findUnique({
      where: { user_id: staffId },
    });

    if (
      !staffMember ||
      (!isAdmin && staffMember.department_id !== departmentId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Staff member not found in your department",
        },
        { status: 404 },
      );
    }

    const updated = await prisma.users.update({
      where: { user_id: staffId },
      data: {
        status: dbStatus,
        updated_at: new Date(),
      },
    });

    const staffName = `${updated.first_name} ${updated.last_name || ""}`.trim();

    await prisma.audit_logs.create({
      data: {
        user_id: user.user_id,
        action: "STAFF_AVAILABILITY_CHANGED",
        entity_type: "user",
        entity_id: staffId,
        new_value: {
          staff_id: staffId.toString(),
          staff_name: staffName,
          status: displayStatus,
          details: `${staffName} is now marked as ${displayStatus}.`,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `${staffName} status changed to ${displayStatus}.`,
      status: displayStatus,
    });
  } catch (error) {
    console.error("Error toggling staff availability:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to update staff status",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/department-head/staff/[id]
 * Bulk reassign active queue from an officer going on leave to a designated target officer
 */
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
    const fromStaffId = BigInt(id);
    const body = await request.json();
    const { targetStaffId, note } = body;

    if (!targetStaffId) {
      return NextResponse.json(
        {
          success: false,
          message: "Target staff ID is required for reassignment",
        },
        { status: 400 },
      );
    }

    const toStaffId = BigInt(targetStaffId);

    // Verify both staff members exist
    const [fromStaff, toStaff] = await Promise.all([
      prisma.users.findUnique({ where: { user_id: fromStaffId } }),
      prisma.users.findUnique({ where: { user_id: toStaffId } }),
    ]);

    if (!fromStaff || (!isAdmin && fromStaff.department_id !== departmentId)) {
      return NextResponse.json(
        { success: false, message: "Source officer not found in department" },
        { status: 404 },
      );
    }

    if (toStaff?.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Target officer is not found or currently inactive",
        },
        { status: 400 },
      );
    }

    const fromName =
      `${fromStaff.first_name} ${fromStaff.last_name || ""}`.trim();
    const toName = `${toStaff.first_name} ${toStaff.last_name || ""}`.trim();

    // Find all active assignments for source staff
    const activeAssignments = await prisma.assignments.findMany({
      where: {
        staff_id: fromStaffId,
        assignment_status: "ASSIGNED",
      },
      include: {
        grievances: { select: { grievance_number: true } },
      },
    });

    await prisma.$transaction(async (tx) => {
      // 1. Reassign each active ticket
      for (const assign of activeAssignments) {
        // Complete current assignment
        await tx.assignments.update({
          where: { assignment_id: assign.assignment_id },
          data: {
            assignment_status: "REASSIGNED",
            completed_at: new Date(),
          },
        });

        // Create new assignment
        await tx.assignments.create({
          data: {
            grievance_id: assign.grievance_id,
            grievance_department_id: assign.grievance_department_id,
            staff_id: toStaffId,
            assigned_by: user.user_id,
            assigned_at: new Date(),
            assignment_status: "ASSIGNED",
            recommendation_reasons: {
              reassignment_reason: "Officer on leave",
              note: note || `Bulk reassigned from ${fromName}`,
            },
          },
        });

        // Record audit log for each grievance
        await tx.audit_logs.create({
          data: {
            grievance_id: assign.grievance_id,
            user_id: user.user_id,
            action: "LEAVE_REASSIGNMENT",
            entity_type: "grievance",
            entity_id: assign.grievance_id,
            new_value: {
              from_staff: fromName,
              to_staff: toName,
              details: `Reassigned from ${fromName} (On Leave) to ${toName}. Directive: "${note || "Leave coverage"}"`,
              stage: "ASSIGNED",
            },
          },
        });
      }

      // 2. Mark source officer INACTIVE in DB (mapped to ON_LEAVE)
      await tx.users.update({
        where: { user_id: fromStaffId },
        data: {
          status: "INACTIVE",
          updated_at: new Date(),
        },
      });

      // 3. Record audit log on user
      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "STAFF_MARKED_ON_LEAVE_WITH_REASSIGNMENT",
          entity_type: "user",
          entity_id: fromStaffId,
          new_value: {
            officer: fromName,
            reassigned_to: toName,
            ticket_count: activeAssignments.length,
            details: `Marked ${fromName} ON_LEAVE and reassigned ${activeAssignments.length} active ticket(s) to ${toName}.`,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Reassigned ${activeAssignments.length} ticket(s) to ${toName}. ${fromName} is now marked On Leave.`,
      reassignedCount: activeAssignments.length,
      targetOfficer: toName,
    });
  } catch (error) {
    console.error("Error bulk-reassigning on leave:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to process leave reassignment",
      },
      { status: 500 },
    );
  }
}
