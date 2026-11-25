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
import { DatePicker } from "@/components/ui/date-picker";
import type {
  OperationalReportFilterOptions,
  OperationalReportFilters,
} from "@/types/reports";

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface ReportFilterBarProps {
  filters: OperationalReportFilters;
  filterOptions: OperationalReportFilterOptions;
  isOrganizationWide: boolean;
  isLoading?: boolean;
  onApplyFilters: (newFilters: OperationalReportFilters) => void;
  onResetFilters: () => void;
}

export function ReportFilterBar({
  filters,
  filterOptions,
  isOrganizationWide,
  isLoading: _isLoading = false,
  onApplyFilters,
  onResetFilters,
}: ReportFilterBarProps) {
  const [localFilters, setLocalFilters] =
    useState<OperationalReportFilters>(filters);
  const [activePreset, setActivePreset] = useState<string>("30d");
  const [searchKey, setSearchKey] = useState<number>(0);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Define Search & Filter Fields for the Standard AdvancedTableSearch
  const searchFields: SearchFieldDef[] = useMemo(() => {
    const fields: SearchFieldDef[] = [
      {
        id: "search",
        label: "Search (Keywords / Ticket #)",
        type: "text",
      },
    ];

    if (isOrganizationWide && filterOptions.departments.length > 0) {
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

    if (filterOptions.categories.length > 0) {
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

    fields.push({
      id: "priority",
      label: "Priority",
      type: "select",
      options: filterOptions.priorities.map((p) => ({
        value: p,
        label: p.charAt(0) + p.slice(1).toLowerCase(),
      })),
    });

    if (filterOptions.statuses.length > 0) {
      fields.push({
        id: "status",
        label: "Status",
        type: "select",
        options: filterOptions.statuses.map((st) => ({
          value: st,
          label: st.replace(/_/g, " "),
        })),
      });
    }

    fields.push({
      id: "slaStatus",
      label: "SLA Health",
      type: "select",
      options: [
        { value: "ON_TRACK", label: "On Track (< 50%)" },
        { value: "AT_RISK", label: "Approaching Deadline (50-99%)" },
        { value: "BREACHED", label: "Exceeded SLA (≥ 100%)" },
      ],
    });

    fields.push({
      id: "assignmentStatus",
      label: "Assignment State",
      type: "select",
      options: [
        { value: "ASSIGNED", label: "Assigned" },
        { value: "UNASSIGNED", label: "Unassigned" },
      ],
    });

    return fields;
  }, [filterOptions, isOrganizationWide]);

  // Handle Preset Selection (Date Presets)
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
    const updated: OperationalReportFilters = {
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
    const updated: OperationalReportFilters = {
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
    let status: string | undefined;
    let slaStatus: string | undefined;
    let assignmentStatus: "ALL" | "ASSIGNED" | "UNASSIGNED" | undefined;
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
      } else if (condition.field === "status") {
        status = String(val);
      } else if (condition.field === "slaStatus") {
        slaStatus = String(val);
      } else if (condition.field === "assignmentStatus") {
        const strVal = String(val).toUpperCase();
        if (
          strVal === "ASSIGNED" ||
          strVal === "UNASSIGNED" ||
          strVal === "ALL"
        ) {
          assignmentStatus = strVal;
        }
      } else if (condition.field === "search") {
        const textVal = Array.isArray(condition.value)
          ? condition.value.join(" ")
          : condition.value;
        if (textVal) search = String(textVal).trim();
      }
    }

    const updated: OperationalReportFilters = {
      ...localFilters,
      departmentId,
      categoryId,
      subcategoryId,
      priority,
      status,
      slaStatus,
      assignmentStatus,
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

    const resetFilters: OperationalReportFilters = {
      startDate: startStr,
      endDate: endStr,
      departmentId: undefined,
      categoryId: undefined,
      subcategoryId: undefined,
      priority: undefined,
      status: undefined,
      slaStatus: undefined,
      assignmentStatus: undefined,
      search: undefined,
    };

    setLocalFilters(resetFilters);
    setSearchKey((k) => k + 1);
    onResetFilters();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 sm:p-2 shadow-2xs flex flex-col gap-1">
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
              htmlFor="rep-start-date"
              className="text-slate-500 dark:text-slate-400 font-medium"
            >
              From:
            </label>
            <DatePicker
              id="rep-start-date"
              value={
                localFilters.startDate
                  ? localFilters.startDate.split("T")[0]
                  : ""
              }
              onChange={(value) => handleDateChange("startDate", value)}
              placeholder="DD-MM-YYYY"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="rep-end-date"
              className="text-slate-500 dark:text-slate-400 font-medium"
            >
              To:
            </label>
            <DatePicker
              id="rep-end-date"
              value={
                localFilters.endDate ? localFilters.endDate.split("T")[0] : ""
              }
              onChange={(value) => handleDateChange("endDate", value)}
              placeholder="DD-MM-YYYY"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-6 px-1.5 text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 gap-1 cursor-pointer"
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
          className="w-full"
          side="bottom"
        />
      </div>
    </div>
  );
}
