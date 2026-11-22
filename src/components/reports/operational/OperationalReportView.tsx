"use client";

import {
  AlertCircle,
  CheckCircle2,
  FolderTree,
  LayoutDashboard,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useReportExport } from "@/hooks/useReportExport";
import type {
  OperationalReportApiResponse,
  OperationalReportData,
  OperationalReportFilterOptions,
  OperationalReportFilters,
} from "@/types/reports";
import { CategoryDistributionCard } from "./CategoryDistributionCard";
import { DepartmentDistributionCard } from "./DepartmentDistributionCard";
import { EscalationReportCard } from "./EscalationReportCard";
import { GrievanceVolumeCard } from "./GrievanceVolumeCard";
import { PriorityDistributionCard } from "./PriorityDistributionCard";
import { ReportFilterBar } from "./ReportFilterBar";
import { ReportMetadataHeader } from "./ReportMetadataHeader";
import { SlaMonitoringCard } from "./SlaMonitoringCard";
import { StaffAssignmentReportCard } from "./StaffAssignmentReportCard";
import { StatusDistributionCard } from "./StatusDistributionCard";

export interface OperationalReportViewProps {
  userRole: "ADMIN" | "DEPARTMENT_HEAD";
  departmentName?: string;
}

export function OperationalReportView({
  userRole,
  departmentName: _departmentName,
}: OperationalReportViewProps) {
  const isOrganizationWide = userRole === "ADMIN";

  const [filters, setFilters] = useState<OperationalReportFilters>(() => {
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
    "overview" | "taxonomy" | "staff" | "sla"
  >("overview");

  const [data, setData] = useState<OperationalReportData | null>(null);
  const [filterOptions, setFilterOptions] =
    useState<OperationalReportFilterOptions>({
      departments: [],
      categories: [],
      priorities: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
      statuses: [],
      slaStatuses: ["ON_TRACK", "AT_RISK", "BREACHED"],
      assignmentStatuses: [
        { value: "ALL", label: "All Assignment States" },
        { value: "ASSIGNED", label: "Assigned" },
        { value: "UNASSIGNED", label: "Unassigned" },
      ],
    });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    isExporting,
    exportSuccessMessage,
    exportErrorMessage,
    handleExport,
    clearExportMessages,
  } = useReportExport("OPERATIONAL");

  const fetchReport = useCallback(
    async (currentFilters: OperationalReportFilters) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const query = new URLSearchParams();
        if (currentFilters.startDate)
          query.set("startDate", currentFilters.startDate);
        if (currentFilters.endDate)
          query.set("endDate", currentFilters.endDate);
        if (currentFilters.departmentId)
          query.set("departmentId", currentFilters.departmentId);
        if (currentFilters.categoryId)
          query.set("categoryId", currentFilters.categoryId);
        if (currentFilters.subcategoryId)
          query.set("subcategoryId", currentFilters.subcategoryId);
        if (currentFilters.priority)
          query.set("priority", currentFilters.priority);
        if (currentFilters.status) query.set("status", currentFilters.status);
        if (currentFilters.slaStatus)
          query.set("slaStatus", currentFilters.slaStatus);
        if (
          currentFilters.assignmentStatus &&
          currentFilters.assignmentStatus !== "ALL"
        ) {
          query.set("assignmentStatus", currentFilters.assignmentStatus);
        }

        const res = await fetch(`/api/reports/operational?${query.toString()}`);
        const json: OperationalReportApiResponse = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(
            json.message || `Failed to fetch report (HTTP ${res.status})`,
          );
        }

        setData(json.data);
        if (json.filterOptions) {
          setFilterOptions(json.filterOptions);
        }
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while loading the report.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchReport(filters);
  }, [fetchReport, filters]);

  const handleApplyFilters = (newFilters: OperationalReportFilters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    const now = new Date();
    const endStr = now.toISOString().split("T")[0];
    const startStr = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const reset = {
      startDate: startStr,
      endDate: endStr,
    };
    setFilters(reset);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-3 sm:gap-4 p-3 sm:p-5 max-w-7xl mx-auto w-full">
      {/* 1. Report Metadata & Generation Header */}
      {data ? (
        <ReportMetadataHeader
          metadata={data.metadata}
          isLoading={isLoading}
          onRefresh={() => fetchReport(filters)}
          onExport={(format) => handleExport(filters, format)}
          isExporting={isExporting}
        />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <Skeleton className="h-10 w-full" />
        </div>
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

      {/* 2. Interactive Filter Toolbar */}
      <ReportFilterBar
        filters={filters}
        filterOptions={filterOptions}
        isOrganizationWide={isOrganizationWide}
        isLoading={isLoading}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Error State Banner */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchReport(filters)}
            className="h-7 text-xs border-rose-300 hover:bg-rose-100 dark:border-rose-800"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 3. Loading Skeletons */}
      {isLoading && !data && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Loading skeleton
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </div>
      )}

      {/* 4. Loaded Data Content */}
      {data && (
        <div className="flex flex-col gap-3.5 sm:gap-4">
          {/* Executive Summary Cards */}
          <GrievanceVolumeCard summary={data.summary} />

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-1 print:hidden">
            <Button
              type="button"
              variant={activeTab === "overview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("overview")}
              className="h-8 text-xs font-medium rounded-lg gap-1.5 px-3"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Overview & Distribution
            </Button>
            <Button
              type="button"
              variant={activeTab === "taxonomy" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("taxonomy")}
              className="h-8 text-xs font-medium rounded-lg gap-1.5 px-3"
            >
              <FolderTree className="h-3.5 w-3.5" />
              Departments & Categories
            </Button>
            <Button
              type="button"
              variant={activeTab === "staff" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("staff")}
              className="h-8 text-xs font-medium rounded-lg gap-1.5 px-3"
            >
              <Users className="h-3.5 w-3.5" />
              Staff & Caseload
            </Button>
            <Button
              type="button"
              variant={activeTab === "sla" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("sla")}
              className="h-8 text-xs font-medium rounded-lg gap-1.5 px-3"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              SLA & Escalations
            </Button>
          </div>

          {/* Tab 1: Executive Overview */}
          {activeTab === "overview" && (
            <div className="flex flex-col gap-3.5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                <StatusDistributionCard
                  statusDistribution={data.statusDistribution}
                  totalUniqueGrievances={data.summary.totalUniqueGrievances}
                />
                <PriorityDistributionCard
                  priorityDistribution={data.priorityDistribution}
                  totalUniqueGrievances={data.summary.totalUniqueGrievances}
                />
              </div>
              <DepartmentDistributionCard
                departmentDistribution={data.departmentDistribution}
                totalUniqueGrievances={data.summary.totalUniqueGrievances}
              />
            </div>
          )}

          {/* Tab 2: Departments & Categories */}
          {activeTab === "taxonomy" && (
            <div className="flex flex-col gap-3.5">
              <DepartmentDistributionCard
                departmentDistribution={data.departmentDistribution}
                totalUniqueGrievances={data.summary.totalUniqueGrievances}
              />
              <CategoryDistributionCard
                categoryDistribution={data.categoryDistribution}
                totalUniqueGrievances={data.summary.totalUniqueGrievances}
              />
            </div>
          )}

          {/* Tab 3: Staff & Workload */}
          {activeTab === "staff" && (
            <StaffAssignmentReportCard
              staffAssignments={data.staffAssignments}
              totalUniqueGrievances={data.summary.totalUniqueGrievances}
            />
          )}

          {/* Tab 4: SLA & Escalations */}
          {activeTab === "sla" && (
            <div className="flex flex-col gap-3.5">
              <SlaMonitoringCard
                slaMonitoring={data.slaMonitoring}
                totalUniqueGrievances={data.summary.totalUniqueGrievances}
              />
              <EscalationReportCard escalations={data.escalations} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
