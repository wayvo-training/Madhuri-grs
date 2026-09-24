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
    const { decision = "APPROVE", feedback = "" } = body;

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

    const grievance = grievanceDept.grievances;
    const latestResolution = grievance.resolutions[0];
    const isApproved = decision === "APPROVE";

    await prisma.$transaction(async (tx) => {
      // 1. If resolution record exists, record resolution_review
      if (latestResolution) {
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
        // Mark grievance CLOSED
        await tx.grievances.update({
          where: { grievance_id: grievanceId },
          data: {
            status: "CLOSED",
            closed_at: new Date(),
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

        // Step 11 Audit Log
        await tx.audit_logs.create({
          data: {
            grievance_id: grievanceId,
            user_id: user.user_id,
            action: "Step 11: Escalation Cleared & Grievance Closed",
            entity_type: "grievance",
            entity_id: grievanceId,
            new_value: {
              decision: "APPROVE",
              stage: "ESCALATION_CLEARED",
              details:
                "Department Head approved final resolution. Escalation cleared, SLA compliance archived, grievance marked CLOSED.",
            },
          },
        });

        // Status history
        await tx.grievance_status_history.create({
          data: {
            grievance_id: grievanceId,
            old_status: grievance.status,
            new_status: "CLOSED",
            changed_by: user.user_id,
            remarks:
              "Final resolution approved by Department Head. Escalation cleared.",
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

    return NextResponse.json({
      success: true,
      decision,
      message: isApproved
        ? `Step 11 Complete: Resolution approved & Escalation Cleared for ${grievance.grievance_number}. Ticket is now officially CLOSED.`
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
