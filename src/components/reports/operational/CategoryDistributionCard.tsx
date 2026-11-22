"use client";

import { FolderTree } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  AdvancedTableSearch,
  type FilterMode,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import {
  SortableTableHead,
  type SortDirection,
  type SortState,
} from "@/components/ui/sortable-table-head";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { evaluateSearchConditions } from "@/lib/search-evaluator";
import type { CategoryDistributionItem } from "@/types/reports";

export interface CategoryDistributionCardProps {
  categoryDistribution: CategoryDistributionItem[];
  totalUniqueGrievances: number;
}

export interface FlatTaxonomyRow {
  id: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string | null;
  subcategoryName: string;
  count: number;
  percentage: number;
}

const searchFields: SearchFieldDef[] = [
  { id: "category", label: "Category", type: "text" },
  { id: "subcategory", label: "Subcategory", type: "text" },
];

export function CategoryDistributionCard({
  categoryDistribution,
  totalUniqueGrievances,
}: CategoryDistributionCardProps) {
  const [conditions, setConditions] = useState<SearchCondition[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("AND");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [sort, setSort] = useState<SortState>({ field: null, direction: null });

  // Flatten categories and subcategories into separate distinct tabular rows
  const allRows: FlatTaxonomyRow[] = useMemo(() => {
    const rows: FlatTaxonomyRow[] = [];

    categoryDistribution.forEach((cat) => {
      if (cat.subcategories && cat.subcategories.length > 0) {
        cat.subcategories.forEach((sub) => {
          const share =
            totalUniqueGrievances > 0
              ? (sub.count / totalUniqueGrievances) * 100
              : 0;
          rows.push({
            id: `${cat.categoryId}-${sub.subcategoryId}`,
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            subcategoryId: sub.subcategoryId,
            subcategoryName: sub.subcategoryName,
            count: sub.count,
            percentage: share,
          });
        });
      } else {
        rows.push({
          id: cat.categoryId,
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          subcategoryId: null,
          subcategoryName: "General / Unspecified",
          count: cat.count,
          percentage: cat.percentage,
        });
      }
    });

    return rows;
  }, [categoryDistribution, totalUniqueGrievances]);

  const handleSort = (field: string, direction: SortDirection) => {
    setSort({ field, direction });
  };

  const filteredRows = useMemo(() => {
    if (!conditions || conditions.length === 0) return allRows;
    return allRows.filter((r) =>
      evaluateSearchConditions(
        {
          ...r,
          title: `${r.categoryName} ${r.subcategoryName}`,
          category: r.categoryName,
          subcategory: r.subcategoryName,
        },
        conditions,
        filterMode,
      ),
    );
  }, [allRows, conditions, filterMode]);

  const sortedRows = useMemo(() => {
    if (!sort.field || !sort.direction) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      let valA: unknown;
      let valB: unknown;
      if (sort.field === "categoryName") {
        valA = a.categoryName;
        valB = b.categoryName;
      } else if (sort.field === "subcategoryName") {
        valA = a.subcategoryName;
        valB = b.subcategoryName;
      } else if (sort.field === "count") {
        valA = a.count;
        valB = b.count;
      } else if (sort.field === "percentage") {
        valA = a.percentage;
        valB = b.percentage;
      }
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      let cmp = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        cmp = valA - valB;
      } else {
        cmp = String(valA).localeCompare(String(valB), undefined, {
          numeric: true,
        });
      }
      return sort.direction === "asc" ? cmp : -cmp;
    });
  }, [filteredRows, sort]);

  const totalPages = Math.ceil(sortedRows.length / pageSize);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <CardHeader className="pb-2 pt-3.5 px-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <FolderTree className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Category &amp; Subcategory Breakdown
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Taxonomy volume distribution across{" "}
              {totalUniqueGrievances.toLocaleString()} unique cases
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        {/* Full-Width Search Input */}
        {allRows.length > 0 && (
          <div className="w-full">
            <AdvancedTableSearch
              fields={searchFields}
              onSearch={(conds, mode) => {
                setConditions(conds);
                setFilterMode(mode);
                setCurrentPage(1);
              }}
              className="w-full"
            />
          </div>
        )}

        {allRows.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
            No grievance records found for this taxonomy selection.
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500">
            No categories or subcategories matching search criteria.
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col">
            <div className="overflow-y-auto max-h-[220px] custom-scrollbar">
              <Table className="relative">
                <TableHeader className="sticky top-0 bg-slate-50 dark:bg-slate-800/95 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-slate-700">
                  <TableRow>
                    <SortableTableHead
                      field="categoryName"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Category
                    </SortableTableHead>
                    <SortableTableHead
                      field="subcategoryName"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Subcategory
                    </SortableTableHead>
                    <SortableTableHead
                      field="count"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 text-right font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Cases
                    </SortableTableHead>
                    <SortableTableHead
                      field="percentage"
                      currentSort={sort}
                      onSort={handleSort}
                      className="py-2.5 px-3 text-right w-24 font-semibold text-xs text-slate-600 dark:text-slate-300"
                    >
                      Share
                    </SortableTableHead>
                    <TableHead className="py-2.5 px-3 w-32 sm:w-44 font-semibold text-xs text-slate-600 dark:text-slate-300">
                      Distribution
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedRows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <TableCell className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        {row.categoryName}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-xs">
                        {row.subcategoryName}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right text-slate-900 dark:text-slate-100 font-bold font-mono text-xs">
                        {row.count}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {row.percentage.toFixed(1)}%
                      </TableCell>
                      <TableCell className="py-2.5 px-3">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, Math.max(3, row.percentage))}%`,
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Standard Pagination Controls Fixed Below the Table */}
        {sortedRows.length > 0 && (
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={sortedRows.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 20]}
              itemLabel="taxonomy items"
              compact
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
