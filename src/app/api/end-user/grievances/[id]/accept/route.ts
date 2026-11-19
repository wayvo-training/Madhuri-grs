import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";
import { getPrimaryDepartment } from "@/lib/utils/grievance-departments";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (user?.roles?.role_name !== "END_USER") {
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

    if (
      grievance.status !== "RESOLVED" &&
      grievance.status !== "UNDER_REVIEW" &&
      grievance.status !== "RESOLUTION_PENDING_APPROVAL"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Only resolved or review-pending grievances can be accepted",
        },
        { status: 400 },
      );
    }

    // Update grievance to CLOSED with closure_reason
    await prisma.grievances.update({
      where: { grievance_id: grievanceId },
      data: {
        status: "CLOSED",
        closed_at: new Date(),
        closure_reason: "EMPLOYEE_ACCEPTED",
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

    // Mark all involved departments as COMPLETED so their departmental status is closed
    await prisma.grievance_departments.updateMany({
      where: {
        grievance_id: grievanceId,
        status: { notIn: ["REMOVED"] },
      },
      data: {
        status: "COMPLETED",
        completed_at: new Date(),
      },
    });

    // Mark SLA tracking as permanently completed
    const { completeSlaTracking, calculateSlaConsumption } = await import(
      "@/lib/engines/sla-engine"
    );
    await completeSlaTracking(grievanceId);

    const activeTracking = await prisma.sla_tracking.findFirst({
      where: { grievance_id: grievanceId },
      orderBy: { cycle_number: "desc" },
    });
    const now = new Date();
    const slaMetrics = calculateSlaConsumption(
      grievance.created_at,
      grievance.due_at,
      grievance.priority,
      now,
      activeTracking?.accumulated_paused_minutes || 0,
      activeTracking?.paused_at,
    );
    const remainingMinutes = Math.max(
      0,
      slaMetrics.totalDurationMinutes - slaMetrics.elapsedMinutes,
    );

    // Log the event with SLA duration and closure reason retained
    await prisma.audit_logs.create({
      data: {
        grievance_id: grievanceId,
        user_id: user.user_id,
        action: "CLOSED",
        entity_type: "GRIEVANCE",
        entity_id: grievanceId,
        new_value: {
          closureReason: "EMPLOYEE_ACCEPTED",
          elapsedDurationMinutes: slaMetrics.elapsedMinutes,
          remainingDurationMinutes: remainingMinutes,
          totalDurationMinutes: slaMetrics.totalDurationMinutes,
          accumulatedPausedMinutes:
            activeTracking?.accumulated_paused_minutes || 0,
          pausedAt: activeTracking?.paused_at,
          cycleNumber: activeTracking?.cycle_number || 1,
          cycleType: activeTracking?.cycle_type || "INITIAL",
          details:
            "Grievance resolution accepted and closed by the end user. SLA remains permanently paused.",
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
    // 1. Collect all department IDs involved in this grievance (Primary & Collaborating)
    const involvedDepts = await prisma.grievance_departments.findMany({
      where: { grievance_id: grievanceId },
      select: { department_id: true },
    });
    const deptIds = new Set<bigint>();
    const primaryGDept = getPrimaryDepartment(grievance);
    if (primaryGDept?.department_id) {
      deptIds.add(primaryGDept.department_id);
    }
    for (const d of involvedDepts) {
      deptIds.add(d.department_id);
    }

    // 2. Fetch latest resolution to identify who resolved this grievance
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

    const notifiedUserIds = new Set<string>();

    // 3. Notify all Department Heads involved in this grievance
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
        if (notifiedUserIds.has(hod.user_id.toString())) continue;
        notifiedUserIds.add(hod.user_id.toString());

        const isThisHodTheResolver = resolverUserId === hod.user_id;
        await NotificationService.send({
          userId: hod.user_id,
          grievanceId: grievanceId,
          type: "RESOLUTION_ACCEPTED",
          title: `Resolution Accepted: ${grievance.grievance_number}`,
          message: isThisHodTheResolver
            ? `The employee has accepted your direct resolution for grievance ${grievance.grievance_number}. You can now propose it as a Knowledge Article.`
            : `The employee has accepted the resolution for grievance ${grievance.grievance_number}. The grievance is now officially closed.`,
        });
      }
    }

    // 4. Notify ALL involved Staff members across primary and collaborating departments
    const allAssignments = await prisma.assignments.findMany({
      where: { grievance_id: grievanceId },
      select: { staff_id: true },
    });

    const staffIdsToNotify = new Set<bigint>();
    for (const a of allAssignments) {
      if (a.staff_id) {
        staffIdsToNotify.add(a.staff_id);
      }
    }
    if (resolverUserId && !isHeadResolver) {
      staffIdsToNotify.add(resolverUserId);
    }

    for (const staffId of Array.from(staffIdsToNotify)) {
      if (notifiedUserIds.has(staffId.toString())) continue;
      notifiedUserIds.add(staffId.toString());

      const isDirectResolver = resolverUserId === staffId;
      await NotificationService.send({
        userId: staffId,
        grievanceId: grievanceId,
        type: "RESOLUTION_ACCEPTED",
        title: `Resolution Accepted: ${grievance.grievance_number}`,
        message: isDirectResolver
          ? `Your resolution for grievance ${grievance.grievance_number} was accepted by the employee. The case is now officially closed. You can now propose it as a Knowledge Article.`
          : `The employee has accepted the resolution for grievance ${grievance.grievance_number}. Your department's contribution is complete and the case is now officially closed.`,
      });
    }

    // 5. Notify the End User confirming their acceptance
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
