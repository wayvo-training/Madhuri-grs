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
      return NextResponse.json({ success: false, message: "Only resolved grievances can be reopened" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Reopened by user";

    // Update grievance
    await prisma.grievances.update({
      where: { grievance_id: grievanceId },
      data: {
        status: "REOPENED",
        reopen_count: { increment: 1 },
      },
    });

    // Revoke active assignments so the grievance returns to the unassigned queue
    await prisma.assignments.updateMany({
      where: {
        grievance_id: grievanceId,
        assignment_status: "ASSIGNED",
      },
      data: {
        assignment_status: "REVOKED",
        completed_at: new Date(),
      },
    });

    // Log the event
    await prisma.audit_logs.create({
      data: {
        grievance_id: grievanceId,
        user_id: user.user_id,
        action: "REOPENED",
        entity_type: "GRIEVANCE",
        entity_id: grievanceId,
        new_value: { details: `Grievance reopened by the end user: ${reason}` },
      },
    });

    // Log status history
    await prisma.grievance_status_history.create({
      data: {
        grievance_id: grievanceId,
        old_status: "RESOLVED",
        new_status: "REOPENED",
        changed_by: user.user_id,
        remarks: reason,
      },
    });

    // Notifications
    // 1. Notify End User
    await NotificationService.send({
      userId: user.user_id,
      grievanceId: grievanceId,
      type: "GRIEVANCE_REOPENED",
      title: "Grievance Reopened",
      message: `Your grievance ${grievance.grievance_number} has been successfully reopened and placed back into the investigation queue.`,
    });

    // 2. Notify Department Head
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
          type: "GRIEVANCE_REOPENED",
          title: "Grievance Reopened by User",
          message: `Grievance ${grievance.grievance_number} has been reopened by the citizen. Reason provided: ${reason}`,
        });
      }
    }

    return NextResponse.json({ success: true, message: "Grievance reopened successfully" });
  } catch (error) {
    console.error("Error reopening grievance:", error);
    return NextResponse.json({ success: false, message: "Failed to reopen grievance" }, { status: 500 });
  }
}
