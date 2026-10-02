import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { MessagesSidebar } from "@/components/end-user/messages-sidebar";

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole("END_USER");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  // Fetch grievances that have communication
  const grievances = await prisma.grievances.findMany({
    where: {
      submitted_by: user.user_id,
      OR: [
        { audit_logs: { some: { action: { in: ["ADDITIONAL_INFO_REQUESTED", "USER_INFO_SUBMITTED", "USER_ADDITIONAL_INFO_PROVIDED"] } } } },
        { resolutions: { some: {} } }
      ]
    },
    include: {
      audit_logs: {
        where: { action: { in: ["ADDITIONAL_INFO_REQUESTED", "USER_INFO_SUBMITTED", "USER_ADDITIONAL_INFO_PROVIDED"] } },
        orderBy: { created_at: "desc" },
        take: 1,
      },
      resolutions: {
        orderBy: { submitted_at: "desc" },
        take: 1,
      }
    },
    orderBy: { updated_at: "desc" }
  });

  const formattedMessages = grievances.map(g => {
    let latestMessage = null;
    let type = "";
    let timestamp = g.updated_at;
    let sender = "";
    let preview = "";
    let requiresResponse = false;
    let hasAttachments = false;

    const latestAudit = g.audit_logs[0];
    const latestResolution = g.resolutions[0];

    if (latestAudit && latestResolution) {
      latestMessage = latestAudit.created_at > latestResolution.submitted_at ? latestAudit : latestResolution;
    } else {
      latestMessage = latestAudit || latestResolution;
    }

    if (!latestMessage) return null;

    if ('action' in latestMessage) {
      if (latestMessage.action === "ADDITIONAL_INFO_REQUESTED") {
        type = "Additional information requested";
        timestamp = latestMessage.created_at;
        const info = latestMessage.new_value as any;
        sender = info?.author || "Staff";
        preview = info?.message || "Please provide additional information.";
        requiresResponse = g.status === "WAITING_ON_USER";
        hasAttachments = (info?.requestedDocs?.length || 0) > 0;
      } else if (latestMessage.action === "USER_INFO_SUBMITTED") {
        type = "Response submitted";
        timestamp = latestMessage.created_at;
        sender = "You";
        preview = "You submitted a response to the information request.";
        hasAttachments = ((latestMessage.new_value as any)?.uploadedFiles?.length || 0) > 0;
      } else if (latestMessage.action === "USER_ADDITIONAL_INFO_PROVIDED") {
        type = "Additional information submitted";
        timestamp = latestMessage.created_at;
        sender = "You";
        preview = "You provided additional information for this grievance.";
        hasAttachments = ((latestMessage.new_value as any)?.uploadedFiles?.length || 0) > 0;
      }
    } else if ('resolution_notes' in latestMessage) {
      type = "Resolution update";
      timestamp = latestMessage.submitted_at;
      sender = "Processing Team";
      preview = "Your grievance has been resolved. " + latestMessage.resolution_notes;
    }

    return {
      id: g.grievance_id.toString(),
      grievanceNumber: g.grievance_number,
      title: g.title,
      type,
      sender,
      timestamp,
      preview,
      requiresResponse,
      hasAttachments
    };
  }).filter(Boolean);

  formattedMessages.sort((a, b) => new Date(b!.timestamp).getTime() - new Date(a!.timestamp).getTime());

  return (
    <DashboardShell
      userRole="END_USER"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Messages"
      subtitle="Communication related to your submitted grievances."
    >
      <div className="flex h-[calc(100vh-140px)] min-h-[600px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm">
        <div className="w-[380px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col hidden md:flex">
          <MessagesSidebar messages={formattedMessages} />
        </div>
        <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950 overflow-hidden relative">
          {children}
        </div>
      </div>
    </DashboardShell>
  );
}
