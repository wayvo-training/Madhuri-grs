import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { validateReopenReason } from "@/lib/constants/reopen";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";
import { getPrimaryDepartment } from "@/lib/utils/grievance-departments";

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

    // Find the grievance
    const grievance = await prisma.grievances.findUnique({
      where: { grievance_id: grievanceId },
      include: {
        grievance_departments: true,
      },
    });

    if (!grievance || grievance.submitted_by !== user.user_id) {
      return NextResponse.json(
        { success: false, message: "Grievance not found" },
        { status: 404 },
      );
    }

    if (
      ![
        "RESOLVED",
        "UNDER_REVIEW",
        "RESOLUTION_PENDING_APPROVAL",
        "CLOSED",
      ].includes(grievance.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only resolved, review-pending, or closed grievances can be reopened",
        },
        { status: 400 },
      );
    }

    // 1. Shared combined limit: maximum 3 successful combined rework and reopening attempts
    const MAX_COMBINED_ATTEMPTS = 3;
    if (grievance.reopen_count >= MAX_COMBINED_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          message: `Maximum combined limit reached (${MAX_COMBINED_ATTEMPTS} attempts). No further rework or reopening requests are allowed for this grievance.`,
        },
        { status: 400 },
      );
    }

    if (
      grievance.closure_reason === "REWORK_REJECTED_FINAL" ||
      grievance.closure_reason === "REOPEN_REJECTED_FINAL"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This grievance was permanently closed after 3 rework reviews by the Department Head. No further rework or reopening requests are allowed.",
        },
        { status: 400 },
      );
    }

    // Check rejection count from audit logs
    const rejectionCount = await prisma.audit_logs.count({
      where: {
        grievance_id: grievanceId,
        action: {
          in: [
            "REWORK_REJECTED",
            "REOPEN_REJECTED",
            "REWORK_REJECTED_FINAL",
            "REOPEN_REJECTED_FINAL",
          ],
        },
      },
    });

    if (rejectionCount >= MAX_COMBINED_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          message: `Maximum review rejections reached (${MAX_COMBINED_ATTEMPTS}). No further rework or reopening requests are allowed for this grievance.`,
        },
        { status: 400 },
      );
    }

    // 2. Validate Reopening Window (14 days = 336 hours)
    const isPostClosureReopen = grievance.status === "CLOSED";
    if (isPostClosureReopen) {
      const referenceClosedTime = grievance.closed_at || grievance.updated_at;
      if (referenceClosedTime) {
        const hoursSinceClosed =
          (Date.now() - referenceClosedTime.getTime()) / (1000 * 60 * 60);
        const maxWindowHours = 14 * 24; // 14 days (336 hours)
        if (hoursSinceClosed > maxWindowHours) {
          return NextResponse.json(
            {
              success: false,
              message: "Reopening window of 14 days has expired.",
            },
            { status: 400 },
          );
        }
      }
    }

    const body = await request.json().catch(() => ({}));
    const rawReason = typeof body.reason === "string" ? body.reason : "";
    const reasonValidation = validateReopenReason(rawReason);
    if (!reasonValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: reasonValidation.error || "Invalid rework/reopen reason",
        },
        { status: 400 },
      );
    }
    const reason = rawReason.trim();

    // In accordance with Approved Reconciliation:
    // If grievance was in RESOLVED (citizen rejects proposed resolution before closure):
    // -> Target status is REWORK (awaiting mandatory Department Head review; SLA remains paused)
    // If grievance was in CLOSED (post-closure reopening within 14 days):
    // -> Target status is RESOLUTION_PENDING_APPROVAL (awaiting mandatory Department Head review)
    // IMPORTANT: Shared attempt counter (reopen_count) is NOT incremented upon citizen request!
    // It is incremented ONLY after Department Head successfully reviews and approves the request.
    const newStatus = isPostClosureReopen
      ? "RESOLUTION_PENDING_APPROVAL"
      : "REWORK";

    // Resolve all participating departments and their Department Heads
    const allInvolvedDepts = await prisma.grievance_departments.findMany({
      where: { grievance_id: grievanceId },
      include: { departments: true },
    });

    const primaryDeptRecord = getPrimaryDepartment(grievance);
    const pRecord = primaryDeptRecord as
      | {
          grievance_department_id: bigint;
          department_id: bigint;
        }
      | undefined;

    let targetDeptId = pRecord?.department_id;
    if (!targetDeptId) {
      targetDeptId = allInvolvedDepts[0]?.department_id;
    }

    const involvedDeptIds = allInvolvedDepts.map((d) => d.department_id);

    // Fetch HODs for all participating departments
    const allDepartmentHeads = await prisma.users.findMany({
      where: {
        department_id: { in: involvedDeptIds },
        roles: { role_name: "DEPARTMENT_HEAD" },
        status: "ACTIVE",
      },
      select: { user_id: true, department_id: true },
    });

    let hod: { user_id: bigint; department_id: bigint | null } | null =
      allDepartmentHeads.find(
        (h) =>
          h.department_id &&
          targetDeptId &&
          BigInt(h.department_id) === BigInt(targetDeptId),
      ) ||
      allDepartmentHeads[0] ||
      null;

    if (!hod) {
      hod = await prisma.users.findFirst({
        where: {
          roles: { role_name: { in: ["DEPARTMENT_HEAD", "ADMIN"] } },
          status: "ACTIVE",
        },
        select: { user_id: true, department_id: true },
      });
    }

    // Fetch staff who previously worked on or resolved this grievance
    const previousStaffAssignments = await prisma.assignments.findMany({
      where: {
        grievance_id: grievanceId,
        assignment_status: { in: ["ASSIGNED", "COMPLETED"] },
      },
    });

    // Execute all database updates atomically in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update grievance status without incrementing reopen_count.
      // Shared counter is incremented strictly when Department Head approves.
      await tx.grievances.update({
        where: { grievance_id: grievanceId },
        data: {
          status: newStatus,
          closed_at: null,
          closure_reason: null,
        },
      });

      // 2. Route reopened/rework grievance to Primary Department queue
      if (pRecord) {
        await tx.grievance_departments.update({
          where: {
            grievance_department_id: pRecord.grievance_department_id,
          },
          data: {
            status: "PENDING_ASSIGNMENT",
          },
        });

        // Ensure dependent sequential departments are reset to BLOCKED while Primary re-investigates
        const otherDepts = await tx.grievance_departments.findMany({
          where: {
            grievance_id: grievanceId,
            grievance_department_id: { not: pRecord.grievance_department_id },
            dependency_type: "SEQUENTIAL",
          },
        });

        for (const d of otherDepts) {
          const rawPrereqs = d.prerequisite_department_ids;
          const prereqIds = Array.isArray(rawPrereqs)
            ? (rawPrereqs as (number | string | bigint)[]).map((pid) =>
                String(pid),
              )
            : [];

          if (prereqIds.includes(pRecord.department_id.toString())) {
            await tx.grievance_departments.update({
              where: { grievance_department_id: d.grievance_department_id },
              data: {
                status: "BLOCKED",
                activated_at: null,
                due_at: null,
                completed_at: null,
              },
            });
          }
        }
      }

      // 3. Revoke active and completed assignments so the grievance returns to the unassigned queue
      await tx.assignments.updateMany({
        where: {
          grievance_id: grievanceId,
          assignment_status: { in: ["ASSIGNED", "COMPLETED"] },
        },
        data: {
          assignment_status: "REVOKED",
          completed_at: new Date(),
        },
      });

      // 4. Log the event
      await tx.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          user_id: user.user_id,
          action: isPostClosureReopen ? "REOPEN_REQUESTED" : "REWORK_REQUESTED",
          entity_type: "GRIEVANCE",
          entity_id: grievanceId,
          new_value: {
            details: isPostClosureReopen
              ? `Reopening requested by end user: "${reason}". Placed in Department Head review queue.`
              : `Rework requested by end user: "${reason}". Placed in Department Head review queue.`,
          },
        },
      });

      // 5. Log status history
      await tx.grievance_status_history.create({
        data: {
          grievance_id: grievanceId,
          old_status: grievance.status,
          new_status: newStatus,
          changed_by: user.user_id,
          remarks: reason,
        },
      });
    });

    // Notifications
    // 1. Notify End User
    await NotificationService.send({
      userId: user.user_id,
      grievanceId: grievanceId,
      type: isPostClosureReopen ? "REOPEN_REQUESTED" : "REWORK_REQUESTED",
      title: isPostClosureReopen
        ? `Requested for Reopen: Grievance ${grievance.grievance_number}`
        : `Requested for Rework: Grievance ${grievance.grievance_number}`,
      message: isPostClosureReopen
        ? `You have requested for reopen for closed grievance ${grievance.grievance_number}. Your request is pending Department Head review.`
        : `You have requested for rework for grievance ${grievance.grievance_number}. Your request is pending Department Head review.`,
    });

    // 2. Notify Department Heads of all participating departments
    const notifiedHeadIds = new Set<string>();

    for (const dHead of allDepartmentHeads) {
      const isLeadHead =
        targetDeptId &&
        dHead.department_id &&
        BigInt(dHead.department_id) === BigInt(targetDeptId);

      const deptRecord = allInvolvedDepts.find(
        (d) =>
          dHead.department_id &&
          BigInt(d.department_id) === BigInt(dHead.department_id),
      );
      const deptName = deptRecord?.departments?.department_name || "Department";

      notifiedHeadIds.add(dHead.user_id.toString());

      await NotificationService.send({
        userId: dHead.user_id,
        grievanceId: grievanceId,
        type: isPostClosureReopen ? "REOPEN_REQUESTED" : "REWORK_REQUESTED",
        title: isPostClosureReopen
          ? `Requested for Reopen: Grievance ${grievance.grievance_number}`
          : `Requested for Rework: Grievance ${grievance.grievance_number}`,
        message: isLeadHead
          ? isPostClosureReopen
            ? `Employee has requested for reopen for closed grievance ${grievance.grievance_number}. Reason: "${reason}". As Lead Department Head, please review and approve or reject this request.`
            : `Employee has requested for rework for grievance ${grievance.grievance_number}. Reason: "${reason}". As Lead Department Head, please review and assign staff for rework investigation.`
          : `Grievance ${grievance.grievance_number} involving your department (${deptName}) has been requested for ${isPostClosureReopen ? "reopen" : "rework"} by the employee. Reason: "${reason}".`,
      });
    }

    // Fallback if no specific department head was found in the involved list
    if (hod && !notifiedHeadIds.has(hod.user_id.toString())) {
      await NotificationService.send({
        userId: hod.user_id,
        grievanceId: grievanceId,
        type: isPostClosureReopen ? "REOPEN_REQUESTED" : "REWORK_REQUESTED",
        title: isPostClosureReopen
          ? `Requested for Reopen: Grievance ${grievance.grievance_number}`
          : `Requested for Rework: Grievance ${grievance.grievance_number}`,
        message: `Employee has requested for ${isPostClosureReopen ? "reopen" : "rework"} for grievance ${grievance.grievance_number}. Reason: "${reason}". Please review in your queue.`,
      });
    }

    // 3. Notify Staff Who Worked On It
    for (const assignment of previousStaffAssignments) {
      await NotificationService.send({
        userId: assignment.staff_id,
        grievanceId: grievanceId,
        type: isPostClosureReopen ? "REOPEN_REQUESTED" : "REWORK_REQUESTED",
        title: isPostClosureReopen
          ? `Requested for Reopen: Grievance ${grievance.grievance_number}`
          : `Requested for Rework: Grievance ${grievance.grievance_number}`,
        message: `Employee has requested for ${isPostClosureReopen ? "reopen" : "rework"} for grievance ${grievance.grievance_number}: "${reason}".`,
      });
    }

    return NextResponse.json({
      success: true,
      message: isPostClosureReopen
        ? "Reopening request submitted successfully. Case is pending Department Head review."
        : "Rework request submitted successfully. Case placed in Department Head review queue.",
    });
  } catch (error) {
    console.error("Error reopening grievance:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reopen grievance" },
      { status: 500 },
    );
  }
}
