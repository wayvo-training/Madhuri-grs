import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Clock,
  FileText,
  ShieldCheck,
  Sliders,
  Users,
  Workflow,
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
    priorityRulesCount,
    routingRulesCount,
    slaPoliciesCount,
    totalUsersCount,
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
    prisma.priority_rules.count({ where: { status: "ACTIVE" } }),
    prisma.routing_rules.count({ where: { status: "ACTIVE" } }),
    prisma.sla_policies.count({ where: { status: "ACTIVE" } }),
    prisma.users.count({ where: { status: "ACTIVE" } }),
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
        {/* 1. TOP METRIC CARDS ROW (Flup-style high-contrast layout)                 */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Raised"
            value={totalGrievances}
            icon={FileText}
            accentColor="blue"
            description="All-time registered grievances"
          />

          <StatCard
            label="Active Workload"
            value={activeGrievances}
            icon={Clock}
            accentColor="amber"
            description="Across all departments"
          />

          <StatCard
            label="SLA At Risk / Breached"
            value={atRiskSlaCount}
            icon={AlertTriangle}
            accentColor="rose"
            description={`${escalatedCount} escalated ticket(s)`}
          />

          <StatCard
            label="Resolution Rate"
            value={`${resolutionRate}%`}
            icon={ShieldCheck}
            accentColor="emerald"
            description={`${closedCount} closed tickets`}
          />
        </div>

        {/* ========================================================================= */}
        {/* 2. MAIN WORKSPACE: Workload Matrix & Management Hub                       */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Department Workload Matrix (2 Cols on lg) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Department Workload Distribution */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Department Workload Distribution
                  </h3>
                  <p className="text-xs text-slate-500">
                    Active grievance volume by organizational division
                  </p>
                </div>
                <Link
                  href="/admin/departments"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <span>Manage Departments</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {departments.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">
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
                          <div className="flex items-center gap-2 font-semibold text-slate-800">
                            <Building2 className="h-3.5 w-3.5 text-blue-600" />
                            <span>{dept.department_name}</span>
                          </div>
                          <span className="text-slate-500">
                            {count} grievances ({percentage}%)
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-all duration-500"
                            style={{ width: `${Math.max(percentage, 3)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Recent Grievances Stream */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Recent Grievance Submissions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Latest employee filings & triage state
                  </p>
                </div>
                <Link
                  href="/admin/grievances"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <span>View All Tickets</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-2.5 pl-3 pr-2">Ticket</th>
                      <th className="px-2 py-2.5">Category</th>
                      <th className="px-2 py-2.5">Department</th>
                      <th className="px-2 py-2.5">Priority</th>
                      <th className="py-2.5 pl-2 pr-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {recentGrievances.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-6 text-center text-slate-400"
                        >
                          No grievances registered yet.
                        </td>
                      </tr>
                    ) : (
                      recentGrievances.map((g) => (
                        <tr
                          key={g.grievance_id.toString()}
                          className="hover:bg-slate-50/60 transition"
                        >
                          <td className="whitespace-nowrap py-3 pl-3 pr-2 font-mono font-bold text-slate-900">
                            {g.grievance_number}
                          </td>
                          <td className="whitespace-nowrap px-2 py-3 text-slate-800">
                            {g.categories.category_name}
                          </td>
                          <td className="whitespace-nowrap px-2 py-3 text-slate-600">
                            {g.grievance_departments?.departments
                              ?.department_name || (
                              <span className="italic text-amber-600 text-[11px]">
                                Unrouted
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-2 py-3">
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

          {/* Right Column: Quick Management Hub & Routing Exceptions (1 Col on lg) */}
          <div className="space-y-6">
            {/* Manual Routing Exceptions Banner */}
            {routingExceptionsCount > 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-amber-900 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <h4>Manual Routing Required</h4>
                </div>
                <p className="mt-1.5 text-xs text-amber-700 leading-relaxed">
                  {routingExceptionsCount} submitted ticket(s) currently await
                  manual department allocation because automated routing rules
                  did not match.
                </p>
                <Link
                  href="/admin/grievances"
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition"
                >
                  <span>Resolve Exceptions</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 text-emerald-900 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                  <h4>Routing Health: Optimal</h4>
                </div>
                <p className="mt-1.5 text-xs text-emerald-700 leading-relaxed">
                  All submitted tickets have been automatically matched and
                  routed by your Master Routing Rules. Zero manual backlog.
                </p>
              </div>
            )}

            {/* Quick Management Hub */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Administrative Operations Hub
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Jump directly to core administrative modules
              </p>

              <div className="mt-4 space-y-2.5">
                <Link
                  href="/admin/rules"
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                      <Sliders className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Master Governance Rules
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Priority, Routing & SLA Policies
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-700 shadow-2xs">
                    {priorityRulesCount + routingRulesCount + slaPoliciesCount}{" "}
                    Rules
                  </span>
                </Link>

                <Link
                  href="/admin/departments"
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Departments
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Divisions & workload limits
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-700 shadow-2xs">
                    {departments.length} Depts
                  </span>
                </Link>

                <Link
                  href="/admin/users"
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        User Directory
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Onboard & assign roles
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-700 shadow-2xs">
                    {totalUsersCount} Users
                  </span>
                </Link>

                <Link
                  href="/admin/roles"
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Roles & Permissions
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Access control matrix
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>

                <Link
                  href="/admin/audit-logs"
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                      <Workflow className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Audit Trail
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Governance compliance log
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
