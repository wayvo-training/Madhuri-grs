import { ChevronDown, Sliders } from "lucide-react";
import type { DepartmentOption, MainTab } from "@/types/admin/master-rules";

export interface RulesFilterPopoverProps {
  activeTab: MainTab;
  activeDropdown: string | null;
  setActiveDropdown: (value: string | null) => void;
  isFiltered: boolean;
  onReset: () => void;
  departments: DepartmentOption[];
  categoryOptions: string[];
  deptFilter: string;
  setDeptFilter: (value: string) => void;
  catFilter: string;
  setCatFilter: (value: string) => void;
  statusFilter: "ALL" | "ACTIVE" | "INACTIVE";
  setStatusFilter: (value: "ALL" | "ACTIVE" | "INACTIVE") => void;
}

export function RulesFilterPopover({
  activeTab,
  activeDropdown,
  setActiveDropdown,
  isFiltered,
  onReset,
  departments,
  categoryOptions,
  deptFilter,
  setDeptFilter,
  catFilter,
  setCatFilter,
  statusFilter,
  setStatusFilter,
}: RulesFilterPopoverProps) {
  return (
    <div className="relative shrink-0" data-dropdown-container>
      <button
        type="button"
        id="matrix-combined-filters"
        aria-label="Filter rules"
        onClick={() =>
          setActiveDropdown(activeDropdown === "filters" ? null : "filters")
        }
        className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition cursor-pointer shadow-2xs ${
          isFiltered
            ? "border-emerald-600/60 bg-emerald-50/80 text-emerald-950 font-bold"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
        }`}
      >
        <Sliders className="h-3.5 w-3.5 text-slate-500" />
        <span>Filters</span>
        {isFiltered && (
          <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#064E3B] px-1 text-2xs font-bold text-white">
            {(deptFilter !== "ALL" ? 1 : 0) +
              (catFilter !== "ALL" ? 1 : 0) +
              (statusFilter !== "ALL" ? 1 : 0)}
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            activeDropdown === "filters" ? "rotate-180" : ""
          }`}
        />
      </button>

      {activeDropdown === "filters" && (
        <div className="absolute left-0 top-full mt-1.5 z-40 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900">
              Filter Matrix Rules
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setActiveDropdown(null);
                }}
                className="text-2xs font-semibold text-emerald-700 hover:text-emerald-900 transition cursor-pointer"
              >
                Reset All
              </button>
            )}
          </div>

          {activeTab === "matrix" && (
            <div className="space-y-1">
              <label
                htmlFor="filter-popover-dept"
                className="text-2xs font-bold uppercase tracking-wider text-slate-400"
              >
                Department
              </label>
              <select
                id="filter-popover-dept"
                aria-label="Filter by department"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_name}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === "matrix" && (
            <div className="space-y-1">
              <label
                htmlFor="filter-popover-cat"
                className="text-2xs font-bold uppercase tracking-wider text-slate-400"
              >
                Category
              </label>
              <select
                id="filter-popover-cat"
                aria-label="Filter by category"
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="filter-popover-status"
              className="text-2xs font-bold uppercase tracking-wider text-slate-400"
            >
              Status
            </label>
            <select
              id="filter-popover-status"
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")
              }
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Deactivated</option>
            </select>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-2xs text-slate-400">
              {isFiltered ? "Active filters applied" : "No filters applied"}
            </span>
            <button
              type="button"
              onClick={() => setActiveDropdown(null)}
              className="rounded-lg bg-[#064E3B] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-800 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
