import type React from "react";
import { GrievanceCommunicationShell } from "@/components/communication/GrievanceCommunicationShell";
import { DashboardShell } from "@/components/dashboard/shell";
import { getUserGrievanceConversations } from "@/lib/communication/service";
import { requirePageRole } from "@/lib/permissions";

export default async function AdminMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole(["ADMIN"]);
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  let conversations: Awaited<ReturnType<typeof getUserGrievanceConversations>> =
    [];
  try {
    conversations = await getUserGrievanceConversations(
      user,
      "/admin/messages",
    );
  } catch (error) {
    console.error("AdminMessagesLayout: error loading conversations:", error);
  }

  return (
    <DashboardShell
      userRole="ADMIN"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      designation="System Administrator"
      departmentName={
        user.departments?.department_name || "Central Administration"
      }
      title="Grievance Communication"
      subtitle="Governance oversight and communication audit across grievances."
    >
      <GrievanceCommunicationShell
        conversations={conversations}
        basePath="/admin/messages"
      >
        {children}
      </GrievanceCommunicationShell>
    </DashboardShell>
  );
}
