"use client";

import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  FolderTree,
  ShieldAlert,
  Users,
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
  OperationalReportApiResponse,
  OperationalReportData,
  OperationalReportFilterOptions,
  OperationalReportFilters,
} from "@/types/reports";
import { CategoryDistributionCard } from "./CategoryDistributionCard";
import { DepartmentDistributionCard } from "./DepartmentDistributionCard";
import { PriorityDistributionCard } from "./PriorityDistributionCard";
import { ReportFilterBar } from "./ReportFilterBar";
import { SlaMonitoringCard } from "./SlaMonitoringCard";
import { StaffAssignmentReportCard } from "./StaffAssignmentReportCard";
import { StatusDistributionCard } from "./StatusDistributionCard";

export interface OperationalReportViewProps {
  userRole: "ADMIN" | "DEPARTMENT_HEAD";
  departmentName?: string;
}

type OperationalTab = "overview" | "departments" | "sla" | "staff" | "taxonomy";

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function OperationalReportView({
  userRole,
  departmentName: _departmentName,
}: OperationalReportViewProps) {
  const isOrganizationWide = userRole === "ADMIN";

  const [filters, setFilters] = useState<OperationalReportFilters>(() => {
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

  // Default active tab is "overview" (Status & Priority), "all" option removed per user instruction
  const [activeTab, setActiveTab] = useState<OperationalTab>("overview");

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
        if (currentFilters.search) {
          query.set("search", currentFilters.search);
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
    const endStr = formatLocalDate(now);
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 30,
    );
    const startStr = formatLocalDate(start);

    const reset = {
      startDate: startStr,
      endDate: endStr,
    };
    setFilters(reset);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-2 sm:gap-2.5 pb-2 px-3 sm:px-4 max-w-7xl mx-auto w-full">
      {/* 1. Header Row (Clean, uncluttered, compact) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Operational &amp; Performance Reports
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
            Operational statistics on grievance intake volumes, workflow
            lifecycle distribution, department workloads, SLA compliance, and
            escalations.
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

      {/* 4. Loaded Data Content */}
      {data && (
        <div className="flex flex-col gap-2">
          {/* Domain Focus Navigation Tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto print:hidden">
            <div
              role="tablist"
              aria-label="Operational Analytics Views"
              className="inline-flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg shrink-0"
            >
              {(
                [
                  {
                    id: "overview",
                    label: "Status & Priority",
                    icon: BarChart3,
                  },
                  {
                    id: "departments",
                    label: "Department Workload",
                    icon: Users,
                  },
                  { id: "sla", label: "SLA & Escalations", icon: ShieldAlert },
                  { id: "staff", label: "Staff Caseload", icon: Users },
                  {
                    id: "taxonomy",
                    label: "Category Taxonomy",
                    icon: FolderTree,
                  },
                ] as Array<{
                  id: OperationalTab;
                  label: string;
                  icon: typeof BarChart3;
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
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
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

          {/* TAB 1: Status & Priority Distribution */}
          {activeTab === "overview" && (
            <section
              className="space-y-1.5 mb-1"
              aria-labelledby="heading-status-priority"
            >
              <div className="flex items-baseline justify-between">
                <div>
                  <h2
                    id="heading-status-priority"
                    className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    Status & Priority Analytics
                  </h2>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Lifecycle stage distribution and severity breakdown for
                    received grievances
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                <StatusDistributionCard
                  statusDistribution={data.statusDistribution}
                  totalUniqueGrievances={data.summary.totalUniqueGrievances}
                />
                <PriorityDistributionCard
                  priorityDistribution={data.priorityDistribution}
                  totalUniqueGrievances={data.summary.totalUniqueGrievances}
                />
              </div>
            </section>
          )}

          {/* TAB 2: Department Workload Distribution */}
          {activeTab === "departments" && (
            <section
              className="space-y-1.5 mb-1"
              aria-labelledby="heading-dept-workload"
            >
              <div className="flex items-baseline justify-between">
                <div>
                  <h2
                    id="heading-dept-workload"
                    className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    Department Workload & Routing Analytics
                  </h2>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Primary vs Supporting department involvements with
                    deduplication accounting
                  </p>
                </div>
              </div>

              <DepartmentDistributionCard
                departmentDistribution={data.departmentDistribution}
                totalUniqueGrievances={data.summary.totalUniqueGrievances}
              />
            </section>
          )}

          {/* TAB 3: SLA Performance & Escalations (Unified Single Table Card) */}
          {activeTab === "sla" && (
            <section
              className="space-y-1.5 mb-1"
              aria-labelledby="heading-sla-escalations"
            >
              <div className="flex items-baseline justify-between">
                <div>
                  <h2
                    id="heading-sla-escalations"
                    className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    SLA Compliance &amp; Escalations
                  </h2>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Active operational deadline tracking and governance
                    escalation records
                  </p>
                </div>
              </div>

              <SlaMonitoringCard
                slaMonitoring={data.slaMonitoring}
                escalations={data.escalations}
                totalUniqueGrievances={data.summary.totalUniqueGrievances}
              />
            </section>
          )}

          {/* TAB 4: Staff Workload Caseload */}
          {activeTab === "staff" && (
            <section
              className="space-y-1.5 mb-1"
              aria-labelledby="heading-staff-caseload"
            >
              <div className="flex items-baseline justify-between">
                <div>
                  <h2
                    id="heading-staff-caseload"
                    className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    Staff Caseload & Handover Governance
                  </h2>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Investigation caseload per active grievance staff member
                  </p>
                </div>
              </div>

              <StaffAssignmentReportCard
                staffAssignments={data.staffAssignments}
                totalUniqueGrievances={data.summary.totalUniqueGrievances}
              />
            </section>
          )}

          {/* TAB 5: Category & Taxonomy Breakdown */}
          {activeTab === "taxonomy" && (
            <section
              className="space-y-1.5 mb-1"
              aria-labelledby="heading-taxonomy"
            >
              <div className="flex items-baseline justify-between">
                <div>
                  <h2
                    id="heading-taxonomy"
                    className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100"
                  >
                    Category Taxonomy Breakdown
                  </h2>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                    Volume distribution across master grievance categories and
                    subcategories
                  </p>
                </div>
              </div>

              <CategoryDistributionCard
                categoryDistribution={data.categoryDistribution}
                totalUniqueGrievances={data.summary.totalUniqueGrievances}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
