import type { StaffGrievanceItem, StaffQueueFilterState } from "@/types/staff";

/**
 * Filters assigned grievances by search text, category, priority, status, and active tab.
 */
export function filterStaffGrievances(
  items: StaffGrievanceItem[],
  filters: StaffQueueFilterState,
): StaffGrievanceItem[] {
  return items.filter((item) => {
    const s = (item.status || "").toUpperCase();
    const overallS = (item.overallStatus || "").toUpperCase();
    const isClosed = s === "CLOSED" || overallS === "CLOSED";

    // 1. Tab filter
    if (filters.tab === "assigned") {
      if (isClosed || s !== "ASSIGNED") {
        return false;
      }
    } else if (filters.tab === "in_progress") {
      if (
        item.isMyDepartmentCompleted ||
        s === "COMPLETED" ||
        isClosed ||
        s === "RESOLVED" ||
        overallS === "RESOLVED" ||
        s === "REOPENED" ||
        s === "REWORK" ||
        (item.reopenCount || 0) > 0 ||
        s === "ESCALATED" ||
        s === "UNDER_REVIEW" ||
        s === "REOPEN_REVIEW" ||
        s === "RESOLUTION_PENDING_APPROVAL" ||
        s === "AWAITING_INFORMATION" ||
        s === "WAITING_ON_USER" ||
        s === "ASSIGNED"
      ) {
        return false;
      }
    } else if (filters.tab === "at_risk") {
      if (item.slaStatus !== "AT_RISK") {
        return false;
      }
    } else if (filters.tab === "breached") {
      if (item.slaStatus !== "BREACHED") {
        return false;
      }
    } else if (filters.tab === "on_track") {
      if (item.slaStatus !== "ON_TRACK") {
        return false;
      }
    } else if (filters.tab === "reopened") {
      if (
        isClosed ||
        s === "RESOLVED" ||
        overallS === "RESOLVED" ||
        s === "COMPLETED" ||
        item.isMyDepartmentCompleted
      ) {
        return false;
      }
      if ((item.reopenCount || 0) <= 0 && s !== "REOPENED" && s !== "REWORK") {
        return false;
      }
    } else if (filters.tab === "completed") {
      if (
        isClosed ||
        (s !== "RESOLVED" &&
          overallS !== "RESOLVED" &&
          s !== "UNDER_REVIEW" &&
          s !== "COMPLETED" &&
          !item.isMyDepartmentCompleted)
      ) {
        return false;
      }
    } else if (filters.tab === "closed") {
      if (!isClosed) return false;
    } else if (filters.tab === "resolved") {
      if (isClosed) return false;
      const isStaffResolved =
        s === "RESOLVED" ||
        overallS === "RESOLVED" ||
        s === "COMPLETED" ||
        Boolean(item.isMyDepartmentCompleted);
      if (!isStaffResolved) return false;
    } else if (filters.tab === "under_review") {
      if (
        item.isMyDepartmentCompleted ||
        s === "COMPLETED" ||
        isClosed ||
        s === "RESOLVED" ||
        overallS === "RESOLVED" ||
        (s !== "UNDER_REVIEW" &&
          s !== "REOPEN_REVIEW" &&
          s !== "RESOLUTION_PENDING_APPROVAL")
      ) {
        return false;
      }
    } else if (filters.tab === "awaiting_info") {
      if (
        isClosed ||
        s === "RESOLVED" ||
        overallS === "RESOLVED" ||
        item.isMyDepartmentCompleted ||
        (s !== "AWAITING_INFORMATION" &&
          s !== "WAITING_ON_USER" &&
          s !== "PENDING_INFO")
      ) {
        return false;
      }
    } else if (filters.tab === "escalated") {
      if (
        isClosed ||
        s === "RESOLVED" ||
        overallS === "RESOLVED" ||
        item.isMyDepartmentCompleted ||
        s !== "ESCALATED"
      ) {
        return false;
      }
    }

    // 2. Status filter dropdown
    if (filters.status && filters.status !== "ALL") {
      const target = filters.status.toUpperCase();
      if (target === "RESOLVED") {
        if (isClosed) return false;
        const isStaffResolved =
          s === "RESOLVED" ||
          overallS === "RESOLVED" ||
          s === "COMPLETED" ||
          Boolean(item.isMyDepartmentCompleted);
        if (!isStaffResolved) return false;
      } else if (target === "CLOSED") {
        if (!isClosed) return false;
      } else if (s !== target) {
        return false;
      }
    }

    // 3. Priority filter dropdown
    if (filters.priority && filters.priority !== "ALL") {
      if (item.priority.toUpperCase() !== filters.priority.toUpperCase()) {
        return false;
      }
    }

    // 4. SLA Status filter dropdown
    if (filters.slaStatus && filters.slaStatus !== "ALL") {
      if (item.slaStatus.toUpperCase() !== filters.slaStatus.toUpperCase()) {
        return false;
      }
    }

    // 5. Category filter dropdown
    if (filters.category && filters.category !== "ALL") {
      if (item.category.toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }
    }

    // 6. Search query
    const query = (filters.searchQuery || "").trim().toLowerCase();
    if (query) {
      const matchNumber = item.grievanceNumber.toLowerCase().includes(query);
      const matchTitle = item.title.toLowerCase().includes(query);
      const matchSubmitter = item.submitterName.toLowerCase().includes(query);
      const matchCategory = item.category.toLowerCase().includes(query);
      if (!matchNumber && !matchTitle && !matchSubmitter && !matchCategory) {
        return false;
      }
    }

    return true;
  });
}
