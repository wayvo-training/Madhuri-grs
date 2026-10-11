import type { AuthUser } from "@/lib/auth";
import {
  classifyAttachmentForDepartments,
  type DepartmentProfile,
} from "./document-classifier";

export interface AttachmentRecord {
  attachment_id: bigint | number;
  grievance_id: bigint | number;
  grievance_department_id?: bigint | number | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size?: bigint | number | null;
  uploaded_by: bigint | number;
  uploaded_at: Date;
  resolution_id?: bigint | number | null;
}

export interface GrievanceContext {
  grievance_id: bigint | number;
  submitted_by?: bigint | number | null;
  user_id?: bigint | number | null; // Complainant / citizen submitter
  status: string;
  title?: string;
  description?: string;
  categoryName?: string;
  subcategoryName?: string;
}

export interface GrievanceDepartmentContext {
  grievance_department_id: bigint | number;
  department_id: bigint | number;
  involvement_type: string; // "PRIMARY" | "SUPPORTING" | "EQUAL"
  status: string;
  department_name?: string;
  departments?: {
    department_name: string;
  };
}

export interface AssignmentContext {
  staff_id: bigint | number;
  grievance_department_id: bigint | number;
  assignment_status: string;
}

export interface AttachmentDepartmentGrantRecord {
  grant_id?: bigint | number;
  attachment_id: bigint | number;
  department_id: bigint | number;
  granted_by?: bigint | number;
  granted_at?: Date;
}

export interface AttachmentAccessCheckInput {
  user: AuthUser;
  attachment: AttachmentRecord;
  grievance: GrievanceContext;
  grievanceDepartments?: GrievanceDepartmentContext[];
  assignments?: AssignmentContext[];
  departmentGrants?: AttachmentDepartmentGrantRecord[];
}

export interface AttachmentAccessResult {
  allowed: boolean;
  reason: string;
}

/**
 * Checks whether an authenticated user is authorized to view/download a specific attachment.
 *
 * Rules:
 * 1. ADMIN has universal access.
 * 2. Citizen Submitter:
 *    - Has access to attachments they uploaded directly.
 *    - Has access to attachments submitted on their own grievance dossier.
 *    - Has access to formal resolution attachments.
 * 3. Primary / Equal Lead Department (Head & Assigned Staff):
 *    - Has full access to citizen case dossier attachments and their own department uploads.
 * 4. Resolution Attachments (resolution_id is NOT null):
 *    - Accessible by citizen submitter, Admin, and all active case participants.
 * 5. Supporting Departments:
 *    - Citizen-uploaded attachments default to PRIMARY_ONLY access.
 *    - Supporting department staff/heads DO NOT have access to citizen attachments by default.
 *    - Supporting staff/heads CAN access attachments uploaded by their own department or formal resolution attachments.
 *    - Explicit Department Grants: If the Lead Department or Admin created an explicit grant for this department, access is allowed.
 */
