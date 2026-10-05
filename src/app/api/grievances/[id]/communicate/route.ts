import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canEndUserSubmitCommunication } from "@/lib/communication/service";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";

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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Please log in." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = (await request.json()) as {
      message?: string;
      attachments?: IncomingAttachment[];
    };

    const messageText = body.message?.trim();
    if (!messageText) {
      return NextResponse.json(
        { success: false, message: "Message content cannot be empty." },
        { status: 400 },
      );
    }

    let grievanceId: bigint | null = null;
    try {
      grievanceId = BigInt(id);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid grievance ID." },
        { status: 400 },
      );
    }

    const grievance = await prisma.grievances.findUnique({
      where: { grievance_id: grievanceId },
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
          where: { assignment_status: { in: ["ASSIGNED", "COMPLETED"] } },
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
        { success: false, message: "Grievance not found." },
        { status: 404 },
      );
    }

    if (grievance.status === "CLOSED") {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot send messages on a closed grievance.",
        },
        { status: 403 },
      );
    }

    const involvedDepts = await prisma.grievance_departments.findMany({
      where: { grievance_id: grievanceId },
      select: { department_id: true },
    });

    const userRole = user.roles?.role_name;
    const userId = BigInt(user.user_id);
    const deptId = user.department_id ? BigInt(user.department_id) : null;

    const isSubmitter = grievance.submitted_by === userId;
    const isAssignedStaff = grievance.assignments.some(
      (a) => a.staff_id === userId,
    );
    const isInvolvedDepartment = deptId
      ? involvedDepts.some((gd) => gd.department_id === deptId)
      : false;

    if (userRole === "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin accounts have read-only visibility for grievance communication.",
        },
        { status: 403 },
      );
    }

    if (!isSubmitter && !isAssignedStaff && !isInvolvedDepartment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You are not a permitted participant for this grievance.",
        },
        { status: 403 },
      );
    }

    if (userRole === "STAFF" && grievance.status === "ASSIGNED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Investigation has not been started yet. You must click 'Start Investigation' before sending messages.",
        },
        { status: 403 },
      );
    }

    if (userRole === "END_USER") {
      const check = await canEndUserSubmitCommunication(grievanceId);
      if (!check.allowed) {
        return NextResponse.json(
          {
            success: false,
            message:
              check.reason ||
              "You can only submit messages or documents when requested by staff or department head.",
          },
          { status: 403 },
        );
      }
    }

    const senderFullName = `${user.first_name} ${user.last_name || ""}`.trim();
    const incomingFiles: IncomingAttachment[] = Array.isArray(body.attachments)
      ? body.attachments
      : [];

    const fileNames = incomingFiles.map((f) => f.fileName);

    // Persist attachments
    if (incomingFiles.length > 0) {
      for (const file of incomingFiles) {
        await prisma.attachments.create({
          data: {
            grievance_id: grievanceId,
            file_name: file.fileName,
            file_path: file.filePath || `/uploads/${file.fileName}`,
            file_type: file.fileType || "application/octet-stream",
            file_size: file.fileSize ? BigInt(file.fileSize) : null,
            uploaded_by: userId,
          },
        });
      }
    }

    if (userRole === "END_USER") {
      // Citizen responding
      await prisma.audit_logs.create({
        data: {
          user_id: userId,
          grievance_id: grievanceId,
          action: "USER_INFO_SUBMITTED",
          entity_type: "GRIEVANCE",
          entity_id: grievanceId,
          new_value: {
            message: messageText,
            author: senderFullName,
            role: "End User",
            uploadedFiles: fileNames,
          },
        },
      });

      // If waiting on user, advance back to IN_PROGRESS
      if (grievance.status === "WAITING_ON_USER") {
        await prisma.grievances.update({
          where: { grievance_id: grievanceId },
          data: {
            status: "IN_PROGRESS",
            updated_at: new Date(),
          },
        });
      } else {
        await prisma.grievances.update({
          where: { grievance_id: grievanceId },
          data: { updated_at: new Date() },
        });
      }

      // Notify assigned staff
      for (const a of grievance.assignments) {
        await NotificationService.send({
          userId: a.staff_id,
          grievanceId: grievanceId,
          type: "ADDITIONAL_INFO_SUBMITTED",
          title: `Communication Received: ${grievance.grievance_number}`,
          message: `${senderFullName} replied to the grievance communication thread.`,
        });
      }

      // Confirm to End User
      await NotificationService.send({
        userId,
        grievanceId,
        type: "ADDITIONAL_INFO_SUBMITTED",
        title: `Communication Sent: ${grievance.grievance_number}`,
        message: `Your message on grievance ${grievance.grievance_number} was sent successfully.`,
      });
    } else {
      // Staff or Department Head messaging
      const isStaff = userRole === "STAFF";
      const actionType = isStaff
        ? "ADDITIONAL_INFO_REQUESTED"
        : "COMMUNICATION_MESSAGE";

      await prisma.audit_logs.create({
        data: {
          user_id: userId,
          grievance_id: grievanceId,
          action: actionType,
          entity_type: "GRIEVANCE",
          entity_id: grievanceId,
          new_value: {
            message: messageText,
            author: senderFullName,
            role: isStaff ? "Staff" : "Department Head",
            requestedDocs: fileNames,
          },
        },
      });

      // Update grievance timestamp
      await prisma.grievances.update({
        where: { grievance_id: grievanceId },
        data: { updated_at: new Date() },
      });

      // Notify End User
      await NotificationService.send({
        userId: grievance.submitted_by,
        grievanceId: grievanceId,
        type: "ADDITIONAL_INFO_REQUESTED",
        title: `New Message on Grievance ${grievance.grievance_number}`,
        message: `${senderFullName} sent a message regarding your grievance.`,
      });

      // Confirm to Staff / Department Head
      await NotificationService.send({
        userId,
        grievanceId,
        type: "SYSTEM",
        title: `Message Sent: ${grievance.grievance_number}`,
        message: `You sent a message regarding grievance ${grievance.grievance_number} to the complainant.`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Communication sent successfully.",
    });
  } catch (error) {
    console.error("Error in POST /api/grievances/[id]/communicate:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error occurred." },
      { status: 500 },
    );
  }
}
