import { NextResponse } from "next/server";
import { normalizeStoragePath } from "@/lib/attachments/access-control";
import {
  MAX_ATTACHMENTS_PER_GRIEVANCE,
  validateUploadedFile,
} from "@/lib/attachments/file-validation";
import { getCurrentUser } from "@/lib/auth";
import { canEndUserSubmitCommunication } from "@/lib/communication/service";
import { resumeSlaTracking } from "@/lib/engines/sla-engine";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";
import { SUPABASE_BUCKET } from "@/lib/supabase";

interface IncomingAttachment {
  fileName: string;
  fileType: string;
  fileSize?: number;
  filePath?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      message?: string;
      attachments?: IncomingAttachment[];
    };

    const message = body.message?.trim();
    const incomingFiles: IncomingAttachment[] = Array.isArray(body.attachments)
      ? body.attachments
      : [];

    if (!message && incomingFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Must provide a message or at least one document.",
        },
        { status: 400 },
      );
    }

    let grievanceId: bigint | null = null;
    try {
      grievanceId = BigInt(id);
    } catch {
      grievanceId = null;
    }

    const grievance = await prisma.grievances.findFirst({
      where: grievanceId
        ? { OR: [{ grievance_id: grievanceId }, { grievance_number: id }] }
        : { grievance_number: id },
      include: {
        users: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
          },
        },
        assignments: {
          where: { assignment_status: "ASSIGNED" },
          include: {
            users_assignments_staff_idTousers: {
              select: {
                user_id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });

    if (!grievance) {
      return NextResponse.json(
        { success: false, error: "Grievance not found." },
        { status: 404 },
      );
    }

    const user = await getCurrentUser();
    if (!user || user.roles?.role_name !== "END_USER") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (user.user_id !== grievance.submitted_by) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Not your grievance" },
        { status: 403 },
      );
    }

    const eligibleStatuses = [
      "PENDING",
      "SUBMITTED",
      "ROUTED",
      "AWAITING_ROUTING",
      "AWAITING_ASSIGNMENT",
      "ASSIGNED",
      "IN_PROGRESS",
      "AWAITING_INFORMATION",
      "WAITING_ON_USER",
      "WAITING_ON_EMPLOYEE",
      "REWORK",
      "REOPENED",
    ];
    if (!eligibleStatuses.includes(grievance.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Grievance is not eligible for additional information.",
        },
        { status: 400 },
      );
    }

    const check = await canEndUserSubmitCommunication(grievance.grievance_id);
    if (!check.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            check.reason ||
            "You can only submit additional information or documents when requested by staff or department head.",
        },
        { status: 403 },
      );
    }

    // Verify if documents were explicitly requested by staff
    const latestInquiryLog = await prisma.audit_logs.findFirst({
      where: {
        grievance_id: grievance.grievance_id,
        action: "ADDITIONAL_INFO_REQUESTED",
      },
      orderBy: { created_at: "desc" },
    });

    const inquiryVal = latestInquiryLog?.new_value as {
      requestedDocs?: string[];
    } | null;
    const requestedDocs = Array.isArray(inquiryVal?.requestedDocs)
      ? inquiryVal.requestedDocs
      : [];

    if (
      (grievance.status === "AWAITING_INFORMATION" ||
        grievance.status === "WAITING_ON_USER" ||
        grievance.status === "WAITING_ON_EMPLOYEE") &&
      requestedDocs.length > 0 &&
      incomingFiles.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Document submission is mandatory. Staff requested the following documents: ${requestedDocs.join(", ")}. Please attach at least one document before submitting.`,
        },
        { status: 400 },
      );
    }

    if (incomingFiles.length > 0) {
      const currentAttachmentCount = await prisma.attachments.count({
        where: { grievance_id: grievance.grievance_id },
      });
      if (
        currentAttachmentCount + incomingFiles.length >
        MAX_ATTACHMENTS_PER_GRIEVANCE
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Maximum ${MAX_ATTACHMENTS_PER_GRIEVANCE} attachments allowed across the grievance lifecycle. Already attached: ${currentAttachmentCount}.`,
          },
          { status: 400 },
        );
      }

      const seenFileKeys = new Set<string>();
      for (const f of incomingFiles) {
        const fileKey = `${f.fileName.toLowerCase()}__${f.fileSize || 0}`;
        if (seenFileKeys.has(fileKey)) {
          return NextResponse.json(
            { success: false, error: "This document is already attached." },
            { status: 400 },
          );
        }
        seenFileKeys.add(fileKey);

        const check = validateUploadedFile(
          f.fileName,
          f.fileType,
          f.fileSize || 0,
        );
        if (!check.valid) {
          return NextResponse.json(
            { success: false, error: check.error },
            { status: 400 },
          );
        }
      }
    }

    const targetGrievanceId = grievance.grievance_id;
    const complainantName =
      `${grievance.users?.first_name} ${grievance.users?.last_name || ""}`.trim();

    await prisma.$transaction(async (tx) => {
      // 1. Resume status to IN_PROGRESS if waiting on user
      const isWaiting =
        grievance.status === "AWAITING_INFORMATION" ||
        grievance.status === "WAITING_ON_USER" ||
        grievance.status === "WAITING_ON_EMPLOYEE";

      if (isWaiting) {
        await tx.grievances.update({
          where: { grievance_id: targetGrievanceId },
          data: { status: "IN_PROGRESS" },
        });

        await tx.grievance_status_history.create({
          data: {
            grievance_id: targetGrievanceId,
            old_status: grievance.status,
            new_status: "IN_PROGRESS",
            changed_by: user.user_id,
            remarks:
              "Employee provided additional information/documents. Investigation resumed.",
          },
        });

        // Resume SLA tracking and extend deadlines by paused duration
        await resumeSlaTracking({
          grievanceId: targetGrievanceId,
          resumedBy: user.user_id,
          tx,
        });
      }

      // 2. Save attachments
      for (const file of incomingFiles) {
        if (file.fileName) {
          const raw = file.filePath || `grievances/${file.fileName}`;
          const norm = normalizeStoragePath(raw, SUPABASE_BUCKET);
          const relativeStoragePath = norm.valid ? norm.storagePath : raw;
          await tx.attachments.create({
            data: {
              grievance_id: targetGrievanceId,
              file_name: file.fileName,
              file_path: relativeStoragePath,
              file_type: file.fileType || "application/octet-stream",
              file_size: file.fileSize
                ? BigInt(Math.round(Number(file.fileSize)))
                : BigInt(1024),
              uploaded_by: user.user_id,
            },
          });
        }
      }

      // 3. Audit log (serves as the message in timeline)
      await tx.audit_logs.create({
        data: {
          grievance_id: targetGrievanceId,
          user_id: user.user_id,
          action: "USER_ADDITIONAL_INFO_PROVIDED",
          entity_type: "GRIEVANCE",
          entity_id: targetGrievanceId,
          new_value: {
            author: complainantName,
            role: "End User",
            message: message || "Additional documents provided.",
            uploadedFiles: incomingFiles.map((f) => f.fileName),
          },
        },
      });
    });

    // Collect all involved recipients who need to be notified when employee responds:
    const recipientUserIds = new Set<string>();

    // 1. The user who requested additional info/documents (Staff, Department Head, or Admin)
    const latestRequestLog = await prisma.audit_logs.findFirst({
      where: {
        grievance_id: targetGrievanceId,
        action: { in: ["ADDITIONAL_INFO_REQUESTED", "COMMUNICATION_MESSAGE"] },
        user_id: { not: user.user_id },
      },
      orderBy: { created_at: "desc" },
      select: { user_id: true },
    });
    if (latestRequestLog?.user_id) {
      recipientUserIds.add(latestRequestLog.user_id.toString());
    }

    // 2. All assigned staff across all departments
    const allAssignments = await prisma.assignments.findMany({
      where: {
        grievance_id: targetGrievanceId,
        assignment_status: { in: ["ASSIGNED", "COMPLETED"] },
      },
      select: { staff_id: true },
    });
    for (const a of allAssignments) {
      if (a.staff_id) {
        recipientUserIds.add(a.staff_id.toString());
      }
    }

    // 3. Department Heads of all involved departments
    const deptHeads = await prisma.users.findMany({
      where: {
        departments: {
          grievance_departments: {
            some: { grievance_id: targetGrievanceId },
          },
        },
        roles: { role_name: "DEPARTMENT_HEAD" },
        status: "ACTIVE",
      },
      select: { user_id: true },
    });
    for (const dh of deptHeads) {
      recipientUserIds.add(dh.user_id.toString());
    }

    // Never notify the complainant in this loop
    recipientUserIds.delete(user.user_id.toString());

    // Send notification to all involved parties
    for (const targetId of recipientUserIds) {
      await NotificationService.send({
        userId: BigInt(targetId),
        grievanceId: targetGrievanceId,
        type: "ADDITIONAL_INFO_SUBMITTED",
        channel: "IN_APP",
        title: `Information Submitted: ${grievance.grievance_number}`,
        message: `${complainantName} submitted the requested information/documents for grievance ${grievance.grievance_number}. Investigation has resumed.`,
      });
    }

    // Confirm to complainant
    await NotificationService.send({
      userId: grievance.submitted_by,
      grievanceId: targetGrievanceId,
      type: "ADDITIONAL_INFO_SUBMITTED",
      channel: "IN_APP",
      title: `Information Submitted: ${grievance.grievance_number}`,
      message: `Your additional information/documents for grievance ${grievance.grievance_number} were submitted successfully.`,
    });

    return NextResponse.json({
      success: true,
      message: "Additional information submitted successfully.",
    });
  } catch (error) {
    console.error("Error in additional-information route:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit additional information." },
      { status: 500 },
    );
  }
}
