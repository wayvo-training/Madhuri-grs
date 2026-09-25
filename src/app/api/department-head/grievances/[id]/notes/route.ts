import { NextResponse } from "next/server";
import {
  formatRelativeTime,
  resolveDepartmentHeadAuth,
} from "@/lib/department-head";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";

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
    const noteText = body?.note?.trim();

    if (!noteText) {
      return NextResponse.json(
        { success: false, message: "Directive note cannot be blank" },
        { status: 400 },
      );
    }

    const grievanceDept = await prisma.grievance_departments.findFirst({
      where: {
        grievance_id: grievanceId,
        ...(isAdmin ? {} : { department_id: departmentId }),
      },
      include: { grievances: true },
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
    const authorName = `${user.first_name} ${user.last_name || ""}`.trim();

    const createdAudit = await prisma.audit_logs.create({
      data: {
        grievance_id: grievanceId,
        user_id: user.user_id,
        action: "HOD_DIRECTIVE_NOTE",
        entity_type: "grievance",
        entity_id: grievanceId,
        new_value: {
          note: noteText,
          author: `${authorName} (Department Head)`,
          role: "Department Head",
          details: `Directive: "${noteText}"`,
          stage: grievance.status,
        },
      },
    });

    // Notify assigned staff
    const assignment = await prisma.assignments.findFirst({
      where: { grievance_id: grievanceId, assignment_status: "ASSIGNED" },
      orderBy: { assigned_at: "desc" },
    });
    if (assignment) {
      await NotificationService.notifyInternalNote(
        grievanceId,
        assignment.staff_id,
      );
    }

    return NextResponse.json({
      success: true,
      message: `Added internal directive to ${grievance.grievance_number}`,
      note: {
        id: createdAudit.audit_log_id.toString(),
        author: `${authorName} (Department Head)`,
        role: "Department Head",
        timestamp: formatRelativeTime(createdAudit.created_at),
        note: noteText,
      },
    });
  } catch (error) {
    console.error("Error in notes route:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to record internal note",
      },
      { status: 500 },
    );
  }
}
