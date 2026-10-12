export interface RequestAdditionalInfoParams {
  grievanceId: string;
  channels: ("IN_APP" | "EMAIL")[];
  subject: string;
  message: string;
  requestedDocs: string[];
}

export interface StaffResolutionPayload {
  grievanceId: string;
  problemSummary: string;
  findings: string;
  actionTaken: string;
  outcome: string;
  evidence?: string;
}

/**
 * Start investigation on an assigned case (Staff)
 */
export async function startInvestigationAction(grievanceId: string) {
  const res = await fetch(`/api/staff/grievances/${grievanceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "START_INVESTIGATION" }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(
      data.message || data.error || "Failed to start investigation",
    );
  }
  return data;
}

/**
 * Request additional information/proofs from complainant (Staff)
 */
export async function requestAdditionalInfoAction(
  params: RequestAdditionalInfoParams,
) {
  const res = await fetch(`/api/staff/grievances/${params.grievanceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "REQUEST_ADDITIONAL_INFO",
      channels: params.channels,
      subject: params.subject,
      message: params.message,
      requestedDocs: params.requestedDocs,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(
      data.message || data.error || "Failed to request additional information",
    );
  }
  return data;
}

/**
 * Submit formal case resolution report (Staff)
 */
export async function submitStaffResolutionAction(
  payload: StaffResolutionPayload,
) {
  const res = await fetch("/api/staff/resolutions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(
      data.message || data.error || "Failed to submit resolution",
    );
  }
  return data;
}

/**
 * Toggle staff availability status (Active / On Leave)
 */
export async function updateStaffStatusAction(
  staffId: string,
  status: "ACTIVE" | "ON_LEAVE",
) {
  const res = await fetch(`/api/department-head/staff/${staffId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(
      data.message || data.error || "Failed to update staff status",
    );
  }
  return data;
}
