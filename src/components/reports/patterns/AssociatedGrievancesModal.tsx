"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RecurringCategoryPatternItem } from "@/types/reports";

export interface AssociatedGrievancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pattern: RecurringCategoryPatternItem | null;
}

export function AssociatedGrievancesModal({
  isOpen,
  onClose,
  pattern,
}: AssociatedGrievancesModalProps) {
  if (!isOpen || !pattern) return null;

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "CRITICAL":
        return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300";
      case "HIGH":
        return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
      case "MEDIUM":
        return "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300";
      default:
        return "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200/80 p-4 sm:p-5 dark:border-slate-800">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Associated Grievances
              </h2>
              <Badge
                variant="outline"
                className={
                  pattern.severity === "CRITICAL"
                    ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 font-semibold"
                    : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 font-semibold"
                }
              >
                {pattern.severity}
              </Badge>
              <Badge
                variant="outline"
                className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
              >
                {pattern.matchingCount} Cases (&gt; 7 Threshold)
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Department:{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {pattern.departmentName}
              </span>{" "}
              | Category:{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {pattern.categoryName}
              </span>
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Notice on Descriptive Role */}
        <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-600 dark:border-slate-800/80 dark:bg-slate-800/40 dark:text-slate-400">
          Displaying authorized grievance records contributing to this cluster
          in the 30-day window ({pattern.analysisPeriod.label}). Drilldown is
          read-only.
        </div>

        {/* Content Table */}
        <div className="overflow-y-auto p-4 sm:p-5">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="pb-2.5 font-medium">Grievance #</th>
                <th className="pb-2.5 font-medium">Title</th>
                <th className="pb-2.5 font-medium">Subcategory</th>
                <th className="pb-2.5 font-medium">Priority</th>
                <th className="pb-2.5 font-medium">Status</th>
                <th className="pb-2.5 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pattern.associatedGrievances.map((g) => (
                <tr
                  key={g.grievanceId}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                >
                  <td className="py-2.5 font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {g.grievanceNumber}
                  </td>
                  <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate pr-3">
                    {g.title}
                  </td>
                  <td className="py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {g.subcategoryName}
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium ${getPriorityBadgeClass(g.priority)}`}
                    >
                      {g.priority}
                    </Badge>
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {g.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(g.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200/80 p-3 px-4 sm:px-5 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Showing {pattern.associatedGrievances.length} cases in this
            recurring pattern
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 text-xs"
          >
            Close Drilldown
          </Button>
        </div>
      </div>
    </div>
  );
}
