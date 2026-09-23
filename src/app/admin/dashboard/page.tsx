import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Clock,
  FileText,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import { DashboardShell } from "@/components/dashboard/shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const user = await requirePageRole("ADMIN");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  // 1. Fetch real database metrics and overview records
  const [
    totalGrievances,
    activeGrievances,
    escalatedCount,
    closedCount,
    atRiskSlaCount,
    routingExceptionsCount,
    departments,
    recentGrievances,
  ] = await Promise.all([
    prisma.grievances.count(),
    prisma.grievances.count({
      where: {
        status: {
          in: [
            "SUBMITTED",
            "ROUTED",
            "ASSIGNED",
            "IN_PROGRESS",
            "UNDER_REVIEW",
            "REOPENED",
            "REOPEN_REVIEW",
          ],
        },
      },
    }),
    prisma.grievances.count({ where: { status: "ESCALATED" } }),
    prisma.grievances.count({ where: { status: "CLOSED" } }),
    prisma.grievances.count({
      where: { sla_status: { in: ["AT_RISK", "BREACHED"] } },
    }),
    prisma.grievances.count({
      where: { status: "SUBMITTED" },
    }),
    prisma.departments.findMany({
      where: { status: "ACTIVE" },
      select: {
        department_id: true,
        department_name: true,
        _count: {
          select: { grievance_departments: true },
        },
      },
      orderBy: { department_name: "asc" },
    }),
    prisma.grievances.findMany({
      take: 6,
      orderBy: { created_at: "desc" },
      include: {
        categories: true,
        subcategories: true,
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        grievance_departments: {
          where: { involvement_type: "PRIMARY" },
          include: {
            departments: true,
          },
        },
      },
    }),
  ]);

  const resolutionRate =
    totalGrievances > 0
      ? ((closedCount / totalGrievances) * 100).toFixed(1)
      : "100";

  return (
    <DashboardShell
      userRole="ADMIN"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Admin Control Center"
      subtitle="Executive system oversight, operational health & enterprise governance"
    >
      <div className="space-y-7">
        {/* ========================================================================= */}
        {/* 1. TOP METRIC CARDS ROW                                                   */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Raised"
            value={totalGrievances}
            icon={FileText}
            accentColor="slate"
            description="All-time registered grievances"
          />

          <StatCard
            label="Active Workload"
            value={activeGrievances}
            icon={Clock}
            accentColor="slate"
            description="Currently in progress or triage"
          />

          {/* Single focal highlight card: Warm amber for escalations & SLA risks */}
          <StatCard
            label="SLA At Risk / Breached"
            value={atRiskSlaCount}
            icon={AlertTriangle}
            accentColor={atRiskSlaCount > 0 ? "amber" : "slate"}
            description={`${escalatedCount} escalated ticket(s)`}
          />

          <StatCard
            label="Resolution Rate"
            value={`${resolutionRate}%`}
            icon={ShieldCheck}
            accentColor="emerald"
            description={`${closedCount} resolved & closed`}
          />
        </div>

        {/* ========================================================================= */}
        {/* 2. ACTION REQUIRED / OPERATIONAL HEALTH BANNER                            */}
        {/* ========================================================================= */}
        {routingExceptionsCount > 0 ? (
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
        ) : (
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
        )}

        {/* ========================================================================= */}
        {/* 3. EXECUTIVE WORKSPACE: Workload Breakdown & Recent Activity               */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Department Workload Distribution (2 Cols on lg) */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Department Workload
                </h3>
                <p className="mt-0.5 text-xs font-normal text-slate-500">
                  Volume distribution by division
                </p>
              </div>
              <Link
                href="/admin/departments"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950"
              >
                <span>Departments</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-5 space-y-4 flex-1">
              {departments.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  No active departments configured yet.
                </p>
              ) : (
                departments.map((dept) => {
                  const count = dept._count.grievance_departments;
                  const percentage =
                    totalGrievances > 0
                      ? Math.round((count / totalGrievances) * 100)
                      : 0;

                  return (
                    <div key={dept.department_id.toString()}>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-medium text-slate-800">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span>{dept.department_name}</span>
                        </div>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#064E3B] transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Grievances Stream (3 Cols on lg) */}
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
                <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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
                        key={g.grievance_id.toString()}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="whitespace-nowrap py-3 pl-3 pr-2 font-mono font-medium text-slate-900 text-xs">
                          {g.grievance_number}
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-3 font-normal text-slate-700 text-xs">
                          {g.categories.category_name}
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
        </div>
      </div>
    </DashboardShell>
  );
}
