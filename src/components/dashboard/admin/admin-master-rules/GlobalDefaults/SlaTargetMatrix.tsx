import { Clock } from "lucide-react";
import { PriorityBadge } from "@/components/dashboard/badges";
import { formatDuration } from "@/lib/admin/master-rules/sla-resolver";
import type { SerializedSlaPolicy } from "@/types/admin/master-rules";

export interface SlaTargetMatrixProps {
  slaPolicies: SerializedSlaPolicy[];
  onToggleStatus: (ruleType: "sla", id: string, currentStatus: string) => void;
}

export function SlaTargetMatrix({
  slaPolicies,
  onToggleStatus,
}: SlaTargetMatrixProps) {
  return (
    <div>
      <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-indigo-600" />
        <span>Standard SLA Target Duration Matrix</span>
      </h4>
      <p className="text-xs text-slate-500 mb-2">
        Resolution deadlines matched dynamically by grievance priority severity.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
        {slaPolicies.map((sla) => (
          <div
            key={sla.sla_policy_id}
            className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-1.5"
          >
            <div className="flex items-center justify-between">
              {sla.priority_level ? (
                <PriorityBadge priority={sla.priority_level} />
              ) : (
                <span className="font-semibold text-slate-700 text-2xs">
                  General
                </span>
              )}
              <button
                type="button"
                onClick={() =>
                  onToggleStatus("sla", sla.sla_policy_id, sla.status)
                }
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  sla.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {sla.status}
              </button>
            </div>
            <p className="text-xs font-bold text-slate-900">
              {formatDuration(sla.target_duration_minutes)}
            </p>
            <p
              className="text-xs text-slate-500 truncate"
              title={sla.policy_name}
            >
              {sla.policy_name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
