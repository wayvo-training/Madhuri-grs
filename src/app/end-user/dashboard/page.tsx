import {
  EndUserPortal,
  type UserGrievanceItem,
} from "@/components/end-user/end-user-dashboard";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function UserDashboardPage() {
  const user = await requirePageRole("END_USER");

  const userGrievances = await prisma.grievances.findMany({
    where: { submitted_by: user.user_id },
    take: 50,
    select: {
      grievance_id: true,
      grievance_number: true,
      title: true,
      description: true,
      priority: true,
      status: true,
      created_at: true,
      due_at: true,
      submitted_by: true,
      categories: {
        select: { category_name: true },
      },
      subcategories: {
        select: { subcategory_name: true },
      },
      attachments: {
        select: {
          attachment_id: true,
          file_name: true,
          file_size: true,
          file_type: true,
          file_path: true,
          resolution_id: true,
          grievance_department_id: true,
          uploaded_by: true,
        },
      },
      audit_logs: {
        where: { action: "ADDITIONAL_INFO_REQUESTED" },
        orderBy: { created_at: "desc" },
        take: 1,
        select: {
          new_value: true,
          created_at: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const serializedGrievances: UserGrievanceItem[] = userGrievances.map((g) => {
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
      attachments: (g.attachments || [])
        .filter(
          (a) =>
            !a.resolution_id &&
            !a.grievance_department_id &&
            BigInt(a.uploaded_by) === BigInt(g.submitted_by),
        )
        .map((a) => ({
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
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Live End User Portal with Inquiry Response & Document Upload */}
      <EndUserPortal
        initialGrievances={serializedGrievances}
        userEmail={user.email}
      />
    </div>
  );
}
