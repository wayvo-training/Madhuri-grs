import {
  ChevronDown,
  Clock,
  Plus,
  RotateCcw,
  Sliders,
  Workflow,
} from "lucide-react";
import type { ModalRuleType } from "@/types/admin/master-rules";

export interface CreatePolicyMenuProps {
  activeDropdown: string | null;
  setActiveDropdown: (value: string | null) => void;
  onSelectType: (type: ModalRuleType) => void;
}

export function CreatePolicyMenu({
  activeDropdown,
  setActiveDropdown,
  onSelectType,
}: CreatePolicyMenuProps) {
  return (
    <div className="relative shrink-0" data-dropdown-container>
      <button
        type="button"
        onClick={() =>
          setActiveDropdown(
            activeDropdown === "create-policy" ? null : "create-policy",
          )
        }
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800 whitespace-nowrap cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Configure New Policy</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            activeDropdown === "create-policy" ? "rotate-180" : ""
          }`}
        />
      </button>

      {activeDropdown === "create-policy" && (
        <div className="absolute right-0 top-full mt-1.5 z-40 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
          <div className="px-2 py-1 text-2xs font-bold uppercase tracking-wider text-slate-400">
            Select Policy Type
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectType("routing");
              setActiveDropdown(null);
            }}
            className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-slate-50 transition group"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100">
              <Workflow className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                Routing Policy
              </div>
              <div className="text-2xs text-slate-500">
                Route categories to departments
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectType("priority");
              setActiveDropdown(null);
            }}
            className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-slate-50 transition group"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-100">
              <Sliders className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                Priority Rule
              </div>
              <div className="text-2xs text-slate-500">
                Severity scoring & keywords triage
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectType("sla");
              setActiveDropdown(null);
            }}
            className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-slate-50 transition group"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 group-hover:bg-blue-100">
              <Clock className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                SLA Policy
              </div>
              <div className="text-2xs text-slate-500">
                Deadlines & escalation thresholds
              </div>
            </div>
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onClick={() => {
              onSelectType("reopen");
              setActiveDropdown(null);
            }}
            className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-slate-50 transition group"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B] group-hover:bg-emerald-100">
              <RotateCcw className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-950">
                Global Reopen Policy
              </div>
              <div className="text-2xs text-slate-500">
                Case reopening window & limits
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
