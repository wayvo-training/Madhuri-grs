"use client";

import { Eye, Inbox, Layers, UserCheck, Users } from "lucide-react";
import {
  AdminMetricCard,
  AdminPanelHeader,
} from "@/components/dashboard/admin/admin-shared";
import { PriorityBadge } from "@/components/dashboard/badges";
import type {
  CaseDrawerTab,
  DepartmentMetricsSummary,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";

export interface StaffViewProps {
  staffList: StaffMember[];
  grievances: GrievanceItem[];
  currentDepartmentName: string;
  metrics: DepartmentMetricsSummary;
  onToggleAvailability: (staff: StaffMember) => void;
  onInspect: (item: GrievanceItem, tab?: CaseDrawerTab) => void;
  onReassign: (item: GrievanceItem, staffId: string) => void;
  onFilterStaffInQueue: (staffId: string) => void;
}

export function StaffView({
  staffList,
  grievances,
  currentDepartmentName,
  metrics,
  onToggleAvailability,
  onInspect,
  onReassign,
  onFilterStaffInQueue,
}: StaffViewProps) {
  const loadFactor =
    metrics.totalStaffCapacity > 0
      ? Math.round(
          (metrics.totalActiveTickets / metrics.totalStaffCapacity) * 100,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Team Capacity Metrics Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          title="Total Staff"
          value={staffList.length}
          helper={`${currentDepartmentName} department`}
          icon={Users}
          accent="emerald"
        />
        <AdminMetricCard
          title="On Active Duty"
          value={metrics.activeStaffCount}
          helper={`${metrics.onLeaveStaffCount} staff member(s) on approved leave`}
          icon={UserCheck}
          accent="emerald"
        />
        <AdminMetricCard
          title="Active Assigned Grievances"
          value={`${metrics.totalActiveTickets} Grievances`}
          helper={`Across ${metrics.activeStaffCount} active staff members`}
          icon={Inbox}
          accent="emerald"
        />
        <AdminMetricCard
          title="Department Load Factor"
          value={`${loadFactor}%`}
          helper={`${Math.max(0, metrics.totalStaffCapacity - metrics.totalActiveTickets)} slots available`}
          icon={Layers}
          accent={
            loadFactor > 85 ? "rose" : loadFactor > 60 ? "amber" : "emerald"
          }
        />
      </div>

      {/* Full-Width Staff Roster Cards Grid */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
        <AdminPanelHeader
          title="Department Staff Workload & Availability Matrix"
          description="Manage duty availability and inspect live grievance assignments per staff member"
          action={
            <span className="text-xs font-medium text-slate-600">
              Department Utilization:{" "}
              <strong className="font-semibold text-emerald-800">
                {metrics.totalActiveTickets} / {metrics.totalStaffCapacity}{" "}
                capacity
              </strong>
            </span>
          }
        />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {staffList.map((staff) => {
            const loadPercentage =
              staff.maxCapacity > 0
                ? Math.round((staff.activeTickets / staff.maxCapacity) * 100)
                : 0;
            const isOverloaded = loadPercentage >= 80;
            const staffTickets = grievances.filter(
              (g) => g.assignedStaffId === staff.id,
            );

            return (
              <div
                key={staff.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 shadow-2xs hover:border-teal-300 hover:bg-white transition"
              >
                <div className="space-y-3.5">
                  {/* Staff Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0FDFA] text-base font-bold text-[#0F766E] border border-teal-200/80">
                        {staff.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4
                          className="text-sm font-semibold text-slate-900 truncate max-w-42.5"
                          title={staff.name}
                        >
                          {staff.name}
                        </h4>
                        <p
                          className="text-xs font-normal text-slate-500 truncate max-w-42.5"
                          title={staff.designation}
                        >
                          {staff.designation}
                        </p>
                        <p
                          className="text-[11px] font-normal text-slate-400 truncate max-w-42.5"
                          title={staff.email}
                        >
                          {staff.email}
                        </p>
                      </div>
                    </div>

                    {staff.status === "ON_LEAVE" ? (
                      <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                        On Leave
                      </span>
                    ) : staff.activeTickets >= (staff.maxCapacity || 10) ? (
                      <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
                        At Capacity
                      </span>
                    ) : isOverloaded ? (
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        High Load
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        Available
                      </span>
                    )}
                  </div>

                  {/* Workload Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-normal text-slate-500">
                        Active Workload
                      </span>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <span>
                          {staff.activeTickets} / {staff.maxCapacity || 10}
                        </span>
                        <span className="text-slate-400 font-normal">•</span>
                        <span
                          className={`text-[11px] ${
                            staff.activeTickets >= (staff.maxCapacity || 10)
                              ? "text-rose-600 font-bold"
                              : "text-emerald-700 font-medium"
                          }`}
                        >
                          Avail:{" "}
                          {Math.max(
                            0,
                            (staff.maxCapacity || 10) - staff.activeTickets,
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          staff.status === "ON_LEAVE"
                            ? "bg-slate-400"
                            : isOverloaded
                              ? "bg-amber-500"
                              : "bg-emerald-600"
                        }`}
                        style={{
                          width: `${Math.min(loadPercentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Assigned Grievances Mini-List */}
                  <div className="border-t border-slate-200/70 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Assigned Grievances ({staffTickets.length})
                      </div>
                      {staffTickets.length > 0 && (
                        <button
                          type="button"
                          onClick={() => onFilterStaffInQueue(staff.id)}
                          className="text-[11px] font-medium text-emerald-700 hover:text-emerald-900 transition cursor-pointer"
                          title="Filter all grievances handled by this staff member in the queue"
                        >
                          View in Queue &rarr;
                        </button>
                      )}
                    </div>

                    {staffTickets.length === 0 ? (
                      <p className="text-xs italic text-slate-400 py-1">
                        No active grievances assigned.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {staffTickets.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between rounded-xl bg-white border border-slate-200/80 p-2.5 text-xs hover:border-emerald-300 hover:shadow-2xs transition gap-2"
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-semibold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                                  {t.ticketCode}
                                </span>
                                <PriorityBadge priority={t.priority} />
                                <span className="text-[10px] font-medium text-slate-500">
                                  {t.slaTimeLeft}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => onInspect(t, "statement")}
                                className="text-left text-slate-800 font-medium truncate hover:text-emerald-800 transition text-xs block w-full cursor-pointer"
                                title="Click to inspect full case file"
                              >
                                {t.title}
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => onInspect(t, "progress")}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-white hover:border-emerald-300 transition cursor-pointer"
                                title="Inspect full case file, statements & attachments"
                              >
                                <Eye className="h-3 w-3 text-slate-500" />
                                <span>Inspect</span>
                              </button>
                              {(t.status === "ESCALATED" ||
                                t.slaStatus === "BREACHED" ||
                                t.status === "ASSIGNED") && (
                                <button
                                  type="button"
                                  onClick={() => onReassign(t, staff.id)}
                                  className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer whitespace-nowrap"
                                  title="Change assignment to another staff member"
                                >
                                  <span>Change Assignment</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Staff Status Toggle Footer */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Status:{" "}
                    <strong className="font-semibold text-slate-700">
                      {staff.status}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleAvailability(staff)}
                    className="font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                  >
                    {staff.status === "ON_LEAVE"
                      ? "Mark as Available"
                      : "Set as On Leave"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
