"use client";

import { KeyRound, Loader2, Lock, Pencil, X } from "lucide-react";
import type { SerializedPermission } from "@/types/admin/role-manager";

export interface RoleManagerModalsProps {
  isModalOpen: boolean;

  newRoleName: string;
  newRoleDescription: string;

  permissionsList: SerializedPermission[];
  selectedPermissionIds: string[];
  isSubmitting: boolean;
  onCloseCreate: () => void;
  onSubmitCreate: (e: React.FormEvent) => void;
  onSetNewRoleName: (value: string) => void;
  onSetNewRoleDescription: (value: string) => void;

  onTogglePermission: (permissionId: string) => void;
  isEditModalOpen: boolean;
  editingRoleName: string;
  editDescription: string;

  editPermissionIds: string[];

  isEditSubmitting: boolean;
  onCloseEdit: () => void;
  onSubmitEdit: (e: React.FormEvent) => void;
  onSetEditDescription: (value: string) => void;

  onToggleEditPermission: (permissionId: string) => void;
}

export function RoleManagerModals({
  isModalOpen,

  newRoleName,
  newRoleDescription,

  permissionsList,
  selectedPermissionIds,
  isSubmitting,
  onCloseCreate,
  onSubmitCreate,
  onSetNewRoleName,
  onSetNewRoleDescription,

  onTogglePermission,
  isEditModalOpen,
  editingRoleName,
  editDescription,

  editPermissionIds,

  isEditSubmitting,
  onCloseEdit,
  onSubmitEdit,
  onSetEditDescription,

  onToggleEditPermission,
}: RoleManagerModalsProps) {
  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[#F0FDFA] p-1.5 text-[#0F766E]">
                  <KeyRound className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Create Custom Role
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseCreate}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>



            <form onSubmit={onSubmitCreate} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="role-name"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Role Name (Uppercase identifier){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  id="role-name"
                  type="text"
                  required
                  placeholder="e.g. COMPLIANCE_AUDITOR"
                  value={newRoleName}
                  onChange={(e) =>
                    onSetNewRoleName(
                      e.target.value.toUpperCase().replace(/\s+/g, "_"),
                    )
                  }
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 font-mono text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="role-description"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="role-description"
                  rows={2}
                  placeholder="Briefly describe the operational responsibility of this role..."
                  value={newRoleDescription}
                  onChange={(e) => onSetNewRoleDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>

              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700">
                  Assign Permission Capabilities
                </span>
                <p className="text-xs text-slate-500">
                  Select which capabilities members of this role are authorized
                  to perform.
                </p>

                <div className="mt-2.5 max-h-44 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
                  {permissionsList.map((perm) => {
                    const isChecked = selectedPermissionIds.includes(
                      perm.permission_id,
                    );
                    return (
                      <label
                        key={perm.permission_id}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-lg p-2 transition ${
                          isChecked
                            ? "bg-emerald-50/80 text-emerald-950"
                            : "hover:bg-slate-100/70 text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            onTogglePermission(perm.permission_id)
                          }
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-mono text-xs font-bold truncate">
                              {perm.permission_code}
                            </p>
                            {perm.status === "INACTIVE" && (
                              <span className="rounded bg-rose-100 px-1 text-[9px] font-semibold text-rose-700">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {perm.description || perm.permission_name}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={onCloseCreate}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newRoleName.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#115E59] disabled:opacity-50"
                >
                  {isSubmitting && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>Create Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[#F0FDFA] p-1.5 text-[#0F766E]">
                  <Pencil className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Role: {editingRoleName}
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseEdit}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>



            <form onSubmit={onSubmitEdit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="edit-role-description"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Role Description
                </label>
                <textarea
                  id="edit-role-description"
                  rows={2}
                  value={editDescription}
                  onChange={(e) => onSetEditDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>

              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700">
                  Assigned Permission Capabilities
                </span>
                <p className="text-xs text-slate-500">
                  Toggle capabilities assigned to users with this role.
                </p>

                <div className="mt-2.5 max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
                  {permissionsList.map((perm) => {
                    const isChecked = editPermissionIds.includes(
                      perm.permission_id,
                    );
                    return (
                      <label
                        key={perm.permission_id}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-lg p-2 transition ${
                          isChecked
                            ? "bg-emerald-50/80 text-emerald-950"
                            : "hover:bg-slate-100/70 text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            onToggleEditPermission(perm.permission_id)
                          }
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-mono text-xs font-bold truncate">
                              {perm.permission_code}
                            </p>
                            {perm.status === "INACTIVE" && (
                              <span className="rounded bg-rose-100 px-1 text-[9px] font-semibold text-rose-700">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            {perm.description || perm.permission_name}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={onCloseEdit}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#115E59] disabled:opacity-50"
                >
                  {isEditSubmitting && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>Update Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
