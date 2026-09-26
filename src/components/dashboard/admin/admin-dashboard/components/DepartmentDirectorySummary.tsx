import { ArrowRight, Building2, Users } from "lucide-react";
import Link from "next/link";
import type { DashboardDepartmentSummary } from "@/types/admin/dashboard";

export interface DepartmentDirectorySummaryProps {
  departments: DashboardDepartmentSummary[];
}

export function DepartmentDirectorySummary({
  departments,
}: DepartmentDirectorySummaryProps) {
  return (
    <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B]">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Department Workload
            </h3>
            <p className="mt-0.5 text-xs font-normal text-slate-500">
              Volume distribution by division
            </p>
          </div>
        </div>
        <Link
          href="/admin/departments"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition"
        >
          <span>Departments</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 divide-y divide-slate-100/80 flex-1">
        {departments.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">
            No active departments configured yet.
          </p>
        ) : (
          departments.map((dept) => {
            return (
              <div
                key={dept.department_id}
                className="py-3 first:pt-1 last:pb-1"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B]">
                      <Building2 className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-bold text-slate-900 truncate">
                      {dept.department_name}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-1.5 py-0.2 text-2xs font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <span
                      className="inline-flex items-center gap-1 text-2xs font-medium text-slate-500"
                      title={`${dept.user_count} Staff members`}
                    >
                      <Users className="h-3 w-3 text-slate-400" />
                      {dept.user_count}
                    </span>
                    <span
                      className="font-mono text-2xs font-bold text-slate-700"
                      title={`${dept.grievance_count} cases`}
                    >
                      {dept.grievance_count}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
