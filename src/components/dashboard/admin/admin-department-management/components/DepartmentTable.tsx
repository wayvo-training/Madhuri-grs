"use client";

import {
  Building2,
  Check,
  ChevronDown,
  EllipsisVertical,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AdminPanelHeader,
  AdminToolbarAction,
} from "@/components/dashboard/admin/admin-shared";
import { Pagination } from "@/components/ui/pagination";
import type {
  DepartmentStatusFilter,
  SerializedDepartment,
} from "@/types/admin/departments";

interface DepartmentTableProps {
  departments: SerializedDepartment[];
  filteredDepartments: SerializedDepartment[];
  paginatedDepartments: SerializedDepartment[];
  statusFilter: DepartmentStatusFilter;
  onStatusFilterChange: (status: DepartmentStatusFilter) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onResetFilters: () => void;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  openActionMenuId: string | null;
  onToggleActionMenu: (deptId: string) => void;
  actionMenuRef: React.RefObject<HTMLDivElement | null>;
  onOpenCreateModal: () => void;
  onOpenEditModal: (dept: SerializedDepartment) => void;
  onToggleStatus: (dept: SerializedDepartment) => void;
  onCloseActionMenu: () => void;
}

export function DepartmentTable({
  departments,
  filteredDepartments,
  paginatedDepartments,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  onResetFilters,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  openActionMenuId,
  onToggleActionMenu,
  actionMenuRef,
  onOpenCreateModal,
  onOpenEditModal,
  onToggleStatus,
  onCloseActionMenu,
}: DepartmentTableProps) {
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
      }
    }
    if (isStatusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isStatusDropdownOpen]);

  const activeCount = departments.filter(
    (d) => (d.status || "ACTIVE") === "ACTIVE",
  ).length;
  const inactiveCount = departments.filter(
    (d) => d.status === "INACTIVE",
  ).length;

  const statusOptions: {
    key: DepartmentStatusFilter;
    label: string;
    count: number;
    dotColor?: string;
  }[] = [
    { key: "ALL", label: "All Status", count: departments.length },
    {
      key: "ACTIVE",
      label: "Active",
      count: activeCount,
      dotColor: "bg-emerald-500",
    },
    {
      key: "INACTIVE",
      label: "Inactive",
      count: inactiveCount,
      dotColor: "bg-rose-500",
    },
  ];

  const activeOption = statusOptions.find((o) => o.key === statusFilter);
  const activeLabel =
    statusFilter !== "ALL" && activeOption
      ? `View: ${activeOption.label}`
      : "View";

  return (
    <div
      id="departments"
      className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs"
    >
      <div className="border-b border-slate-100 pb-5">
        <AdminPanelHeader
          title="Department Workload & Governance"
          description="Enterprise divisions configured for automated routing, status governance, and workload resolution."
          action={
            <AdminToolbarAction onClick={onOpenCreateModal}>
              <Plus className="h-3.5 w-3.5" />
              <span>New Department</span>
            </AdminToolbarAction>
          }
        />
      </div>

      {/* Controls Bar: Search on Left, View / Status Dropdown on Right */}
      <div className="mt-5 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input on the Left */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search department..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* View / Status Dropdown Menu on the Right */}
        <div className="flex items-center gap-2">
          {(statusFilter !== "ALL" || searchQuery) && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}

          <div className="relative inline-block" ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                statusFilter !== "ALL"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{activeLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-48 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  View ▾
                </div>
                <div className="border-t border-slate-100 my-1" />
                {statusOptions.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      onStatusFilterChange(item.key);
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition cursor-pointer ${
                      statusFilter === item.key
                        ? "bg-emerald-50 font-semibold text-emerald-900"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.dotColor && (
                        <span
                          className={`h-2 w-2 rounded-full ${item.dotColor}`}
                        />
                      )}
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                        {item.count}
                      </span>
                      {statusFilter === item.key && (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Departments Table */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                S.No
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Department
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Description
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Status
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Staff
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Cases
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredDepartments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-8 ring-emerald-50/50">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-slate-900">
                      No matching departments found
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      No departments match your current status filter or search
                      query.
                    </p>
                    {(searchQuery || statusFilter !== "ALL") && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                        <span>Reset Filters</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedDepartments.map((dept, index) => {
                const isDeptActive = (dept.status || "ACTIVE") === "ACTIVE";

                return (
                  <tr
                    key={dept.department_id}
                    className={`border-b border-slate-100 transition ${
                      isDeptActive
                        ? "bg-white hover:bg-slate-50/60"
                        : "bg-slate-50/40 opacity-80"
                    }`}
                  >
                    {/* S.No */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-slate-500">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>

                    {/* Department Name */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-semibold text-slate-900">
                          {dept.department_name}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="max-w-[220px] px-4 py-3.5">
                      <p className="truncate text-sm font-normal text-slate-500">
                        {dept.description || "—"}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                          isDeptActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isDeptActive ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {isDeptActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Staff */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600 font-medium">
                        <Users className="h-3 w-3 text-slate-400" />
                        {dept.user_count ?? 0}
                      </span>
                    </td>

                    {/* Cases */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-slate-700">
                      {dept.grievance_count}
                    </td>

                    {/* Action - 3 dots menu */}
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <div
                        className="relative"
                        ref={
                          openActionMenuId === dept.department_id
                            ? actionMenuRef
                            : undefined
                        }
                      >
                        <button
                          type="button"
                          onClick={() => onToggleActionMenu(dept.department_id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <EllipsisVertical className="h-4 w-4" />
                        </button>
                        {openActionMenuId === dept.department_id && (
                          <div className="absolute right-0 top-full z-20 mt-1 min-w-[120px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                            <button
                              type="button"
                              onClick={() => {
                                onCloseActionMenu();
                                onOpenEditModal(dept);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-emerald-800"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>

                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={filteredDepartments.length}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[5, 10, 20, 50]}
        itemLabel="departments"
      />
    </div>
  );
}
