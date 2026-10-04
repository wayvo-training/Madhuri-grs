import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@/lib/auth";

export interface CommunicationParticipant {
  id: string;
  name: string;
  email?: string;
  role: "End User" | "Staff" | "Department Head" | "Admin";
  departmentName?: string;
  involvementType?: "PRIMARY" | "SUPPORTING" | "EQUAL";
  isPrimary?: boolean;
}

export interface CommunicationMessageItem {
  id: string;
  author: string;
  authorUserId?: string;
  role: "End User" | "Staff" | "Department Head" | "Admin" | "System";
  department?: string;
  timestamp: string;
  message: string;
  attachments: {
    name: string;
    path?: string;
    size?: string;
  }[];
  isStaffOrHead: boolean;
  type: "SUBMISSION" | "REQUEST" | "RESPONSE" | "RESOLUTION" | "REVIEW" | "MESSAGE";
}

export interface CommunicationConversationSummary {
  id: string;
  grievanceNumber: string;
  title: string;
  status: string;
  communicationState: string;
  lastMessagePreview: string;
  sender: string;
  lastUpdated: string;
  timestamp: string;
  filterCategory: "ACTION_REQUIRED" | "RESPONSES" | "UPDATES" | "ALL";
  hasAttachments: boolean;
  isUnread: boolean;
}

export interface GrievanceCommunicationThreadData {
  grievanceId: string;
  grievanceNumber: string;
  title: string;
  categoryName: string;
  subcategoryName: string;
  status: string;
  isClosed: boolean;
  participants: CommunicationParticipant[];
  participantsSummary: string;
  timeline: CommunicationMessageItem[];
  canSend: boolean;
  closureNote: string | null;
  actionUrl: string;
  actionLabel: string;
  userRole: string;
  currentUserId: string;
}

const TEST_MESSAGE_REGEX = /^(hi|hello|hey|test|testing|asdf|qwerty)$/i;

function isTestMessage(text: string): boolean {
  return TEST_MESSAGE_REGEX.test(text.trim());
}

/**
 * Fetches all grievance conversations accessible by the logged-in user.
 */
