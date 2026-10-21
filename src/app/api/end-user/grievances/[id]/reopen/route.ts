import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  evaluateReopenPolicy,
  requiresHeadManualReview,
} from "@/lib/engines/reopen-engine";
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

    if (!["RESOLVED", "UNDER_REVIEW", "CLOSED"].includes(grievance.status)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only resolved, under-review, or closed grievances can be reopened",
        },
        { status: 400 },
      );
    }

    // Evaluate Reopen Policy dynamically
    const reopenPolicy = await evaluateReopenPolicy({
      categoryId: grievance.category_id,
      subcategoryId: grievance.subcategory_id,
      priority: grievance.priority,
    });

    const maxReopens = reopenPolicy.maxReopenCount;
    const windowHours = reopenPolicy.reopenWindowHours;

    if (grievance.reopen_count >= maxReopens) {
      return NextResponse.json(
        {
          success: false,
          message: `Maximum reopen limit of ${maxReopens} reached for this grievance.`,
        },
        { status: 400 },
      );
    }

    const referenceClosedTime = grievance.closed_at || grievance.updated_at;
    if (windowHours && referenceClosedTime) {
      const hoursSinceClosed =
        (Date.now() - referenceClosedTime.getTime()) / (1000 * 60 * 60);
      if (hoursSinceClosed > windowHours) {
        return NextResponse.json(
          {
            success: false,
            message: `Reopen window of ${windowHours} hours has expired.`,
          },
          { status: 400 },
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    const reason = body.reason || "Reopened by user";

    const newReopenCount = grievance.reopen_count + 1;
    // Escalate on reaching manual review threshold or max allowed count
    const isEscalated = requiresHeadManualReview(newReopenCount, reopenPolicy);
    const newStatus = isEscalated ? "ESCALATED" : "REOPENED";

    // Resolve target Department Head or fallback Admin
    const primaryDeptRecord = getPrimaryDepartment(grievance);
    const pRecord = primaryDeptRecord as
      | {
          grievance_department_id: bigint;
          department_id: bigint;
        }
      | undefined;

    let targetDeptId = pRecord?.department_id;
    if (!targetDeptId) {
      const gDept = await prisma.grievance_departments.findFirst({
        where: { grievance_id: grievanceId },
      });
      targetDeptId = gDept?.department_id;
    }

    let hod = targetDeptId
      ? await prisma.users.findFirst({
          where: {
            department_id: targetDeptId,
            roles: { role_name: "DEPARTMENT_HEAD" },
            status: "ACTIVE",
          },
          select: { user_id: true },
        })
      : null;

    if (!hod) {
      hod = await prisma.users.findFirst({
        where: {
          roles: { role_name: { in: ["DEPARTMENT_HEAD", "ADMIN"] } },
          status: "ACTIVE",
        },
        select: { user_id: true },
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
      // 1. Update grievance status and reopen count
      await tx.grievances.update({
        where: { grievance_id: grievanceId },
        data: {
          status: newStatus,
          reopen_count: { increment: 1 },
        },
      });

      // 2. Route reopened grievance to Primary Department first
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
              },
            });
          }
        }
      }

      // 3. Revoke active assignments so the grievance returns to the unassigned queue
      await tx.assignments.updateMany({
        where: {
          grievance_id: grievanceId,
          assignment_status: "ASSIGNED",
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
          action: "REOPENED",
          entity_type: "GRIEVANCE",
          entity_id: grievanceId,
          new_value: {
            details: `Grievance reopened by the end user: ${reason}${isEscalated ? ". Automatically escalated to Department Head." : ""}`,
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

      // 6. Create escalation record if reaching manual review threshold (idempotent, single record)
      if (isEscalated && hod) {
        const existingEscalation = await tx.escalations.findFirst({
          where: { grievance_id: grievanceId, status: "OPEN" },
        });

        if (!existingEscalation) {
          await tx.escalations.create({
            data: {
              grievance_id: grievanceId,
              escalated_to: hod.user_id,
              escalation_level: 1,
              reason: `Automated Reopen Limit Escalation: Reopened ${newReopenCount} times (reached review threshold of ${reopenPolicy.maxManualReviewCount}). Reason: ${reason}`,
              status: "OPEN",
            },
          });
        }
      }
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

    // 2. Notify Department Head / Admin
    if (hod) {
      await NotificationService.send({
        userId: hod.user_id,
        grievanceId: grievanceId,
        type: isEscalated ? "GRIEVANCE_ESCALATED" : "GRIEVANCE_REOPENED",
        title: isEscalated
          ? "Max Reopen Limit Reached — Head Manual Review Required"
          : "Grievance Reopened by Employee",
        message: isEscalated
          ? `Grievance ${grievance.grievance_number} has reached the maximum reopen count (${newReopenCount} reopens) and requires head manual review. Employee reason: ${reason}. As Department Head, you can solve this grievance directly or assign it to another person.`
          : `Grievance ${grievance.grievance_number} has been reopened by the employee. Reason provided: ${reason}`,
      });
    }

    // 3. Notify Staff Who Solved/Worked On It
    for (const assignment of previousStaffAssignments) {
      await NotificationService.send({
        userId: assignment.staff_id,
        grievanceId: grievanceId,
        type: "GRIEVANCE_REOPENED",
        title: "Grievance Reopened",
        message: `Grievance ${grievance.grievance_number} which you recently worked on has been reopened by the employee. Reason: ${reason}. It has been returned to the department queue.`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Grievance reopened successfully",
    });
  } catch (error) {
    console.error("Error reopening grievance:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reopen grievance" },
      { status: 500 },
    );
  }
}
