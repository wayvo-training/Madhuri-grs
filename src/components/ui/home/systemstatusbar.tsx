"use client";

import { ArrowUpRight, CheckCircle2 } from "lucide-react";

export default function SystemStatusBar() {
  return (
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50">
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">GRS Platform</p>
            <p className="text-xs text-slate-500">
              Grievance submission and tracking services are available.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-teal-700">
          <span className="h-2 w-2 rounded-full bg-teal-500" />
          Operational
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </section>
  );
}
