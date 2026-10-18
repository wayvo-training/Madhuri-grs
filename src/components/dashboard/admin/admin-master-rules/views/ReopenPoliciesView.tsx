import { AlertTriangle, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Pagination } from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useTableSort } from "@/hooks/useTableSort";
import type { SerializedReopenPolicy } from "@/types/admin/master-rules";

interface ReopenPoliciesViewProps {
  policies: SerializedReopenPolicy[];
  searchQuery: string;
  statusFilter: string[];
  onEdit: (policy: SerializedReopenPolicy) => void;
  onToggleStatus: (policy: SerializedReopenPolicy) => void;
  onDelete: (policy: SerializedReopenPolicy) => void;
}

export function ReopenPoliciesView({
  policies,
  searchQuery,
  statusFilter,
  onEdit,
  onToggleStatus,
  onDelete,
}: ReopenPoliciesViewProps) {
  const filtered = policies.filter((p) => {
    if (statusFilter.length > 0 && !statusFilter.includes(p.status))
      return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.policy_name.toLowerCase().includes(q);
      if (!matchName) return false;
    }
    return true;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const policiesWithTaxonomy = useMemo(() => {
    return filtered.map((p) => {
      let category = "All";
      let subcategory = "All";
      try {
        const cond = p.applicable_condition as {
          category?: string;
          subcategory?: string;
        };
        if (cond?.category) category = cond.category;
        if (cond?.subcategory) subcategory = cond.subcategory;
      } catch (_e) {}
      return {
        ...p,
        category,
        subcategory,
      };
    });
  }, [filtered]);

  const { sortState, handleSort, sortedItems } = useTableSort(
    policiesWithTaxonomy,
    {
      field: "policy_name",
      direction: "asc",
    },
  );

  const totalCount = sortedItems.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  const paginated = sortedItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <TooltipProvider delay={150}>
      <div className="flex flex-col gap-4">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs flex flex-col overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[1320px]">
              {(() => {
                const colGroup = (
                  <colgroup>
                    <col className="w-[240px]" />
                    <col className="w-[170px]" />
                    <col className="w-[170px]" />
                    <col className="w-[190px]" />
                    <col className="w-[160px]" />
                    <col className="w-[190px]" />
                    <col className="w-[110px]" />
                    <col className="w-[90px]" />
                  </colgroup>
                );

                return (
                  <>
                    {/* Static Header Table: no scrollbar next to header */}
                    <table className="w-full text-left text-[12px] table-fixed border-collapse shrink-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                      {colGroup}
                      <TableHeader className="bg-transparent">
                        <TableRow className="hover:bg-transparent whitespace-nowrap">
                          <SortableTableHead
                            field="policy_name"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[240px] py-3 pl-4 pr-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Policy Name
                          </SortableTableHead>
                          <SortableTableHead
                            field="category"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[170px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Category
                          </SortableTableHead>
                          <SortableTableHead
                            field="subcategory"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[170px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Subcategory
                          </SortableTableHead>
                          <SortableTableHead
                            field="reopen_window_hours"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[190px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Reopen Window
                          </SortableTableHead>
                          <SortableTableHead
                            field="max_reopen_count"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[160px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Max Reopens
                          </SortableTableHead>
                          <SortableTableHead
                            field="max_manual_review_count"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[190px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Manual Reviews
                          </SortableTableHead>
                          <SortableTableHead
                            field="status"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[110px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Status
                          </SortableTableHead>
                          <TableHead className="w-[90px] py-3 pl-2 pr-4 text-right text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden align-middle">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                    </table>

                    {/* Scrollable Rows Container (Vertical scroll within rows only) */}
                    <div className="max-h-[calc(100vh-340px)] overflow-y-auto overflow-x-hidden custom-scrollbar">
                      <table className="w-full text-left text-[13px] table-fixed border-collapse">
                        {colGroup}
                        <TableBody className="font-normal text-slate-700">
                          {filtered.length === 0 ? (
                            <TableRow className="h-[52px]">
                              <TableCell
                                colSpan={8}
                                className="py-12 text-center text-slate-400 font-normal text-[13px]"
                              >
                                <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                No Reopen Policies found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginated.map((p) => {
                              return (
                                <TableRow
                                  key={p.reopen_policy_id}
                                  className="h-[52px] transition-colors hover:bg-slate-50/80 whitespace-nowrap border-b border-slate-100 dark:border-slate-800/60"
                                >
                                  <TableCell className="w-[240px] py-3 pl-4 pr-3 overflow-hidden text-ellipsis whitespace-nowrap align-middle">
                                    <TruncatedText
                                      text={p.policy_name}
                                      maxChars={28}
                                      className="font-semibold text-slate-900 dark:text-slate-100 max-w-full truncate block text-[13px]"
                                    />
                                  </TableCell>
                                  <TableCell className="w-[170px] px-3 py-3 text-slate-600 dark:text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    <TruncatedText
                                      text={(() => {
                                        try {
                                          const cond =
                                            p.applicable_condition as {
                                              category?: string;
                                            };
                                          return cond?.category || "All";
                                        } catch {
                                          return "All";
                                        }
                                      })()}
                                      maxChars={20}
                                      className="text-slate-600 dark:text-slate-300 max-w-full truncate block text-[13px]"
                                    />
                                  </TableCell>
                                  <TableCell className="w-[170px] px-3 py-3 text-slate-600 dark:text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    <TruncatedText
                                      text={(() => {
                                        try {
                                          const cond =
                                            p.applicable_condition as {
                                              subcategory?: string;
                                            };
                                          return cond?.subcategory || "All";
                                        } catch {
                                          return "All";
                                        }
                                      })()}
                                      maxChars={20}
                                      className="text-slate-600 dark:text-slate-400 max-w-full truncate block text-[13px]"
                                    />
                                  </TableCell>
                                  <TableCell className="w-[190px] px-3 py-3 text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    {p.reopen_window_hours
                                      ? `${p.reopen_window_hours} Hours`
                                      : "Unlimited"}
                                  </TableCell>
                                  <TableCell className="w-[160px] px-3 py-3 text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    {p.max_reopen_count}
                                  </TableCell>
                                  <TableCell className="w-[190px] px-3 py-3 text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    {p.max_manual_review_count}
                                  </TableCell>
                                  <TableCell className="w-[110px] px-3 py-3 whitespace-nowrap overflow-hidden text-ellipsis text-[13px] align-middle">
                                    <span
                                      className={`font-medium ${p.status === "ACTIVE" ? "text-emerald-700" : "text-slate-500"}`}
                                    >
                                      {p.status === "ACTIVE"
                                        ? "Active"
                                        : "Inactive"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="w-[90px] py-3 pl-2 pr-4 text-right whitespace-nowrap overflow-hidden align-middle">
                                    <ActionMenu
                                      widthClass="w-36"
                                      items={[
                                        {
                                          label: "Delete Policy",
                                          variant: "danger" as const,
                                          icon: (
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                          ),
                                          onClick: () => onDelete(p),
                                        },
                                      ]}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          {policies.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                itemLabel="Reopen Policies"
              />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
