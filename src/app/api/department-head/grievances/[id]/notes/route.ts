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

    const { deptId, isAdmin } = authResult;

    const logs = await prisma.audit_logs.findMany({
      where: {
        grievance_id: grievanceId,
        action: {
          in: [
            "HOD_DIRECTIVE_NOTE",
            "INVESTIGATION_NOTE_ADDED",
            "INTERNAL_NOTE_ADDED",
            "HEAD_DIRECTIVE_ISSUED",
            "COLLABORATION_NOTE_ADDED",
            "SUPPORTING_FINDINGS_SUBMITTED",
          ],
        },
      },
      include: {
        users: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            department_id: true,
            roles: true,
          },
        },
      },
      orderBy: { created_at: "asc" },
    });

    interface NoteItem {
      id: string;
      author: string;
      role: string;
      timestamp: string;
      note: string;
      parentId?: string;
      replyToAuthor?: string;
      createdAt: string;
      scope?: string;
      departmentName?: string;
    }

    const internalNotes: NoteItem[] = [];
    const collaborationNotes: NoteItem[] = [];

    for (const l of logs) {
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

      const noteText =
        (val?.note as string) ||
        (val?.details as string) ||
        String(l.new_value || "");

      const noteItem: NoteItem = {
        id: l.audit_log_id.toString(),
        author: authorDisplay,
        role: roleDisplay,
        timestamp: formatRelativeTime(l.created_at),
        note: noteText,
        parentId: (val?.parentId as string) || undefined,
        replyToAuthor: (val?.replyToAuthor as string) || undefined,
        createdAt: l.created_at.toISOString(),
        scope: (val?.scope as string) || "INTERNAL",
        departmentName: (val?.departmentName as string) || undefined,
      };

      const isFinding =
        l.action === "SUPPORTING_FINDINGS_SUBMITTED" ||
        val?.isFindings === true ||
        String(val?.note || "").includes("[Department Findings");

      if (isFinding) {
        // Findings belong on dedicated Department Findings tab, not in discussion notes
        continue;
      }

      const isCollab =
        l.action === "COLLABORATION_NOTE_ADDED" ||
        val?.scope === "COLLABORATION";

      if (isCollab) {
        collaborationNotes.push(noteItem);
      } else {
        // Internal note: only include if it belongs to the requesting user's department
        if (!isAdmin && deptId) {
          const authorDeptId =
            u?.department_id?.toString() ||
            (val?.department_id ? String(val.department_id) : null);
          if (authorDeptId && authorDeptId !== deptId.toString()) {
            continue;
          }
        }
        internalNotes.push(noteItem);
      }
    }

    return NextResponse.json({
      success: true,
      internalNotes,
      collaborationNotes,
      notes: internalNotes,
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

    const { user, userRole, userId, deptId } = authResult;
    const body = (await request.json()) as {
      note?: string;
      parentId?: string;
      replyToAuthor?: string;
      scope?: "INTERNAL" | "COLLABORATION";
    };
    const noteText = body?.note?.trim();
    const parentId = body?.parentId?.trim() || undefined;
    const replyToAuthor = body?.replyToAuthor?.trim() || undefined;
    const scope =
      body?.scope === "COLLABORATION" ? "COLLABORATION" : "INTERNAL";

    if (!noteText) {
      return NextResponse.json(
        { success: false, message: "Note content cannot be blank" },
        { status: 400 },
      );
    }

    const userDept = deptId
      ? await prisma.departments.findUnique({
          where: { department_id: deptId },
          select: { department_name: true },
        })
      : null;
    const deptName = userDept?.department_name || "Department";

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
    const authorDisplay =
      scope === "COLLABORATION"
        ? `${roleDisplay} — ${authorRawName} (${deptName})`
        : `${roleDisplay} — ${authorRawName}`;

    const action =
      scope === "COLLABORATION"
        ? "COLLABORATION_NOTE_ADDED"
        : userRole === "DEPARTMENT_HEAD"
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
          department_id: deptId ? deptId.toString() : null,
          departmentName: deptName,
          scope,
          details: noteText,
          stage: grievance?.status || "IN_PROGRESS",
          parentId: parentId || null,
          replyToAuthor: replyToAuthor || null,
        },
      },
    });

    if (scope === "COLLABORATION") {
      // Notify all involved departments' heads and assigned staff
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
          title: `Collaboration Update (${grievance?.grievance_number || id})`,
          message: `${authorDisplay} posted in Collaboration: "${
            noteText.length > 60 ? `${noteText.substring(0, 60)}...` : noteText
          }"`,
        });
      }
    } else {
      // Scope is INTERNAL: strictly notify only members of the same department
      if (userRole === "DEPARTMENT_HEAD" && deptId) {
        const assignment = await prisma.assignments.findFirst({
          where: {
            grievance_id: grievanceId,
            assignment_status: "ASSIGNED",
            grievance_departments: { department_id: deptId },
          },
          orderBy: { assigned_at: "desc" },
        });
        if (assignment && assignment.staff_id !== userId) {
          await NotificationService.notifyInternalNote(
            grievanceId,
            assignment.staff_id,
          );
        }
      } else if (userRole === "STAFF" && deptId) {
        const deptHeads = await prisma.users.findMany({
          where: {
            department_id: deptId,
            roles: { role_name: "DEPARTMENT_HEAD" },
            status: "ACTIVE",
          },
        });
        for (const dh of deptHeads) {
          if (dh.user_id !== userId) {
            await NotificationService.send({
              userId: dh.user_id,
              grievanceId,
              type: "HEAD_INTERNAL_NOTE",
              title: parentId
                ? "Internal Discussion Reply"
                : "Internal Discussion Note",
              message: `${authorDisplay} posted an internal ${
                parentId ? "reply" : "note"
              } on grievance ${grievance?.grievance_number || id}: "${
                noteText.length > 60
                  ? `${noteText.substring(0, 60)}...`
                  : noteText
              }"`,
            });
          }
        }
      }
    }

    // Confirm to the author that their note was posted
    await NotificationService.send({
      userId,
      grievanceId,
      type: "HEAD_INTERNAL_NOTE",
      title:
        scope === "COLLABORATION"
          ? "Collaboration Note Logged"
          : parentId
            ? "Discussion Reply Logged"
            : "Internal Note Logged",
      message: `You added a ${scope === "COLLABORATION" ? "collaboration note" : `internal ${parentId ? "reply" : "note"}`} to grievance ${grievance?.grievance_number || id}.`,
    });

    return NextResponse.json({
      success: true,
      message: `Added ${scope === "COLLABORATION" ? "collaboration note" : `internal ${parentId ? "reply" : "note"}`} to ${
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
        scope,
        departmentName: deptName,
      },
    });
  } catch (error) {
    console.error("Error in notes route:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to record note",
      },
      { status: 500 },
    );
  }
}
