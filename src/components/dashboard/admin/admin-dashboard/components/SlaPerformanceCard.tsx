"use client";

import { cn } from "cn";
import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SlaItem {
  name: string;
  value: number;
  fill: string;
  description: string;
}

interface SlaPerformanceCardProps {
  data: SlaItem[];
  totalSla: number;
  className?: string;
}

export function SlaPerformanceCard({
  data,
  totalSla,
  className,
}: SlaPerformanceCardProps) {
  const router = useRouter();

  const onTrackItem = data.find((d) => d.name.toLowerCase() === "on track");
  const atRiskItem = data.find((d) => d.name.toLowerCase() === "at risk");
  const breachedItem = data.find((d) => d.name.toLowerCase() === "breached");

  const onTrackCount = onTrackItem?.value ?? 0;
  const atRiskCount = atRiskItem?.value ?? 0;
  const breachedCount = breachedItem?.value ?? 0;

  const compliancePercentage =
    totalSla > 0 ? ((onTrackCount / totalSla) * 100).toFixed(1) : "0.0";

  const onTrackPct = totalSla > 0 ? (onTrackCount / totalSla) * 100 : 0;
  const atRiskPct = totalSla > 0 ? (atRiskCount / totalSla) * 100 : 0;
  const breachedPct = totalSla > 0 ? (breachedCount / totalSla) * 100 : 0;

  const handleSlaFilter = (slaStatus: string) => {
    router.push(`/admin/grievances?tab=ACTIVE&sla_status=${slaStatus}`);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between overflow-hidden shadow-2xs p-2 sm:p-2.5 h-full",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
            SLA Performance
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Active grievances by SLA compliance
          </p>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition p-0.5 cursor-pointer rounded-sm"
              aria-label="SLA Information"
            >
              <Info className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              Tracks compliance of active grievances against their defined SLA
              resolution targets.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Main SLA stats - evenly distributed to fill card height with zero empty space */}
      <div className="flex flex-col justify-between flex-1 pt-1 pb-0.5 gap-1">
        {/* Compliance Box */}
        <button
          type="button"
          onClick={() => handleSlaFilter("ON_TRACK")}
          className="rounded-lg border border-emerald-100/80 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-700/60 px-2 py-0.5 flex items-center justify-between cursor-pointer transition group outline-none w-full text-left"
          title="Click to view on-track grievances"
        >
          <div>
            <span className="text-[9.5px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block leading-none">
              SLA COMPLIANCE
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight leading-none mt-0.5 block">
              {compliancePercentage}%
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block leading-tight">
              {onTrackCount} of {totalSla}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-tight">
              grievances on track
            </span>
          </div>
        </button>

        {/* Segmented Progress Bar */}
        <div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            {onTrackPct > 0 && (
              <button
                type="button"
                onClick={() => handleSlaFilter("ON_TRACK")}
                style={{ width: `${onTrackPct}%` }}
                className="bg-emerald-500 h-full transition-all duration-500 cursor-pointer hover:opacity-90 outline-none p-0 border-none"
                title={`On Track: ${Math.round(onTrackPct)}%`}
              />
            )}
            {atRiskPct > 0 && (
              <button
                type="button"
                onClick={() => handleSlaFilter("AT_RISK")}
                style={{ width: `${atRiskPct}%` }}
                className="bg-amber-400 h-full transition-all duration-500 cursor-pointer hover:opacity-90 outline-none p-0 border-none"
                title={`At Risk: ${Math.round(atRiskPct)}%`}
              />
            )}
            {breachedPct > 0 && (
              <button
                type="button"
                onClick={() => handleSlaFilter("BREACHED")}
                style={{ width: `${breachedPct}%` }}
                className="bg-rose-500 h-full transition-all duration-500 cursor-pointer hover:opacity-90 outline-none p-0 border-none"
                title={`Breached: ${Math.round(breachedPct)}%`}
              />
            )}
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-400 font-medium pt-0.5">
            <span>{Math.round(onTrackPct)}%</span>
            <span>{Math.round(breachedPct)}%</span>
          </div>
        </div>

        {/* 3 Status Summary Tiles */}
        <div className="grid grid-cols-3 gap-1.5">
          {/* On Track */}
          <button
            type="button"
            onClick={() => handleSlaFilter("ON_TRACK")}
            className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition cursor-pointer p-0.5 sm:p-1 flex flex-col justify-between min-h-8 sm:min-h-9 group outline-none text-left"
            title="Filter by On Track"
          >
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate">
                On Track
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {onTrackCount}
            </span>
            <span className="text-[8.5px] text-slate-400 dark:text-slate-400 leading-tight block truncate">
              Within targets
            </span>
          </button>

          {/* At Risk */}
          <button
            type="button"
            onClick={() => handleSlaFilter("AT_RISK")}
            className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-amber-500/60 dark:hover:border-amber-500/60 transition cursor-pointer p-0.5 sm:p-1 flex flex-col justify-between min-h-8 sm:min-h-9 group outline-none text-left"
            title="Filter by At Risk"
          >
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition truncate">
                At Risk
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {atRiskCount}
            </span>
            <span className="text-[8.5px] text-slate-400 dark:text-slate-400 leading-tight block truncate">
              Near SLA limit
            </span>
          </button>

          {/* Breached */}
          <button
            type="button"
            onClick={() => handleSlaFilter("BREACHED")}
            className="rounded-lg border border-rose-100/70 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-500/60 dark:hover:border-rose-500/60 transition cursor-pointer p-0.5 sm:p-1 flex flex-col justify-between min-h-8 sm:min-h-9 group outline-none text-left"
            title="Filter by Breached"
          >
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition truncate">
                Breached
              </span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {breachedCount}
            </span>
            <span className="text-[8.5px] text-slate-400 dark:text-slate-400 leading-tight block truncate">
              Exceeded limit
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
