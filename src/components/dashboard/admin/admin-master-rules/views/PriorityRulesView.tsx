import { CheckCircle2, FileText, Pencil } from "lucide-react";
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
  defaultRule: _defaultRule,
  searchQuery,
  catFilter,
  statusFilter,
  onEdit,
  onToggleStatus,
  onDelete: _onDelete,
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
    <TooltipProvider delay={150}>
      <div className="flex flex-col gap-4">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs flex flex-col overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[1030px]">
              {(() => {
                const colGroup = (
                  <colgroup>
                    <col className="w-[240px]" />
                    <col className="w-[180px]" />
                    <col className="w-[180px]" />
                    <col className="w-[130px]" />
                    <col className="w-[100px]" />
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
                            field="rule_name"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[240px] py-3 pl-4 pr-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis align-middle"
                          >
                            Rule Name
                          </SortableTableHead>
                          <SortableTableHead
                            field="category_name"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[180px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis align-middle"
                          >
                            Category
                          </SortableTableHead>
                          <SortableTableHead
                            field="subcategory_name"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[180px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis align-middle"
                          >
                            Subcategory
                          </SortableTableHead>
                          <SortableTableHead
                            field="priority_level"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[130px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis align-middle"
                          >
                            Priority
                          </SortableTableHead>
                          <SortableTableHead
                            field="rule_order"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[100px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis align-middle"
                          >
                            Order
                          </SortableTableHead>
                          <SortableTableHead
                            field="status"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[110px] px-3 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis align-middle"
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
                                colSpan={7}
                                className="py-12 text-center text-slate-400 font-normal text-[13px]"
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
                                if (
                                  r.conditions &&
                                  typeof r.conditions === "object"
                                ) {
                                  const cond = r.conditions as {
                                    category_name?: string;
                                    subcategory_name?: string;
                                    category?: string;
                                    subcategory?: string;
                                    category_id?: string;
                                    subcategory_id?: string;
                                  };

                                  let resolvedCatName =
                                    cond.category_name || cond.category;
                                  let resolvedSubcatName =
                                    cond.subcategory_name || cond.subcategory;

                                  if (
                                    cond.category_id &&
                                    categories?.length > 0
                                  ) {
                                    const catMatch = categories.find(
                                      (c) => c.category_id === cond.category_id,
                                    );
                                    if (catMatch) {
                                      resolvedCatName = catMatch.category_name;
                                      if (cond.subcategory_id) {
                                        const subMatch =
                                          catMatch.subcategories?.find(
                                            (s: {
                                              subcategory_id: string;
                                              subcategory_name: string;
                                            }) =>
                                              s.subcategory_id ===
                                              cond.subcategory_id,
                                          );
                                        if (subMatch) {
                                          resolvedSubcatName =
                                            subMatch.subcategory_name;
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
                                          s.subcategory_name
                                            .trim()
                                            .toLowerCase() ===
                                          resolvedSubcatName
                                            ?.trim()
                                            .toLowerCase(),
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
                                  className="h-[52px] transition-colors hover:bg-slate-50/80 whitespace-nowrap border-b border-slate-100 dark:border-slate-800/60"
                                >
                                  <TableCell className="w-[240px] py-3 pl-4 pr-3 overflow-hidden text-ellipsis whitespace-nowrap align-middle">
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                      <TruncatedText
                                        text={`${r.rule_name}${isDefault ? " (Default Fallback)" : ""}`}
                                        maxChars={26}
                                        className="font-semibold text-slate-900 dark:text-slate-100 max-w-full truncate block text-[13px]"
                                      />
                                      {(() => {
                                        const cond = r.conditions as {
                                          keywords?: string[];
                                          contains?: string[];
                                        } | null;
                                        const kwList =
                                          cond?.keywords || cond?.contains;
                                        if (
                                          Array.isArray(kwList) &&
                                          kwList.length > 0
                                        ) {
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
                                  <TableCell className="w-[180px] px-3 py-3 text-slate-600 dark:text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    <TruncatedText
                                      text={ruleCat}
                                      maxChars={20}
                                      className="text-slate-600 dark:text-slate-300 max-w-full truncate block text-[13px]"
                                    />
                                  </TableCell>
                                  <TableCell className="w-[180px] px-3 py-3 text-slate-600 dark:text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    <TruncatedText
                                      text={ruleSubcat}
                                      maxChars={20}
                                      className="text-slate-600 dark:text-slate-400 max-w-full truncate block text-[13px]"
                                    />
                                  </TableCell>
                                  <TableCell className="w-[130px] px-3 py-3 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    {r.priority_level}
                                  </TableCell>
                                  <TableCell className="w-[100px] px-3 py-3 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] align-middle">
                                    {isDefault ? "99" : r.rule_order}
                                  </TableCell>
                                  <TableCell className="w-[110px] px-3 py-3 whitespace-nowrap overflow-hidden text-ellipsis text-[13px] align-middle">
                                    <button
                                      type="button"
                                      onClick={() => onToggleStatus(r)}
                                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-semibold cursor-pointer hover:opacity-80 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 ${
                                        r.status === "ACTIVE"
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                          : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                      }`}
                                      title="Click to toggle active/inactive status"
                                    >
                                      {r.status === "ACTIVE"
                                        ? "Active"
                                        : "Inactive"}
                                    </button>
                                  </TableCell>
                                  <TableCell className="w-[90px] py-3 pl-2 pr-4 text-right whitespace-nowrap overflow-hidden align-middle">
                                    <ActionMenu
                                      widthClass="w-36"
                                      items={[
                                        {
                                          label: "Edit Rule",
                                          icon: (
                                            <Pencil className="h-3.5 w-3.5" />
                                          ),
                                          onClick: () => onEdit(r),
                                        },
                                        {
                                          label:
                                            r.status === "ACTIVE"
                                              ? "Deactivate"
                                              : "Activate",
                                          icon: (
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                          ),
                                          onClick: () => onToggleStatus(r),
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
    </TooltipProvider>
  );
}
