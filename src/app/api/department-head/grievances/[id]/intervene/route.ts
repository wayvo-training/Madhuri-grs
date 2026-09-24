import { NextResponse } from "next/server";
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
      bottleneck = "STAFF_CAPACITY",
      interventionType = "REASSIGN",
      targetStaffId,
      targetDeptName,
      note = "",
    } = body;

    // 1. Verify grievance exists and belongs to department (or Admin)
    const grievanceDept = await prisma.grievance_departments.findFirst({
      where: {
        grievance_id: grievanceId,
        ...(isAdmin ? {} : { department_id: departmentId }),
      },
      include: {
        grievances: {
          include: {
            assignments: {
              where: { assignment_status: "ASSIGNED" },
              include: { users_assignments_staff_idTousers: true },
            },
          },
        },
      },
    });

    if (!grievanceDept) {
      return NextResponse.json(
        {
          success: false,
          message: "Grievance not found or not in your department queue",
        },
        { status: 404 },
      );
    }

    const grievance = grievanceDept.grievances;
    const hodFullName = `${user.first_name} ${user.last_name || ""}`.trim();

    const bottleneckLabels: Record<string, string> = {
      STAFF_CAPACITY: "Staff Capacity / Absence",
      CROSS_DEPT: "Cross-Department Dependency",
      MISSING_DOCS: "Incomplete Submitter Documentation",
      COMPLEX_INVESTIGATION: "Complex Case Investigation",
      ADMIN_DELAY: "Internal Administrative Delay",
    };

    const chosenBottleneck = bottleneckLabels[bottleneck] || bottleneck;

    let targetStaffName = "Unassigned";
    let parsedTargetStaffId: bigint | null = null;

    if (targetStaffId) {
      try {
        parsedTargetStaffId = BigInt(targetStaffId);
        const st = await prisma.users.findUnique({
          where: { user_id: parsedTargetStaffId },
          select: { first_name: true, last_name: true },
        });
        if (st) {
          targetStaffName = `${st.first_name} ${st.last_name || ""}`.trim();
        }
      } catch {
        // ignore
      }
    }

    const currentAssignedStaff =
      grievance.assignments[0]?.users_assignments_staff_idTousers;
    const currentStaffName = currentAssignedStaff
      ? `${currentAssignedStaff.first_name} ${currentAssignedStaff.last_name || ""}`.trim()
      : "Assigned Officer";

    const actionLabels: Record<string, string> = {
      MONITOR: "Continue Monitoring (75% SLA Risk Acknowledged by HOD)",
      NOTIFY_STAFF: `Direct Operational Nudge Dispatched to ${currentStaffName}`,
      REASSIGN: `Reassigned to ${targetStaffName}`,
      CROSS_DEPT: `Enlisted Supporting Department (${targetDeptName || "External Department"})`,
      EXPEDITE: "Expedited Priority (Fast-Track Override)",
      OVERRIDE: "Executive Directive / Direct HOD Guidance",
      SLA_EXTENSION: "Authorized Formal 48h SLA Extension",
    };

    const chosenAction = actionLabels[interventionType] || interventionType;

    // Execute state changes and audit logging in transaction
    await prisma.$transaction(async (tx) => {
      // 0. Handle NOTIFY_STAFF intervention
      if (interventionType === "NOTIFY_STAFF" && currentAssignedStaff) {
        await tx.notifications.create({
          data: {
            user_id: currentAssignedStaff.user_id,
            grievance_id: grievanceId,
            notification_type: "HOD_DIRECTIVE_REMINDER",
            channel: "IN_APP",
            title: `HOD Directive: Expedite Case Resolution (${grievance.grievance_number})`,
            message:
              note ||
              "Department Head has reviewed this grievance approaching SLA threshold and directed immediate prioritization without reassignment.",
            status: "PENDING",
            created_at: new Date(),
          },
        });
      }

      // 1. Handle REASSIGN intervention
      if (interventionType === "REASSIGN" && parsedTargetStaffId) {
        await tx.assignments.updateMany({
          where: {
            grievance_department_id: grievanceDept.grievance_department_id,
            assignment_status: "ASSIGNED",
          },
          data: {
            assignment_status: "REASSIGNED",
            completed_at: new Date(),
          },
        });

        await tx.assignments.create({
          data: {
            grievance_id: grievanceId,
            grievance_department_id: grievanceDept.grievance_department_id,
            staff_id: parsedTargetStaffId,
            assigned_by: user.user_id,
            assigned_at: new Date(),
            assignment_status: "ASSIGNED",
            recommendation_reasons: { reason: "HOD SLA Intervention" },
          },
        });
      }

      // 2. Handle CROSS_DEPT intervention
      if (interventionType === "CROSS_DEPT" && targetDeptName) {
        const supportDept = await tx.departments.findFirst({
          where: {
            department_name: { contains: targetDeptName, mode: "insensitive" },
          },
        });
        if (supportDept) {
          const existingSupport = await tx.grievance_departments.findFirst({
            where: {
              grievance_id: grievanceId,
              department_id: supportDept.department_id,
            },
          });
          if (!existingSupport) {
            await tx.grievance_departments.create({
              data: {
                grievance_id: grievanceId,
                department_id: supportDept.department_id,
                involvement_type: "SUPPORTING",
                status: "PENDING_ASSIGNMENT",
                assigned_at: new Date(),
              },
            });
          }
        }
      }

      // 3. Update grievance priority, deadline & status
      let updatedDueAt = grievance.due_at;
      let updatedSlaStatus = grievance.sla_status;
      let updatedPriority = grievance.priority;

      if (interventionType === "SLA_EXTENSION") {
        const currentDue = grievance.due_at || new Date();
        updatedDueAt = new Date(currentDue.getTime() + 48 * 3600 * 1000);
        updatedSlaStatus = "ON_TRACK";
      } else if (interventionType === "EXPEDITE") {
        updatedPriority = "CRITICAL";
        updatedSlaStatus = "AT_RISK";
      }

      await tx.grievances.update({
        where: { grievance_id: grievanceId },
        data: {
          status: "IN_PROGRESS",
          priority: updatedPriority,
          sla_status: updatedSlaStatus,
          due_at: updatedDueAt,
          updated_at: new Date(),
        },
      });

      // 4. Record sequential Steps 5 to 9 in audit_logs
      // Step 5: Bottleneck Identified
      await tx.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          user_id: user.user_id,
          action: "Step 5: Bottleneck Identified",
          entity_type: "grievance",
          entity_id: grievanceId,
          new_value: {
            bottleneck: chosenBottleneck,
            details: `Identified primary bottleneck stalling resolution: ${chosenBottleneck}.`,
            stage: "BOTTLENECK_IDENTIFIED",
          },
        },
      });

      // Step 6: Intervention Action Taken
      await tx.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          user_id: user.user_id,
          action: "HOD_INTERVENTION_TAKEN",
          entity_type: "grievance",
          entity_id: grievanceId,
          new_value: {
            actionType: interventionType,
            actionLabel: chosenAction,
            bottleneck: chosenBottleneck,
            note: note || "Proceed with expedited priority.",
            intervenedBy: hodFullName,
            targetStaffName,
            targetDepartment: targetDeptName,
            details: `Action: ${chosenAction}. Directive: "${note || "Proceed with expedited priority."}"`,
            stage: "INTERVENTION_TAKEN",
          },
        },
      });

      // Step 7: Action Logged in Audit Trail
      await tx.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          user_id: user.user_id,
          action: "Step 7: Action Logged in Audit Trail",
          entity_type: "grievance",
          entity_id: grievanceId,
          new_value: {
            details:
              "Immutable audit entry recorded for Department Head intervention under SLA protocol.",
            stage: "AUDIT_LOGGED",
          },
        },
      });

      // Step 8: Staff / Supporting Dept Notified
      const notifyTarget =
        interventionType === "REASSIGN"
          ? targetStaffName
          : interventionType === "CROSS_DEPT"
            ? targetDeptName || "Supporting Department"
            : targetStaffName;

      await tx.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          user_id: user.user_id,
          action: "Step 8: Staff / Supporting Dept Notified",
          entity_type: "grievance",
          entity_id: grievanceId,
          new_value: {
            details: `Operational directives dispatched to ${notifyTarget}.`,
            stage: "STAFF_NOTIFIED",
          },
        },
      });

      // Step 9: Grievance Continues
      await tx.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          user_id: user.user_id,
          action: "Step 9: Grievance Continues",
          entity_type: "grievance",
          entity_id: grievanceId,
          new_value: {
            details:
              "Status resumed as IN_PROGRESS under active intervention safeguards.",
            stage: "IN_PROGRESS",
          },
        },
      });

      // Status history
      await tx.grievance_status_history.create({
        data: {
          grievance_id: grievanceId,
          old_status: grievance.status,
          new_status: "IN_PROGRESS",
          changed_by: user.user_id,
          remarks: `SLA Intervention: ${chosenAction} (${chosenBottleneck})`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Steps 5-9 Complete: HOD intervention logged to audit trail & dispatched to staff. Grievance continues in progress.`,
      intervention: {
        actionType: interventionType,
        actionLabel: chosenAction,
        bottleneck: chosenBottleneck,
        note,
        targetStaffName,
        targetDepartment: targetDeptName,
      },
    });
  } catch (error) {
    console.error("Error in intervene route:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to process intervention",
      },
      { status: 500 },
    );
  }
}