export function checkAttachmentAccess(
  input: AttachmentAccessCheckInput,
): AttachmentAccessResult {
  const {
    user,
    attachment,
    grievance,
    grievanceDepartments = [],
    assignments = [],
    departmentGrants = [],
  } = input;

  const currentUserId = BigInt(user.user_id);
  const userRole = user.roles?.role_name?.toUpperCase() || "";
  const userDeptId = user.department_id ? BigInt(user.department_id) : null;

  // 1. Admin access
  if (userRole === "ADMIN") {
    return {
      allowed: true,
      reason: "Admin role has universal attachment access.",
    };
  }

  // 2. Citizen submitter / Complainant
  const grievanceOwnerId =
    grievance.submitted_by !== undefined && grievance.submitted_by !== null
      ? BigInt(grievance.submitted_by)
      : grievance.user_id !== undefined && grievance.user_id !== null
        ? BigInt(grievance.user_id)
        : null;
  const attachmentUploaderId = BigInt(attachment.uploaded_by);

  if (
    (grievanceOwnerId !== null && currentUserId === grievanceOwnerId) ||
    currentUserId === attachmentUploaderId
  ) {
    return {
      allowed: true,
      reason: "Citizen owner / uploader has access to their attachment.",
    };
  }

  // 3. Resolution attachments are accessible to all grievance case participants & the citizen
  const isResolutionAttachment =
    attachment.resolution_id !== null && attachment.resolution_id !== undefined;

  // Identify user's department involvement
  const userDeptRecord = userDeptId
    ? grievanceDepartments.find((d) => BigInt(d.department_id) === userDeptId)
    : undefined;

  const isUserDeptParticipant = Boolean(userDeptRecord);
  const isPrimaryOrEqual =
    userDeptRecord?.involvement_type === "PRIMARY" ||
    userDeptRecord?.involvement_type === "EQUAL";

  // Check if user is actively assigned to this grievance
  const isUserAssignedStaff = assignments.some(
    (a) =>
      BigInt(a.staff_id) === currentUserId &&
      (a.assignment_status === "ASSIGNED" ||
        a.assignment_status === "COMPLETED"),
  );

  // If this is a resolution attachment, any participating department can view the resolution package
  if (isResolutionAttachment) {
    if (isUserDeptParticipant || isUserAssignedStaff) {
      return {
        allowed: true,
        reason:
          "Resolution evidence is accessible to participating case departments.",
      };
    }
  }

  // 4. Own department upload (e.g. supporting department uploaded its own findings evidence)
  const isOwnDeptUpload =
    (userDeptRecord &&
      attachment.grievance_department_id &&
      BigInt(attachment.grievance_department_id) ===
        BigInt(userDeptRecord.grievance_department_id)) ||
    assignments.some(
      (a) =>
        BigInt(a.staff_id) === currentUserId &&
        (a.assignment_status === "ASSIGNED" ||
          a.assignment_status === "COMPLETED") &&
        attachment.grievance_department_id &&
        BigInt(a.grievance_department_id) ===
          BigInt(attachment.grievance_department_id),
    );

  if (isOwnDeptUpload) {
    return {
      allowed: true,
      reason:
        "Department officers have access to evidence uploaded by their own department.",
    };
  }

  // 5. Department Grants or Dynamic In-Memory Classification (Document Visibility)
  const thisAttachmentGrants = departmentGrants.filter(
    (g) => BigInt(g.attachment_id) === BigInt(attachment.attachment_id),
  );

  let targetDepartmentIds: bigint[] | null = null;

  if (thisAttachmentGrants.length > 0) {
    targetDepartmentIds = thisAttachmentGrants.map((g) =>
      BigInt(g.department_id),
    );
  } else if (grievanceDepartments.length > 1) {
    const deptProfiles: DepartmentProfile[] = grievanceDepartments.map((gd) => {
      const dId = BigInt(gd.department_id);
      const dIdStr = dId.toString();
      const deptName =
        (gd.department_name && gd.department_name.trim()) ||
        (gd.departments?.department_name &&
          gd.departments.department_name.trim()) ||
        (dIdStr === "1"
          ? "Human Resources"
          : dIdStr === "2"
            ? "Finance"
            : dIdStr === "3"
              ? "Facilities"
              : dIdStr === "4"
                ? "Management"
                : dIdStr === "5"
                  ? "Compliance"
                  : `Department ${dIdStr}`);
      return {
        department_id: dId,
        department_name: deptName,
        involvement_type: gd.involvement_type,
      };
    });

    const classification = classifyAttachmentForDepartments({
      fileName: attachment.file_name,
      fileType: attachment.file_type,
      fileSize: attachment.file_size ? Number(attachment.file_size) : undefined,
      categoryName: grievance.categoryName,
      subcategoryName: grievance.subcategoryName,
      grievanceTitle: grievance.title,
      grievanceDescription: grievance.description,
      participatingDepartments: deptProfiles,
    });

    targetDepartmentIds = classification.targetDepartmentIds;
  }

  if (targetDepartmentIds !== null && targetDepartmentIds.length > 0) {
    const isDeptGranted = Boolean(
      userDeptId && targetDepartmentIds.some((id) => id === userDeptId),
    );

    const isAssignedToGrantedDept = assignments.some((a) => {
      if (BigInt(a.staff_id) !== currentUserId) return false;
      if (
        a.assignment_status !== "ASSIGNED" &&
        a.assignment_status !== "COMPLETED"
      )
        return false;
      const gd = grievanceDepartments.find(
        (d) =>
          BigInt(d.grievance_department_id) ===
          BigInt(a.grievance_department_id),
      );
      if (!gd) return false;
      return targetDepartmentIds?.some((id) => id === BigInt(gd.department_id));
    });

    if (isDeptGranted || isAssignedToGrantedDept) {
      return {
        allowed: true,
        reason: "Access granted based on department document visibility.",
      };
    }

    return {
      allowed: false,
      reason:
        "Forbidden: Access to this document is restricted to other designated departments.",
    };
  }

  // 6. Unrestricted Primary Lead access for unclassified / legacy attachments
  if (isPrimaryOrEqual) {
    return {
      allowed: true,
      reason:
        "Primary Lead Department officers have full access to grievance dossier attachments.",
    };
  }

  // 7. Staff member actively assigned specifically to the Primary or Equal department
  const isAssignedToPrimaryOrEqual = assignments.some((a) => {
    if (BigInt(a.staff_id) !== currentUserId) return false;
    if (
      a.assignment_status !== "ASSIGNED" &&
      a.assignment_status !== "COMPLETED"
    )
      return false;
    const dept = grievanceDepartments.find(
      (gd) =>
        BigInt(gd.grievance_department_id) ===
        BigInt(a.grievance_department_id),
    );
    return (
      dept?.involvement_type === "PRIMARY" || dept?.involvement_type === "EQUAL"
    );
  });

  if (isAssignedToPrimaryOrEqual) {
    return {
      allowed: true,
      reason:
        "Staff assigned to Primary Department has access to grievance dossier attachments.",
    };
  }

  // 8. Default deny for Supporting Departments on ungranted citizen attachments
  return {
    allowed: false,
    reason:
      "Forbidden: Access to citizen-uploaded attachments is restricted to the Primary Lead Department by default.",
  };
}

