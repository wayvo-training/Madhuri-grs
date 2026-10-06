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
    <div className="pt-5 sm:pt-6 px-5 sm:px-6">
      <AdminPanelHeader
        title="Roles & Permission Matrix Governance"
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

      {/* Top-Level Tabs */}
      <div className="flex items-center gap-6 mt-2 border-b border-slate-100">
        <button
          type="button"
          onClick={() => onTabChange("roles")}
          className={`flex items-center gap-2 px-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "roles"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Roles Matrix
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === "roles"
                ? "bg-teal-50 text-teal-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {rolesCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("permissions")}
          className={`flex items-center gap-2 px-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "permissions"
              ? "border-[#0F766E] text-[#0F766E]"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <KeyRound className="h-4 w-4" />
          Security Permissions
          <span
            className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              activeTab === "permissions"
                ? "bg-teal-50 text-teal-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {permissionsCount}
          </span>
        </button>
      </div>
    </div>
  );
}
