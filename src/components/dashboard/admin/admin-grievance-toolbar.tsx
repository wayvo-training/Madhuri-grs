"use client";

import { Filter, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { CustomSelect } from "@/components/ui/custom-select";
import { Popover } from "@/components/ui/popover";

export type TableTab = "ALL" | "EXCEPTIONS" | "ACTIVE" | "SLA_RISK" | "CLOSED";

interface AdminGrievanceToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  activeTab: TableTab;
  setActiveTab: (val: TableTab) => void;
  counts: {
    all: number;
    exceptions: number;
    active: number;
    slaRisk: number;
    closed: number;
  };
  departments: { department_id: string; department_name: string }[];
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

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
      {/* Search */}
      <div className="relative flex-1 min-w-55">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Search ID, title, submitter, category..."
          value={searchQuery}
          onChange={(e) => {
            const val = e.target.value;
            setSearchQuery(val);
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("grs:component-search", { detail: val }),
              );
            }
          }}
          className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600/20"
        />
      </div>

      {/* View Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 hidden sm:block">
          View:
        </span>
        <CustomSelect
          aria-label="Select View"
          value={activeTab}
          onChange={(val) => setActiveTab(val as TableTab)}
          options={[
            { value: "ALL", label: `All (${counts.all})` },
            { value: "EXCEPTIONS", label: `Exceptions (${counts.exceptions})` },
            { value: "ACTIVE", label: `Active (${counts.active})` },
            { value: "SLA_RISK", label: `SLA Risk (${counts.slaRisk})` },
            { value: "CLOSED", label: `Closed (${counts.closed})` },
          ]}
          className="w-35"
        />
      </div>

      <Popover
        isOpen={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        widthClass="w-80"
        trigger={
          <>
            <button
              type="button"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/20"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {(selectedDept !== "ALL" ||
                selectedPriority !== "ALL" ||
                selectedStatus !== "ALL") && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                  {(selectedDept !== "ALL" ? 1 : 0) +
                    (selectedPriority !== "ALL" ? 1 : 0) +
                    (selectedStatus !== "ALL" ? 1 : 0)}
                </span>
              )}
              <span className="text-slate-400">▾</span>
            </button>

            {(selectedDept !== "ALL" ||
              selectedPriority !== "ALL" ||
              selectedStatus !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDept("ALL");
                  setSelectedPriority("ALL");
                  setSelectedStatus("ALL");
                  setCurrentPage(1);
                }}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              >
                Clear
              </button>
            )}
          </>
        }
      >
        <h4 className="mb-3 text-xs font-semibold text-slate-900">Filters</h4>

        <div className="space-y-2">
          <div>
            <p className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Department
            </p>
            <CustomSelect
              aria-label="Filter by department"
              value={pendingDept}
              onChange={setPendingDept}
              className="w-full"
              options={[
                { value: "ALL", label: "All Departments" },
                ...departments.map((d) => ({
                  value: d.department_name,
                  label: d.department_name,
                })),
              ]}
            />
          </div>

          <div>
            <p className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Priority
            </p>
            <CustomSelect
              aria-label="Filter by priority"
              value={pendingPriority}
              onChange={setPendingPriority}
              className="w-full"
              options={[
                { value: "ALL", label: "All Priorities" },
                { value: "CRITICAL", label: "Critical" },
                { value: "HIGH", label: "High" },
                { value: "MEDIUM", label: "Medium" },
                { value: "LOW", label: "Low" },
              ]}
            />
          </div>

          <div>
            <p className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Status
            </p>
            <CustomSelect
              aria-label="Filter by status"
              value={pendingStatus}
              onChange={setPendingStatus}
              className="w-full"
              options={[
                { value: "ALL", label: "All Statuses" },
                { value: "SUBMITTED", label: "Submitted" },
                { value: "ROUTED", label: "Routed" },
                { value: "ASSIGNED", label: "Assigned" },
                { value: "IN_PROGRESS", label: "In Progress" },
                { value: "UNDER_REVIEW", label: "Under Review" },
                { value: "ESCALATED", label: "Escalated" },
                { value: "CLOSED", label: "Closed" },
              ]}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => {
              setPendingDept("ALL");
              setPendingPriority("ALL");
              setPendingStatus("ALL");
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedDept(pendingDept);
              setSelectedPriority(pendingPriority);
              setSelectedStatus(pendingStatus);
              setCurrentPage(1);
              setIsFiltersOpen(false);
            }}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
          >
            Apply
          </button>
        </div>
      </Popover>
    </div>
  );
}
