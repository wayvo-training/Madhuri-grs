import { AlertTriangle, FileText, Pencil } from "lucide-react";
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
import { TruncatedText } from "@/components/ui/truncated-text";
import { useTableSort } from "@/hooks/useTableSort";
import type {
  CategoryOption as RuleCategoryOption,
  SerializedPriorityRule,
} from "@/types/admin/master-rules";

interface PriorityRulesViewProps {
  rules: SerializedPriorityRule[];
  categories: RuleCategoryOption[];
  defaultRule?: SerializedPriorityRule | null;
  searchQuery: string;
  catFilter: string;
  statusFilter: string[];
  onEdit: (rule: SerializedPriorityRule) => void;
  onToggleStatus: (rule: SerializedPriorityRule) => void;
  onDelete: (rule: SerializedPriorityRule) => void;
}

function extractPriorityRuleTaxonomy(
  rule: SerializedPriorityRule,
  categories: RuleCategoryOption[],
) {
  let ruleCat = "All";
  let ruleSubcat = "—";
  try {
    if (rule.conditions && typeof rule.conditions === "object") {
      const cond = rule.conditions as {
        category_name?: string;
        subcategory_name?: string;
        category?: string;
        subcategory?: string;
        category_id?: string;
        subcategory_id?: string;
      };

      let resolvedCatName = cond.category_name || cond.category;
      let resolvedSubcatName = cond.subcategory_name || cond.subcategory;

      if (cond.category_id && categories?.length > 0) {
        const catMatch = categories.find(
          (c) => c.category_id === cond.category_id,
        );
        if (catMatch) {
          resolvedCatName = catMatch.category_name;
          if (cond.subcategory_id) {
            const subMatch = catMatch.subcategories?.find(
              (s: { subcategory_id: string; subcategory_name: string }) =>
                s.subcategory_id === cond.subcategory_id,
            );
            if (subMatch) {
              resolvedSubcatName = subMatch.subcategory_name;
            }
          }
        }
      } else if (
        resolvedSubcatName &&
        !resolvedCatName &&
        categories?.length > 0
      ) {
        // Reverse lookup: if we have subcategory name but no category name, find the parent
        for (const c of categories) {
          const subMatch = c.subcategories?.find(
            (s: { subcategory_id: string; subcategory_name: string }) =>
              s.subcategory_name.trim().toLowerCase() ===
              resolvedSubcatName?.trim().toLowerCase(),
          );
          if (subMatch) {
            resolvedCatName = c.category_name;
            break;
          }
        }
      }

      ruleCat = resolvedCatName || "All";
      ruleSubcat = resolvedSubcatName || "—";
    }
  } catch (_e) {}

  return { ruleCat, ruleSubcat };
}

