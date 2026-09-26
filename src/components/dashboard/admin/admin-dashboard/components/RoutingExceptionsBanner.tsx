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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-100 p-2 text-amber-800 shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900">
              Manual Routing Required ({routingExceptionsCount} ticket
              {routingExceptionsCount > 1 ? "s" : ""})
            </h4>
            <p className="mt-0.5 text-xs text-amber-800/90 leading-relaxed">
              Submitted grievances without automated rule matches await
              administrative department assignment.
            </p>
          </div>
        </div>
        <Link
          href="/admin/grievances?tab=EXCEPTIONS"
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-800 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-900 transition shrink-0"
        >
          <span>Review Exceptions</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 px-5 py-3.5 text-slate-700 shadow-2xs">
      <div className="flex items-center gap-2.5">
        <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
        <p className="text-xs font-medium text-slate-700">
          <span className="font-semibold text-slate-900">
            Automated Routing Active:
          </span>{" "}
          All incoming grievances have been matched to departments. Zero
          unrouted exceptions.
        </p>
      </div>
      <Link
        href="/admin/rules"
        className="text-xs font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1"
      >
        <span>View Rules</span>
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
