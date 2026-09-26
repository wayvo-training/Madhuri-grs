import {
  ChevronDown,
  Clock,
  Plus,
  RotateCcw,
  Sliders,
  Workflow,
} from "lucide-react";

export type ModalRuleType = "routing" | "priority" | "sla" | "reopen";
export type MainTab = "matrix" | "global";

export interface DepartmentOption {
  department_id: string;
  department_name: string;
}

export interface CategoryOption {
  category_id: string;
  category_name: string;
  subcategories?: { subcategory_id: string; subcategory_name: string }[];
}

export function CreatePolicyMenu({
  activeDropdown,
  setActiveDropdown,
  onSelectType,
}: {
  activeDropdown: string | null;
  setActiveDropdown: (value: string | null) => void;
  onSelectType: (type: ModalRuleType) => void;
}) {
  return (
    <div className="relative shrink-0" data-dropdown-container>
      <button
        type="button"
        onClick={() =>
          setActiveDropdown(
            activeDropdown === "create-policy" ? null : "create-policy",
          )
        }
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800 whitespace-nowrap cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Configure New Policy</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${activeDropdown === "create-policy" ? "rotate-180" : ""}`}
        />
      </button>

      {activeDropdown === "create-policy" && (
        <div className="absolute right-0 top-full mt-1.5 z-40 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
          <div className="px-2 py-1 text-2xs font-bold uppercase tracking-wider text-slate-400">
            Select Policy Type
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectType("routing");
              setActiveDropdown(null);
            }}
            className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-slate-50 transition group"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100">
              <Workflow className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                Routing Policy
              </div>
              <div className="text-2xs text-slate-500">
                Route categories to departments
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectType("priority");
              setActiveDropdown(null);
            }}
            className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-slate-50 transition group"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-100">
              <Sliders className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                Priority Rule
              </div>
              <div className="text-2xs text-slate-500">
                Severity scoring & keywords triage
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectType("sla");
              setActiveDropdown(null);
            }}
            className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-slate-50 transition group"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-100">
              <Clock className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                SLA Policy
              </div>
              <div className="text-2xs text-slate-500">
                Deadlines & escalation thresholds
              </div>
            </div>
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onClick={() => {
              onSelectType("reopen");
              setActiveDropdown(null);
            }}
            className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-slate-50 transition group"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B] group-hover:bg-emerald-100">
              <RotateCcw className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                Global Reopen Policy
              </div>
              <div className="text-2xs text-slate-500">
                Case reopening window & limits
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
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
}: {
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
}) {
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
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${activeDropdown === "filters" ? "rotate-180" : ""}`}
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

export function RulesToolbarAction({
  children,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
        variant === "default"
          ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}