export function PriorityRulesView({
  rules,
  categories,
  defaultRule,
  searchQuery,
  catFilter,
  statusFilter,
  onEdit,
  onToggleStatus,
  onDelete,
}: PriorityRulesViewProps) {
  const filtered = rules.filter((r) => {
    if (statusFilter.length > 0 && !statusFilter.includes(r.status))
      return false;

    const { ruleCat, ruleSubcat } = extractPriorityRuleTaxonomy(r, categories);

    if (catFilter !== "ALL" && ruleCat !== catFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = r.rule_name.toLowerCase().includes(q);
      const matchCat = ruleCat.toLowerCase().includes(q);
      const matchSub = ruleSubcat.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchSub) return false;
    }
    return true;
  });

  const rulesWithTaxonomy = useMemo(() => {
    return filtered.map((r) => {
      const { ruleCat, ruleSubcat } = extractPriorityRuleTaxonomy(
        r,
        categories,
      );
      return {
        ...r,
        category_name: ruleCat,
        subcategory_name: ruleSubcat,
      };
    });
  }, [filtered, categories]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { sortState, handleSort, sortedItems } = useTableSort(
    rulesWithTaxonomy,
    {
      field: "rule_order",
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
    <div className="flex flex-col gap-4">
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs flex flex-col overflow-hidden">
        {/* Static Header Table: no scrollbar next to header */}
        <table className="w-full text-left text-sm table-fixed border-collapse shrink-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[14%]" />
            <col className="w-[9%]" />
            <col className="w-[10%]" />
            <col className="w-[9%]" />
          </colgroup>
          <TableHeader className="bg-transparent">
            <TableRow className="hover:bg-transparent whitespace-nowrap">
              <SortableTableHead
                field="rule_name"
                currentSort={sortState}
                onSort={handleSort}
                className="py-2.5 pl-4 pr-2 font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Rule Name
              </SortableTableHead>
              <SortableTableHead
                field="category_name"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Category
              </SortableTableHead>
              <SortableTableHead
                field="subcategory_name"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
              >
                Subcategory
              </SortableTableHead>
              <SortableTableHead
                field="priority_level"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
              >
                Priority
              </SortableTableHead>
              <SortableTableHead
                field="rule_order"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
              >
                Order
              </SortableTableHead>
              <SortableTableHead
                field="status"
                currentSort={sortState}
                onSort={handleSort}
                className="px-2 py-2.5 font-semibold uppercase tracking-wider text-slate-500"
              >
                Status
              </SortableTableHead>
              <TableHead className="py-2.5 pl-2 pr-4 text-right font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
        </table>

        {/* Scrollable Rows Container (Vertical scroll within rows only) */}
        <div className="max-h-[calc(100vh-340px)] overflow-y-auto overflow-x-hidden custom-scrollbar">
          <table className="w-full text-left text-sm table-fixed border-collapse">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[18%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
              <col className="w-[9%]" />
            </colgroup>
            <TableBody className="font-medium text-slate-700">
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-slate-400 font-normal"
                  >
                    <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No Priority Rules found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((r) => {
                  let ruleCat = "All";
                  let ruleSubcat = "—";
                  try {
                    if (r.conditions && typeof r.conditions === "object") {
                      const cond = r.conditions as {
                        category_name?: string;
                        subcategory_name?: string;
                        category?: string;
                        subcategory?: string;
                        category_id?: string;
                        subcategory_id?: string;
                      };

                      let resolvedCatName = cond.category_name || cond.category;
                      let resolvedSubcatName =
                        cond.subcategory_name || cond.subcategory;

                      if (cond.category_id && categories?.length > 0) {
                        const catMatch = categories.find(
                          (c) => c.category_id === cond.category_id,
                        );
                        if (catMatch) {
                          resolvedCatName = catMatch.category_name;
                          if (cond.subcategory_id) {
                            const subMatch = catMatch.subcategories?.find(
                              (s: {
                                subcategory_id: string;
                                subcategory_name: string;
                              }) => s.subcategory_id === cond.subcategory_id,
                            );
                            if (subMatch) {
                              resolvedSubcatName = subMatch.subcategory_name;
                            }
                          }
                        }
                      } else if (
                        resolvedSubcatName &&
                        !resolvedCatName &&
                        categories?.length > 0
                      ) {
                        for (const c of categories) {
                          const subMatch = c.subcategories?.find(
                            (s: {
                              subcategory_id: string;
                              subcategory_name: string;
                            }) =>
                              s.subcategory_name.trim().toLowerCase() ===
                              resolvedSubcatName?.trim().toLowerCase(),
                          );
                          if (subMatch) {
                            resolvedCatName = c.category_name;
                            break;
                          }
                        }
                      }

                      ruleCat = resolvedCatName || "All";
                      ruleSubcat = resolvedSubcatName || "—";
                    }
                  } catch (_e) {}

                  const isDefault = r.is_default;

                  return (
                    <TableRow
                      key={r.priority_rule_id}
                      className="transition-colors hover:bg-slate-50/80 whitespace-nowrap"
                    >
                      <TableCell className="py-2.5 pl-4 pr-2 overflow-hidden max-w-full">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <TruncatedText
                            text={`${r.rule_name}${isDefault ? " (Default Fallback)" : ""}`}
                            maxChars={26}
                            className="font-semibold text-slate-900 dark:text-slate-100 max-w-full truncate block"
                          />
                          {(() => {
                            const cond = r.conditions as {
                              keywords?: string[];
                              contains?: string[];
                            } | null;
                            const kwList = cond?.keywords || cond?.contains;
                            if (Array.isArray(kwList) && kwList.length > 0) {
                              return (
                                <TruncatedText
                                  text={`Keywords: ${kwList.join(", ")}`}
                                  maxChars={28}
                                  className="text-[11px] text-slate-400 max-w-full truncate block"
                                />
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-2.5 text-slate-600 dark:text-slate-300 overflow-hidden">
                        <TruncatedText
                          text={ruleCat}
                          maxChars={20}
                          className="text-slate-600 dark:text-slate-300 max-w-full truncate block"
                        />
                      </TableCell>
                      <TableCell className="px-2 py-2.5 text-slate-600 dark:text-slate-400 overflow-hidden">
                        <TruncatedText
                          text={ruleSubcat}
                          maxChars={20}
                          className="text-slate-600 dark:text-slate-400 max-w-full truncate block"
                        />
                      </TableCell>
                      <TableCell className="px-2 py-2.5">
                        {r.priority_level}
                      </TableCell>
                      <TableCell className="px-2 py-2.5">
                        {isDefault ? "99" : r.rule_order}
                      </TableCell>
                      <TableCell className="px-2 py-2.5 whitespace-nowrap">
                        <span
                          className={`font-medium ${r.status === "ACTIVE" ? "text-emerald-700" : "text-slate-500"}`}
                        >
                          {r.status === "ACTIVE" ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 pl-2 pr-4 text-right">
                        <ActionMenu
                          widthClass="w-36"
                          items={[
                            {
                              label: "Edit Rule",
                              icon: <Pencil className="h-3.5 w-3.5" />,
                              onClick: () => onEdit(r),
                            },
                            {
                              label: "Delete Rule",
                              variant: "danger" as const,
                              icon: <AlertTriangle className="h-3.5 w-3.5" />,
                              onClick: () => onDelete(r),
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
        {rules.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
              itemLabel="Priority Rules"
            />
          </div>
        )}
      </div>
    </div>
  );
}
