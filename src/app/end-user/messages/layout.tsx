import type React from "react";
import { GrievanceCommunicationShell } from "@/components/communication/GrievanceCommunicationShell";
import { DashboardShell } from "@/components/dashboard/shell";
import { getUserGrievanceConversations } from "@/lib/communication/service";
import { requirePageRole } from "@/lib/permissions";

export default async function EndUserMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole("END_USER");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  const conversations = await getUserGrievanceConversations(
    user,
    "/end-user/messages",
  );

  return (
    <DashboardShell
      userRole="END_USER"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Grievance Communication"
      subtitle="Communicate with redressal staff and department teams about your grievances."
    >
      <GrievanceCommunicationShell
        conversations={conversations}
        basePath="/end-user/messages"
      >
        {children}
      </GrievanceCommunicationShell>
    </DashboardShell>
  );
}
