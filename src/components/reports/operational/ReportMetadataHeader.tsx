"use client";

import {
  Calendar,
  ChevronDown,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Shield,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReportMetadata } from "@/types/reports";

export interface ReportMetadataHeaderProps {
  metadata: ReportMetadata;
  isLoading?: boolean;
  onRefresh: () => void;
  onExport?: (format: "CSV" | "EXCEL" | "PDF") => void;
  isExporting?: boolean;
}

export function ReportMetadataHeader({
  metadata,
  isLoading = false,
  onRefresh,
  onExport,
  isExporting = false,
}: ReportMetadataHeaderProps) {
  const formattedGenTime = new Date(metadata.generatedAt).toLocaleString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  );

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Title and Scope */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Operational Report
            </h1>
            {metadata.scope.isOrganizationWide ? (
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-medium"
              >
                <Shield className="mr-1 h-3 w-3" />
                Organization-Wide
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300 font-medium"
              >
                <Shield className="mr-1 h-3 w-3" />
                {metadata.scope.departmentName || "Department Scoped"}
              </Badge>
            )}
            <Badge
              variant="outline"
              className="border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              LLD §3.10.2
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Authoritative operational statistics on grievance volume, workflow
            distribution, staff assignments, SLA health, and escalations.
          </p>
        </div>

        {/* Metadata Details & Actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex flex-col text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-200">
              <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>Period: {metadata.reportingPeriod.label}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mt-0.5">
              <Clock className="h-3 w-3" />
              <span>Generated: {formattedGenTime}</span>
              <span className="mx-1">•</span>
              <User className="h-3 w-3" />
              <span>By: {metadata.generatedBy.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading || isExporting}
              className="h-9 px-3 gap-1.5 text-xs font-medium"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>

            {onExport && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  disabled={isLoading || isExporting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer h-9"
                >
                  <Download
                    className={`h-3.5 w-3.5 ${isExporting ? "animate-spin text-blue-600" : ""}`}
                  />
                  <span>{isExporting ? "Exporting..." : "Export"}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Export Options
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onExport("CSV")}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Export as CSV (.csv)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onExport("EXCEL")}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-blue-600" />
                    <span>Export as Excel (.xlsx)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onExport("PDF")}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5 text-rose-600" />
                    <span>Export as PDF (.pdf)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
