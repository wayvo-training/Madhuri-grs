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
      decision = "APPROVE",
      feedback = "",
      findings = "",
      actionTaken = "",
      outcome = "RESOLVED",
      evidence = "",
    } = body;

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
            resolutions: {
              orderBy: { submitted_at: "desc" },
              take: 1,
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

    const allInvolvedDepts = await prisma.grievance_departments.findMany({
      where: { grievance_id: grievanceId },
    });
    const hasMultipleDepts = allInvolvedDepts.length > 1;
    const isLeadOrEqualDept =
      grievanceDept.involvement_type === "PRIMARY" ||
      grievanceDept.involvement_type === "EQUAL";

    if (!isAdmin && hasMultipleDepts && !isLeadOrEqualDept) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: As a supporting department, only Primary Lead or Equal Co-Lead Department Heads can approve or submit the final resolution.",
        },
        { status: 403 },
      );
    }

    const grievance = grievanceDept.grievances;
    const hodFullName = `${user.first_name} ${user.last_name || ""}`.trim();
    const latestResolution = grievance.resolutions[0];

    // Determine if this is a direct Head resolution or a review of a staff resolution
    const isDirectResolution =
      grievance.reopen_count >= 2 ||
      grievance.status === "ESCALATED" ||
      grievance.status !== "UNDER_REVIEW" ||
      !latestResolution;

    // Server-side authorization check for Direct Resolution by Department Head:
    // Verify SLA intervention has actually been executed and user is the active resolution authority
    if (isDirectResolution) {
      const interventionLog = await prisma.audit_logs.findFirst({
        where: {
          grievance_id: grievanceId,
          action: "HOD_INTERVENTION_TAKEN",
        },
        orderBy: { created_at: "desc" },
      });

      let hasInterventionAuthority = false;
      if (interventionLog?.new_value) {
        let val: Record<string, unknown> = {};
        if (typeof interventionLog.new_value === "string") {
          try {
            val = JSON.parse(interventionLog.new_value);
          } catch {
            val = {};
          }
        } else if (typeof interventionLog.new_value === "object") {
          val = interventionLog.new_value as Record<string, unknown>;
        }

        hasInterventionAuthority = Boolean(
          val.isResolutionAuthority ||
            val.actionType === "ASSUME_RESOLUTION_AUTHORITY" ||
            val.actionType === "DIRECT_OVERSIGHT",
        );
      }

      // Reopen count >= 2 is also an authorized escalation path
      const isAuthorizedHead =
        hasInterventionAuthority || grievance.reopen_count >= 2 || isAdmin;

      if (!isAuthorizedHead) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Resolution authority is not active. The Department Head must first identify the bottleneck and execute an SLA Escalation Intervention assuming resolution authority before submitting a resolution.",
          },
          { status: 403 },
        );
      }
    }

    const isApproved = decision === "APPROVE";
    const currentAssignedStaff =
      grievance.assignments[0]?.users_assignments_staff_idTousers;

    await prisma.$transaction(async (tx) => {
      if (isDirectResolution) {
        // 1. Direct Resolution Submission by Department Head
        await tx.resolutions.create({
          data: {
            grievance_id: grievanceId,
            submitted_by: user.user_id,
            problem_summary:
              feedback ||
              "Direct Resolution submitted by Department Head following SLA Intervention",
            findings:
              findings || "Investigation verified directly by Department Head",
            action_taken:
              actionTaken || "Corrective action taken by Department Head",
            outcome: outcome || "RESOLVED",
            evidence: evidence || null,
          },
        });

        // IMPORTANT BUSINESS RULE:
        // When Department Head submits resolution:
        // DO NOT directly close the grievance!
        // Move to UNDER_REVIEW for Employee Review:
        // Head submits resolution -> UNDER_REVIEW / Employee Review -> Employee reviews -> Accept -> CLOSED
        await tx.grievances.update({
          where: { grievance_id: grievanceId },
          data: {
            status: "UNDER_REVIEW",
            closed_at: null,
            updated_at: new Date(),
          },
        });

        // Log status history
        await tx.grievance_status_history.create({
          data: {
            grievance_id: grievanceId,
            old_status: grievance.status,
            new_status: "UNDER_REVIEW",
            changed_by: user.user_id,
            remarks:
              "Department Head submitted resolution. Grievance placed in Employee Review.",
          },
        });

        // Audit log
        await tx.audit_logs.create({
          data: {
            grievance_id: grievanceId,
            user_id: user.user_id,
            action: "RESOLUTION_SUBMITTED",
            entity_type: "grievance",
            entity_id: grievanceId,
            new_value: {
              stage: "UNDER_REVIEW",
              submittedByRole: "DEPARTMENT_HEAD",
              submittedBy: hodFullName,
              outcome: outcome || "RESOLVED",
              details: `Department Head submitted resolution following SLA intervention. Placed in UNDER_REVIEW for Employee review and acceptance.`,
            },
          },
        });
      } else if (latestResolution) {
        // Standard Staff Resolution Review by Department Head
        await tx.resolution_reviews.create({
          data: {
            resolution_id: latestResolution.resolution_id,
            reviewed_by: user.user_id,
            decision: isApproved ? "APPROVED" : "REJECTED",
            rejection_reason: isApproved
              ? null
              : feedback || "Requires further clarification",
            reviewed_at: new Date(),
          },
        });

        if (isApproved) {
          // Head approved staff's resolution -> Move to UNDER_REVIEW for Employee Review (or CLOSED if already reviewed)
          await tx.grievances.update({
            where: { grievance_id: grievanceId },
            data: {
              status: "UNDER_REVIEW",
              updated_at: new Date(),
            },
          });

          await tx.grievance_status_history.create({
            data: {
              grievance_id: grievanceId,
              old_status: grievance.status,
              new_status: "UNDER_REVIEW",
              changed_by: user.user_id,
              remarks:
                "Department Head approved resolution. Awaiting Employee Review.",
            },
          });

          await tx.audit_logs.create({
            data: {
              grievance_id: grievanceId,
              user_id: user.user_id,
              action: "ACCEPT_RESOLUTION",
              entity_type: "grievance",
              entity_id: grievanceId,
              new_value: {
                decision: "APPROVE",
                stage: "UNDER_REVIEW",
                details:
                  "Department Head verified and endorsed resolution. Awaiting employee acceptance.",
              },
            },
          });
        } else {
          // Returned to staff for clarification / rework
          await tx.grievances.update({
            where: { grievance_id: grievanceId },
            data: {
              status: "IN_PROGRESS",
              updated_at: new Date(),
            },
          });

          await tx.grievance_status_history.create({
            data: {
              grievance_id: grievanceId,
              old_status: grievance.status,
              new_status: "IN_PROGRESS",
              changed_by: user.user_id,
              remarks: `Resolution returned to staff for revision: ${feedback || "Additional verification required."}`,
            },
          });

          await tx.audit_logs.create({
            data: {
              grievance_id: grievanceId,
              user_id: user.user_id,
              action: "Resolution Returned for Clarification",
              entity_type: "grievance",
              entity_id: grievanceId,
              new_value: {
                decision: "REJECT",
                feedback: feedback || "Additional verification required.",
                stage: "IN_PROGRESS",
                details: `Feedback: "${feedback || "Additional verification required."}". Grievance returned to investigating staff.`,
              },
            },
          });
        }
      }
    });

    const { NotificationService } = await import(
      "@/lib/services/notification.service"
    );

    if (isDirectResolution) {
      // 1. Notify Employee (submitter) that Department Head submitted resolution
      await NotificationService.send({
        userId: grievance.submitted_by,
        grievanceId: grievanceId,
        type: "RESOLUTION_SUBMITTED",
        title: `Resolution Submitted: ${grievance.grievance_number}`,
        message: `Department Head ${hodFullName} has submitted a resolution for your grievance ${grievance.grievance_number}. Please review and accept the outcome, or reopen if needed.`,
      });

      // 2. Notify assigned Staff if exists
      if (currentAssignedStaff) {
        await NotificationService.send({
          userId: currentAssignedStaff.user_id,
          grievanceId: grievanceId,
          type: "RESOLUTION_SUBMITTED",
          title: `Resolution Submitted: ${grievance.grievance_number}`,
          message: `Department Head ${hodFullName} has submitted the final resolution for Grievance ${grievance.grievance_number}. Case has transitioned to Employee Review.`,
        });
      }

      // 3. Confirmation to Department Head
      await NotificationService.send({
        userId: user.user_id,
        grievanceId: grievanceId,
        type: "RESOLUTION_SUBMITTED",
        title: `Resolution Submitted: ${grievance.grievance_number}`,
        message: `You successfully submitted the resolution for Grievance ${grievance.grievance_number}. The grievance is now under Employee Review.`,
      });

      return NextResponse.json({
        success: true,
        decision: "SUBMIT_RESOLUTION",
        message: `Resolution submitted successfully for ${grievance.grievance_number}. The grievance is now under Employee Review.`,
      });
    }

    if (isApproved) {
      // Notify Employee that resolution was approved by Department Head and is ready for review
      await NotificationService.send({
        userId: grievance.submitted_by,
        grievanceId: grievanceId,
        type: "RESOLUTION_SUBMITTED",
        title: `Resolution Ready for Review: ${grievance.grievance_number}`,
        message: `The resolution for your grievance ${grievance.grievance_number} has been verified and endorsed by the Department Head. Please review and accept the outcome.`,
      });

      if (
        latestResolution?.submitted_by &&
        latestResolution.submitted_by !== user.user_id
      ) {
        await NotificationService.send({
          userId: latestResolution.submitted_by,
          grievanceId: grievanceId,
          type: "RESOLUTION_ACCEPTED",
          title: `Resolution Endorsed: ${grievance.grievance_number}`,
          message: `Your resolution for Grievance ${grievance.grievance_number} was approved by Department Head ${hodFullName}.`,
        });
      }

      await NotificationService.send({
        userId: user.user_id,
        grievanceId: grievanceId,
        type: "RESOLUTION_SUBMITTED",
        title: `Resolution Endorsed: ${grievance.grievance_number}`,
        message: `You endorsed the resolution for Grievance ${grievance.grievance_number}. It is now in Employee Review.`,
      });

      return NextResponse.json({
        success: true,
        decision: "APPROVE",
        message: `Resolution approved for ${grievance.grievance_number}. Transferred to Employee Review.`,
      });
    }

    // Clarification returned to staff
    if (latestResolution?.submitted_by) {
      await NotificationService.send({
        userId: latestResolution.submitted_by,
        grievanceId: grievanceId,
        type: "REWORK_REQUIRED",
        title: `Clarification Required: ${grievance.grievance_number}`,
        message: `Department Head returned resolution for Grievance ${grievance.grievance_number}. Feedback: "${feedback || "Additional verification required."}"`,
      });
    }

    await NotificationService.send({
      userId: user.user_id,
      grievanceId: grievanceId,
      type: "REWORK_REQUIRED",
      title: `Resolution Returned: ${grievance.grievance_number}`,
      message: `You returned the resolution for Grievance ${grievance.grievance_number} to staff for clarification.`,
    });

    return NextResponse.json({
      success: true,
      decision: "REJECT",
      message: `Resolution for ${grievance.grievance_number} returned to staff for clarification.`,
    });
  } catch (error) {
    console.error("Error in resolution route:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to process resolution decision",
      },
      { status: 500 },
    );
  }
}