export async function getUserGrievanceConversations(
  user: AuthUser,
  basePath: string,
): Promise<CommunicationConversationSummary[]> {
  const userRole = user.roles.role_name;
  const userId = BigInt(user.user_id);
  const deptId = user.department_id ? BigInt(user.department_id) : null;

  let whereClause: Prisma.grievancesWhereInput = {};

  if (userRole === "END_USER") {
    whereClause = { submitted_by: userId };
  } else if (userRole === "STAFF") {
    let deptGrievanceIds: bigint[] = [];
    if (deptId) {
      const deptLinks = await prisma.grievance_departments.findMany({
        where: { department_id: deptId },
        select: { grievance_id: true },
      });
      deptGrievanceIds = deptLinks.map((d) => d.grievance_id);
    }

    whereClause = {
      OR: [
        { assignments: { some: { staff_id: userId } } },
        ...(deptGrievanceIds.length > 0
          ? [{ grievance_id: { in: deptGrievanceIds } }]
          : []),
      ],
    };
  } else if (userRole === "DEPARTMENT_HEAD") {
    if (deptId) {
      const deptLinks = await prisma.grievance_departments.findMany({
        where: { department_id: deptId },
        select: { grievance_id: true },
      });
      const deptGrievanceIds = deptLinks.map((d) => d.grievance_id);
      whereClause = {
        grievance_id: { in: deptGrievanceIds },
      };
    } else {
      whereClause = {};
    }
  } else if (userRole === "ADMIN") {
    whereClause = {};
  } else {
    return [];
  }

  const grievances = await prisma.grievances.findMany({
    where: whereClause,
    include: {
      categories: { select: { category_name: true } },
      subcategories: { select: { subcategory_name: true } },
      users: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
        },
      },
      audit_logs: {
        where: {
          action: {
            in: [
              "ADDITIONAL_INFO_REQUESTED",
              "USER_INFO_SUBMITTED",
              "USER_ADDITIONAL_INFO_PROVIDED",
              "COMMUNICATION_MESSAGE",
              "RESOLUTION_ACCEPTED",
              "GRIEVANCE_REOPENED",
            ],
          },
        },
        orderBy: { created_at: "desc" },
        take: 3,
        include: {
          users: {
            select: {
              first_name: true,
              last_name: true,
              roles: { select: { role_name: true } },
            },
          },
        },
      },
      resolutions: {
        orderBy: { submitted_at: "desc" },
        take: 1,
        include: {
          users: {
            select: {
              first_name: true,
              last_name: true,
              roles: { select: { role_name: true } },
            },
          },
        },
      },
    },
    orderBy: { updated_at: "desc" },
    take: 100,
  });

  return grievances.map((g) => {
    const endUserName = g.users
      ? `${g.users.first_name} ${g.users.last_name || ""}`.trim()
      : "End User";

    const latestAudit = g.audit_logs[0];
    const latestResolution = g.resolutions[0];

    let latestEvent: {
      type: "AUDIT" | "RESOLUTION";
      timestamp: Date;
      sender: string;
      preview: string;
      communicationState: string;
      filterCategory: "ACTION_REQUIRED" | "RESPONSES" | "UPDATES" | "ALL";
      hasAttachments: boolean;
      action?: string;
    } | null = null;

    if (latestAudit && latestResolution) {
      if (latestAudit.created_at > latestResolution.submitted_at) {
        latestEvent = formatAuditEvent(latestAudit, endUserName, g.status);
      } else {
        latestEvent = formatResolutionEvent(latestResolution, g.status);
      }
    } else if (latestAudit) {
      latestEvent = formatAuditEvent(latestAudit, endUserName, g.status);
    } else if (latestResolution) {
      latestEvent = formatResolutionEvent(latestResolution, g.status);
    }

    if (!latestEvent) {
      const isClosed = g.status === "CLOSED";
      latestEvent = {
        type: "AUDIT",
        timestamp: g.created_at,
        sender: endUserName,
        preview: "Grievance submitted. Initial review is required.",
        communicationState: isClosed ? "Case Closed" : "Investigation in Progress",
        filterCategory: "UPDATES",
        hasAttachments: false,
      };
    }

    const formattedDate = new Date(latestEvent.timestamp).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    return {
      id: g.grievance_id.toString(),
      grievanceNumber: g.grievance_number,
      title: g.title,
      status: g.status,
      communicationState: latestEvent.communicationState,
      lastMessagePreview: latestEvent.preview,
      sender: latestEvent.sender,
      lastUpdated: formattedDate,
      timestamp: latestEvent.timestamp.toISOString(),
      filterCategory: latestEvent.filterCategory,
      hasAttachments: latestEvent.hasAttachments,
      isUnread: latestEvent.filterCategory === "ACTION_REQUIRED",
    };
  });
}

