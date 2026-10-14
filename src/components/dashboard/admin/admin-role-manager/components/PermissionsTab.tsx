import { Power, PowerOff } from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import { Pagination } from "@/components/ui/pagination";
import { SortableTh } from "@/components/ui/sortable-table-head";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useTableSort } from "@/hooks/useTableSort";
import type { SerializedPermission } from "@/types/admin/role-manager";

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
  permissionsList: _permissionsList,
  filteredPermissions,
  activePermsCount,
  inactivePermsCount,
  permSearch: _permSearch,
  onPermSearchChange,
  permStatusFilter: _permStatusFilter,
  onPermStatusChange,
  togglingPermId,
  onTogglePermStatus,
  paginatedPermissions,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onTabChange: _onTabChange,
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

  const handleSearchChange = (conditions: SearchCondition[], _mode: string) => {
    onPermStatusChange([]);
    onPermSearchChange("");

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

    if (newStatus.length > 0) onPermStatusChange(newStatus);
    if (newSearch) onPermSearchChange(newSearch);
  };

  const colGroup = (
    <colgroup>
      <col className="w-[22%]" />
      <col className="w-[24%]" />
      <col className="w-[32%]" />
      <col className="w-[12%]" />
      <col className="w-[10%]" />
    </colgroup>
  );

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

      {/* Permissions Table with Row-only Vertical Scrolling */}
      <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[850px]">
            {/* Header Table (Static, no scrollbar) */}
            <table className="w-full text-left text-sm table-fixed border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
              {colGroup}
              <thead className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
            </table>

            {/* Scrollable Rows Container (Vertical scroll starts directly below header) */}
            <div className="max-h-[420px] overflow-y-auto overflow-x-hidden custom-scrollbar">
              <table className="w-full text-left text-sm table-fixed">
                {colGroup}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {filteredPermissions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-sm text-slate-400 italic"
                      >
                        No permissions match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    sortedItems.map((perm) => {
                      const isToggling = togglingPermId === perm.permission_id;

                      return (
                        <tr
                          key={perm.permission_id}
                          className="hover:bg-slate-50/70 transition"
                        >
                          <td className="px-4 py-3">
                            <TruncatedText
                              text={perm.permission_code}
                              maxChars={20}
                              className="font-mono font-bold text-slate-900 border-none block truncate max-w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <TruncatedText
                              text={perm.permission_name}
                              maxChars={24}
                              className="font-medium text-slate-800 border-none block truncate max-w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <TruncatedText
                              text={perm.description}
                              maxChars={35}
                              className="text-slate-500 border-none block truncate max-w-full"
                            />
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
                            <div className="flex items-center justify-end">
                              <ActionMenu
                                widthClass="w-36"
                                items={[
                                  {
                                    label:
                                      perm.status === "ACTIVE"
                                        ? "Deactivate"
                                        : "Activate",
                                    icon:
                                      perm.status === "ACTIVE" ? (
                                        <PowerOff className="h-3.5 w-3.5" />
                                      ) : (
                                        <Power className="h-3.5 w-3.5" />
                                      ),
                                    variant:
                                      perm.status === "ACTIVE"
                                        ? "danger"
                                        : "primary",
                                    disabled: isToggling,
                                    onClick: () => onTogglePermStatus(perm),
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
          </div>
        </div>

        {/* Solid Pagination Footer */}
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
