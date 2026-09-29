"use client";

import { Check, ChevronDown, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AdvancedFilterBar, FilterCondition, FilterFieldDef } from "@/components/filters/advanced-filter-bar";
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
  selectedDept: string;
  setSelectedDept: (val: string) => void;
  selectedPriority: string;
  setSelectedPriority: (val: string) => void;
  selectedStatus: string;
  setSelectedStatus: (val: string) => void;
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
  setCurrentPage,
}: AdminGrievanceToolbarProps) {
  // View DropdownMenu state
  const [isViewOpen, setIsViewOpen] = useState(false);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        viewMenuRef.current &&
        !viewMenuRef.current.contains(event.target as Node)
      ) {
        setIsViewOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
  if (selectedDept !== "ALL") {
    currentFilters.push({ id: "dept", fieldId: "department", operator: "Is", value: selectedDept });
  }
  if (selectedPriority !== "ALL") {
    currentFilters.push({ id: "priority", fieldId: "priority", operator: "Is", value: selectedPriority });
  }
  if (selectedStatus !== "ALL") {
    currentFilters.push({ id: "status", fieldId: "status", operator: "Is", value: selectedStatus });
  }

  const handleFiltersChange = (newFilters: FilterCondition[]) => {
    let dept = "ALL";
    let prio = "ALL";
    let status = "ALL";
    newFilters.forEach((f) => {
      if (f.fieldId === "department") dept = f.value;
      if (f.fieldId === "priority") prio = f.value;
      if (f.fieldId === "status") status = f.value;
    });
    setSelectedDept(dept);
    setSelectedPriority(prio);
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSelectedDept("ALL");
    setSelectedPriority("ALL");
    setSelectedStatus("ALL");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const viewOptions: {
    key: TableTab;
    label: string;
    count: number;
    dotColor?: string;
  }[] = [
    { key: "ALL", label: "All", count: counts.all },
    {
      key: "EXCEPTIONS",
      label: "Exceptions",
      count: counts.exceptions,
      dotColor: "bg-amber-400",
    },
    {
      key: "ACTIVE",
      label: "In Progress",
      count: counts.inProgress ?? counts.active,
      dotColor: "bg-emerald-500",
    },
    {
      key: "SLA_RISK",
      label: "SLA Risk",
      count: counts.slaRisk,
      dotColor: "bg-amber-500",
    },
    {
      key: "SLA_CRITICAL",
      label: "SLA Critical",
      count: counts.slaCritical ?? counts.slaRisk,
      dotColor: "bg-rose-500",
    },
    {
      key: "REOPENED",
      label: "Reopened",
      count: counts.reopened ?? 0,
      dotColor: "bg-purple-500",
    },
    {
      key: "ESCALATED",
      label: "Escalated",
      count: counts.escalated ?? 0,
      dotColor: "bg-red-600",
    },
    { key: "CLOSED", label: "Closed", count: counts.closed },
  ];

  const activeOption =
    viewOptions.find((v) => v.key === activeTab) ||
    (activeTab === "IN_PROGRESS"
      ? viewOptions.find((v) => v.key === "ACTIVE")
      : null);

  const activeLabel =
    activeOption && activeOption.key !== "ALL"
      ? `View: ${activeOption.label}`
      : "View";

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
            placeholder="Search by ID, keyword, or submitter..."
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

          {/* [ View ▼ ] DropdownMenu */}
          <div className="relative inline-block" ref={viewMenuRef}>
            <button
              type="button"
              onClick={() => setIsViewOpen(!isViewOpen)}
              className={`inline-flex items-center h-10 gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                activeTab !== "ALL"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{activeLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isViewOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  View ▾
                </div>
                <div className="border-t border-slate-100 my-1" />
                {viewOptions.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.key);
                      setCurrentPage(1);
                      setIsViewOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3.5 py-2 text-xs transition cursor-pointer ${
                      activeTab === item.key ||
                      (item.key === "ACTIVE" && activeTab === "IN_PROGRESS")
                        ? "bg-emerald-50/80 font-semibold text-emerald-900"
                        : "font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.dotColor && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${item.dotColor}`}
                        />
                      )}
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-normal text-slate-400">
                        ({item.count})
                      </span>
                      {(activeTab === item.key ||
                        (item.key === "ACTIVE" &&
                          activeTab === "IN_PROGRESS")) && (
                        <Check className="h-3.5 w-3.5 text-emerald-700" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