function formatAuditEvent(
  audit: {
    action: string;
    created_at: Date;
    new_value: unknown;
    users?: { first_name: string; last_name: string | null; roles?: { role_name: string } | null } | null;
  },
  endUserName: string,
  grievanceStatus: string,
) {
  const val = audit.new_value as {
    message?: string;
    response?: string;
    author?: string;
    uploadedFiles?: string[];
    requestedDocs?: string[];
  } | null;

  const actorName = audit.users
    ? `${audit.users.first_name} ${audit.users.last_name || ""}`.trim()
    : val?.author || "Participant";

  if (audit.action === "ADDITIONAL_INFO_REQUESTED") {
    const rawMsg = val?.message || "Please provide additional details regarding this grievance.";
    return {
      type: "AUDIT" as const,
      timestamp: audit.created_at,
      sender: actorName,
      preview: isTestMessage(rawMsg)
        ? "Requested additional supporting details for verification."
        : rawMsg,
      communicationState:
        grievanceStatus === "CLOSED" ? "Case Closed" : "Action Required",
      filterCategory: "ACTION_REQUIRED" as const,
      hasAttachments: (val?.requestedDocs?.length ?? 0) > 0,
      action: audit.action,
    };
  }

  if (
    audit.action === "USER_INFO_SUBMITTED" ||
    audit.action === "USER_ADDITIONAL_INFO_PROVIDED"
  ) {
    const rawMsg = val?.response || val?.message || "Additional information submitted.";
    return {
      type: "AUDIT" as const,
      timestamp: audit.created_at,
      sender: endUserName,
      preview: isTestMessage(rawMsg)
        ? "Clarifications and documents submitted for case review."
        : rawMsg,
      communicationState: "Response Submitted",
      filterCategory: "RESPONSES" as const,
      hasAttachments: (val?.uploadedFiles?.length ?? 0) > 0,
      action: audit.action,
    };
  }

  if (audit.action === "COMMUNICATION_MESSAGE") {
    const rawMsg = val?.message || "Communication update posted.";
    return {
      type: "AUDIT" as const,
      timestamp: audit.created_at,
      sender: actorName,
      preview: isTestMessage(rawMsg) ? "Update posted regarding this grievance." : rawMsg,
      communicationState: "Update Posted",
      filterCategory: "UPDATES" as const,
      hasAttachments: false,
      action: audit.action,
    };
  }

  if (audit.action === "RESOLUTION_ACCEPTED") {
    return {
      type: "AUDIT" as const,
      timestamp: audit.created_at,
      sender: endUserName,
      preview: "Resolution accepted by citizen. The case is now officially closed.",
      communicationState: "Case Closed",
      filterCategory: "UPDATES" as const,
      hasAttachments: false,
      action: audit.action,
    };
  }

  return {
    type: "AUDIT" as const,
    timestamp: audit.created_at,
    sender: actorName,
    preview: val?.message || "Case communication update.",
    communicationState: "Case Updated",
    filterCategory: "UPDATES" as const,
    hasAttachments: false,
    action: audit.action,
  };
}

function formatResolutionEvent(
  res: {
    submitted_at: Date;
    action_taken?: string | null;
    problem_summary?: string | null;
    users?: { first_name: string; last_name: string | null } | null;
  },
  grievanceStatus: string,
) {
  const staffName = res.users
    ? `${res.users.first_name} ${res.users.last_name || ""}`.trim()
    : "Staff Member";

  const isClosed = grievanceStatus === "CLOSED";

  return {
    type: "RESOLUTION" as const,
    timestamp: res.submitted_at,
    sender: staffName,
    preview:
      "Investigation has been completed and the resolution has been submitted for your review.",
    communicationState: isClosed ? "Case Closed" : "Resolution Ready for Review",
    filterCategory: "UPDATES" as const,
    hasAttachments: false,
  };
}

/**
 * Fetches the complete communication thread for a specific grievance with RBAC validation.
 */
