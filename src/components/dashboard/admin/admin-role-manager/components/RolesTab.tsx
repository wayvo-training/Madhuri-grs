"use client";

import { ShieldCheck } from "lucide-react";
import {
  AdminEmptyState,
  AdminFilterToolbar,
  AdminPagination,
  AdminSearchInput,
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
  return (
    <div className="p-5 sm:p-6">
      {/* Controls Bar: Search & Status Filters */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => onRoleStatusChange("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              roleStatusFilter === "ALL"
                ? "bg-[#064E3B] font-semibold text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Roles ({roles.length})
          </button>
          <button
            type="button"
            onClick={() => onRoleStatusChange("ACTIVE")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              roleStatusFilter === "ACTIVE"
                ? "bg-emerald-50 font-semibold text-emerald-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active ({activeRolesCount})
          </button>
          <button
            type="button"
            onClick={() => onRoleStatusChange("INACTIVE")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              roleStatusFilter === "INACTIVE"
                ? "bg-rose-50 font-semibold text-rose-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Inactive ({inactiveRolesCount})
          </button>
        </div>

        <AdminFilterToolbar>
          <AdminSearchInput
            value={roleSearch}
            onChange={onRoleSearchChange}
            placeholder="Search roles..."
          />
        </AdminFilterToolbar>
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
