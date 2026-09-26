"use client";

import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Plus,
  ShieldCheck,
} from "lucide-react";
import {
  AdminPanelHeader,
  AdminToolbarAction,
} from "@/components/dashboard/admin/admin-shared";
import type { RoleManagerTab } from "@/types/admin/role-manager";

interface RoleManagerHeaderProps {
  activeTab: RoleManagerTab;
  onTabChange: (tab: RoleManagerTab) => void;
  onOpenCreateModal: () => void;
  rolesCount: number;
  permissionsCount: number;
  actionNotice: {
    type: "success" | "error";
    text: string;
  } | null;
}

export function RoleManagerHeader({
  activeTab,
  onTabChange,
  onOpenCreateModal,
  rolesCount,
  permissionsCount,
  actionNotice,
}: RoleManagerHeaderProps) {
  return (
    <div className="border-b border-slate-100 p-5 sm:p-6">
      <AdminPanelHeader
        title="Roles & Permission Matrix Governance"
        description="Administer system authorization profiles, toggle active/inactive status, adjust capability sets, or create custom roles."
        action={
          activeTab === "roles" ? (
            <AdminToolbarAction onClick={onOpenCreateModal}>
              <Plus className="h-3.5 w-3.5" />
              <span>Create New Role</span>
            </AdminToolbarAction>
          ) : null
        }
      />

      {/* Global Action Banner */}
      {actionNotice && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-xl border p-3 text-xs animate-in fade-in duration-150 ${
            actionNotice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {actionNotice.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* Top-Level Tabs: Roles vs Permissions */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={() => onTabChange("roles")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "roles"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Roles Matrix</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              activeTab === "roles"
                ? "bg-slate-800 text-slate-200"
                : "bg-slate-200/70 text-slate-600"
            }`}
          >
            {rolesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("permissions")}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeTab === "permissions"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/60"
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span>Security Permissions</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
              activeTab === "permissions"
                ? "bg-slate-800 text-slate-200"
                : "bg-slate-200/70 text-slate-600"
            }`}
          >
            {permissionsCount}
          </span>
        </button>
      </div>
    </div>
  );
}
