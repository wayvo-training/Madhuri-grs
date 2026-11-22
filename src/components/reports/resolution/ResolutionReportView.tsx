"use client";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Hourglass,
  LayoutDashboard,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useReportExport } from "@/hooks/useReportExport";
import type {
  ResolutionAnalyticsApiResponse,
  ResolutionAnalyticsData,
  ResolutionAnalyticsFilterOptions,
  ResolutionAnalyticsFilters,
} from "@/types/reports";
import { DepartmentProcessingTimeCard } from "./DepartmentProcessingTimeCard";
import { PendingCasesCard } from "./PendingCasesCard";
import { ResolutionFilterBar } from "./ResolutionFilterBar";
import { ResolutionMetadataHeader } from "./ResolutionMetadataHeader";
import { ResolutionOverviewCards } from "./ResolutionOverviewCards";
import { ResolutionStagesCard } from "./ResolutionStagesCard";
import { ResolutionTatByPriorityCard } from "./ResolutionTatByPriorityCard";
import { ReworkAndReopenCard } from "./ReworkAndReopenCard";
import { SlaResolutionComplianceCard } from "./SlaResolutionComplianceCard";

export interface ResolutionReportViewProps {
  userRole: "ADMIN" | "DEPARTMENT_HEAD";
  departmentName?: string;
}

export function ResolutionReportView({
  userRole,
  departmentName: _departmentName,
}: ResolutionReportViewProps) {
  const isOrganizationWide = userRole === "ADMIN";

  const [filters, setFilters] = useState<ResolutionAnalyticsFilters>(() => {
    const now = new Date();
    const endStr = now.toISOString().split("T")[0];
    const startStr = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    return {
      startDate: startStr,
      endDate: endStr,
    };
  });

  const [activeTab, setActiveTab] = useState<
    "overview" | "departments" | "sla" | "rework" | "pending"
  >("overview");

  const [data, setData] = useState<ResolutionAnalyticsData | null>(null);
  const [filterOptions, setFilterOptions] =
    useState<ResolutionAnalyticsFilterOptions>({
      departments: [],
      categories: [],
      priorities: ["ALL", "URGENT", "HIGH", "NORMAL", "LOW"],
    });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    isExporting,
    exportSuccessMessage,
    exportErrorMessage,
    handleExport,
    clearExportMessages,
  } = useReportExport("RESOLUTION");

  const fetchReport = useCallback(
    async (currentFilters: ResolutionAnalyticsFilters) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const query = new URLSearchParams();
        if (currentFilters.startDate) {
          query.set("startDate", currentFilters.startDate);
        }
        if (currentFilters.endDate) {
          query.set("endDate", currentFilters.endDate);
        }
        if (currentFilters.departmentId) {
          query.set("departmentId", currentFilters.departmentId);
        }
        if (currentFilters.categoryId) {
          query.set("categoryId", currentFilters.categoryId);
        }
        if (currentFilters.subcategoryId) {
          query.set("subcategoryId", currentFilters.subcategoryId);
        }
        if (currentFilters.priority) {
          query.set("priority", currentFilters.priority);
        }

        const res = await fetch(`/api/reports/resolution?${query.toString()}`);
        const json = (await res.json()) as ResolutionAnalyticsApiResponse;

        if (!res.ok || !json.success) {
          throw new Error(
            json.message ||
              `Failed to load resolution analytics (${res.status})`,
          );
        }

        setData(json.data);
        if (json.filterOptions) {
          setFilterOptions(json.filterOptions);
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while fetching reports.";
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchReport(filters);
  }, [fetchReport, filters]);

  const handleApplyFilters = (newFilters: ResolutionAnalyticsFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    const now = new Date();
    const endStr = now.toISOString().split("T")[0];
    const startStr = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const resetFilters: ResolutionAnalyticsFilters = {
      startDate: startStr,
      endDate: endStr,
    };
    setFilters(resetFilters);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header with Metadata */}
      {data?.metadata && (
        <ResolutionMetadataHeader
          metadata={data.metadata}
          isLoading={isLoading}
          onRefresh={() => fetchReport(filters)}
          onExport={(format) => handleExport(filters, format)}
          isExporting={isExporting}
        />
      )}

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

      {/* 2. Filter Bar */}
      <ResolutionFilterBar
        filters={filters}
        filterOptions={filterOptions}
        isOrganizationWide={isOrganizationWide}
        isLoading={isLoading}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Error State */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="font-semibold">Failed to load reports:</span>
            <span>{errorMessage}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReport(filters)}
            className="mt-3 h-7 text-xs border-rose-300 text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300"
          >
            Retry Request
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton placeholder
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      )}

      {/* Main Content with Navigation Tabs */}
      {data && (
        <div className="space-y-4">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2.5 dark:border-slate-800">
            <Button
              variant={activeTab === "overview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("overview")}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Overview & Stages
            </Button>
            <Button
              variant={activeTab === "departments" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("departments")}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <Building2 className="h-3.5 w-3.5" />
              Department Processing
            </Button>
            <Button
              variant={activeTab === "sla" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("sla")}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              SLA Compliance
            </Button>
            <Button
              variant={activeTab === "rework" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("rework")}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Rework & Reopen
            </Button>
            <Button
              variant={activeTab === "pending" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("pending")}
              className="h-8 gap-1.5 text-xs font-medium"
            >
              <Hourglass className="h-3.5 w-3.5" />
              Pending Cases ({data.pendingCases.totalPendingCount})
            </Button>
          </div>

          {/* Tab 1: Overview & Stages */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <ResolutionOverviewCards overview={data.overview} />
              <ResolutionStagesCard stages={data.stages} />
              <ResolutionTatByPriorityCard tatByPriority={data.tatByPriority} />
              <PendingCasesCard pendingCases={data.pendingCases} />
            </div>
          )}

          {/* Tab 2: Department Processing */}
          {activeTab === "departments" && (
            <div className="space-y-4">
              <DepartmentProcessingTimeCard
                departments={data.departmentProcessing}
              />
            </div>
          )}

          {/* Tab 3: SLA Compliance */}
          {activeTab === "sla" && (
            <div className="space-y-4">
              <SlaResolutionComplianceCard slaCompliance={data.slaCompliance} />
              <ResolutionTatByPriorityCard tatByPriority={data.tatByPriority} />
            </div>
          )}

          {/* Tab 4: Rework & Reopen */}
          {activeTab === "rework" && (
            <div className="space-y-4">
              <ReworkAndReopenCard reworkAndReopen={data.reworkAndReopen} />
            </div>
          )}

          {/* Tab 5: Pending Cases */}
          {activeTab === "pending" && (
            <div className="space-y-4">
              <PendingCasesCard pendingCases={data.pendingCases} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
