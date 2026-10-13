"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  GitBranch,
  GitMerge,
  Pencil,
  Zap,
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTableSort } from "@/hooks/useTableSort";
import type { SerializedRoutingRule } from "@/types/admin/master-rules";
import { RoutingWorkflowModal } from "../modals/RoutingWorkflowModal";
import { parseRoutingRuleMDI } from "../utils/routing-rule-parser";

interface RoutingRulesViewProps {
  rules: SerializedRoutingRule[];
  searchQuery: string;
  catFilter: string;
  deptFilter: string;
  statusFilter: string[];
  onEdit: (rule: SerializedRoutingRule) => void;
  onToggleStatus: (rule: SerializedRoutingRule) => void;
  onDelete: (rule: SerializedRoutingRule) => void;
}

/**
 * Reusable accessible tooltip component for truncated table cells.
 * Shows tooltip on hover and keyboard focus without clipping.
 */
function TruncatedTextTooltip({
  text,
  tooltipText,
  tooltipHeader,
  threshold = 24,
  maxWidthClass = "max-w-[140px]",
  className = "",
  interactive = false,
  onClick,
}: {
  text: string;
  tooltipText?: string;
  tooltipHeader?: string;
  threshold?: number;
  maxWidthClass?: string;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}) {
  const fullText = tooltipText || text;
  const isTruncated = text.length > threshold;

  if (!isTruncated && !tooltipHeader) {
    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          className={`truncate inline-block text-left text-slate-800 dark:text-slate-200 ${maxWidthClass} ${className} ${
            interactive
              ? "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition"
              : ""
          }`}
        >
          {text}
        </button>
      );
    }
    return (
      <span
        className={`truncate inline-block text-slate-800 dark:text-slate-200 ${maxWidthClass} ${className} ${
          interactive
            ? "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition"
            : ""
        }`}
      >
        {text}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        tabIndex={0}
        onClick={onClick}
        className={`truncate inline-block text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-xs ${maxWidthClass} ${className} ${
          interactive
            ? "cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition"
            : "cursor-default"
        }`}
      >
        <span className="truncate block">{text}</span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="max-w-xs z-50 rounded-lg bg-slate-900 dark:bg-slate-800 text-white p-2.5 shadow-xl border border-slate-700/80 text-xs leading-relaxed"
      >
        {tooltipHeader && (
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pb-1 border-b border-slate-700 mb-1">
            {tooltipHeader}
          </div>
        )}
        <div className="font-medium text-slate-100 break-words">{fullText}</div>
      </TooltipContent>
    </Tooltip>
  );
}

