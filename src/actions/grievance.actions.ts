export interface AssignStaffParams {
  grievanceId: string;
  staffId: string;
  note?: string;
  score?: number;
  reasons?: unknown;
}

export interface InterveneGrievanceParams {
  grievanceId: string;
  bottleneck: string;
  bottleneckExplanation?: string;
  interventionType: string;
  targetStaffId?: string;
  targetDeptName?: string;
  note?: string;
  extensionHours?: number;
}

export interface SubmitResolutionParams {
  grievanceId: string;
  decision: "APPROVE" | "CLARIFY" | "REJECT";
  feedback?: string;
  findings?: string;
  actionTaken?: string;
  outcome?: string;
  evidence?: string;
}

export interface AddGrievanceNoteParams {
  grievanceId: string;
  note: string;
  parentId?: string;
  replyToAuthor?: string;
  isCollaboration?: boolean;
}

export interface ReopenGrievanceParams {
  grievanceId: string;
  reason: string;
}

/**
 * Assign staff to a grievance (Department Head)
 */
export async function assignStaffAction(params: AssignStaffParams) {
  const res = await fetch(
    `/api/department-head/grievances/${params.grievanceId}/assign`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffId: params.staffId,
        note: params.note,
        score: params.score,
        reasons: params.reasons,
      }),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || "Failed to assign grievance");
  }
  return data;
}

/**
 * Execute Department Head Escalation / Intervention
 */
export async function interveneGrievanceAction(
  params: InterveneGrievanceParams,
) {
  const res = await fetch(
    `/api/department-head/grievances/${params.grievanceId}/intervene`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bottleneck: params.bottleneck,
        bottleneckExplanation: params.bottleneckExplanation,
        interventionType: params.interventionType,
        targetStaffId: params.targetStaffId,
        targetDeptName: params.targetDeptName,
        note: params.note,
        extensionHours: params.extensionHours,
      }),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(
      data.message || data.error || "Failed to execute intervention",
    );
  }
  return data;
}

/**
 * Submit or review resolution (Department Head)
 */
export async function reviewResolutionAction(params: SubmitResolutionParams) {
  const res = await fetch(
    `/api/department-head/grievances/${params.grievanceId}/resolution`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision: params.decision,
        feedback: params.feedback,
        findings: params.findings,
        actionTaken: params.actionTaken,
        outcome: params.outcome,
        evidence: params.evidence,
      }),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(
      data.message || data.error || "Failed to process resolution",
    );
  }
  return data;
}

/**
 * Add internal or collaboration note to a grievance
 */
export async function addGrievanceNoteAction(params: AddGrievanceNoteParams) {
  const res = await fetch(
    `/api/department-head/grievances/${params.grievanceId}/notes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        note: params.note,
        parentId: params.parentId,
        replyToAuthor: params.replyToAuthor,
        isCollaboration: params.isCollaboration,
      }),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || "Failed to post note");
  }
  return data;
}

/**
 * Reopen a grievance (End User)
 */
export async function reopenGrievanceAction(params: ReopenGrievanceParams) {
  const res = await fetch(
    `/api/end-user/grievances/${params.grievanceId}/reopen`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: params.reason }),
    },
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || data.error || "Failed to reopen grievance");
  }
  return data;
}

/**
 * Accept resolution and close grievance (End User)
 */
export async function acceptResolutionAction(grievanceId: string) {
  const res = await fetch(`/api/end-user/grievances/${grievanceId}/accept`, {
    method: "POST",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(
      data.message || data.error || "Failed to accept resolution",
    );
  }
  return data;
}
