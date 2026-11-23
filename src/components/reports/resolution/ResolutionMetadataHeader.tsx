"use client";

import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReportMetadata } from "@/types/reports";

export interface ResolutionMetadataHeaderProps {
  metadata: ReportMetadata;
  isLoading?: boolean;
  onRefresh?: () => void;
  onExport?: (format: "CSV" | "EXCEL" | "PDF") => void;
  isExporting?: boolean;
}

export function ResolutionMetadataHeader({
  metadata,
  isLoading = false,
  onExport,
  isExporting = false,
}: ResolutionMetadataHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Title and Scope */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Resolution Analytics (TAT)
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
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Authoritative Turnaround Time (TAT), resolution workflow stages,
            departmental processing durations, SLA compliance, and rework
            activity.
          </p>
        </div>

        {/* Actions: Export */}
        {onExport && (
          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={isLoading || isExporting}
                className="inline-flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md bg-blue-700 hover:bg-blue-800 text-white shadow-xs focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
              >
                <Download
                  className={`h-3.5 w-3.5 ${isExporting ? "animate-spin" : ""}`}
                />
                <span>{isExporting ? "Exporting..." : "Export Report"}</span>
                <ChevronDown className="h-3 w-3 opacity-80" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 text-xs">
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
          </div>
        )}
      </div>
    </div>
  );
}
