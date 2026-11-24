"use client";

import { ExternalLink, FolderTree, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RecurringCategoryPatternItem } from "@/types/reports";

export interface CategoryPatternsCardProps {
  categoryPatterns: RecurringCategoryPatternItem[];
  onSelectPattern: (pattern: RecurringCategoryPatternItem) => void;
}

export function CategoryPatternsCard({
  categoryPatterns,
  onSelectPattern,
}: CategoryPatternsCardProps) {
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-3.5 sm:px-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <FolderTree className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Recurring Category Patterns
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Category clusters exceeding 7 cases within the 30-calendar-day
                window
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 text-xs"
          >
            {categoryPatterns.length} Active Pattern
            {categoryPatterns.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-3.5 sm:px-4 pb-3 sm:pb-3.5 pt-0 flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
        {categoryPatterns.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              No Recurring Category Patterns Detected
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              All category grievance counts in the selected 30-day window are at
              or below the 7-case threshold. No high-frequency clusters
              identified.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400 sticky top-0 bg-white dark:bg-slate-900">
                  <th className="pb-2 pt-1 font-semibold text-[11px]">
                    Department
                  </th>
                  <th className="pb-2 pt-1 font-semibold text-[11px]">
                    Category
                  </th>
                  <th className="pb-2 pt-1 font-semibold text-[11px]">
                    Matching Volume
                  </th>
                  <th className="pb-2 pt-1 font-semibold text-[11px]">
                    Severity
                  </th>
                  <th className="pb-2 pt-1 font-semibold text-[11px]">
                    Subcategories Involved
                  </th>
                  <th className="pb-2 pt-1 font-semibold text-[11px]">
                    Analysis Period
                  </th>
                  <th className="pb-2 pt-1 text-right font-semibold text-[11px]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {categoryPatterns.map((pattern) => (
                  <tr
                    key={pattern.patternId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {pattern.departmentName}
                    </td>
                    <td className="py-2 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {pattern.categoryName}
                    </td>
                    <td className="py-2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                        {pattern.matchingCount} cases
                        <span className="text-[10px] font-normal text-slate-500">
                          (&gt; {pattern.threshold})
                        </span>
                      </span>
                    </td>
                    <td className="py-2 whitespace-nowrap">
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
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {pattern.subcategoriesInvolved
                          .slice(0, 2)
                          .map((sub) => (
                            <span
                              key={sub.subcategoryId}
                              className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {sub.subcategoryName} ({sub.count})
                            </span>
                          ))}
                        {pattern.subcategoriesInvolved.length > 2 && (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            +{pattern.subcategoriesInvolved.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {pattern.analysisPeriod.label}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectPattern(pattern)}
                        className="h-7 gap-1 px-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>View Cases ({pattern.matchingCount})</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
