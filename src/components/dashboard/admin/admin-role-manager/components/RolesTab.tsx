"use client";

import {
  Check,
  ChevronDown,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AdminEmptyState,
  AdminPagination,
} from "@/components/dashboard/admin/admin-shared";
import type {
  RoleStatusFilter,
  SerializedRole,
} from "@/types/admin/role-manager";
import { RoleCard } from "./RoleCard";

interface RolesTabProps {
  roles: SerializedRole[];
  paginatedRoles: SerializedRole[];
  filteredRolesCount: number;
  activeRolesCount: number;
  inactiveRolesCount: number;
  roleSearch: string;
  onRoleSearchChange: (value: string) => void;
  roleStatusFilter: RoleStatusFilter;
  onRoleStatusChange: (status: RoleStatusFilter) => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  togglingRoleId: string | null;
  onEditRole: (role: SerializedRole) => void;
  onToggleRoleStatus: (role: SerializedRole) => void;
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
  togglingRoleId,
  onEditRole,
  onToggleRoleStatus,
}: RolesTabProps) {
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
    key: RoleStatusFilter;
    label: string;
    count: number;
    dotColor?: string;
  }[] = [
    { key: "ALL", label: "All Roles", count: roles.length },
    {
      key: "ACTIVE",
      label: "Active",
      count: activeRolesCount,
      dotColor: "bg-emerald-500",
    },
    {
      key: "INACTIVE",
      label: "Inactive",
      count: inactiveRolesCount,
      dotColor: "bg-rose-500",
    },
  ];

  const activeOption = statusOptions.find((o) => o.key === roleStatusFilter);
  const activeLabel =
    roleStatusFilter !== "ALL" && activeOption
      ? `View: ${activeOption.label}`
      : "View";

  return (
    <div className="p-5 sm:p-6">
      {/* Controls Bar: Search on Left, View Dropdown on Right */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input on the Left */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search roles..."
            value={roleSearch}
            onChange={(e) => onRoleSearchChange(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
          />
          {roleSearch && (
            <button
              type="button"
              onClick={() => onRoleSearchChange("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* View / Status Dropdown Menu on the Right */}
        <div className="flex items-center gap-2">
          {roleStatusFilter !== "ALL" && (
            <button
              type="button"
              onClick={() => onRoleStatusChange("ALL")}
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
                roleStatusFilter !== "ALL"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{activeLabel}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isDropdownOpen && (
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
                      onRoleStatusChange(item.key);
                      setIsDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3.5 py-2 text-xs transition cursor-pointer ${
                      roleStatusFilter === item.key
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
                      {roleStatusFilter === item.key && (
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

      {/* Role Cards Grid */}
      {paginatedRoles.length === 0 ? (
        <AdminEmptyState
          icon={ShieldCheck}
          title="No roles match your filter criteria"
          description="Try adjusting your search query or status filter."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {paginatedRoles.map((role) => (
            <RoleCard
              key={role.role_id}
              role={role}
              isToggling={togglingRoleId === role.role_id}
              onEdit={onEditRole}
              onToggleStatus={onToggleRoleStatus}
            />
          ))}
        </div>
      )}

      {/* Persistent Pagination Footer */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={filteredRolesCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </div>
  );
}
