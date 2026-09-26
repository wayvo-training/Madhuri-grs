"use client";

import { Filter, Search } from "lucide-react";
import { useEffect, useState } from "react";
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

  const handleReset = () => {
    setPendingDept("ALL");
    setPendingPriority("ALL");
    setPendingStatus("ALL");
    setSelectedDept("ALL");
    setSelectedPriority("ALL");
    setSelectedStatus("ALL");
    setCurrentPage(1);
    setIsFiltersOpen(false);
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* Top Filter Buttons / Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab("ALL");
            setCurrentPage(1);
          }}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "ALL"
              ? "bg-[#064E3B] text-white shadow-xs"
              : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          All ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("EXCEPTIONS");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "EXCEPTIONS"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100/70"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Exceptions ({counts.exceptions})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("ACTIVE");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "ACTIVE"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          In Progress ({counts.active})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("SLA_RISK");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "SLA_RISK"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-rose-50 text-rose-700 hover:bg-rose-100/70"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          SLA Critical ({counts.slaRisk})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("CLOSED");
            setCurrentPage(1);
          }}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "CLOSED"
              ? "bg-slate-700 text-white shadow-xs"
              : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          Resolved ({counts.closed})
        </button>
      </div>

      {/* Search and Filters Popover */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, keyword, or submitter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
          />
        </div>

        {/* Filter Popover Button */}
        <Popover
          isOpen={isFiltersOpen}
          onOpenChange={setIsFiltersOpen}
          trigger={
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                activeFiltersCount > 0
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <span>Filter View</span>
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
                  onClick={handleReset}
                  className="text-xs font-medium text-emerald-800 hover:underline"
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
                    value: d.department_id,
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

            {/* Actions */}
            <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setIsFiltersOpen(false)}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="rounded-lg bg-[#064E3B] px-3 py-1 text-xs font-medium text-white shadow-xs hover:bg-emerald-900"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </Popover>
      </div>
    </div>
  );
}
