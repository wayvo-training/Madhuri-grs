import { Trash2 } from "lucide-react";
import type { SerializedRoutingRule } from "@/types/admin/master-rules";

export interface RoutingRulesPanelProps {
  routingRules: SerializedRoutingRule[];
  onToggleStatus: (
    ruleType: "routing",
    id: string,
    currentStatus: string,
  ) => void;
  onConfirmDelete: (ruleType: "routing", id: string, name: string) => void;
}

export function RoutingRulesPanel({
  routingRules,
  onToggleStatus,
  onConfirmDelete,
}: RoutingRulesPanelProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 pb-1">
        <span>Underlying Routing Records ({routingRules.length})</span>
        <span className="text-slate-400 normal-case font-normal">
          Every routing rule remains an individual distinct record
        </span>
      </div>

      <div className="space-y-1.5">
        {/* Sub-table Header */}
        <div className="hidden sm:grid grid-cols-12 items-center gap-3 px-3 py-1.5 text-2xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/60">
          <div className="col-span-5">Rule & Target</div>
          <div className="col-span-2">Involvement</div>
          <div className="col-span-2">Supporting Dept</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {routingRules.map((rr) => (
          <div
            key={rr.routing_rule_id}
            className="grid grid-cols-12 items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs hover:border-slate-300 transition"
          >
            {/* Rule Name & Target */}
            <div className="col-span-12 sm:col-span-5 flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold text-slate-500 shrink-0">
                #{rr.rule_order}
              </span>
              <span
                className="text-xs font-bold text-slate-900 truncate"
                title={rr.rule_name}
              >
                {rr.rule_name}
              </span>
              <span className="text-slate-400 shrink-0">&rarr;</span>
              <span
                className="text-xs font-semibold text-slate-800 truncate"
                title={rr.department_name}
              >
                {rr.department_name}
              </span>
            </div>

            {/* Involvement Badge */}
            <div className="col-span-6 sm:col-span-2 flex items-center">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-2xs font-bold uppercase tracking-wider ${
                  rr.involvement_type === "PRIMARY"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {rr.involvement_type}
              </span>
            </div>

            {/* Supporting Depts */}
            <div className="col-span-6 sm:col-span-2 flex items-center">
              {rr.supporting_departments &&
              rr.supporting_departments.length > 0 ? (
                <span
                  className="text-xs text-slate-600 truncate max-w-full"
                  title={rr.supporting_departments.join(", ")}
                >
                  {rr.supporting_departments.join(", ")}
                </span>
              ) : (
                <span className="text-slate-300 font-mono text-xs select-none">
                  &mdash;
                </span>
              )}
            </div>

            {/* Status Toggle */}
            <div className="col-span-6 sm:col-span-2 flex items-center">
              <button
                type="button"
                onClick={() =>
                  onToggleStatus("routing", rr.routing_rule_id, rr.status)
                }
                title={
                  rr.status === "ACTIVE"
                    ? "Click to Deactivate rule"
                    : "Click to Activate rule"
                }
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition border shadow-2xs cursor-pointer ${
                  rr.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    rr.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
                <span>{rr.status === "ACTIVE" ? "Active" : "Deactivated"}</span>
              </button>
            </div>

            {/* Delete Button */}
            <div className="col-span-6 sm:col-span-1 flex items-center justify-end">
              <button
                type="button"
                onClick={() =>
                  onConfirmDelete("routing", rr.routing_rule_id, rr.rule_name)
                }
                title="Delete routing rule"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500 shadow-2xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
