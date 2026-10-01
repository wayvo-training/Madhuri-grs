"use client";

import { ArrowLeft, CheckCircle2, X } from "lucide-react";

interface CaseInspectionHeaderProps {
  ticketCode: string;
  title: string;
  category: string;
  subcategory: string;
  priority: string;
  slaState: "BREACHED" | "SLA_AT_RISK" | "AT_RISK" | "ON_TRACK" | string;
  hodIntervention?: any;
  onClose: () => void;
}

export function CaseInspectionHeader({
  ticketCode,
  title,
  category,
  subcategory,
  priority,
  slaState,
  hodIntervention,
  onClose,
}: CaseInspectionHeaderProps) {
  const isBreached = slaState === "BREACHED";
  const isAtRisk = slaState === "SLA_AT_RISK" || slaState === "AT_RISK";

  return (
    <div className="flex flex-col border-b border-slate-200/90 bg-slate-50/70 px-6 py-4 shrink-0 gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0F766E] transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to SLA Monitoring</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#0F766E]">
            {ticketCode}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
            title="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 pt-0.5">
        <div className="space-y-1 max-w-[70%]">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-[-0.02em] line-clamp-1">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span>{category}</span>
            <span className="text-slate-300">•</span>
            <span>{subcategory}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-900 font-semibold">
              {priority} Priority
            </span>
          </div>
          {hodIntervention && (
            <div className="pt-2">
              <div className="inline-flex flex-col gap-0.5 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>
                    Current Head Intervention &ndash;{" "}
                    {hodIntervention.actionLabel}
                  </span>
                </div>
                {(hodIntervention.note ||
                  hodIntervention.actionType === "MONITOR") && (
                  <span className="text-[11px] font-medium text-emerald-700 pl-5.5">
                    {hodIntervention.note || "SLA Risk Acknowledged by HOD"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          {isBreached ? (
            <span className="text-sm font-bold text-slate-900 uppercase">
              SLA BREACHED
            </span>
          ) : isAtRisk ? (
            <span className="text-sm font-bold text-slate-900 uppercase">
              SLA AT RISK
            </span>
          ) : (
            <span className="text-sm font-bold text-slate-900 uppercase">
              ON TRACK
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
