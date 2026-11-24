import { CheckCircle2, FileText, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionMenu } from "@/components/ui/action-menu";
import type {
  FilterMode,
  SearchCondition,
} from "@/components/ui/advanced-table-search";
import { Pagination } from "@/components/ui/pagination";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
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
  searchConditions?: SearchCondition[];
  filterMode?: FilterMode;
  onEdit: (policy: SerializedReopenPolicy) => void;
  onToggleStatus: (policy: SerializedReopenPolicy) => void;
  onDelete: (policy: SerializedReopenPolicy) => void;
}

export function ReopenPoliciesView({
  policies,
  searchQuery,
  statusFilter,
  searchConditions,
  filterMode = "AND",
  onEdit,
  onToggleStatus,
  onDelete: _onDelete,
}: ReopenPoliciesViewProps) {
  const policiesWithTaxonomy = useMemo(() => {
    return policies.map((p) => {
      let category = "All";
      let subcategory = "All";
      let resolutionInactivity = 7;
      let additionalInfoInactivity = 7;
      let maxRejections = 3;
      try {
        const cond = p.applicable_condition as {
          category?: string;
          subcategory?: string;
          resolution_inactivity_days?: number | string;
          additional_info_days?: number | string;
          max_rejection_count?: number | string;
        };
        if (cond?.category) category = cond.category;
        if (cond?.subcategory) subcategory = cond.subcategory;
        if (cond?.resolution_inactivity_days)
          resolutionInactivity = Number(cond.resolution_inactivity_days);
        if (cond?.additional_info_days)
          additionalInfoInactivity = Number(cond.additional_info_days);
        if (cond?.max_rejection_count)
          maxRejections = Number(cond.max_rejection_count);
      } catch (_e) {}
      return {
        ...p,
        category,
        subcategory,
        resolutionInactivity,
        additionalInfoInactivity,
        maxRejections,
      };
    });
  }, [policies]);

  const filtered = useMemo(() => {
    return policiesWithTaxonomy.filter((item) => {
      // 1. Status Filter
      if (statusFilter.length > 0 && !statusFilter.includes(item.status)) {
        return false;
      }

      // 2. Structured Conditions Filter
      if (searchConditions && searchConditions.length > 0) {
        const evalCond = (c: SearchCondition): boolean => {
          const field = c.field;
          const op = c.operator || "equals";
          const rawVal = c.value;
          const valArray = Array.isArray(rawVal) ? rawVal : [rawVal];
          const valStr = String(rawVal ?? "")
            .trim()
            .toLowerCase();
          const valNum = Number(Array.isArray(rawVal) ? rawVal[0] : rawVal);

          if (field === "status") {
            if (op === "not_equals" || op === "is_not_in") {
              return !valArray.some(
                (v) => String(v).toUpperCase() === item.status.toUpperCase(),
              );
            }
            return valArray.some(
              (v) => String(v).toUpperCase() === item.status.toUpperCase(),
            );
          }

          if (
            field === "policy_name" ||
            field === "category" ||
            field === "subcategory" ||
            field === "description"
          ) {
            const desc =
              (item.applicable_condition as { description?: string })
                ?.description || "";
            const target = (
              field === "policy_name"
                ? item.policy_name
                : field === "category"
                  ? item.category
                  : field === "subcategory"
                    ? item.subcategory
                    : desc
            ).toLowerCase();

            switch (op) {
              case "equals":
              case "is_in":
                return valArray.some(
                  (v) => target === String(v).trim().toLowerCase(),
                );
              case "not_equals":
              case "is_not_in":
                return !valArray.some(
                  (v) => target === String(v).trim().toLowerCase(),
                );
              case "contains":
                return valArray.some((v) =>
                  target.includes(String(v).trim().toLowerCase()),
                );
              case "does_not_contain":
                return !valArray.some((v) =>
                  target.includes(String(v).trim().toLowerCase()),
                );
              case "starts_with":
                return valArray.some((v) =>
                  target.startsWith(String(v).trim().toLowerCase()),
                );
              case "ends_with":
                return valArray.some((v) =>
                  target.endsWith(String(v).trim().toLowerCase()),
                );
              case "is_empty":
                return target === "" || target === "all" || target === "—";
              case "is_not_empty":
                return target !== "" && target !== "all" && target !== "—";
              default:
                return valArray.some((v) =>
                  target.includes(String(v).trim().toLowerCase()),
                );
            }
          }

          if (field === "reopen_window_hours") {
            const rawHours = item.reopen_window_hours ?? 336;
            const days = rawHours / 24;
            const hours = rawHours;

            if (Number.isNaN(valNum)) return true;

            const checkOp = (v: number) => {
              switch (op) {
                case "equals":
                  return v === valNum;
                case "not_equals":
                  return v !== valNum;
                case "greater_than":
                  return v > valNum;
                case "greater_than_or_equal":
                  return v >= valNum;
                case "less_than":
                  return v < valNum;
                case "less_than_or_equal":
                  return v <= valNum;
                default:
                  return v === valNum;
              }
            };

            // Allow matching either day count (1, 14) or raw hour count (24, 336)
            if (op === "equals") {
              return checkOp(days) || checkOp(hours);
            }
            if (op === "not_equals") {
              return !checkOp(days) && !checkOp(hours);
            }
            if (valNum <= 30) {
              return checkOp(days) || checkOp(hours);
            }
            return checkOp(hours);
          }

          if (
            field === "resolution_inactivity" ||
            field === "additional_info_inactivity" ||
            field === "max_reopens" ||
            field === "max_reviews"
          ) {
            const num =
              field === "resolution_inactivity"
                ? item.resolutionInactivity
                : field === "additional_info_inactivity"
                  ? item.additionalInfoInactivity
                  : field === "max_reopens"
                    ? item.max_reopen_count
                    : item.max_manual_review_count;

            if (Number.isNaN(valNum)) return true;

            switch (op) {
              case "equals":
                return num === valNum;
              case "not_equals":
                return num !== valNum;
              case "greater_than":
                return num > valNum;
              case "greater_than_or_equal":
                return num >= valNum;
              case "less_than":
                return num < valNum;
              case "less_than_or_equal":
                return num <= valNum;
              default:
                return num === valNum;
            }
          }

          // Fallback generic search across all text properties
          const condDesc =
            (item.applicable_condition as { description?: string })
              ?.description || "";
          return (
            item.policy_name.toLowerCase().includes(valStr) ||
            item.category.toLowerCase().includes(valStr) ||
            item.subcategory.toLowerCase().includes(valStr) ||
            condDesc.toLowerCase().includes(valStr)
          );
        };

        if (filterMode === "OR") {
          const anyMatch = searchConditions.some(evalCond);
          if (!anyMatch) return false;
        } else if (filterMode === "NOT") {
          const noneMatch = !searchConditions.some(evalCond);
          if (!noneMatch) return false;
        } else {
          // AND mode
          const allMatch = searchConditions.every(evalCond);
          if (!allMatch) return false;
        }
      }

      // 3. Fallback generic text searchQuery
      if (
        (!searchConditions || searchConditions.length === 0) &&
        searchQuery.trim()
      ) {
        const q = searchQuery.toLowerCase().trim();
        const rawHours = item.reopen_window_hours ?? 336;
        const days = rawHours / 24;
        const desc =
          (item.applicable_condition as { description?: string })
            ?.description || "";
        const matchName = item.policy_name.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchSub = item.subcategory.toLowerCase().includes(q);
        const matchDesc = desc.toLowerCase().includes(q);
        const matchDays =
          days.toString() === q ||
          `${days} day`.toLowerCase().includes(q) ||
          `${days} days`.toLowerCase().includes(q);
        const matchHours =
          rawHours.toString() === q ||
          `${rawHours} hrs`.toLowerCase().includes(q) ||
          `${rawHours} hours`.toLowerCase().includes(q);
        const matchReopens = item.max_reopen_count.toString() === q;
        const matchReviews = item.max_manual_review_count.toString() === q;
        const matchRes = item.resolutionInactivity.toString() === q;
        const matchInfo = item.additionalInfoInactivity.toString() === q;
        const matchStatus = item.status.toLowerCase().includes(q);

        if (
          !matchName &&
          !matchCat &&
          !matchSub &&
          !matchDesc &&
          !matchDays &&
          !matchHours &&
          !matchReopens &&
          !matchReviews &&
          !matchRes &&
          !matchInfo &&
          !matchStatus
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    policiesWithTaxonomy,
    statusFilter,
    searchConditions,
    filterMode,
    searchQuery,
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { sortState, handleSort, sortedItems } = useTableSort(filtered, {
    field: "policy_name",
    direction: "asc",
  });

  const totalCount = sortedItems.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  const paginated = sortedItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <TooltipProvider delay={150}>
      <div className="flex-1 min-h-0 flex flex-col h-full">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
          <div className="overflow-x-auto flex-1 min-h-0 flex flex-col custom-scrollbar">
            <div className="min-w-[1300px] flex-1 min-h-0 flex flex-col">
              {(() => {
                const colGroup = (
                  <colgroup>
                    <col className="w-[230px]" />
                    <col className="w-[140px]" />
                    <col className="w-[140px]" />
                    <col className="w-[140px]" />
                    <col className="w-[160px]" />
                    <col className="w-[160px]" />
                    <col className="w-[140px]" />
                    <col className="w-[100px]" />
                    <col className="w-[90px]" />
                  </colgroup>
                );

                return (
                  <>
                    {/* Static Header Table */}
                    <table className="w-full text-left text-[12px] table-fixed border-collapse shrink-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                      {colGroup}
                      <TableHeader className="bg-transparent">
                        <TableRow className="hover:bg-transparent whitespace-nowrap">
                          <SortableTableHead
                            field="policy_name"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[230px] py-3 pl-4 pr-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Policy Name
                          </SortableTableHead>
                          <SortableTableHead
                            field="category"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[140px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Category
                          </SortableTableHead>
                          <SortableTableHead
                            field="subcategory"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[140px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Subcategory
                          </SortableTableHead>
                          <SortableTableHead
                            field="reopen_window_hours"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[140px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Reopen Window
                          </SortableTableHead>
                          <SortableTableHead
                            field="resolutionInactivity"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[160px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                            title="Auto-close if employee does not confirm resolution"
                          >
                            Res. Auto-Close
                          </SortableTableHead>
                          <SortableTableHead
                            field="additionalInfoInactivity"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[160px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                            title="Auto-close if employee does not provide requested information"
                          >
                            Info Auto-Close
                          </SortableTableHead>
                          <SortableTableHead
                            field="max_reopen_count"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[140px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Max Cycles
                          </SortableTableHead>
                          <SortableTableHead
                            field="status"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[100px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap align-middle"
                          >
                            Status
                          </SortableTableHead>
                          <TableHead className="w-[90px] py-3 pl-2 pr-4 text-right text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden align-middle">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                    </table>

                    {/* Scrollable Rows Container */}
                    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
                      <table className="w-full text-left text-[13px] table-fixed border-collapse">
                        {colGroup}
                        <TableBody className="font-normal text-slate-700">
                          {filtered.length === 0 ? (
                            <TableRow className="h-[52px]">
                              <TableCell
                                colSpan={9}
                                className="py-12 text-center text-slate-400 font-normal text-[13px]"
                              >
                                <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                No Lifecycle & Closure Policies found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginated.map((p) => {
                              const windowDisplay = p.reopen_window_hours
                                ? p.reopen_window_hours % 24 === 0
                                  ? `${p.reopen_window_hours / 24} Days`
                                  : `${p.reopen_window_hours} hrs`
                                : "14 Days";

                              return (
                                <TableRow
                                  key={p.reopen_policy_id}
                                  className="h-[52px] transition-colors hover:bg-slate-50/80 whitespace-nowrap border-b border-slate-100 dark:border-slate-800/60"
                                >
                                  <TableCell className="w-[230px] py-3 pl-4 pr-3 overflow-hidden text-ellipsis whitespace-nowrap align-middle">
                                    <TruncatedText
                                      text={p.policy_name}
                                      maxChars={26}
                                      className="font-semibold text-slate-900 dark:text-slate-100 max-w-full truncate block text-[13px]"
                                    />
                                  </TableCell>
                                  <TableCell className="w-[140px] px-3 py-3 text-slate-600 dark:text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    <TruncatedText
                                      text={p.category}
                                      maxChars={18}
                                      className="text-slate-600 dark:text-slate-300 max-w-full truncate block text-[13px]"
                                    />
                                  </TableCell>
                                  <TableCell className="w-[140px] px-3 py-3 text-slate-600 dark:text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    <TruncatedText
                                      text={p.subcategory}
                                      maxChars={18}
                                      className="text-slate-600 dark:text-slate-400 max-w-full truncate block text-[13px]"
                                    />
                                  </TableCell>
                                  <TableCell className="w-[140px] px-3 py-3 text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle font-medium">
                                    {windowDisplay}
                                  </TableCell>
                                  <TableCell className="w-[160px] px-3 py-3 text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-800">
                                      {p.resolutionInactivity} Days
                                    </span>
                                  </TableCell>
                                  <TableCell className="w-[160px] px-3 py-3 text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800">
                                      {p.additionalInfoInactivity} Days
                                    </span>
                                  </TableCell>
                                  <TableCell className="w-[140px] px-3 py-3 text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    <span className="text-slate-800 dark:text-slate-200 font-semibold">
                                      {p.max_reopen_count}
                                    </span>
                                    <span className="text-slate-400 text-xs">
                                      {" "}
                                      cyc (rej: {p.maxRejections})
                                    </span>
                                  </TableCell>
                                  <TableCell className="w-[100px] px-3 py-3 whitespace-nowrap overflow-hidden text-ellipsis text-[13px] align-middle">
                                    <button
                                      type="button"
                                      onClick={() => onToggleStatus(p)}
                                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-semibold cursor-pointer hover:opacity-80 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 ${
                                        p.status === "ACTIVE"
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                          : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                      }`}
                                      title="Click to toggle active/inactive status"
                                    >
                                      {p.status === "ACTIVE"
                                        ? "Active"
                                        : "Inactive"}
                                    </button>
                                  </TableCell>
                                  <TableCell className="w-[90px] py-3 pl-2 pr-4 text-right whitespace-nowrap overflow-hidden align-middle">
                                    <ActionMenu
                                      widthClass="w-36"
                                      items={[
                                        {
                                          label: "Edit Policy",
                                          icon: (
                                            <Pencil className="h-3.5 w-3.5" />
                                          ),
                                          onClick: () => onEdit(p),
                                        },
                                        {
                                          label:
                                            p.status === "ACTIVE"
                                              ? "Deactivate"
                                              : "Activate",
                                          icon: (
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                          ),
                                          onClick: () => onToggleStatus(p),
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
                itemLabel="Lifecycle Policies"
              />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
