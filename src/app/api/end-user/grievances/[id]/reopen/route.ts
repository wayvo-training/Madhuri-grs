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

    // Evaluate Reopen Policy
    const activePolicies = await prisma.reopen_policies.findMany({
      where: { status: "ACTIVE" },
      orderBy: { created_at: "desc" },
    });

    let matchedPolicy = null;
    for (const policy of activePolicies) {
      if (policy.applicable_condition) {
        const cond = policy.applicable_condition as any;
        const matchesCategory = !cond.category_id || cond.category_id === grievance.category_id.toString();
        const matchesSubcategory = !cond.subcategory_id || cond.subcategory_id === grievance.subcategory_id.toString();
        if (matchesCategory && matchesSubcategory) {
          matchedPolicy = policy;
          break;
        }
      } else {
        // global fallback policy
        if (!matchedPolicy) matchedPolicy = policy;
      }
    }

    const maxReopens = matchedPolicy?.max_reopen_count ?? 3;
    const windowHours = matchedPolicy?.reopen_window_hours ?? null;

    if (grievance.reopen_count >= maxReopens) {
      return NextResponse.json({ success: false, message: `Maximum reopen limit of ${maxReopens} reached for this grievance.` }, { status: 400 });
    }

    if (windowHours && grievance.closed_at) {
      const hoursSinceClosed = (Date.now() - grievance.closed_at.getTime()) / (1000 * 60 * 60);
      if (hoursSinceClosed > windowHours) {
        return NextResponse.json({ success: false, message: `Reopen window of ${windowHours} hours has expired.` }, { status: 400 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Reopened by user";

    const newReopenCount = grievance.reopen_count + 1;
    // Escalate on the final allowed reopen attempt if maxReopens >= 2, or if it reaches 3 by default
    const isEscalated = newReopenCount >= (maxReopens === 1 ? 2 : maxReopens);
    const newStatus = isEscalated ? "ESCALATED" : "REOPENED";

    // Update grievance
    await prisma.grievances.update({
      where: { grievance_id: grievanceId },
      data: {
        status: newStatus,
        reopen_count: { increment: 1 },
      },
    });

    // Fetch assigned staff before revoking so we can notify them
    const activeAssignments = await prisma.assignments.findMany({
      where: { grievance_id: grievanceId, assignment_status: "ASSIGNED" }
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
        new_value: { details: `Grievance reopened by the end user: ${reason}${isEscalated ? ". Automatically escalated to Department Head." : ""}` },
      },
    });

    // Log status history
    await prisma.grievance_status_history.create({
      data: {
        grievance_id: grievanceId,
        old_status: "RESOLVED",
        new_status: newStatus,
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
    let deptId = grievance.grievance_departments?.department_id;
    if (!deptId) {
      const gDept = await prisma.grievance_departments.findFirst({
        where: { grievance_id: grievanceId },
      });
      deptId = gDept?.department_id;
    }

    let hod = deptId
      ? await prisma.users.findFirst({
          where: { department_id: deptId, roles: { role_name: { in: ["DEPARTMENT_HEAD", "ADMIN"] } }, status: "ACTIVE" },
          select: { user_id: true }
        })
      : null;

    if (!hod) {
      hod = await prisma.users.findFirst({
        where: { roles: { role_name: { in: ["DEPARTMENT_HEAD", "ADMIN"] } }, status: "ACTIVE" },
        select: { user_id: true }
      });
    }

    if (hod) {
      if (isEscalated) {
        // Explicitly create an escalation record
        await prisma.escalations.create({
          data: {
            grievance_id: grievanceId,
            escalated_to: hod.user_id,
            reason: `Automatically escalated due to reaching max reopen limit (${newReopenCount} reopens). Citizen reason: ${reason}`,
            status: "OPEN",
            escalation_level: 1,
          }
        });
      }

      await NotificationService.send({
        userId: hod.user_id,
        grievanceId: grievanceId,
        type: isEscalated ? "GRIEVANCE_ESCALATED" : "GRIEVANCE_REOPENED",
        title: isEscalated ? `Max Reopen Limit Reached — Head Manual Review Required` : "Grievance Reopened by User",
        message: isEscalated
          ? `Grievance ${grievance.grievance_number} has reached the maximum reopen count (${newReopenCount} reopens) and requires head manual review. Citizen reason: ${reason}. As Department Head, you can solve this grievance directly or assign it to another person.`
          : `Grievance ${grievance.grievance_number} has been reopened by the citizen. Reason provided: ${reason}`,
      });
    }

    // 3. Notify Staff Who Solved It
    for (const assignment of activeAssignments) {
      await NotificationService.send({
        userId: assignment.staff_id,
        grievanceId: grievanceId,
        type: "GRIEVANCE_REOPENED",
        title: "Grievance Reopened",
        message: `Grievance ${grievance.grievance_number} which you recently resolved has been reopened by the citizen. Reason: ${reason}. It has been returned to the department queue.`,
      });
    }

    return NextResponse.json({ success: true, message: "Grievance reopened successfully" });
  } catch (error) {
    console.error("Error reopening grievance:", error);
    return NextResponse.json({ success: false, message: "Failed to reopen grievance" }, { status: 500 });
  }
}
