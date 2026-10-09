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
      bottleneckExplanation,
      interventionType = "MONITOR",
      targetStaffId,
      targetDeptName,
      note = "",
      extensionHours = 24,
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

    if (grievance.status === "CLOSED" || grievance.status === "RESOLVED") {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot intervene on a ${grievance.status.toLowerCase()} grievance.`,
        },
        { status: 400 },
      );
    }

    const hodFullName = `${user.first_name} ${user.last_name || ""}`.trim();

    const bottleneckLabels: Record<string, string> = {
      STAFF_CAPACITY: "Staff Capacity / Absence",
      CROSS_DEPT: "Cross-Department Dependency",
      MISSING_DOCS: "Incomplete Information / Documentation",
      COMPLEX_INVESTIGATION: "Complex Investigation Required",
      OTHER_CONSTRAINT: "Other Operational Constraint",
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

      if (parsedTargetStaffId && interventionType === "REASSIGN") {
        const activeCount = await prisma.assignments.count({
          where: {
            staff_id: parsedTargetStaffId,
            assignment_status: "ASSIGNED",
            grievance_id: { not: grievanceId },
            grievances: {
              status: { notIn: ["CLOSED"] },
            },
          },
        });

        if (activeCount >= 10) {
          return NextResponse.json(
            {
              success: false,
              message:
                "This Staff member has reached the maximum active workload of 10 grievances.",
            },
            { status: 400 },
          );
        }
      }
    }

    const currentAssignedStaff =
      grievance.assignments[0]?.users_assignments_staff_idTousers;
    const currentStaffName = currentAssignedStaff
      ? `${currentAssignedStaff.first_name} ${currentAssignedStaff.last_name || ""}`.trim()
      : "Assigned Officer";

    const hours = Number(extensionHours) || 24;
    const actionLabels: Record<string, string> = {
      MONITOR: "Continue Monitoring",
      REQUEST_STATUS_UPDATE: `Immediate Status Update Requested from ${currentStaffName}`,
      NOTIFY_STAFF: `Add Direction (Dispatched to ${currentStaffName})`,
      CROSS_DEPT: `Supporting Department Added (${targetDeptName || "External Department"})`,
      REASSIGN: `Reassigned to ${targetStaffName}`,
      ASSUME_RESOLUTION_AUTHORITY: `Resolution Authority Assumed by ${hodFullName}`,
      DIRECT_OVERSIGHT: `Resolution Authority Assumed by ${hodFullName}`,
      REQUEST_ADDITIONAL_INFO: "Request Additional Information Dispatched",
      EXTEND_SLA: `Resolution SLA Deadline Extended (+${hours}h)`,
    };

    const chosenAction = actionLabels[interventionType] || interventionType;
    let newExtendedDueAt: Date | null = null;
    if (interventionType === "EXTEND_SLA") {
      const currentDue = grievance.due_at
        ? new Date(grievance.due_at)
        : new Date();
      const baseTime =
        currentDue.getTime() > Date.now() ? currentDue.getTime() : Date.now();
      newExtendedDueAt = new Date(baseTime + hours * 3600 * 1000);
    }

    const isAssumingAuthority =
      interventionType === "ASSUME_RESOLUTION_AUTHORITY" ||
      interventionType === "DIRECT_OVERSIGHT";

    // Execute state changes and audit logging in transaction
    await prisma.$transaction(async (tx) => {
      // 1. ASSUME_RESOLUTION_AUTHORITY
      if (isAssumingAuthority) {
        // Notify previously assigned Staff that Head has assumed resolution authority
        if (currentAssignedStaff) {
          await tx.notifications.create({
            data: {
              user_id: currentAssignedStaff.user_id,
              grievance_id: grievanceId,
              notification_type: "HOD_RESOLUTION_AUTHORITY_ASSUMED",
              channel: "IN_APP",
              title: `Resolution Authority Assumed: ${grievance.grievance_number}`,
              message: `Department Head ${hodFullName} has assumed resolution authority for Grievance ${grievance.grievance_number}. Your existing investigation findings and notes have been preserved for the Head's review.`,
              status: "PENDING",
              created_at: new Date(),
            },
          });
        }

        // Send confirmation notification to Department Head
        await tx.notifications.create({
          data: {
            user_id: user.user_id,
            grievance_id: grievanceId,
            notification_type: "HOD_RESOLUTION_AUTHORITY_ASSUMED",
            channel: "IN_APP",
            title: `Resolution Authority Assumed: ${grievance.grievance_number}`,
            message: `You have assumed resolution authority for Grievance ${grievance.grievance_number}. You may now review staff findings and submit the resolution.`,
            status: "PENDING",
            created_at: new Date(),
          },
        });
      }

      // 2. Handle REQUEST_STATUS_UPDATE and NOTIFY_STAFF interventions
      if (
        (interventionType === "REQUEST_STATUS_UPDATE" ||
          interventionType === "NOTIFY_STAFF") &&
        currentAssignedStaff
      ) {
        const isExplicitRequest = interventionType === "REQUEST_STATUS_UPDATE";
        await tx.notifications.create({
          data: {
            user_id: currentAssignedStaff.user_id,
            grievance_id: grievanceId,
            notification_type: "HOD_DIRECTIVE_REMINDER",
            channel: "IN_APP",
            title: isExplicitRequest
              ? `Action Required: Immediate Status Update Requested (${grievance.grievance_number})`
              : `Department Head Directive: Priority Direction (${grievance.grievance_number})`,
            message: note
              ? `[Grievance ${grievance.grievance_number}] ${note}`
              : isExplicitRequest
                ? `Department Head requires an immediate operational progress update and next planned actions within 4 hours for Grievance ${grievance.grievance_number}.`
                : `Department Head has reviewed Grievance ${grievance.grievance_number} and provided operational direction.`,
            status: "PENDING",
            created_at: new Date(),
          },
        });

        // Insert confirmation notification for Department Head
        await tx.notifications.create({
          data: {
            user_id: user.user_id,
            grievance_id: grievanceId,
            notification_type: "HOD_DIRECTIVE_REMINDER",
            channel: "IN_APP",
            title: isExplicitRequest
              ? `Status Update Requested: ${grievance.grievance_number}`
              : `Directive Sent: ${grievance.grievance_number}`,
            message: `You issued an operational direction to ${currentStaffName} regarding Grievance ${grievance.grievance_number}.`,
            status: "PENDING",
            created_at: new Date(),
          },
        });
      }

      // 3. Handle REQUEST_ADDITIONAL_INFO
      if (interventionType === "REQUEST_ADDITIONAL_INFO") {
        if (grievance.submitted_by) {
          await tx.notifications.create({
            data: {
              user_id: grievance.submitted_by,
              grievance_id: grievanceId,
              notification_type: "INFO_REQUESTED",
              channel: "IN_APP",
              title: `Additional Information Requested: ${grievance.grievance_number}`,
              message: note
                ? `[Grievance ${grievance.grievance_number}] Department Head requested additional information: ${note}`
                : `Additional information or documentation is required for processing Grievance ${grievance.grievance_number}.`,
              status: "PENDING",
              created_at: new Date(),
            },
          });
        }
        if (currentAssignedStaff) {
          await tx.notifications.create({
            data: {
              user_id: currentAssignedStaff.user_id,
              grievance_id: grievanceId,
              notification_type: "INFO_REQUESTED",
              channel: "IN_APP",
              title: `Info Request Dispatched: ${grievance.grievance_number}`,
              message: `Department Head requested additional documentation for Grievance ${grievance.grievance_number}. Directive: ${note || "Follow up on missing documentation."}`,
              status: "PENDING",
              created_at: new Date(),
            },
          });
        }
      }

      // 4. Handle REASSIGN intervention
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
            recommendation_reasons: {
              reason: "Department Head SLA Intervention",
            },
          },
        });

        await tx.notifications.create({
          data: {
            user_id: parsedTargetStaffId,
            grievance_id: grievanceId,
            notification_type: "REASSIGNMENT",
            channel: "IN_APP",
            title: `Case Reassigned`,
            message: `You have been reassigned to Grievance ${grievance.grievance_number} following a Department Head SLA Intervention.`,
            status: "PENDING",
            created_at: new Date(),
          },
        });

        await tx.notifications.create({
          data: {
            user_id: user.user_id,
            grievance_id: grievanceId,
            notification_type: "REASSIGNMENT",
            channel: "IN_APP",
            title: `Reassignment Confirmed: ${grievance.grievance_number}`,
            message: `You reassigned Grievance ${grievance.grievance_number} to ${targetStaffName}.`,
            status: "PENDING",
            created_at: new Date(),
          },
        });
      }

      // 5. Handle CROSS_DEPT intervention
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

            await tx.notifications.create({
              data: {
                user_id: user.user_id,
                grievance_id: grievanceId,
                notification_type: "SUPPORTING_STAFF_ADDED",
                channel: "IN_APP",
                title: `Supporting Department Added: ${grievance.grievance_number}`,
                message: `You added ${supportDept.department_name} as a supporting department for Grievance ${grievance.grievance_number}.`,
                status: "PENDING",
                created_at: new Date(),
              },
            });
          }
        }
      }

      // 6. Handle EXTEND_SLA intervention
      if (interventionType === "EXTEND_SLA" && newExtendedDueAt) {
        const latestSla = await tx.sla_tracking.findFirst({
          where: { grievance_id: grievanceId },
          orderBy: { sla_tracking_id: "desc" },
        });

        if (latestSla) {
          await tx.sla_tracking.update({
            where: { sla_tracking_id: latestSla.sla_tracking_id },
            data: {
              due_at: newExtendedDueAt,
              status: "ON_TRACK",
            },
          });
        }

        if (currentAssignedStaff) {
          await tx.notifications.create({
            data: {
              user_id: currentAssignedStaff.user_id,
              grievance_id: grievanceId,
              notification_type: "SLA_AT_RISK",
              channel: "IN_APP",
              title: `SLA Deadline Extended (+${hours}h): ${grievance.grievance_number}`,
              message: `Department Head granted a +${hours}h SLA extension. Revised resolution deadline: ${newExtendedDueAt.toLocaleString()}. Reason: ${note}`,
              status: "PENDING",
              created_at: new Date(),
            },
          });
        }

        await tx.notifications.create({
          data: {
            user_id: user.user_id,
            grievance_id: grievanceId,
            notification_type: "SLA_AT_RISK",
            channel: "IN_APP",
            title: `SLA Extension Granted: ${grievance.grievance_number}`,
            message: `You extended the resolution SLA for Grievance ${grievance.grievance_number} by +${hours}h until ${newExtendedDueAt.toLocaleString()}.`,
            status: "PENDING",
            created_at: new Date(),
          },
        });
      }

      // 7. Update grievance:
      // IMPORTANT BUSINESS RULE:
      // - DO NOT reset SLA clock when assuming resolution authority
      // - Preserve original SLA breach information
      // - If EXTEND_SLA, update due_at and sla_status
      await tx.grievances.update({
        where: { grievance_id: grievanceId },
        data: {
          status: isAssumingAuthority ? grievance.status : "IN_PROGRESS",
          ...(interventionType === "EXTEND_SLA" && newExtendedDueAt
            ? { due_at: newExtendedDueAt, sla_status: "ON_TRACK" }
            : {}),
          updated_at: new Date(),
        },
      });

      // 8. Record genuine HOD Intervention in immutable audit_logs
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
            bottleneckExplanation: bottleneckExplanation || undefined,
            note: note || undefined,
            intervenedBy: hodFullName,
            intervenedByUserId: user.user_id.toString(),
            isResolutionAuthority: isAssumingAuthority,
            resolutionAuthorityName: isAssumingAuthority
              ? hodFullName
              : undefined,
            resolutionAuthorityUserId: isAssumingAuthority
              ? user.user_id.toString()
              : undefined,
            targetStaffName: targetStaffName || undefined,
            targetDepartment: targetDeptName || undefined,
            extensionHours:
              interventionType === "EXTEND_SLA" ? hours : undefined,
            newDueAt: newExtendedDueAt
              ? newExtendedDueAt.toISOString()
              : undefined,
            intervenedAt: new Date().toISOString(),
            details: `Intervention: ${chosenAction} (Bottleneck: ${chosenBottleneck}${bottleneckExplanation ? ` - ${bottleneckExplanation}` : ""}). Directive: "${note || "Proceed under departmental directives."}"`,
          },
        },
      });

      // 9. Status history
      await tx.grievance_status_history.create({
        data: {
          grievance_id: grievanceId,
          old_status: grievance.status,
          new_status: isAssumingAuthority ? grievance.status : "IN_PROGRESS",
          changed_by: user.user_id,
          remarks: `SLA Escalation Intervention: ${chosenAction} (${chosenBottleneck})`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: isAssumingAuthority
        ? "Resolution authority assumed successfully. You may now review investigation findings and submit the resolution."
        : `Intervention (${chosenAction}) logged to audit trail.`,
      intervention: {
        actionType: interventionType,
        actionLabel: chosenAction,
        bottleneck: chosenBottleneck,
        bottleneckExplanation,
        note,
        targetStaffName,
        targetDepartment: targetDeptName,
        isResolutionAuthority: isAssumingAuthority,
        resolutionAuthorityName: isAssumingAuthority ? hodFullName : undefined,
        resolutionAuthorityUserId: isAssumingAuthority
          ? user.user_id.toString()
          : undefined,
        extensionHours: interventionType === "EXTEND_SLA" ? hours : undefined,
        newDueAt: newExtendedDueAt ? newExtendedDueAt.toISOString() : undefined,
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
