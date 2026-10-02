"use client";

import { Clock, FileText, Paperclip, Send, X, AlertCircle, Eye } from "lucide-react";
import type React from "react";
import { useState, useMemo, useEffect } from "react";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import {
  AdvancedTableSearch,
  type SearchCondition,
  type FilterMode,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import { useTableSort } from "@/hooks/useTableSort";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/ui/pagination";
import { evaluateSearchConditions } from "@/lib/search-evaluator";
import { SortableTh } from "@/components/ui/sortable-table-head";
import { ActionMenu } from "@/components/ui/action-menu";
import Link from "next/link";
import { type EndUserGrievance } from "@/types/end-user";
import { useRouter } from "next/navigation";

interface GrievanceListProps {
  initialGrievances: EndUserGrievance[];
}

export function GrievanceList({ initialGrievances }: GrievanceListProps) {
  const [grievances, setGrievances] = useState<EndUserGrievance[]>(initialGrievances);
  const router = useRouter();

  // Advanced Search State
  const [advancedSearch, setAdvancedSearch] = useState<SearchCondition[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("AND");

  const searchFields: SearchFieldDef[] = useMemo(() => [
    { id: "grievanceNumber", key: "grievanceNumber", label: "Grievance ID", type: "text" },
    { id: "title", key: "title", label: "Title", type: "text" },
    { id: "category", key: "category", label: "Category", type: "select", options: Array.from(new Set(grievances.map(g => g.category))).map(c => ({ value: c, label: c })) },
    { id: "priority", key: "priority", label: "Priority", type: "select", options: ["LOW", "MEDIUM", "HIGH", "URGENT"].map(p => ({ value: p, label: p })) },
    { id: "status", key: "status", label: "Status", type: "select", options: Array.from(new Set(grievances.map(g => g.status))).map(s => ({ value: s, label: s })) },
  ], [grievances]);

  // Sorting
  const { sortState, handleSort, sortedItems } = useTableSort(grievances, {
    field: "createdAt",
    direction: "desc",
  });

  // Filtering
  const filteredGrievances = useMemo(() => {
    return sortedItems.filter((item: EndUserGrievance) => evaluateSearchConditions(item, advancedSearch, filterMode));
  }, [sortedItems, advancedSearch, filterMode]);

  // Pagination
  const pagination = usePagination(filteredGrievances, {
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20],
  });

  // Reset pagination on filter/sort changes
  useEffect(() => {
    pagination.resetPage();
  }, [advancedSearch, filterMode, sortState, pagination.resetPage]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden h-full flex flex-col min-h-0">
      <div className="p-5 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 min-w-0 w-full lg:w-1/2">
            <AdvancedTableSearch
              fields={searchFields}
              onSearch={(conds, mode) => { setAdvancedSearch(conds); setFilterMode(mode); }}
              className="w-full"
            />
          </div>
          <Link
            href="/end-user/submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-sm"
          >
            + File New Grievance
          </Link>
        </div>
      </div>

      {filteredGrievances.length === 0 ? (
        <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400 space-y-3">
          <FileText className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            No grievances found.
          </p>
          <p className="text-xs">
            {advancedSearch.length > 0 ? "Try adjusting your search filters." : "You have not registered any grievances yet."}
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="overflow-y-auto custom-scrollbar flex-1 relative">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md shadow-sm z-10 after:absolute after:inset-x-0 after:bottom-0 after:border-b after:border-slate-200 dark:after:border-slate-700">
                <tr>
                  <SortableTh field="grievanceNumber" currentSort={sortState} onSort={handleSort} className="py-3.5 px-5">Grievance ID</SortableTh>
                  <SortableTh field="title" currentSort={sortState} onSort={handleSort} className="py-3.5 px-4">Title</SortableTh>
                  <SortableTh field="category" currentSort={sortState} onSort={handleSort} className="py-3.5 px-4">Category</SortableTh>
                  <SortableTh field="priority" currentSort={sortState} onSort={handleSort} className="py-3.5 px-4">Priority</SortableTh>
                  <SortableTh field="status" currentSort={sortState} onSort={handleSort} className="py-3.5 px-4">Status</SortableTh>
                  <SortableTh field="createdAt" currentSort={sortState} onSort={handleSort} className="py-3.5 px-4 whitespace-nowrap">Submitted</SortableTh>
                  <th className="py-3.5 px-5 text-right font-semibold text-slate-600 dark:text-slate-400 text-[13px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {pagination.paginatedItems.map((item: EndUserGrievance) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-4 px-5">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                        {item.grievanceNumber}
                      </span>
                    </td>
                    <td className="py-4 px-4 max-w-[200px]">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 text-sm">
                        {item.title}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400 text-sm truncate max-w-[140px]">
                      {item.category}
                    </td>
                    <td className="py-4 px-4">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <ActionMenu
                        items={[
                          {
                            label: "View Details",
                            icon: <Eye className="h-4 w-4" />,
                            onClick: () => router.push(`/end-user/grievances/${item.id}`)
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {pagination.totalCount > 0 && (
            <div className="shrink-0">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                pageSize={pagination.pageSize}
                onPageChange={pagination.onPageChange}
                onPageSizeChange={pagination.onPageSizeChange}
                pageSizeOptions={pagination.pageSizeOptions}
                itemLabel="grievances"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
