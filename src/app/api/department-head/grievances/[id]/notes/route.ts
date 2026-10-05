import { NextResponse } from "next/server";
import { formatRelativeTime } from "@/lib/department-head";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";

/**
 * Validates that the requesting user is an authorized internal participant
 * (Admin, Department Head whose department is involved, or assigned/involved Staff).
 * Strictly forbids End Users from accessing internal discussion.
 */
async function resolveInternalDiscussionAuth(
  _request: Request,
  grievanceId: bigint,
) {
  const auth = await authorizeApi({
    role: ["DEPARTMENT_HEAD", "STAFF", "ADMIN"],
  });
  if ("error" in auth) {
    return { error: auth.error };
  }

  const { user } = auth;
  const userRole = user.roles.role_name;
  const userId = BigInt(user.user_id);
  const deptId = user.department_id ? BigInt(user.department_id) : null;
  const isAdmin = userRole === "ADMIN";

  if (isAdmin) {
    return { user, userRole, userId, deptId, isAdmin: true };
  }

  if (userRole === "DEPARTMENT_HEAD") {
    if (!deptId) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "Department Head has no assigned department",
          },
          { status: 403 },
        ),
      };
    }
    const deptInvolved = await prisma.grievance_departments.findFirst({
      where: {
        grievance_id: grievanceId,
        department_id: deptId,
      },
    });
    if (!deptInvolved) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: "Grievance not in your department queue",
          },
          { status: 403 },
        ),
      };
    }
    return { user, userRole, userId, deptId, isAdmin: false };
  }

  if (userRole === "STAFF") {
    const assignment = await prisma.assignments.findFirst({
      where: {
        grievance_id: grievanceId,
        staff_id: userId,
        assignment_status: { in: ["ASSIGNED", "COMPLETED", "TRANSFERRED"] },
      },
    });

    let deptInvolved = false;
    if (deptId) {
      const d = await prisma.grievance_departments.findFirst({
        where: {
          grievance_id: grievanceId,
          department_id: deptId,
        },
      });
      if (d) deptInvolved = true;
    }

    if (!assignment && !deptInvolved) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message:
              "Forbidden: Grievance not assigned or involved with your department",
          },
          { status: 403 },
        ),
      };
    }

    return { user, userRole, userId, deptId, isAdmin: false };
  }

  return {
    error: NextResponse.json(
      {
        success: false,
        message: "Forbidden: Access denied to internal discussion",
      },
      { status: 403 },
    ),
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const grievanceId = BigInt(id);
    const authResult = await resolveInternalDiscussionAuth(
      request,
      grievanceId,
    );
    if ("error" in authResult) {
      return authResult.error;
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
      const u = l.users;
      const uRole = u?.roles?.role_name;

      let val: Record<string, unknown> = {};
      if (typeof l.new_value === "string") {
        try {
          val = JSON.parse(l.new_value);
        } catch {
          val = { note: l.new_value };
        }
      } else if (l.new_value && typeof l.new_value === "object") {
        val = l.new_value as Record<string, unknown>;
      }

      const roleDisplay =
        (val?.role as string) ||
        (uRole === "DEPARTMENT_HEAD"
          ? "Department Head"
          : uRole === "STAFF"
            ? "Staff"
            : uRole === "ADMIN"
              ? "Admin"
              : uRole || "Staff");

      const rawName = u
        ? `${u.first_name} ${u.last_name || ""}`.trim()
        : "User";

      const authorDisplay =
        (val?.author as string) ||
        (uRole === "DEPARTMENT_HEAD"
          ? `Department Head — ${rawName}`
          : uRole === "STAFF"
            ? `Staff — ${rawName}`
            : uRole === "ADMIN"
              ? `Admin — ${rawName}`
              : rawName);

      return {
        id: l.audit_log_id.toString(),
        author: authorDisplay,
        role: roleDisplay,
        timestamp: formatRelativeTime(l.created_at),
        note:
          (val?.note as string) ||
          (val?.details as string) ||
          String(l.new_value || ""),
        parentId: (val?.parentId as string) || undefined,
        replyToAuthor: (val?.replyToAuthor as string) || undefined,
        createdAt: l.created_at.toISOString(),
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
        message: "Failed to fetch internal discussion",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const grievanceId = BigInt(id);
    const authResult = await resolveInternalDiscussionAuth(
      request,
      grievanceId,
    );
    if ("error" in authResult) {
      return authResult.error;
    }

    const { user, userRole, userId } = authResult;
    const body = (await request.json()) as {
      note?: string;
      parentId?: string;
      replyToAuthor?: string;
    };
    const noteText = body?.note?.trim();
    const parentId = body?.parentId?.trim() || undefined;
    const replyToAuthor = body?.replyToAuthor?.trim() || undefined;

    if (!noteText) {
      return NextResponse.json(
        { success: false, message: "Note content cannot be blank" },
        { status: 400 },
      );
    }

    const grievance = await prisma.grievances.findUnique({
      where: { grievance_id: grievanceId },
      select: { grievance_number: true, status: true },
    });

    const authorRawName = `${user.first_name} ${user.last_name || ""}`.trim();
    const roleDisplay =
      userRole === "DEPARTMENT_HEAD"
        ? "Department Head"
        : userRole === "STAFF"
          ? "Staff"
          : "Admin";
    const authorDisplay = `${roleDisplay} — ${authorRawName}`;

    const action =
      userRole === "DEPARTMENT_HEAD"
        ? "HOD_DIRECTIVE_NOTE"
        : userRole === "STAFF"
          ? "INVESTIGATION_NOTE_ADDED"
          : "INTERNAL_NOTE_ADDED";

    const createdAudit = await prisma.audit_logs.create({
      data: {
        grievance_id: grievanceId,
        user_id: userId,
        action,
        entity_type: "grievance",
        entity_id: grievanceId,
        new_value: {
          note: noteText,
          author: authorDisplay,
          role: roleDisplay,
          details: noteText,
          stage: grievance?.status || "IN_PROGRESS",
          parentId: parentId || null,
          replyToAuthor: replyToAuthor || null,
        },
      },
    });

    // Preserve existing notification behavior:
    // If Department Head posts a directive/reply, notify assigned Staff
    if (userRole === "DEPARTMENT_HEAD") {
      const assignment = await prisma.assignments.findFirst({
        where: { grievance_id: grievanceId, assignment_status: "ASSIGNED" },
        orderBy: { assigned_at: "desc" },
      });
      if (assignment && assignment.staff_id !== userId) {
        await NotificationService.notifyInternalNote(
          grievanceId,
          assignment.staff_id,
        );
      }
    } else if (userRole === "STAFF") {
      // If Staff posts an internal note/reply, notify involved Department Heads
      const involvedDepts = await prisma.grievance_departments.findMany({
        where: { grievance_id: grievanceId },
        include: {
          assignments: {
            where: { assignment_status: "ASSIGNED" },
          },
        },
      });

      const userIdsToNotify = new Set<bigint>();
      for (const d of involvedDepts) {
        if (d.assignments?.staff_id && d.assignments.staff_id !== userId) {
          userIdsToNotify.add(d.assignments.staff_id);
        }
        const deptHeads = await prisma.users.findMany({
          where: {
            department_id: d.department_id,
            roles: { role_name: "DEPARTMENT_HEAD" },
            status: "ACTIVE",
          },
        });
        for (const dh of deptHeads) {
          if (dh.user_id !== userId) {
            userIdsToNotify.add(dh.user_id);
          }
        }
      }

      for (const uId of userIdsToNotify) {
        await NotificationService.send({
          userId: uId,
          grievanceId,
          type: "HEAD_INTERNAL_NOTE",
          title: parentId
            ? "Internal Discussion Reply"
            : "Internal Discussion Note",
          message: `${authorDisplay} posted an internal ${
            parentId ? "reply" : "note"
          } on grievance ${grievance?.grievance_number || id}: "${
            noteText.length > 60 ? noteText.substring(0, 60) + "..." : noteText
          }"`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Added internal ${parentId ? "reply" : "note"} to ${
        grievance?.grievance_number || id
      }`,
      note: {
        id: createdAudit.audit_log_id.toString(),
        author: authorDisplay,
        role: roleDisplay,
        timestamp: formatRelativeTime(createdAudit.created_at),
        note: noteText,
        parentId,
        replyToAuthor,
        createdAt: createdAudit.created_at.toISOString(),
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
