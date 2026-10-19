import { NextResponse } from "next/server";
import { filterAuthorizedAttachments } from "@/lib/attachments/access-control";
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
  SupportingDepartmentFinding,
} from "@/types/staff";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await resolveStaffAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { user, staffId, departmentId, isAdmin } = auth;
  const { id } = await params;

  try {
    const grievanceId = BigInt(id);

    // Verify assignment to this staff member
    const grievance = await prisma.grievances.findUnique({
      where: { grievance_id: grievanceId },
      include: {
        categories: true,
        subcategories: true,
        grievance_departments: {
          include: {
            departments: true,
          },
        },
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
                department_id: true,
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

    const deptContext = (grievance.grievance_departments || []).map((gd) => ({
      grievance_department_id: gd.grievance_department_id,
      department_id: gd.department_id,
      department_name: gd.departments?.department_name || "",
      involvement_type: gd.involvement_type,
      status: gd.status,
    }));
    const assignmentContext = (grievance.assignments || []).map((a) => ({
      staff_id: a.staff_id,
      grievance_department_id: a.grievance_department_id,
      assignment_status: a.assignment_status,
    }));
    const grievanceContext = {
      grievance_id: grievance.grievance_id,
      submitted_by: grievance.submitted_by,
      status: grievance.status,
    };

    if (latestResolution) {
      const authorizedResAttachments = filterAuthorizedAttachments(
        user,
        latestResolution.attachments || [],
        grievanceContext,
        deptContext,
        assignmentContext,
      );

      submittedResolution = {
        id: latestResolution.resolution_id.toString(),
        submittedByUserId: latestResolution.submitted_by.toString(),
        submittedByRole: latestResolution.users?.roles?.role_name || undefined,
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
        attachments: authorizedResAttachments.map((att) => ({
          id: att.attachment_id.toString(),
          name: att.file_name,
          size: att.file_size
            ? `${Math.round(Number(att.file_size) / 1024)} KB`
            : "Document",
          type: att.file_type,
          path: att.file_path,
          downloadUrl: `/api/attachments/${att.attachment_id}/download`,
          uploadedAt: att.uploaded_at.toISOString(),
        })),
      };
    }

    const authorizedDossierAttachments = filterAuthorizedAttachments(
      user,
      (grievance.attachments || []).filter((att) => !att.resolution_id),
      {
        ...grievanceContext,
        title: grievance.title,
        description: grievance.description,
        categoryName: grievance.categories?.category_name,
        subcategoryName: grievance.subcategories?.subcategory_name,
      },
      deptContext,
      assignmentContext,
    );

    const attachments = authorizedDossierAttachments.map((att) => ({
      id: att.attachment_id.toString(),
      name: att.file_name,
      size: att.file_size
        ? `${Math.round(Number(att.file_size) / 1024)} KB`
        : "Document",
      type: att.file_type,
      path: att.file_path,
      downloadUrl: `/api/attachments/${att.attachment_id}/download`,
      uploadedAt: formatRelativeTime(grievance.created_at),
    }));

    // Extract internal and collaboration notes from audit logs (chronological: oldest to newest)
    const formatStaffNoteItem = (l: (typeof grievance.audit_logs)[0]) => {
      const user = l.users;
      const userRole = user?.roles?.role_name;
      const val = l.new_value as {
        note?: string;
        details?: string;
        author?: string;
        role?: string;
        parentId?: string;
        replyToAuthor?: string;
        scope?: string;
        department_id?: string | number;
        departmentName?: string;
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
        parentId: val?.parentId || undefined,
        replyToAuthor: val?.replyToAuthor || undefined,
        createdAt: l.created_at.toISOString(),
      };
    };

    const internalNotes: StaffInternalNote[] = (grievance.audit_logs || [])
      .filter((l) => {
        const val = l.new_value as {
          scope?: string;
          department_id?: string | number;
          isFindings?: boolean;
          note?: string;
        } | null;
        const isCollabOrFinding =
          l.action === "COLLABORATION_NOTE_ADDED" ||
          l.action === "SUPPORTING_FINDINGS_SUBMITTED" ||
          val?.scope === "COLLABORATION" ||
          val?.isFindings === true ||
          String(val?.note || "").includes("[Department Findings");
        if (isCollabOrFinding) return false;

        const isInternalAction =
          l.action === "HOD_DIRECTIVE_NOTE" ||
          l.action === "INVESTIGATION_NOTE_ADDED" ||
          l.action === "INTERNAL_NOTE_ADDED" ||
          l.action === "HEAD_DIRECTIVE_ISSUED";
        if (!isInternalAction) return false;

        if (!isAdmin && departmentId) {
          const authorDeptId =
            l.users?.department_id?.toString() ||
            (val?.department_id ? String(val.department_id) : null);
          if (authorDeptId && authorDeptId !== departmentId.toString()) {
            return false;
          }
        }
        return true;
      })
      .slice()
      .reverse()
      .map(formatStaffNoteItem);

    const collaborationNotes: StaffInternalNote[] = (grievance.audit_logs || [])
      .filter((l) => {
        const val = l.new_value as {
          scope?: string;
          isFindings?: boolean;
          note?: string;
        } | null;
        const isFinding =
          l.action === "SUPPORTING_FINDINGS_SUBMITTED" ||
          val?.isFindings === true ||
          String(val?.note || "").includes("[Department Findings");
        if (isFinding) return false;

        return (
          l.action === "COLLABORATION_NOTE_ADDED" ||
          val?.scope === "COLLABORATION"
        );
      })
      .slice()
      .reverse()
      .map(formatStaffNoteItem);

    const supportingFindings: SupportingDepartmentFinding[] = (
      grievance.audit_logs || []
    )
      .filter((l) => {
        const val = l.new_value as {
          isFindings?: boolean;
          note?: string;
        } | null;
        return (
          l.action === "SUPPORTING_FINDINGS_SUBMITTED" ||
          val?.isFindings === true ||
          String(val?.note || "").includes("[Department Findings")
        );
      })
      .slice()
      .reverse()
      .map((l) => {
        const val = l.new_value as Record<string, unknown> | null;
        const u = l.users;
        const authorName = u
          ? `${u.first_name} ${u.last_name || ""}`.trim()
          : (val?.submittedBy as string) || "Staff Member";
        const deptName =
          (val?.department as string) ||
          (val?.departmentName as string) ||
          "Supporting Department";

        let findings = (val?.findings as string) || "";
        let actionTaken = (val?.actionTaken as string) || "";
        let notes = (val?.notes as string) || "";

        if (!findings && typeof val?.note === "string") {
          const noteStr = val.note;
          const findingsMatch = noteStr.match(
            /Findings:\s*([\s\S]*?)(?=\n\nAction Taken:|$)/,
          );
          const actionMatch = noteStr.match(
            /Action Taken:\s*([\s\S]*?)(?=\n\nNotes:|$)/,
          );
          const notesMatch = noteStr.match(/Notes:\s*([\s\S]*?)$/);
          if (findingsMatch) findings = findingsMatch[1].trim();
          if (actionMatch) actionTaken = actionMatch[1].trim();
          if (notesMatch) notes = notesMatch[1].trim();
          if (!findings) findings = noteStr;
        }

        return {
          id: l.audit_log_id.toString(),
          departmentName: deptName,
          submittedBy: (val?.submittedBy as string) || authorName,
          findings,
          actionTaken: actionTaken || undefined,
          notes: notes || undefined,
          createdAt: l.created_at.toISOString(),
          timestamp: formatRelativeTime(l.created_at),
        };
      });

    const auditTrail: StaffAuditItem[] = (grievance.audit_logs || [])
      .filter((log) => {
        let logVal: {
          details?: string;
          note?: string;
          author?: string;
          scope?: string;
          department_id?: string | number;
        } | null = null;
        if (typeof log.new_value === "string") {
          try {
            logVal = JSON.parse(log.new_value);
          } catch {
            logVal = { note: log.new_value };
          }
        } else if (log.new_value && typeof log.new_value === "object") {
          logVal = log.new_value as unknown as typeof logVal;
        }

        const isInternalAction =
          log.action === "HOD_DIRECTIVE_NOTE" ||
          log.action === "INVESTIGATION_NOTE_ADDED" ||
          log.action === "INTERNAL_NOTE_ADDED" ||
          log.action === "HEAD_DIRECTIVE_ISSUED" ||
          logVal?.scope === "INTERNAL";

        const isCollab =
          log.action === "COLLABORATION_NOTE_ADDED" ||
          logVal?.scope === "COLLABORATION";

        if (isCollab) {
          return true;
        }

        if (isInternalAction && !isAdmin && departmentId) {
          const authorDeptId =
            log.users?.department_id?.toString() ||
            (logVal?.department_id ? String(logVal.department_id) : null);
          if (authorDeptId && authorDeptId !== departmentId.toString()) {
            return false;
          }
        }
        return true;
      })
      .map((log) => {
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
      });

    // Fetch involved departments dynamically directly from grievance_departments
    const rawDepartments = await prisma.grievance_departments.findMany({
      where: { grievance_id: grievanceId },
      include: {
        departments: true,
      },
      orderBy: { involvement_type: "asc" },
    });

    // Fetch assignments directly from assignments table so staff is retained even after completion
    const allDeptAssignments = await prisma.assignments.findMany({
      where: {
        grievance_id: grievanceId,
        assignment_status: { in: ["ASSIGNED", "COMPLETED"] },
      },
      include: {
        users_assignments_staff_idTousers: {
          select: { first_name: true, last_name: true },
        },
      },
      orderBy: { assigned_at: "desc" },
    });

    const departmentsInvolved = rawDepartments.map((rawD) => {
      const d = rawD;
      const deptAssignment = allDeptAssignments.find(
        (a) => a.grievance_department_id === d.grievance_department_id,
      );
      let deptStatus = d.status;
      if (deptAssignment && deptAssignment.assignment_status === "ASSIGNED") {
        if (deptStatus === "PENDING_ASSIGNMENT") {
          deptStatus = "ASSIGNED";
        }
      } else if (!deptAssignment && deptStatus === "ASSIGNED") {
        deptStatus = "PENDING_ASSIGNMENT";
      }

      const staffUser = deptAssignment?.users_assignments_staff_idTousers;
      const assignedStaff =
        deptStatus === "PENDING_ASSIGNMENT" && !deptAssignment
          ? null
          : staffUser &&
              (deptAssignment?.assignment_status === "ASSIGNED" ||
                deptAssignment?.assignment_status === "COMPLETED")
            ? `${staffUser.first_name} ${staffUser.last_name || ""}`.trim()
            : null;

      const isMyAssignment = deptAssignment?.staff_id === staffId;

      return {
        id: d.grievance_department_id.toString(),
        departmentName: d.departments?.department_name || "Unknown Department",
        involvementType: d.involvement_type as
          | "PRIMARY"
          | "SUPPORTING"
          | "EQUAL",
        status: deptStatus,
        assignedStaff,
        isMyAssignment,
      };
    });

    const myDept = departmentsInvolved.find((d) => d.isMyAssignment);
    const myInvolvementType =
      myDept?.involvementType || (isAdmin ? "PRIMARY" : "PRIMARY");
    const isPrimaryOwner =
      myInvolvementType === "PRIMARY" ||
      myInvolvementType === "EQUAL" ||
      isAdmin;

    const isMyDeptCompleted =
      myDept?.status === "COMPLETED" ||
      currentAssignment?.assignment_status === "COMPLETED";

    const activeDept = departmentsInvolved.find(
      (d) =>
        d.status === "IN_PROGRESS" ||
        d.status === "ASSIGNED" ||
        d.status === "PENDING_ASSIGNMENT",
    );
    const activeDepartmentName = activeDept?.departmentName;

    const effectiveStatus = (
      grievance.status === "CLOSED"
        ? "CLOSED"
        : grievance.status === "RESOLVED"
          ? "RESOLVED"
          : isMyDeptCompleted
            ? "COMPLETED"
            : myDept?.status === "ASSIGNED"
              ? "ASSIGNED"
              : myDept?.status === "IN_PROGRESS"
                ? "IN_PROGRESS"
                : grievance.status
    ) as StaffGrievanceItem["status"];

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
      status: effectiveStatus,
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
        ((
          latestResolution as unknown as {
            knowledge_articles?: unknown[];
          }
        )?.knowledge_articles?.length ?? 0) > 0,
      submittedResolution,
      attachments,
      internalNotes,
      collaborationNotes,
      supportingFindings,
      auditTrail,
      departmentsInvolved,
      myInvolvementType,
      isPrimaryOwner,
      myDepartmentStatus: myDept?.status || "ASSIGNED",
      isMyDepartmentCompleted: isMyDeptCompleted,
      overallStatus: grievance.status,
      activeDepartmentName,
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
      parentId?: string;
      replyToAuthor?: string;
      scope?: "INTERNAL" | "COLLABORATION";
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
          include: {
            grievance_departments: true,
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

    const activeAssignment = grievance.assignments?.[0];
    if (activeAssignment?.grievance_departments?.status === "BLOCKED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: Your department is currently BLOCKED waiting for prerequisite departments to complete before investigation can proceed.",
        },
        { status: 403 },
      );
    }

    if (body.action === "START_INVESTIGATION") {
      const canStart =
        grievance.status === "ASSIGNED" ||
        grievance.status === "REOPENED" ||
        grievance.status === "IN_PROGRESS" ||
        activeAssignment?.grievance_departments?.status === "ASSIGNED" ||
        activeAssignment?.assignment_status === "ASSIGNED";

      if (canStart) {
        await prisma.$transaction(async (tx) => {
          if (grievance.status !== "IN_PROGRESS") {
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
          }

          if (activeAssignment?.grievance_department_id) {
            await tx.grievance_departments.update({
              where: {
                grievance_department_id:
                  activeAssignment.grievance_department_id,
              },
              data: {
                status: "IN_PROGRESS",
              },
            });
          }

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
      if (grievance.status === "CLOSED") {
        return NextResponse.json(
          {
            success: false,
            message:
              "This grievance is closed. Internal notes and collaboration messages cannot be added to closed cases.",
          },
          { status: 400 },
        );
      }
      if (grievance.status === "ASSIGNED") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Investigation has not been started yet. You must click 'Start Investigation' before adding internal notes.",
          },
          { status: 400 },
        );
      }

      const staffUser = auth.user;
      const rawStaffName =
        `${staffUser.first_name} ${staffUser.last_name || ""}`.trim();
      const scope =
        body.scope === "COLLABORATION" ? "COLLABORATION" : "INTERNAL";

      const staffDept = staffUser.department_id
        ? await prisma.departments.findUnique({
            where: { department_id: staffUser.department_id },
            select: { department_name: true },
          })
        : null;
      const deptName = staffDept?.department_name || "Department";

      const authorDisplay =
        scope === "COLLABORATION"
          ? `Staff — ${rawStaffName} (${deptName})`
          : `Staff — ${rawStaffName}`;
      const noteContent = body.note.trim();

      const createdAudit = await prisma.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          user_id: staffId,
          action:
            scope === "COLLABORATION"
              ? "COLLABORATION_NOTE_ADDED"
              : "INVESTIGATION_NOTE_ADDED",
          entity_type: "GRIEVANCE",
          entity_id: grievanceId,
          new_value: {
            note: noteContent,
            author: authorDisplay,
            role: "Staff",
            department_id: staffUser.department_id
              ? staffUser.department_id.toString()
              : null,
            departmentName: deptName,
            scope,
            details: noteContent,
            parentId: body.parentId?.trim() || null,
            replyToAuthor: body.replyToAuthor?.trim() || null,
          },
        },
      });

      if (scope === "COLLABORATION") {
        // Broadcast notification to HODs and assigned staff of ALL collaborating departments
        const involvedDepts = await prisma.grievance_departments.findMany({
          where: { grievance_id: grievanceId },
          include: {
            assignments: {
              include: { users_assignments_staff_idTousers: true },
            },
          },
        });

        for (const gd of involvedDepts) {
          // Notify HOD
          const hods = await prisma.users.findMany({
            where: {
              department_id: gd.department_id,
              roles: { role_name: "DEPARTMENT_HEAD" },
              status: "ACTIVE",
            },
          });
          for (const hod of hods) {
            if (hod.user_id !== staffId) {
              await NotificationService.send({
                userId: hod.user_id,
                grievanceId,
                type: "HEAD_INTERNAL_NOTE",
                title: "Cross-Department Collaboration Note",
                message: `${authorDisplay} added a note on shared grievance ${grievance.grievance_number}: "${noteContent.length > 60 ? `${noteContent.substring(0, 60)}...` : noteContent}"`,
              });
            }
          }

          // Notify assigned staff
          if (gd.assignments && gd.assignments.staff_id !== staffId) {
            await NotificationService.send({
              userId: gd.assignments.staff_id,
              grievanceId,
              type: "HEAD_INTERNAL_NOTE",
              title: "Cross-Department Collaboration Note",
              message: `${authorDisplay} posted on shared grievance ${grievance.grievance_number}: "${noteContent.length > 60 ? `${noteContent.substring(0, 60)}...` : noteContent}"`,
            });
          }
        }
      } else {
        // Notify strictly the Department Head of this staff member's department
        if (staffUser.department_id) {
          const deptHeads = await prisma.users.findMany({
            where: {
              department_id: staffUser.department_id,
              roles: { role_name: "DEPARTMENT_HEAD" },
              status: "ACTIVE",
            },
          });
          for (const dh of deptHeads) {
            if (dh.user_id !== staffId) {
              await NotificationService.send({
                userId: dh.user_id,
                grievanceId,
                type: "HEAD_INTERNAL_NOTE",
                title: body.parentId
                  ? "Internal Discussion Reply"
                  : "Internal Discussion Note",
                message: `${authorDisplay} posted an internal ${body.parentId ? "reply" : "note"} on grievance ${grievance.grievance_number}: "${noteContent.length > 60 ? `${noteContent.substring(0, 60)}...` : noteContent}"`,
              });
            }
          }
        }
      }

      // Confirm to the staff member who logged the note
      await NotificationService.send({
        userId: staffId,
        grievanceId,
        type: "HEAD_INTERNAL_NOTE",
        title:
          scope === "COLLABORATION"
            ? "Collaboration Note Logged"
            : "Internal Note Logged",
        message: `You added a ${scope === "COLLABORATION" ? "collaboration note" : "internal investigation note"} to grievance ${grievance.grievance_number}.`,
      });

      return NextResponse.json({
        success: true,
        message:
          scope === "COLLABORATION"
            ? "Collaboration note logged successfully"
            : "Internal investigation note logged successfully",
        note: {
          id: createdAudit.audit_log_id.toString(),
          author: authorDisplay,
          role: "Staff",
          timestamp: formatRelativeTime(createdAudit.created_at),
          note: noteContent,
          parentId: body.parentId?.trim() || undefined,
          replyToAuthor: body.replyToAuthor?.trim() || undefined,
          createdAt: createdAudit.created_at.toISOString(),
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
