import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import {
  type CaseHubGrievance,
  EndUserCaseHub,
} from "@/components/end-user/case-hub/EndUserCaseHub";
import type { EndUserResolutionData } from "@/components/end-user/resolution-card";
import { canEndUserSubmitCommunication } from "@/lib/communication/service";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GrievanceDetailsPage({ params }: PageProps) {
  const user = await requirePageRole("END_USER");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
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
      attachments: true,
      grievance_departments: {
        include: { departments: true },
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
            ],
          },
        },
        orderBy: { created_at: "desc" },
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

  const latestResolution = grievance.resolutions?.[0];
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
          path: att.file_path,
          size: att.file_size
            ? `${Math.round(Number(att.file_size) / 1024)} KB`
            : undefined,
          type: att.file_type,
        })),
      }
    : null;

  const primaryDept =
    grievance.grievance_departments?.departments?.department_name || "";

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
    attachments: (grievance.attachments || []).map((att) => ({
      id: att.attachment_id.toString(),
      name: att.file_name,
      path: att.file_path,
      size: att.file_size
        ? `${Math.round(Number(att.file_size) / 1024)} KB`
        : undefined,
      type: att.file_type,
    })),
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

  return (
    <DashboardShell
      userRole="END_USER"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      designation="Employee"
      departmentName={user.departments?.department_name || "General Public"}
      title={`Grievance ${grievance.grievance_number}`}
      subtitle="View full details, resolution, tracking, and documents."
    >
      <EndUserCaseHub
        grievance={serializedGrievance}
        resolution={resolutionData}
        canProvideAdditionalInfo={canProvideAdditionalInfo}
        submissionCheck={submissionCheck}
      />
    </DashboardShell>
  );
}
