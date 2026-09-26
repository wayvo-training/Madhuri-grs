import { ChevronDown, ChevronRight } from "lucide-react";
import React from "react";
import { PriorityBadge } from "@/components/dashboard/badges";
import type { MatrixRow } from "@/types/admin/master-rules";
import { RoutingRulesPanel } from "./RoutingRulesPanel";

export interface GrievancePolicyTableProps {
  subcategories: MatrixRow[];
  expandedRoutingViews: Set<string>;
  onToggleRoutingView: (rowKey: string) => void;
  onOpenConfigureRow: (
    deptName: string,
    catName: string,
    subcatName: string,
    currentPriority: string,
  ) => void;
  onToggleStatus: (
    ruleType: "routing",
    id: string,
    currentStatus: string,
  ) => void;
  onConfirmDelete: (ruleType: "routing", id: string, name: string) => void;
}

export function GrievancePolicyTable({
  subcategories,
  expandedRoutingViews,
  onToggleRoutingView,
  onOpenConfigureRow,
  onToggleStatus,
  onConfirmDelete,
}: GrievancePolicyTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            <th className="py-2.5 pl-3 pr-2">Grievance Type</th>
            <th className="px-3 py-2.5">Priority</th>
            <th className="px-3 py-2.5">Primary Route</th>
            <th className="px-3 py-2.5">Supporting Dept</th>
            <th className="px-3 py-2.5">SLA Target</th>
            <th className="py-2.5 pl-3 pr-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
          {subcategories.map((row) => {
            const rowKey = `${row.departmentName}::${row.categoryName}::${row.subcategoryName}`;
            const isRoutingExpanded = expandedRoutingViews.has(rowKey);

            return (
              <React.Fragment key={rowKey}>
                <tr className="hover:bg-slate-50/70 transition-colors">
                  {/* Grievance Type */}
                  <td className="py-2.5 pl-3 pr-2 font-bold text-slate-900">
                    {row.subcategoryName}
                  </td>

                  {/* Priority */}
                  <td className="px-3 py-2.5">
                    <PriorityBadge priority={row.effectivePriority} />
                  </td>

                  {/* Primary Route */}
                  <td className="px-3 py-2.5">
                    <span className="font-semibold text-slate-800">
                      {row.primaryRouteDept}
                    </span>
                  </td>

                  {/* Supporting Dept */}
                  <td className="px-3 py-2.5 text-xs text-slate-600">
                    {row.supportingDepts.length > 0 ? (
                      <span className="inline-flex flex-wrap gap-1">
                        {row.supportingDepts.map((sd) => (
                          <span
                            key={sd}
                            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700"
                          >
                            {sd}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-slate-400">&mdash;</span>
                    )}
                  </td>

                  {/* SLA Target */}
                  <td className="px-3 py-2.5">
                    <span className="font-semibold text-slate-800">
                      {row.effectiveSlaDuration}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 pl-3 pr-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Routing Rules */}
                      <button
                        type="button"
                        onClick={() => onToggleRoutingView(rowKey)}
                        title="View individual routing rules for this grievance type"
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition border shadow-2xs ${
                          isRoutingExpanded
                            ? "bg-slate-800 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span>
                          {isRoutingExpanded
                            ? "Hide Rules"
                            : `View Routing Rules (${row.routingRules.length})`}
                        </span>
                        {isRoutingExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>

                      {/* Configure */}
                      <button
                        type="button"
                        onClick={() =>
                          onOpenConfigureRow(
                            row.departmentName,
                            row.categoryName,
                            row.subcategoryName,
                            row.effectivePriority,
                          )
                        }
                        title="Configure policy for this grievance type"
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition"
                      >
                        <span>Configure</span>
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded Detailed Routing View */}
                {isRoutingExpanded && (
                  <tr>
                    <td
                      colSpan={6}
                      className="bg-slate-50/80 p-3.5 border-t border-slate-100"
                    >
                      <RoutingRulesPanel
                        routingRules={row.routingRules}
                        onToggleStatus={onToggleStatus}
                        onConfirmDelete={onConfirmDelete}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
