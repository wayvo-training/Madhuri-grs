"use client";

import {
  Building2,
  Filter,
  FolderTree,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  CategoryFilterOptionItem,
  FilterOptionItem,
  PatternFilters,
} from "@/types/reports";

export interface PatternFilterBarProps {
  filters: PatternFilters;
  onFilterChange: (
    key: keyof PatternFilters,
    value: string | undefined,
  ) => void;
  onReset: () => void;
  departmentOptions: FilterOptionItem[];
  categoryOptions: CategoryFilterOptionItem[];
  priorityOptions: string[];
  isDepartmentLocked?: boolean;
  lockedDepartmentName?: string | null;
  isLoading?: boolean;
}

export function PatternFilterBar({
  filters,
  onFilterChange,
  onReset,
  departmentOptions,
  categoryOptions,
  priorityOptions,
  isDepartmentLocked = false,
  lockedDepartmentName,
  isLoading = false,
}: PatternFilterBarProps) {
  const hasActiveFilters = Boolean(
    (!isDepartmentLocked && filters.departmentId) ||
      filters.categoryId ||
      filters.priority,
  );

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 sm:p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 shrink-0">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Filter className="h-3 w-3" />
            <span>Pattern Analysis Filters (30-Day Window)</span>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={isLoading}
              className="h-6 gap-1 px-2 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {/* Department Filter */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="pattern-filter-department"
              className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300"
            >
              <Building2 className="h-3 w-3 text-slate-400" />
              <span>Department</span>
              {isDepartmentLocked && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400">
                  (Locked)
                </span>
              )}
            </label>
            {isDepartmentLocked ? (
              <input
                id="pattern-filter-department"
                type="text"
                disabled
                value={lockedDepartmentName || "Your Department"}
                className="h-7 w-full rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-not-allowed"
              />
            ) : (
              <select
                id="pattern-filter-department"
                value={filters.departmentId || ""}
                onChange={(e) =>
                  onFilterChange(
                    "departmentId",
                    e.target.value === "" ? undefined : e.target.value,
                  )
                }
                disabled={isLoading}
                className="h-7 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">All Departments (Organization-Wide)</option>
                {departmentOptions.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="pattern-filter-category"
              className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300"
            >
              <FolderTree className="h-3 w-3 text-slate-400" />
              <span>Category</span>
            </label>
            <select
              id="pattern-filter-category"
              value={filters.categoryId || ""}
              onChange={(e) =>
                onFilterChange(
                  "categoryId",
                  e.target.value === "" ? undefined : e.target.value,
                )
              }
              disabled={isLoading}
              className="h-7 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">All Categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="pattern-filter-priority"
              className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300"
            >
              <ShieldAlert className="h-3 w-3 text-slate-400" />
              <span>Priority</span>
            </label>
            <select
              id="pattern-filter-priority"
              value={filters.priority || ""}
              onChange={(e) =>
                onFilterChange(
                  "priority",
                  e.target.value === "" ? undefined : e.target.value,
                )
              }
              disabled={isLoading}
              className="h-7 w-full rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">All Priorities</option>
              {priorityOptions.map((prio) => (
                <option key={prio} value={prio}>
                  {prio}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
