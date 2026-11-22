"use client";

import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useReportExport } from "@/hooks/useReportExport";
import type {
  CategoryFilterOptionItem,
  FilterOptionItem,
  PatternDetectionApiResponse,
  PatternDetectionData,
  PatternFilters,
  RecurringCategoryPatternItem,
} from "@/types/reports";
import { AssociatedGrievancesModal } from "./AssociatedGrievancesModal";
import { CategoryPatternsCard } from "./CategoryPatternsCard";
import { DuplicateClustersCard } from "./DuplicateClustersCard";
import { PatternFilterBar } from "./PatternFilterBar";
import { PatternMetadataHeader } from "./PatternMetadataHeader";
import { PatternSummaryCards } from "./PatternSummaryCards";

export interface PatternAnalysisViewProps {
  userRole: "ADMIN" | "DEPARTMENT_HEAD";
  departmentName?: string | null;
}

export function PatternAnalysisView({
  userRole,
  departmentName,
}: PatternAnalysisViewProps) {
  const isDeptHead = userRole === "DEPARTMENT_HEAD";

  const [filters, setFilters] = useState<PatternFilters>({});
  const [data, setData] = useState<PatternDetectionData | null>(null);
  const [filterOptions, setFilterOptions] = useState<{
    departments: FilterOptionItem[];
    categories: CategoryFilterOptionItem[];
    priorities: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPattern, setSelectedPattern] =
    useState<RecurringCategoryPatternItem | null>(null);

  const {
    isExporting,
    exportSuccessMessage,
    exportErrorMessage,
    handleExport,
    clearExportMessages,
  } = useReportExport("PATTERNS");

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.departmentId)
        params.set("departmentId", filters.departmentId);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.priority) params.set("priority", filters.priority);

      const res = await fetch(`/api/reports/patterns?${params.toString()}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(
          errorJson.message ||
            `Failed to fetch patterns report (${res.status})`,
        );
      }

      const json: PatternDetectionApiResponse = await res.json();
      if (!json.success || !json.data) {
        throw new Error(
          json.message || "Failed to parse pattern report response",
        );
      }

      setData(json.data);
      if (json.filterOptions) {
        setFilterOptions(json.filterOptions);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading pattern reports.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleFilterChange = (
    key: keyof PatternFilters,
    value: string | undefined,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({});
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Loading Skeletons */}
      {isLoading && !data && (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReport}
            className="h-7 gap-1 border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/40 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </Button>
        </div>
      )}

      {/* Main Content */}
      {data && (
        <>
          {/* Metadata Header */}
          <PatternMetadataHeader
            metadata={data.metadata}
            isLoading={isLoading}
            onRefresh={fetchReport}
            onExport={(format) => handleExport(filters, format)}
            isExporting={isExporting}
          />

          {/* Export Success Notification Banner */}
          {exportSuccessMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium">{exportSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={clearExportMessages}
                className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 text-xs font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Export Error Notification Banner */}
          {exportErrorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>Export Failed: {exportErrorMessage}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleExport(filters)}
                disabled={isExporting}
                className="h-7 text-xs border-rose-300 hover:bg-rose-100 dark:border-rose-800 cursor-pointer"
              >
                Retry Export
              </Button>
            </div>
          )}

          {/* Filter Bar */}
          <PatternFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            departmentOptions={filterOptions?.departments || []}
            categoryOptions={filterOptions?.categories || []}
            priorityOptions={filterOptions?.priorities || []}
            isDepartmentLocked={isDeptHead}
            lockedDepartmentName={
              departmentName || data.metadata.scope.departmentName
            }
            isLoading={isLoading}
          />

          {/* Metric Summary Cards */}
          <PatternSummaryCards summary={data.summary} />

          {/* Recurring Category Patterns Table */}
          <CategoryPatternsCard
            categoryPatterns={data.categoryPatterns}
            onSelectPattern={(pattern) => setSelectedPattern(pattern)}
          />

          {/* Duplicate Clusters & Limitations Card */}
          <DuplicateClustersCard
            duplicateClusters={data.duplicateClusters}
            dataLimitationNotice={data.dataLimitationNotice}
          />

          {/* Drilldown Modal */}
          <AssociatedGrievancesModal
            isOpen={selectedPattern !== null}
            onClose={() => setSelectedPattern(null)}
            pattern={selectedPattern}
          />
        </>
      )}
    </div>
  );
}
