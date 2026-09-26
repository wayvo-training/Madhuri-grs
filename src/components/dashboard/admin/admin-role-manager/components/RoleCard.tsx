"use client";

import { KeyRound, Loader2, Lock, Pencil, Power, Users } from "lucide-react";
import type { SerializedRole } from "@/types/admin/role-manager";

interface RoleCardProps {
  role: SerializedRole;
  isToggling: boolean;
  onEdit: (role: SerializedRole) => void;
  onToggleStatus: (role: SerializedRole) => void;
}

export function RoleCard({
  role,
  isToggling,
  onEdit,
  onToggleStatus,
}: RoleCardProps) {
  const isAdmin = role.role_name === "ADMIN";

  return (
    <div
      className={`flex flex-col justify-between rounded-xl border p-5 transition ${
        role.status === "ACTIVE"
          ? "border-slate-200/80 bg-slate-50/40 hover:border-slate-300"
          : "border-slate-200/60 bg-slate-100/60 opacity-90"
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                role.status === "ACTIVE"
                  ? "bg-emerald-100 text-[#064E3B]"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {role.role_name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold text-slate-900 truncate">
                  {role.role_name}
                </h3>
                {isAdmin && (
                  <span
                    className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200"
                    title="Core System Role"
                  >
                    <Lock className="h-2.5 w-2.5" />
                    Core
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                {role.description || "No description provided"}
              </p>
            </div>
          </div>

          {/* Status Badge & User count */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ${
                role.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  role.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              {role.status}
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              <Users className="h-3 w-3 text-slate-400" />
              {role.user_count} Users
            </span>
          </div>
        </div>

        {/* Assigned Permissions */}
        <div className="mt-4 pt-3 border-t border-slate-200/60">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Assigned Capabilities ({role.permissions.length})
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {role.permissions.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                No permissions assigned
              </span>
            ) : (
              role.permissions.map((p) => (
                <span
                  key={p.permission_id}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 shadow-2xs"
                >
                  <KeyRound className="h-2.5 w-2.5 text-emerald-700" />
                  {p.permission_code}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Card Action Controls: Edit & Activate/Deactivate */}
      <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-200/60 pt-3">
        <button
          type="button"
          onClick={() => onEdit(role)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition"
        >
          <Pencil className="h-3 w-3 text-emerald-700" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={() => onToggleStatus(role)}
          disabled={isToggling}
          title={
            isAdmin
              ? "System Administrator role cannot be deactivated"
              : role.status === "ACTIVE"
                ? "Deactivate this role"
                : "Activate this role"
          }
          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
            isAdmin && role.status === "ACTIVE"
              ? "border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100/80 shadow-2xs"
              : role.status === "ACTIVE"
                ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-2xs"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-2xs"
          }`}
        >
          {isToggling ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Power className="h-3 w-3" />
          )}
          <span>{role.status === "ACTIVE" ? "Deactivate" : "Activate"}</span>
        </button>
      </div>
    </div>
  );
}
