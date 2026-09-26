import type { SerializedReopenPolicy } from "@/types/admin/master-rules";
import { ReopenPolicyCard } from "./ReopenPolicyCard";

export interface GlobalPoliciesProps {
  reopenPolicies: SerializedReopenPolicy[];
  filteredReopenPolicies: SerializedReopenPolicy[];
  onToggleStatus: (
    ruleType: "reopen",
    id: string,
    currentStatus: string,
  ) => void;
  onOpenConfigure: (policy: SerializedReopenPolicy) => void;
  onConfirmDelete: (ruleType: "reopen", id: string, name: string) => void;
}

export function GlobalPolicies({
  reopenPolicies,
  filteredReopenPolicies,
  onToggleStatus,
  onOpenConfigure,
  onConfirmDelete,
}: GlobalPoliciesProps) {
  return (
    <div id="global-policies-section" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Global Policies</h3>
          <p className="text-xs text-slate-500">
            Organization-wide policies governing grievance reopen windows,
            manual review limits, and escalation parameters.
          </p>
        </div>
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#064E3B]">
          {reopenPolicies.length} Active Organization{" "}
          {reopenPolicies.length === 1 ? "Policy" : "Policies"}
        </span>
      </div>

      {filteredReopenPolicies.length === 0 ? (
        <div className="rounded-xl border border-slate-200/80 bg-white py-12 text-center">
          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
            <p className="font-semibold text-slate-700">
              No global reopen policies found.
            </p>
            <p className="text-xs text-slate-400">
              Configure a global policy to govern resolution reopen requests.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReopenPolicies.map((policy) => (
            <ReopenPolicyCard
              key={policy.reopen_policy_id}
              policy={policy}
              onToggleStatus={onToggleStatus}
              onOpenConfigure={onOpenConfigure}
              onConfirmDelete={onConfirmDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
