import { NextResponse } from "next/server";
import {
  formatRelativeTime,
  resolveDepartmentHeadAuth,
} from "@/lib/department-head";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await resolveDepartmentHeadAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { departmentId, isAdmin } = auth;
  const { id } = await params;

  try {
    const grievanceId = BigInt(id);

    const grievanceDept = await prisma.grievance_departments.findFirst({
      where: {
        grievance_id: grievanceId,
        ...(isAdmin ? {} : { department_id: departmentId }),
      },
      include: { grievances: true },
    });

    if (!grievanceDept && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Grievance not found or not in your department queue",
        },
        { status: 404 },
      );
    }

    const logs = await prisma.audit_logs.findMany({
      where: {
        grievance_id: grievanceId,
        action: {
          in: [
            "HOD_DIRECTIVE_NOTE",
            "INVESTIGATION_NOTE_ADDED",
            "INTERNAL_NOTE_ADDED",
            "HEAD_DIRECTIVE_ISSUED",
          ],
        },
      },
      include: {
        users: {
          select: {
            first_name: true,
            last_name: true,
            roles: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
    });

    const notes = logs.map((l) => {
      const user = l.users;
      const userRole = user?.roles?.role_name;
      const val = l.new_value as {
        note?: string;
        details?: string;
        author?: string;
        role?: string;
      } | null;

      const roleDisplay =
        val?.role ||
        (userRole === "DEPARTMENT_HEAD"
          ? "Department Head"
          : userRole === "STAFF"
            ? "Staff"
            : userRole || "Staff");

      const rawName = user
        ? `${user.first_name} ${user.last_name || ""}`.trim()
        : "User";

      const authorDisplay =
        val?.author ||
        (userRole === "DEPARTMENT_HEAD"
          ? `Department Head — ${rawName}`
          : userRole === "STAFF"
            ? `Staff — ${rawName}`
            : rawName);

      return {
        id: l.audit_log_id.toString(),
        author: authorDisplay,
        role: roleDisplay,
        timestamp: formatRelativeTime(l.created_at),
        note: val?.note || val?.details || String(l.new_value || ""),
      };
    });

    return NextResponse.json({
      success: true,
      notes,
    });
  } catch (error) {
    console.error(
      "Error in GET /api/department-head/grievances/[id]/notes:",
      error,
    );
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch internal notes",
      },
      { status: 500 },
    );
  }
}

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

    if (!grievanceDept && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Grievance not found or not in your department queue",
        },
        { status: 404 },
      );
    }

    const grievance = grievanceDept?.grievances;
    const authorRawName = `${user.first_name} ${user.last_name || ""}`.trim();
    const authorDisplay = `Department Head — ${authorRawName}`;

    const createdAudit = await prisma.audit_logs.create({
      data: {
        grievance_id: grievanceId,
        user_id: user.user_id,
        action: "HOD_DIRECTIVE_NOTE",
        entity_type: "grievance",
        entity_id: grievanceId,
        new_value: {
          note: noteText,
          author: authorDisplay,
          role: "Department Head",
          details: noteText,
          stage: grievance?.status || "IN_PROGRESS",
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
      message: `Added internal directive to ${grievance?.grievance_number || id}`,
      note: {
        id: createdAudit.audit_log_id.toString(),
        author: authorDisplay,
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
