import { notFound } from "next/navigation";
import {
  type CaseHubGrievance,
  EndUserCaseHub,
} from "@/components/end-user/case-hub/EndUserCaseHub";
import type { EndUserResolutionData } from "@/components/end-user/resolution-card";
import { canEndUserSubmitCommunication } from "@/lib/communication/service";
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

  const grievanceId = parseInt(id, 10);
  if (Number.isNaN(grievanceId)) return notFound();

  const grievance = await prisma.grievances.findUnique({
    where: {
      grievance_id: grievanceId,
      submitted_by: user.user_id, // Ensure user can only see their own
    },
    include: {
      categories: true,
      subcategories: true,
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
                select: { first_name: true, last_name: true },
              },
            },
          },
        },
      },
      resolutions: {
        include: {
          attachments: true,
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
    "ASSIGNED",
    "IN_PROGRESS",
    "WAITING_ON_USER",
    "WAITING_ON_EMPLOYEE",
    "REOPENED",
  ];
  const canProvideAdditionalInfo = eligibleStatuses.includes(grievance.status);
  const submissionCheck = await canEndUserSubmitCommunication(
    grievance.grievance_id,
  );

  const allDepts = (grievance.grievance_departments || [])
    .map((gd) => {
      const staffUser = gd.assignments?.users_assignments_staff_idTousers;
      const staffName = staffUser
        ? `${staffUser.first_name} ${staffUser.last_name || ""}`.trim()
        : null;

      return {
        id: Number(gd.department_id),
        name: gd.departments?.department_name || "Department",
        involvementType: gd.involvement_type,
        status: gd.status,
        assignedStaffName: staffName,
        completedAt: gd.completed_at ? gd.completed_at.toISOString() : null,
      };
    })
    .filter((d) => Boolean(d.name));

  const primaryGDept = getPrimaryDepartment(grievance);
  const primaryDept =
    primaryGDept?.departments?.department_name || allDepts[0]?.name || "";

  const latestResolution = grievance.resolutions?.[0];
  const isCaseClosedOrResolved =
    grievance.status === "CLOSED" || grievance.status === "RESOLVED";

  const resolutionData: EndUserResolutionData | null = latestResolution
    ? {
        id: latestResolution.resolution_id.toString(),
        outcome: latestResolution.outcome,
        actionTaken: latestResolution.action_taken,
        findings: latestResolution.findings,
        problemSummary: latestResolution.problem_summary,
        submittedAt: latestResolution.submitted_at.toISOString(),
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
    .filter((l) => l.action === "SUPPORTING_FINDINGS_SUBMITTED")
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
      uploadedBy: "You (End User)",
      sourceTag: "End User Submission",
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
        : "Investigation Staff";
      const deptName = att.grievance_departments?.departments?.department_name;
      const sourceTag = att.resolution_id
        ? "Official Resolution Evidence"
        : deptName
          ? `${deptName} Findings`
          : "Investigation Staff Evidence";

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
        uploadedBy: "Resolution Officer",
        sourceTag: "Official Resolution Evidence",
      });
    }
  });

  const staffAttachments = Array.from(staffAttachmentsMap.values());

  const serializedGrievance: CaseHubGrievance = {
    id: Number(grievance.grievance_id),
    grievanceNumber: grievance.grievance_number,
    title: grievance.title,
    description: grievance.description,
    status: grievance.status,
    priority: grievance.priority,
    createdAt: grievance.created_at.toISOString(),
    categoryName: grievance.categories?.category_name || "General",
    subcategoryName: grievance.subcategories?.subcategory_name || "General",
    departmentName: primaryDept,
    departments: allDepts,
    supportingFindings,
    attachments: endUserAttachments,
    staffAttachments,
    statusHistory: (grievance.grievance_status_history || []).map((h) => ({
      id: h.history_id.toString(),
      status: h.new_status,
      changedAt: h.changed_at.toISOString(),
      changedBy: h.users
        ? `${h.users.first_name} ${h.users.last_name || ""}`.trim()
        : undefined,
      roleName: h.users?.roles?.role_name,
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
