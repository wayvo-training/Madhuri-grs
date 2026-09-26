import { RotateCcw, Trash2 } from "lucide-react";
import type { SerializedReopenPolicy } from "@/types/admin/master-rules";

export interface ReopenPolicyCardProps {
  policy: SerializedReopenPolicy;
  onToggleStatus: (
    ruleType: "reopen",
    id: string,
    currentStatus: string,
  ) => void;
  onOpenConfigure: (policy: SerializedReopenPolicy) => void;
  onConfirmDelete: (ruleType: "reopen", id: string, name: string) => void;
}

export function ReopenPolicyCard({
  policy,
  onToggleStatus,
  onOpenConfigure,
  onConfirmDelete,
}: ReopenPolicyCardProps) {
  const windowStr = policy.reopen_window_hours
    ? `${policy.reopen_window_hours} Hours (${(
        policy.reopen_window_hours / 24
      ).toFixed(0)} Days)`
    : "Unlimited";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-800">
              <RotateCcw className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {policy.policy_name}
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                ID: {policy.reopen_policy_id}
              </span>
            </div>
          </div>

          {/* Status toggle pill */}
          <button
            type="button"
            onClick={() =>
              onToggleStatus("reopen", policy.reopen_policy_id, policy.status)
            }
            title={
              policy.status === "ACTIVE"
                ? "Click to Deactivate policy"
                : "Click to Activate policy"
            }
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition border shadow-2xs ${
              policy.status === "ACTIVE"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                policy.status === "ACTIVE"
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-slate-400"
              }`}
            />
            <span>{policy.status === "ACTIVE" ? "Active" : "Deactivated"}</span>
          </button>
        </div>

        {/* Metric Highlights */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Reopen Window
            </span>
            <span className="mt-0.5 block text-xs font-bold text-slate-900">
              {windowStr}
            </span>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Max Attempts
            </span>
            <span className="mt-0.5 block text-xs font-bold text-slate-900">
              {policy.max_reopen_count} Reopen{" "}
              {policy.max_reopen_count === 1 ? "Attempt" : "Attempts"}
            </span>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Manual Reviews
            </span>
            <span className="mt-0.5 block text-xs font-bold text-slate-900">
              {policy.max_manual_review_count}{" "}
              {policy.max_manual_review_count === 1 ? "Review" : "Reviews"}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onOpenConfigure(policy)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition"
        >
          <span>Configure</span>
        </button>

        <button
          type="button"
          onClick={() =>
            onConfirmDelete(
              "reopen",
              policy.reopen_policy_id,
              policy.policy_name,
            )
          }
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 shadow-2xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}
