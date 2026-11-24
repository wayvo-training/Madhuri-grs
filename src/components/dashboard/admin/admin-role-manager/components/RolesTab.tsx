"use client";

import { ShieldCheck } from "lucide-react";
import { AdminEmptyState } from "@/components/dashboard/admin/admin-shared";
import { ActionMenu } from "@/components/ui/action-menu";
import {
  AdvancedTableSearch,
  type FilterMode,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import { Pagination } from "@/components/ui/pagination";
import { SortableTh } from "@/components/ui/sortable-table-head";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useTableSort } from "@/hooks/useTableSort";
import { getStandardRoleDisplayName } from "@/lib/role-display";
import type { SerializedRole } from "@/types/admin/role-manager";

interface RolesTabProps {
  roles: SerializedRole[];
  paginatedRoles: SerializedRole[];
  filteredRolesCount: number;
  activeRolesCount: number;
  inactiveRolesCount: number;
  roleSearch: string;
  onRoleSearchChange: (value: string) => void;
  onConditionsChange?: (
    conditions: SearchCondition[],
    mode: FilterMode,
  ) => void;
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
  onConditionsChange,
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

  const handleSearchChange = (conditions: SearchCondition[], mode: string) => {
    if (onConditionsChange) {
      onConditionsChange(conditions, (mode as FilterMode) || "AND");
      return;
    }
    const newStatus: string[] = [];
    let newSearch = "";

    conditions.forEach((condition) => {
      const valArray = Array.isArray(condition.value)
        ? condition.value
        : [condition.value as string];

      if (condition.field === "status") {
        newStatus.push(...valArray);
      } else if (condition.field === "search") {
        newSearch = valArray[0] || newSearch;
      }
    });

    onRoleStatusChange(newStatus);
    onRoleSearchChange(newSearch);
  };

  return (
    <div className="p-4 sm:p-5 flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Controls Bar */}
      <div className="mb-3 shrink-0">
        <AdvancedTableSearch
          fields={filterFields}
          onSearch={handleSearchChange}
          className="w-full"
        />
      </div>

      {/* Roles Table with Row-only Vertical Scrolling */}
      {paginatedRoles.length === 0 ? (
        <AdminEmptyState
          icon={ShieldCheck}
          title="No roles match your filter criteria"
          description="Try adjusting your search query or status filter."
        />
      ) : (
        <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs flex-1 min-h-0 flex flex-col justify-between">
          <div className="overflow-x-auto flex-1 min-h-0 flex flex-col custom-scrollbar">
            <div className="min-w-[850px] flex-1 min-h-0 flex flex-col">
              {/* Header Table (Static, no scrollbar) */}
              <table className="w-full text-left text-sm table-fixed border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[32%]" />
                  <col className="w-[12%]" />
                  <col className="w-[22%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
              </table>

              {/* Scrollable Rows Container (Vertical scroll starts directly below header) */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <table className="w-full text-left text-sm table-fixed">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[32%]" />
                    <col className="w-[12%]" />
                    <col className="w-[22%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                    {sortedItems.map((role) => (
                      <tr
                        key={role.role_id}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="px-4 py-3">
                          <TruncatedText
                            text={getStandardRoleDisplayName(role.role_name)}
                            maxChars={24}
                            className="font-semibold text-slate-900 border-none block truncate max-w-full"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <TruncatedText
                            text={role.description}
                            maxChars={35}
                            className="text-slate-500 border-none block truncate max-w-full"
                          />
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
                        <td className="px-4 py-3">
                          <TruncatedText
                            text={`${role.permissions.length} permissions`}
                            fullText={role.permissions
                              .map((p) => p.permission_name)
                              .join(", ")}
                            maxChars={20}
                            className="text-slate-600 border-none block truncate max-w-full"
                          />
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
            </div>
          </div>

          {/* Solid Pagination Footer */}
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
      )}
    </div>
  );
}
