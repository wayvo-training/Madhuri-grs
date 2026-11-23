import { NextResponse } from "next/server";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import { evaluateReopenPolicy } from "@/lib/engines/reopen-engine";
import {
  initiateReopenedSlaCycle,
  initiateReworkSlaCycle,
} from "@/lib/engines/sla-engine";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";

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
    const body = await request.json().catch(() => ({}));
    const { decision, reason, staffId } = body;

    if (decision !== "APPROVE" && decision !== "REJECT") {
      return NextResponse.json(
        {
          success: false,
          message: "Decision must be either 'APPROVE' or 'REJECT'.",
        },
        { status: 400 },
      );
    }

    const cleanReason = typeof reason === "string" ? reason.trim() : "";
    if (decision === "REJECT") {
      if (cleanReason.length < 15) {
        return NextResponse.json(
          {
            success: false,
            message: `A descriptive rejection reason of at least 15 characters is required (currently ${cleanReason.length}).`,
          },
          { status: 400 },
        );
      }
      if (!/[a-zA-Z]/.test(cleanReason)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Rejection reason cannot consist of numbers or symbols alone.",
          },
          { status: 400 },
        );
      }
    }

    // Resolve grievance and primary department
    const grievance = await prisma.grievances.findUnique({
      where: { grievance_id: grievanceId },
      include: {
        grievance_departments: {
          include: { departments: true },
        },
      },
    });

    if (!grievance) {
      return NextResponse.json(
        { success: false, message: "Grievance not found" },
        { status: 404 },
      );
    }

    const primaryDept =
      grievance.grievance_departments.find(
        (d) => d.involvement_type === "PRIMARY",
      ) || grievance.grievance_departments[0];

    if (
      !isAdmin &&
      departmentId &&
      primaryDept &&
      primaryDept.department_id !== departmentId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: Only the Lead Department Head or Admin can review rework/reopening requests.",
        },
        { status: 403 },
      );
    }

    const isRework = grievance.status === "REWORK";
    const isReopen =
      grievance.status === "RESOLUTION_PENDING_APPROVAL" ||
      grievance.status === "REOPENED";

    if (!isRework && !isReopen) {
      return NextResponse.json(
        {
          success: false,
          message: `Grievance is in ${grievance.status} status and does not require rework/reopening approval.`,
        },
        { status: 400 },
      );
    }

    const reopenPolicy = await evaluateReopenPolicy({
      categoryId: grievance.category_id,
      subcategoryId: grievance.subcategory_id,
      priority: grievance.priority,
    });
    const maxRejections =
      reopenPolicy.maxRejectionCount || reopenPolicy.maxReopenCount || 3;
    const maxCombinedAttempts = reopenPolicy.maxReopenCount || 3;

    // 1. REJECT DECISION
    if (decision === "REJECT") {
      // Count previous rejections
      const existingRejections = await prisma.audit_logs.count({
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

      const currentRejectionNumber = existingRejections + 1;
      const isFinalRejection = currentRejectionNumber >= maxRejections;

      const targetStatus = isFinalRejection
        ? "CLOSED"
        : isRework
          ? "RESOLVED"
          : "CLOSED";

      const closureReason = isFinalRejection
        ? isRework
          ? "REWORK_REJECTED_FINAL"
          : "REOPEN_REJECTED_FINAL"
        : isReopen
          ? "REOPEN_REJECTED"
          : null;

      await prisma.$transaction(async (tx) => {
        await tx.grievances.update({
          where: { grievance_id: grievanceId },
          data: {
            status: targetStatus,
            updated_at: new Date(),
            ...(targetStatus === "CLOSED"
              ? {
                  closed_at: new Date(),
                  closure_reason: closureReason,
                }
              : {}),
          },
        });

        if (primaryDept) {
          await tx.grievance_departments.update({
            where: {
              grievance_department_id: primaryDept.grievance_department_id,
            },
            data: { status: "COMPLETED" },
          });
        }

        // Record status history
        const remarksText = isFinalRejection
          ? `Department Head rejected ${isRework ? "rework" : "reopening"} request (Rejection ${currentRejectionNumber} of ${maxRejections}). Grievance permanently closed: "${cleanReason}"`
          : `Department Head rejected ${isRework ? "rework" : "reopening"} request (Rejection ${currentRejectionNumber} of ${maxRejections}): "${cleanReason}"`;

        await tx.grievance_status_history.create({
          data: {
            grievance_id: grievanceId,
            old_status: grievance.status,
            new_status: targetStatus,
            changed_by: user.user_id,
            remarks: remarksText,
          },
        });

        // Audit log
        const auditAction = isRework
          ? isFinalRejection
            ? "REWORK_REJECTED_FINAL"
            : "REWORK_REJECTED"
          : isFinalRejection
            ? "REOPEN_REJECTED_FINAL"
            : "REOPEN_REJECTED";

        await tx.audit_logs.create({
          data: {
            grievance_id: grievanceId,
            user_id: user.user_id,
            action: auditAction,
            entity_type: "GRIEVANCE",
            entity_id: grievanceId,
            new_value: {
              rejectionReason: cleanReason,
              revertedStatus: targetStatus,
              rejectionCount: currentRejectionNumber,
              isAutoClosed: isFinalRejection,
              closureReason,
            },
          },
        });
      });

      // Notify End User
      const notifTitle = isFinalRejection
        ? `${isRework ? "Rework" : "Reopening"} Rejected · Case Closed`
        : `${isRework ? "Rework" : "Reopening"} Request Rejected`;

      const notifMessage = isFinalRejection
        ? `Your ${isRework ? "rework" : "reopening"} request for grievance ${grievance.grievance_number} was rejected by the Department Head: "${cleanReason}". Maximum review attempts reached (${currentRejectionNumber}/${maxRejections}). This grievance has been permanently closed.`
        : `Your ${isRework ? "rework" : "reopening"} request for grievance ${grievance.grievance_number} was rejected by the Department Head: "${cleanReason}". (${currentRejectionNumber} of ${maxRejections} review attempts used).`;

      await NotificationService.send({
        userId: grievance.submitted_by,
        grievanceId,
        type: "SYSTEM",
        title: notifTitle,
        message: notifMessage,
      });

      return NextResponse.json({
        success: true,
        message: isFinalRejection
          ? `${isRework ? "Rework" : "Reopening"} request rejected (Attempt ${currentRejectionNumber} of ${maxRejections}). Grievance has been permanently CLOSED.`
          : `${isRework ? "Rework" : "Reopening"} request rejected (Attempt ${currentRejectionNumber} of ${maxRejections}). Case reverted to ${targetStatus}.`,
        isClosed: isFinalRejection,
        rejectionCount: currentRejectionNumber,
        status: targetStatus,
      });
    }

    // 2. APPROVE DECISION
    // Enforce shared counter limit based on active policy
    const MAX_COMBINED_ATTEMPTS = maxCombinedAttempts;
    if (grievance.reopen_count >= MAX_COMBINED_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot approve: Maximum combined limit of ${MAX_COMBINED_ATTEMPTS} attempts has already been reached for this grievance.`,
        },
        { status: 400 },
      );
    }

    let assignedStaffId = user.user_id;
    if (staffId) {
      const sId = BigInt(staffId);
      const targetStaff = await prisma.users.findUnique({
        where: { user_id: sId },
      });
      if (targetStaff?.status === "ACTIVE") {
        assignedStaffId = sId;
      }
    }

    await prisma.$transaction(async (tx) => {
      // Increment shared counter strictly upon Department Head approval
      const newStatus = "IN_PROGRESS";

      await tx.grievances.update({
        where: { grievance_id: grievanceId },
        data: {
          status: newStatus,
          reopen_count: { increment: 1 },
          closed_at: null,
          closure_reason: null,
          updated_at: new Date(),
        },
      });

      // Update primary department
      if (primaryDept) {
        await tx.grievance_departments.update({
          where: {
            grievance_department_id: primaryDept.grievance_department_id,
          },
          data: {
            status: "IN_PROGRESS",
            activated_at: new Date(),
            completed_at: null,
            sla_status: "ON_TRACK",
          },
        });

        // Create assignment for staff or head
        await tx.assignments.create({
          data: {
            grievance_id: grievanceId,
            grievance_department_id: primaryDept.grievance_department_id,
            staff_id: assignedStaffId,
            assigned_by: user.user_id,
            assigned_at: new Date(),
            assignment_status: "ASSIGNED",
          },
        });
      }

      // Multi-department handling for collaborating/supportive departments:
      const supportingDepts = grievance.grievance_departments.filter(
        (d) =>
          d.grievance_department_id !== primaryDept?.grievance_department_id,
      );

      const isSequential = grievance.grievance_departments.some(
        (d) =>
          d.dependency_type === "SEQUENTIAL" ||
          Number(d.execution_order || 1) > 1,
      );

      for (const sDept of supportingDepts) {
        if (!isSequential) {
          // In parallel workflow: Reactivate supportive departments into PENDING_ASSIGNMENT
          // so supportive department head can directly investigate or assign staff.
          await tx.grievance_departments.update({
            where: {
              grievance_department_id: sDept.grievance_department_id,
            },
            data: {
              status: "PENDING_ASSIGNMENT",
              activated_at: new Date(),
              completed_at: null,
              sla_status: "ON_TRACK",
            },
          });
        } else {
          // In sequential workflow: Dependent stages are reset to BLOCKED until upstream completes
          await tx.grievance_departments.update({
            where: {
              grievance_department_id: sDept.grievance_department_id,
            },
            data: {
              status: "BLOCKED",
              completed_at: null,
              sla_status: "ON_TRACK",
            },
          });
        }

        // Complete prior active assignments for supporting departments so they appear unassigned
        await tx.assignments.updateMany({
          where: {
            grievance_department_id: sDept.grievance_department_id,
            assignment_status: { in: ["ASSIGNED", "CO_ASSIGNED"] },
          },
          data: {
            assignment_status: "REASSIGNED",
            completed_at: new Date(),
          },
        });
      }

      // Initiate respective SLA cycle (Proposed 50% baseline, Pending Krishna's Approval)
      if (isRework) {
        await initiateReworkSlaCycle(grievanceId, grievance.priority, tx);
      } else {
        await initiateReopenedSlaCycle(grievanceId, grievance.priority, tx);
      }

      // Status history
      await tx.grievance_status_history.create({
        data: {
          grievance_id: grievanceId,
          old_status: grievance.status,
          new_status: newStatus,
          changed_by: user.user_id,
          remarks: `Department Head approved ${isRework ? "rework" : "reopening"} request: "${cleanReason || "Approved for investigation"}"`,
        },
      });

      // Audit log
      await tx.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          user_id: user.user_id,
          action: isRework ? "REWORK_APPROVED" : "REOPEN_APPROVED",
          entity_type: "GRIEVANCE",
          entity_id: grievanceId,
          new_value: {
            assignedStaffId: assignedStaffId.toString(),
            remarks: cleanReason,
          },
        },
      });

      // If the Department Head assumed direct authority to resolve on reopen/rework
      if (
        assignedStaffId === user.user_id ||
        cleanReason?.toLowerCase().includes("assumed direct authority")
      ) {
        const hodFullName =
          `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
          "Department Head";
        const primaryDeptName =
          primaryDept?.departments?.department_name || "Department";
        const primaryDeptIdStr = primaryDept?.department_id?.toString();

        await tx.audit_logs.create({
          data: {
            grievance_id: grievanceId,
            user_id: user.user_id,
            action: "HOD_INTERVENTION_TAKEN",
            entity_type: "GRIEVANCE",
            entity_id: grievanceId,
            new_value: {
              actionType: "ASSUME_RESOLUTION_AUTHORITY",
              actionLabel: `Resolution Authority Assumed by ${hodFullName}`,
              note:
                cleanReason ||
                "Department Head assumed direct authority to resolve",
              bottleneck: "Direct Department Head Intervention on Reopening",
              departmentId: primaryDeptIdStr,
              department_id: primaryDeptIdStr,
              targetDepartment: primaryDeptName,
              isResolutionAuthority: true,
              resolutionAuthorityName: hodFullName,
              resolutionAuthorityUserId: user.user_id.toString(),
              intervenedAt: new Date().toISOString(),
              intervenedBy: hodFullName,
              intervenedByUserId: user.user_id.toString(),
            },
          },
        });
      }
    });

    // Notify Employee
    await NotificationService.send({
      userId: grievance.submitted_by,
      grievanceId,
      type: isRework ? "REWORK_REQUIRED" : "GRIEVANCE_REOPENED",
      title: `${isRework ? "Rework" : "Reopening"} Request Approved`,
      message: `Your ${isRework ? "rework" : "reopening"} request for grievance ${grievance.grievance_number} has been approved by the Department Head. Department investigation is now active.`,
    });

    // Notify Supportive Department Heads (both parallel and sequential)
    const otherDepts = grievance.grievance_departments.filter(
      (d) => d.grievance_department_id !== primaryDept?.grievance_department_id,
    );
    if (otherDepts.length > 0) {
      const isSequentialFlow = grievance.grievance_departments.some(
        (d) =>
          d.dependency_type === "SEQUENTIAL" ||
          Number(d.execution_order || 1) > 1,
      );
      const otherDeptIds = otherDepts.map((d) => d.department_id);
      const supportiveHeads = await prisma.users.findMany({
        where: {
          department_id: { in: otherDeptIds },
          roles: { role_name: "DEPARTMENT_HEAD" },
          status: "ACTIVE",
        },
        select: { user_id: true, department_id: true },
      });

      const hodFullName = `${user.first_name} ${user.last_name || ""}`.trim();
      for (const sHead of supportiveHeads) {
        await NotificationService.send({
          userId: sHead.user_id,
          grievanceId,
          type: isRework ? "REWORK_REQUIRED" : "GRIEVANCE_REOPENED",
          title: `Grievance ${isRework ? "Rework" : "Reopening"} Approved: ${grievance.grievance_number}`,
          message: `Lead Department Head (${hodFullName}) approved the ${isRework ? "rework" : "reopening"} request for grievance ${grievance.grievance_number}. A new SLA cycle has started. ${!isSequentialFlow ? "Your department stage is in Pending Assignment — you can directly investigate or assign an officer in your queue." : "Your department stage is queued and will activate once upstream prerequisites complete."}`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${isRework ? "Rework" : "Reopening"} request approved successfully. New SLA cycle initiated.`,
    });
  } catch (error) {
    console.error("Error in review-request route:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
