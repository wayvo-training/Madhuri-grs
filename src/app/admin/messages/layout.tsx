import type React from "react";
import { GrievanceCommunicationShell } from "@/components/communication/GrievanceCommunicationShell";
import { getUserGrievanceConversations } from "@/lib/communication/service";
import { requirePageRole } from "@/lib/permissions";

export default async function AdminMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageRole(["ADMIN"]);

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
    <GrievanceCommunicationShell
      conversations={conversations}
      basePath="/admin/messages"
    >
      {children}
    </GrievanceCommunicationShell>
  );
}
