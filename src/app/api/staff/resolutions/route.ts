import { NextResponse } from "next/server";
import {
  evaluateReopenPolicy,
  requiresHeadManualReview,
} from "@/lib/engines/reopen-engine";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";
import { resolveStaffAuth } from "@/lib/staff/permissions";

export async function POST(request: Request) {
  const auth = await resolveStaffAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { staffId, departmentId, isAdmin } = auth;

  try {
    const body = (await request.json()) as {
      grievanceId: string;
      problemSummary: string;
      findings: string;
      actionTaken: string;
      outcome: string;
      evidence?: string;
      attachments?: Array<{
        fileName: string;
        filePath?: string;
        fileType?: string;
        fileSize?: number;
      }>;
    };

    const {
      grievanceId,
      problemSummary,
      findings,
      actionTaken,
      outcome,
      evidence,
    } = body;

    if (
      !grievanceId ||
      !problemSummary?.trim() ||
      !findings?.trim() ||
      !actionTaken?.trim() ||
      !outcome?.trim()
    ) {
      return NextResponse.json(
        { success: false, message: "All resolution fields are mandatory" },
        { status: 400 },
      );
    }

    const gId = BigInt(grievanceId);

    // Verify assignment to this staff member
    const grievance = await prisma.grievances.findUnique({
      where: { grievance_id: gId },
      include: {
        assignments: {
          where: { assignment_status: { in: ["ASSIGNED", "COMPLETED"] } },
          include: {
            grievance_departments: true,
          },
        },
      },
    });

    if (!grievance) {
      return NextResponse.json(
        { success: false, message: "Grievance record not found" },
        { status: 404 },
      );
    }

    const activeAssignments = grievance.assignments || [];
    const myAssignment = activeAssignments.find((a) => a.staff_id === staffId);

    if (!isAdmin && !myAssignment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You are not an assigned staff member for this grievance",
        },
        { status: 403 },
      );
    }

    if (grievance.status === "ASSIGNED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Investigation has not been started yet. You must click 'Start Investigation' before submitting a final resolution.",
        },
        { status: 400 },
      );
    }

    // In a multi-department collaboration, verify primary or equal co-lead responsibility
    const allInvolvedDepts = await prisma.grievance_departments.findMany({
      where: { grievance_id: gId },
    });
    const hasMultipleDepts = allInvolvedDepts.length > 1;
    const myInvolvement = myAssignment?.grievance_departments?.involvement_type;
    const isAuthorizedLeadStaff =
      myInvolvement === "PRIMARY" || myInvolvement === "EQUAL";

    if (!isAdmin && hasMultipleDepts && !isAuthorizedLeadStaff) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: As a supporting department contributor, please submit your department findings via the Collaboration tab. Only Primary Lead or Equal Co-Lead department officers can submit the final customer resolution.",
        },
        { status: 403 },
      );
    }

    // 1. Create formal resolution entry
    const resolution = await prisma.resolutions.create({
      data: {
        grievance_id: gId,
        submitted_by: staffId,
        problem_summary: problemSummary.trim(),
        findings: findings.trim(),
        action_taken: actionTaken.trim(),
        outcome: outcome.trim(),
        evidence: evidence?.trim() || null,
      },
    });

    // Save optional supporting resolution attachments
    if (Array.isArray(body.attachments) && body.attachments.length > 0) {
      for (const att of body.attachments) {
        if (att.fileName) {
          await prisma.attachments.create({
            data: {
              grievance_id: gId,
              resolution_id: resolution.resolution_id,
              file_name: att.fileName,
              file_path: att.filePath || `/uploads/${att.fileName}`,
              file_type: att.fileType || "application/octet-stream",
              file_size: att.fileSize ? BigInt(att.fileSize) : BigInt(1024),
              uploaded_by: staffId,
            },
          });
        }
      }
    }
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

    // 2. Transition grievance status
    await prisma.grievances.update({
      where: { grievance_id: gId },
      data: {
        status: requiresHeadReview ? "UNDER_REVIEW" : "RESOLVED",
      },
    });

    // 3. Log audit event
    await prisma.audit_logs.create({
      data: {
        grievance_id: gId,
        user_id: staffId,
        action: "RESOLUTION_SUBMITTED",
        entity_type: "GRIEVANCE",
        entity_id: gId,
        new_value: {
          details: `Investigation completed and resolution submitted: ${outcome.trim()}`,
        },
      },
    });

    // 3.5 Log status history
    await prisma.grievance_status_history.create({
      data: {
        grievance_id: gId,
        old_status: grievance.status,
        new_status: requiresHeadReview ? "UNDER_REVIEW" : "RESOLVED",
        changed_by: staffId,
        remarks: "Resolution submitted",
      },
    });

    // 4. Notification
    if (requiresHeadReview) {
      const targetDeptIds = allInvolvedDepts.map((d) => d.department_id);
      if (departmentId && !targetDeptIds.includes(departmentId)) {
        targetDeptIds.push(departmentId);
      }

      const hods = await prisma.users.findMany({
        where: {
          department_id: { in: targetDeptIds },
          roles: { role_name: "DEPARTMENT_HEAD" },
          status: "ACTIVE",
        },
        select: { user_id: true },
      });

      for (const hod of hods) {
        await NotificationService.send({
          userId: hod.user_id,
          grievanceId: gId,
          type: "RESOLUTION_SUBMITTED",
          title: `Resolution Submitted: ${grievance.grievance_number}`,
          message: `Staff member has submitted a formal resolution proposal for grievance ${grievance.grievance_number}. Review is required due to multiple reopenings.`,
        });
      }
    } else if (!requiresHeadReview) {
      // Notify the complainant directly since no head review is required
      await NotificationService.send({
        userId: grievance.submitted_by,
        grievanceId: gId,
        type: "RESOLUTION_SUBMITTED",
        title: `Resolution Submitted: ${grievance.grievance_number}`,
        message: `A resolution has been provided for your grievance ${grievance.grievance_number}. Please review it.`,
      });
    }

    // Notify the submitting staff member with confirmation
    await NotificationService.send({
      userId: staffId,
      grievanceId: gId,
      type: "RESOLUTION_SUBMITTED",
      title: `Resolution Submitted: ${grievance.grievance_number}`,
      message: requiresHeadReview
        ? `You submitted a resolution proposal for grievance ${grievance.grievance_number}. It is pending Department Head review.`
        : `You submitted the resolution for grievance ${grievance.grievance_number}. It has been sent to the complainant.`,
    });

    return NextResponse.json({
      success: true,
      message: requiresHeadReview
        ? "Resolution submitted successfully and awaiting head review due to multiple reopenings"
        : "Resolution sent to complainant successfully",
      resolutionId: resolution.resolution_id.toString(),
    });
  } catch (error: unknown) {
    console.error("Error in POST /api/staff/resolutions:", error);
    const errMessage =
      error instanceof Error ? error.message : "Failed to submit resolution";
    const errStack = error instanceof Error ? error.stack : String(error);

    try {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      await fs.writeFile(
        path.join(process.cwd(), "error-staff-resolution.log"),
        String(errStack || error),
      );
    } catch (_e) {}

    return NextResponse.json(
      {
        success: false,
        message: errMessage,
      },
      { status: 500 },
    );
  }
}
