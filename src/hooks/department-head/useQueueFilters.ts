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
  const [slaFilter, setSlaFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [subCategoryFilter, setSubCategoryFilter] = useState("ALL");

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
