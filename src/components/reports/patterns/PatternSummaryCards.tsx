"use client";

import {
  AlertTriangle,
  Building2,
  Info,
  Layers,
  SlidersHorizontal,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RecurringPatternsSummary } from "@/types/reports";

export interface PatternSummaryCardsProps {
  summary: RecurringPatternsSummary;
}

export function PatternSummaryCards({ summary }: PatternSummaryCardsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Insufficient Data Warning Banner */}
      {summary.isInsufficientData && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex flex-col gap-1 text-xs sm:text-sm">
            <span className="font-semibold">
              Insufficient Grievance Volume for Pattern Clustering
            </span>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Only {summary.totalGrievancesInWindow} grievance(s) recorded in
              the selected 30-day window. At least 5 records are recommended to
              establish meaningful trend evaluations. Pattern clustering
              requires &gt; 7 occurrences in a single category.
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Patterns */}
        <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Detected Patterns
            </CardTitle>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-5 pt-0">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary.totalPatternsDetected}
            </div>
            <CardDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Category clusters exceeding {summary.minThreshold} occurrences
            </CardDescription>
          </CardContent>
        </Card>

        {/* Affected Grievances */}
        <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Affected Cases
            </CardTitle>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Layers className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-5 pt-0">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary.totalAffectedGrievances}
            </div>
            <CardDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Across {summary.totalGrievancesInWindow} total cases in 30-day
              window
            </CardDescription>
          </CardContent>
        </Card>

        {/* Departments with Patterns */}
        <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Impacted Departments
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-5 pt-0">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary.departmentsWithPatternsCount}
            </div>
            <CardDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Departments with recurring clusters
            </CardDescription>
          </CardContent>
        </Card>

        {/* Threshold Rule */}
        <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Clustering Threshold
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-5 pt-0">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              &gt; {summary.minThreshold} Cases
            </div>
            <CardDescription className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              LLD §3.10.5 rule: &gt; 7 occurrences in 30 days
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
