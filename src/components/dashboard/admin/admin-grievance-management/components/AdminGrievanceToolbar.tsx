"use client";

import { RotateCcw } from "lucide-react";
import {
  AdvancedFilterBar,
  type FilterCondition,
  type FilterFieldDef,
} from "@/components/filters/advanced-filter-bar";
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
  const filterFields: FilterFieldDef[] = [
    {
      id: "department",
      label: "Department",
      type: "searchable-select",
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
  ];

  const currentFilters: FilterCondition[] = [];
  selectedDept.forEach((dept) => {
    currentFilters.push({
      id: `dept-${dept}`,
      fieldId: "department",
      operator: "Is",
      value: dept,
    });
  });

  selectedPriority.forEach((prio) => {
    currentFilters.push({
      id: `priority-${prio}`,
      fieldId: "priority",
      operator: "Is",
      value: prio,
    });
  });

  selectedStatus.forEach((stat) => {
    currentFilters.push({
      id: `status-${stat}`,
      fieldId: "status",
      operator: "Is",
      value: stat,
    });
  });

  selectedSla.forEach((sla) => {
    currentFilters.push({
      id: `sla-${sla}`,
      fieldId: "sla",
      operator: "Is",
      value: sla,
    });
  });

  const handleFiltersChange = (newFilters: FilterCondition[]) => {
    const depts: string[] = [];
    const prios: string[] = [];
    const stats: string[] = [];
    const slas: string[] = [];
    newFilters.forEach((f) => {
      if (f.fieldId === "department") depts.push(f.value);
      if (f.fieldId === "priority") prios.push(f.value);
      if (f.fieldId === "status") stats.push(f.value);
      if (f.fieldId === "sla") slas.push(f.value);
    });
    setSelectedDept(depts);
    setSelectedPriority(prios);
    setSelectedStatus(stats);
    setSelectedSla(slas);
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
        {/* Advanced Filter Builder (Search & Filter Tags) */}
        <div className="flex-1 w-full">
          <AdvancedFilterBar
            fields={filterFields}
            filters={currentFilters}
            onFiltersChange={handleFiltersChange}
            search={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Search by ID or submitter..."
          />
        </div>

        {/* Action Controls (Reset & View) */}
        <div className="flex items-center gap-2">
          {currentFilters.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
