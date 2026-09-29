"use client";

import { Inbox, Layers, UserCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AdminMetricCard,
  AdminPanelHeader,
} from "@/components/dashboard/admin/admin-shared";
import { ActionMenu } from "@/components/ui/action-menu";
import { Pagination } from "@/components/ui/pagination";
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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, []);

  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return staffList.slice(start, start + pageSize);
  }, [staffList, currentPage, pageSize]);

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

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-semibold text-slate-600">
              <tr>
                <th className="py-3 pl-4 pr-3 whitespace-nowrap">
                  Staff Member
                </th>
                <th className="py-3 px-3 whitespace-nowrap">Status</th>
                <th className="py-3 px-3 min-w-48">Active Workload</th>
                <th className="py-3 px-3 whitespace-nowrap">Assigned Cases</th>
                <th className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {paginatedStaff.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 text-center text-slate-500 text-xs"
                  >
                    No staff members found.
                  </td>
                </tr>
              ) : (
                paginatedStaff.map((staff) => {
                  const loadPercentage =
                    staff.maxCapacity > 0
                      ? Math.round(
                          (staff.activeTickets / staff.maxCapacity) * 100,
                        )
                      : 0;
                  const isOverloaded = loadPercentage >= 80;
                  const staffTickets = grievances.filter(
                    (g) => g.assignedStaffId === staff.id,
                  );

                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-slate-50/60 transition"
                    >
                      {/* Staff Member Info */}
                      <td className="py-3 pl-4 pr-3 align-top">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0FDFA] text-sm font-bold text-[#0F766E] border border-teal-200/80">
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-slate-900">
                              {staff.name}
                            </h4>
                            <p className="text-[10px] text-slate-500">
                              {staff.designation}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {staff.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 align-top">
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
                      </td>

                      {/* Workload */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1.5 w-full">
                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <span>
                                {staff.activeTickets} /{" "}
                                {staff.maxCapacity || 10}
                              </span>
                              <span className="text-slate-400 font-normal">
                                •
                              </span>
                              <span
                                className={`text-[10px] ${
                                  staff.activeTickets >=
                                  (staff.maxCapacity || 10)
                                    ? "text-rose-600 font-bold"
                                    : "text-emerald-700 font-medium"
                                }`}
                              >
                                Avail:{" "}
                                {Math.max(
                                  0,
                                  (staff.maxCapacity || 10) -
                                    staff.activeTickets,
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
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
                      </td>

                      {/* Assigned Cases Count & Quick Actions */}
                      <td className="py-3 px-3 align-top">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-xs font-semibold text-slate-700">
                            {staffTickets.length} assigned
                          </span>
                          {staffTickets.length > 0 && (
                            <button
                              type="button"
                              onClick={() => onFilterStaffInQueue(staff.id)}
                              className="text-[10px] font-medium text-emerald-700 hover:text-emerald-900 transition underline cursor-pointer"
                            >
                              View in Queue
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 pl-3 pr-4 text-right align-top">
                        <div className="flex justify-end">
                          <ActionMenu
                            widthClass="w-36"
                            items={[
                              {
                                label:
                                  staff.status === "ON_LEAVE"
                                    ? "Set Available"
                                    : "Set On Leave",
                                icon: <UserCheck className="h-3.5 w-3.5" />,
                                variant: "default",
                                onClick: () => onToggleAvailability(staff),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200/80">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(staffList.length / pageSize)}
            totalCount={staffList.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel="staff members"
          />
        </div>
      </div>
    </div>
  );
}