export async function getGrievanceCommunicationThread(
  grievanceId: number,
  user: AuthUser,
  basePath: string,
): Promise<GrievanceCommunicationThreadData | null> {
  const userRole = user.roles.role_name;
  const userId = BigInt(user.user_id);
  const deptId = user.department_id ? BigInt(user.department_id) : null;

  // 1. Fetch grievance with all relations
  const grievance = await prisma.grievances.findUnique({
    where: { grievance_id: BigInt(grievanceId) },
    include: {
      categories: { select: { category_name: true } },
      subcategories: { select: { subcategory_name: true } },
      users: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
          departments: { select: { department_name: true } },
        },
      },
      assignments: {
        where: { assignment_status: { in: ["ASSIGNED", "COMPLETED"] } },
        include: {
          users_assignments_staff_idTousers: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              email: true,
              roles: { select: { role_name: true } },
              departments: { select: { department_name: true } },
            },
          },
        },
      },
      audit_logs: {
        where: {
          action: {
            in: [
              "ADDITIONAL_INFO_REQUESTED",
              "USER_INFO_SUBMITTED",
              "USER_ADDITIONAL_INFO_PROVIDED",
              "COMMUNICATION_MESSAGE",
              "RESOLUTION_ACCEPTED",
              "GRIEVANCE_REOPENED",
            ],
          },
        },
        orderBy: { created_at: "asc" },
        include: {
          users: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              roles: { select: { role_name: true } },
              departments: { select: { department_name: true } },
            },
          },
        },
      },
      resolutions: {
        orderBy: { submitted_at: "asc" },
        include: {
          users: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              roles: { select: { role_name: true } },
              departments: { select: { department_name: true } },
            },
          },
          resolution_reviews: {
            orderBy: { reviewed_at: "asc" },
            include: {
              users: {
                select: {
                  user_id: true,
                  first_name: true,
                  last_name: true,
                  roles: { select: { role_name: true } },
                  departments: { select: { department_name: true } },
                },
              },
            },
          },
        },
      },
      attachments: {
        orderBy: { uploaded_at: "asc" },
        select: {
          attachment_id: true,
          file_name: true,
          file_path: true,
          file_size: true,
          uploaded_by: true,
        },
      },
    },
  });

  if (!grievance) return null;

  const involvedDepartments = await prisma.grievance_departments.findMany({
    where: { grievance_id: BigInt(grievanceId) },
    include: {
      departments: {
        select: {
          department_id: true,
          department_name: true,
        },
      },
    },
  });

  // 2. Enforce RBAC visibility strictly
  const isSubmitter = grievance.submitted_by === userId;
  const isAssignedStaff = grievance.assignments.some((a) => a.staff_id === userId);
  const isInvolvedDepartment = deptId
    ? involvedDepartments.some((gd) => gd.department_id === deptId)
    : false;
  const isAdmin = userRole === "ADMIN";

  if (userRole === "END_USER" && !isSubmitter) {
    return null;
  }
  if (userRole === "STAFF" && !isAssignedStaff && !isInvolvedDepartment && !isAdmin) {
    return null;
  }
  if (userRole === "DEPARTMENT_HEAD" && !isInvolvedDepartment && !isAdmin) {
    return null;
  }

  // 3. Collect Participants across all involved departments (Single or Collaborative)
  const participantsMap = new Map<string, CommunicationParticipant>();

  // End User
  if (grievance.users) {
    const endUserName = `${grievance.users.first_name} ${grievance.users.last_name || ""}`.trim();
    participantsMap.set(grievance.users.user_id.toString(), {
      id: grievance.users.user_id.toString(),
      name: endUserName,
      email: grievance.users.email,
      role: "End User",
      departmentName: grievance.users.departments?.department_name,
    });
  }

  // Assigned Staff from all departments
  for (const a of grievance.assignments) {
    const staff = a.users_assignments_staff_idTousers;
    if (staff) {
      const staffName = `${staff.first_name} ${staff.last_name || ""}`.trim();
      participantsMap.set(staff.user_id.toString(), {
        id: staff.user_id.toString(),
        name: staffName,
        email: staff.email,
        role: "Staff",
        departmentName: staff.departments?.department_name,
      });
    }
  }

  // Department Heads of involved departments
  const involvedDeptIds = involvedDepartments.map((gd) => gd.department_id);
  if (involvedDeptIds.length > 0) {
    const departmentHeads = await prisma.users.findMany({
      where: {
        department_id: { in: involvedDeptIds },
        roles: { role_name: "DEPARTMENT_HEAD" },
        status: "ACTIVE",
      },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        email: true,
        departments: { select: { department_name: true } },
      },
    });

    for (const dh of departmentHeads) {
      const headName = `${dh.first_name} ${dh.last_name || ""}`.trim();
      participantsMap.set(dh.user_id.toString(), {
        id: dh.user_id.toString(),
        name: headName,
        email: dh.email,
        role: "Department Head",
        departmentName: dh.departments?.department_name,
      });
    }
  }

  const participantsList = Array.from(participantsMap.values());
  const participantsSummary = participantsList.map((p) => p.name).join(" · ");

  // 4. Assemble Chronological Timeline
  const endUserName = grievance.users
    ? `${grievance.users.first_name} ${grievance.users.last_name || ""}`.trim()
    : "End User";

  const timeline: CommunicationMessageItem[] = [];

  // Milestone 1: Grievance Submission
  timeline.push({
    id: `submission-${grievance.grievance_id}`,
    author: endUserName,
    authorUserId: grievance.users?.user_id.toString(),
    role: "End User",
    department: grievance.users?.departments?.department_name,
    timestamp: grievance.created_at.toISOString(),
    message: "Grievance submitted. Initial review is required.",
    attachments: [],
    isStaffOrHead: false,
    type: "SUBMISSION",
  });

  // Milestone 2: Audit log communications
  for (const log of grievance.audit_logs) {
    const val = log.new_value as {
      message?: string;
      response?: string;
      author?: string;
      requestedDocs?: string[];
      uploadedFiles?: string[];
    } | null;

    const actor = log.users;
    const dbRole = actor?.roles?.role_name || "STAFF";
    const actorRole: "Staff" | "Department Head" | "End User" =
      dbRole === "DEPARTMENT_HEAD"
        ? "Department Head"
        : dbRole === "STAFF"
          ? "Staff"
          : "End User";

    const actorName = actor
      ? `${actor.first_name} ${actor.last_name || ""}`.trim()
      : val?.author || (log.action === "USER_INFO_SUBMITTED" ? endUserName : "Staff Member");

    let rawMessage = val?.message || val?.response || "";
    if (isTestMessage(rawMessage)) {
      if (log.action === "ADDITIONAL_INFO_REQUESTED") {
        rawMessage = "Requested clarifying information and relevant documents.";
      } else if (log.action === "USER_INFO_SUBMITTED") {
        rawMessage = "Clarifications and documents submitted for case review.";
      } else {
        continue;
      }
    }

    if (!rawMessage.trim()) continue;

    const attachmentsList: { name: string; path?: string }[] = [];
    if (val?.uploadedFiles && Array.isArray(val.uploadedFiles)) {
      for (const f of val.uploadedFiles) {
        attachmentsList.push({ name: f });
      }
    }
    if (val?.requestedDocs && Array.isArray(val.requestedDocs)) {
      for (const d of val.requestedDocs) {
        attachmentsList.push({ name: d });
      }
    }

    if (log.action === "ADDITIONAL_INFO_REQUESTED") {
      timeline.push({
        id: `audit-${log.audit_log_id}`,
        author: actorName,
        authorUserId: actor?.user_id.toString(),
        role: actorRole === "Department Head" ? "Department Head" : "Staff",
        department: actor?.departments?.department_name,
        timestamp: log.created_at.toISOString(),
        message: rawMessage,
        attachments: attachmentsList,
        isStaffOrHead: true,
        type: "REQUEST",
      });
    } else if (
      log.action === "USER_INFO_SUBMITTED" ||
      log.action === "USER_ADDITIONAL_INFO_PROVIDED"
    ) {
      timeline.push({
        id: `audit-${log.audit_log_id}`,
        author: endUserName,
        authorUserId: grievance.users?.user_id.toString(),
        role: "End User",
        department: grievance.users?.departments?.department_name,
        timestamp: log.created_at.toISOString(),
        message: rawMessage,
        attachments: attachmentsList,
        isStaffOrHead: false,
        type: "RESPONSE",
      });
    } else if (log.action === "COMMUNICATION_MESSAGE") {
      const isStaff = dbRole === "STAFF" || dbRole === "DEPARTMENT_HEAD";
      timeline.push({
        id: `audit-${log.audit_log_id}`,
        author: actorName,
        authorUserId: actor?.user_id.toString(),
        role: actorRole,
        department: actor?.departments?.department_name,
        timestamp: log.created_at.toISOString(),
        message: rawMessage,
        attachments: attachmentsList,
        isStaffOrHead: isStaff,
        type: "MESSAGE",
      });
    } else if (log.action === "RESOLUTION_ACCEPTED") {
      timeline.push({
        id: `audit-${log.audit_log_id}`,
        author: endUserName,
        authorUserId: grievance.users?.user_id.toString(),
        role: "End User",
        department: grievance.users?.departments?.department_name,
        timestamp: log.created_at.toISOString(),
        message: "Resolution accepted. Case officially closed.",
        attachments: [],
        isStaffOrHead: false,
        type: "RESPONSE",
      });
    } else if (log.action === "GRIEVANCE_REOPENED") {
      timeline.push({
        id: `audit-${log.audit_log_id}`,
        author: endUserName,
        authorUserId: grievance.users?.user_id.toString(),
        role: "End User",
        department: grievance.users?.departments?.department_name,
        timestamp: log.created_at.toISOString(),
        message: rawMessage || "Resolution rejected by employee. Grievance has been reopened for reinvestigation.",
        attachments: [],
        isStaffOrHead: false,
        type: "RESPONSE",
      });
    }
  }

  // Milestone 3: Resolutions & Reviews
  for (const res of grievance.resolutions) {
    const staffAuthor = res.users
      ? `${res.users.first_name} ${res.users.last_name || ""}`.trim()
      : "Staff Member";

    timeline.push({
      id: `res-${res.resolution_id}`,
      author: staffAuthor,
      authorUserId: res.users?.user_id.toString(),
      role: "Staff",
      department: res.users?.departments?.department_name,
      timestamp: res.submitted_at.toISOString(),
      message:
        "Investigation has been completed and the resolution has been submitted for your review.",
      attachments: [],
      isStaffOrHead: true,
      type: "RESOLUTION",
    });

    for (const review of res.resolution_reviews || []) {
      const reviewer = review.users;
      const headName = reviewer
        ? `${reviewer.first_name} ${reviewer.last_name || ""}`.trim()
        : "Department Head";

      timeline.push({
        id: `review-${review.review_id}`,
        author: headName,
        authorUserId: reviewer?.user_id.toString(),
        role: "Department Head",
        department: reviewer?.departments?.department_name,
        timestamp: review.reviewed_at.toISOString(),
        message:
          review.decision === "REJECTED"
            ? review.rejection_reason || "Rework required for the submitted resolution."
            : "The resolution has been reviewed and is available for your response.",
        attachments: [],
        isStaffOrHead: true,
        type: "REVIEW",
      });
    }
  }

  // Sort timeline chronologically
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const isClosed = grievance.status === "CLOSED";

  // Composer permissions
  let canSend = false;
  let closureNote: string | null = null;

  if (isClosed) {
    canSend = false;
    closureNote = "This grievance is closed. Historical communication remains available for reference.";
  } else if (isAdmin) {
    canSend = false;
    closureNote = "You have governance read-only visibility for this grievance communication.";
  } else if (userRole === "END_USER") {
    // Turn-based policy: End user can only submit info/docs if status is WAITING_ON_USER or the latest message/action is from Staff/Head
    const communicationEvents = timeline.filter((t) => t.id !== `submission-${grievance.grievance_id}`);
    const lastEvent = communicationEvents.length > 0 ? communicationEvents[communicationEvents.length - 1] : null;

    if (grievance.status === "WAITING_ON_USER" || grievance.status === "WAITING_ON_EMPLOYEE") {
      canSend = true;
    } else if (lastEvent && lastEvent.isStaffOrHead) {
      canSend = true;
    } else if (!lastEvent) {
      canSend = false;
      closureNote = "You will be able to submit additional documents or messages once an assigned staff member or department head contacts you.";
    } else {
      canSend = false;
      closureNote = "Your response has been submitted. Awaiting next response from staff or department head before further messages or documents can be sent.";
    }
  } else if (isSubmitter || isAssignedStaff || isInvolvedDepartment) {
    canSend = true;
  }

  // Action button routing
  let actionUrl = `/staff/dashboard`;
  let actionLabel = "Open in Staff Dashboard";

  if (userRole === "END_USER") {
    actionUrl = `/end-user/grievances/${grievance.grievance_id}`;
    actionLabel = "View Grievance Details";
  } else if (userRole === "DEPARTMENT_HEAD") {
    actionUrl = `/department-head/grievances`;
    actionLabel = "Open in Head Dashboard";
  } else if (userRole === "ADMIN") {
    actionUrl = `/admin/grievances`;
    actionLabel = "View Grievance Details";
  }

  return {
    grievanceId: grievance.grievance_id.toString(),
    grievanceNumber: grievance.grievance_number,
    title: grievance.title,
    categoryName: grievance.categories?.category_name || "General",
    subcategoryName: grievance.subcategories?.subcategory_name || "General",
    status: grievance.status,
    isClosed,
    participants: participantsList,
    participantsSummary,
    timeline,
    canSend,
    closureNote,
    actionUrl,
    actionLabel,
    userRole,
    currentUserId: userId.toString(),
  };
}

