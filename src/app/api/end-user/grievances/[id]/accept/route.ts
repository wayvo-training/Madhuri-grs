import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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
        assignments: {
          where: { assignment_status: "ASSIGNED" },
          take: 1,
        },
      },
    });

    if (!grievance || grievance.submitted_by !== user.user_id) {
      return NextResponse.json(
        { success: false, message: "Grievance not found" },
        { status: 404 },
      );
    }

    if (grievance.status !== "RESOLVED") {
      return NextResponse.json(
        { success: false, message: "Only resolved grievances can be accepted" },
        { status: 400 },
      );
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
        new_value: {
          details: "Grievance resolution accepted and closed by the end user.",
        },
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
    // 1. Notify all Department Heads involved in this grievance (Primary & Collaborating)
    const involvedDepts = await prisma.grievance_departments.findMany({
      where: { grievance_id: grievanceId },
      select: { department_id: true },
    });
    const deptIds = new Set<bigint>();
    if (grievance.grievance_departments?.department_id) {
      deptIds.add(grievance.grievance_departments.department_id);
    }
    for (const d of involvedDepts) {
      deptIds.add(d.department_id);
    }

    // 1. Fetch latest resolution to identify who resolved this grievance
    const latestResolution = await prisma.resolutions.findFirst({
      where: { grievance_id: grievanceId },
      orderBy: { submitted_at: "desc" },
      include: {
        users: {
          include: { roles: true },
        },
      },
    });

    const resolverRole = latestResolution?.users?.roles?.role_name;
    const resolverUserId = latestResolution?.submitted_by;
    const isHeadResolver = resolverRole === "DEPARTMENT_HEAD";

    // 2. Notify all Department Heads involved in this grievance
    for (const dId of Array.from(deptIds)) {
      const hods = await prisma.users.findMany({
        where: {
          department_id: dId,
          roles: { role_name: { in: ["DEPARTMENT_HEAD", "ADMIN"] } },
          status: "ACTIVE",
        },
        select: { user_id: true },
      });
      for (const hod of hods) {
        const isThisHodTheResolver = resolverUserId === hod.user_id;
        await NotificationService.send({
          userId: hod.user_id,
          grievanceId: grievanceId,
          type: "RESOLUTION_ACCEPTED",
          title: `Resolution Accepted: ${grievance.grievance_number}`,
          message: isThisHodTheResolver
            ? `The citizen has accepted your direct resolution for grievance ${grievance.grievance_number}. You can now propose it as a Knowledge Article.`
            : `The citizen has accepted the resolution for grievance ${grievance.grievance_number}. The grievance is now officially closed.`,
        });
      }
    }

    // 3. Notify the Staff member who handled/resolved the grievance (if resolved by staff)
    let staffIdToNotify: bigint | null = null;
    if (!isHeadResolver && latestResolution) {
      staffIdToNotify = latestResolution.submitted_by;
    } else if (!isHeadResolver) {
      const lastAssignment = await prisma.assignments.findFirst({
        where: { grievance_id: grievanceId },
        orderBy: { assigned_at: "desc" },
      });
      if (lastAssignment) {
        staffIdToNotify = lastAssignment.staff_id;
      }
    }

    if (staffIdToNotify) {
      await NotificationService.send({
        userId: staffIdToNotify,
        grievanceId: grievanceId,
        type: "RESOLUTION_ACCEPTED",
        title: `Resolution Accepted: ${grievance.grievance_number}`,
        message: `Your resolution for grievance ${grievance.grievance_number} was accepted by the citizen. The case is now officially closed. You can now propose it as a Knowledge Article.`,
      });
    }

    // 4. Notify the End User confirming their acceptance
    await NotificationService.send({
      userId: user.user_id,
      grievanceId: grievanceId,
      type: "RESOLUTION_ACCEPTED",
      title: `Resolution Accepted: ${grievance.grievance_number}`,
      message: `You have accepted the resolution for grievance ${grievance.grievance_number}. The case is now officially closed. Thank you for your feedback.`,
    });

    return NextResponse.json({
      success: true,
      message: "Resolution accepted successfully",
    });
  } catch (error) {
    console.error("Error accepting resolution:", error);
    return NextResponse.json(
      { success: false, message: "Failed to accept resolution" },
      { status: 500 },
    );
  }
}
