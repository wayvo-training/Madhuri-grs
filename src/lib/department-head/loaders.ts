import type { Prisma } from "@prisma/client";
import { filterAuthorizedAttachments } from "@/lib/attachments/access-control";
import type { AuthUser } from "@/lib/auth";
import {
  formatFriendlyDate,
  formatRelativeTime,
  formatSlaTimeLeft,
} from "@/lib/department-head";
import { canDepartmentSubmitFinalResolution } from "@/lib/engines/routing-engine";
import {
  calculateDepartmentSlaConsumption,
  calculateSlaConsumption,
} from "@/lib/engines/sla-engine";
import { prisma } from "@/lib/prisma";
import { getPrimaryDepartment } from "@/lib/utils/grievance-departments";
import type {
  EscalationAuditRecord,
  GrievanceItem,
  StaffMember,
  SupportingDepartmentFinding,
} from "@/types/department-head";

function formatAuditEntryDetails(action: string, newValue: unknown): string {
  if (!newValue) return "Action recorded during grievance processing.";

  let parsed: unknown = newValue;
  if (typeof newValue === "string") {
    const trimmed = newValue.trim();
    if (trimmed.startsWith("{")) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = trimmed;
      }
    } else {
      return trimmed;
    }
  }

  if (typeof parsed === "object" && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    if (obj.details && typeof obj.details === "string") return obj.details;
    if (obj.note && typeof obj.note === "string") return obj.note;
    if (obj.remarks && typeof obj.remarks === "string") return obj.remarks;
    if (obj.outcome && typeof obj.outcome === "string")
      return String(obj.outcome);

    const act = action.toUpperCase();

    if (
      act.includes("SLA_100") ||
      act.includes("BREACH") ||
      obj.newStatus === "ESCALATED"
    ) {
      const escalatedTo = obj.escalatedTo
        ? ` to ${obj.escalatedTo}`
        : " to Department Head";
      return `SLA resolution deadline elapsed. Case automatically escalated${escalatedTo} for intervention directives.`;
    }

    if (
      act.includes("SLA_75") ||
      act.includes("AT_RISK") ||
      obj.slaStatus === "AT_RISK"
    ) {
      return "SLA reached 75% elapsed warning threshold. Department Head notified for proactive review.";
    }

    if (act.includes("ROUTE") || obj.status === "ROUTED") {
      return "Grievance triaged and successfully routed to department queue.";
    }

    if (act.includes("CREATE") || obj.status === "SUBMITTED") {
      const prio = obj.priority ? ` with ${obj.priority} priority` : "";
      return `Grievance registered and submitted by complainant${prio}.`;
    }

    if (act.includes("ASSIGN") || obj.staff_id) {
      return "Case assigned to designated department officer for inquiry and investigation.";
    }

    if (act.includes("SUBMIT_RESOLUTION")) {
      return "Investigating officer submitted resolution findings.";
    }

    if (act.includes("RESOLUTION") && obj.decision) {
      return `Resolution review decided: ${obj.decision}.`;
    }

    const summary = Object.entries(obj)
      .filter(
        ([k, v]) =>
          typeof v !== "object" &&
          v !== null &&
          v !== undefined &&
          k !== "threshold",
      )
      .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").toLowerCase()}: ${v}`)
      .join(" • ");
    if (summary) return summary;
  }

  return String(newValue || "Action recorded.");
}

export interface FetchGrievancesOptions {
  departmentId: bigint;
  user: AuthUser;
  isAdmin: boolean;
  tab?: string;
  search?: string;
  priority?: string;
  staffId?: string;
  skip?: number;
  limit?: number;
}

