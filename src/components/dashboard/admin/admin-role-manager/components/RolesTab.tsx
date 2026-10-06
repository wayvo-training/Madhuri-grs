"use client";

import { ShieldCheck } from "lucide-react";
import { AdminEmptyState } from "@/components/dashboard/admin/admin-shared";
import { ActionMenu } from "@/components/ui/action-menu";
import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import { Pagination } from "@/components/ui/pagination";
import { SortableTh } from "@/components/ui/sortable-table-head";
import { useTableSort } from "@/hooks/useTableSort";
import type { SerializedRole } from "@/types/admin/role-manager";

interface RolesTabProps {
  roles: SerializedRole[];
  paginatedRoles: SerializedRole[];
  filteredRolesCount: number;
  activeRolesCount: number;
  inactiveRolesCount: number;
  roleSearch: string;
  onRoleSearchChange: (value: string) => void;
  roleStatusFilter: string[];
  onRoleStatusChange: (statuses: string[]) => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  togglingRoleId: string | null;
  onEditRole: (role: SerializedRole) => void;
  onToggleRoleStatus: (role: SerializedRole) => void;
  onTabChange: (tab: "roles" | "permissions") => void;
}

export function RolesTab({
  roles,
  paginatedRoles,
  filteredRolesCount,
  activeRolesCount,
  inactiveRolesCount,
  roleSearch,
  onRoleSearchChange,
  roleStatusFilter,
  onRoleStatusChange,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  togglingRoleId,
  onEditRole,
  onToggleRoleStatus,
  onTabChange,
}: RolesTabProps) {
  const { sortState, handleSort, sortedItems } = useTableSort(paginatedRoles, {
    field: "role_name",
    direction: "asc",
  });

  const filterFields: SearchFieldDef[] = [
    { id: "role_name", label: "Role Name", type: "text" },
    { id: "description", label: "Description", type: "text" },
    { id: "permissions", label: "Permissions", type: "text" },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { label: `Active (${activeRolesCount})`, value: "ACTIVE" },
        { label: `Inactive (${inactiveRolesCount})`, value: "INACTIVE" },
      ],
    },
  ];

  const handleSearchChange = (conditions: SearchCondition[], _mode: string) => {
    onRoleStatusChange([]);
    onRoleSearchChange("");

    const newStatus: string[] = [];
    let newSearch = "";

    conditions.forEach((condition) => {
      const valArray = Array.isArray(condition.value)
        ? condition.value
        : [condition.value as string];

      if (condition.field === "status") {
        newStatus.push(...valArray);
      } else {
        newSearch = valArray[0] || newSearch;
      }
    });

    if (newStatus.length > 0) onRoleStatusChange(newStatus);
    if (newSearch) onRoleSearchChange(newSearch);
  };

  return (
    <div className="p-5 sm:p-6">
      {/* Controls Bar */}
      <div className="mb-5">
        <AdvancedTableSearch
          fields={filterFields}
          onSearch={handleSearchChange}
          className="w-full"
        />
      </div>

      {/* Roles Table */}
      {paginatedRoles.length === 0 ? (
        <AdminEmptyState
          icon={ShieldCheck}
          title="No roles match your filter criteria"
          description="Try adjusting your search query or status filter."
        />
      ) : (
        <div className="overflow-x-auto bg-transparent mb-6">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <SortableTh
                  field="role_name"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-4 py-3"
                >
                  Role Name
                </SortableTh>
                <SortableTh
                  field="description"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-4 py-3"
                >
                  Description
                </SortableTh>
                <SortableTh
                  field="status"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-4 py-3"
                >
                  Status
                </SortableTh>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {sortedItems.map((role) => (
                <tr
                  key={role.role_id}
                  className="hover:bg-slate-50/70 transition"
                >
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {role.role_name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {role.description || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[13px] font-semibold ${
                        role.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          role.status === "ACTIVE"
                            ? "bg-emerald-500"
                            : "bg-slate-400"
                        }`}
                      />
                      {role.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {role.permissions.length} permissions
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end">
                      <ActionMenu
                        widthClass="w-36"
                        items={[
                          {
                            label: "Edit",
                            icon: <ShieldCheck className="h-3.5 w-3.5" />,
                            onClick: () => onEditRole(role),
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={filteredRolesCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        pageSizeOptions={[5, 10, 20, 50]}
        itemLabel="roles"
      />
    </div>
  );
}
