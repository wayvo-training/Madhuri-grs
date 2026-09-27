import type { StaffGrievanceItem, StaffQueueFilterState } from "@/types/staff";

/**
 * Filters assigned grievances by search text, category, priority, status, and active tab.
 */
export function filterStaffGrievances(
  items: StaffGrievanceItem[],
  filters: StaffQueueFilterState,
): StaffGrievanceItem[] {
  return items.filter((item) => {
    // 1. Tab filter
    if (filters.tab === "in_progress") {
      if (item.status !== "IN_PROGRESS" && item.status !== "ASSIGNED") {
        return false;
      }
    } else if (filters.tab === "at_risk") {
      if (item.slaStatus !== "AT_RISK") return false;
    } else if (filters.tab === "breached") {
      if (item.slaStatus !== "BREACHED") return false;
    } else if (filters.tab === "reopened") {
      if (item.reopenCount <= 0 && item.status !== "REOPENED") return false;
    } else if (filters.tab === "completed") {
      if (item.status !== "CLOSED" && item.status !== "UNDER_REVIEW") {
        return false;
      }
    }

    // 2. Status filter dropdown
    if (filters.status && filters.status !== "ALL") {
      if (item.status.toUpperCase() !== filters.status.toUpperCase()) {
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