/**
 * Filters an array of attachments for a given user, retaining only authorized attachments.
 */
export function filterAuthorizedAttachments<T extends AttachmentRecord>(
  user: AuthUser,
  attachments: T[],
  grievance: GrievanceContext,
  grievanceDepartments?: GrievanceDepartmentContext[],
  assignments?: AssignmentContext[],
  departmentGrants?: AttachmentDepartmentGrantRecord[],
): T[] {
  return attachments.filter((att) => {
    const check = checkAttachmentAccess({
      user,
      attachment: att,
      grievance,
      grievanceDepartments,
      assignments,
      departmentGrants,
    });
    return check.allowed;
  });
}

/**
 * Verifies whether the authenticated user is authorized to grant or revoke attachment access.
 * Only ADMIN or the Primary Department Head for this grievance can manage grants.
 */
export function canManageAttachmentGrants(
  user: AuthUser,
  grievanceDepartments: GrievanceDepartmentContext[],
): { allowed: boolean; reason: string } {
  const userRole = user.roles?.role_name?.toUpperCase() || "";
  if (userRole === "ADMIN") {
    return {
      allowed: true,
      reason: "Admin role has full grant management authority.",
    };
  }

  if (userRole === "DEPARTMENT_HEAD" && user.department_id) {
    const currentDeptId = BigInt(user.department_id);
    const primaryDept = grievanceDepartments.find(
      (gd) =>
        BigInt(gd.department_id) === currentDeptId &&
        (gd.involvement_type === "PRIMARY" || gd.involvement_type === "EQUAL"),
    );

    if (primaryDept) {
      return {
        allowed: true,
        reason: "Primary Lead Department Head has grant management authority.",
      };
    }
  }

  return {
    allowed: false,
    reason:
      "Forbidden: Only an Admin or the Primary Lead Department Head may grant or revoke attachment access.",
  };
}

