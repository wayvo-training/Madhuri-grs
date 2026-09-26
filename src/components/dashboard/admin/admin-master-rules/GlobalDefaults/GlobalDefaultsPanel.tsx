import { ChevronDown, ChevronRight, Sliders } from "lucide-react";
import type {
  SerializedPriorityRule,
  SerializedSlaPolicy,
} from "@/types/admin/master-rules";
import { DefaultPriorityFallback } from "./DefaultPriorityFallback";
import { SlaTargetMatrix } from "./SlaTargetMatrix";

export interface GlobalDefaultsPanelProps {
  isDefaultsPanelOpen: boolean;
  onToggleDefaultsPanel: () => void;
  defaultPriorityRule: SerializedPriorityRule | null;
  slaPolicies: SerializedSlaPolicy[];
  onToggleStatus: (
    ruleType: "priority" | "routing" | "sla" | "reopen",
    id: string,
    currentStatus: string,
  ) => void;
}

export function GlobalDefaultsPanel({
  isDefaultsPanelOpen,
  onToggleDefaultsPanel,
  defaultPriorityRule,
  slaPolicies,
  onToggleStatus,
}: GlobalDefaultsPanelProps) {
  return (
    <div className="mt-6 rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
      <button
        type="button"
        onClick={onToggleDefaultsPanel}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {isDefaultsPanelOpen ? (
            <ChevronDown className="h-4 w-4 text-slate-600 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          )}
          <span className="rounded-lg bg-emerald-50 p-1 text-emerald-800">
            <Sliders className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-bold text-slate-900">
            Global Engine Defaults & Fallback Rules
          </span>
          <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-medium text-slate-700">
            Fallback Rules
          </span>
        </div>
        <span className="text-xs text-slate-500">
          {isDefaultsPanelOpen
            ? "Click to collapse"
            : "Click to view default fallbacks"}
        </span>
      </button>

      {isDefaultsPanelOpen && (
        <div className="p-4 border-t border-slate-100 space-y-4 text-xs">
          <DefaultPriorityFallback
            defaultPriorityRule={defaultPriorityRule}
            onToggleStatus={onToggleStatus}
          />

          <SlaTargetMatrix
            slaPolicies={slaPolicies}
            onToggleStatus={onToggleStatus}
          />
        </div>
      )}
    </div>
  );
}
