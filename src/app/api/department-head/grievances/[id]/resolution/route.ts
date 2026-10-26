import { NextResponse } from "next/server";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import {
  evaluateReopenPolicy,
  requiresHeadManualReview,
} from "@/lib/engines/reopen-engine";
import {
  activateNextSequentialDepartments,
  canDepartmentSubmitFinalResolution,
} from "@/lib/engines/routing-engine";
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
        departments: true,
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
      include: { departments: true },
    });

    const grievance = grievanceDept.grievances;
    const hodFullName = `${user.first_name} ${user.last_name || ""}`.trim();
    const latestResolution = grievance.resolutions[0];

    // Evaluate active reopen policies dynamically
    const reopenPolicy = await evaluateReopenPolicy({
      categoryId: grievance.category_id,
      subcategoryId: grievance.subcategory_id,
      priority: grievance.priority,
    });
    const requiresHeadReview = requiresHeadManualReview(
      grievance.reopen_count,
      reopenPolicy,
    );

    // Determine if this is a direct Head resolution or a review of a staff resolution
    const isDirectResolution =
      requiresHeadReview ||
      grievance.status === "ESCALATED" ||
      grievance.status !== "UNDER_REVIEW" ||
      !latestResolution;

    // Server-side authorization check for Direct Resolution by Department Head:
    // Verify SLA intervention has actually been executed and user is the active resolution authority
    let hasInterventionAuthority = false;
    if (isDirectResolution) {
      const interventionLogs = await prisma.audit_logs.findMany({
        where: {
          grievance_id: grievanceId,
          action: "HOD_INTERVENTION_TAKEN",
        },
        orderBy: { created_at: "desc" },
        take: 10,
      });

      for (const log of interventionLogs) {
        if (!log.new_value) continue;
        let val: Record<string, unknown> = {};
        if (typeof log.new_value === "string") {
          try {
            val = JSON.parse(log.new_value);
          } catch {
            val = {};
          }
        } else if (typeof log.new_value === "object") {
          val = log.new_value as Record<string, unknown>;
        }

        // If reassigned to a staff member after assuming authority, authority was relinquished
        if (val.actionType === "REASSIGN") {
          break;
        }

        if (
          val.isResolutionAuthority ||
          val.actionType === "ASSUME_RESOLUTION_AUTHORITY" ||
          val.actionType === "DIRECT_OVERSIGHT"
        ) {
          hasInterventionAuthority = true;
          break;
        }
      }

      // Check if this grievance is actively assigned to the Department Head herself (e.g. from Smart Assignment)
      const isAssignedToUser = await prisma.assignments.findFirst({
        where: {
          grievance_id: grievanceId,
          staff_id: user.user_id,
          assignment_status: "ASSIGNED",
        },
      });

      // Explicit intervention authority assumed, requires head review per reopen policy, assigned to head, or admin
      const isAuthorizedHead =
        hasInterventionAuthority ||
        requiresHeadReview ||
        Boolean(isAssignedToUser) ||
        isAdmin;

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

    const isPrimaryOrEqual =
      grievanceDept.involvement_type === "PRIMARY" ||
      grievanceDept.involvement_type === "EQUAL";

    if (!isAdmin && departmentId) {
      const authResult = canDepartmentSubmitFinalResolution(
        departmentId,
        allInvolvedDepts,
      );
      // If Primary/Equal lead has intervention authority or case is escalated to manual head review,
      // the Head has executive authority to finalize and resolve the case even if supporting dept was lagging!
      const canBypassPendingSupporting =
        isPrimaryOrEqual && (hasInterventionAuthority || requiresHeadReview);

      if (!authResult.canResolve && !canBypassPendingSupporting) {
        return NextResponse.json(
          {
            success: false,
            message:
              authResult.reason ||
              "Forbidden: As a supportive department, only Primary Lead, Equal Co-Lead, or the Final Sequential Department Heads can approve or submit the final resolution.",
          },
          { status: 403 },
        );
      }
    }

    const cleanFeedback = typeof feedback === "string" ? feedback.trim() : "";
    const cleanFindings = typeof findings === "string" ? findings.trim() : "";
    const cleanAction =
      typeof actionTaken === "string" ? actionTaken.trim() : "";

    if (
      decision === "CLARIFY" ||
      (!isDirectResolution && cleanFeedback.length > 0)
    ) {
      if (cleanFeedback.length < 15) {
        return NextResponse.json(
          {
            success: false,
            message: `Feedback remarks must be at least 15 characters (currently ${cleanFeedback.length}).`,
          },
          { status: 400 },
        );
      }
      if (
        !/[a-zA-Z]/.test(cleanFeedback) ||
        /^\d+$/.test(cleanFeedback.replace(/\s+/g, ""))
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Feedback remarks must contain letters/words and cannot consist only of digits or numbers.",
          },
          { status: 400 },
        );
      }
    }

    if (isDirectResolution) {
      if (cleanFindings) {
        if (cleanFindings.length < 20) {
          return NextResponse.json(
            {
              success: false,
              message: `Findings must be at least 20 characters (currently ${cleanFindings.length}).`,
            },
            { status: 400 },
          );
        }
        if (
          !/[a-zA-Z]/.test(cleanFindings) ||
          /^\d+$/.test(cleanFindings.replace(/\s+/g, ""))
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Findings must contain letters/words and cannot consist only of digits or numbers.",
            },
            { status: 400 },
          );
        }
      }

      if (cleanAction) {
        if (cleanAction.length < 20) {
          return NextResponse.json(
            {
              success: false,
              message: `Action Taken must be at least 20 characters (currently ${cleanAction.length}).`,
            },
            { status: 400 },
          );
        }
        if (
          !/[a-zA-Z]/.test(cleanAction) ||
          /^\d+$/.test(cleanAction.replace(/\s+/g, ""))
        ) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Action Taken must contain letters/words and cannot consist only of digits or numbers.",
            },
            { status: 400 },
          );
        }
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

        const isSupportingContributor =
          grievanceDept && grievanceDept.involvement_type === "SUPPORTING";

        const otherIncompleteDepts = await tx.grievance_departments.count({
          where: {
            grievance_id: grievanceId,
            grievance_department_id: {
              not: grievanceDept.grievance_department_id,
            },
            status: { notIn: ["COMPLETED", "RESOLVED", "REMOVED"] },
          },
        });

        const newOverallStatus =
          isSupportingContributor && otherIncompleteDepts > 0
            ? grievance.status
            : "UNDER_REVIEW";

        // IMPORTANT BUSINESS RULE:
        // When Department Head submits resolution:
        // DO NOT directly close the grievance!
        // Move to UNDER_REVIEW for Employee Review (or keep in progress if supporting dept):
        // Head submits resolution -> UNDER_REVIEW / Employee Review -> Employee reviews -> Accept -> CLOSED
        await tx.grievances.update({
          where: { grievance_id: grievanceId },
          data: {
            status: newOverallStatus,
            closed_at: null,
            updated_at: new Date(),
          },
        });

        // Log status history if status changed
        if (newOverallStatus !== grievance.status) {
          await tx.grievance_status_history.create({
            data: {
              grievance_id: grievanceId,
              old_status: grievance.status,
              new_status: newOverallStatus,
              changed_by: user.user_id,
              remarks:
                "Department Head submitted resolution. Grievance placed in Employee Review.",
            },
          });
        }

        // Audit log
        await tx.audit_logs.create({
          data: {
            grievance_id: grievanceId,
            user_id: user.user_id,
            action: isSupportingContributor
              ? "SUPPORTING_FINDINGS_SUBMITTED"
              : "RESOLUTION_SUBMITTED",
            entity_type: "grievance",
            entity_id: grievanceId,
            new_value: {
              stage: newOverallStatus,
              departmentId: grievanceDept.department_id.toString(),
              departmentName:
                grievanceDept.departments?.department_name || "Department",
              findings: findings || cleanFindings,
              actionTaken: actionTaken || cleanAction,
              submittedByRole: "DEPARTMENT_HEAD",
              submittedBy: hodFullName,
              outcome: outcome || "RESOLVED",
              isFindings: isSupportingContributor,
              details: isSupportingContributor
                ? `Department Head submitted department findings and signed off stage.`
                : `Department Head submitted resolution following SLA intervention or direct assignment. Placed in UNDER_REVIEW for Employee review and acceptance.`,
            },
          },
        });

        // Mark any active staff assignment for this department stage as COMPLETED
        await tx.assignments.updateMany({
          where: {
            grievance_department_id: grievanceDept.grievance_department_id,
            assignment_status: "ASSIGNED",
          },
          data: {
            assignment_status: "COMPLETED",
            completed_at: new Date(),
          },
        });

        // Mark department stage as completed and trigger next sequential department activation
        await tx.grievance_departments.update({
          where: {
            grievance_department_id: grievanceDept.grievance_department_id,
          },
          data: {
            status: "COMPLETED",
            completed_at: new Date(),
          },
        });

        // When Primary Head resolves case with executive intervention authority or on maximum reopens,
        // complete any lingering supporting department stages so the grievance moves cleanly to Employee Review
        if (
          isPrimaryOrEqual &&
          (hasInterventionAuthority || requiresHeadReview)
        ) {
          await tx.grievance_departments.updateMany({
            where: {
              grievance_id: grievanceId,
              involvement_type: "SUPPORTING",
              status: { notIn: ["COMPLETED", "RESOLVED", "REMOVED"] },
            },
            data: {
              status: "COMPLETED",
              completed_at: new Date(),
            },
          });
        }

        await activateNextSequentialDepartments(grievanceId, tx);
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

          // Mark department stage as completed and trigger next sequential department activation
          await tx.grievance_departments.update({
            where: {
              grievance_department_id: grievanceDept.grievance_department_id,
            },
            data: {
              status: "COMPLETED",
              completed_at: new Date(),
            },
          });
          await activateNextSequentialDepartments(grievanceId, tx);
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
      type: "SYSTEM",
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
