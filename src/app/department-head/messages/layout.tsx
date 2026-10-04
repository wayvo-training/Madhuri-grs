import React from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { getUserGrievanceConversations } from "@/lib/communication/service";
import { GrievanceCommunicationSidebar } from "@/components/communication/GrievanceCommunicationSidebar";

export default async function DepartmentHeadMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole(["DEPARTMENT_HEAD", "ADMIN"]);
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  const conversations = await getUserGrievanceConversations(
    user,
    "/department-head/messages",
  );

  return (
    <DashboardShell
      userRole="DEPARTMENT_HEAD"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Grievance Communication"
      subtitle="Communicate with citizens and staff involved in department grievances."
    >
      <div className="flex h-[calc(100vh-140px)] min-h-[600px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xs">
        <div className="w-[360px] lg:w-[380px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col hidden md:flex">
          <GrievanceCommunicationSidebar
            conversations={conversations}
            basePath="/department-head/messages"
          />
        </div>
        <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950 overflow-hidden relative">
          {children}
        </div>
      </div>
    </DashboardShell>
  );
}
