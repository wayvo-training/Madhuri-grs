import { NextResponse } from "next/server";
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
          where: { assignment_status: "ASSIGNED" },
          take: 1,
        },
      },
    });

    if (!grievance) {
      return NextResponse.json(
        { success: false, message: "Grievance record not found" },
        { status: 404 },
      );
    }

    const currentAssignment = grievance.assignments?.[0];
    if (!isAdmin && currentAssignment?.staff_id !== staffId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You are not the assigned staff for this grievance",
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

    const requiresHeadReview = grievance.reopen_count >= 3;

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
    if (requiresHeadReview && departmentId) {
      const hod = await prisma.users.findFirst({
        where: {
          department_id: departmentId,
          roles: { role_name: "DEPARTMENT_HEAD" },
          status: "ACTIVE",
        },
        select: { user_id: true },
      });

      if (hod) {
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

    return NextResponse.json({
      success: true,
      message: requiresHeadReview
        ? "Resolution submitted successfully and awaiting head review due to multiple reopenings"
        : "Resolution sent to complainant successfully",
      resolutionId: resolution.resolution_id.toString(),
    });
  } catch (error: any) {
    console.error("Error in POST /api/staff/resolutions:", error);
    try {
      const fs = require('fs/promises');
      const path = require('path');
      await fs.writeFile(path.join(process.cwd(), "error-staff-resolution.log"), String(error.stack || error));
    } catch (e) {}
    
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit resolution" },
      { status: 500 },
    );
  }
}
