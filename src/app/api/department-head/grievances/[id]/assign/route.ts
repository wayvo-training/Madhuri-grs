import { NextResponse } from "next/server";
import { DEFAULT_ASSIGNMENT_CONFIG } from "@/lib/constants/assignment";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import { prisma } from "@/lib/prisma";

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
    const body = await request.json();
    const {
      staffId,
      note,
      recommendationScore,
      recommendationReasons,
      assignmentRole: rawAssignmentRole,
      role,
      replaceStaffId,
      replaceAssignmentId,
    } = body;

    const assignmentRole: "PRIMARY" | "SUPPORTING" =
      (rawAssignmentRole || role || "PRIMARY").toUpperCase() === "SUPPORTING"
        ? "SUPPORTING"
        : "PRIMARY";

    if (!staffId) {
      return NextResponse.json(
        { success: false, message: "Staff ID is required for assignment" },
        { status: 400 },
      );
    }

    const targetStaffId = BigInt(staffId);

    // 1. Verify staff exists and is active
    const staff = await prisma.users.findUnique({
      where: { user_id: targetStaffId },
      include: { roles: true },
    });

    if (staff?.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Selected staff member is not active or found",
        },
        { status: 404 },
      );
    }

    // 2. Enforce maximum active workload capacity
    const activeAssignedCount = await prisma.assignments.count({
      where: {
        staff_id: targetStaffId,
        assignment_status: "ASSIGNED",
        grievance_id: { not: grievanceId },
        grievances: {
          status: {
            notIn: Array.from(
              DEFAULT_ASSIGNMENT_CONFIG.INACTIVE_WORKLOAD_STATUSES,
            ),
          },
        },
      },
    });

    if (activeAssignedCount >= DEFAULT_ASSIGNMENT_CONFIG.MAX_STAFF_CAPACITY) {
      return NextResponse.json(
        {
          success: false,
          message: `This staff member has reached the maximum active workload of ${DEFAULT_ASSIGNMENT_CONFIG.MAX_STAFF_CAPACITY} grievances.`,
        },
        { status: 400 },
      );
    }

    // Validate that department heads can only assign staff from their own department
    if (
      !isAdmin &&
      staff.department_id &&
      departmentId &&
      BigInt(staff.department_id) !== departmentId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You can only assign staff members belonging to your department.",
        },
        { status: 403 },
      );
    }

    // 3. Resolve the target grievance_department
    const grievanceDept = await prisma.grievance_departments.findFirst({
      where: {
        grievance_id: grievanceId,
        ...(isAdmin
          ? staff.department_id
            ? { department_id: BigInt(staff.department_id) }
            : {}
          : { department_id: departmentId }),
      },
      include: { grievances: true },
    });

    if (!grievanceDept) {
      return NextResponse.json(
        {
          success: false,
          message: "Grievance does not belong to your department queue",
        },
        { status: 403 },
      );
    }

    const grievance = grievanceDept.grievances;

    if (grievanceDept.status === "BLOCKED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot assign staff: This department is currently BLOCKED waiting for prerequisite departments to complete.",
        },
        { status: 400 },
      );
    }

    if (
      grievance.status === "CLOSED" ||
      grievance.status === "RESOLVED" ||
      grievance.status === "COMPLETED" ||
      grievance.status === "UNDER_REVIEW" ||
      grievanceDept.status === "COMPLETED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot assign or change assignment for a ${grievance.status.toLowerCase().replace(/_/g, " ")} grievance.`,
        },
        { status: 400 },
      );
    }

    const staffName = `${staff.first_name} ${staff.last_name || ""}`.trim();

    // Check if staff member already has an active assignment in this department
    const existingStaffAssignment = await prisma.assignments.findFirst({
      where: {
        grievance_department_id: grievanceDept.grievance_department_id,
        staff_id: targetStaffId,
        assignment_status: "ASSIGNED",
      },
    });

    if (existingStaffAssignment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This staff member is already actively assigned to this grievance department.",
        },
        { status: 400 },
      );
    }

    // Prepare recommendation payload if provided
    const reasonsPayload = recommendationReasons
      ? {
          ...(typeof recommendationReasons === "object"
            ? recommendationReasons
            : {}),
          ...(note ? { directive_note: note } : {}),
        }
      : note
        ? { note }
        : undefined;

    const roleTitle =
      assignmentRole === "SUPPORTING"
        ? "Supporting Investigator"
        : "Primary Investigator";

    let priorAssignment: { assignment_id: bigint; staff_id: bigint } | null =
      null;

    // 3. Database transaction: Complete prior active assignment, create new assignment, update status and logs
    await prisma.$transaction(async (tx) => {
      if (assignmentRole === "PRIMARY") {
        const priorPrimary = await tx.assignments.findFirst({
          where: {
            grievance_department_id: grievanceDept.grievance_department_id,
            assignment_status: "ASSIGNED",
            assignment_role: "PRIMARY",
          },
        });

        if (priorPrimary) {
          priorAssignment = priorPrimary;
          await tx.assignments.update({
            where: { assignment_id: priorPrimary.assignment_id },
            data: {
              assignment_status: "REASSIGNED",
              completed_at: new Date(),
            },
          });

          if (priorPrimary.staff_id !== targetStaffId) {
            await tx.notifications.create({
              data: {
                user_id: priorPrimary.staff_id,
                grievance_id: grievanceId,
                notification_type: "ASSIGNMENT",
                channel: "IN_APP",
                title: `Case Reassigned: ${grievance.grievance_number}`,
                message: `Your assignment as Primary Investigator on Grievance ${grievance.grievance_number} (${grievance.title}) has been transferred to ${staffName}. Your access has been revoked.`,
                status: "PENDING",
                created_at: new Date(),
              },
            });
          }
        }
      } else {
        // SUPPORTING role reassignment if a specific previous assignment is targeted
        if (replaceAssignmentId || replaceStaffId) {
          const priorSupporting = await tx.assignments.findFirst({
            where: {
              grievance_department_id: grievanceDept.grievance_department_id,
              assignment_status: "ASSIGNED",
              assignment_role: "SUPPORTING",
              ...(replaceAssignmentId
                ? { assignment_id: BigInt(replaceAssignmentId) }
                : {}),
              ...(replaceStaffId ? { staff_id: BigInt(replaceStaffId) } : {}),
            },
          });

          if (priorSupporting) {
            priorAssignment = priorSupporting;
            await tx.assignments.update({
              where: { assignment_id: priorSupporting.assignment_id },
              data: {
                assignment_status: "REASSIGNED",
                completed_at: new Date(),
              },
            });

            if (priorSupporting.staff_id !== targetStaffId) {
              await tx.notifications.create({
                data: {
                  user_id: priorSupporting.staff_id,
                  grievance_id: grievanceId,
                  notification_type: "ASSIGNMENT",
                  channel: "IN_APP",
                  title: `Case Reassigned: ${grievance.grievance_number}`,
                  message: `Your supporting role on Grievance ${grievance.grievance_number} (${grievance.title}) has been transferred to ${staffName}. Your access has been revoked.`,
                  status: "PENDING",
                  created_at: new Date(),
                },
              });
            }
          }
        }
      }

      // Insert new active assignment
      await tx.assignments.create({
        data: {
          grievance_id: grievanceId,
          grievance_department_id: grievanceDept.grievance_department_id,
          staff_id: targetStaffId,
          assigned_by: user.user_id,
          assigned_at: new Date(),
          assignment_status: "ASSIGNED",
          assignment_role: assignmentRole,
          recommendation_score:
            recommendationScore !== undefined && recommendationScore !== null
              ? Number(recommendationScore)
              : null,
          recommendation_reasons: reasonsPayload,
        },
      });

      // Insert active assignment notification for target staff member
      await tx.notifications.create({
        data: {
          user_id: targetStaffId,
          grievance_id: grievanceId,
          notification_type: "ASSIGNMENT",
          channel: "IN_APP",
          title:
            assignmentRole === "SUPPORTING"
              ? `Assigned as Supporting Investigator: ${grievance.grievance_number}`
              : `New Case Assigned: ${grievance.grievance_number}`,
          message: note
            ? `You have been assigned as ${roleTitle} on Grievance ${grievance.grievance_number} (${grievance.title}). Note: "${note}"`
            : `You have been assigned as ${roleTitle} on Grievance ${grievance.grievance_number} (${grievance.title}) by Department Head.`,
          status: "PENDING",
          created_at: new Date(),
        },
      });

      // Insert confirmation notification for the assigner (Department Head / Admin)
      if (user.user_id !== targetStaffId) {
        await tx.notifications.create({
          data: {
            user_id: user.user_id,
            grievance_id: grievanceId,
            notification_type: "ASSIGNMENT",
            channel: "IN_APP",
            title: `Assignment Confirmed: ${grievance.grievance_number}`,
            message: `You assigned grievance ${grievance.grievance_number} (${grievance.title}) to ${staffName} as ${roleTitle}.`,
            status: "PENDING",
            created_at: new Date(),
          },
        });
      }

      // Update grievance_departments status
      await tx.grievance_departments.update({
        where: {
          grievance_department_id: grievanceDept.grievance_department_id,
        },
        data: {
          status: "ASSIGNED",
          assigned_at: new Date(),
        },
      });

      // Update grievance status to ASSIGNED if unassigned, or progress REWORK/REOPENED workflows
      let newStatus = grievance.status;
      let shouldIncrementReopenCount = false;
      let shouldStartReworkCycle = false;
      let shouldStartReopenedCycle = false;

      if (
        grievance.status === "SUBMITTED" ||
        grievance.status === "ROUTED" ||
        grievance.status === "AWAITING_ASSIGNMENT" ||
        grievance.status === "AWAITING_ROUTING"
      ) {
        newStatus = "ASSIGNED";
      } else if (grievance.status === "REWORK") {
        newStatus = "IN_PROGRESS";
        shouldIncrementReopenCount = true;
        shouldStartReworkCycle = true;
      } else if (grievance.status === "RESOLUTION_PENDING_APPROVAL") {
        const hasBeenClosed =
          Boolean(grievance.closed_at) ||
          Boolean(
            await tx.grievance_status_history.findFirst({
              where: { grievance_id: grievanceId, old_status: "CLOSED" },
            }),
          );
        if (hasBeenClosed) {
          newStatus = "REOPENED";
          shouldIncrementReopenCount = true;
          shouldStartReopenedCycle = true;
        }
      }

      await tx.grievances.update({
        where: { grievance_id: grievanceId },
        data: {
          status: newStatus,
          updated_at: new Date(),
          ...(shouldIncrementReopenCount
            ? { reopen_count: { increment: 1 } }
            : {}),
        },
      });

      if (shouldStartReworkCycle) {
        const { initiateReworkSlaCycle } = await import(
          "@/lib/engines/sla-engine"
        );
        await initiateReworkSlaCycle(grievanceId, grievance.priority, tx);
      } else if (shouldStartReopenedCycle) {
        const { initiateReopenedSlaCycle } = await import(
          "@/lib/engines/sla-engine"
        );
        await initiateReopenedSlaCycle(grievanceId, grievance.priority, tx);
      }

      // Record audit log
      await tx.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          user_id: user.user_id,
          action: priorAssignment ? "REASSIGNED_STAFF" : "ASSIGNED_TO_STAFF",
          entity_type: "GRIEVANCE",
          entity_id: grievanceId,
          new_value: {
            staff_id: staff.user_id.toString(),
            staff_name: staffName,
            assignment_role: assignmentRole,
            role_label: roleTitle,
            replaced_staff_id: priorAssignment
              ? priorAssignment.staff_id.toString()
              : null,
            note: note || `Assigned as ${roleTitle} by Department Head`,
            stage: "ASSIGNED",
            recommendation_score: recommendationScore ?? null,
            recommendation_reasons: reasonsPayload ?? null,
            details: priorAssignment
              ? `Reassigned ${roleTitle} on department ${grievanceDept.department_id.toString()} to ${staffName}`
              : `Assigned as ${roleTitle} to ${staffName}${recommendationScore ? ` (Match score: ${recommendationScore}%)` : ""}`,
          },
        },
      });

      // Record status history
      await tx.grievance_status_history.create({
        data: {
          grievance_id: grievanceId,
          old_status: grievance.status,
          new_status: newStatus,
          changed_by: user.user_id,
          remarks: note || `Assigned as ${roleTitle} to ${staffName}`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Assigned grievance ${grievance.grievance_number} to ${staffName} as ${roleTitle}.`,
      assignedStaff: {
        id: staff.user_id.toString(),
        name: staffName,
        email: staff.email,
        assignmentRole,
      },
    });
  } catch (error) {
    console.error("Error in assign route:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to assign staff member",
      },
      { status: 500 },
    );
  }
}
