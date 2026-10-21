import type React from "react";
import { GrievanceCommunicationShell } from "@/components/communication/GrievanceCommunicationShell";
import { getUserGrievanceConversations } from "@/lib/communication/service";
import { requirePageRole } from "@/lib/permissions";

export default async function EndUserMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole("END_USER");

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
    <GrievanceCommunicationShell
      conversations={conversations}
      basePath="/end-user/messages"
    >
      {children}
    </GrievanceCommunicationShell>
  );
}