/**
 * Validates a target department for an attachment grant.
 * Must belong to a participating department on the grievance, and cannot be the Primary department.
 */
export function validateAttachmentGrantTarget(
  targetDepartmentId: bigint | number,
  grievanceDepartments: GrievanceDepartmentContext[],
): { valid: boolean; reason?: string } {
  const targetId = BigInt(targetDepartmentId);
  const matchedDept = grievanceDepartments.find(
    (gd) => BigInt(gd.department_id) === targetId,
  );

  if (!matchedDept) {
    return {
      valid: false,
      reason:
        "Invalid target: The target department is not participating in this grievance.",
    };
  }

  if (
    matchedDept.involvement_type === "PRIMARY" ||
    matchedDept.involvement_type === "EQUAL"
  ) {
    return {
      valid: false,
      reason:
        "Redundant grant: The Primary/Equal Lead department already has full default access.",
    };
  }

  return { valid: true };
}

/**
 * Advisory keyword matching utility to suggest relevant departments based on document filename or MIME type.
 *
 * CRITICAL SECURITY CONSTRAINT:
 * This matching is STRICTLY ADVISORY for Department Heads / Admins.
 * It NEVER automatically grants access to any department.
 */
export function suggestAttachmentDepartments(
  fileName: string,
  mimeType: string,
): { suggestedDepartments: string[]; matchedKeywords: string[] } {
  const nameLower = fileName.toLowerCase();
  const mimeLower = mimeType.toLowerCase();
  const matchedKeywords: string[] = [];
  const suggestedSet = new Set<string>();

  const KEYWORD_TAXONOMY_MAP: Record<string, string[]> = {
    "Electrical Department": [
      "electric",
      "power",
      "voltage",
      "meter",
      "transformer",
      "blackout",
      "wire",
      "short_circuit",
    ],
    "Water & Sanitation Department": [
      "water",
      "leakage",
      "pipe",
      "drainage",
      "sewage",
      "sanitation",
      "tanker",
      "contamination",
    ],
    "Public Works & Roads": [
      "road",
      "pothole",
      "bridge",
      "construction",
      "asphalt",
      "pavement",
      "debris",
      "footpath",
    ],
    "Health & Safety": [
      "hospital",
      "medical",
      "clinic",
      "injury",
      "health",
      "hazard",
      "chemical",
      "contamination",
    ],
    "Revenue & Taxation": [
      "tax",
      "receipt",
      "challan",
      "property_tax",
      "revenue",
      "assessment",
      "bill",
    ],
  };

  for (const [dept, keywords] of Object.entries(KEYWORD_TAXONOMY_MAP)) {
    for (const kw of keywords) {
      if (nameLower.includes(kw) || mimeLower.includes(kw)) {
        matchedKeywords.push(kw);
        suggestedSet.add(dept);
      }
    }
  }

  return {
    suggestedDepartments: Array.from(suggestedSet),
    matchedKeywords,
  };
}

/**
 * Normalizes and sanitizes a raw file_path (which may be a relative bucket key or legacy full URL)
 * into a safe, bucket-relative storage key.
 *
 * Security validations:
 * - Rejects malformed URLs
 * - Rejects unexpected buckets (only bucketName is allowed)
 * - Rejects encoded traversal attempts (%2e%2e, %2f, %5c, null bytes)
 * - Rejects path traversal attempts ("..", backslashes) rather than silently transforming them
 */
