"use client";

import {
  Building2,
  EllipsisVertical,
  Pencil,
  Plus,
  RotateCcw,
  Users,
} from "lucide-react";
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
import { TruncatedText } from "@/components/ui/truncated-text";
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

  const _activeCount = departments.filter(
    (d) => (d.status || "ACTIVE") === "ACTIVE",
  ).length;
  const _inactiveCount = departments.filter(
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
      options: departments.map((d) => ({
        label: d.department_name,
        value: d.department_name,
      })),
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

  const handleSearchChange = (conditions: SearchCondition[], _mode: string) => {
    onStatusFilterChange([]);
    onSearchQueryChange("");

    const newStatus: string[] = [];
    let newSearch = "";

    conditions.forEach((condition) => {
      const valArray = Array.isArray(condition.value)
        ? condition.value
        : [condition.value as string];

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
      className="flex flex-col flex-1 min-h-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 shadow-xs"
    >
      <div className="shrink-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
            Department Workload & Governance
          </h2>
          <div className="flex items-center gap-3 flex-1 min-w-0 ml-0 lg:ml-6">
            <div className="flex-1 min-w-0">
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
        </div>
      </div>

      {/* Departments Table */}
      <div className="flex-1 min-h-0 mt-3 overflow-x-auto overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 shadow-2xs backdrop-blur-xs">
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
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
                field="head_name"
                currentSort={sortState}
                onSort={handleSort}
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Department Head
              </SortableTh>
              <SortableTh
                field="head_email"
                currentSort={sortState}
                onSort={handleSort}
                className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Head Email
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
                <td colSpan={9} className="py-14 text-center">
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
              sortedItems.map((dept, _index) => {
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
                    <td className="px-4 py-3.5 max-w-[180px] overflow-hidden">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <TruncatedText
                          text={dept.department_name}
                          maxChars={24}
                          className="text-sm font-semibold text-slate-900 dark:text-slate-100 max-w-full truncate block"
                        />
                      </div>
                    </td>

                    {/* Department Head */}
                    <td className="px-4 py-3.5 max-w-[160px] overflow-hidden whitespace-nowrap">
                      {dept.head_name ? (
                        <span
                          className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate block"
                          title={dept.head_name}
                        >
                          {dept.head_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Head Email */}
                    <td className="px-4 py-3.5 max-w-[200px] overflow-hidden whitespace-nowrap">
                      {dept.head_email ? (
                        <span
                          className="text-xs text-slate-600 dark:text-slate-400 font-mono truncate block"
                          title={dept.head_email}
                        >
                          {dept.head_email}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Description */}
                    <td className="max-w-[200px] px-4 py-3.5">
                      <TruncatedText
                        text={dept.description}
                        maxChars={28}
                        className="text-sm font-normal text-slate-500 border-none block"
                      />
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
      <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
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
    </div>
  );
}
