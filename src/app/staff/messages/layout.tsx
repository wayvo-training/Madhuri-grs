import type React from "react";
import { GrievanceCommunicationShell } from "@/components/communication/GrievanceCommunicationShell";
import { DashboardShell } from "@/components/dashboard/shell";
import { getUserGrievanceConversations } from "@/lib/communication/service";
import { requirePageRole } from "@/lib/permissions";

export default async function StaffMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole("STAFF");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  let conversations: Awaited<ReturnType<typeof getUserGrievanceConversations>> =
    [];
  try {
    conversations = await getUserGrievanceConversations(
      user,
      "/staff/messages",
    );
  } catch (error) {
    console.error("StaffMessagesLayout: error loading conversations:", error);
  }

  return (
    <DashboardShell
      userRole="STAFF"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      designation="Grievance Staff"
      departmentName={user.departments?.department_name || "Operations"}
      title="Grievance Communication"
      subtitle="Communicate with the people involved in your assigned grievances."
    >
      <GrievanceCommunicationShell
        conversations={conversations}
        basePath="/staff/messages"
      >
        {children}
      </GrievanceCommunicationShell>
    </DashboardShell>
  );
}