export function normalizeStoragePath(
  rawPath: string,
  bucketName: string,
): { valid: boolean; storagePath: string; error?: string } {
  if (!rawPath || typeof rawPath !== "string") {
    return {
      valid: false,
      storagePath: "",
      error: "Storage path is empty or invalid.",
    };
  }

  const trimmed = rawPath.trim();
  if (!trimmed) {
    return { valid: false, storagePath: "", error: "Storage path is empty." };
  }

  // Reject null bytes or control characters
  if (trimmed.includes("\0") || /%00/i.test(trimmed)) {
    return {
      valid: false,
      storagePath: "",
      error: "Null byte detected in storage path.",
    };
  }

  // Reject backslashes (Windows-style path traversal / separator confusion)
  if (trimmed.includes("\\") || /%5c/i.test(trimmed)) {
    return {
      valid: false,
      storagePath: "",
      error: "Backslash path traversal attempt rejected.",
    };
  }

  // Reject encoded traversal sequences before decoding (%2e is '.')
  if (
    /%2e%2e/i.test(trimmed) ||
    /%2e\./i.test(trimmed) ||
    /\.%2e/i.test(trimmed)
  ) {
    return {
      valid: false,
      storagePath: "",
      error: "Encoded path traversal attempt rejected.",
    };
  }

  // Reject direct traversal sequence
  if (trimmed.includes("..")) {
    return {
      valid: false,
      storagePath: "",
      error: "Path traversal attempt rejected.",
    };
  }

  let extracted = "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return {
        valid: false,
        storagePath: "",
        error: "Malformed URL in file_path.",
      };
    }

    const marker = `/${bucketName}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) {
      return {
        valid: false,
        storagePath: "",
        error: `Unexpected bucket in URL: expected bucket '${bucketName}'.`,
      };
    }

    const rawExtracted = parsed.pathname.slice(idx + marker.length);
    try {
      extracted = decodeURIComponent(rawExtracted);
    } catch {
      return {
        valid: false,
        storagePath: "",
        error: "Malformed URL encoding in file_path.",
      };
    }
  } else {
    // If path is prefixed with bucketName/
    const bucketPrefix = `${bucketName}/`;
    if (trimmed.startsWith(bucketPrefix)) {
      extracted = trimmed.slice(bucketPrefix.length);
    } else if (trimmed.startsWith("/")) {
      const stripped = trimmed.replace(/^\/+/, "");
      if (stripped.startsWith(bucketPrefix)) {
        extracted = stripped.slice(bucketPrefix.length);
      } else {
        extracted = stripped;
      }
    } else {
      extracted = trimmed;
    }

    try {
      extracted = decodeURIComponent(extracted);
    } catch {
      return {
        valid: false,
        storagePath: "",
        error: "Malformed URI encoding in file_path.",
      };
    }
  }

  // Post-decode checks: confirm no traversal was hidden inside double-encoding or decoding
  if (
    extracted.includes("..") ||
    extracted.includes("\\") ||
    extracted.includes("\0")
  ) {
    return {
      valid: false,
      storagePath: "",
      error: "Path traversal attempt rejected after decoding.",
    };
  }

  // Strip leading slashes
  const finalKey = extracted.replace(/^\/+/, "").trim();

  if (!finalKey) {
    return {
      valid: false,
      storagePath: "",
      error: "Storage path resolved to an empty key.",
    };
  }

  return { valid: true, storagePath: finalKey };
}

/**
 * Safely fetches explicit department grants for an attachment.
 * If the attachment_department_grants table has not yet been migrated to the database,
 * it returns an empty array rather than failing.
 */
export async function getAttachmentGrantsSafely(
  attachmentId: bigint | number,
): Promise<AttachmentDepartmentGrantRecord[]> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const grants = await prisma.attachment_department_grants.findMany({
      where: { attachment_id: BigInt(attachmentId) },
    });
    return grants.map((g) => ({
      grant_id: g.grant_id,
      attachment_id: g.attachment_id,
      department_id: g.department_id,
      granted_by: g.granted_by,
      granted_at: g.granted_at,
    }));
  } catch {
    return [];
  }
}
