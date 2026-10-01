"use client";

import {
  Building2,
  EllipsisVertical,
  Pencil,
  Plus,
  RotateCcw,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AdminPanelHeader,
  AdminToolbarAction,
} from "@/components/dashboard/admin/admin-shared";
import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import { Pagination } from "@/components/ui/pagination";
import { SortableTh } from "@/components/ui/sortable-table-head";
import { useTableSort } from "@/hooks/useTableSort";
import type { SerializedDepartment } from "@/types/admin/departments";

interface DepartmentTableProps {
  departments: SerializedDepartment[];
  filteredDepartments: SerializedDepartment[];
  paginatedDepartments: SerializedDepartment[];
  statusFilter: string[];
  onStatusFilterChange: (statuses: string[]) => void;
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
  const { sortState, handleSort, sortedItems } = useTableSort(
    paginatedDepartments,
    { field: "department_name", direction: "asc" },
  );

  const activeCount = departments.filter(
    (d) => (d.status || "ACTIVE") === "ACTIVE",
  ).length;
  const inactiveCount = departments.filter(
    (d) => d.status === "INACTIVE",
  ).length;

  // Build filter fields for the AdvancedTableSearch
  const filterFields: SearchFieldDef[] = [
    {
      id: "search",
      label: "Search",
      type: "text",
    },
    {
      id: "id",
      label: "ID",
      type: "text",
    },
    {
      id: "department",
      label: "Department",
      type: "select",
      options: departments.map(d => ({ label: d.department_name, value: d.department_name })),
    },
    {
      id: "staff",
      label: "Staff",
      type: "text",
    },
    {
      id: "cases",
      label: "Cases",
      type: "text",
    },
  ];

  const handleSearchChange = (conditions: SearchCondition[], mode: string) => {
    onStatusFilterChange([]);
    onSearchQueryChange("");

    let newStatus: string[] = [];
    let newSearch = "";

    conditions.forEach((condition) => {
      let valArray = Array.isArray(condition.value) ? condition.value : [condition.value as string];

      if (condition.field === "status") {
        newStatus.push(...valArray);
      }
      if (
        condition.field === "search" ||
        condition.field === "id" ||
        condition.field === "department" ||
        condition.field === "staff" ||
        condition.field === "cases"
      ) {
        newSearch = valArray[0] || newSearch;
      }
    });

    if (newStatus.length > 0) onStatusFilterChange(newStatus);
    if (newSearch) onSearchQueryChange(newSearch);
  };

  return (
    <div
      id="departments"
      className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs"
    >
      <div>
        <AdminPanelHeader
          title="Department Workload & Governance"
          action={
            <div className="flex flex-wrap items-center gap-3 ml-4 sm:ml-8 lg:ml-12 w-full justify-end sm:w-auto flex-1">
              <div className="w-full sm:w-[600px] max-w-[50vw]">
                <AdvancedTableSearch
                  fields={filterFields}
                  onSearch={handleSearchChange}
                  className="w-full"
                />
              </div>
              <AdminToolbarAction onClick={onOpenCreateModal}>
                <Plus className="h-3.5 w-3.5" />
                <span>New Department</span>
              </AdminToolbarAction>
            </div>
          }
        />
      </div>


      {/* Departments Table */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
              <SortableTh
                field="department_id"
                currentSort={sortState}
                onSort={handleSort}
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                ID
              </SortableTh>
              <SortableTh
                field="department_name"
                currentSort={sortState}
                onSort={handleSort}
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Department
              </SortableTh>
              <SortableTh
                field="description"
                currentSort={sortState}
                onSort={handleSort}
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Description
              </SortableTh>
              <SortableTh
                field="status"
                currentSort={sortState}
                onSort={handleSort}
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Status
              </SortableTh>
              <SortableTh
                field="user_count"
                currentSort={sortState}
                onSort={handleSort}
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Staff
              </SortableTh>
              <SortableTh
                field="grievance_count"
                currentSort={sortState}
                onSort={handleSort}
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Cases
              </SortableTh>
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
                    {(searchQuery || statusFilter.length > 0) && (
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
              sortedItems.map((dept, index) => {
                const isDeptActive = (dept.status || "ACTIVE") === "ACTIVE";

                return (
                  <tr
                    key={dept.department_id}
                    className={`border-b border-slate-100 dark:border-slate-800 transition ${
                      isDeptActive
                        ? "bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/50"
                        : "bg-slate-50/40 dark:bg-slate-800/40 opacity-80"
                    }`}
                  >
                    {/* ID */}
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-slate-500">
                      {dept.department_id}
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
