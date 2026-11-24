import type {
  DepartmentHeadTab,
  DepartmentMetricsSummary,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";

export function isResolutionSubmittedByHead(item: GrievanceItem): boolean {
  if (!item.submittedResolution) return false;
  // A resolution only represents an active "submitted by Head awaiting citizen review" state
  // when the grievance is actively in RESOLUTION_PENDING_APPROVAL or legacy UNDER_REVIEW status.
  // If the grievance was reopened or escalated, any past resolution belongs to a prior cycle.
  if (
    item.status !== "UNDER_REVIEW" &&
    item.status !== "RESOLUTION_PENDING_APPROVAL"
  ) {
    return false;
  }
  const role = item.submittedResolution.submittedByRole;
  if (role === "DEPARTMENT_HEAD" || role === "ADMIN") {
    return true;
  }
  if (
    item.hodIntervention?.resolutionAuthorityUserId &&
    item.submittedResolution.submittedByUserId ===
      item.hodIntervention.resolutionAuthorityUserId
  ) {
    return true;
  }
  return false;
}

export function hasHeadResolutionAuthority(item: GrievanceItem): boolean {
  if (
    item.status === "CLOSED" ||
    item.status === "RESOLVED" ||
    item.status === "COMPLETED" ||
    item.status === "REWORK" ||
    isResolutionSubmittedByHead(item)
  ) {
    return false;
  }
  return Boolean(
    item.hodIntervention?.isResolutionAuthority ||
      item.hodIntervention?.actionType === "ASSUME_RESOLUTION_AUTHORITY" ||
      item.hodIntervention?.actionType === "DIRECT_OVERSIGHT",
  );
}

export function canHeadSubmitResolution(item: GrievanceItem): boolean {
  if (
    item.status === "CLOSED" ||
    item.status === "RESOLVED" ||
    item.status === "COMPLETED" ||
    item.status === "REWORK" ||
    item.overallStatus === "CLOSED" ||
    item.overallStatus === "RESOLVED" ||
    isResolutionSubmittedByHead(item)
  ) {
    return false;
  }
  // If resolution is already submitted by Department Head and awaiting employee acceptance, head cannot submit again
  if (
    (item.status === "UNDER_REVIEW" ||
      item.status === "RESOLUTION_PENDING_APPROVAL") &&
    isResolutionSubmittedByHead(item)
  ) {
    return false;
  }
  // If this department's stage is already completed in a multi-department case
  if (item.myDepartmentStatus === "COMPLETED") {
    return false;
  }
  // 1. Department Head explicitly assumed resolution authority (and hasn't submitted yet)
  if (hasHeadResolutionAuthority(item)) {
    return true;
  }
  // 2. Grievance is directly assigned to the Department Head (e.g. via Smart Assignment)
  if (item.isAssignedToHead) {
    return true;
  }
  // 3. Staff submitted a resolution pending Head review
  if (
    (item.status === "UNDER_REVIEW" ||
      item.status === "RESOLUTION_PENDING_APPROVAL") &&
    item.submittedResolution &&
    !isResolutionSubmittedByHead(item)
  ) {
    return true;
  }
  // 4. Reopened grievance with submitted resolution pending Head review
  if (
    item.isReopened ||
    ((item.reopenCount ?? 0) > 0 &&
      item.submittedResolution &&
      !isResolutionSubmittedByHead(item))
  ) {
    return true;
  }
  return false;
}

export function requiresHeadResolutionReview(item: GrievanceItem): boolean {
  return canHeadSubmitResolution(item);
}

export function canHeadProposeKnowledge(item: GrievanceItem): boolean {
  if (item.hasProposedKb) return false;

  // Strictly only for user-accepted grievances (CLOSED status)
  const isUserAccepted =
    item.status === "CLOSED" || item.overallStatus === "CLOSED";
  if (!isUserAccepted) return false;

  // 1. Supporting Department: If supporting department head submitted department findings / resolution
  const isSupportingDept =
    item.myInvolvementType === "SUPPORTING" ||
    item.isPrimaryDepartment === false;

  if (isSupportingDept) {
    const hasSubmittedFindings =
      item.myDepartmentStatus === "COMPLETED" ||
      item.status === "COMPLETED" ||
      (item.supportingFindings && item.supportingFindings.length > 0);

    return Boolean(hasSubmittedFindings);
  }

  // 2. Lead / Primary Department: Final resolution submitted by Department Head
  const hasHeadResolution = Boolean(
    item.submittedResolution &&
      (item.submittedResolution.submittedByRole === "DEPARTMENT_HEAD" ||
        item.submittedResolution.submittedByRole === "ADMIN" ||
        item.isAssignedToHead ||
        Boolean(item.hodIntervention?.isResolutionAuthority) ||
        (item.hodIntervention?.resolutionAuthorityUserId &&
          item.submittedResolution.submittedByUserId ===
            item.hodIntervention.resolutionAuthorityUserId) ||
        item.isPrimaryDepartment !== false),
  );

  return hasHeadResolution;
}

export function computeDepartmentMetrics(
  grievances: GrievanceItem[],
  staffList: StaffMember[],
): DepartmentMetricsSummary {
  const unassignedCount = grievances.filter(
    (g) =>
      (!g.assignedStaffId ||
        g.status === "SUBMITTED" ||
        g.status === "AWAITING_ROUTING" ||
        g.status === "AWAITING_ASSIGNMENT" ||
        g.status === "ROUTED") &&
      g.status !== "CLOSED" &&
      g.status !== "RESOLVED",
  ).length;

  const inProgressCount = grievances.filter(
    (g) =>
      g.status !== "CLOSED" &&
      g.status !== "RESOLVED" &&
      (g.status === "IN_PROGRESS" ||
        g.status === "ASSIGNED" ||
        g.status === "AWAITING_INFORMATION" ||
        g.status === "REWORK" ||
        g.myDepartmentStatus === "IN_PROGRESS" ||
        g.myDepartmentStatus === "ASSIGNED"),
  ).length;

  // SLA At Risk = 75%+ consumed, but not yet breached/escalated
  const slaAtRiskCount = grievances.filter(
    (g) =>
      g.slaStatus === "AT_RISK" &&
      g.status !== "ESCALATED" &&
      g.status !== "CLOSED" &&
      g.status !== "RESOLVED",
  ).length;

  // Escalated = Active grievances requiring HOD intervention (escalated or SLA breached)
  const escalatedCount = grievances.filter(
    (g) =>
      (g.status === "ESCALATED" ||
        g.slaStatus === "BREACHED" ||
        Boolean(g.escalationReason || g.hodIntervention)) &&
      g.status !== "CLOSED" &&
      g.status !== "RESOLVED",
  ).length;

  const atRiskCount = slaAtRiskCount;

  const reopenedCount = grievances.filter(
    (g) =>
      (g.isReopened || g.status === "REOPENED" || g.status === "REWORK") &&
      g.status !== "CLOSED" &&
      g.status !== "RESOLVED",
  ).length;

  const crossDeptCount = grievances.filter(
    (g) => g.isCrossDepartment && g.status !== "CLOSED",
  ).length;

  const resolutionReviewCount = grievances.filter((g) =>
    requiresHeadResolutionReview(g),
  ).length;

  const closedCount = grievances.filter(
    (g) => g.status === "CLOSED" || g.status === "RESOLVED",
  ).length;

  const highCriticalCount = grievances.filter(
    (g) =>
      (g.priority === "CRITICAL" || g.priority === "HIGH") &&
      g.status !== "CLOSED",
  ).length;

  const exceptionsCount = grievances.filter(
    (g) =>
      (!g.assignedStaffId ||
        g.status === "SUBMITTED" ||
        g.status === "AWAITING_ROUTING" ||
        g.status === "AWAITING_ASSIGNMENT" ||
        g.status === "ROUTED" ||
        g.isReopened ||
        g.status === "REOPENED" ||
        g.status === "REWORK" ||
        g.isCrossDepartment ||
        g.slaStatus === "BREACHED" ||
        Boolean(g.escalationReason || g.hodIntervention)) &&
      g.status !== "CLOSED" &&
      g.status !== "RESOLVED",
  ).length;

  const slaCriticalCount = grievances.filter(
    (g) =>
      (g.slaStatus === "BREACHED" ||
        g.status === "ESCALATED" ||
        Boolean(g.escalationReason || g.hodIntervention)) &&
      g.status !== "CLOSED" &&
      g.status !== "RESOLVED",
  ).length;

  const totalStaffCapacity = staffList.reduce(
    (acc, s) => acc + s.maxCapacity,
    0,
  );

  const totalActiveTickets = staffList.reduce(
    (acc, s) => acc + s.activeTickets,
    0,
  );

  const activeStaffCount = staffList.filter(
    (s) => s.status === "ACTIVE",
  ).length;

  const onLeaveStaffCount = staffList.filter(
    (s) => s.status === "ON_LEAVE",
  ).length;

  return {
    unassignedCount,
    inProgressCount,
    slaAtRiskCount,
    escalatedCount,
    atRiskCount,
    reopenedCount,
    crossDeptCount,
    resolutionReviewCount,
    closedCount,
    highCriticalCount,
    exceptionsCount,
    slaCriticalCount,
    totalStaffCapacity,
    totalActiveTickets,
    activeStaffCount,
    onLeaveStaffCount,
  };
}

export function computeAttentionRequiredList(
  grievances: GrievanceItem[],
): GrievanceItem[] {
  return grievances
    .filter((g) => {
      if (g.status === "CLOSED" || g.status === "RESOLVED") return false;
      const isStaffInactive = Boolean(g.isAssignedStaffInactive);
      const isBreached =
        g.slaStatus === "BREACHED" ||
        g.status === "ESCALATED" ||
        Boolean(g.escalationReason || g.hodIntervention);
      const isAtRisk = g.slaStatus === "AT_RISK";
      const isUnassigned =
        !g.assignedStaffId ||
        g.status === "SUBMITTED" ||
        g.status === "AWAITING_ROUTING" ||
        g.status === "AWAITING_ASSIGNMENT" ||
        g.status === "ROUTED";
      const isPendingReview = requiresHeadResolutionReview(g);
      const isPendingGracePeriod = Boolean(
        g.hasPendingExtension || g.latestExtension?.status === "PENDING",
      );
      const isException =
        g.isReopened ||
        g.status === "REOPENED" ||
        g.status === "REWORK" ||
        g.isCrossDepartment;
      return (
        isStaffInactive ||
        isPendingGracePeriod ||
        isBreached ||
        isAtRisk ||
        isUnassigned ||
        isPendingReview ||
        isException
      );
    })
    .sort((a, b) => {
      const getPriorityRank = (g: GrievanceItem) => {
        if (g.isAssignedStaffInactive) return 5;
        if (g.hasPendingExtension || g.latestExtension?.status === "PENDING")
          return 4.5;
        if (
          g.slaStatus === "BREACHED" ||
          g.status === "ESCALATED" ||
          g.escalationReason ||
          g.hodIntervention
        )
          return 4;
        if (g.slaStatus === "AT_RISK") return 3;
        if (!g.assignedStaffId) return 2;
        return 1;
      };
      return getPriorityRank(b) - getPriorityRank(a);
    });
}

export interface FilterGrievanceOptions {
  selectedTab: DepartmentHeadTab;
  searchQuery: string;
  priorityFilter: string;
  staffFilter: string;
  statusFilter?: string;
  departmentFilter?: string;
  slaFilter?: string;
  categoryFilter?: string;
  subCategoryFilter?: string;
}

export function filterDepartmentGrievances(
  grievances: GrievanceItem[],
  {
    selectedTab,
    searchQuery,
    priorityFilter,
    staffFilter,
    statusFilter,
    departmentFilter,
    slaFilter,
    categoryFilter,
    subCategoryFilter,
  }: FilterGrievanceOptions,
): GrievanceItem[] {
  return grievances.filter((g) => {
    if (selectedTab === "CLOSED") {
      if (!["CLOSED", "RESOLVED"].includes(g.status)) return false;
    } else {
      if (selectedTab !== "ALL" && ["CLOSED", "RESOLVED"].includes(g.status)) {
        return false;
      }
    }

    if (selectedTab === "EXCEPTIONS") {
      const isException =
        !g.assignedStaffId ||
        g.status === "SUBMITTED" ||
        g.status === "AWAITING_ROUTING" ||
        g.status === "AWAITING_ASSIGNMENT" ||
        g.status === "ROUTED" ||
        g.isReopened ||
        g.status === "REOPENED" ||
        g.status === "REWORK" ||
        g.isCrossDepartment ||
        g.slaStatus === "BREACHED" ||
        Boolean(g.escalationReason || g.hodIntervention);
      if (!isException) return false;
    }
    if (selectedTab === "UNASSIGNED") {
      const isUnassigned =
        !g.assignedStaffId ||
        g.status === "SUBMITTED" ||
        g.status === "AWAITING_ROUTING" ||
        g.status === "AWAITING_ASSIGNMENT" ||
        g.status === "ROUTED" ||
        g.status === "PENDING_ASSIGNMENT";
      if (!isUnassigned) return false;
    }
    if (selectedTab === "IN_PROGRESS") {
      const isInProgress =
        !["CLOSED", "RESOLVED"].includes(g.status) &&
        (g.status === "IN_PROGRESS" ||
          g.status === "ASSIGNED" ||
          g.status === "AWAITING_INFORMATION" ||
          g.status === "REWORK" ||
          g.myDepartmentStatus === "IN_PROGRESS" ||
          g.myDepartmentStatus === "ASSIGNED");
      if (!isInProgress) return false;
    }
    if (
      selectedTab === "HIGH_CRITICAL" &&
      !["CRITICAL", "HIGH"].includes(g.priority)
    ) {
      return false;
    }
    if (
      (selectedTab === "AT_RISK" || selectedTab === "SLA_RISK") &&
      (g.slaStatus !== "AT_RISK" ||
        g.status === "ESCALATED" ||
        ["CLOSED", "RESOLVED"].includes(g.status))
    ) {
      return false;
    }
    if (selectedTab === "SLA_CRITICAL") {
      const isCritical =
        (g.slaStatus === "BREACHED" ||
          g.status === "ESCALATED" ||
          Boolean(g.escalationReason || g.hodIntervention)) &&
        !["CLOSED", "RESOLVED"].includes(g.status);
      if (!isCritical) return false;
    }
    if (
      selectedTab === "ESCALATED" &&
      g.status !== "ESCALATED" &&
      g.slaStatus !== "BREACHED" &&
      !g.escalationReason &&
      !g.hodIntervention
    )
      return false;
    if (
      selectedTab === "REOPENED" &&
      !g.isReopened &&
      g.status !== "REOPENED" &&
      g.status !== "REWORK"
    ) {
      return false;
    }
    if (selectedTab === "CROSS_DEPT" && !g.isCrossDepartment) return false;
    if (
      selectedTab === "RESOLUTION_REVIEW" &&
      !requiresHeadResolutionReview(g)
    ) {
      return false;
    }

    if (statusFilter && statusFilter !== "ALL") {
      if (statusFilter === "RESOLVED") {
        if (!["RESOLVED", "CLOSED"].includes(g.status)) return false;
      } else if (statusFilter === "IN_PROGRESS") {
        if (
          [
            "CLOSED",
            "RESOLVED",
            "UNDER_REVIEW",
            "RESOLUTION_PENDING_APPROVAL",
          ].includes(g.status)
        )
          return false;
        if (g.isReopened || g.status === "REOPENED") return false;
        const isUnassigned =
          !g.assignedStaffId ||
          !g.assignedStaffName ||
          g.assignedStaffName === "Unassigned" ||
          g.status === "SUBMITTED" ||
          g.status === "AWAITING_ROUTING" ||
          g.status === "AWAITING_ASSIGNMENT" ||
          g.status === "ROUTED" ||
          g.status === "PENDING_ASSIGNMENT" ||
          g.myDepartmentStatus === "PENDING_ASSIGNMENT";
        if (isUnassigned) return false;
      } else if (
        statusFilter === "UNDER_REVIEW" ||
        statusFilter === "RESOLUTION_PENDING_APPROVAL"
      ) {
        if (
          g.status !== "UNDER_REVIEW" &&
          g.status !== "RESOLUTION_PENDING_APPROVAL"
        )
          return false;
      } else if (statusFilter === "ASSIGNED") {
        if (g.status !== "ASSIGNED" && g.myDepartmentStatus !== "ASSIGNED")
          return false;
      } else if (statusFilter === "UNASSIGNED") {
        const isUnassigned =
          !g.assignedStaffId ||
          !g.assignedStaffName ||
          g.assignedStaffName === "Unassigned" ||
          g.status === "SUBMITTED" ||
          g.status === "AWAITING_ROUTING" ||
          g.status === "AWAITING_ASSIGNMENT" ||
          g.status === "ROUTED" ||
          g.status === "PENDING_ASSIGNMENT" ||
          g.myDepartmentStatus === "PENDING_ASSIGNMENT";
        if (!isUnassigned) return false;
      } else if (statusFilter === "REOPENED") {
        if (!g.isReopened && g.status !== "REOPENED" && g.status !== "REWORK")
          return false;
      } else if (g.status !== statusFilter) {
        return false;
      }
    }

    if (departmentFilter && departmentFilter !== "ALL") {
      const matchCollab = g.collaboratingDepartments?.some(
        (d) =>
          d === departmentFilter ||
          d.toLowerCase() === departmentFilter.toLowerCase(),
      );
      if (!matchCollab) return false;
    }

    if (slaFilter && slaFilter !== "ALL") {
      if (g.slaStatus !== slaFilter) return false;
    }

    if (categoryFilter && categoryFilter !== "ALL") {
      if (g.category !== categoryFilter) return false;
    }

    if (subCategoryFilter && subCategoryFilter !== "ALL") {
      if (g.subcategory !== subCategoryFilter) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = g.title.toLowerCase().includes(q);
      const matchCode = g.ticketCode.toLowerCase().includes(q);
      const matchSub = g.submitterName.toLowerCase().includes(q);
      const matchCat =
        g.category.toLowerCase().includes(q) ||
        g.subcategory.toLowerCase().includes(q);
      const matchCollab = g.collaboratingDepartments?.some((d) =>
        d.toLowerCase().includes(q),
      );
      if (!matchTitle && !matchCode && !matchSub && !matchCat && !matchCollab) {
        return false;
      }
    }

    if (priorityFilter !== "ALL" && g.priority !== priorityFilter) return false;

    if (staffFilter === "UNASSIGNED" && g.assignedStaffId) return false;
    if (
      staffFilter !== "ALL" &&
      staffFilter !== "UNASSIGNED" &&
      g.assignedStaffId !== staffFilter
    ) {
      return false;
    }

    return true;
  });
}
