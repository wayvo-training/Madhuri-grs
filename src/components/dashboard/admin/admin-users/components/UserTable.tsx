"use client";

import {
  Building2,
  CheckCircle2,
  EllipsisVertical,
  Plus,
  Power,
  Shield,
  User,
} from "lucide-react";
import {
  AdminPanelHeader,
  AdminToolbarAction,
} from "@/components/dashboard/admin/admin-shared";
import {
  AdvancedTableSearch,
  type FilterMode,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import { Pagination } from "@/components/ui/pagination";
import { SortableTh } from "@/components/ui/sortable-table-head";
import { useTableSort } from "@/hooks/useTableSort";
import type {
  SerializedUser,
  UserDepartmentOption,
  UserRoleFilter,
  UserRoleOption,
  UserStatusFilter,
} from "@/types/admin/users";

interface UserTableProps {
  users: SerializedUser[];
  filteredUsers: SerializedUser[];
  paginatedUsers: SerializedUser[];
  availableRoles: UserRoleOption[];
  availableDepartments: UserDepartmentOption[];

  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  roleFilter?: UserRoleFilter;
  onRoleFilterChange?: (role: UserRoleFilter) => void;
  deptFilter?: string;
  onDeptFilterChange?: (deptId: string) => void;
  statusFilter?: UserStatusFilter;
  onStatusFilterChange?: (status: UserStatusFilter) => void;
  onResetFilters?: () => void;

  onSearchChange?: (conditions: SearchCondition[], mode: FilterMode) => void;

  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;

  openActionMenuId: string | null;
  onToggleActionMenu: (userId: string) => void;
  actionMenuRef: React.RefObject<HTMLDivElement | null>;
  onCloseActionMenu: () => void;

  onOpenCreateModal: () => void;
  onOpenEditModal?: (user: SerializedUser) => void;
  onOpenResetModal?: (user: SerializedUser) => void;
  onToggleStatus: (user: SerializedUser) => void;
}

export function UserTable({
  users,
  filteredUsers,
  paginatedUsers,
  availableRoles,
  availableDepartments,
  searchQuery,
  onSearchQueryChange,
  roleFilter: _roleFilter,
  onRoleFilterChange: _onRoleFilterChange,
  deptFilter: _deptFilter,
  onDeptFilterChange: _onDeptFilterChange,
  statusFilter: _statusFilter,
  onStatusFilterChange: _onStatusFilterChange,
  onResetFilters: _onResetFilters,
  onSearchChange,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  openActionMenuId,
  onToggleActionMenu,
  actionMenuRef,
  onCloseActionMenu,
  onOpenCreateModal,
  onOpenEditModal: _onOpenEditModal,
  onOpenResetModal: _onOpenResetModal,
  onToggleStatus,
}: UserTableProps) {
  const { sortState, handleSort, sortedItems } = useTableSort(paginatedUsers, {
    field: "created_at",
    direction: "desc",
  });

  const getRoleBadgeStyle = (roleName: string) => {
    switch (roleName) {
      case "ADMIN":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
      case "DEPARTMENT_HEAD":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
      case "STAFF":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
      case "END_USER":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800";
      case "SUSPENDED":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
    }
  };

  const getInitials = (firstName: string, lastName: string | null) => {
    const f = firstName?.[0] || "";
    const l = lastName?.[0] || "";
    return `${f}${l}`.toUpperCase() || "U";
  };

  // Smart Search Fields Configuration
  const filterFields: SearchFieldDef[] = [
    {
      id: "search",
      label: "Global Search",
      type: "text",
    },
    {
      id: "name",
      label: "User Name",
      type: "text",
    },
    {
      id: "employee_code",
      label: "Employee Code",
      type: "text",
    },
    {
      id: "email",
      label: "Email",
      type: "text",
    },
    {
      id: "role_name",
      label: "Role",
      type: "select",
      options: availableRoles.map((r) => ({
        label: r.role_name,
        value: r.role_name,
      })),
    },
    {
      id: "department_name",
      label: "Department",
      type: "select",
      options: availableDepartments.map((d) => ({
        label: d.department_name,
        value: d.department_name,
      })),
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "ACTIVE" },
        { label: "Inactive", value: "INACTIVE" },
        { label: "Suspended", value: "SUSPENDED" },
      ],
    },
  ];

  const handleSmartSearch = (
    conditions: SearchCondition[],
    mode: FilterMode,
  ) => {
    if (onSearchChange) {
      onSearchChange(conditions, mode);
    } else if (onSearchQueryChange) {
      let query = "";
      conditions.forEach((c) => {
        const val = Array.isArray(c.value) ? c.value[0] : c.value;
        if (
          c.field === "search" ||
          c.field === "name" ||
          c.field === "email" ||
          c.field === "employee_code"
        ) {
          query = val || query;
        }
      });
      onSearchQueryChange(query);
    }
  };

  return (
    <div
      id="users-directory"
      className="flex flex-col flex-1 min-h-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 sm:p-4 shadow-xs"
    >
      <div className="shrink-0 flex flex-col gap-2.5">
        <AdminPanelHeader
          title="User Accounts Directory"
          description="Manage administrative permissions, grievance officers, department staff, and system access"
          action={
            <AdminToolbarAction onClick={onOpenCreateModal}>
              <Plus className="h-3.5 w-3.5" />
              <span>Create User</span>
            </AdminToolbarAction>
          }
        />

        {/* Expanded Smart Search Toolbar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-0.5">
          <div className="flex-1 min-w-0">
            <AdvancedTableSearch
              fields={filterFields}
              onSearch={handleSmartSearch}
              className="w-full"
            />
          </div>

          <div className="text-xs text-slate-500 whitespace-nowrap pl-3 shrink-0">
            Showing{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {filteredUsers.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {users.length}
            </span>{" "}
            users
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 min-h-0 mt-2.5 overflow-x-auto overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 shadow-2xs backdrop-blur-xs">
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
              <SortableTh
                field="first_name"
                currentSort={sortState}
                onSort={handleSort}
                className="whitespace-nowrap px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                User
              </SortableTh>
              <SortableTh
                field="employee_code"
                currentSort={sortState}
                onSort={handleSort}
                className="whitespace-nowrap px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Employee Code
              </SortableTh>
              <SortableTh
                field="role_name"
                currentSort={sortState}
                onSort={handleSort}
                className="whitespace-nowrap px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Role
              </SortableTh>
              <SortableTh
                field="department_name"
                currentSort={sortState}
                onSort={handleSort}
                className="whitespace-nowrap px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Department
              </SortableTh>
              <SortableTh
                field="status"
                currentSort={sortState}
                onSort={handleSort}
                className="whitespace-nowrap px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Status
              </SortableTh>
              <SortableTh
                field="assigned_grievances_count"
                currentSort={sortState}
                onSort={handleSort}
                className="whitespace-nowrap px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Grievances
              </SortableTh>
              <th className="whitespace-nowrap px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-12 text-center text-xs text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <User className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <span>
                      No user accounts found matching current criteria.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedItems.map((user) => {
                const fullName =
                  `${user.first_name} ${user.last_name || ""}`.trim();
                const isMenuOpen = openActionMenuId === user.user_id;

                return (
                  <tr
                    key={user.user_id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* User Profile */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200/50">
                          {getInitials(user.first_name, user.last_name)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-slate-900 dark:text-slate-100 text-xs truncate">
                            {fullName}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Employee Code */}
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                        {user.employee_code}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getRoleBadgeStyle(
                          user.role_name,
                        )}`}
                      >
                        <Shield className="h-3 w-3" />
                        {user.role_name}
                      </span>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>
                          {user.department_name || "— Central Admin —"}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${getStatusBadgeStyle(
                          user.status,
                        )}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.status === "ACTIVE"
                              ? "bg-emerald-500"
                              : user.status === "SUSPENDED"
                                ? "bg-rose-500"
                                : "bg-slate-400"
                          }`}
                        />
                        {user.status}
                      </span>
                    </td>

                    {/* Grievance Activity */}
                    <td className="px-4 py-2 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span title="Assigned grievances">
                          Assigned:{" "}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {user.assigned_grievances_count}
                          </strong>
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">
                          |
                        </span>
                        <span title="Filed grievances">
                          Filed:{" "}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {user.filed_grievances_count}
                          </strong>
                        </span>
                      </div>
                    </td>

                    {/* Actions Menu - Only Toggle Status (Edit & Reset Password Removed) */}
                    <td className="px-4 py-2 whitespace-nowrap text-right">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={() => onToggleActionMenu(user.user_id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs cursor-pointer transition-colors"
                        >
                          <EllipsisVertical className="h-3.5 w-3.5" />
                        </button>

                        {isMenuOpen && (
                          <div
                            ref={actionMenuRef}
                            className="absolute right-0 top-full z-30 mt-1 w-38 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg backdrop-blur-xs"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onToggleStatus(user);
                                onCloseActionMenu();
                              }}
                              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer ${
                                user.status === "ACTIVE"
                                  ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              }`}
                            >
                              {user.status === "ACTIVE" ? (
                                <>
                                  <Power className="h-3.5 w-3.5 text-rose-500" />
                                  <span>Deactivate User</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>Activate User</span>
                                </>
                              )}
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

      {/* Pagination Controls */}
      <div className="shrink-0 pt-2.5">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={filteredUsers.length}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[10, 20, 50]}
          itemLabel="users"
        />
      </div>
    </div>
  );
}
