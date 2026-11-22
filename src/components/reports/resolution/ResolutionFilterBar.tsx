"use client";

import { Calendar, Filter, RotateCcw, Search, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  ResolutionAnalyticsFilterOptions,
  ResolutionAnalyticsFilters,
} from "@/types/reports";

export interface ResolutionFilterBarProps {
  filters: ResolutionAnalyticsFilters;
  filterOptions: ResolutionAnalyticsFilterOptions;
  isOrganizationWide: boolean;
  isLoading?: boolean;
  onApplyFilters: (newFilters: ResolutionAnalyticsFilters) => void;
  onResetFilters: () => void;
}

export function ResolutionFilterBar({
  filters,
  filterOptions,
  isOrganizationWide,
  isLoading = false,
  onApplyFilters,
  onResetFilters,
}: ResolutionFilterBarProps) {
  const [localFilters, setLocalFilters] =
    useState<ResolutionAnalyticsFilters>(filters);
  const [activePreset, setActivePreset] = useState<string>("30d");

  // Date Presets Handler
  const handlePresetSelect = (preset: "7d" | "30d" | "month" | "90d") => {
    setActivePreset(preset);
    const now = new Date();
    const endStr = now.toISOString().split("T")[0];
    let start = new Date();

    if (preset === "7d") {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (preset === "30d") {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (preset === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (preset === "90d") {
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    const startStr = start.toISOString().split("T")[0];
    const updated = {
      ...localFilters,
      startDate: startStr,
      endDate: endStr,
    };
    setLocalFilters(updated);
    onApplyFilters(updated);
  };

  const handleInputChange = (
    field: keyof ResolutionAnalyticsFilters,
    value: string,
  ) => {
    setActivePreset("custom");
    const updated: ResolutionAnalyticsFilters = {
      ...localFilters,
      [field]: value === "ALL" || value === "" ? undefined : value,
    };

    // If changing category, reset subcategory
    if (field === "categoryId") {
      updated.subcategoryId = undefined;
    }

    setLocalFilters(updated);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyFilters(localFilters);
  };

  const handleReset = () => {
    setActivePreset("30d");
    const now = new Date();
    const endStr = now.toISOString().split("T")[0];
    const startStr = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const resetFilters: ResolutionAnalyticsFilters = {
      startDate: startStr,
      endDate: endStr,
      departmentId: undefined,
      categoryId: undefined,
      subcategoryId: undefined,
      priority: undefined,
    };
    setLocalFilters(resetFilters);
    onResetFilters();
  };

  const selectedCategory = filterOptions.categories.find(
    (c) => c.id === localFilters.categoryId,
  );
  const availableSubcategories = selectedCategory?.subcategories || [];

  // Count active filters (excluding date range)
  const activeFiltersCount = [
    localFilters.departmentId,
    localFilters.categoryId,
    localFilters.subcategoryId,
    localFilters.priority,
  ].filter(Boolean).length;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
      <form onSubmit={handleApply} className="space-y-4">
        {/* Preset Range Selector & Date Inputs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Period:
            </span>
            <Button
              type="button"
              variant={activePreset === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetSelect("7d")}
              className="h-7 text-xs px-2.5"
            >
              7 Days
            </Button>
            <Button
              type="button"
              variant={activePreset === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetSelect("30d")}
              className="h-7 text-xs px-2.5"
            >
              30 Days
            </Button>
            <Button
              type="button"
              variant={activePreset === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetSelect("month")}
              className="h-7 text-xs px-2.5"
            >
              Month to Date
            </Button>
            <Button
              type="button"
              variant={activePreset === "90d" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetSelect("90d")}
              className="h-7 text-xs px-2.5"
            >
              90 Days
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Start date"
              value={localFilters.startDate || ""}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              aria-label="End date"
              value={localFilters.endDate || ""}
              onChange={(e) => handleInputChange("endDate", e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Dimension Selectors */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Department Filter (Admin only) */}
          {isOrganizationWide && (
            <div>
              <label
                htmlFor="res-dept-filter"
                className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Department
              </label>
              <select
                id="res-dept-filter"
                aria-label="Filter by department"
                value={localFilters.departmentId || "ALL"}
                onChange={(e) =>
                  handleInputChange("departmentId", e.target.value)
                }
                className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Departments</option>
                {filterOptions.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category Filter */}
          <div>
            <label
              htmlFor="res-cat-filter"
              className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Category
            </label>
            <select
              id="res-cat-filter"
              aria-label="Filter by category"
              value={localFilters.categoryId || "ALL"}
              onChange={(e) => handleInputChange("categoryId", e.target.value)}
              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Categories</option>
              {filterOptions.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Filter */}
          <div>
            <label
              htmlFor="res-subcat-filter"
              className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Subcategory
            </label>
            <select
              id="res-subcat-filter"
              aria-label="Filter by subcategory"
              value={localFilters.subcategoryId || "ALL"}
              onChange={(e) =>
                handleInputChange("subcategoryId", e.target.value)
              }
              disabled={
                !localFilters.categoryId || availableSubcategories.length === 0
              }
              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:disabled:bg-slate-800/40"
            >
              <option value="ALL">All Subcategories</option>
              {availableSubcategories.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label
              htmlFor="res-priority-filter"
              className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Priority
            </label>
            <select
              id="res-priority-filter"
              aria-label="Filter by priority"
              value={localFilters.priority || "ALL"}
              onChange={(e) => handleInputChange("priority", e.target.value)}
              className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Priorities</option>
              {filterOptions.priorities
                .filter((p) => p !== "ALL")
                .map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Action Controls & Active Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            {activeFiltersCount > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Active filters:
              </span>
            )}
            {localFilters.departmentId && (
              <Badge
                variant="secondary"
                className="gap-1 text-xs font-normal bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Dept:{" "}
                {filterOptions.departments.find(
                  (d) => d.id === localFilters.departmentId,
                )?.name || localFilters.departmentId}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                  onClick={() => handleInputChange("departmentId", "ALL")}
                />
              </Badge>
            )}
            {localFilters.categoryId && (
              <Badge
                variant="secondary"
                className="gap-1 text-xs font-normal bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Category: {selectedCategory?.name || localFilters.categoryId}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                  onClick={() => handleInputChange("categoryId", "ALL")}
                />
              </Badge>
            )}
            {localFilters.subcategoryId && (
              <Badge
                variant="secondary"
                className="gap-1 text-xs font-normal bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Subcategory:{" "}
                {availableSubcategories.find(
                  (sc) => sc.id === localFilters.subcategoryId,
                )?.name || localFilters.subcategoryId}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                  onClick={() => handleInputChange("subcategoryId", "ALL")}
                />
              </Badge>
            )}
            {localFilters.priority && (
              <Badge
                variant="secondary"
                className="gap-1 text-xs font-normal bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Priority: {localFilters.priority}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                  onClick={() => handleInputChange("priority", "ALL")}
                />
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isLoading}
              className="h-8 gap-1 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Search className="h-3.5 w-3.5" />
              Apply Filters
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
