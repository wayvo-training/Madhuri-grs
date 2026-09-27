"use client";

import { Check, ChevronDown, Filter, RotateCcw, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CustomSelect } from "@/components/ui/custom-select";
import { Popover } from "@/components/ui/popover";
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
  // Popover internal state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [pendingDept, setPendingDept] = useState<string>("ALL");
  const [pendingPriority, setPendingPriority] = useState<string>("ALL");
  const [pendingStatus, setPendingStatus] = useState<string>("ALL");

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
    if (isViewOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isViewOpen]);

  useEffect(() => {
    if (isFiltersOpen) {
      setPendingDept(selectedDept);
      setPendingPriority(selectedPriority);
      setPendingStatus(selectedStatus);
    }
  }, [isFiltersOpen, selectedDept, selectedPriority, selectedStatus]);

  const activeFiltersCount =
    (selectedDept !== "ALL" ? 1 : 0) +
    (selectedPriority !== "ALL" ? 1 : 0) +
    (selectedStatus !== "ALL" ? 1 : 0);

  const handleApply = () => {
    setSelectedDept(pendingDept);
    setSelectedPriority(pendingPriority);
    setSelectedStatus(pendingStatus);
    setCurrentPage(1);
    setIsFiltersOpen(false);
  };

  const handleClear = () => {
    setPendingDept("ALL");
    setPendingPriority("ALL");
    setPendingStatus("ALL");
    setSelectedDept("ALL");
    setSelectedPriority("ALL");
    setSelectedStatus("ALL");
    setCurrentPage(1);
    setIsFiltersOpen(false);
  };

  // Exactly the 8 views requested:
  // All, Exceptions, In Progress, SLA Risk, SLA Critical, Reopened, Escalated, Closed
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
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by ID, keyword, or submitter..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Controls: [ View ▼ ] DropdownMenu & [ Filters ] Popover */}
      <div className="flex items-center gap-2">
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}

        {/* [ View ▼ ] DropdownMenu */}
        <div className="relative inline-block" ref={viewMenuRef}>
          <button
            type="button"
            onClick={() => setIsViewOpen(!isViewOpen)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
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

        {/* [ Filters ] Popover Button */}
        <Popover
          isOpen={isFiltersOpen}
          onOpenChange={setIsFiltersOpen}
          widthClass="w-80"
          trigger={
            <button
              type="button"
              onClick={() => setIsFiltersOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                activeFiltersCount > 0
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Filter Grievances
              </span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-medium text-emerald-800 hover:underline cursor-pointer"
                >
                  Reset all
                </button>
              )}
            </div>

            {/* Department */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Department
              </span>
              <CustomSelect
                value={pendingDept}
                onChange={setPendingDept}
                options={[
                  { value: "ALL", label: "All Departments" },
                  ...departments.map((d) => ({
                    value: d.department_name,
                    label: d.department_name,
                  })),
                ]}
              />
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Priority
              </span>
              <CustomSelect
                value={pendingPriority}
                onChange={setPendingPriority}
                options={[
                  { value: "ALL", label: "All Priorities" },
                  { value: "CRITICAL", label: "Critical" },
                  { value: "HIGH", label: "High" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "LOW", label: "Low" },
                ]}
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-700">
                Status
              </span>
              <CustomSelect
                value={pendingStatus}
                onChange={setPendingStatus}
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "SUBMITTED", label: "Submitted" },
                  { value: "ROUTED", label: "Routed" },
                  { value: "ASSIGNED", label: "Assigned" },
                  { value: "IN_PROGRESS", label: "In Progress" },
                  { value: "UNDER_REVIEW", label: "Under Review" },
                  { value: "RESOLVED", label: "Resolved" },
                  { value: "CLOSED", label: "Closed" },
                  { value: "REOPENED", label: "Reopened" },
                  { value: "REOPEN_REVIEW", label: "Reopen Review" },
                ]}
              />
            </div>

            {/* Actions: [Clear] [Apply] */}
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="rounded-lg bg-[#0F766E] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </Popover>
      </div>
    </div>
  );
}
