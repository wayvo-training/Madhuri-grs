import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { id } = await props.params;
  const grievanceId = BigInt(id);

  try {
    const body = await request.json();
    const { department_id } = body;

    if (!department_id) {
      return NextResponse.json(
        { success: false, message: "Target department is required." },
        { status: 400 },
      );
    }

    const departmentId = BigInt(department_id);

    // Verify department exists and is active
    const department = await prisma.departments.findUnique({
      where: { department_id: departmentId },
    });

    if (department?.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Selected department not found or inactive.",
        },
        { status: 404 },
      );
    }

    // Verify grievance exists
    const grievance = await prisma.grievances.findUnique({
      where: { grievance_id: grievanceId },
      include: {
        grievance_departments: true,
      },
    });

    if (!grievance) {
      return NextResponse.json(
        { success: false, message: "Grievance record not found." },
        { status: 404 },
      );
    }

    if (grievance.status === "CLOSED") {
      return NextResponse.json(
        { success: false, message: "Cannot route a closed grievance." },
        { status: 400 },
      );
    }

    // Perform database transaction for manual routing exception
    await prisma.$transaction(async (tx) => {
      // 1. Handle primary department assignment
      if (grievance.grievance_departments) {
        await tx.grievance_departments.update({
          where: {
            grievance_department_id:
              grievance.grievance_departments.grievance_department_id,
          },
          data: {
            department_id: departmentId,
            involvement_type: "PRIMARY",
            status: "PENDING_ASSIGNMENT",
            assigned_at: new Date(),
          },
        });
      } else {
        await tx.grievance_departments.create({
          data: {
            grievance_id: grievanceId,
            department_id: departmentId,
            involvement_type: "PRIMARY",
            status: "PENDING_ASSIGNMENT",
            assigned_at: new Date(),
          },
        });
      }

      // 2. Update grievance status to ROUTED and increment manual review counter
      await tx.grievances.update({
        where: { grievance_id: grievanceId },
        data: {
          status: "ROUTED",
          manual_review_count: { increment: 1 },
          updated_at: new Date(),
        },
      });

      // 3. Record status transition history
      await tx.grievance_status_history.create({
        data: {
          grievance_id: grievanceId,
          old_status: grievance.status,
          new_status: "ROUTED",
          changed_by: user.user_id,
          remarks: `Manual routing exception handled by Admin to department: ${department.department_name}`,
        },
      });

      // 4. Record audit log
      await tx.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          entity_type: "GRIEVANCE",
          entity_id: grievanceId,
          user_id: user.user_id,
          action: "MANUAL_ROUTING_EXCEPTION",
          new_value: {
            department_id: department_id.toString(),
            department_name: department.department_name,
            routed_by_email: user.email,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Grievance successfully routed to ${department.department_name}.`,
    });
  } catch (error) {
    console.error("Manual routing exception failed:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error during routing." },
      { status: 500 },
    );
  }
}
