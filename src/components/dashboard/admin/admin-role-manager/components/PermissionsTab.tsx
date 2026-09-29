"use client";

import {
  Check,
  ChevronDown,
  KeyRound,
  Loader2,
  Power,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  PermStatusFilter,
  SerializedPermission,
} from "@/types/admin/role-manager";
import { ActionMenu } from "@/components/ui/action-menu";
import { Pagination } from "@/components/ui/pagination";

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
  paginatedPermissions: SerializedPermission[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
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
}: PermissionsTabProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const statusOptions: {
    key: PermStatusFilter;
    label: string;
    count: number;
    dotColor?: string;
  }[] = [
    { key: "ALL", label: "All Permissions", count: permissionsList.length },
    {
      key: "ACTIVE",
      label: "Active",
      count: activePermsCount,
      dotColor: "bg-emerald-500",
    },
    {
      key: "INACTIVE",
      label: "Inactive",
      count: inactivePermsCount,
      dotColor: "bg-rose-500",
    },
  ];

  const activeOption = statusOptions.find((o) => o.key === permStatusFilter);
  const activeLabel =
    permStatusFilter !== "ALL" && activeOption
      ? `View: ${activeOption.label}`
      : "View";

  return (
    <div className="p-5 sm:p-6">
      {/* Controls Bar: Search on Left, View Dropdown on Right */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Permission Search on the Left */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search permissions by name, key, or category..."
            value={permSearch}
            onChange={(e) => onPermSearchChange(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
          />
          {permSearch && (
            <button
              type="button"
              onClick={() => onPermSearchChange("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* View / Status Dropdown Menu on the Right */}
        <div className="flex items-center gap-2">
          {permStatusFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => onPermStatusChange("ALL")}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}

          <div className="relative inline-block" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                permStatusFilter !== "ALL"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{activeLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  View ▾
                </div>
                <div className="border-t border-slate-100 my-1" />
                {statusOptions.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      onPermStatusChange(item.key);
                      setIsDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3.5 py-2 text-xs transition cursor-pointer ${
                      permStatusFilter === item.key
                        ? "bg-emerald-50/80 font-semibold text-emerald-900"
                        : "font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.dotColor && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${item.dotColor}`}
                        />
                      )}
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-normal text-slate-400">
                        ({item.count})
                      </span>
                      {permStatusFilter === item.key && (
                        <Check className="h-3.5 w-3.5 text-emerald-700" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
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
              paginatedPermissions.map((perm) => {
                const isToggling = togglingPermId === perm.permission_id;

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
                      <ActionMenu
                        widthClass="w-36"
                        items={[
                        ]}
                      />
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