export function RoutingRulesView({
  rules,
  searchQuery: externalSearch,
  catFilter: externalCat,
  deptFilter: externalDept,
  statusFilter: externalStatus,
  onEdit,
  onToggleStatus,
  onDelete,
}: RoutingRulesViewProps) {
  const [selectedWorkflowRule, setSelectedWorkflowRule] =
    useState<SerializedRoutingRule | null>(null);

  // Filtering based on external props from AdminMasterRules
  const filtered = useMemo(() => {
    return rules.filter((r) => {
      // 1. Status Filter
      if (externalStatus.length > 0 && !externalStatus.includes(r.status)) {
        return false;
      }

      // 2. Category Filter
      const ruleCat = r.category_name || "All";
      if (externalCat !== "ALL" && ruleCat !== externalCat) return false;

      // 3. Department Filter (check primary lead + all participating departments)
      if (externalDept !== "ALL") {
        const isLead = r.department_name === externalDept;
        const isSupp =
          Array.isArray(r.supporting_departments) &&
          r.supporting_departments.includes(externalDept);
        let isDepInConditions = false;
        if (r.conditions && typeof r.conditions === "object") {
          const condDeps = (
            r.conditions as {
              dependencies?: Array<{ department_name?: string }>;
            }
          ).dependencies;
          if (Array.isArray(condDeps)) {
            isDepInConditions = condDeps.some(
              (d) => d.department_name === externalDept,
            );
          }
        }
        if (!isLead && !isSupp && !isDepInConditions) return false;
      }

      // 4. Search Query
      const effectiveSearch = (externalSearch || "").toLowerCase().trim();
      if (effectiveSearch) {
        const matchName = r.rule_name.toLowerCase().includes(effectiveSearch);
        const matchCat = ruleCat.toLowerCase().includes(effectiveSearch);
        const matchSubcat = (r.subcategory_name || "")
          .toLowerCase()
          .includes(effectiveSearch);
        const matchDept = r.department_name
          .toLowerCase()
          .includes(effectiveSearch);
        const matchSupp =
          Array.isArray(r.supporting_departments) &&
          r.supporting_departments.some((d) =>
            d.toLowerCase().includes(effectiveSearch),
          );

        if (
          !matchName &&
          !matchCat &&
          !matchSubcat &&
          !matchDept &&
          !matchSupp
        ) {
          return false;
        }
      }

      return true;
    });
  }, [rules, externalStatus, externalCat, externalDept, externalSearch]);

  const rulesWithMDI = useMemo(() => {
    return filtered.map((r) => {
      const mdi = parseRoutingRuleMDI(r);
      const participating_depts = mdi.participatingDepartments
        .map((d) => d.department_name)
        .join(", ");
      return {
        ...r,
        mdi,
        participating_depts,
        execution_mode: mdi.executionMode,
        dependencies: mdi.dependencySummary,
        sla_allocation: mdi.slaAllocationSummary,
      };
    });
  }, [filtered]);

  const { sortState, handleSort, sortedItems } = useTableSort(rulesWithMDI, {
    field: "rule_order",
    direction: "asc",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalCount = sortedItems.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  const paginated = sortedItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <TooltipProvider delay={200}>
      <div className="flex flex-col gap-3.5">
        {/* Table Container */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs overflow-x-auto">
          <Table className="w-full text-left text-sm min-w-[1250px]">
            <TableHeader className="bg-slate-50/60 dark:bg-slate-800/60">
              <TableRow className="hover:bg-transparent whitespace-nowrap">
                <SortableTableHead
                  field="rule_name"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-2.5 pl-4 pr-3 min-w-[200px] font-semibold uppercase tracking-wider text-slate-500 text-xs"
                >
                  Rule Name
                </SortableTableHead>
                <SortableTableHead
                  field="category_name"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-2.5 min-w-[130px] max-w-[160px] font-semibold uppercase tracking-wider text-slate-500 text-xs"
                >
                  Category
                </SortableTableHead>
                <SortableTableHead
                  field="subcategory_name"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-2.5 min-w-[130px] max-w-[160px] font-semibold uppercase tracking-wider text-slate-500 text-xs"
                >
                  Subcategory
                </SortableTableHead>
                <SortableTableHead
                  field="department_name"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-2.5 min-w-[140px] font-semibold uppercase tracking-wider text-slate-500 text-xs"
                >
                  Primary Dept
                </SortableTableHead>
                <SortableTableHead
                  field="participating_depts"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-2.5 min-w-[220px] font-semibold uppercase tracking-wider text-slate-500 text-xs"
                >
                  Participating Depts
                </SortableTableHead>
                <SortableTableHead
                  field="execution_mode"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-2.5 min-w-[120px] font-semibold uppercase tracking-wider text-slate-500 text-xs"
                >
                  Mode
                </SortableTableHead>
                <SortableTableHead
                  field="dependencies"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-2.5 min-w-[160px] max-w-[220px] font-semibold uppercase tracking-wider text-slate-500 text-xs"
                >
                  Dependencies
                </SortableTableHead>
                <SortableTableHead
                  field="sla_allocation"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-2.5 min-w-[160px] max-w-[200px] font-semibold uppercase tracking-wider text-slate-500 text-xs"
                >
                  SLA Allocation
                </SortableTableHead>
                <SortableTableHead
                  field="status"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-3 py-2.5 min-w-[90px] font-semibold uppercase tracking-wider text-slate-500 text-xs"
                >
                  Status
                </SortableTableHead>
                <TableHead className="py-2.5 pl-2 pr-4 min-w-[90px] text-right font-semibold uppercase tracking-wider text-slate-500 text-xs">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="font-medium text-slate-700 dark:text-slate-200">
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="py-12 text-center text-slate-400 font-normal"
                  >
                    <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No Routing Rules found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((r) => {
                  const mdi = r.mdi;
                  const isSequential = mdi.executionMode === "SEQUENTIAL";
                  const visibleDepts = mdi.participatingDepartments.slice(0, 2);
                  const remainingCount =
                    mdi.participatingDepartments.length - visibleDepts.length;

                  return (
                    <TableRow
                      key={r.routing_rule_id}
                      className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 whitespace-nowrap"
                    >
                      {/* Rule Name */}
                      <TableCell className="py-2.5 pl-4 pr-3 min-w-[200px]">
                        <div className="flex flex-col">
                          <TruncatedTextTooltip
                            text={r.rule_name}
                            tooltipHeader={`Routing Rule #${r.rule_order}`}
                            threshold={26}
                            maxWidthClass="max-w-[220px]"
                            interactive={true}
                            onClick={() => setSelectedWorkflowRule(r)}
                          />
                          <span className="text-2xs text-slate-400 font-mono mt-0.5">
                            Rule #{r.rule_order}
                          </span>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="px-3 py-2.5 min-w-[130px] max-w-[160px]">
                        <TruncatedTextTooltip
                          text={r.category_name || "All"}
                          tooltipHeader="Grievance Category"
                          threshold={18}
                          maxWidthClass="max-w-[140px]"
                          className="text-slate-600 dark:text-slate-300"
                        />
                      </TableCell>

                      {/* Subcategory */}
                      <TableCell className="px-3 py-2.5 min-w-[130px] max-w-[160px]">
                        <TruncatedTextTooltip
                          text={r.subcategory_name || "—"}
                          tooltipHeader="Subcategory"
                          threshold={18}
                          maxWidthClass="max-w-[140px]"
                          className="text-slate-600 dark:text-slate-300"
                        />
                      </TableCell>

                      {/* Primary Dept */}
                      <TableCell className="px-3 py-2.5 min-w-[140px]">
                        <div className="flex items-center gap-1.5">
                          <TruncatedTextTooltip
                            text={mdi.primaryDepartment}
                            tooltipHeader="Primary Lead Department"
                            threshold={16}
                            maxWidthClass="max-w-[110px]"
                            className="font-semibold text-slate-800 dark:text-slate-200"
                          />
                          <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 shrink-0">
                            Lead
                          </span>
                        </div>
                      </TableCell>

                      {/* Participating Departments */}
                      <TableCell className="px-3 py-2.5 min-w-[220px]">
                        <div className="flex items-center gap-1 flex-wrap max-w-[240px]">
                          {visibleDepts.map((d) => {
                            const badgeStyle =
                              d.involvement_type === "PRIMARY"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
                                : d.involvement_type === "EQUAL"
                                  ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";

                            return (
                              <Tooltip key={d.department_name}>
                                <TooltipTrigger
                                  tabIndex={0}
                                  className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 rounded cursor-default"
                                >
                                  <span
                                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-medium border ${badgeStyle}`}
                                  >
                                    <span className="truncate max-w-[95px] text-slate-800 dark:text-slate-200 font-semibold">
                                      {d.department_name}
                                    </span>
                                    <span className="text-[9px] font-bold uppercase tracking-wider opacity-85">
                                      · {d.involvement_type}
                                    </span>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  sideOffset={6}
                                  className="z-50 rounded-lg bg-slate-900 dark:bg-slate-800 text-white px-2.5 py-1.5 shadow-xl border border-slate-700/80 text-xs"
                                >
                                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                    Participating Department
                                  </div>
                                  <div className="font-semibold text-slate-100 mt-0.5">
                                    {d.department_name}
                                  </div>
                                  <div className="text-2xs text-indigo-300 font-bold uppercase mt-0.5">
                                    Role: {d.involvement_type}
                                  </div>
                                  {d.prerequisites &&
                                    d.prerequisites.length > 0 && (
                                      <div className="text-2xs text-amber-300 mt-1 border-t border-slate-700 pt-1">
                                        Prerequisites:{" "}
                                        {d.prerequisites.join(" + ")}
                                      </div>
                                    )}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}

                          {remainingCount > 0 && (
                            <Tooltip>
                              <TooltipTrigger
                                type="button"
                                tabIndex={0}
                                onClick={() => setSelectedWorkflowRule(r)}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                              >
                                +{remainingCount} more
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                sideOffset={6}
                                className="p-3 space-y-1.5 bg-slate-900 text-white rounded-xl shadow-xl text-xs z-50 min-w-[220px] max-w-sm border border-slate-700/80"
                              >
                                <div className="font-bold border-b border-slate-700 pb-1.5 text-2xs uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                  <span>
                                    All Participating (
                                    {mdi.participatingDepartments.length})
                                  </span>
                                  <span className="text-[10px] text-indigo-300 font-normal">
                                    Click pill for graph
                                  </span>
                                </div>
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                  {mdi.participatingDepartments.map((d) => (
                                    <div
                                      key={d.department_name}
                                      className="flex items-center justify-between gap-3 text-2xs py-0.5 border-b border-slate-800/60 last:border-0"
                                    >
                                      <span className="font-medium text-slate-200">
                                        {d.department_name}
                                      </span>
                                      <span className="font-bold uppercase text-[10px] text-indigo-300">
                                        {d.involvement_type}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>

                      {/* Execution Mode */}
                      <TableCell className="px-3 py-2.5 min-w-[120px] whitespace-nowrap">
                        {isSequential ? (
                          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                            <GitMerge className="h-3 w-3" />
                            SEQUENTIAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800">
                            <Zap className="h-3 w-3" />
                            PARALLEL
                          </span>
                        )}
                      </TableCell>

                      {/* Dependencies */}
                      <TableCell className="px-3 py-2.5 min-w-[160px] max-w-[220px]">
                        {mdi.isDependencyComplex ? (
                          <button
                            type="button"
                            onClick={() => setSelectedWorkflowRule(r)}
                            className="inline-flex items-center gap-1 text-2xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/50 hover:bg-indigo-100 px-2 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 transition cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                            title="View complete multi-stage dependency workflow"
                          >
                            <GitBranch className="h-3 w-3" />
                            <span>View Workflow</span>
                          </button>
                        ) : (
                          <TruncatedTextTooltip
                            text={mdi.dependencySummary}
                            tooltipHeader="Execution Dependencies"
                            threshold={18}
                            maxWidthClass="max-w-[200px]"
                            className={
                              mdi.dependencySummary === "Independent"
                                ? "text-slate-400 dark:text-slate-500 font-mono text-2xs"
                                : "font-mono font-medium text-slate-700 dark:text-slate-300 text-2xs"
                            }
                          />
                        )}
                      </TableCell>

                      {/* SLA Allocation */}
                      <TableCell className="px-3 py-2.5 min-w-[160px] max-w-[200px]">
                        {mdi.hasSlaAllocation ? (
                          <TruncatedTextTooltip
                            text={mdi.slaAllocationSummary}
                            tooltipHeader="Department SLA Allocation"
                            threshold={18}
                            maxWidthClass="max-w-[180px]"
                            className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300"
                          />
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-2xs">
                            Not configured
                          </span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-3 py-2.5 min-w-[90px] whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(r)}
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold cursor-pointer hover:opacity-80 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 ${
                            r.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                          }`}
                          title="Click to toggle active/inactive status"
                        >
                          {r.status === "ACTIVE" ? "Active" : "Inactive"}
                        </button>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-2.5 pl-2 pr-4 min-w-[70px] text-right">
                        <div className="flex items-center justify-end">
                          <ActionMenu
                            widthClass="w-40"
                            items={[
                              {
                                label: "View Workflow",
                                icon: <GitBranch className="h-3.5 w-3.5" />,
                                onClick: () => setSelectedWorkflowRule(r),
                              },
                              {
                                label: "Edit Rule",
                                icon: <Pencil className="h-3.5 w-3.5" />,
                                onClick: () => onEdit(r),
                              },
                              {
                                label:
                                  r.status === "ACTIVE"
                                    ? "Deactivate"
                                    : "Activate",
                                icon: <CheckCircle2 className="h-3.5 w-3.5" />,
                                onClick: () => onToggleStatus(r),
                              },
                              {
                                label: "Delete Rule",
                                variant: "danger" as const,
                                icon: <AlertTriangle className="h-3.5 w-3.5" />,
                                onClick: () => onDelete(r),
                              },
                            ]}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {rules.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel="Routing Rules"
          />
        )}

        {/* View Workflow Modal */}
        <RoutingWorkflowModal
          open={Boolean(selectedWorkflowRule)}
          onClose={() => setSelectedWorkflowRule(null)}
          rule={selectedWorkflowRule}
          onEdit={(rule) => {
            setSelectedWorkflowRule(null);
            onEdit(rule);
          }}
        />
      </div>
    </TooltipProvider>
  );
}
