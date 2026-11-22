"use client";

import { ChevronDown, ChevronRight, FolderTree } from "lucide-react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CategoryDistributionItem } from "@/types/reports";

export interface CategoryDistributionCardProps {
  categoryDistribution: CategoryDistributionItem[];
  totalUniqueGrievances: number;
}

export function CategoryDistributionCard({
  categoryDistribution,
  totalUniqueGrievances,
}: CategoryDistributionCardProps) {
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  return (
    <Card className="border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
      <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <FolderTree className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Category & Subcategory Breakdown
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Distribution of grievance taxonomy across{" "}
              {totalUniqueGrievances.toLocaleString()} cases
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-5 pt-0">
        {categoryDistribution.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            No grievance records found for this taxonomy selection.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    <th className="pb-2 font-medium">Category / Subcategory</th>
                    <th className="pb-2 font-medium text-right">Cases</th>
                    <th className="pb-2 font-medium text-right w-20">Share</th>
                    <th className="pb-2 font-medium pl-3 w-28 sm:w-36">Bar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {categoryDistribution.map((cat) => {
                    const isExpanded = Boolean(
                      expandedCategories[cat.categoryId],
                    );
                    const hasSubcategories = cat.subcategories.length > 0;

                    return (
                      <React.Fragment key={cat.categoryId}>
                        <tr
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer font-medium"
                          onClick={() => toggleCategory(cat.categoryId)}
                        >
                          <td className="py-2.5 pr-2 flex items-center gap-1.5 text-slate-900 dark:text-slate-100">
                            {hasSubcategories ? (
                              isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              )
                            ) : (
                              <span className="w-3.5" />
                            )}
                            <span>{cat.categoryName}</span>
                            {hasSubcategories && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({cat.subcategories.length} sub)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-900 dark:text-slate-100 font-semibold">
                            {cat.count}
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-600 dark:text-slate-400">
                            {cat.percentage}%
                          </td>
                          <td className="py-2.5 pl-3">
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, Math.max(2, cat.percentage))}%`,
                                }}
                              />
                            </div>
                          </td>
                        </tr>

                        {/* Nested Subcategories */}
                        {isExpanded &&
                          cat.subcategories.map((sub) => (
                            <tr
                              key={`${cat.categoryId}-${sub.subcategoryId}`}
                              className="bg-slate-50/40 dark:bg-slate-800/20 text-slate-600 dark:text-slate-400"
                            >
                              <td className="py-2 pr-2 pl-7 text-[11px] text-slate-600 dark:text-slate-300">
                                └ {sub.subcategoryName}
                              </td>
                              <td className="py-2 px-2 text-right text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                {sub.count}
                              </td>
                              <td className="py-2 px-2 text-right text-[11px] text-slate-500 dark:text-slate-400">
                                {sub.percentage}% of cat
                              </td>
                              <td className="py-2 pl-3">
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-indigo-400 dark:bg-indigo-400/80 h-1.5 rounded-full"
                                    style={{
                                      width: `${Math.min(100, Math.max(2, sub.percentage))}%`,
                                    }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import React from "react";
