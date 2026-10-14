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
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs flex flex-col overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[1480px]">
              {/* Static Header Table: no scrollbar next to header */}
              <table className="w-full text-left text-sm table-fixed border-collapse shrink-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60">
                <colgroup>
                  <col className="w-[190px]" />
                  <col className="w-[130px]" />
                  <col className="w-[130px]" />
                  <col className="w-[140px]" />
                  <col className="w-[240px]" />
                  <col className="w-[110px]" />
                  <col className="w-[160px]" />
                  <col className="w-[190px]" />
                  <col className="w-[100px]" />
                  <col className="w-[90px]" />
                </colgroup>
                <TableHeader className="bg-transparent">
                  <TableRow className="hover:bg-transparent whitespace-nowrap">
                    <SortableTableHead
                      field="rule_name"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="py-2.5 pl-4 pr-3 font-semibold uppercase tracking-wider text-slate-500 text-xs"
                    >
                      Rule Name
                    </SortableTableHead>
                    <SortableTableHead
                      field="category_name"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="px-3 py-2.5 font-semibold uppercase tracking-wider text-slate-500 text-xs"
                    >
                      Category
                    </SortableTableHead>
                    <SortableTableHead
                      field="subcategory_name"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="px-3 py-2.5 font-semibold uppercase tracking-wider text-slate-500 text-xs"
                    >
                      Subcategory
                    </SortableTableHead>
                    <SortableTableHead
                      field="department_name"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="px-3 py-2.5 font-semibold uppercase tracking-wider text-slate-500 text-xs"
                    >
                      Primary Dept
                    </SortableTableHead>
                    <SortableTableHead
                      field="participating_depts"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="px-3 py-2.5 font-semibold uppercase tracking-wider text-slate-500 text-xs"
                    >
                      Participating Depts
                    </SortableTableHead>
                    <SortableTableHead
                      field="execution_mode"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="px-3 py-2.5 font-semibold uppercase tracking-wider text-slate-500 text-xs"
                    >
                      Mode
                    </SortableTableHead>
                    <SortableTableHead
                      field="dependencies"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="px-3 py-2.5 font-semibold uppercase tracking-wider text-slate-500 text-xs"
                    >
                      Dependencies
                    </SortableTableHead>
                    <SortableTableHead
                      field="sla_allocation"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="px-3 py-2.5 font-semibold uppercase tracking-wider text-slate-500 text-xs"
                    >
                      SLA Allocation
                    </SortableTableHead>
                    <SortableTableHead
                      field="status"
                      currentSort={sortState}
                      onSort={handleSort}
                      className="px-3 py-2.5 font-semibold uppercase tracking-wider text-slate-500 text-xs"
                    >
                      Status
                    </SortableTableHead>
                    <TableHead className="py-2.5 pl-2 pr-4 text-right font-semibold uppercase tracking-wider text-slate-500 text-xs">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
              </table>

              {/* Scrollable Rows Container (Vertical scroll within rows only) */}
              <div className="max-h-[calc(100vh-340px)] overflow-y-auto overflow-x-hidden custom-scrollbar">
                <table className="w-full text-left text-sm table-fixed border-collapse">
                  <colgroup>
                    <col className="w-[190px]" />
                    <col className="w-[130px]" />
                    <col className="w-[130px]" />
                    <col className="w-[140px]" />
                    <col className="w-[240px]" />
                    <col className="w-[110px]" />
                    <col className="w-[160px]" />
                    <col className="w-[190px]" />
                    <col className="w-[100px]" />
                    <col className="w-[90px]" />
                  </colgroup>
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
                        const primaryDepts =
                          mdi.participatingDepartments.filter(
                            (d) =>
                              d.involvement_type === "PRIMARY" ||
                              d.involvement_type === "EQUAL",
                          );
                        const supportDepts =
                          mdi.participatingDepartments.filter(
                            (d) => d.involvement_type === "SUPPORT",
                          );

                        return (
                          <TableRow
                            key={r.routing_rule_id}
                            className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 whitespace-nowrap"
                          >
                            {/* Rule Name */}
                            <TableCell className="py-2.5 pl-4 pr-3 min-w-[190px]">
                              <div className="flex flex-col">
                                <TruncatedTextTooltip
                                  text={r.rule_name}
                                  tooltipHeader={`Routing Rule #${r.rule_order}`}
                                  threshold={26}
                                  maxWidthClass="max-w-[210px]"
                                  interactive={true}
                                  onClick={() => setSelectedWorkflowRule(r)}
                                />
                                <span className="text-2xs text-slate-400 font-mono mt-0.5">
                                  Rule #{r.rule_order}
                                </span>
                              </div>
                            </TableCell>

                            {/* Category */}
                            <TableCell className="px-3 py-2.5 min-w-[130px] max-w-[150px]">
                              <TruncatedTextTooltip
                                text={r.category_name || "All"}
                                tooltipHeader="Grievance Category"
                                threshold={16}
                                maxWidthClass="max-w-[130px]"
                                className="text-slate-600 dark:text-slate-300"
                              />
                            </TableCell>

                            {/* Subcategory */}
                            <TableCell className="px-3 py-2.5 min-w-[130px] max-w-[150px]">
                              <TruncatedTextTooltip
                                text={r.subcategory_name || "—"}
                                tooltipHeader="Subcategory"
                                threshold={16}
                                maxWidthClass="max-w-[130px]"
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
                                <span className="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                                  Lead
                                </span>
                              </div>
                            </TableCell>

                            {/* Participating Departments: Clean text, separated Primary & Support, no heavy badge colors */}
                            <TableCell className="px-3 py-2.5 min-w-[240px] max-w-[240px] overflow-hidden">
                              <div className="flex flex-col gap-1 text-xs py-0.5">
                                {primaryDepts.length > 0 && (
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
                                      Primary:
                                    </span>
                                    <TruncatedTextTooltip
                                      text={primaryDepts
                                        .map((d) => d.department_name)
                                        .join(", ")}
                                      tooltipHeader="Primary Department(s)"
                                      threshold={20}
                                      maxWidthClass="max-w-[170px]"
                                      className="font-semibold text-slate-800 dark:text-slate-200"
                                    />
                                  </div>
                                )}
                                {supportDepts.length > 0 && (
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0">
                                      Support:
                                    </span>
                                    <TruncatedTextTooltip
                                      text={supportDepts
                                        .map((d) => d.department_name)
                                        .join(", ")}
                                      tooltipHeader="Support Department(s)"
                                      threshold={20}
                                      maxWidthClass="max-w-[170px]"
                                      className="font-normal text-slate-600 dark:text-slate-400"
                                    />
                                  </div>
                                )}
                                {primaryDepts.length === 0 &&
                                  supportDepts.length === 0 && (
                                    <span className="text-slate-400 text-xs italic">
                                      —
                                    </span>
                                  )}
                              </div>
                            </TableCell>

                            {/* Execution Mode */}
                            <TableCell className="px-3 py-2.5 min-w-[110px] whitespace-nowrap">
                              {isSequential ? (
                                <span className="inline-flex items-center gap-1 text-2xs font-semibold text-slate-700 dark:text-slate-300">
                                  <GitMerge className="h-3 w-3 text-amber-600" />
                                  SEQUENTIAL
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-2xs font-semibold text-slate-700 dark:text-slate-300">
                                  <Zap className="h-3 w-3 text-sky-600" />
                                  PARALLEL
                                </span>
                              )}
                            </TableCell>

                            {/* Dependencies */}
                            <TableCell className="px-3 py-2.5 min-w-[160px] max-w-[200px] overflow-hidden">
                              {mdi.isDependencyComplex ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedWorkflowRule(r)}
                                  className="inline-flex items-center gap-1 text-2xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                                  title="View complete multi-stage dependency workflow"
                                >
                                  <GitBranch className="h-3 w-3" />
                                  <span>Workflow</span>
                                </button>
                              ) : (
                                <TruncatedTextTooltip
                                  text={mdi.dependencySummary}
                                  tooltipHeader="Execution Dependencies"
                                  threshold={18}
                                  maxWidthClass="max-w-[155px]"
                                  className={
                                    mdi.dependencySummary === "Independent"
                                      ? "text-slate-400 dark:text-slate-500 font-mono text-2xs"
                                      : "font-mono font-medium text-slate-700 dark:text-slate-300 text-2xs"
                                  }
                                />
                              )}
                            </TableCell>

                            {/* SLA Allocation */}
                            <TableCell className="px-3 py-2.5 min-w-[190px] max-w-[190px] overflow-hidden">
                              {mdi.hasSlaAllocation ? (
                                <TruncatedTextTooltip
                                  text={mdi.slaAllocationSummary}
                                  tooltipHeader="Department SLA Allocation"
                                  threshold={20}
                                  maxWidthClass="max-w-[175px]"
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
                                      icon: (
                                        <GitBranch className="h-3.5 w-3.5" />
                                      ),
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
                                      icon: (
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                      ),
                                      onClick: () => onToggleStatus(r),
                                    },
                                    {
                                      label: "Delete Rule",
                                      variant: "danger" as const,
                                      icon: (
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                      ),
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
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
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
                itemLabel="Routing Rules"
              />
            </div>
          )}
        </div>

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
