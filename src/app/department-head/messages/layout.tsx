import type React from "react";
import { GrievanceCommunicationShell } from "@/components/communication/GrievanceCommunicationShell";
import { getUserGrievanceConversations } from "@/lib/communication/service";
import { requirePageRole } from "@/lib/permissions";

export default async function DepartmentHeadMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole(["DEPARTMENT_HEAD", "ADMIN"]);

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
    <GrievanceCommunicationShell
      conversations={conversations}
      basePath="/department-head/messages"
    >
      {children}
    </GrievanceCommunicationShell>
  );
}
