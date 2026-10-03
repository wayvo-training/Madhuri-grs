import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";
import { resolveStaffAuth } from "@/lib/staff/permissions";
import {
  calculateSlaStatus,
  formatAuditActionTitle,
  formatRelativeTime,
} from "@/lib/staff/utils";
import type {
  StaffAuditItem,
  StaffGrievanceItem,
  StaffInternalNote,
  StaffPriority,
  StaffResolutionData,
} from "@/types/staff";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await resolveStaffAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { staffId, isAdmin } = auth;
  const { id } = await params;

  try {
    const grievanceId = BigInt(id);

    // Verify assignment to this staff member
    const grievance = await prisma.grievances.findUnique({
      where: { grievance_id: grievanceId },
      include: {
        categories: true,
        subcategories: true,
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            roles: true,
          },
        },
        attachments: true,
        assignments: {
          where: {
            assignment_status: { in: ["ASSIGNED", "COMPLETED"] },
            ...(isAdmin ? {} : { staff_id: staffId }),
          },
        },
        resolutions: {
          orderBy: { submitted_at: "desc" },
          take: 1,
          include: {
            attachments: true,
            users: {
              include: { roles: true },
            },
            resolution_reviews: {
              orderBy: { reviewed_at: "desc" },
              take: 1,
            },
            knowledge_articles: {
              select: { article_id: true },
            },
          },
        },
        audit_logs: {
          orderBy: { created_at: "desc" },
          include: {
            users: {
              select: {
                first_name: true,
                last_name: true,
                roles: true,
              },
            },
          },
        },
      },
    });

    if (!grievance) {
      return NextResponse.json(
        { success: false, message: "Grievance not found" },
        { status: 404 },
      );
    }

    if (
      !isAdmin &&
      (!grievance.assignments || grievance.assignments.length === 0)
    ) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Grievance not assigned to you" },
        { status: 403 },
      );
    }

    const currentAssignment = grievance.assignments?.[0];

    // Proactively evaluate SLA threshold notifications
    try {
      const { evaluateGrievanceSla } = await import("@/lib/engines/sla-engine");
      await evaluateGrievanceSla(grievanceId);
    } catch (slaErr) {
      console.error("SLA evaluation error:", slaErr);
    }

    const slaCalc = calculateSlaStatus(
      grievance.created_at,
      grievance.due_at,
      grievance.sla_status,
    );

    const submitter = grievance.users;
    const submitterFullName = submitter
      ? `${submitter.first_name} ${submitter.last_name || ""}`.trim()
      : "Employee";

    const latestResolution = grievance.resolutions?.[0];
    const latestReview = latestResolution?.resolution_reviews?.[0];
    let submittedResolution: StaffResolutionData | null = null;

    if (latestResolution) {
      submittedResolution = {
        id: latestResolution.resolution_id.toString(),
        submittedByUserId: latestResolution.submitted_by.toString(),
        submittedByRole:
          latestResolution.users?.roles?.role_name || undefined,
        problemSummary: latestResolution.problem_summary,
        findings: latestResolution.findings,
        actionTaken: latestResolution.action_taken,
        outcome: latestResolution.outcome,
        evidence: latestResolution.evidence,
        submittedAt: latestResolution.submitted_at.toISOString(),
        reviewStatus: latestReview?.decision as
          | "PENDING"
          | "ACCEPTED"
          | "REJECTED"
          | undefined,
        rejectionReason: latestReview?.rejection_reason || null,
        attachments: (latestResolution.attachments || []).map((att) => ({
          id: att.attachment_id.toString(),
          name: att.file_name,
          size: att.file_size
            ? `${Math.round(Number(att.file_size) / 1024)} KB`
            : "Document",
          type: att.file_type,
          path: att.file_path,
          uploadedAt: att.uploaded_at.toISOString(),
        })),
      };
    }

    const attachments = (grievance.attachments || [])
      .filter((att) => !att.resolution_id)
      .map((att) => ({
        id: att.attachment_id.toString(),
        name: att.file_name,
        size: att.file_size
          ? `${Math.round(Number(att.file_size) / 1024)} KB`
          : "Document",
        type: att.file_type,
        path: att.file_path,
        uploadedAt: formatRelativeTime(grievance.created_at),
      }));

    // Extract two-way internal case notes from audit logs (chronological: oldest to newest)
    const internalNotes: StaffInternalNote[] = (grievance.audit_logs || [])
      .filter(
        (l) =>
          l.action === "HOD_DIRECTIVE_NOTE" ||
          l.action === "INVESTIGATION_NOTE_ADDED" ||
          l.action === "INTERNAL_NOTE_ADDED" ||
          l.action === "HEAD_DIRECTIVE_ISSUED",
      )
      .slice()
      .reverse()
      .map((l) => {
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

    const auditTrail: StaffAuditItem[] = (grievance.audit_logs || []).map(
      (log) => {
        const user = log.users;
        const userRole = user?.roles?.role_name;
        let actorName = "System";
        if (user) {
          const rawName = `${user.first_name} ${user.last_name || ""}`.trim();
          if (userRole === "DEPARTMENT_HEAD") {
            actorName = `Department Head — ${rawName}`;
          } else if (userRole === "STAFF") {
            actorName = `Staff — ${rawName}`;
          } else {
            actorName = rawName;
          }
        }

        const logVal = log.new_value as {
          details?: string;
          note?: string;
          author?: string;
        } | null;
        const details =
          logVal?.note || logVal?.details || formatAuditActionTitle(log.action);
        return {
          id: log.audit_log_id.toString(),
          action: formatAuditActionTitle(log.action),
          details,
          actor: actorName,
          timestamp: log.created_at.toISOString(),
          relativeTime: formatRelativeTime(log.created_at),
        };
      },
    );

    // Fetch involved departments dynamically directly from grievance_departments since schema treats grievance_departments relation as 1-1
    const rawDepartments = await prisma.grievance_departments.findMany({
      where: { grievance_id: grievanceId },
      include: {
        departments: true,
        assignments: {
          include: {
            users_assignments_staff_idTousers: {
              select: { first_name: true, last_name: true },
            },
          },
        },
      },
      orderBy: { involvement_type: "asc" },
    });

    const departmentsInvolved = rawDepartments.map((rawD) => {
      const d = rawD as any;
      const activeAssignment = d.assignments;
      const staffUser = activeAssignment?.users_assignments_staff_idTousers;
      const assignedStaff = staffUser
        ? `${staffUser.first_name} ${staffUser.last_name || ""}`.trim()
        : null;

      const isMyAssignment = activeAssignment?.staff_id === staffId;

      return {
        id: d.grievance_department_id.toString(),
        departmentName: d.departments?.department_name || "Unknown Department",
        involvementType: d.involvement_type as
          | "PRIMARY"
          | "SUPPORTING"
          | "EQUAL",
        status: d.status,
        assignedStaff,
        isMyAssignment,
      };
    });

    const myDept = departmentsInvolved.find((d) => d.isMyAssignment);
    const myInvolvementType = myDept?.involvementType || (isAdmin ? "PRIMARY" : "PRIMARY");
    const isPrimaryOwner = myInvolvementType === "PRIMARY" || isAdmin;

    const result: StaffGrievanceItem = {
      id: grievance.grievance_id.toString(),
      grievanceNumber: grievance.grievance_number,
      title: grievance.title,
      description: grievance.description,
      category: grievance.categories?.category_name || "General",
      subcategory: grievance.subcategories?.subcategory_name || "General",
      categoryId: grievance.category_id?.toString(),
      subcategoryId: grievance.subcategory_id?.toString(),
      priority:
        (grievance.priority?.toUpperCase() as StaffPriority) || "MEDIUM",
      status: grievance.status as StaffGrievanceItem["status"],
      reopenCount: grievance.reopen_count || 0,
      manualReviewCount: grievance.manual_review_count || 0,
      slaStatus: slaCalc.state,
      slaConsumptionPercent: slaCalc.consumptionPercent,
      slaTimeLeft: slaCalc.timeRemaining,
      dueAt: grievance.due_at ? grievance.due_at.toISOString() : null,
      submittedAt: formatRelativeTime(grievance.created_at),
      assignedAt: currentAssignment
        ? formatRelativeTime(currentAssignment.assigned_at)
        : "Assigned",
      submitterName: submitterFullName,
      submitterEmail: submitter?.email || "",
      submitterRole: submitter?.roles?.role_name || "Employee",
      hasResolution: Boolean(latestResolution),
      hasProposedKb:
        ((latestResolution as unknown as {
          knowledge_articles?: unknown[];
        })?.knowledge_articles?.length ?? 0) > 0,
      submittedResolution,
      attachments,
      internalNotes,
      auditTrail,
      departmentsInvolved,
      myInvolvementType,
      isPrimaryOwner,
      myDepartmentStatus: myDept?.status || "ASSIGNED",
      isMyDepartmentCompleted: myDept?.status === "COMPLETED",
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in GET /api/staff/grievances/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch grievance details" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await resolveStaffAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { staffId, isAdmin } = auth;
  const { id } = await params;

  try {
    const grievanceId = BigInt(id);
    const body = (await request.json()) as {
      action?:
        | "START_INVESTIGATION"
        | "ADD_NOTE"
        | "REQUEST_ADDITIONAL_INFO"
        | "RESUME_INVESTIGATION";
      note?: string;
      subject?: string;
      message?: string;
      channels?: ("IN_APP" | "EMAIL")[];
      requestedDocs?: string[];
    };

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
          where: {
            assignment_status: "ASSIGNED",
            ...(isAdmin ? {} : { staff_id: staffId }),
          },
        },
      },
    });

    if (!grievance) {
      return NextResponse.json(
        { success: false, message: "Grievance not found" },
        { status: 404 },
      );
    }

    if (
      !isAdmin &&
      (!grievance.assignments || grievance.assignments.length === 0)
    ) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Grievance not assigned to you" },
        { status: 403 },
      );
    }

    if (body.action === "START_INVESTIGATION") {
      if (grievance.status === "ASSIGNED" || grievance.status === "REOPENED") {
        await prisma.$transaction(async (tx) => {
          await tx.grievances.update({
            where: { grievance_id: grievanceId },
            data: { status: "IN_PROGRESS" },
          });

          await tx.grievance_status_history.create({
            data: {
              grievance_id: grievanceId,
              old_status: grievance.status,
              new_status: "IN_PROGRESS",
              changed_by: staffId,
              remarks: "Investigation initiated by assigned staff",
            },
          });

          await tx.grievance_departments.updateMany({
            where: {
              grievance_id: grievanceId,
              status: "ASSIGNED",
            },
            data: {
              status: "IN_PROGRESS",
            },
          });

          await tx.audit_logs.create({
            data: {
              grievance_id: grievanceId,
              user_id: staffId,
              action: "STATUS_CHANGED",
              entity_type: "GRIEVANCE",
              entity_id: grievanceId,
              new_value: {
                details: `Investigation initiated on grievance ${grievance.grievance_number}`,
              },
            },
          });
        });
      }
    } else if (body.action === "REQUEST_ADDITIONAL_INFO") {
      const staffUser = auth.user;
      const rawStaffName =
        `${staffUser.first_name} ${staffUser.last_name || ""}`.trim();
      const authorDisplay = `Staff — ${rawStaffName}`;
      const subject =
        body.subject?.trim() ||
        `Additional information requested for ${grievance.grievance_number}`;
      const message =
        body.message?.trim() ||
        "Additional information or documentation is required to proceed with investigation.";
      const channels =
        body.channels && body.channels.length > 0
          ? body.channels
          : ["IN_APP", "EMAIL"];
      const requestedDocs = body.requestedDocs || [];

      await prisma.$transaction(async (tx) => {
        // 1. Change status from active (IN_PROGRESS) to WAITING_ON_USER
        await tx.grievances.update({
          where: { grievance_id: grievanceId },
          data: { status: "WAITING_ON_USER" },
        });

        // 2. Add to status history
        await tx.grievance_status_history.create({
          data: {
            grievance_id: grievanceId,
            old_status: grievance.status,
            new_status: "WAITING_ON_USER",
            changed_by: staffId,
            remarks: `Staff requested additional information via ${channels.join(", ")}. Subject: ${subject}`,
          },
        });

        // 3. Add to audit trail
        await tx.audit_logs.create({
          data: {
            grievance_id: grievanceId,
            user_id: staffId,
            action: "ADDITIONAL_INFO_REQUESTED",
            entity_type: "GRIEVANCE",
            entity_id: grievanceId,
            new_value: {
              subject,
              message,
              channels,
              requestedDocs,
              author: authorDisplay,
              role: "Staff",
              details: `Staff requested additional information/documents: ${subject}. Delivery: ${channels.join(", ")}.`,
              note: `[Information Requested from Complainant]\nSubject: ${subject}\nDetails: ${message}${requestedDocs.length > 0 ? `\nRequested Proofs: ${requestedDocs.join(", ")}` : ""}`,
            },
          },
        });
      });

      // 4. Send Notifications to Complainant
      const complainant = grievance.users;
      const complainantName = complainant
        ? `${complainant.first_name} ${complainant.last_name || ""}`.trim()
        : "Complainant";

      const docsSummary =
        requestedDocs.length > 0
          ? ` Required Documents: ${requestedDocs.join(", ")}.`
          : "";

      if (channels.includes("IN_APP")) {
        await NotificationService.send({
          userId: grievance.submitted_by,
          grievanceId,
          type: "ADDITIONAL_INFO_REQUESTED",
          channel: "IN_APP",
          title: `Action Required: Additional Information Requested (${grievance.grievance_number})`,
          message: `${message}${docsSummary}`,
        });
      }

      if (channels.includes("EMAIL")) {
        await NotificationService.send({
          userId: grievance.submitted_by,
          grievanceId,
          type: "ADDITIONAL_INFO_REQUESTED",
          channel: "EMAIL",
          title: `GRS Action Required: Additional Details for ${grievance.grievance_number}`,
          message: `Dear ${complainantName},\n\nThe investigating officer for your grievance #${grievance.grievance_number} (${grievance.title}) has requested additional information:\n\n${message}${docsSummary}\n\nPlease visit your GRS portal or track page to submit the required details and upload documents.\n\nRegards,\nGRS Resolution Desk`,
        });
      }

      // 5. Notify the Staff member to confirm their own request
      await NotificationService.send({
        userId: staffId,
        grievanceId,
        type: "SYSTEM",
        channel: "IN_APP",
        title: `Information Requested (${grievance.grievance_number})`,
        message: `You successfully requested additional information from the complainant. The grievance is now Waiting on User.`,
      });

      return NextResponse.json({
        success: true,
        message:
          "Additional information requested successfully. Status set to Waiting on User.",
        status: "WAITING_ON_USER",
      });
    } else if (body.action === "RESUME_INVESTIGATION") {
      await prisma.$transaction(async (tx) => {
        await tx.grievances.update({
          where: { grievance_id: grievanceId },
          data: { status: "IN_PROGRESS" },
        });

        await tx.grievance_status_history.create({
          data: {
            grievance_id: grievanceId,
            old_status: grievance.status,
            new_status: "IN_PROGRESS",
            changed_by: staffId,
            remarks: "Investigation resumed to In Progress by staff",
          },
        });

        await tx.audit_logs.create({
          data: {
            grievance_id: grievanceId,
            user_id: staffId,
            action: "STATUS_CHANGED",
            entity_type: "GRIEVANCE",
            entity_id: grievanceId,
            new_value: {
              details: `Investigation resumed to In Progress by staff on grievance ${grievance.grievance_number}`,
            },
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Investigation resumed to In Progress",
        status: "IN_PROGRESS",
      });
    } else if (body.action === "ADD_NOTE" && body.note?.trim()) {
      const staffUser = auth.user;
      const rawStaffName =
        `${staffUser.first_name} ${staffUser.last_name || ""}`.trim();
      const authorDisplay = `Staff — ${rawStaffName}`;
      const noteContent = body.note.trim();

      const createdAudit = await prisma.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          user_id: staffId,
          action: "INVESTIGATION_NOTE_ADDED",
          entity_type: "GRIEVANCE",
          entity_id: grievanceId,
          new_value: {
            note: noteContent,
            author: authorDisplay,
            role: "Staff",
            details: noteContent,
          },
        },
      });

      // Notify all involved Department Heads and collaborating assigned staff
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
        if (d.assignments?.staff_id && d.assignments.staff_id !== staffId) {
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
          if (dh.user_id !== staffId) {
            userIdsToNotify.add(dh.user_id);
          }
        }
      }

      for (const uId of userIdsToNotify) {
        await NotificationService.send({
          userId: uId,
          grievanceId,
          type: "HEAD_INTERNAL_NOTE",
          title: "Cross-Department Collaboration Note",
          message: `${authorDisplay} posted a collaboration update on grievance ${grievance.grievance_number}: "${noteContent.length > 60 ? noteContent.substring(0, 60) + '...' : noteContent}"`,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Internal investigation note logged successfully",
        note: {
          id: createdAudit.audit_log_id.toString(),
          author: authorDisplay,
          role: "Staff",
          timestamp: formatRelativeTime(createdAudit.created_at),
          note: noteContent,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Grievance record updated successfully",
    });
  } catch (error) {
    console.error("Error in PATCH /api/staff/grievances/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update grievance record" },
      { status: 500 },
    );
  }
}
