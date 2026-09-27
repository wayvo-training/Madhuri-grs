"use client";

import { ArrowLeft, X } from "lucide-react";

interface CaseInspectionHeaderProps {
  ticketCode: string;
  title: string;
  category: string;
  subcategory: string;
  priority: string;
  slaState: "BREACHED" | "SLA_AT_RISK" | "AT_RISK" | "ON_TRACK" | string;
  onClose: () => void;
}

export function CaseInspectionHeader({
  ticketCode,
  title,
  category,
  subcategory,
  priority,
  slaState,
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
          <span className="font-mono text-xs font-bold text-[#0F766E] bg-[#F0FDFA] px-2.5 py-1 rounded-md border border-teal-200/80">
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
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-2.75 font-semibold ${
                priority === "CRITICAL"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : priority === "HIGH"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              {priority} Priority
            </span>
          </div>
        </div>

        <div>
          {isBreached ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              SLA BREACHED
            </span>
          ) : isAtRisk ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              SLA AT RISK
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              ON TRACK
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
