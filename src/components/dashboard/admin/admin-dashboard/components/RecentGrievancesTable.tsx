import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import type { DashboardRecentGrievance } from "@/types/admin/dashboard";

export interface RecentGrievancesTableProps {
  recentGrievances: DashboardRecentGrievance[];
}

export function RecentGrievancesTable({
  recentGrievances,
}: RecentGrievancesTableProps) {
  return (
    <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Recent Grievances
          </h3>
          <p className="mt-0.5 text-xs font-normal text-slate-500">
            Latest filings across the organization
          </p>
        </div>
        <Link
          href="/admin/grievances"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
        >
          <span>View Full Table</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto flex-1">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-2.75 font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-2.5 pl-3 pr-2">Ticket ID</th>
              <th className="px-2.5 py-2.5">Category</th>
              <th className="px-2.5 py-2.5">Priority</th>
              <th className="py-2.5 pl-2 pr-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
            {recentGrievances.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="py-8 text-center text-xs text-slate-400 font-normal"
                >
                  No grievances registered yet.
                </td>
              </tr>
            ) : (
              recentGrievances.map((g) => (
                <tr
                  key={g.grievance_id}
                  className="hover:bg-slate-50/70 transition"
                >
                  <td className="whitespace-nowrap py-3 pl-3 pr-2 font-mono font-medium text-slate-900 text-xs">
                    {g.grievance_number}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-3 font-normal text-slate-700 text-xs">
                    {g.category_name || "General"}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-3">
                    <PriorityBadge priority={g.priority} />
                  </td>
                  <td className="whitespace-nowrap py-3 pl-2 pr-3 text-right">
                    <StatusBadge status={g.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
