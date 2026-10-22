"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  computeAttentionRequiredList,
  computeDepartmentMetrics,
  filterDepartmentGrievances,
} from "@/lib/department-head/filters";
import type {
  DepartmentHeadTab,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";

interface UseQueueFiltersProps {
  grievances: GrievanceItem[];
  staffList: StaffMember[];
  initialStatusFilter?: string;
  initialPriorityFilter?: string;
  initialStaffFilter?: string;
  initialTab?: DepartmentHeadTab;
}

export function useQueueFilters({
  grievances,
  staffList,
  initialStatusFilter = "ALL",
  initialPriorityFilter = "ALL",
  initialStaffFilter = "ALL",
  initialTab = "ALL",
}: UseQueueFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlStatus = searchParams?.get("status");
  const urlPriority = searchParams?.get("priority");
  const urlStaff = searchParams?.get("staff");
  const urlTab = searchParams?.get("tab") as DepartmentHeadTab | null;

  const [selectedTab, setSelectedTab] = useState<DepartmentHeadTab>(
    urlTab || initialTab || "ALL",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState(
    urlPriority || initialPriorityFilter || "ALL",
  );
  const [staffFilter, setStaffFilter] = useState(
    urlStaff || initialStaffFilter || "ALL",
  );
  const [statusFilter, setStatusFilter] = useState(
    urlStatus || initialStatusFilter || "ALL",
  );
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [slaFilter, setSlaFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [subCategoryFilter, setSubCategoryFilter] = useState("ALL");

  useEffect(() => {
    if (urlStatus && urlStatus !== "ALL") {
      setStatusFilter(urlStatus);
    } else if (initialStatusFilter && initialStatusFilter !== "ALL") {
      setStatusFilter(initialStatusFilter);
    }

    if (urlPriority && urlPriority !== "ALL") {
      setPriorityFilter(urlPriority);
    } else if (initialPriorityFilter && initialPriorityFilter !== "ALL") {
      setPriorityFilter(initialPriorityFilter);
    }

    if (urlStaff && urlStaff !== "ALL") {
      setStaffFilter(urlStaff);
    } else if (initialStaffFilter && initialStaffFilter !== "ALL") {
      setStaffFilter(initialStaffFilter);
    }

    if (urlTab && urlTab !== "ALL") {
      setSelectedTab(urlTab);
    } else if (initialTab && initialTab !== "ALL") {
      setSelectedTab(initialTab);
    }
  }, [
    urlStatus,
    urlPriority,
    urlStaff,
    urlTab,
    initialStatusFilter,
    initialPriorityFilter,
    initialStaffFilter,
    initialTab,
  ]);

  const resetFilters = () => {
    setSelectedTab("ALL");
    setPriorityFilter("ALL");
    setStaffFilter("ALL");
    setStatusFilter("ALL");
    setDepartmentFilter("ALL");
    setSlaFilter("ALL");
    setCategoryFilter("ALL");
    setSubCategoryFilter("ALL");
    setSearchQuery("");
    if (pathname && (urlStatus || urlPriority || urlStaff || urlTab)) {
      router.replace(pathname);
    }
  };

  const isFiltered =
    selectedTab !== "ALL" ||
    priorityFilter !== "ALL" ||
    staffFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    departmentFilter !== "ALL" ||
    slaFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    subCategoryFilter !== "ALL" ||
    searchQuery.trim().length > 0;

  const metrics = useMemo(
    () => computeDepartmentMetrics(grievances, staffList),
    [grievances, staffList],
  );

  const attentionRequiredList = useMemo(
    () => computeAttentionRequiredList(grievances),
    [grievances],
  );

  const filteredGrievances = useMemo(
    () =>
      filterDepartmentGrievances(grievances, {
        selectedTab,
        searchQuery,
        priorityFilter,
        staffFilter,
        statusFilter,
        departmentFilter,
        slaFilter,
        categoryFilter,
        subCategoryFilter,
      }),
    [
      grievances,
      selectedTab,
      searchQuery,
      priorityFilter,
      staffFilter,
      statusFilter,
      departmentFilter,
      slaFilter,
      categoryFilter,
      subCategoryFilter,
    ],
  );

  return {
    selectedTab,
    setSelectedTab,
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter,
    staffFilter,
    setStaffFilter,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    slaFilter,
    setSlaFilter,
    categoryFilter,
    setCategoryFilter,
    subCategoryFilter,
    setSubCategoryFilter,
    resetFilters,
    isFiltered,
    metrics,
    attentionRequiredList,
    filteredGrievances,
  };
}
