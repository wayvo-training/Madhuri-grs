"use client";

import { ActionMenu } from "@/components/ui/action-menu";
import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import { Pagination } from "@/components/ui/pagination";
import { SortableTh } from "@/components/ui/sortable-table-head";
import { useTableSort } from "@/hooks/useTableSort";
import type {
  PermStatusFilter,
  SerializedPermission,
} from "@/types/admin/role-manager";

interface PermissionsTabProps {
  permissionsList: SerializedPermission[];
  filteredPermissions: SerializedPermission[];
  activePermsCount: number;
  inactivePermsCount: number;
  permSearch: string;
  onPermSearchChange: (value: string) => void;
  permStatusFilter: string[];
  onPermStatusChange: (statuses: string[]) => void;
  togglingPermId: string | null;
  onTogglePermStatus: (perm: SerializedPermission) => void;
  paginatedPermissions: SerializedPermission[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onTabChange: (tab: "roles" | "permissions") => void;
}

export function PermissionsTab({
  permissionsList,
  filteredPermissions,
  activePermsCount,
  inactivePermsCount,
  permSearch,
  onPermSearchChange,
  permStatusFilter,
  onPermStatusChange,
  togglingPermId,
  onTogglePermStatus,
  paginatedPermissions,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onTabChange,
}: PermissionsTabProps) {
  const { sortState, handleSort, sortedItems } = useTableSort(
    paginatedPermissions,
    { field: "permission_code", direction: "asc" },
  );

  const filterFields: SearchFieldDef[] = [
    { id: "permission_code", label: "Permission Code", type: "text" },
    { id: "permission_name", label: "Display Name", type: "text" },
    { id: "description", label: "Description", type: "text" },
    {
      id: "status",
      label: "Status",
      type: "select",
      options: [
        { label: `Active (${activePermsCount})`, value: "ACTIVE" },
        { label: `Inactive (${inactivePermsCount})`, value: "INACTIVE" },
      ],
    },
  ];

  const handleSearchChange = (conditions: SearchCondition[], mode: string) => {
    onPermStatusChange([]);
    onPermSearchChange("");

    let newStatus: string[] = [];
    let newSearch = "";

    conditions.forEach((condition) => {
      let valArray = Array.isArray(condition.value) ? condition.value : [condition.value as string];

      if (condition.field === "status") {
        newStatus.push(...valArray);
      } else {
        newSearch = valArray[0] || newSearch;
      }
    });

    if (newStatus.length > 0) onPermStatusChange(newStatus);
    if (newSearch) onPermSearchChange(newSearch);
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

      {/* Permissions Table */}
      <div className="overflow-x-auto bg-transparent">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <tr>
              <SortableTh
                field="permission_code"
                currentSort={sortState}
                onSort={handleSort}
                className="px-4 py-3"
              >
                Permission Code
              </SortableTh>
              <SortableTh
                field="permission_name"
                currentSort={sortState}
                onSort={handleSort}
                className="px-4 py-3"
              >
                Display Name
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
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
            {filteredPermissions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-sm text-slate-400 italic"
                >
                  No permissions match the selected filter criteria.
                </td>
              </tr>
            ) : (
              sortedItems.map((perm) => {
                const _isToggling = togglingPermId === perm.permission_id;

                return (
                  <tr
                    key={perm.permission_id}
                    className="hover:bg-slate-50/70 transition"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {perm.permission_code}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {perm.permission_name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {perm.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-semibold ${
                          perm.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            perm.status === "ACTIVE"
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                          }`}
                        />
                        {perm.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu widthClass="w-36" items={[]} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={filteredPermissions.length}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[5, 10, 20, 50]}
          itemLabel="permissions"
        />
      </div>
    </div>
  );
}
