import { User } from "lucide-react";
import {
  EndUserPortal,
  type UserGrievanceItem,
} from "@/components/dashboard/end-user-portal";
import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function UserDashboardPage() {
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
      title="End User Grievance Portal"
      subtitle="Corporate grievance registration & resolution tracking"
    >
      <div className="space-y-6">
        {/* Role Confirmation Banner */}
        <div className="rounded-2xl border border-teal-200/80 bg-[#F0FDFA] p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F766E] text-white shadow-xs">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Role: End User (Employee)
                </h2>
                <span className="rounded-full bg-[#F0FDFA] border border-teal-200 px-2.5 py-0.5 text-xs font-semibold text-[#0F766E]">
                  Employee Portal
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Logged in as <span className="font-semibold">{fullName}</span> (
                {user.email}) &bull; Employee Code:{" "}
                <span className="font-mono">{user.employee_code}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Live End User Portal with Inquiry Response & Document Upload */}
        <EndUserPortal
          initialGrievances={serializedGrievances}
          userFullName={fullName}
          userEmail={user.email}
        />
      </div>
    </DashboardShell>
  );
}
