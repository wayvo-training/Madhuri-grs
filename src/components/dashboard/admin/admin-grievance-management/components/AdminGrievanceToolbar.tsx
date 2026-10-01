"use client";

import { RotateCcw } from "lucide-react";
import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import type {
  DepartmentOption,
  TabCounts,
  TableTab,
} from "@/types/admin/grievances";

interface AdminGrievanceToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  activeTab: TableTab;
  setActiveTab: (val: TableTab) => void;
  counts: TabCounts;
  departments: DepartmentOption[];
  categories?: string[];
  selectedDept: string[];
  setSelectedDept: (val: string[]) => void;
  selectedPriority: string[];
  setSelectedPriority: (val: string[]) => void;
  selectedStatus: string[];
  setSelectedStatus: (val: string[]) => void;
  selectedSla: string[];
  setSelectedSla: (val: string[]) => void;
  setCurrentPage: (val: number) => void;
}

export function AdminGrievanceToolbar({
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  counts,
  departments,
  categories = [],
  selectedDept,
  setSelectedDept,
  selectedPriority,
  setSelectedPriority,
  selectedStatus,
  setSelectedStatus,
  selectedSla,
  setSelectedSla,
  setCurrentPage,
}: AdminGrievanceToolbarProps) {
  const filterFields: SearchFieldDef[] = [
    {
      id: "department",
      label: "Department",
      type: "select",
      options: departments.map((d) => ({
        label: d.department_name,
        value: d.department_name,
      })),
    },
    {
      id: "priority",
      label: "Priority",
      type: "select",
      options: [
        { label: "Critical", value: "CRITICAL" },
        { label: "High", value: "HIGH" },
        { label: "Medium", value: "MEDIUM" },
        { label: "Low", value: "LOW" },
      ],
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Submitted", value: "SUBMITTED" },
        { label: "Routed", value: "ROUTED" },
        { label: "Assigned", value: "ASSIGNED" },
        { label: "In Progress", value: "IN_PROGRESS" },
        { label: "Under Review", value: "UNDER_REVIEW" },
        { label: "Resolved", value: "RESOLVED" },
        { label: "Closed", value: "CLOSED" },
        { label: "Reopened", value: "REOPENED" },
        { label: "Reopen Review", value: "REOPEN_REVIEW" },
        { label: "Escalated", value: "ESCALATED" },
      ],
    },
    {
      id: "sla",
      label: "SLA Status",
      type: "select",
      options: [
        { label: "SLA Critical", value: "SLA_CRITICAL" },
        { label: "SLA Risk", value: "SLA_RISK" },
        { label: "On Track", value: "ON_TRACK" },
      ],
    },
    {
      id: "category",
      label: "Category",
      type: "select",
      options: categories.map(c => ({ label: c, value: c })),
    },
    {
      id: "search",
      label: "Search (ID/Submitter)",
      type: "text",
    },
  ];

  const handleSearchChange = (conditions: SearchCondition[], mode: string) => {
    setSelectedDept([]);
    setSelectedPriority([]);
    setSelectedStatus([]);
    setSelectedSla([]);
    setSearchQuery("");

    let newDept: string[] = [];
    let newPriority: string[] = [];
    let newStatus: string[] = [];
    let newSla: string[] = [];
    let newSearch = "";

    conditions.forEach((condition) => {
      let valArray = Array.isArray(condition.value) ? condition.value : [condition.value as string];
      if (condition.field === "department") newDept.push(...valArray);
      if (condition.field === "priority") newPriority.push(...valArray);
      if (condition.field === "status") newStatus.push(...valArray);
      if (condition.field === "sla") newSla.push(...valArray);
      if (condition.field === "category" || condition.field === "search") {
        newSearch = valArray[0] || newSearch;
      }
    });

    if (newDept.length > 0) setSelectedDept(newDept);
    if (newPriority.length > 0) setSelectedPriority(newPriority);
    if (newStatus.length > 0) setSelectedStatus(newStatus);
    if (newSla.length > 0) setSelectedSla(newSla);
    if (newSearch) setSearchQuery(newSearch);

    setCurrentPage(1);
  };

  const handleClear = () => {
    setSelectedDept([]);
    setSelectedPriority([]);
    setSelectedStatus([]);
    setSelectedSla([]);
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Search Input, View Controls & Active Filters Row */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-end w-full">
        <div className="flex-1 w-full">
          <AdvancedTableSearch
            fields={filterFields}
            onSearch={handleSearchChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
