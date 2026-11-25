"use client";

import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Hourglass,
  Layers,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ResolutionStagesCard } from "./ResolutionStagesCard";
import { ResolutionTatByPriorityCard } from "./ResolutionTatByPriorityCard";
import { ReworkAndReopenCard } from "./ReworkAndReopenCard";
import { SlaResolutionComplianceCard } from "./SlaResolutionComplianceCard";

export interface ResolutionReportViewProps {
  userRole: "ADMIN" | "DEPARTMENT_HEAD";
  departmentName?: string;
}

type ResolutionTab = "stages" | "departments" | "sla" | "rework" | "pending";

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ResolutionReportView({
  userRole,
  departmentName: _departmentName,
}: ResolutionReportViewProps) {
  const isOrganizationWide = userRole === "ADMIN";

  const [filters, setFilters] = useState<ResolutionAnalyticsFilters>(() => {
    const now = new Date();
    const endStr = formatLocalDate(now);
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 30,
    );
    const startStr = formatLocalDate(start);

    return {
      startDate: startStr,
      endDate: endStr,
    };
  });

  // Default active tab is "stages" (Resolution Stages & TAT), "all/overview" removed per user instruction
  const [activeTab, setActiveTab] = useState<ResolutionTab>("stages");

  const [data, setData] = useState<ResolutionAnalyticsData | null>(null);
  const [filterOptions, setFilterOptions] =
    useState<ResolutionAnalyticsFilterOptions>({
      departments: [],
      categories: [],
      priorities: ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"],
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
        if (currentFilters.search) {
          query.set("search", currentFilters.search);
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
    };
    setFilters(resetFilters);
  };

  return (
    <div className="flex-1 h-full min-h-0 flex flex-col gap-2 sm:gap-2.5 w-full overflow-y-auto overflow-x-hidden custom-scrollbar">
      {/* 1. Header Row (Clean, uncluttered, compact without redundant badges or timestamps) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 shrink-0">
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Resolution Analytics (TAT)
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
            Authoritative Turnaround Time (TAT), resolution workflow stages,
            departmental processing durations, SLA compliance, and rework
            activity.
          </p>
        </div>

        {/* Action Buttons: Export */}
        <div className="flex items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={isLoading || isExporting}
              className="inline-flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md bg-blue-700 hover:bg-blue-800 text-white shadow-xs focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
            >
              <Download
                className={`h-3 w-3 ${isExporting ? "animate-spin" : ""}`}
              />
              <span>{isExporting ? "Exporting..." : "Export Report"}</span>
              <ChevronDown className="h-3 w-3 opacity-80" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 text-xs">
              <DropdownMenuLabel className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Export Format
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleExport(filters, "CSV")}
                className="gap-2 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-slate-600" />
                <span>CSV Spreadsheet (.csv)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport(filters, "EXCEL")}
                className="gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Excel Workbook (.xlsx)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport(filters, "PDF")}
                className="gap-2 cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-rose-600" />
                <span>PDF Document (.pdf)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Export Notifications */}
      {exportSuccessMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{exportSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={clearExportMessages}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 text-xs font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {exportErrorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 flex items-center justify-between gap-3 shadow-xs">
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

      {/* 2. Interactive Filter Toolbar with Standard Search */}
      <div className="shrink-0">
        <ResolutionFilterBar
          filters={filters}
          filterOptions={filterOptions}
          isOrganizationWide={isOrganizationWide}
          isLoading={isLoading}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Error State Banner */}
      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 flex items-center justify-between gap-3">
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
        <div className="flex flex-col gap-5">
          <Skeleton className="h-10 w-80 rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Skeleton className="h-80 w-full rounded-lg" />
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>
        </div>
      )}

      {/* 4. Loaded Data Content with Focused Domain Tabs */}
      {data && (
        <div className="flex-1 min-h-0 flex flex-col gap-2">
          {/* Domain Focus Navigation Tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5 pt-0.5 overflow-x-auto print:hidden shrink-0">
            <div
              role="tablist"
              aria-label="Resolution Analytics Views"
              className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg shrink-0"
            >
              {(
                [
                  {
                    id: "stages",
                    label: "Workflow Stages & TAT",
                    icon: Layers,
                  },
                  {
                    id: "departments",
                    label: "Department Processing",
                    icon: Building2,
                  },
                  { id: "sla", label: "SLA Compliance", icon: ShieldCheck },
                  { id: "rework", label: "Rework & Reopen", icon: RotateCcw },
                  {
                    id: "pending",
                    label: `Pending Cases (${data.pendingCases.totalPendingCount})`,
                    icon: Hourglass,
                  },
                ] as Array<{
                  id: ResolutionTab;
                  label: string;
                  icon: typeof Layers;
                }>
              ).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: Workflow Stages & TAT by Priority */}
          {activeTab === "stages" && (
            <section
              className="space-y-1.5 pb-3"
              aria-labelledby="heading-workflow-stages"
            >
              <div className="flex items-baseline justify-between shrink-0">
                <div>
                  <h2
                    id="heading-workflow-stages"
                    className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    Resolution Stages &amp; Turnaround Time
                  </h2>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Lifecycle milestone progression and end-to-end turnaround
                    time across priority tiers
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <ResolutionStagesCard stages={data.stages} />
                <ResolutionTatByPriorityCard
                  tatByPriority={data.tatByPriority}
                />
              </div>
            </section>
          )}

          {/* TAB 2: Department Processing Time */}
          {activeTab === "departments" && (
            <section
              className="space-y-1.5 pb-3"
              aria-labelledby="heading-dept-processing"
            >
              <div className="flex items-baseline justify-between shrink-0">
                <div>
                  <h2
                    id="heading-dept-processing"
                    className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    Departmental Processing Time &amp; Workload
                  </h2>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Department-level processing durations, distinguishing
                    Primary lead processing from Supporting contributor
                    processing
                  </p>
                </div>
              </div>

              <DepartmentProcessingTimeCard
                departments={data.departmentProcessing}
              />
            </section>
          )}

          {/* TAB 3: SLA Compliance */}
          {activeTab === "sla" && (
            <section
              className="space-y-1.5 pb-3"
              aria-labelledby="heading-sla-compliance"
            >
              <div className="flex items-baseline justify-between shrink-0">
                <div>
                  <h2
                    id="heading-sla-compliance"
                    className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    SLA Compliance &amp; Breach Analysis
                  </h2>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Authoritative SLA attainment metrics derived from verified
                    SLA tracking records
                  </p>
                </div>
              </div>

              <SlaResolutionComplianceCard slaCompliance={data.slaCompliance} />
            </section>
          )}

          {/* TAB 4: Rework & Reopen */}
          {activeTab === "rework" && (
            <section
              className="space-y-1.5 pb-3"
              aria-labelledby="heading-rework-reopen"
            >
              <div className="flex items-baseline justify-between shrink-0">
                <div>
                  <h2
                    id="heading-rework-reopen"
                    className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    Reopening &amp; Resolution Rework Analysis
                  </h2>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Grievances with repeated resolution cycles, supervisor
                    rejections, and post-closure reopenings
                  </p>
                </div>
              </div>

              <ReworkAndReopenCard reworkAndReopen={data.reworkAndReopen} />
            </section>
          )}

          {/* TAB 5: Pending Cases */}
          {activeTab === "pending" && (
            <section
              className="space-y-1.5 pb-3"
              aria-labelledby="heading-pending-cases"
            >
              <div className="flex items-baseline justify-between shrink-0">
                <div>
                  <h2
                    id="heading-pending-cases"
                    className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    Unresolved Grievances (Pending Cases)
                  </h2>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Excluded from completed-resolution time calculations and
                    tracked separately by active age
                  </p>
                </div>
              </div>

              <PendingCasesCard pendingCases={data.pendingCases} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
