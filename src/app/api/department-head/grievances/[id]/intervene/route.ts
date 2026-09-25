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
      MONITOR: "Continue Monitoring (SLA Risk Acknowledged by HOD)",
      NOTIFY_STAFF: `Direct Operational Nudge Dispatched to ${currentStaffName}`,
      REASSIGN: `Reassigned to ${targetStaffName}`,
      CROSS_DEPT: `Enlisted Supporting Department (${targetDeptName || "External Department"})`,
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

        await tx.notifications.create({
          data: {
            user_id: parsedTargetStaffId,
            grievance_id: grievanceId,
            notification_type: "REASSIGNMENT",
            channel: "IN_APP",
            title: `Case Reassigned`,
            message: `You have been reassigned to Grievance ${grievance.grievance_number} due to a Department Head SLA Intervention.`,
            status: "PENDING",
            created_at: new Date(),
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

            const supportDeptHead = await tx.users.findFirst({
              where: {
                department_id: supportDept.department_id,
                roles: { role_name: "DEPARTMENT_HEAD" },
                status: "ACTIVE",
              },
            });

            if (supportDeptHead) {
              await tx.notifications.create({
                data: {
                  user_id: supportDeptHead.user_id,
                  grievance_id: grievanceId,
                  notification_type: "SUPPORTING_STAFF_ADDED",
                  channel: "IN_APP",
                  title: `Supporting Department Added`,
                  message: `Your department has been added as a supporting department for Grievance ${grievance.grievance_number}.`,
                  status: "PENDING",
                  created_at: new Date(),
                },
              });
            }
          }
        }
      }

      // 3. Update grievance status to IN_PROGRESS under active intervention
      await tx.grievances.update({
        where: { grievance_id: grievanceId },
        data: {
          status: "IN_PROGRESS",
          updated_at: new Date(),
        },
      });

      // 4. Mark open escalations as RESOLVED by Department Head
      await tx.escalations.updateMany({
        where: {
          grievance_id: grievanceId,
          status: "OPEN",
        },
        data: {
          status: "RESOLVED",
          resolved_at: new Date(),
        },
      });

      // Record single genuine HOD Intervention in audit_logs
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
            note: note || undefined,
            intervenedBy: hodFullName,
            targetStaffName: targetStaffName || undefined,
            targetDepartment: targetDeptName || undefined,
            details: `Intervention: ${chosenAction} (Bottleneck: ${chosenBottleneck}). Directive: "${note || "Proceed with expedited resolution under departmental directives."}"`,
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
