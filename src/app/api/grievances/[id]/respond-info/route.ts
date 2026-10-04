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
      responseMessage?: string;
      attachments?: IncomingAttachment[];
      email?: string;
    };

    const responseMessage = body.responseMessage?.trim();
    if (!responseMessage) {
      return NextResponse.json(
        { success: false, error: "Response message is required." },
        { status: 400 },
      );
    }

    // Try finding by grievance_id (BigInt) or grievance_number
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
            email: true,
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
                email: true,
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

    const targetGrievanceId = grievance.grievance_id;
    const user = await getCurrentUser();

    // Verify user authorization: logged in submitter, or matching email
    const submitterId = grievance.submitted_by;
    const isOwner = user ? user.user_id === submitterId : true;

    const userRole = user?.roles?.role_name;
    if (user && !isOwner && userRole !== "ADMIN" && userRole !== "STAFF") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: You do not have access to this grievance.",
        },
        { status: 403 },
      );
    }

    if (!user || userRole === "END_USER") {
      const check = await canEndUserSubmitCommunication(targetGrievanceId);
      if (!check.allowed) {
        return NextResponse.json(
          {
            success: false,
            error:
              check.reason ||
              "You can only respond when clarification has been requested by staff or department head.",
          },
          { status: 403 },
        );
      }
    }

    const complainantName = grievance.users
      ? `${grievance.users.first_name} ${grievance.users.last_name || ""}`.trim()
      : "Complainant";

    const incomingFiles: IncomingAttachment[] = Array.isArray(body.attachments)
      ? body.attachments
      : [];

    await prisma.$transaction(async (tx) => {
      // 1. Change status back to IN_PROGRESS
      await tx.grievances.update({
        where: { grievance_id: targetGrievanceId },
        data: { status: "IN_PROGRESS" },
      });

      // 2. Add Status History
      await tx.grievance_status_history.create({
        data: {
          grievance_id: targetGrievanceId,
          old_status: grievance.status,
          new_status: "IN_PROGRESS",
          changed_by: user ? user.user_id : submitterId,
          remarks: `Complainant provided requested clarification and uploaded ${incomingFiles.length} file(s). Investigation resumed.`,
        },
      });

      // 3. Save any uploaded attachments
      for (const file of incomingFiles) {
        if (file.fileName) {
          await tx.attachments.create({
            data: {
              grievance_id: targetGrievanceId,
              file_name: file.fileName,
              file_path: file.filePath || `/uploads/${file.fileName}`,
              file_type: file.fileType || "application/octet-stream",
              file_size: file.fileSize ? BigInt(file.fileSize) : BigInt(1024),
              uploaded_by: submitterId,
            },
          });
        }
      }

      // 4. Record Audit Log
      await tx.audit_logs.create({
        data: {
          grievance_id: targetGrievanceId,
          user_id: user ? user.user_id : submitterId,
          action: "USER_INFO_SUBMITTED",
          entity_type: "GRIEVANCE",
          entity_id: targetGrievanceId,
          new_value: {
            author: `Complainant — ${complainantName}`,
            role: "End User",
            response: responseMessage,
            uploadedFiles: incomingFiles.map((f) => f.fileName),
            details: `Complainant responded to information request: "${responseMessage}". Attached files: ${incomingFiles.map((f) => f.fileName).join(", ") || "None"}.`,
            note: `[Complainant Response & Documentation Received]\nResponse: ${responseMessage}\nFiles: ${incomingFiles.map((f) => f.fileName).join(", ") || "None"}`,
          },
        },
      });
    });

    // 5. Notify the Assigned Staff
    const activeAssignment = grievance.assignments?.[0];
    const assignedStaff = activeAssignment?.users_assignments_staff_idTousers;

    if (assignedStaff) {
      // In-App notification
      await NotificationService.send({
        userId: assignedStaff.user_id,
        grievanceId: targetGrievanceId,
        type: "ADDITIONAL_INFO_SUBMITTED",
        channel: "IN_APP",
        title: `Complainant Responded with Documents (${grievance.grievance_number})`,
        message: `${complainantName} has submitted requested information and ${incomingFiles.length} document(s). Investigation resumed to In Progress.`,
      });

      // Email notification
      await NotificationService.send({
        userId: assignedStaff.user_id,
        grievanceId: targetGrievanceId,
        type: "ADDITIONAL_INFO_SUBMITTED",
        channel: "EMAIL",
        title: `Clarification Received: ${grievance.grievance_number}`,
        message: `Hello ${assignedStaff.first_name},\n\nComplainant ${complainantName} has submitted response details and documentation for grievance #${grievance.grievance_number}.\n\nResponse Statement:\n"${responseMessage}"\n\nAttached Documents: ${incomingFiles.map((f) => f.fileName).join(", ") || "None"}\n\nThe grievance status has been transitioned back to In Progress so you can continue your investigation.\n\nRegards,\nGRS Resolution Desk`,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Your response and documents have been submitted successfully. Investigating staff has been notified.",
      status: "IN_PROGRESS",
    });
  } catch (error) {
    console.error("Error in respond-info route:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit response." },
      { status: 500 },
    );
  }
}
