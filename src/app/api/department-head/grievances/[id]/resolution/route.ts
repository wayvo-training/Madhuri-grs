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
    const { decision = "APPROVE", feedback = "", findings = "", actionTaken = "", outcome = "RESOLVED" } = body;

    const grievanceDept = await prisma.grievance_departments.findFirst({
      where: {
        grievance_id: grievanceId,
        ...(isAdmin ? {} : { department_id: departmentId }),
      },
      include: {
        grievances: {
          include: {
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
    const isPrimaryDept = grievanceDept.involvement_type === "PRIMARY";

    if (!isAdmin && hasMultipleDepts && !isPrimaryDept) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: As a supporting department, only the Lead Primary Department Head can approve or submit the final resolution. Please provide directives or notes via the Case File inspection.",
        },
        { status: 403 },
      );
    }

    const grievance = grievanceDept.grievances;
    const isDirectResolution =
      grievance.reopen_count >= 2 ||
      grievance.status === "ESCALATED" ||
      grievance.status !== "UNDER_REVIEW";
    const latestResolution = grievance.resolutions[0];
    const isApproved = decision === "APPROVE";

    await prisma.$transaction(async (tx) => {
      // 1. Handle Resolution Logging
      if (isDirectResolution && isApproved) {
        // Direct Resolution by Department Head
        await tx.resolutions.create({
          data: {
            grievance_id: grievanceId,
            submitted_by: user.user_id,
            problem_summary: feedback || "Direct Resolution by Department Head after maximum reopens reached",
            findings: findings || "Resolved directly by Department Head",
            action_taken: actionTaken || "Resolved directly by Department Head",
            outcome: outcome,
          }
        });
      } else if (latestResolution) {
        // Standard Staff Resolution Review
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
      }

      if (isApproved) {
        // Mark grievance CLOSED or RESOLVED
        await tx.grievances.update({
          where: { grievance_id: grievanceId },
          data: {
            status: isDirectResolution ? "RESOLVED" : "CLOSED",
            closed_at: isDirectResolution ? null : new Date(),
            updated_at: new Date(),
            sla_status: "ON_TRACK",
          },
        });

        // Mark grievance department COMPLETED
        await tx.grievance_departments.update({
          where: {
            grievance_department_id: grievanceDept.grievance_department_id,
          },
          data: {
            status: "COMPLETED",
            completed_at: new Date(),
          },
        });

        // Mark active assignment completed
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

        // Mark any open escalation as RESOLVED
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

        // Final Resolution Acceptance Audit Log
        await tx.audit_logs.create({
          data: {
            grievance_id: grievanceId,
            user_id: user.user_id,
            action: isDirectResolution ? "RESOLUTION_SUBMITTED" : "ACCEPT_RESOLUTION",
            entity_type: "grievance",
            entity_id: grievanceId,
            new_value: {
              decision: "APPROVE",
              stage: isDirectResolution ? "RESOLVED" : "ESCALATION_CLEARED",
              details: isDirectResolution
                ? "Department Head submitted a direct resolution."
                : "Department Head approved final resolution. Escalation cleared, grievance successfully closed.",
            },
          },
        });

        // Status history
        await tx.grievance_status_history.create({
          data: {
            grievance_id: grievanceId,
            old_status: grievance.status,
            new_status: isDirectResolution ? "RESOLVED" : "CLOSED",
            changed_by: user.user_id,
            remarks: isDirectResolution
              ? "Direct resolution submitted by Department Head."
              : "Final resolution approved by Department Head. Escalation cleared.",
          },
        });
      } else {
        // Returned to staff
        await tx.grievances.update({
          where: { grievance_id: grievanceId },
          data: {
            status: "IN_PROGRESS",
            updated_at: new Date(),
          },
        });

        // Audit Log
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

        // Status history
        await tx.grievance_status_history.create({
          data: {
            grievance_id: grievanceId,
            old_status: grievance.status,
            new_status: "IN_PROGRESS",
            changed_by: user.user_id,
            remarks: `Resolution returned for clarification: ${feedback || "Additional verification required."}`,
          },
        });
      }
    });

    if (isDirectResolution && isApproved) {
      const { NotificationService } = await import("@/lib/services/notification.service");
      await NotificationService.send({
        userId: grievance.submitted_by,
        grievanceId: grievanceId,
        type: "RESOLUTION_SUBMITTED",
        title: `Resolution Submitted: ${grievance.grievance_number}`,
        message: `Your grievance ${grievance.grievance_number} has been directly resolved by the Department Head. Please review it.`,
      });
      await NotificationService.send({
        userId: user.user_id,
        grievanceId: grievanceId,
        type: "RESOLUTION_SUBMITTED",
        title: `Resolution Submitted: ${grievance.grievance_number}`,
        message: `You successfully submitted a direct resolution for grievance ${grievance.grievance_number}.`,
      });
    }

    return NextResponse.json({
      success: true,
      decision,
      message: isApproved
        ? `Resolution approved & Escalation Cleared for ${grievance.grievance_number}. Ticket is now officially CLOSED.`
        : `Resolution for ${grievance.grievance_number} returned to staff for clarification.`,
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
