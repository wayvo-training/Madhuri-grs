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

  let conversations: Awaited<ReturnType<typeof getUserGrievanceConversations>> =
    [];
  try {
    conversations = await getUserGrievanceConversations(
      user,
      "/end-user/messages",
    );
  } catch (error) {
    console.error("EndUserMessagesLayout: error loading conversations:", error);
  }

  return (
    <DashboardShell
      userRole="END_USER"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      designation="Employee"
      departmentName={user.departments?.department_name || "Employee"}
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
