import { AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export interface RoutingExceptionsBannerProps {
  routingExceptionsCount: number;
}

export function RoutingExceptionsBanner({
  routingExceptionsCount,
}: RoutingExceptionsBannerProps) {
  if (routingExceptionsCount > 0) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-1.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-amber-100 p-1 text-amber-800 shrink-0">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900 leading-tight">
              Manual Routing Required ({routingExceptionsCount} ticket
              {routingExceptionsCount > 1 ? "s" : ""})
            </h4>
            <p className="text-[10.5px] text-amber-800/90 leading-tight mt-0.5">
              Submitted grievances without automated rule matches await
              assignment.
            </p>
          </div>
        </div>
        <Link
          href="/admin/grievances?tab=EXCEPTIONS"
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-amber-900 transition shrink-0"
        >
          <span>Review Exceptions</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-1.5 text-slate-700 shadow-2xs dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
      <div className="flex items-center gap-2.5">
        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-none">
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            Automated Routing Active:
          </span>{" "}
          All incoming grievances matched to departments. Zero unrouted
          exceptions.
        </p>
      </div>
      <Link
        href="/admin/rules"
        className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 shrink-0"
      >
        <span>View Rules</span>
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
