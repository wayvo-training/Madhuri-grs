"use client";

import { KeyRound, Loader2, Power, Search } from "lucide-react";
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
  permStatusFilter: PermStatusFilter;
  onPermStatusChange: (status: PermStatusFilter) => void;
  togglingPermId: string | null;
  onTogglePermStatus: (perm: SerializedPermission) => void;
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
}: PermissionsTabProps) {
  return (
    <div className="p-5 sm:p-6">
      {/* Controls Bar */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => onPermStatusChange("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              permStatusFilter === "ALL"
                ? "bg-[#064E3B] font-semibold text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Permissions ({permissionsList.length})
          </button>
          <button
            type="button"
            onClick={() => onPermStatusChange("ACTIVE")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              permStatusFilter === "ACTIVE"
                ? "bg-emerald-50 font-semibold text-emerald-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active ({activePermsCount})
          </button>
          <button
            type="button"
            onClick={() => onPermStatusChange("INACTIVE")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              permStatusFilter === "INACTIVE"
                ? "bg-rose-50 font-semibold text-rose-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Inactive ({inactivePermsCount})
          </button>
        </div>

        {/* Permission Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search permissions..."
            value={permSearch}
            onChange={(e) => onPermSearchChange(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Permissions Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-700 font-semibold">
            <tr>
              <th className="px-4 py-3">Permission Code</th>
              <th className="px-4 py-3">Display Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredPermissions.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-xs text-slate-400 italic"
                >
                  No permissions match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredPermissions.map((perm) => {
                const isToggling = togglingPermId === perm.permission_id;

                return (
                  <tr
                    key={perm.permission_id}
                    className="hover:bg-slate-50/70 transition"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      <span className="inline-flex items-center gap-1.5">
                        <KeyRound className="h-3 w-3 text-emerald-700" />
                        {perm.permission_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {perm.permission_name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {perm.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${
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
                      <button
                        type="button"
                        onClick={() => onTogglePermStatus(perm)}
                        disabled={isToggling}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                          perm.status === "ACTIVE"
                            ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-2xs"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-2xs"
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Power className="h-3 w-3" />
                        )}
                        <span>
                          {perm.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
