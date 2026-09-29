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
          className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-1 ${
            activeTab === "roles"
              ? "bg-[#0F766E] text-white shadow-sm ring-1 ring-[#0F766E]"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 shadow-2xs"
          }`}
        >
          <ShieldCheck
            className={`h-4 w-4 transition-colors ${
              activeTab === "roles" ? "text-white" : "text-slate-400 group-hover:text-teal-600"
            }`}
          />
          <span>Roles Matrix</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === "roles"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {rolesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("permissions")}
          className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-1 ${
            activeTab === "permissions"
              ? "bg-[#0F766E] text-white shadow-sm ring-1 ring-[#0F766E]"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 shadow-2xs"
          }`}
        >
          <KeyRound
            className={`h-4 w-4 transition-colors ${
              activeTab === "permissions" ? "text-white" : "text-slate-400 group-hover:text-teal-600"
            }`}
          />
          <span>Security Permissions</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === "permissions"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {permissionsCount}
          </span>
        </button>
      </div>
    </div>
  );
}
