"use client";

import { Calendar, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AdvancedTableSearch,
  type FilterMode,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import { Button } from "@/components/ui/button";
import type {
  ResolutionAnalyticsFilterOptions,
  ResolutionAnalyticsFilters,
} from "@/types/reports";

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
  isLoading: _isLoading = false,
  onApplyFilters,
  onResetFilters,
}: ResolutionFilterBarProps) {
  const [localFilters, setLocalFilters] =
    useState<ResolutionAnalyticsFilters>(filters);
  const [activePreset, setActivePreset] = useState<string>("30d");
  const [searchKey, setSearchKey] = useState<number>(0);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Define Search & Filter Fields for the Standard AdvancedTableSearch
  const searchFields: SearchFieldDef[] = useMemo(() => {
    const fields: SearchFieldDef[] = [];

    if (isOrganizationWide && filterOptions.departments?.length > 0) {
      fields.push({
        id: "department",
        label: "Department",
        type: "select",
        options: filterOptions.departments.map((dept) => ({
          value: dept.id,
          label: dept.name,
        })),
      });
    }

    if (filterOptions.categories?.length > 0) {
      fields.push({
        id: "category",
        label: "Category",
        type: "select",
        options: filterOptions.categories.map((cat) => ({
          value: cat.id,
          label: cat.name,
        })),
      });

      const allSubcategories: { value: string; label: string }[] = [];
      filterOptions.categories.forEach((cat) => {
        cat.subcategories.forEach((sub) => {
          allSubcategories.push({
            value: sub.id,
            label: `${sub.name} (${cat.name})`,
          });
        });
      });

      if (allSubcategories.length > 0) {
        fields.push({
          id: "subcategory",
          label: "Subcategory",
          type: "select",
          options: allSubcategories,
        });
      }
    }

    if (filterOptions.priorities?.length > 0) {
      fields.push({
        id: "priority",
        label: "Priority",
        type: "select",
        options: filterOptions.priorities
          .filter((p) => p !== "ALL")
          .map((p) => ({
            value: p,
            label: p.charAt(0) + p.slice(1).toLowerCase(),
          })),
      });
    }

    return fields;
  }, [filterOptions, isOrganizationWide]);

  // Handle Preset Changes
  const handlePresetSelect = (preset: "7d" | "30d" | "month" | "90d") => {
    setActivePreset(preset);
    const now = new Date();
    const endStr = formatLocalDate(now);
    let start: Date;

    if (preset === "7d") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    } else if (preset === "30d") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    } else if (preset === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
    }

    const startStr = formatLocalDate(start);
    const updated: ResolutionAnalyticsFilters = {
      ...localFilters,
      startDate: startStr,
      endDate: endStr,
    };
    setLocalFilters(updated);
    onApplyFilters(updated);
  };

  // Handle Custom Date Change
  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    setActivePreset("custom");
    const updated: ResolutionAnalyticsFilters = {
      ...localFilters,
      [field]: value || undefined,
    };
    setLocalFilters(updated);
    onApplyFilters(updated);
  };

  // Handle AdvancedTableSearch condition changes
  const handleAdvancedSearch = (
    conditions: SearchCondition[],
    _mode: FilterMode,
  ) => {
    let departmentId: string | undefined;
    let categoryId: string | undefined;
    let subcategoryId: string | undefined;
    let priority: string | undefined;
    let search: string | undefined;

    for (const condition of conditions) {
      const val = Array.isArray(condition.value)
        ? condition.value[0]
        : condition.value;
      if (!val) continue;

      if (condition.field === "department") {
        departmentId = String(val);
      } else if (condition.field === "category") {
        categoryId = String(val);
      } else if (condition.field === "subcategory") {
        subcategoryId = String(val);
      } else if (condition.field === "priority") {
        priority = String(val);
      } else if (condition.field === "search") {
        const textVal = Array.isArray(condition.value)
          ? condition.value.join(" ")
          : condition.value;
        if (textVal) search = String(textVal).trim();
      }
    }

    const updated: ResolutionAnalyticsFilters = {
      ...localFilters,
      departmentId,
      categoryId,
      subcategoryId,
      priority,
      search,
    };

    setLocalFilters(updated);
    onApplyFilters(updated);
  };

  // Reset all filters and search conditions
  const handleReset = () => {
    setActivePreset("30d");
    const now = new Date();
    const endStr = formatLocalDate(now);
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 30,
    );
    const startStr = formatLocalDate(start);

    const resetFilters: ResolutionAnalyticsFilters = {
      startDate: startStr,
      endDate: endStr,
      departmentId: undefined,
      categoryId: undefined,
      subcategoryId: undefined,
      priority: undefined,
      search: undefined,
    };

    setLocalFilters(resetFilters);
    setSearchKey((k) => k + 1);
    onResetFilters();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 sm:p-2 pb-1 shadow-xs flex flex-col gap-1 shrink-0">
      {/* Date Presets and Date Range Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Period:
          </span>
          <Button
            type="button"
            variant={activePreset === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetSelect("7d")}
            className="h-6 text-[11px] px-2 rounded-md cursor-pointer"
          >
            Last 7 Days
          </Button>
          <Button
            type="button"
            variant={activePreset === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetSelect("30d")}
            className="h-6 text-[11px] px-2 rounded-md cursor-pointer"
          >
            Last 30 Days
          </Button>
          <Button
            type="button"
            variant={activePreset === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetSelect("month")}
            className="h-6 text-[11px] px-2 rounded-md cursor-pointer"
          >
            This Month
          </Button>
          <Button
            type="button"
            variant={activePreset === "90d" ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetSelect("90d")}
            className="h-6 text-[11px] px-2 rounded-md cursor-pointer"
          >
            Last 90 Days
          </Button>
        </div>

        {/* Date Picker Inputs + Reset Button */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="res-start-date"
              className="text-slate-500 dark:text-slate-400 font-medium text-[11px]"
            >
              From:
            </label>
            <input
              id="res-start-date"
              type="date"
              value={
                localFilters.startDate
                  ? localFilters.startDate.split("T")[0]
                  : ""
              }
              onChange={(e) => handleDateChange("startDate", e.target.value)}
              className="h-6 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="res-end-date"
              className="text-slate-500 dark:text-slate-400 font-medium text-[11px]"
            >
              To:
            </label>
            <input
              id="res-end-date"
              type="date"
              value={
                localFilters.endDate ? localFilters.endDate.split("T")[0] : ""
              }
              onChange={(e) => handleDateChange("endDate", e.target.value)}
              className="h-6 rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-6 px-2 text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 gap-1 cursor-pointer"
            title="Reset period & filters"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
      </div>

      {/* Advanced Table Search Bar (Mana Standard Search) */}
      <div className="w-full">
        <AdvancedTableSearch
          key={searchKey}
          fields={searchFields}
          onSearch={handleAdvancedSearch}
          placeholder="Filter by department, category, priority..."
          className="w-full"
          side="bottom"
        />
      </div>
    </div>
  );
}