export async function canEndUserSubmitCommunication(
  grievanceId: bigint | number,
): Promise<{ allowed: boolean; reason?: string }> {
  const gId = BigInt(grievanceId);
  const grievance = await prisma.grievances.findUnique({
    where: { grievance_id: gId },
    select: {
      status: true,
      audit_logs: {
        where: {
          action: {
            in: [
              "ADDITIONAL_INFO_REQUESTED",
              "USER_INFO_SUBMITTED",
              "USER_ADDITIONAL_INFO_PROVIDED",
              "COMMUNICATION_MESSAGE",
              "RESOLUTION_ACCEPTED",
              "GRIEVANCE_REOPENED",
            ],
          },
        },
        orderBy: { created_at: "desc" },
        take: 1,
        include: {
          users: {
            select: {
              roles: { select: { role_name: true } },
            },
          },
        },
      },
      resolutions: {
        orderBy: { submitted_at: "desc" },
        take: 1,
        select: {
          submitted_at: true,
        },
      },
    },
  });

  if (!grievance) {
    return { allowed: false, reason: "Grievance not found." };
  }

  if (grievance.status === "CLOSED") {
    return {
      allowed: false,
      reason: "This grievance is closed. Historical communication remains available for reference.",
    };
  }

  if (grievance.status === "WAITING_ON_USER" || grievance.status === "WAITING_ON_EMPLOYEE") {
    return { allowed: true };
  }

  const latestAudit = grievance.audit_logs[0];
  const latestResolution = grievance.resolutions[0];

  if (!latestAudit && !latestResolution) {
    return {
      allowed: false,
      reason: "You can submit additional documents or messages once an assigned staff member or department head contacts you.",
    };
  }

  let isLatestFromStaffOrHead = false;
  if (latestResolution && (!latestAudit || latestResolution.submitted_at > latestAudit.created_at)) {
    isLatestFromStaffOrHead = true;
  } else if (latestAudit) {
    const role = latestAudit.users?.roles?.role_name;
    if (
      latestAudit.action === "ADDITIONAL_INFO_REQUESTED" ||
      role === "STAFF" ||
      role === "DEPARTMENT_HEAD"
    ) {
      isLatestFromStaffOrHead = true;
    }
  }

  if (isLatestFromStaffOrHead) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Your response has been submitted. Awaiting next response from staff or department head before further messages or documents can be sent.",
  };
}
