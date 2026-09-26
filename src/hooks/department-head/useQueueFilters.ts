"use client";

import { useMemo, useState } from "react";
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
}

export function useQueueFilters({
  grievances,
  staffList,
}: UseQueueFiltersProps) {
  const [selectedTab, setSelectedTab] = useState<DepartmentHeadTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [staffFilter, setStaffFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  const resetFilters = () => {
    setSelectedTab("ALL");
    setPriorityFilter("ALL");
    setStaffFilter("ALL");
    setStatusFilter("ALL");
    setDepartmentFilter("ALL");
    setSearchQuery("");
  };

  const isFiltered =
    selectedTab !== "ALL" ||
    priorityFilter !== "ALL" ||
    staffFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    departmentFilter !== "ALL" ||
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
      }),
    [
      grievances,
      selectedTab,
      searchQuery,
      priorityFilter,
      staffFilter,
      statusFilter,
      departmentFilter,
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
    resetFilters,
    isFiltered,
    metrics,
    attentionRequiredList,
    filteredGrievances,
  };
}
