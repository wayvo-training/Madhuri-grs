"use client";

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
  searchQuery: _searchQuery,
  setSearchQuery,
  activeTab: _activeTab,
  setActiveTab: _setActiveTab,
  counts: _counts,
  departments,
  categories = [],
  selectedDept: _selectedDept,
  setSelectedDept,
  selectedPriority: _selectedPriority,
  setSelectedPriority,
  selectedStatus: _selectedStatus,
  setSelectedStatus,
  selectedSla: _selectedSla,
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
        { label: "Unassigned (Submitted/Awaiting)", value: "UNASSIGNED" },
        { label: "Submitted", value: "SUBMITTED" },
        { label: "Awaiting Routing", value: "AWAITING_ROUTING" },
        { label: "Awaiting Assignment", value: "AWAITING_ASSIGNMENT" },
        { label: "Assigned", value: "ASSIGNED" },
        { label: "In Progress", value: "IN_PROGRESS" },
        { label: "Awaiting Information", value: "AWAITING_INFORMATION" },
        {
          label: "Resolution Pending Approval",
          value: "RESOLUTION_PENDING_APPROVAL",
        },
        { label: "Rework", value: "REWORK" },
        { label: "Resolved", value: "RESOLVED" },
        { label: "Closed", value: "CLOSED" },
        { label: "Reopened", value: "REOPENED" },
        { label: "Escalated", value: "ESCALATED" },
      ],
    },
    {
      id: "sla",
      label: "SLA Status",
      type: "select",
      options: [
        { label: "Breached (Critical)", value: "BREACHED" },
        { label: "At Risk", value: "AT_RISK" },
        { label: "On Track", value: "ON_TRACK" },
      ],
    },
    {
      id: "category",
      label: "Category",
      type: "select",
      options: categories.map((c) => ({ label: c, value: c })),
    },
    {
      id: "search",
      label: "Search (ID/Submitter)",
      type: "text",
    },
  ];

  const handleSearchChange = (conditions: SearchCondition[], _mode: string) => {
    const newDept: string[] = [];
    const newPriority: string[] = [];
    const newStatus: string[] = [];
    const newSla: string[] = [];
    let newSearch = "";

    conditions.forEach((condition) => {
      const isNegative =
        condition.operator === "not_equals" ||
        condition.operator === "is_not_in" ||
        condition.operator === "does_not_contain";
      const valArray = Array.isArray(condition.value)
        ? condition.value
        : [condition.value as string];
      const processed = valArray.map((v) => (isNegative ? `!${v}` : v));

      if (condition.field === "department") newDept.push(...processed);
      if (condition.field === "priority") newPriority.push(...processed);
      if (condition.field === "status") newStatus.push(...processed);
      if (condition.field === "sla") newSla.push(...processed);
      if (condition.field === "category" || condition.field === "search") {
        const firstVal = valArray[0] || "";
        if (firstVal) {
          newSearch = isNegative ? `!${firstVal}` : firstVal;
        }
      }
    });

    setSelectedDept(newDept);
    setSelectedPriority(newPriority);
    setSelectedStatus(newStatus);
    setSelectedSla(newSla);
    setSearchQuery(newSearch);
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
