"use client";

import { KeyRound, Loader2, Pencil, X } from "lucide-react";
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
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[#F0FDFA] dark:bg-emerald-950/60 p-1.5 text-[#0F766E] dark:text-emerald-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Create Custom Role
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseCreate}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onSubmitCreate} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="role-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
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
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 px-3 font-mono text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div>
                <label
                  htmlFor="role-description"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Description
                </label>
                <textarea
                  id="role-description"
                  rows={2}
                  placeholder="Briefly describe the operational responsibility of this role..."
                  value={newRoleDescription}
                  onChange={(e) => onSetNewRoleDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 p-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div></div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assign Permission Capabilities
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select which capabilities members of this role are authorized
                  to perform.
                </p>

                <div className="mt-2.5 max-h-44 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 p-2.5">
                  {permissionsList.map((perm) => {
                    const isChecked = selectedPermissionIds.includes(
                      perm.permission_id,
                    );
                    return (
                      <label
                        key={perm.permission_id}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-lg p-2 transition ${
                          isChecked
                            ? "bg-emerald-50/80 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-300 border border-transparent dark:border-emerald-800/50"
                            : "hover:bg-slate-100/70 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            onTogglePermission(perm.permission_id)
                          }
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 dark:bg-slate-800"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-mono text-xs font-bold truncate">
                              {perm.permission_code}
                            </p>
                            {perm.status === "INACTIVE" && (
                              <span className="rounded bg-rose-100 dark:bg-rose-950/60 px-1 text-[9px] font-semibold text-rose-700 dark:text-rose-400">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {perm.description || perm.permission_name}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={onCloseCreate}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition"
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
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[#F0FDFA] dark:bg-emerald-950/60 p-1.5 text-[#0F766E] dark:text-emerald-400">
                  <Pencil className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Edit Role: {editingRoleName}
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseEdit}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onSubmitEdit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="edit-role-description"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Role Description
                </label>
                <textarea
                  id="edit-role-description"
                  rows={2}
                  value={editDescription}
                  onChange={(e) => onSetEditDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/80 p-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <div></div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assigned Permission Capabilities
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Toggle capabilities assigned to users with this role.
                </p>

                <div className="mt-2.5 max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 p-2.5">
                  {permissionsList.map((perm) => {
                    const isChecked = editPermissionIds.includes(
                      perm.permission_id,
                    );
                    return (
                      <label
                        key={perm.permission_id}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-lg p-2 transition ${
                          isChecked
                            ? "bg-emerald-50/80 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-300 border border-transparent dark:border-emerald-800/50"
                            : "hover:bg-slate-100/70 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            onToggleEditPermission(perm.permission_id)
                          }
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 dark:bg-slate-800"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-mono text-xs font-bold truncate">
                              {perm.permission_code}
                            </p>
                            {perm.status === "INACTIVE" && (
                              <span className="rounded bg-rose-100 dark:bg-rose-950/60 px-1 text-[9px] font-semibold text-rose-700 dark:text-rose-400">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {perm.description || perm.permission_name}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={onCloseEdit}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition"
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
