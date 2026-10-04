import { notFound } from "next/navigation";
import { GrievanceCommunicationWorkspace } from "@/components/communication/GrievanceCommunicationWorkspace";
import { getGrievanceCommunicationThread } from "@/lib/communication/service";
import { requirePageRole } from "@/lib/permissions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EndUserGrievanceMessagesPage({
  params,
}: PageProps) {
  const user = await requirePageRole("END_USER");
  const { id } = await params;

  const grievanceId = parseInt(id, 10);
  if (Number.isNaN(grievanceId)) return notFound();

  const threadData = await getGrievanceCommunicationThread(
    grievanceId,
    user,
    "/end-user/messages",
  );

  if (!threadData) return notFound();

  return <GrievanceCommunicationWorkspace data={threadData} />;
}
