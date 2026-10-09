import { CheckCircle2, Sparkles } from "lucide-react";
import { PriorityBadge } from "@/components/dashboard/badges";
import type { SerializedPriorityRule } from "@/types/admin/master-rules";

export interface DefaultPriorityFallbackProps {
  defaultPriorityRule: SerializedPriorityRule | null;
  onToggleStatus: (
    ruleType: "priority",
    id: string,
    currentStatus: string,
  ) => void;
}

export function DefaultPriorityFallback({
  defaultPriorityRule,
  onToggleStatus,
}: DefaultPriorityFallbackProps) {
  return (
    <div>
      <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
        <span>System Default Priority Fallback</span>
      </h4>
      <p className="text-xs text-slate-500 mb-2">
        Evaluated when no category or subcategory specific priority rule matches
        an incoming grievance.
      </p>
      {defaultPriorityRule ? (
        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-slate-500">
              #{defaultPriorityRule.rule_order}
            </span>
            <div>
              <span className="font-bold text-slate-900">
                {defaultPriorityRule.rule_name}
              </span>
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                System Default
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={defaultPriorityRule.priority_level} />
            <button
              type="button"
              onClick={() =>
                onToggleStatus(
                  "priority",
                  defaultPriorityRule.priority_rule_id,
                  defaultPriorityRule.status,
                )
              }
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${
                defaultPriorityRule.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {defaultPriorityRule.status === "ACTIVE"
                ? "Active"
                : "Deactivated"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">
          No default fallback rule configured.
        </p>
      )}
    </div>
  );
}
