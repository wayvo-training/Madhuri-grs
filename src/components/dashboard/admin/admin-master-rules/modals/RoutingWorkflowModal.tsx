"use client";

import {
  ArrowDown,
  CheckCircle2,
  Clock,
  GitBranch,
  GitMerge,
  Layers,
  Pencil,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import type { SerializedRoutingRule } from "@/types/admin/master-rules";
import { parseRoutingRuleMDI } from "../utils/routing-rule-parser";

export interface RoutingWorkflowModalProps {
  open: boolean;
  onClose: () => void;
  rule: SerializedRoutingRule | null;
  onEdit?: (rule: SerializedRoutingRule) => void;
}

export function RoutingWorkflowModal({
  open,
  onClose,
  rule,
  onEdit,
}: RoutingWorkflowModalProps) {
  const mdi = useMemo(() => {
    if (!rule) return null;
    return parseRoutingRuleMDI(rule);
  }, [rule]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !rule || !mdi) return null;

  const isSequential = mdi.executionMode === "SEQUENTIAL";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="workflow-modal-title"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 ring-4 ring-indigo-50/60 dark:ring-indigo-950/30">
              <GitBranch className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                  {rule.rule_name}
                </h3>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-2xs font-semibold ${
                    rule.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  }`}
                >
                  {rule.status === "ACTIVE" ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span>
                  Category:{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {rule.category_name || "All"}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Subcategory:{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {rule.subcategory_name || "All"}
                  </strong>
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Execution Mode Banner */}
          <div
            className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isSequential
                ? "border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20"
                : "border-sky-200 bg-sky-50/50 dark:border-sky-900/60 dark:bg-sky-950/20"
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  isSequential
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    : "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                }`}
              >
                {isSequential ? (
                  <GitMerge className="h-5 w-5" />
                ) : (
                  <Zap className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Execution Mode:
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                      isSequential
                        ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-700"
                        : "bg-sky-100 text-sky-800 border border-sky-300 dark:bg-sky-900/60 dark:text-sky-200 dark:border-sky-700"
                    }`}
                  >
                    {isSequential ? "⏳ SEQUENTIAL" : "⚡ PARALLEL"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {isSequential
                    ? "Departments activate in ordered stages. Dependent departments remain BLOCKED until all prerequisite departments complete."
                    : "All participating departments activate concurrently upon ticket triage. Each department resolves its tasks in parallel."}
                </p>
              </div>
            </div>

            <div className="text-xs shrink-0 self-start sm:self-auto bg-white/80 dark:bg-slate-800/80 rounded-lg px-3 py-1.5 border border-slate-200/80 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">
                Total Stages:{" "}
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {mdi.stages.length}
              </span>
              <span className="mx-1 text-slate-300">|</span>
              <span className="text-slate-500 dark:text-slate-400">
                Departments:{" "}
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {mdi.participatingDepartments.length}
              </span>
            </div>
          </div>

          {/* Workflow DAG Flow Visualization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                Execution Flow & Derived Stages
              </h4>
              <span className="text-2xs text-slate-400 dark:text-slate-500">
                Topological Order derived via Kahn&apos;s Algorithm
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-5 space-y-4">
              {mdi.stages.map((stageInfo, sIdx) => {
                const isLastStage = sIdx === mdi.stages.length - 1;
                return (
                  <div key={stageInfo.stageNumber} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-2xs">
                        {stageInfo.stageNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Stage {stageInfo.stageNumber}
                      </span>
                      {stageInfo.stageNumber === 1 && (
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                          {isSequential
                            ? "Starts Immediately"
                            : "Concurrent Starters"}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pl-7">
                      {stageInfo.departments.map((dept) => {
                        const hasPrereqs =
                          dept.prerequisites && dept.prerequisites.length > 0;
                        const roleBadgeClass =
                          dept.involvement_type === "PRIMARY"
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
                            : dept.involvement_type === "EQUAL"
                              ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800"
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";

                        return (
                          <div
                            key={dept.department_name}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-3.5 shadow-2xs space-y-2 hover:border-indigo-200 transition"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span
                                className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate"
                                title={dept.department_name}
                              >
                                {dept.department_name}
                              </span>
                              <span
                                className={`inline-flex items-center rounded px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider shrink-0 border ${roleBadgeClass}`}
                              >
                                {dept.involvement_type}
                              </span>
                            </div>

                            {/* Dependencies status */}
                            <div className="text-xs">
                              {hasPrereqs ? (
                                <div className="rounded-md bg-amber-50/70 dark:bg-amber-950/30 p-2 border border-amber-200/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-2xs leading-relaxed">
                                  <span className="font-semibold">
                                    Prerequisites (AND):
                                  </span>{" "}
                                  <span>{dept.prerequisites.join(" + ")}</span>
                                  <div className="text-slate-500 dark:text-slate-400 mt-0.5 text-[10px]">
                                    All must finish before activation
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-2xs text-emerald-600 dark:text-emerald-400 font-medium">
                                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                                  <span>
                                    Independent starter (no prerequisites)
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* SLA Allocation */}
                            <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-2xs text-slate-500 dark:text-slate-400">
                              <span>SLA Allocation:</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {dept.allocated_duration_minutes != null &&
                                dept.allocated_duration_minutes > 0
                                  ? `${dept.allocated_duration_minutes >= 60 ? `${(dept.allocated_duration_minutes / 60).toFixed(1)}h` : `${dept.allocated_duration_minutes}m`}${dept.sla_percent_allocation != null && dept.sla_percent_allocation > 0 ? ` (${dept.sla_percent_allocation}%)` : ""}`
                                  : dept.sla_percent_allocation != null &&
                                      dept.sla_percent_allocation > 0
                                    ? `${dept.sla_percent_allocation}%`
                                    : "Not configured"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Downward connector between stages */}
                    {!isLastStage && (
                      <div className="flex items-center justify-center py-1">
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-2xs font-semibold uppercase tracking-wider">
                          <ArrowDown className="h-4 w-4 text-indigo-500 animate-bounce" />
                          <span>
                            Progresses to Stage {stageInfo.stageNumber + 1} upon
                            completion
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Summary Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Department Participation & Allocation Summary
            </h4>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-2xs border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3.5 py-2.5">Department</th>
                    <th className="px-3 py-2.5">Involvement</th>
                    <th className="px-3 py-2.5">Stage & Order</th>
                    <th className="px-3 py-2.5">Prerequisites</th>
                    <th className="px-3.5 py-2.5 text-right">SLA Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  {mdi.participatingDepartments.map((dept) => {
                    const roleBadgeClass =
                      dept.involvement_type === "PRIMARY"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
                        : dept.involvement_type === "EQUAL"
                          ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";

                    return (
                      <tr
                        key={dept.department_name}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-3.5 py-2.5 font-bold text-slate-900 dark:text-slate-100">
                          {dept.department_name}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider border ${roleBadgeClass}`}
                          >
                            {dept.involvement_type}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                            Stage {dept.stage} · #{dept.execution_order}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          {dept.prerequisites &&
                          dept.prerequisites.length > 0 ? (
                            <span className="font-mono text-2xs text-amber-700 dark:text-amber-300">
                              {dept.prerequisites.join(" + ")}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-2xs italic">
                              None (Starter)
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {dept.allocated_duration_minutes != null &&
                          dept.allocated_duration_minutes > 0
                            ? `${dept.allocated_duration_minutes >= 60 ? `${(dept.allocated_duration_minutes / 60).toFixed(1)}h` : `${dept.allocated_duration_minutes}m`}${dept.sla_percent_allocation != null && dept.sla_percent_allocation > 0 ? ` (${dept.sla_percent_allocation}%)` : ""}`
                            : dept.sla_percent_allocation != null &&
                                dept.sla_percent_allocation > 0
                              ? `${dept.sla_percent_allocation}%`
                              : "Not configured"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-3.5 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Rule #{rule.rule_order}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Close
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(rule);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit Rule Configuration</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
