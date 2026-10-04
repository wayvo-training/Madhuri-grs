import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/permissions";
import { getGrievanceCommunicationThread } from "@/lib/communication/service";
import { GrievanceCommunicationWorkspace } from "@/components/communication/GrievanceCommunicationWorkspace";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DepartmentHeadGrievanceMessagesPage({
  params,
}: PageProps) {
  const user = await requirePageRole(["DEPARTMENT_HEAD", "ADMIN"]);
  const { id } = await params;

  const grievanceId = parseInt(id, 10);
  if (isNaN(grievanceId)) return notFound();

  const threadData = await getGrievanceCommunicationThread(
    grievanceId,
    user,
    "/department-head/messages",
  );

  if (!threadData) return notFound();

  return <GrievanceCommunicationWorkspace data={threadData} />;
}
