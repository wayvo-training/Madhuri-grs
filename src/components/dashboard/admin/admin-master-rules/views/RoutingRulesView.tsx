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
  onDelete: _onDelete,
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
            <div className="min-w-[1650px]">
              {/* Common Column Definitions */}
              {(() => {
                const colGroup = (
                  <colgroup>
                    <col className="w-[220px]" />
                    <col className="w-[180px]" />
                    <col className="w-[180px]" />
                    <col className="w-[170px]" />
                    <col className="w-[220px]" />
                    <col className="w-[130px]" />
                    <col className="w-[170px]" />
                    <col className="w-[180px]" />
                    <col className="w-[110px]" />
                    <col className="w-[90px]" />
                  </colgroup>
                );

                return (
                  <>
                    {/* Static Header Table: no scrollbar next to header */}
                    <table className="w-full text-left text-[12px] table-fixed border-collapse shrink-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60">
                      {colGroup}
                      <TableHeader className="bg-transparent">
                        <TableRow className="hover:bg-transparent whitespace-nowrap">
                          <SortableTableHead
                            field="rule_name"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[220px] py-3 pl-4 pr-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis align-middle"
                          >
                            Rule Name
                          </SortableTableHead>
                          <SortableTableHead
                            field="category_name"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[180px] px-3.5 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis align-middle"
                          >
                            Category
                          </SortableTableHead>
                          <SortableTableHead
                            field="subcategory_name"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[180px] px-3.5 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis align-middle"
                          >
                            Subcategory
                          </SortableTableHead>
                          <SortableTableHead
                            field="department_name"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[170px] px-3.5 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis align-middle"
                          >
                            Primary Dept
                          </SortableTableHead>
                          <SortableTableHead
                            field="participating_depts"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[220px] px-3.5 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis align-middle"
                          >
                            Participating Depts
                          </SortableTableHead>
                          <SortableTableHead
                            field="execution_mode"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[130px] px-3.5 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis align-middle"
                          >
                            Mode
                          </SortableTableHead>
                          <SortableTableHead
                            field="dependencies"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[170px] px-3.5 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis align-middle"
                          >
                            Dependencies
                          </SortableTableHead>
                          <SortableTableHead
                            field="sla_allocation"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[180px] px-3.5 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis align-middle"
                          >
                            SLA Allocation
                          </SortableTableHead>
                          <SortableTableHead
                            field="status"
                            currentSort={sortState}
                            onSort={handleSort}
                            className="w-[110px] px-3.5 py-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis align-middle"
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
                        <TableBody className="font-normal text-slate-700 dark:text-slate-200">
                          {filtered.length === 0 ? (
                            <TableRow className="h-[56px]">
                              <TableCell
                                colSpan={10}
                                className="py-12 text-center text-slate-400 font-normal text-[13px]"
                              >
                                <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                No Routing Rules found matching your filters.
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginated.map((r) => {
                              const mdi = r.mdi;
                              const isSequential =
                                mdi.executionMode === "SEQUENTIAL";
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
                                  className="h-[56px] transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 whitespace-nowrap border-b border-slate-100 dark:border-slate-800/60"
                                >
                                  {/* Rule Name */}
                                  <TableCell className="w-[220px] py-3 pl-4 pr-3 min-w-[220px] max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap align-middle">
                                    <div className="flex flex-col min-w-0">
                                      <TruncatedTextTooltip
                                        text={r.rule_name}
                                        tooltipHeader={`Routing Rule #${r.rule_order}`}
                                        threshold={28}
                                        maxWidthClass="max-w-[210px] w-full block"
                                        interactive={true}
                                        className="text-[13px] font-semibold text-slate-900 dark:text-slate-100"
                                        onClick={() =>
                                          setSelectedWorkflowRule(r)
                                        }
                                      />
                                      <span className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                                        Rule #{r.rule_order}
                                      </span>
                                    </div>
                                  </TableCell>

                                  {/* Category */}
                                  <TableCell className="w-[180px] px-3.5 py-3 min-w-[180px] max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap align-middle">
                                    <TruncatedTextTooltip
                                      text={r.category_name || "All"}
                                      tooltipHeader="Grievance Category"
                                      threshold={24}
                                      maxWidthClass="max-w-[170px] w-full block"
                                      className="text-[13px] text-slate-700 dark:text-slate-300 font-normal"
                                    />
                                  </TableCell>

                                  {/* Subcategory */}
                                  <TableCell className="w-[180px] px-3.5 py-3 min-w-[180px] max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap align-middle">
                                    {r.subcategory_name &&
                                    r.subcategory_name !==
                                      "All Subcategories" ? (
                                      <TruncatedTextTooltip
                                        text={r.subcategory_name}
                                        tooltipHeader="Subcategory"
                                        threshold={24}
                                        maxWidthClass="max-w-[170px] w-full block"
                                        className="text-[13px] text-slate-700 dark:text-slate-300 font-normal"
                                      />
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                        All Subcategories
                                      </span>
                                    )}
                                  </TableCell>

                                  {/* Primary Dept */}
                                  <TableCell className="w-[170px] px-3.5 py-3 min-w-[170px] max-w-[170px] overflow-hidden text-ellipsis whitespace-nowrap align-middle">
                                    <div className="flex items-center gap-1.5 min-w-0 max-w-full overflow-hidden">
                                      <TruncatedTextTooltip
                                        text={mdi.primaryDepartment}
                                        tooltipHeader="Primary Lead Department"
                                        threshold={18}
                                        maxWidthClass="max-w-[115px] truncate block min-w-0 flex-1"
                                        className="font-medium text-[13px] text-slate-900 dark:text-slate-100"
                                      />
                                      <span className="inline-flex shrink-0 items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                        Lead
                                      </span>
                                    </div>
                                  </TableCell>

                                  {/* Participating Departments */}
                                  <TableCell className="w-[220px] px-3.5 py-3 min-w-[220px] max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap align-middle">
                                    <div className="flex flex-col gap-1 text-[12px] py-0.5 min-w-0">
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
                                            threshold={22}
                                            maxWidthClass="max-w-[150px] truncate block min-w-0 flex-1"
                                            className="font-medium text-slate-800 dark:text-slate-200 text-[12px]"
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
                                            threshold={22}
                                            maxWidthClass="max-w-[150px] truncate block min-w-0 flex-1"
                                            className="font-normal text-slate-600 dark:text-slate-400 text-[12px]"
                                          />
                                        </div>
                                      )}
                                      {primaryDepts.length === 0 &&
                                        supportDepts.length === 0 && (
                                          <span className="text-slate-400 text-[12px] italic">
                                            —
                                          </span>
                                        )}
                                    </div>
                                  </TableCell>

                                  {/* Execution Mode */}
                                  <TableCell className="w-[130px] px-3.5 py-3 min-w-[130px] max-w-[130px] whitespace-nowrap overflow-hidden text-ellipsis align-middle">
                                    {isSequential ? (
                                      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                                        <GitMerge className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                                        SEQUENTIAL
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                                        <Zap className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                                        PARALLEL
                                      </span>
                                    )}
                                  </TableCell>

                                  {/* Dependencies */}
                                  <TableCell className="w-[170px] px-3.5 py-3 min-w-[170px] max-w-[170px] overflow-hidden text-ellipsis whitespace-nowrap align-middle">
                                    {mdi.isDependencyComplex ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedWorkflowRule(r)
                                        }
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                                        title="View complete multi-stage dependency workflow"
                                      >
                                        <GitBranch className="h-3 w-3" />
                                        <span>Workflow</span>
                                      </button>
                                    ) : (
                                      <TruncatedTextTooltip
                                        text={mdi.dependencySummary}
                                        tooltipHeader="Execution Dependencies"
                                        threshold={22}
                                        maxWidthClass="max-w-[160px] truncate block"
                                        className={
                                          mdi.dependencySummary ===
                                          "Independent"
                                            ? "text-slate-400 dark:text-slate-500 font-mono text-[12px]"
                                            : "font-mono font-medium text-slate-700 dark:text-slate-300 text-[12px]"
                                        }
                                      />
                                    )}
                                  </TableCell>

                                  {/* SLA Allocation */}
                                  <TableCell className="w-[180px] px-3.5 py-3 min-w-[180px] max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap align-middle">
                                    {mdi.hasSlaAllocation ? (
                                      <TruncatedTextTooltip
                                        text={mdi.slaAllocationSummary}
                                        tooltipHeader="Department SLA Allocation"
                                        threshold={22}
                                        maxWidthClass="max-w-[170px] truncate block"
                                        className="text-[12px] font-mono font-medium text-slate-700 dark:text-slate-300"
                                      />
                                    ) : (
                                      <span className="text-slate-400 dark:text-slate-500 italic text-[12px]">
                                        Not configured
                                      </span>
                                    )}
                                  </TableCell>

                                  {/* Status */}
                                  <TableCell className="w-[110px] px-3.5 py-3 min-w-[110px] max-w-[110px] whitespace-nowrap overflow-hidden text-ellipsis align-middle">
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

                                  {/* Actions */}
                                  <TableCell className="w-[90px] py-3 pl-2 pr-4 min-w-[90px] max-w-[90px] text-right whitespace-nowrap overflow-hidden align-middle">
                                    <div className="flex items-center justify-end">
                                      <ActionMenu
                                        widthClass="w-40"
                                        items={[
                                          {
                                            label: "View Workflow",
                                            icon: (
                                              <GitBranch className="h-3.5 w-3.5" />
                                            ),
                                            onClick: () =>
                                              setSelectedWorkflowRule(r),
                                          },
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
                                    </div>
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
