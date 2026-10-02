import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NotificationService } from "@/lib/services/notification.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || user.roles?.role_name !== "END_USER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const grievanceId = BigInt(id);
    
    // Find the grievance
    const grievance = await prisma.grievances.findUnique({
      where: { grievance_id: grievanceId },
      include: {
        grievance_departments: true,
      }
    });

    if (!grievance || grievance.submitted_by !== user.user_id) {
      return NextResponse.json({ success: false, message: "Grievance not found" }, { status: 404 });
    }

    if (grievance.status !== "RESOLVED") {
      return NextResponse.json({ success: false, message: "Only resolved grievances can be accepted" }, { status: 400 });
    }

    // Update grievance to CLOSED
    await prisma.grievances.update({
      where: { grievance_id: grievanceId },
      data: {
        status: "CLOSED",
        closed_at: new Date(),
      },
    });

    // Mark assignments as completed (if not already revoked)
    await prisma.assignments.updateMany({
      where: {
        grievance_id: grievanceId,
        assignment_status: "ASSIGNED",
      },
      data: {
        assignment_status: "COMPLETED",
        completed_at: new Date(),
      },
    });

    // Log the event
    await prisma.audit_logs.create({
      data: {
        grievance_id: grievanceId,
        user_id: user.user_id,
        action: "CLOSED",
        entity_type: "GRIEVANCE",
        entity_id: grievanceId,
        new_value: { details: "Grievance resolution accepted and closed by the end user." },
      },
    });

    // Log status history
    await prisma.grievance_status_history.create({
      data: {
        grievance_id: grievanceId,
        old_status: "RESOLVED",
        new_status: "CLOSED",
        changed_by: user.user_id,
        remarks: "Resolution accepted by user",
      },
    });

    // Notifications
    // Notify Department Head
    const deptId = grievance.grievance_departments?.department_id;
    if (deptId) {
      const hod = await prisma.users.findFirst({
        where: { department_id: deptId, roles: { role_name: "DEPARTMENT_HEAD" }, status: "ACTIVE" },
        select: { user_id: true }
      });
      if (hod) {
        await NotificationService.send({
          userId: hod.user_id,
          grievanceId: grievanceId,
          type: "RESOLUTION_ACCEPTED",
          title: "Resolution Accepted",
          message: `The citizen has accepted the resolution for grievance ${grievance.grievance_number}. The grievance is now closed.`,
        });
      }
    }

    return NextResponse.json({ success: true, message: "Resolution accepted successfully" });
  } catch (error) {
    console.error("Error accepting resolution:", error);
    return NextResponse.json({ success: false, message: "Failed to accept resolution" }, { status: 500 });
  }
}
