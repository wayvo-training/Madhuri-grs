import type React from "react";
import { GrievanceCommunicationShell } from "@/components/communication/GrievanceCommunicationShell";
import { getUserGrievanceConversations } from "@/lib/communication/service";
import { requirePageRole } from "@/lib/permissions";

export default async function StaffMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole("STAFF");

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
    <GrievanceCommunicationShell
      conversations={conversations}
      basePath="/staff/messages"
    >
      {children}
    </GrievanceCommunicationShell>
  );
}
