import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";
import { canEndUserSubmitCommunication } from "@/lib/communication/service";

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
    const incomingFiles: IncomingAttachment[] = Array.isArray(body.attachments) ? body.attachments : [];

    if (!message && incomingFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "Must provide a message or at least one document." },
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
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.user_id !== grievance.submitted_by) {
      return NextResponse.json({ success: false, error: "Forbidden: Not your grievance" }, { status: 403 });
    }

    const eligibleStatuses = ["PENDING", "SUBMITTED", "ROUTED", "ASSIGNED", "IN_PROGRESS", "WAITING_ON_USER", "WAITING_ON_EMPLOYEE", "REOPENED"];
    if (!eligibleStatuses.includes(grievance.status)) {
      return NextResponse.json({ success: false, error: "Grievance is not eligible for additional information." }, { status: 400 });
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

    const targetGrievanceId = grievance.grievance_id;
    const complainantName = `${grievance.users?.first_name} ${grievance.users?.last_name || ""}`.trim();

    await prisma.$transaction(async (tx) => {
      // 1. Save attachments
      for (const file of incomingFiles) {
        if (file.fileName) {
          await tx.attachments.create({
            data: {
              grievance_id: targetGrievanceId,
              file_name: file.fileName,
              file_path: file.filePath || `/uploads/${file.fileName}`,
              file_type: file.fileType || "application/octet-stream",
              file_size: file.fileSize ? BigInt(file.fileSize) : BigInt(1024),
              uploaded_by: user.user_id,
            },
          });
        }
      }

      // 2. Audit log (serves as the message in timeline)
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

    // Notify assigned staff if any
    const activeAssignment = grievance.assignments?.[0];
    const assignedStaff = activeAssignment?.users_assignments_staff_idTousers;

    if (assignedStaff) {
      await NotificationService.send({
        userId: assignedStaff.user_id,
        grievanceId: targetGrievanceId,
        type: "ADDITIONAL_INFO_SUBMITTED",
        channel: "IN_APP",
        title: `Additional Information: ${grievance.grievance_number}`,
        message: `${complainantName} has provided additional information/documents voluntarily.`,
      });
    }

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
