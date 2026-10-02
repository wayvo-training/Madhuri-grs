import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { GrievanceList } from "@/components/end-user/grievance-list";
import type { EndUserGrievance } from "@/types/end-user";

export default async function EndUserGrievancesPage() {
  const user = await requirePageRole("END_USER");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  const userGrievances = await prisma.grievances.findMany({
    where: { submitted_by: user.user_id },
    include: {
      categories: true,
      subcategories: true,
      attachments: true,
      audit_logs: {
        where: { action: "ADDITIONAL_INFO_REQUESTED" },
        orderBy: { created_at: "desc" },
        take: 1,
      },
    },
    orderBy: { created_at: "desc" },
  });

  const serializedGrievances: EndUserGrievance[] = userGrievances.map((g) => {
    const latestInquiryLog = g.audit_logs?.[0];
    const inquiryVal = latestInquiryLog?.new_value as {
      subject?: string;
      message?: string;
      channels?: string[];
      requestedDocs?: string[];
      author?: string;
    } | null;

    return {
      id: g.grievance_id.toString(),
      grievanceNumber: g.grievance_number,
      title: g.title,
      description: g.description,
      category: g.categories?.category_name || "General",
      subcategory: g.subcategories?.subcategory_name || "General",
      priority: g.priority || "MEDIUM",
      status: g.status,
      createdAt: g.created_at.toISOString(),
      dueAt: g.due_at ? g.due_at.toISOString() : null,
      attachments: (g.attachments || []).map((a) => ({
        id: a.attachment_id.toString(),
        name: a.file_name,
        size: a.file_size
          ? `${Math.round(Number(a.file_size) / 1024)} KB`
          : "Document",
        type: a.file_type,
        path: a.file_path,
      })),
      latestInquiry: inquiryVal
        ? {
            subject: inquiryVal.subject,
            message: inquiryVal.message,
            channels: inquiryVal.channels,
            requestedDocs: inquiryVal.requestedDocs,
            author: inquiryVal.author,
            timestamp: latestInquiryLog?.created_at.toISOString(),
          }
        : null,
    };
  });

  return (
    <DashboardShell
      userRole="END_USER"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="My Grievances"
      subtitle="Track all grievances you have submitted"
    >
      <GrievanceList initialGrievances={serializedGrievances} />
    </DashboardShell>
  );
}
