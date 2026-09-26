import type {
  DepartmentHeadTab,
  DepartmentMetricsSummary,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";

export function requiresHeadResolutionReview(item: GrievanceItem): boolean {
  if (item.status === "CLOSED" || item.status === "RESOLVED") {
    return false;
  }
  if (item.status === "UNDER_REVIEW") return true;
  if (item.hodIntervention) return true;
  if (item.status === "ESCALATED") return true;
  if ((item.reopenCount ?? 0) >= 3) return true;
  if (item.slaStatus === "BREACHED") return true;
  if (!item.submittedResolution) return false;
  return false;
}

export function computeDepartmentMetrics(
  grievances: GrievanceItem[],
  staffList: StaffMember[],
): DepartmentMetricsSummary {
  const unassignedCount = grievances.filter(
    (g) => !g.assignedStaffId && g.status !== "CLOSED",
  ).length;

  const inProgressCount = grievances.filter(
    (g) => g.status === "IN_PROGRESS" || g.status === "ASSIGNED",
  ).length;

  // SLA At Risk = 75%+ consumed, but not yet breached/escalated
  const slaAtRiskCount = grievances.filter(
    (g) =>
      g.slaStatus === "AT_RISK" &&
      g.status !== "ESCALATED" &&
      g.status !== "CLOSED",
  ).length;

  // Escalated = Active grievances currently in ESCALATED status requiring HOD intervention
  const escalatedCount = grievances.filter(
    (g) => g.status === "ESCALATED",
  ).length;

  const atRiskCount = slaAtRiskCount;

  const reopenedCount = grievances.filter(
    (g) => (g.isReopened || g.status === "REOPENED") && g.status !== "CLOSED",
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
        g.isReopened ||
        g.status === "REOPENED" ||
        g.isCrossDepartment ||
        g.slaStatus === "BREACHED") &&
      g.status !== "CLOSED" &&
      g.status !== "RESOLVED",
  ).length;

  const slaCriticalCount = grievances.filter(
    (g) =>
      (g.slaStatus === "BREACHED" || g.status === "ESCALATED") &&
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
      const isBreached = g.slaStatus === "BREACHED" || g.status === "ESCALATED";
      const isAtRisk = g.slaStatus === "AT_RISK";
      const isUnassigned =
        !g.assignedStaffId || g.status === "SUBMITTED" || g.status === "ROUTED";
      const isPendingReview = requiresHeadResolutionReview(g);
      const isException =
        g.isReopened || g.status === "REOPENED" || g.isCrossDepartment;
      return (
        isBreached || isAtRisk || isUnassigned || isPendingReview || isException
      );
    })
    .sort((a, b) => {
      const getPriorityRank = (g: GrievanceItem) => {
        if (g.slaStatus === "BREACHED" || g.status === "ESCALATED") return 4;
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
        g.isReopened ||
        g.status === "REOPENED" ||
        g.isCrossDepartment ||
        g.slaStatus === "BREACHED";
      if (!isException) return false;
    }
    if (selectedTab === "UNASSIGNED" && g.assignedStaffId) return false;
    if (
      selectedTab === "IN_PROGRESS" &&
      !["IN_PROGRESS", "ASSIGNED"].includes(g.status)
    ) {
      return false;
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
        (g.slaStatus === "BREACHED" || g.status === "ESCALATED") &&
        !["CLOSED", "RESOLVED"].includes(g.status);
      if (!isCritical) return false;
    }
    if (selectedTab === "ESCALATED" && g.status !== "ESCALATED") return false;
    if (
      selectedTab === "REOPENED" &&
      !g.isReopened &&
      g.status !== "REOPENED"
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
        if (!["IN_PROGRESS", "ASSIGNED"].includes(g.status)) return false;
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
