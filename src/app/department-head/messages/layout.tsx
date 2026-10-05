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

  let conversations: Awaited<ReturnType<typeof getUserGrievanceConversations>> =
    [];
  try {
    conversations = await getUserGrievanceConversations(
      user,
      "/department-head/messages",
    );
  } catch (error) {
    console.error(
      "DepartmentHeadMessagesLayout: error loading conversations:",
      error,
    );
  }

  return (
    <DashboardShell
      userRole="DEPARTMENT_HEAD"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      designation="Department Head"
      departmentName={user.departments?.department_name || "Department Queue"}
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