export async function fetchDepartmentHeadGrievances(
  options: FetchGrievancesOptions,
) {
  const {
    departmentId,
    user,
    isAdmin,
    tab = "ALL",
    search = "",
    priority = "ALL",
    staffId = "ALL",
    skip,
    limit,
  } = options;

  const conditions: Prisma.grievancesWhereInput[] = [
    {
      grievance_departments: {
        some: {
          department_id: departmentId,
        },
      },
    },
  ];

  if (priority !== "ALL") {
    conditions.push({ priority });
  }

  if (search) {
    conditions.push({
      OR: [
        { grievance_number: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        {
          users: {
            OR: [
              { first_name: { contains: search, mode: "insensitive" } },
              { last_name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          categories: {
            category_name: { contains: search, mode: "insensitive" },
          },
        },
      ],
    });
  }

  if (staffId === "UNASSIGNED") {
    conditions.push({
      assignments: {
        none: {
          assignment_status: "ASSIGNED",
          grievance_departments: { department_id: departmentId },
        },
      },
    });
  } else if (staffId !== "ALL") {
    try {
      const staffBigInt = BigInt(staffId);
      conditions.push({
        assignments: {
          some: {
            staff_id: staffBigInt,
            assignment_status: "ASSIGNED",
            grievance_departments: { department_id: departmentId },
          },
        },
      });
    } catch {
      // invalid staffId
    }
  }

  if (tab === "UNASSIGNED") {
    conditions.push({
      OR: [
        {
          assignments: {
            none: {
              assignment_status: "ASSIGNED",
              grievance_departments: { department_id: departmentId },
            },
          },
        },
        { status: "SUBMITTED" },
        { status: "ROUTED" },
      ],
    });
  } else if (tab === "IN_PROGRESS") {
    conditions.push({
      status: { in: ["ASSIGNED", "IN_PROGRESS"] },
    });
  } else if (tab === "HIGH_CRITICAL") {
    conditions.push({
      priority: { in: ["HIGH", "CRITICAL"] },
    });
  } else if (tab === "AT_RISK") {
    conditions.push({
      sla_status: "AT_RISK",
      status: { notIn: ["ESCALATED", "CLOSED", "RESOLVED"] },
    });
  } else if (tab === "ESCALATED") {
    conditions.push({
      status: "ESCALATED",
    });
  } else if (tab === "REOPENED") {
    conditions.push({
      OR: [
        { reopen_count: { gt: 0 } },
        { status: { in: ["REOPENED", "REOPEN_REVIEW"] } },
      ],
    });
  } else if (tab === "RESOLUTION_REVIEW") {
    conditions.push({
      status: "UNDER_REVIEW",
    });
  } else if (tab === "CLOSED") {
    conditions.push({
      status: { in: ["CLOSED", "RESOLVED"] },
    });
  }

  const where: Prisma.grievancesWhereInput = { AND: conditions };

  const [rawGrievances, total] = await Promise.all([
    prisma.grievances.findMany({
      where,
      include: {
        users: {
          include: { roles: true },
        },
        categories: true,
        subcategories: true,
        grievance_departments: {
          include: {
            departments: true,
            assignments: {
              where: { assignment_status: { in: ["ASSIGNED", "COMPLETED"] } },
              include: {
                users_assignments_staff_idTousers: {
                  include: { roles: true },
                },
              },
            },
          },
        },
        assignments: {
          where: {
            assignment_status: { in: ["ASSIGNED", "COMPLETED"] },
            grievance_departments: { department_id: departmentId },
          },
          include: {
            users_assignments_staff_idTousers: {
              include: { roles: true },
            },
          },
          orderBy: { assigned_at: "desc" },
          take: 1,
        },
        escalations: {
          orderBy: { created_at: "desc" },
          take: 1,
          include: { users: true },
        },
        resolutions: {
          orderBy: { submitted_at: "desc" },
          take: 5,
          include: {
            users: {
              include: { roles: true, departments: true },
            },
            knowledge_articles: {
              select: { article_id: true },
            },
            attachments: true,
          },
        },
        attachments: true,
        audit_logs: {
          orderBy: { created_at: "desc" },
          include: {
            users: { include: { roles: true } },
          },
          take: 15,
        },
      },
      orderBy: [{ priority: "desc" }, { created_at: "desc" }],
      ...(skip !== undefined ? { skip } : {}),
      ...(limit !== undefined ? { take: limit } : {}),
    }),
    prisma.grievances.count({ where }),
  ]);

  const gIds = rawGrievances.map((g) => g.grievance_id);
  const [allDeptRecords, allAssignments] = await Promise.all([
    prisma.grievance_departments.findMany({
      where: { grievance_id: { in: gIds } },
      include: { departments: true },
    }),
    prisma.assignments.findMany({
      where: {
        grievance_id: { in: gIds },
        assignment_status: { in: ["ASSIGNED", "COMPLETED"] },
      },
      include: {
        users_assignments_staff_idTousers: {
          include: { roles: true },
        },
        grievance_departments: { include: { departments: true } },
      },
      orderBy: { assigned_at: "desc" },
    }),
  ]);

  const items: GrievanceItem[] = rawGrievances.map((g) => {
    const grievanceAssignments = allAssignments.filter(
      (a) => a.grievance_id === g.grievance_id,
    );

    const relatedDepts = allDeptRecords.filter(
      (d) => d.grievance_id === g.grievance_id,
    );
    const myDeptRecord = departmentId
      ? relatedDepts.find(
          (d) => BigInt(d.department_id) === BigInt(departmentId),
        )
      : null;

    const isDeptPendingAssignment =
      myDeptRecord?.status === "PENDING_ASSIGNMENT" ||
      g.status === "SUBMITTED" ||
      g.status === "ROUTED" ||
      (g.status === "REOPENED" &&
        myDeptRecord?.status === "PENDING_ASSIGNMENT");

    const myDeptAssignment = departmentId
      ? isDeptPendingAssignment
        ? null
        : grievanceAssignments.find(
            (a) =>
              a.grievance_departments?.department_id &&
              BigInt(a.grievance_departments.department_id) ===
                BigInt(departmentId) &&
              a.assignment_status === "ASSIGNED",
          ) || null
      : null;

    const activeAssignment = departmentId
      ? myDeptAssignment
      : isDeptPendingAssignment
        ? null
        : grievanceAssignments.find(
            (a) => a.assignment_status === "ASSIGNED",
          ) ||
          (g.assignments && g.assignments[0]?.assignment_status === "ASSIGNED"
            ? g.assignments[0]
            : null);
    const assignedStaff =
      activeAssignment?.users_assignments_staff_idTousers || null;

    const latestEscalation = g.escalations[0];
    const latestResolution = g.resolutions[0];

    let resolvedAssignedStaffName: string | null = null;
    if (departmentId) {
      if (
        myDeptRecord?.status === "PENDING_ASSIGNMENT" ||
        isDeptPendingAssignment
      ) {
        resolvedAssignedStaffName = "Unassigned";
      } else if (myDeptRecord?.status === "BLOCKED") {
        resolvedAssignedStaffName = "Blocked";
      } else if (myDeptAssignment) {
        const myStaff = myDeptAssignment.users_assignments_staff_idTousers;
        resolvedAssignedStaffName =
          `${myStaff.first_name} ${myStaff.last_name || ""}`.trim();
      } else if (
        ["CLOSED", "RESOLVED"].includes(g.status) &&
        (latestResolution?.users ||
          grievanceAssignments[0]?.users_assignments_staff_idTousers)
      ) {
        if (latestResolution?.users) {
          const resolver = latestResolution.users;
          const role = resolver.roles?.role_name;
          resolvedAssignedStaffName =
            role === "DEPARTMENT_HEAD"
              ? `${resolver.first_name} ${resolver.last_name || ""}`.trim() +
                " (Head)"
              : `${resolver.first_name} ${resolver.last_name || ""}`.trim();
        } else {
          const otherStaff =
            grievanceAssignments[0].users_assignments_staff_idTousers;
          resolvedAssignedStaffName =
            `${otherStaff.first_name} ${otherStaff.last_name || ""}`.trim();
        }
      } else {
        resolvedAssignedStaffName = "Unassigned";
      }
    } else {
      if (isDeptPendingAssignment) {
        resolvedAssignedStaffName = "Unassigned";
      } else if (assignedStaff) {
        resolvedAssignedStaffName =
          `${assignedStaff.first_name} ${assignedStaff.last_name || ""}`.trim();
      } else if (
        ["CLOSED", "RESOLVED"].includes(g.status) &&
        grievanceAssignments.length > 0
      ) {
        resolvedAssignedStaffName = grievanceAssignments
          .map((a) =>
            `${a.users_assignments_staff_idTousers.first_name} ${a.users_assignments_staff_idTousers.last_name || ""}`.trim(),
          )
          .join(", ");
      } else {
        resolvedAssignedStaffName = "Unassigned";
      }
    }

    const parseLogVal = (
      l: (typeof g.audit_logs)[0],
    ): Record<string, unknown> => {
      if (typeof l.new_value === "string") {
        try {
          return JSON.parse(l.new_value);
        } catch {
          return { note: l.new_value };
        }
      } else if (l.new_value && typeof l.new_value === "object") {
        return l.new_value as Record<string, unknown>;
      }
      return {};
    };

    const formatLogNote = (
      l: (typeof g.audit_logs)[0],
      val: Record<string, unknown>,
    ) => {
      const u = l.users;
      const uRole = u?.roles?.role_name;
      const roleDisplay =
        (val?.role as string) ||
        (uRole === "DEPARTMENT_HEAD"
          ? "Department Head"
          : uRole === "STAFF"
            ? "Staff"
            : uRole || "Staff");
      const rawName = u
        ? `${u.first_name} ${u.last_name || ""}`.trim()
        : "User";
      const authorDisplay =
        (val?.author as string) ||
        (uRole === "DEPARTMENT_HEAD"
          ? `Department Head — ${rawName}`
          : uRole === "STAFF"
            ? `Staff — ${rawName}`
            : rawName);

      return {
        id: l.audit_log_id.toString(),
        author: authorDisplay,
        role: roleDisplay,
        timestamp: formatRelativeTime(l.created_at),
        note:
          (val?.note as string) ||
          (val?.details as string) ||
          String(l.new_value || ""),
        parentId: (val?.parentId as string) || undefined,
        replyToAuthor: (val?.replyToAuthor as string) || undefined,
        createdAt: l.created_at.toISOString(),
        scope: (val?.scope as string) || "INTERNAL",
        departmentName: (val?.departmentName as string) || undefined,
      };
    };

    const internalNotes = g.audit_logs
      .filter((l) => {
        const val = parseLogVal(l);
        const isCollabOrFinding =
          l.action === "COLLABORATION_NOTE_ADDED" ||
          l.action === "SUPPORTING_FINDINGS_SUBMITTED" ||
          val.scope === "COLLABORATION" ||
          val.isFindings === true ||
          String(val.note || "").includes("[Department Findings");
        if (isCollabOrFinding) return false;

        const isInternalAction =
          l.action === "HOD_DIRECTIVE_NOTE" ||
          l.action === "INVESTIGATION_NOTE_ADDED" ||
          l.action === "INTERNAL_NOTE_ADDED" ||
          l.action === "HEAD_DIRECTIVE_ISSUED";
        if (!isInternalAction) return false;

        if (!isAdmin && departmentId) {
          const authorDeptId =
            l.users?.department_id?.toString() ||
            (val.department_id ? String(val.department_id) : null);
          if (authorDeptId && authorDeptId !== departmentId.toString()) {
            return false;
          }
        }
        return true;
      })
      .slice()
      .reverse()
      .map((l) => formatLogNote(l, parseLogVal(l)));

    const collaborationNotes = g.audit_logs
      .filter((l) => {
        const val = parseLogVal(l);
        const isFinding =
          l.action === "SUPPORTING_FINDINGS_SUBMITTED" ||
          val.isFindings === true ||
          String(val.note || "").includes("[Department Findings");
        if (isFinding) return false;

        return (
          l.action === "COLLABORATION_NOTE_ADDED" ||
          val.scope === "COLLABORATION"
        );
      })
      .slice()
      .reverse()
      .map((l) => formatLogNote(l, parseLogVal(l)));

    const supportingFindings: SupportingDepartmentFinding[] = g.audit_logs
      .filter((l) => {
        const val = parseLogVal(l);
        return (
          l.action === "SUPPORTING_FINDINGS_SUBMITTED" ||
          val.isFindings === true ||
          String(val.note || "").includes("[Department Findings")
        );
      })
      .slice()
      .reverse()
      .map((l) => {
        const val = parseLogVal(l);
        const u = l.users;
        const authorName = u
          ? `${u.first_name} ${u.last_name || ""}`.trim()
          : (val.submittedBy as string) || "Staff Member";
        const deptName =
          (val.department as string) ||
          (val.departmentName as string) ||
          "Supporting Department";

        let findings = (val.findings as string) || "";
        let actionTaken = (val.actionTaken as string) || "";
        let notes = (val.notes as string) || "";

        if (!findings && typeof val.note === "string") {
          const noteStr = val.note;
          const findingsMatch = noteStr.match(
            /Findings:\s*([\s\S]*?)(?=\n\nAction Taken:|$)/,
          );
          const actionMatch = noteStr.match(
            /Action Taken:\s*([\s\S]*?)(?=\n\nNotes:|$)/,
          );
          const notesMatch = noteStr.match(/Notes:\s*([\s\S]*?)$/);
          if (findingsMatch) findings = findingsMatch[1].trim();
          if (actionMatch) actionTaken = actionMatch[1].trim();
          if (notesMatch) notes = notesMatch[1].trim();
          if (!findings) findings = noteStr;
        }

        const attList = Array.isArray(val.attachments)
          ? (val.attachments as Array<{
              id: string;
              name: string;
              size?: string;
              type?: string;
              path: string;
              downloadUrl?: string;
            }>)
          : undefined;

        return {
          id: l.audit_log_id.toString(),
          departmentName: deptName,
          submittedBy: (val.submittedBy as string) || authorName,
          findings,
          actionTaken: actionTaken || undefined,
          notes: notes || undefined,
          attachments: attList,
          createdAt: l.created_at.toISOString(),
          timestamp: formatRelativeTime(l.created_at),
        };
      });

    // Merge formal resolution submissions if not already represented in supportingFindings
    for (const res of g.resolutions || []) {
      const alreadyIncluded = supportingFindings.some(
        (sf) =>
          sf.id === `res-${res.resolution_id.toString()}` ||
          (res.resolution_id && sf.id.includes(res.resolution_id.toString())),
      );
      if (!alreadyIncluded) {
        const resUser = res.users;
        const resAuthor = resUser
          ? `${resUser.first_name} ${resUser.last_name || ""}`.trim()
          : "Staff Member";
        const resDeptName =
          resUser?.departments?.department_name ||
          g.grievance_departments?.find(
            (gd) => gd.assignments?.staff_id === res.submitted_by,
          )?.departments?.department_name ||
          "Department";

        const resAttList = (res.attachments || []).map((att) => ({
          id: att.attachment_id.toString(),
          name: att.file_name,
          size: att.file_size
            ? `${Math.round(Number(att.file_size) / 1024)} KB`
            : undefined,
          type: att.file_type || undefined,
          path: att.file_path,
          downloadUrl: `/api/attachments/${att.attachment_id}/download`,
        }));

        supportingFindings.push({
          id: `res-${res.resolution_id.toString()}`,
          departmentName: resDeptName,
          submittedBy: resAuthor,
          findings: res.findings || res.problem_summary || "",
          actionTaken: res.action_taken || undefined,
          notes: res.outcome || undefined,
          attachments: resAttList.length > 0 ? resAttList : undefined,
          createdAt: res.submitted_at.toISOString(),
          timestamp: formatRelativeTime(res.submitted_at),
        });
      }
    }

    const auditTrail = g.audit_logs
      .filter((l) => {
        const val = parseLogVal(l);
        const isInternalAction =
          l.action === "HOD_DIRECTIVE_NOTE" ||
          l.action === "INVESTIGATION_NOTE_ADDED" ||
          l.action === "INTERNAL_NOTE_ADDED" ||
          l.action === "HEAD_DIRECTIVE_ISSUED" ||
          val.scope === "INTERNAL";

        const isCollab =
          l.action === "COLLABORATION_NOTE_ADDED" ||
          val.scope === "COLLABORATION";

        if (isCollab) {
          return true;
        }

        if (isInternalAction && !isAdmin && departmentId) {
          const authorDeptId =
            l.users?.department_id?.toString() ||
            (val.department_id ? String(val.department_id) : null);
          if (authorDeptId && authorDeptId !== departmentId.toString()) {
            return false;
          }
        }
        return true;
      })
      .map((l) => {
        const userObj = l.users;
        const userRole = userObj?.roles?.role_name;
        let actor = "System";
        if (userObj) {
          const rawName =
            `${userObj.first_name} ${userObj.last_name || ""}`.trim();
          if (userRole === "DEPARTMENT_HEAD") {
            actor = `Department Head — ${rawName}`;
          } else if (userRole === "STAFF") {
            actor = `Staff — ${rawName}`;
          } else {
            actor = `${rawName} (${userRole || "User"})`;
          }
        }

        const val = l.new_value as {
          details?: string;
          note?: string;
          bottleneck?: string;
          stage?: string;
          scope?: string;
        } | null;

        let actionTitle = l.action.replace(/_/g, " ");
        if (l.action === "HOD_DIRECTIVE_NOTE") {
          actionTitle = "Internal Note";
        } else if (
          l.action === "INVESTIGATION_NOTE_ADDED" ||
          l.action === "INTERNAL_NOTE_ADDED"
        ) {
          actionTitle = "Investigation Note";
        } else if (
          l.action === "COLLABORATION_NOTE_ADDED" ||
          val?.scope === "COLLABORATION"
        ) {
          actionTitle = "Collaboration Note Added";
        }

        return {
          id: l.audit_log_id.toString(),
          timestamp: formatRelativeTime(l.created_at),
          actor,
          action: actionTitle,
          bottleneck: val?.bottleneck,
          details: formatAuditEntryDetails(l.action, l.new_value),
          stage: val?.stage || g.status,
        };
      });

    const isMultiDeptCase = relatedDepts.length > 1;
    const interventionLog = g.audit_logs.find((l) => {
      if (
        l.action !== "HOD_INTERVENTION_TAKEN" &&
        l.action !== "Step 6: Intervention Action Taken"
      ) {
        return false;
      }

      if (!isMultiDeptCase || !departmentId) {
        return true;
      }

      let parsedVal: Record<string, unknown> | null = null;
      if (l.new_value) {
        if (typeof l.new_value === "string") {
          try {
            parsedVal = JSON.parse(l.new_value);
          } catch {
            parsedVal = null;
          }
        } else if (typeof l.new_value === "object") {
          parsedVal = l.new_value as Record<string, unknown>;
        }
      }

      if (
        typeof parsedVal?.targetDepartment === "string" &&
        myDeptRecord?.departments?.department_name
      ) {
        const target = parsedVal.targetDepartment.toLowerCase().trim();
        const currDept = myDeptRecord.departments.department_name
          .toLowerCase()
          .trim();
        return target.includes(currDept) || currDept.includes(target);
      }

      if (parsedVal?.departmentId || parsedVal?.department_id) {
        return (
          BigInt(String(parsedVal.departmentId || parsedVal.department_id)) ===
          departmentId
        );
      }

      if (
        l.users?.department_id &&
        BigInt(l.users.department_id) === departmentId
      ) {
        return true;
      }

      return false;
    });

    let hodIntervention = null;
    if (interventionLog?.new_value) {
      let iv: Record<string, unknown> = {};
      if (typeof interventionLog.new_value === "string") {
        try {
          iv = JSON.parse(interventionLog.new_value);
        } catch {
          iv = {};
        }
      } else if (typeof interventionLog.new_value === "object") {
        iv = interventionLog.new_value as Record<string, unknown>;
      }

      const isResAuth = Boolean(
        iv.isResolutionAuthority ||
          iv.actionType === "ASSUME_RESOLUTION_AUTHORITY" ||
          iv.actionType === "DIRECT_OVERSIGHT",
      );

      hodIntervention = {
        actionType:
          (iv.actionType as
            | "MONITOR"
            | "REQUEST_STATUS_UPDATE"
            | "NOTIFY_STAFF"
            | "REASSIGN"
            | "CROSS_DEPT"
            | "ASSUME_RESOLUTION_AUTHORITY"
            | "REQUEST_ADDITIONAL_INFO"
            | "DIRECT_OVERSIGHT"
            | "EXTEND_SLA"
            | "EXPEDITE"
            | "OVERRIDE"
            | "SLA_EXTENSION") || "MONITOR",
        actionLabel: (iv.actionLabel as string) || "HOD Intervention",
        note: (iv.note as string) || "",
        intervenedAt: formatRelativeTime(interventionLog.created_at),
        intervenedBy:
          (iv.intervenedBy as string) ||
          (interventionLog.users
            ? `${interventionLog.users.first_name} ${interventionLog.users.last_name || ""}`.trim()
            : "Department Head"),
        targetStaffName: iv.targetStaffName as string | undefined,
        targetDepartment: iv.targetDepartment as string | undefined,
        isResolutionAuthority: isResAuth,
        resolutionAuthorityUserId:
          (iv.resolutionAuthorityUserId as string) ||
          (interventionLog.user_id
            ? interventionLog.user_id.toString()
            : undefined),
        resolutionAuthorityName:
          (iv.resolutionAuthorityName as string) ||
          (iv.intervenedBy as string) ||
          (interventionLog.users
            ? `${interventionLog.users.first_name} ${interventionLog.users.last_name || ""}`.trim()
            : "Department Head"),
        rootBottleneck: (iv.bottleneck as string) || undefined,
        bottleneckExplanation:
          (iv.bottleneckExplanation as string) || undefined,
        directiveJustification: (iv.note as string) || "",
      };
    }

    const deptList: string[] = relatedDepts.map(
      (d) => d.departments.department_name,
    );
    if (deptList.length === 0 && g.grievance_departments) {
      const primaryGDept = getPrimaryDepartment(g);
      if (primaryGDept?.departments?.department_name) {
        deptList.push(primaryGDept.departments.department_name);
      }
    }
    const isCrossDepartment = deptList.length > 1;

    const departmentsInvolved = relatedDepts.map((d) => {
      const deptAssignment = grievanceAssignments.find(
        (a) =>
          a.grievance_department_id === d.grievance_department_id &&
          a.assignment_status === "ASSIGNED",
      );
      const deptStatus = d.status;

      const staffUser = deptAssignment?.users_assignments_staff_idTousers;
      const assignedStaffUser =
        deptStatus === "PENDING_ASSIGNMENT" || !deptAssignment
          ? null
          : staffUser
            ? `${staffUser.first_name} ${staffUser.last_name || ""}`.trim()
            : null;

      return {
        id: d.grievance_department_id.toString(),
        departmentName: d.departments?.department_name || "Unknown Department",
        involvementType:
          (d.involvement_type as "PRIMARY" | "SUPPORTING" | "EQUAL") ||
          "PRIMARY",
        status: deptStatus,
        assignedStaff: assignedStaffUser,
      };
    });

    const myInvolvementType =
      (myDeptRecord?.involvement_type as "PRIMARY" | "SUPPORTING" | "EQUAL") ||
      "PRIMARY";
    const isPrimaryDepartment =
      myInvolvementType === "PRIMARY" ||
      myInvolvementType === "EQUAL" ||
      !departmentId;

    const authResult = departmentId
      ? canDepartmentSubmitFinalResolution(departmentId, relatedDepts)
      : { canResolve: true, canSubmitFindings: false };
    const canSubmitFinalResolution = authResult.canResolve;

    let resolvedStatus: GrievanceItem["status"] =
      g.status as GrievanceItem["status"];
    if (myDeptRecord) {
      if (g.status === "CLOSED" || g.status === "RESOLVED") {
        resolvedStatus = g.status as GrievanceItem["status"];
      } else if (g.status === "UNDER_REVIEW") {
        resolvedStatus = "UNDER_REVIEW";
      } else if (g.status === "REOPENED" || g.status === "REOPEN_REVIEW") {
        resolvedStatus = g.status as GrievanceItem["status"];
      } else if (myDeptRecord.status === "COMPLETED") {
        resolvedStatus = "COMPLETED";
      } else if (myDeptRecord.status === "BLOCKED") {
        resolvedStatus = "BLOCKED";
      } else if (g.status === "ESCALATED") {
        resolvedStatus = "ESCALATED";
      } else if (
        myDeptRecord.status === "PENDING_ASSIGNMENT" ||
        !myDeptAssignment
      ) {
        resolvedStatus = "PENDING_ASSIGNMENT";
      } else if (myDeptRecord.status === "ASSIGNED") {
        resolvedStatus = "ASSIGNED";
      } else if (myDeptRecord.status === "IN_PROGRESS") {
        resolvedStatus = "IN_PROGRESS";
      }
    }

    let resolvedSlaConsumptionPercent = 0;
    let resolvedSlaTimeLeft = "N/A";
    let resolvedSlaDeadline = g.due_at ? formatFriendlyDate(g.due_at) : "N/A";
    let resolvedSlaStatus: "ON_TRACK" | "AT_RISK" | "BREACHED" =
      (g.sla_status as "ON_TRACK" | "AT_RISK" | "BREACHED") || "ON_TRACK";

    if (myDeptRecord) {
      if (myDeptRecord.status === "BLOCKED") {
        resolvedSlaConsumptionPercent = 0;
        resolvedSlaTimeLeft = "Pending Prerequisites (Blocked)";
        resolvedSlaDeadline = myDeptRecord.allocated_duration_minutes
          ? `${Math.round(myDeptRecord.allocated_duration_minutes / 60)}h allocated (${Number(myDeptRecord.sla_percent_allocation || 0)}%)`
          : "Blocked";
        resolvedSlaStatus = "ON_TRACK";
      } else {
        const deptAllocatedMins =
          myDeptRecord.allocated_duration_minutes ||
          (g.due_at && g.created_at
            ? Math.max(
                1,
                Math.round(
                  ((g.due_at.getTime() - g.created_at.getTime()) *
                    (Number(myDeptRecord.sla_percent_allocation || 100) /
                      100)) /
                    60000,
                ),
              )
            : 1440);

        const deptStart =
          myDeptRecord.activated_at || myDeptRecord.assigned_at || g.created_at;
        const deptDue =
          myDeptRecord.due_at ||
          new Date(deptStart.getTime() + deptAllocatedMins * 60 * 1000);

        const deptSlaResult = calculateDepartmentSlaConsumption(
          deptStart,
          deptDue,
          deptAllocatedMins,
          myDeptRecord.completed_at,
        );

        resolvedSlaConsumptionPercent = deptSlaResult.consumptionPercent;
        resolvedSlaStatus =
          (myDeptRecord.sla_status as "ON_TRACK" | "AT_RISK" | "BREACHED") ||
          deptSlaResult.slaStatus;
        resolvedSlaDeadline = formatFriendlyDate(deptDue);
        resolvedSlaTimeLeft = formatSlaTimeLeft(
          deptDue,
          resolvedSlaStatus,
          g.priority,
          deptStart,
        );
      }
    } else {
      const slaConsumption = calculateSlaConsumption(
        g.created_at,
        g.due_at,
        g.priority,
      );
      resolvedSlaConsumptionPercent = slaConsumption.consumptionPercent;
      resolvedSlaStatus =
        (g.sla_status as "ON_TRACK" | "AT_RISK" | "BREACHED") ||
        (slaConsumption.consumptionPercent >= 100
          ? "BREACHED"
          : slaConsumption.consumptionPercent >= 75
            ? "AT_RISK"
            : "ON_TRACK");
      resolvedSlaDeadline = g.due_at ? formatFriendlyDate(g.due_at) : "N/A";
      resolvedSlaTimeLeft = formatSlaTimeLeft(
        g.due_at,
        g.sla_status,
        g.priority,
        g.created_at,
      );
    }
    const submitterFullName =
      `${g.users?.first_name || "Unknown"} ${g.users?.last_name || ""}`.trim();

    return {
      id: g.grievance_id.toString(),
      ticketCode: g.grievance_number,
      title: g.title,
      description: g.description,
      category: g.categories?.category_name || "General",
      subcategory: g.subcategories?.subcategory_name || "General",
      categoryId: g.category_id ? g.category_id.toString() : null,
      subcategoryId: g.subcategory_id ? g.subcategory_id.toString() : null,
      submitterName: submitterFullName,
      submitterRole: g.users?.roles?.role_name || "USER",
      submitterEmail: g.users?.email || "",
      priority: g.priority as GrievanceItem["priority"],
      status: resolvedStatus,
      slaStatus: resolvedSlaStatus,
      slaDeadline: resolvedSlaDeadline,
      slaTimeLeft: resolvedSlaTimeLeft,
      slaConsumptionPercent: resolvedSlaConsumptionPercent,
      assignedStaffId: departmentId
        ? isDeptPendingAssignment || !myDeptAssignment
          ? null
          : myDeptAssignment.users_assignments_staff_idTousers?.user_id?.toString() ||
            (["CLOSED", "RESOLVED"].includes(g.status)
              ? latestResolution?.users?.user_id?.toString() ||
                grievanceAssignments[0]?.users_assignments_staff_idTousers?.user_id?.toString() ||
                null
              : null)
        : assignedStaff
          ? assignedStaff.user_id.toString()
          : null,
      assignedStaffName: resolvedAssignedStaffName,
      assignedStaffStatus: assignedStaff?.status || null,
      assignedStaffRole: assignedStaff?.roles?.role_name || null,
      isAssignedStaffInactive: Boolean(
        assignedStaff &&
          (assignedStaff.status === "INACTIVE" ||
            assignedStaff.status === "SUSPENDED"),
      ),
      isAssignedToHead: Boolean(
        assignedStaff?.roles?.role_name === "DEPARTMENT_HEAD" ||
          (user?.user_id &&
            assignedStaff?.user_id &&
            BigInt(assignedStaff.user_id) === BigInt(user.user_id)),
      ),
      createdAt: formatFriendlyDate(g.created_at),
      isReopened: g.reopen_count > 0 || g.status === "REOPENED",
      reopenCount: g.reopen_count,
      hasProposedKb: (latestResolution?.knowledge_articles?.length ?? 0) > 0,
      isCrossDepartment,
      collaboratingDepartments: deptList,
      departmentsInvolved,
      isPrimaryDepartment,
      canSubmitFinalResolution,
      myInvolvementType,
      myDepartmentStatus:
        myDeptRecord?.status ||
        (assignedStaff ? "ASSIGNED" : "PENDING_ASSIGNMENT"),
      isBlocked: myDeptRecord?.status === "BLOCKED",
      escalationReason: latestEscalation?.reason || undefined,
      escalationLevel: latestEscalation?.escalation_level || undefined,
      escalationStage:
        g.status === "ESCALATED"
          ? ("GRIEVANCE_ESCALATED" as const)
          : g.status === "UNDER_REVIEW"
            ? ("RESOLUTION_SUBMITTED" as const)
            : g.status === "CLOSED"
              ? ("ESCALATION_CLEARED" as const)
              : ("IN_PROGRESS" as const),
      hodIntervention,
      submittedResolution: latestResolution
        ? {
            id: latestResolution.resolution_id.toString(),
            submittedByUserId: latestResolution.submitted_by.toString(),
            submittedByRole: latestResolution.users.roles?.role_name || null,
            staffName:
              `${latestResolution.users.first_name} ${latestResolution.users.last_name || ""}`.trim(),
            problemSummary: latestResolution.problem_summary,
            actionTaken: latestResolution.action_taken,
            findings: latestResolution.findings,
            outcome: latestResolution.outcome,
            note:
              latestResolution.action_taken || latestResolution.problem_summary,
            submittedAt: formatRelativeTime(latestResolution.submitted_at),
            attachments: (latestResolution.attachments || []).map((att) => ({
              id: att.attachment_id.toString(),
              name: att.file_name,
              size: att.file_size
                ? `${Math.round(Number(att.file_size) / 1024)} KB`
                : undefined,
              type: att.file_type || undefined,
              path: att.file_path,
              downloadUrl: `/api/attachments/${att.attachment_id}/download`,
              uploadedAt: formatFriendlyDate(att.uploaded_at),
            })),
          }
        : null,
      auditTrail,
      attachments: filterAuthorizedAttachments(
        user,
        (g.attachments || []).filter(
          (att) =>
            !att.resolution_id &&
            !att.grievance_department_id &&
            BigInt(att.uploaded_by) === BigInt(g.submitted_by),
        ),
        {
          grievance_id: g.grievance_id,
          submitted_by: g.submitted_by,
          status: g.status,
          title: g.title,
          description: g.description,
          categoryName: g.categories?.category_name,
          subcategoryName: g.subcategories?.subcategory_name,
        },
        (g.grievance_departments || []).map((gd) => ({
          grievance_department_id: gd.grievance_department_id,
          department_id: gd.department_id,
          department_name: gd.departments?.department_name || "",
          involvement_type: gd.involvement_type,
          status: gd.status,
        })),
        (g.assignments || []).map((a) => ({
          staff_id: a.staff_id,
          grievance_department_id: a.grievance_department_id,
          assignment_status: a.assignment_status,
        })),
      ).map((a) => ({
        id: a.attachment_id.toString(),
        name: a.file_name,
        size: a.file_size
          ? `${Math.round(Number(a.file_size) / 1024)} KB`
          : "150 KB",
        type: a.file_type,
        path: a.file_path,
        downloadUrl: `/api/attachments/${a.attachment_id}/download`,
        uploadedAt: formatFriendlyDate(a.uploaded_at),
      })),
      internalNotes,
      collaborationNotes,
      supportingFindings,
    };
  });

  return { items, total };
}

export async function fetchDepartmentHeadStaff(departmentId: bigint) {
  const rawStaff = await prisma.users.findMany({
    where: {
      department_id: departmentId,
      roles: {
        role_name: "STAFF",
      },
    },
    include: {
      roles: true,
      departments: true,
      assignments_assignments_staff_idTousers: {
        where: {
          assignment_status: "ASSIGNED",
          grievances: {
            status: { notIn: ["CLOSED", "RESOLVED"] },
          },
        },
        select: {
          assignment_id: true,
        },
      },
    },
    orderBy: [{ role_id: "desc" }, { first_name: "asc" }],
  });

  const staffMembers: StaffMember[] = rawStaff.map((u) => {
    const activeTickets = u.assignments_assignments_staff_idTousers.length;
    const maxCapacity = 10;

    let status: "ACTIVE" | "ON_LEAVE" | "BUSY" = "ACTIVE";
    if (u.status === "ON_LEAVE" || u.status === "INACTIVE") {
      status = "ON_LEAVE";
    } else if (activeTickets >= maxCapacity) {
      status = "BUSY";
    }

    const roleDisplay =
      u.roles.role_name === "DEPARTMENT_HEAD"
        ? "Department Head"
        : "Grievance Staff";

    return {
      id: u.user_id.toString(),
      employeeCode: u.employee_code,
      name: `${u.first_name} ${u.last_name || ""}`.trim(),
      designation: `${roleDisplay} (${u.departments?.department_name || "Operations"})`,
      email: u.email,
      activeTickets,
      maxCapacity,
      status,
    };
  });

  return { staff: staffMembers };
}

export async function fetchDepartmentHeadOverview(departmentId: bigint) {
  const deptGrievances = await prisma.grievance_departments.findMany({
    where: { department_id: departmentId },
    include: {
      grievances: {
        include: {
          assignments: {
            where: {
              assignment_status: "ASSIGNED",
              grievance_departments: { department_id: departmentId },
            },
            select: { assignment_id: true, staff_id: true },
          },
          grievance_departments: {
            select: { department_id: true, involvement_type: true },
          },
        },
      },
    },
  });

  const grievances = deptGrievances.map((dg) => dg.grievances);
  const grievanceIds = grievances.map((g) => g.grievance_id);

  const totalGrievances = grievances.length;
  let unassignedCount = 0;
  let inProgressCount = 0;
  let atRiskCount = 0;
  let escalatedCount = 0;
  let reopenedCount = 0;
  let crossDeptCount = 0;
  let resolutionReviewCount = 0;
  let highCriticalCount = 0;
  let closedCount = 0;

  for (const dg of deptGrievances) {
    const g = dg.grievances;
    const isClosed = g.status === "CLOSED" || g.status === "RESOLVED";

    if (isClosed) {
      closedCount++;
      continue;
    }

    const hasActiveAssignment = g.assignments.length > 0;
    const isDeptBlocked = dg.status === "BLOCKED";
    const isDeptPending =
      dg.status === "PENDING_ASSIGNMENT" || !hasActiveAssignment;

    if (
      !isDeptBlocked &&
      (isDeptPending || g.status === "SUBMITTED" || g.status === "ROUTED")
    ) {
      unassignedCount++;
    } else if (
      !isDeptBlocked &&
      hasActiveAssignment &&
      (dg.status === "IN_PROGRESS" ||
        dg.status === "ASSIGNED" ||
        g.status === "IN_PROGRESS" ||
        g.status === "ASSIGNED")
    ) {
      inProgressCount++;
    }
    if (g.sla_status === "AT_RISK" && g.status !== "ESCALATED") {
      atRiskCount++;
    }
    if (g.status === "ESCALATED") {
      escalatedCount++;
    }
    if (
      g.reopen_count > 0 ||
      g.status === "REOPENED" ||
      g.status === "REOPEN_REVIEW"
    ) {
      reopenedCount++;
    }
    if (dg.involvement_type === "SUPPORTING") {
      crossDeptCount++;
    }
    if (g.status === "UNDER_REVIEW") {
      resolutionReviewCount++;
    }
    if (g.priority === "HIGH" || g.priority === "CRITICAL") {
      highCriticalCount++;
    }
  }

  const recentAuditLogs =
    grievanceIds.length > 0
      ? await prisma.audit_logs.findMany({
          where: {
            grievance_id: { in: grievanceIds },
          },
          include: {
            users: {
              select: {
                first_name: true,
                last_name: true,
                roles: { select: { role_name: true } },
              },
            },
            grievances: {
              select: { grievance_number: true, status: true },
            },
          },
          orderBy: { created_at: "desc" },
          take: 10,
        })
      : [];

  const formattedAuditFeed: EscalationAuditRecord[] = recentAuditLogs.map(
    (log) => {
      const isSystemAction =
        log.action.startsWith("SLA_") ||
        log.action.startsWith("AUTO_") ||
        log.action.startsWith("RULE_") ||
        !log.users;

      const actorName = isSystemAction
        ? "SLA Governance Engine"
        : log.users
          ? `${log.users.first_name} ${log.users.last_name || ""}`.trim()
          : "Automated System";

      const actorRole = isSystemAction
        ? "Automated Engine"
        : log.users?.roles?.role_name || "System";

      const ticketNum = log.grievances?.grievance_number || "Grievance";

      let formattedAction = `${ticketNum}: ${log.action.replace(/_/g, " ")}`;
      const val = log.new_value as Record<string, unknown> | null;

      if (log.action.includes("BREACH")) {
        formattedAction = `${ticketNum}: SLA Breached & Case Escalated`;
      } else if (
        log.action.includes("CRITICAL") ||
        log.action.includes("URGENT")
      ) {
        const threshold = val?.threshold ? String(val.threshold) : "Critical";
        formattedAction = `${ticketNum}: SLA Critical (${threshold} Alert)`;
      } else if (
        log.action === "SLA_75_PERCENT_HOD_ALERT" ||
        log.action.includes("PERCENT_ALERT") ||
        log.action.includes("AT_RISK")
      ) {
        const threshold = val?.threshold ? String(val.threshold) : "At Risk";
        formattedAction = `${ticketNum}: SLA At Risk (${threshold} Alert)`;
      } else if (
        log.action === "SLA_50_PERCENT_WARNING" ||
        log.action.includes("PERCENT_WARNING") ||
        log.action === "DEPARTMENT_SLA_WARNING"
      ) {
        const threshold = val?.threshold ? String(val.threshold) : "Priority";
        formattedAction = `${ticketNum}: ${threshold} SLA Warning`;
      } else if (log.action === "INTERVENTION_MONITOR") {
        formattedAction = `${ticketNum}: HOD Continuing Monitoring`;
      } else if (log.action === "INTERVENTION_NOTIFY_STAFF") {
        formattedAction = `${ticketNum}: HOD Staff Directive Dispatched`;
      } else if (log.action === "INTERVENTION_REASSIGN") {
        formattedAction = `${ticketNum}: Case Reassigned by HOD`;
      } else if (log.action === "INTERVENTION_CROSS_DEPT") {
        formattedAction = `${ticketNum}: Cross-Department Review Initiated`;
      }

      let formattedDetails = "";

      if (val && typeof val === "object") {
        if (log.action.includes("BREACH")) {
          const consumption =
            val.consumptionPercent != null
              ? `${Math.round(Number(val.consumptionPercent))}%`
              : val.threshold
                ? String(val.threshold)
                : "100%";
          const escalatedTo = val.escalatedTo
            ? ` to ${String(val.escalatedTo)}`
            : "";
          formattedDetails = `Critical SLA breach (${consumption} elapsed). Auto-escalated${escalatedTo} for intervention.`;
        } else if (
          log.action.includes("CRITICAL") ||
          log.action.includes("URGENT")
        ) {
          const consumption =
            val.consumptionPercent != null
              ? `${Math.round(Number(val.consumptionPercent))}%`
              : val.threshold
                ? String(val.threshold)
                : "Critical";
          formattedDetails = `SLA critical at ${consumption} capacity. Immediate intervention required before deadline breach.`;
        } else if (
          log.action === "SLA_75_PERCENT_HOD_ALERT" ||
          log.action.includes("PERCENT_ALERT") ||
          log.action.includes("AT_RISK")
        ) {
          const consumption =
            val.consumptionPercent != null
              ? `${Math.round(Number(val.consumptionPercent))}%`
              : val.threshold
                ? String(val.threshold)
                : "At Risk";
          formattedDetails = `SLA reached ${consumption} capacity. Department Head alerted for monitoring without auto-reassignment.`;
        } else if (
          log.action === "SLA_50_PERCENT_WARNING" ||
          log.action.includes("PERCENT_WARNING") ||
          log.action === "DEPARTMENT_SLA_WARNING"
        ) {
          const consumption =
            val.consumptionPercent != null
              ? `${Math.round(Number(val.consumptionPercent))}%`
              : val.threshold
                ? String(val.threshold)
                : "Warning";
          formattedDetails = `SLA warning threshold consumed (${consumption}). Priority alert dispatched to assigned staff member.`;
        } else if (val.note) {
          formattedDetails = String(val.note);
        } else if (val.remarks) {
          formattedDetails = String(val.remarks);
        } else if (val.reason) {
          formattedDetails = String(val.reason);
        } else if (val.newStatus) {
          formattedDetails = `Status transitioned to ${val.newStatus}.`;
        } else {
          formattedDetails =
            Object.entries(val)
              .filter(
                ([k, v]) =>
                  typeof v !== "object" &&
                  v !== null &&
                  v !== undefined &&
                  k !== "threshold",
              )
              .map(
                ([k, v]) =>
                  `${k.replace(/([A-Z])/g, " $1").toLowerCase()}: ${v}`,
              )
              .join(" • ") || `${log.action} executed on ${ticketNum}`;
        }
      } else if (typeof log.new_value === "string") {
        try {
          const parsed = JSON.parse(log.new_value);
          if (parsed && typeof parsed === "object") {
            const consumption = parsed.consumptionPercent
              ? `${Math.round(parsed.consumptionPercent)}%`
              : "";
            const escalatedTo = parsed.escalatedTo
              ? ` to ${parsed.escalatedTo}`
              : "";
            formattedDetails = consumption
              ? `Critical SLA breach (${consumption} elapsed). Auto-escalated${escalatedTo} for intervention.`
              : `${log.action.replace(/_/g, " ")} on ${ticketNum}`;
          } else {
            formattedDetails = log.new_value;
          }
        } catch {
          formattedDetails = log.new_value;
        }
      } else {
        formattedDetails = `${log.action.replace(/_/g, " ")} executed on ${ticketNum}`;
      }

      return {
        id: log.audit_log_id.toString(),
        timestamp: formatRelativeTime(log.created_at),
        actor: `${actorName} (${actorRole})`,
        action: formattedAction,
        details: formattedDetails,
        stage: log.grievances?.status || "IN_PROGRESS",
      };
    },
  );

  const seenAuditKeys = new Set<string>();
  const deduplicatedFeed = formattedAuditFeed.filter((item) => {
    const key = `${item.action}`;
    if (seenAuditKeys.has(key)) return false;
    seenAuditKeys.add(key);
    return true;
  });

  const deptHead = await prisma.users.findFirst({
    where: {
      department_id: departmentId,
      roles: { role_name: "DEPARTMENT_HEAD" },
      status: "ACTIVE",
    },
    select: {
      first_name: true,
      last_name: true,
      email: true,
      employee_code: true,
    },
  });

  const allDepartments = (
    await prisma.departments.findMany({
      where: { status: "ACTIVE" },
      orderBy: { department_name: "asc" },
      select: { department_id: true, department_name: true },
    })
  ).map((d) => ({
    id: d.department_id.toString(),
    name: d.department_name,
  }));

  const dept = await prisma.departments.findUnique({
    where: { department_id: departmentId },
    select: {
      department_id: true,
      department_name: true,
      description: true,
    },
  });

  return {
    department: dept
      ? {
          id: dept.department_id.toString(),
          name: dept.department_name,
          description: dept.description,
        }
      : null,
    head: deptHead
      ? {
          name: `${deptHead.first_name} ${deptHead.last_name || ""}`.trim(),
          email: deptHead.email,
          employeeCode: deptHead.employee_code || "HOD-DEPT-01",
        }
      : null,
    metrics: {
      totalGrievances,
      unassignedCount,
      inProgressCount,
      atRiskCount,
      escalatedCount,
      reopenedCount,
      crossDeptCount,
      resolutionReviewCount,
      highCriticalCount,
      closedCount,
    },
    auditFeed: deduplicatedFeed,
    availableDepartments: allDepartments,
  };
}
