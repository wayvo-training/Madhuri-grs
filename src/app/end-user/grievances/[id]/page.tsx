import { notFound } from "next/navigation";
import {
  type CaseHubGrievance,
  EndUserCaseHub,
} from "@/components/end-user/case-hub/EndUserCaseHub";
import type { EndUserResolutionData } from "@/components/end-user/resolution-card";
import { canEndUserSubmitCommunication } from "@/lib/communication/service";
import { evaluateReopenPolicy } from "@/lib/engines/reopen-engine";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getPrimaryDepartment } from "@/lib/utils/grievance-departments";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GrievanceDetailsPage({ params }: PageProps) {
  const user = await requirePageRole("END_USER");
  const { id } = await params;

  const trimmed = id?.trim() || "";
  if (!trimmed) return notFound();
  const isNumeric = /^\d+$/.test(trimmed);

  const grievance = await prisma.grievances.findFirst({
    where: {
      OR: [
        { grievance_number: { equals: trimmed, mode: "insensitive" } },
        ...(isNumeric ? [{ grievance_id: BigInt(trimmed) }] : []),
      ],
      submitted_by: user.user_id, // Ensure user can only see their own
    },
    include: {
      categories: true,
      subcategories: true,
      grievance_feedback: true,
      attachments: {
        include: {
          users: {
            select: {
              first_name: true,
              last_name: true,
              roles: { select: { role_name: true } },
            },
          },
          grievance_departments: {
            include: {
              departments: { select: { department_name: true } },
            },
          },
        },
        orderBy: { uploaded_at: "asc" },
      },
      grievance_departments: {
        include: {
          departments: true,
          assignments: {
            include: {
              users_assignments_staff_idTousers: {
                select: {
                  first_name: true,
                  last_name: true,
                  roles: { select: { role_name: true } },
                },
              },
            },
          },
        },
      },
      resolutions: {
        include: {
          attachments: true,
          users: {
            select: {
              first_name: true,
              last_name: true,
              departments: {
                select: { department_name: true },
              },
            },
          },
        },
        orderBy: { submitted_at: "desc" },
        take: 1,
      },
      grievance_status_history: {
        orderBy: { changed_at: "asc" },
        include: {
          users: {
            select: {
              first_name: true,
              last_name: true,
              roles: { select: { role_name: true } },
            },
          },
        },
      },
      audit_logs: {
        where: {
          action: {
            in: [
              "ADDITIONAL_INFO_REQUESTED",
              "USER_INFO_SUBMITTED",
              "USER_ADDITIONAL_INFO_PROVIDED",
              "SUPPORTING_FINDINGS_SUBMITTED",
              "ASSIGNED_TO_STAFF",
              "REWORK_REQUESTED",
              "REWORK_APPROVED",
              "REWORK_REJECTED",
              "REWORK_REJECTED_FINAL",
              "REOPEN_REQUESTED",
              "REOPEN_APPROVED",
              "REOPEN_REJECTED",
              "REOPEN_REJECTED_FINAL",
              "RESOLUTION_SUBMITTED",
              "ACCEPT_RESOLUTION",
            ],
          },
        },
        orderBy: { created_at: "asc" },
      },
    },
  });

  if (!grievance) return notFound();

  const eligibleStatuses = [
    "PENDING",
    "SUBMITTED",
    "ROUTED",
    "AWAITING_ASSIGNMENT",
    "ASSIGNED",
    "IN_PROGRESS",
    "AWAITING_INFORMATION",
    "REWORK",
    "REOPENED",
  ];
  const canProvideAdditionalInfo = eligibleStatuses.includes(grievance.status);
  const submissionCheck = await canEndUserSubmitCommunication(
    grievance.grievance_id,
  );

  const isCaseClosedOrResolved =
    grievance.status === "CLOSED" || grievance.status === "RESOLVED";

  const allDepts = (grievance.grievance_departments || [])
    .map((gd) => {
      // Active assigned staff must have assignment_status === 'ASSIGNED'.
      // If the grievance is currently closed or resolved and there is no active 'ASSIGNED' staff,
      // fallback to latest 'COMPLETED' assignment to show who resolved it.
      // But if the case is open (e.g. REOPENED, REWORK, IN_PROGRESS before assignment),
      // we must NOT pick up a stale COMPLETED assignment from a previous cycle.
      const currentlyAssigned = (gd.assignments || []).filter(
        (a) => a.assignment_status === "ASSIGNED",
      );
      const activeAssignments =
        currentlyAssigned.length > 0
          ? currentlyAssigned
          : isCaseClosedOrResolved
            ? (gd.assignments || []).filter(
                (a) => a.assignment_status === "COMPLETED",
              )
            : [];
      const primaryAssignment =
        activeAssignments.find((a) => a.assignment_role === "PRIMARY") ||
        activeAssignments[0];
      const staffUser = primaryAssignment?.users_assignments_staff_idTousers;
      const staffName = staffUser
        ? `${staffUser.first_name} ${staffUser.last_name || ""}`.trim()
        : null;

      return {
        id: Number(gd.department_id),
        name: gd.departments?.department_name || "Department",
        involvementType: gd.involvement_type,
        status: gd.status,
        assignedStaffName: staffName,
        assignedStaffRole: staffUser?.roles?.role_name || null,
        completedAt: gd.completed_at ? gd.completed_at.toISOString() : null,
      };
    })
    .filter((d) => Boolean(d.name));

  const primaryGDept = getPrimaryDepartment(grievance);
  const primaryDept =
    primaryGDept?.departments?.department_name || allDepts[0]?.name || "";

  const latestResolution = grievance.resolutions?.[0];

  const resUser = latestResolution?.users;
  const resUserName = resUser
    ? `${resUser.first_name} ${resUser.last_name || ""}`.trim()
    : undefined;
  const resDeptName = resUser?.departments?.department_name || undefined;

  const resolutionData: EndUserResolutionData | null = latestResolution
    ? {
        id: latestResolution.resolution_id.toString(),
        outcome: latestResolution.outcome,
        actionTaken: latestResolution.action_taken,
        findings: latestResolution.findings,
        problemSummary: latestResolution.problem_summary,
        submittedAt: latestResolution.submitted_at.toISOString(),
        submittedByName: resUserName,
        submittedByDept: resDeptName,
        attachments: (latestResolution.attachments || []).map((att) => ({
          id: att.attachment_id.toString(),
          name: att.file_name,
          path: `/api/attachments/${att.attachment_id}/download`,
          size: att.file_size
            ? `${Math.round(Number(att.file_size) / 1024)} KB`
            : undefined,
          type: att.file_type,
        })),
      }
    : isCaseClosedOrResolved
      ? {
          id: `auto-${grievance.grievance_id}`,
          outcome: `Grievance inquiry completed and officially concluded by ${primaryDept || "the responsible department"}.`,
          actionTaken:
            "Departmental review completed and all required administrative actions enacted.",
          findings:
            "The reported grievance was formally inspected and resolved in accordance with standard departmental procedures.",
          problemSummary: grievance.title,
          submittedAt: grievance.updated_at.toISOString(),
          attachments: [],
        }
      : null;

  const supportingFindings = (grievance.audit_logs || [])
    .filter((l) => {
      if (l.action !== "SUPPORTING_FINDINGS_SUBMITTED") return false;
      const rawVal = l.new_value;
      const val =
        typeof rawVal === "string"
          ? (JSON.parse(rawVal) as Record<string, unknown>)
          : (rawVal as Record<string, unknown> | null);
      if (val?.isResolution === true) return false;
      return true;
    })
    .map((l) => {
      const rawVal = l.new_value;
      const val =
        typeof rawVal === "string"
          ? (JSON.parse(rawVal) as Record<string, unknown>)
          : (rawVal as Record<string, unknown> | null);

      const rawAttachments = Array.isArray(val?.attachments)
        ? (val.attachments as Array<{
            id?: string;
            name?: string;
            fileName?: string;
            size?: string;
            type?: string;
            path?: string;
            filePath?: string;
            downloadUrl?: string;
          }>)
        : [];

      const attachments = rawAttachments.map((att, idx) => {
        const id = att.id || `${l.audit_log_id}-att-${idx}`;
        const name = att.name || att.fileName || "Finding-Attachment";
        const downloadUrl =
          att.downloadUrl ||
          (att.id ? `/api/attachments/${att.id}/download` : undefined);
        return {
          id,
          name,
          size: att.size,
          type: att.type,
          path: att.path || att.filePath || "",
          downloadUrl,
        };
      });

      return {
        id: l.audit_log_id.toString(),
        department: (val?.department as string) || "Supporting Department",
        submittedBy: val?.submittedBy as string | undefined,
        findings: val?.findings as string | undefined,
        notes: val?.notes as string | undefined,
        attachments,
        submittedAt: l.created_at.toISOString(),
      };
    });

  const rawAttachments = grievance.attachments || [];

  // 1. Documents shared by the End User (Initial submission proofs & additional clarification documents)
  const endUserAttachments = rawAttachments
    .filter(
      (att) =>
        !att.resolution_id &&
        !att.grievance_department_id &&
        BigInt(att.uploaded_by) === BigInt(grievance.submitted_by),
    )
    .map((att) => ({
      id: att.attachment_id.toString(),
      name: att.file_name,
      path: `/api/attachments/${att.attachment_id}/download`,
      size: att.file_size
        ? `${Math.round(Number(att.file_size) / 1024)} KB`
        : undefined,
      type: att.file_type,
      uploadedAt: att.uploaded_at.toISOString(),
      uploadedBy: "You (Employee)",
      sourceTag: "Employee Submission",
    }));

  // 2. Documents shared by Investigation Staff (Findings, department evidence, and resolution files)
  const staffAttachmentsMap = new Map<
    string,
    {
      id: string;
      name: string;
      path: string;
      size?: string;
      type?: string;
      uploadedAt?: string;
      uploadedBy?: string;
      sourceTag?: string;
    }
  >();

  rawAttachments
    .filter(
      (att) =>
        att.resolution_id ||
        att.grievance_department_id ||
        BigInt(att.uploaded_by) !== BigInt(grievance.submitted_by),
    )
    .forEach((att) => {
      const uploaderName = att.users
        ? `${att.users.first_name} ${att.users.last_name || ""}`.trim()
        : "Grievance Staff";
      const deptName = att.grievance_departments?.departments?.department_name;
      const sourceTag = att.resolution_id
        ? "Official Resolution Evidence"
        : deptName
          ? `${deptName} Findings`
          : "Grievance Staff Evidence";

      staffAttachmentsMap.set(att.attachment_id.toString(), {
        id: att.attachment_id.toString(),
        name: att.file_name,
        path: `/api/attachments/${att.attachment_id}/download`,
        size: att.file_size
          ? `${Math.round(Number(att.file_size) / 1024)} KB`
          : undefined,
        type: att.file_type,
        uploadedAt: att.uploaded_at.toISOString(),
        uploadedBy: deptName ? `${uploaderName} (${deptName})` : uploaderName,
        sourceTag,
      });
    });

  // Also include any resolution attachments from latestResolution
  (latestResolution?.attachments || []).forEach((att) => {
    const idStr = att.attachment_id.toString();
    if (!staffAttachmentsMap.has(idStr)) {
      staffAttachmentsMap.set(idStr, {
        id: idStr,
        name: att.file_name,
        path: `/api/attachments/${att.attachment_id}/download`,
        size: att.file_size
          ? `${Math.round(Number(att.file_size) / 1024)} KB`
          : undefined,
        type: att.file_type,
        uploadedAt: att.uploaded_at?.toISOString() || new Date().toISOString(),
        uploadedBy: "Grievance Staff",
        sourceTag: "Official Resolution Evidence",
      });
    }
  });

  const staffAttachments = Array.from(staffAttachmentsMap.values());

  // Audit logs are the primary, authoritative source for rejection events
  const auditRejectionLogs = (grievance.audit_logs || []).filter(
    (l) =>
      l.action === "REWORK_REJECTED" ||
      l.action === "REOPEN_REJECTED" ||
      l.action === "REWORK_REJECTED_FINAL" ||
      l.action === "REOPEN_REJECTED_FINAL",
  );

  const rejectionLog =
    auditRejectionLogs.length > 0
      ? auditRejectionLogs[auditRejectionLogs.length - 1]
      : undefined;

  const historyRejections = (grievance.grievance_status_history || []).filter(
    (h) =>
      h.remarks?.toLowerCase().includes("rejected rework") ||
      h.remarks?.toLowerCase().includes("rejected reopening") ||
      h.remarks?.toLowerCase().includes("rejected reopen"),
  );

  const rejectionHistory =
    historyRejections.length > 0
      ? historyRejections[historyRejections.length - 1]
      : undefined;

  // Accurately calculate rejectionCount: prioritize audit_logs, only falling back to status history if 0 audit logs exist (never sum them)
  const rejectionCount =
    auditRejectionLogs.length > 0
      ? auditRejectionLogs.length
      : historyRejections.length;

  let rejectionInfo: {
    type: "REWORK" | "REOPEN";
    reason: string;
    rejectedAt: string;
  } | null = null;

  if (rejectionLog) {
    const rawVal = rejectionLog.new_value;
    const val =
      typeof rawVal === "string"
        ? (JSON.parse(rawVal) as Record<string, unknown>)
        : (rawVal as Record<string, unknown> | null);
    const reason =
      (val?.rejectionReason as string) ||
      (val?.reason as string) ||
      (val?.details as string) ||
      rejectionHistory?.remarks ||
      "Request not approved by Department Head.";
    rejectionInfo = {
      type:
        rejectionLog.action === "REWORK_REJECTED" ||
        rejectionLog.action === "REWORK_REJECTED_FINAL"
          ? ("REWORK" as const)
          : ("REOPEN" as const),
      reason,
      rejectedAt: rejectionLog.created_at.toISOString(),
    };
  } else if (rejectionHistory) {
    rejectionInfo = {
      type: rejectionHistory.remarks?.toLowerCase().includes("rework")
        ? ("REWORK" as const)
        : ("REOPEN" as const),
      reason:
        rejectionHistory.remarks || "Request not approved by Department Head.",
      rejectedAt: rejectionHistory.changed_at.toISOString(),
    };
  }

  const reopenPolicy = await evaluateReopenPolicy({
    categoryId: grievance.category_id,
    subcategoryId: grievance.subcategory_id,
    priority: grievance.priority,
  });

  const reopenWindowDays = reopenPolicy.reopenWindowDays || 14;
  const maxReopenAttempts = reopenPolicy.maxReopenCount || 3;
  const maxRejections = reopenPolicy.maxRejectionCount || maxReopenAttempts;

  const serializedGrievance: CaseHubGrievance = {
    id: Number(grievance.grievance_id),
    grievanceNumber: grievance.grievance_number,
    title: grievance.title,
    description: grievance.description,
    status: grievance.status,
    priority: grievance.priority,
    createdAt: grievance.created_at.toISOString(),
    updatedAt: grievance.updated_at.toISOString(),
    closedAt: grievance.closed_at ? grievance.closed_at.toISOString() : null,
    closureReason: grievance.closure_reason || null,
    reopenCount: grievance.reopen_count,
    rejectionCount,
    maxReopenAttempts,
    reopenWindowDays,
    maxRejections,
    dueAt: grievance.due_at ? grievance.due_at.toISOString() : null,
    categoryName: grievance.categories?.category_name || "General",
    subcategoryName: grievance.subcategories?.subcategory_name || "General",
    departmentName: primaryDept,
    departments: allDepts,
    supportingFindings,
    attachments: endUserAttachments,
    staffAttachments,
    rejectionInfo,
    feedback: grievance.grievance_feedback
      ? {
          rating: grievance.grievance_feedback.rating,
          comments: grievance.grievance_feedback.comments,
          submittedAt: grievance.grievance_feedback.submitted_at.toISOString(),
        }
      : null,
    statusHistory: (grievance.grievance_status_history || []).map((h) => ({
      id: h.history_id.toString(),
      status: h.new_status,
      changedAt: h.changed_at.toISOString(),
      changedBy: h.users
        ? `${h.users.first_name} ${h.users.last_name || ""}`.trim()
        : undefined,
      roleName: h.users?.roles?.role_name,
      remarks: h.remarks || undefined,
    })),
  };

  const latestInquiryLog = grievance.audit_logs?.find(
    (l) => l.action === "ADDITIONAL_INFO_REQUESTED",
  );
  const inquiryVal = latestInquiryLog?.new_value as {
    requestedDocs?: string[];
  } | null;
  const requestedDocs = Array.isArray(inquiryVal?.requestedDocs)
    ? inquiryVal.requestedDocs
    : [];

  return (
    <EndUserCaseHub
      grievance={serializedGrievance}
      resolution={resolutionData}
      canProvideAdditionalInfo={canProvideAdditionalInfo}
      submissionCheck={submissionCheck}
      requestedDocs={requestedDocs}
    />
  );
}
