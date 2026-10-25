import { NextResponse } from "next/server";
import { normalizeStoragePath } from "@/lib/attachments/access-control";
import {
  evaluateReopenPolicy,
  requiresHeadManualReview,
} from "@/lib/engines/reopen-engine";
import {
  activateNextSequentialDepartments,
  canDepartmentSubmitFinalResolution,
} from "@/lib/engines/routing-engine";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";
import { resolveStaffAuth } from "@/lib/staff/permissions";
import { SUPABASE_BUCKET } from "@/lib/supabase";

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

    const cleanSummary = problemSummary.trim();
    const cleanFindings = findings.trim();
    const cleanAction = actionTaken.trim();
    const cleanOutcome = outcome.trim();

    if (cleanSummary.length < 20) {
      return NextResponse.json(
        {
          success: false,
          message: `Problem Summary must be at least 20 characters (currently ${cleanSummary.length}).`,
        },
        { status: 400 },
      );
    }
    if (
      !/[a-zA-Z]/.test(cleanSummary) ||
      /^\d+$/.test(cleanSummary.replace(/\s+/g, ""))
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Problem Summary must contain letters/words and cannot consist only of digits or numbers.",
        },
        { status: 400 },
      );
    }

    if (cleanFindings.length < 20) {
      return NextResponse.json(
        {
          success: false,
          message: `Investigation Findings must be at least 20 characters (currently ${cleanFindings.length}).`,
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
            "Investigation Findings must contain letters/words and cannot consist only of digits or numbers.",
        },
        { status: 400 },
      );
    }

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

    if (cleanOutcome.length < 15) {
      return NextResponse.json(
        {
          success: false,
          message: `Proposed Outcome must be at least 15 characters (currently ${cleanOutcome.length}).`,
        },
        { status: 400 },
      );
    }
    if (
      !/[a-zA-Z]/.test(cleanOutcome) ||
      /^\d+$/.test(cleanOutcome.replace(/\s+/g, ""))
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Proposed Outcome must contain letters/words and cannot consist only of digits or numbers.",
        },
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

    // In a multi-department collaboration, verify resolution authority
    // (Primary lead with all supporting completed, OR final sequential department where all prerequisites are completed)
    const allInvolvedDepts = await prisma.grievance_departments.findMany({
      where: { grievance_id: gId },
      include: {
        departments: true,
        assignments: true,
      },
    });

    const myDeptId = myAssignment?.grievance_departments?.department_id;
    if (!isAdmin && myDeptId) {
      const authResult = canDepartmentSubmitFinalResolution(
        myDeptId,
        allInvolvedDepts,
      );
      if (!authResult.canResolve) {
        return NextResponse.json(
          {
            success: false,
            message:
              authResult.reason ||
              "Forbidden: As a supportive department contributor, please submit your department findings via the Findings form. Only Primary Lead, Equal Co-Lead, or the Final Sequential Department can submit the final customer resolution.",
          },
          { status: 403 },
        );
      }
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

    // Save optional supporting resolution attachments and collect metadata
    const savedAttachments: Array<{
      id: string;
      name: string;
      size: string;
      type: string;
      path: string;
      downloadUrl: string;
    }> = [];

    if (Array.isArray(body.attachments) && body.attachments.length > 0) {
      for (const rawAtt of body.attachments) {
        const att = rawAtt as {
          fileName?: string;
          name?: string;
          filePath?: string;
          path?: string;
          fileType?: string;
          type?: string;
          fileSize?: number;
          size?: string | number;
        };
        const resolvedFileName = att.fileName || att.name;
        if (resolvedFileName) {
          const raw =
            att.filePath || att.path || `resolutions/${resolvedFileName}`;
          const norm = normalizeStoragePath(raw, SUPABASE_BUCKET);
          const relativeStoragePath = norm.valid ? norm.storagePath : raw;
          let calculatedSize = BigInt(1024);
          if (typeof att.fileSize === "number") {
            calculatedSize = BigInt(Math.round(att.fileSize));
          } else if (typeof att.size === "string") {
            const parsed = Number.parseFloat(att.size);
            if (!Number.isNaN(parsed)) {
              calculatedSize = BigInt(Math.round(parsed * 1024));
            }
          }

          const newAtt = await prisma.attachments.create({
            data: {
              grievance_id: gId,
              resolution_id: resolution.resolution_id,
              grievance_department_id:
                myAssignment?.grievance_department_id || null,
              file_name: resolvedFileName,
              file_path: relativeStoragePath,
              file_type: att.fileType || att.type || "application/octet-stream",
              file_size: calculatedSize,
              uploaded_by: staffId,
            },
          });

          savedAttachments.push({
            id: newAtt.attachment_id.toString(),
            name: newAtt.file_name,
            size: `${Math.round(Number(newAtt.file_size || 1024) / 1024)} KB`,
            type: newAtt.file_type,
            path: newAtt.file_path,
            downloadUrl: `/api/attachments/${newAtt.attachment_id}/download`,
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

    // 2.5 Mark staff assignment as COMPLETED
    await prisma.assignments.updateMany({
      where: {
        grievance_id: gId,
        staff_id: staffId,
        assignment_status: "ASSIGNED",
      },
      data: {
        assignment_status: "COMPLETED",
        completed_at: new Date(),
      },
    });

    // Mark submitting department as COMPLETED
    if (myAssignment?.grievance_department_id) {
      await prisma.grievance_departments.update({
        where: {
          grievance_department_id: myAssignment.grievance_department_id,
        },
        data: {
          status: "COMPLETED",
          completed_at: new Date(),
        },
      });
    }

    if (!requiresHeadReview) {
      // Resolution finalized and sent to user; mark all remaining active involved departments as COMPLETED
      await prisma.grievance_departments.updateMany({
        where: {
          grievance_id: gId,
          status: { notIn: ["COMPLETED", "REMOVED"] },
        },
        data: {
          status: "COMPLETED",
          completed_at: new Date(),
        },
      });
    }

    // Unblock any downstream sequential departments if applicable
    await activateNextSequentialDepartments(gId);

    // Retrieve submitting author details
    const authorUser = await prisma.users.findUnique({
      where: { user_id: staffId },
      select: { first_name: true, last_name: true },
    });
    const authorName = authorUser
      ? `${authorUser.first_name} ${authorUser.last_name || ""}`.trim()
      : "Staff Member";
    const submittingDeptName =
      allInvolvedDepts.find((d) => d.department_id === myDeptId)?.departments
        ?.department_name || "Department";

    // 3. Log audit event
    await prisma.audit_logs.create({
      data: {
        grievance_id: gId,
        user_id: staffId,
        action: "RESOLUTION_SUBMITTED",
        entity_type: "GRIEVANCE",
        entity_id: gId,
        new_value: {
          details: `Investigation completed and resolution submitted: ${cleanOutcome}`,
          department: submittingDeptName,
          submittedBy: authorName,
          problemSummary: cleanSummary,
          findings: cleanFindings,
          actionTaken: cleanAction,
          notes: cleanOutcome,
          attachments: savedAttachments,
          isFindings: true,
          isResolution: true,
          resolutionId: resolution.resolution_id.toString(),
        },
      },
    });

    // Also record companion supporting findings audit log so Department Findings tab reflects seamlessly
    await prisma.audit_logs.create({
      data: {
        grievance_id: gId,
        user_id: staffId,
        action: "SUPPORTING_FINDINGS_SUBMITTED",
        entity_type: "GRIEVANCE",
        entity_id: gId,
        new_value: {
          department: submittingDeptName,
          submittedBy: authorName,
          findings: cleanFindings,
          actionTaken: cleanAction,
          notes: cleanOutcome,
          attachments: savedAttachments,
          isResolution: true,
          resolutionId: resolution.resolution_id.toString(),
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

    // 4. Notifications with priority distribution
    const priority = grievance.priority?.toUpperCase() || "NORMAL";
    const priorityTag = `[${priority} Priority]`;

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
          title: `[${priority}] Resolution Proposal: ${grievance.grievance_number}`,
          message: `${priorityTag} Staff member ${authorName} (${submittingDeptName}) has submitted a formal resolution proposal for grievance ${grievance.grievance_number}. Review is required due to multiple reopenings.`,
        });
      }
    } else {
      // Notify the complainant directly since no head review is required
      await NotificationService.send({
        userId: grievance.submitted_by,
        grievanceId: gId,
        type: "RESOLUTION_SUBMITTED",
        title: `[${priority}] Resolution Submitted: ${grievance.grievance_number}`,
        message: `${priorityTag} A formal resolution has been provided for your grievance ${grievance.grievance_number}. Please review the outcome.`,
      });
    }

    // Notify the submitting staff member with confirmation (self notification)
    await NotificationService.send({
      userId: staffId,
      grievanceId: gId,
      type: "RESOLUTION_SUBMITTED",
      title: `[${priority}] Resolution Submitted: ${grievance.grievance_number}`,
      message: requiresHeadReview
        ? `${priorityTag} You submitted a resolution proposal for grievance ${grievance.grievance_number}. It is pending Department Head review.`
        : `${priorityTag} You submitted the resolution for grievance ${grievance.grievance_number}. It has been sent to the complainant.`,
    });

    // Cross-department notifications to ALL collaborating departments (HODs and assigned staff)
    const otherInvolvedDepts = allInvolvedDepts.filter(
      (d) => d.department_id !== myDeptId,
    );

    for (const otherDept of otherInvolvedDepts) {
      const otherStaffId = otherDept.assignments?.staff_id;
      if (otherStaffId && otherStaffId !== staffId) {
        await NotificationService.send({
          userId: otherStaffId,
          grievanceId: gId,
          type: "RESOLUTION_SUBMITTED",
          title: `[${priority}] Case Resolved by ${submittingDeptName}: ${grievance.grievance_number}`,
          message: `${priorityTag} ${authorName} (${submittingDeptName}) has concluded the investigation and submitted the resolution for ${grievance.grievance_number}.`,
        });
      }

      const otherHods = await prisma.users.findMany({
        where: {
          department_id: otherDept.department_id,
          roles: { role_name: "DEPARTMENT_HEAD" },
          status: "ACTIVE",
        },
        select: { user_id: true },
      });

      for (const hod of otherHods) {
        if (hod.user_id !== staffId) {
          await NotificationService.send({
            userId: hod.user_id,
            grievanceId: gId,
            type: "RESOLUTION_SUBMITTED",
            title: `[${priority}] Case Resolved by ${submittingDeptName}: ${grievance.grievance_number}`,
            message: `${priorityTag} ${authorName} (${submittingDeptName}) has concluded the investigation and submitted the resolution for ${grievance.grievance_number}.`,
          });
        }
      }
    }

    // Submitter's own HOD notification (if not the submitter)
    if (myDeptId) {
      const ownHods = await prisma.users.findMany({
        where: {
          department_id: myDeptId,
          roles: { role_name: "DEPARTMENT_HEAD" },
          status: "ACTIVE",
        },
        select: { user_id: true },
      });

      for (const hod of ownHods) {
        if (hod.user_id !== staffId) {
          await NotificationService.send({
            userId: hod.user_id,
            grievanceId: gId,
            type: "RESOLUTION_SUBMITTED",
            title: `[${priority}] Resolution Submitted: ${grievance.grievance_number}`,
            message: `${priorityTag} Staff member ${authorName} has submitted the resolution for grievance ${grievance.grievance_number}.`,
          });
        }
      }
    }

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
