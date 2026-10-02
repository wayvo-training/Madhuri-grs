"use client";

import { Inbox, Layers, Mail, UserCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  AdminMetricCard,
  AdminPanelHeader,
} from "@/components/dashboard/admin/admin-shared";
import { ActionMenu } from "@/components/ui/action-menu";
import { Pagination } from "@/components/ui/pagination";
import {
  SortableTh,
  type SortState,
} from "@/components/ui/sortable-table-head";
import { evaluateSearchConditions } from "@/lib/search-evaluator";
import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
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
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: null,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, []);

  const [advancedConditions, setAdvancedConditions] = useState<SearchCondition[]>([]);
  const [advancedMode, setAdvancedMode] = useState<string>("AND");

  useEffect(() => {
    setCurrentPage(1);
  }, [advancedConditions, advancedMode]);

  const handleSort = (field: string, direction: "asc" | "desc" | null) => {
    setSortState({ field, direction });
  };

  const filterFields: SearchFieldDef[] = [
    { id: "employeeCode", label: "Staff ID", type: "text" },
    { id: "name", label: "Staff Name", type: "text" },
    { id: "activeTickets", label: "Assigned Cases", type: "number" },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "ACTIVE" },
        { label: "On Leave", value: "ON_LEAVE" },
        { label: "Busy", value: "BUSY" },
      ],
    },
    { id: "search", label: "Global Search", type: "text" },
  ];

  const handleSearchChange = (conditions: SearchCondition[], mode: string) => {
    setAdvancedConditions(conditions);
    setAdvancedMode(mode);
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) =>
      evaluateSearchConditions(s, advancedConditions, advancedMode)
    );
  }, [staffList, advancedConditions, advancedMode]);

  const sortedStaff = useMemo(() => {
    if (!sortState.field || !sortState.direction) return filteredStaff;

    return [...filteredStaff].sort((a, b) => {
      let valA: any = a[sortState.field as keyof StaffMember] || "";
      let valB: any = b[sortState.field as keyof StaffMember] || "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortState.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortState.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredStaff, sortState]);

  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStaff.slice(start, start + pageSize);
  }, [sortedStaff, currentPage, pageSize]);

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
          title="Department Utilization"
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
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="shrink-0">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Staff Workload & Availability
            </h2>
            <p className="mt-0.5 text-[13px] font-normal text-slate-500">
              Monitor staff workload, availability, and grievance assignments
            </p>
          </div>
          <div className="flex-1 min-w-0 flex flex-col items-end gap-3 w-full">
            <span className="text-sm font-medium text-slate-600">
              <span>Department Utilization:{" "}</span>
              <strong className="font-semibold text-emerald-800 ml-1">
                {metrics.totalActiveTickets} / {metrics.totalStaffCapacity}{" "}
                capacity
              </strong>
            </span>
            <div className="w-full">
              <AdvancedTableSearch
                fields={filterFields}
                onSearch={handleSearchChange}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 text-sm font-semibold text-slate-600 dark:text-slate-400">
              <tr>
                <SortableTh
                  field="name"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 pl-4 pr-3 whitespace-nowrap"
                >
                  Staff Member
                </SortableTh>
                <SortableTh
                  field="status"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 px-3 whitespace-nowrap"
                >
                  Status
                </SortableTh>
                <SortableTh
                  field="employeeCode"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 px-3 whitespace-nowrap"
                >
                  Staff ID
                </SortableTh>
                <SortableTh
                  field="activeTickets"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 px-3 min-w-48"
                >
                  Active Workload
                </SortableTh>
                <SortableTh
                  field="activeTickets"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="py-3 px-3 whitespace-nowrap"
                >
                  Assigned Cases
                </SortableTh>
                <th className="py-3 pl-3 pr-4 text-right whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-transparent text-slate-700 dark:text-slate-300">
              {paginatedStaff.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-slate-500 text-sm"
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
                            <h4 className="text-sm font-semibold text-slate-900">
                              {staff.name}
                            </h4>
                            <p className="text-[13px] text-slate-500">
                              {staff.designation.split(" (")[0]}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 align-top">
                        {staff.status === "ON_LEAVE" ? (
                          <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[13px] font-semibold text-slate-700">
                            On Leave
                          </span>
                        ) : staff.activeTickets >= (staff.maxCapacity || 10) ? (
                          <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[13px] font-semibold text-rose-800">
                            At Capacity
                          </span>
                        ) : isOverloaded ? (
                          <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[13px] font-semibold text-amber-800">
                            High Load
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[13px] font-semibold text-emerald-800">
                            Available
                          </span>
                        )}
                      </td>

                      {/* Staff ID */}
                      <td className="py-3 px-3 align-top font-mono text-[13px] text-slate-600">
                        {staff.employeeCode}
                      </td>

                      {/* Workload */}
                      <td className="py-3 px-3 align-top">
                        <div className="space-y-1.5 w-full min-w-48 max-w-[240px]">
                          <div className="flex items-center justify-between text-[13px]">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <span>
                                {staff.activeTickets} /{" "}
                                {staff.maxCapacity || 10}
                              </span>
                              <span className="text-slate-400 font-normal">
                                •
                              </span>
                              <span
                                className={`text-[13px] ${
                                  staff.activeTickets >=
                                  (staff.maxCapacity || 10)
                                    ? "text-slate-900 dark:text-slate-200 font-bold"
                                    : "text-slate-900 dark:text-slate-200 font-medium"
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
                          <span className="text-sm font-semibold text-slate-700">
                            {staffTickets.length} assigned
                          </span>
                          {staffTickets.length > 0 && (
                            <button
                              type="button"
                              onClick={() => onFilterStaffInQueue(staff.id)}
                              className="text-[13px] font-medium text-emerald-700 hover:text-emerald-900 transition underline cursor-pointer"
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
                                label: "Email Staff",
                                icon: <Mail className="h-3.5 w-3.5" />,
                                variant: "default",
                                onClick: () => {
                                  window.open(
                                    `https://mail.google.com/mail/?view=cm&fs=1&to=${staff.email}`,
                                    "_blank",
                                  );
                                },
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
