"use client";

import { Calendar, Filter, RotateCcw, Search, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  OperationalReportFilterOptions,
  OperationalReportFilters,
} from "@/types/reports";

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
  isLoading = false,
  onApplyFilters,
  onResetFilters,
}: ReportFilterBarProps) {
  const [localFilters, setLocalFilters] =
    useState<OperationalReportFilters>(filters);
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
    field: keyof OperationalReportFilters,
    value: string,
  ) => {
    setActivePreset("custom");
    const updated: OperationalReportFilters = {
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
    };
    setLocalFilters(resetFilters);
    onResetFilters();
  };

  // Find subcategories for selected category
  const selectedCategory = filterOptions.categories.find(
    (c) => c.id === localFilters.categoryId,
  );
  const availableSubcategories = selectedCategory
    ? selectedCategory.subcategories
    : [];

  // Count active non-default filters
  const hasActiveFilters = Boolean(
    localFilters.departmentId ||
      localFilters.categoryId ||
      localFilters.subcategoryId ||
      localFilters.priority ||
      localFilters.status ||
      localFilters.slaStatus ||
      (localFilters.assignmentStatus &&
        localFilters.assignmentStatus !== "ALL"),
  );

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 print:hidden">
      <form onSubmit={handleApply} className="flex flex-col gap-3">
        {/* Top Row: Presets & Date Inputs */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Period:
            </span>
            <Button
              type="button"
              variant={activePreset === "7d" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetSelect("7d")}
              className="h-7 text-xs px-2.5 rounded-md"
            >
              Last 7 Days
            </Button>
            <Button
              type="button"
              variant={activePreset === "30d" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetSelect("30d")}
              className="h-7 text-xs px-2.5 rounded-md"
            >
              Last 30 Days
            </Button>
            <Button
              type="button"
              variant={activePreset === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetSelect("month")}
              className="h-7 text-xs px-2.5 rounded-md"
            >
              This Month
            </Button>
            <Button
              type="button"
              variant={activePreset === "90d" ? "default" : "outline"}
              size="sm"
              onClick={() => handlePresetSelect("90d")}
              className="h-7 text-xs px-2.5 rounded-md"
            >
              Last 90 Days
            </Button>
          </div>

          {/* Date Picker Inputs */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="rep-start-date"
                className="text-slate-500 dark:text-slate-400 font-medium"
              >
                From:
              </label>
              <input
                id="rep-start-date"
                type="date"
                value={
                  localFilters.startDate
                    ? localFilters.startDate.split("T")[0]
                    : ""
                }
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="rep-end-date"
                className="text-slate-500 dark:text-slate-400 font-medium"
              >
                To:
              </label>
              <input
                id="rep-end-date"
                type="date"
                value={
                  localFilters.endDate ? localFilters.endDate.split("T")[0] : ""
                }
                onChange={(e) => handleInputChange("endDate", e.target.value)}
                className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 shadow-2xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Second Row: Dimensional Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {/* Department Filter (Admin Only) */}
          {isOrganizationWide && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="filter-dept"
                className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
              >
                Department
              </label>
              <select
                id="filter-dept"
                value={localFilters.departmentId || "ALL"}
                onChange={(e) =>
                  handleInputChange("departmentId", e.target.value)
                }
                className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Departments</option>
                {filterOptions.departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filter-cat"
              className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
            >
              Category
            </label>
            <select
              id="filter-cat"
              value={localFilters.categoryId || "ALL"}
              onChange={(e) => handleInputChange("categoryId", e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Categories</option>
              {filterOptions.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Filter */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filter-subcat"
              className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
            >
              Subcategory
            </label>
            <select
              id="filter-subcat"
              value={localFilters.subcategoryId || "ALL"}
              disabled={!localFilters.categoryId}
              onChange={(e) =>
                handleInputChange("subcategoryId", e.target.value)
              }
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:disabled:bg-slate-800/40"
            >
              <option value="ALL">All Subcategories</option>
              {availableSubcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filter-prio"
              className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
            >
              Priority
            </label>
            <select
              id="filter-prio"
              value={localFilters.priority || "ALL"}
              onChange={(e) => handleInputChange("priority", e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Priorities</option>
              {filterOptions.priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Grievance Status Filter */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filter-status"
              className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
            >
              Status
            </label>
            <select
              id="filter-status"
              value={localFilters.status || "ALL"}
              onChange={(e) => handleInputChange("status", e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Statuses</option>
              {filterOptions.statuses.map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* SLA Status Filter */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filter-sla"
              className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
            >
              SLA Health
            </label>
            <select
              id="filter-sla"
              value={localFilters.slaStatus || "ALL"}
              onChange={(e) => handleInputChange("slaStatus", e.target.value)}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All SLA States</option>
              <option value="ON_TRACK">On Track</option>
              <option value="AT_RISK">Approaching Deadline (At Risk)</option>
              <option value="BREACHED">Exceeding Deadline (Breached)</option>
            </select>
          </div>

          {/* Assignment Status Filter */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="filter-assign"
              className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
            >
              Assignment
            </label>
            <select
              id="filter-assign"
              value={localFilters.assignmentStatus || "ALL"}
              onChange={(e) =>
                handleInputChange("assignmentStatus", e.target.value)
              }
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {filterOptions.assignmentStatuses.map((as) => (
                <option key={as.value} value={as.value}>
                  {as.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls & Active Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            {hasActiveFilters ? (
              <>
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  Active Filters:
                </span>
                {localFilters.departmentId && (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-[11px] py-0.5 font-normal"
                  >
                    Dept:{" "}
                    {filterOptions.departments.find(
                      (d) => d.id === localFilters.departmentId,
                    )?.name || localFilters.departmentId}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-rose-500"
                      onClick={() => handleInputChange("departmentId", "ALL")}
                    />
                  </Badge>
                )}
                {localFilters.categoryId && (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-[11px] py-0.5 font-normal"
                  >
                    Cat:{" "}
                    {filterOptions.categories.find(
                      (c) => c.id === localFilters.categoryId,
                    )?.name || localFilters.categoryId}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-rose-500"
                      onClick={() => handleInputChange("categoryId", "ALL")}
                    />
                  </Badge>
                )}
                {localFilters.priority && (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-[11px] py-0.5 font-normal"
                  >
                    Prio: {localFilters.priority}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-rose-500"
                      onClick={() => handleInputChange("priority", "ALL")}
                    />
                  </Badge>
                )}
                {localFilters.status && (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-[11px] py-0.5 font-normal"
                  >
                    Status: {localFilters.status}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-rose-500"
                      onClick={() => handleInputChange("status", "ALL")}
                    />
                  </Badge>
                )}
                {localFilters.slaStatus && (
                  <Badge
                    variant="secondary"
                    className="gap-1 text-[11px] py-0.5 font-normal"
                  >
                    SLA: {localFilters.slaStatus}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-rose-500"
                      onClick={() => handleInputChange("slaStatus", "ALL")}
                    />
                  </Badge>
                )}
                {localFilters.assignmentStatus &&
                  localFilters.assignmentStatus !== "ALL" && (
                    <Badge
                      variant="secondary"
                      className="gap-1 text-[11px] py-0.5 font-normal"
                    >
                      {localFilters.assignmentStatus}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-rose-500"
                        onClick={() =>
                          handleInputChange("assignmentStatus", "ALL")
                        }
                      />
                    </Badge>
                  )}
              </>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                Showing all grievances for reporting period
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="h-8 px-3.5 text-xs font-medium gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Search className="h-3 w-3" />
              Apply Filters
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
