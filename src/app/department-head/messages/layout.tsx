import type React from "react";
import { GrievanceCommunicationShell } from "@/components/communication/GrievanceCommunicationShell";
import { DashboardShell } from "@/components/dashboard/shell";
import { getUserGrievanceConversations } from "@/lib/communication/service";
import { requirePageRole } from "@/lib/permissions";

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
      <GrievanceCommunicationShell
        conversations={conversations}
        basePath="/department-head/messages"
      >
        {children}
      </GrievanceCommunicationShell>
    </DashboardShell>
  );
}
