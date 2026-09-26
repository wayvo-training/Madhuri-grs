"use client";

import { KeyRound, Loader2, Lock, Pencil, X } from "lucide-react";
import type { SerializedPermission } from "@/types/admin/role-manager";

export interface RoleManagerModalsProps {
  isModalOpen: boolean;
  feedback: { type: "success" | "error"; text: string } | null;
  newRoleName: string;
  newRoleDescription: string;
  newRoleStatus: "ACTIVE" | "INACTIVE";
  permissionsList: SerializedPermission[];
  selectedPermissionIds: string[];
  isSubmitting: boolean;
  onCloseCreate: () => void;
  onSubmitCreate: (e: React.FormEvent) => void;
  onSetNewRoleName: (value: string) => void;
  onSetNewRoleDescription: (value: string) => void;
  onSetNewRoleStatus: (value: "ACTIVE" | "INACTIVE") => void;
  onTogglePermission: (permissionId: string) => void;
  isEditModalOpen: boolean;
  editingRoleName: string;
  editDescription: string;
  editStatus: "ACTIVE" | "INACTIVE";
  editPermissionIds: string[];
  editFeedback: { type: "success" | "error"; text: string } | null;
  isEditSubmitting: boolean;
  onCloseEdit: () => void;
  onSubmitEdit: (e: React.FormEvent) => void;
  onSetEditDescription: (value: string) => void;
  onSetEditStatus: (value: "ACTIVE" | "INACTIVE") => void;
  onToggleEditPermission: (permissionId: string) => void;
}

export function RoleManagerModals({
  isModalOpen,
  feedback,
  newRoleName,
  newRoleDescription,
  newRoleStatus,
  permissionsList,
  selectedPermissionIds,
  isSubmitting,
  onCloseCreate,
  onSubmitCreate,
  onSetNewRoleName,
  onSetNewRoleDescription,
  onSetNewRoleStatus,
  onTogglePermission,
  isEditModalOpen,
  editingRoleName,
  editDescription,
  editStatus,
  editPermissionIds,
  editFeedback,
  isEditSubmitting,
  onCloseEdit,
  onSubmitEdit,
  onSetEditDescription,
  onSetEditStatus,
  onToggleEditPermission,
}: RoleManagerModalsProps) {
  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-50 p-1.5 text-[#064E3B]">
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

            {feedback && (
              <div
                className={`mt-4 rounded-xl border p-3 text-xs ${
                  feedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {feedback.text}
              </div>
            )}

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
                <span className="block text-xs font-semibold text-slate-700">
                  Role Status <span className="text-rose-500">*</span>
                </span>
                <p className="text-xs text-slate-500 mb-2">
                  Configure whether this role is immediately operational for
                  users.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onSetNewRoleStatus("ACTIVE")}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                      newRoleStatus === "ACTIVE"
                        ? "border-emerald-300 bg-emerald-50/60 text-emerald-800 ring-1 ring-emerald-400"
                        : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100/70"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <p className="font-bold">Active</p>
                      <p className="text-xs font-normal text-slate-500">
                        Can be assigned to users
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSetNewRoleStatus("INACTIVE")}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                      newRoleStatus === "INACTIVE"
                        ? "border-rose-300 bg-rose-50/60 text-rose-800 ring-1 ring-rose-400"
                        : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100/70"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                    <div>
                      <p className="font-bold">Inactive</p>
                      <p className="text-xs font-normal text-slate-500">
                        Suspended / Unavailable
                      </p>
                    </div>
                  </button>
                </div>
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800 disabled:opacity-50"
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
                <div className="rounded-lg bg-emerald-50 p-1.5 text-[#064E3B]">
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

            {editFeedback && (
              <div
                className={`mt-4 rounded-xl border p-3 text-xs ${
                  editFeedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {editFeedback.text}
              </div>
            )}

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
                <span className="block text-xs font-semibold text-slate-700">
                  Role Status <span className="text-rose-500">*</span>
                </span>
                <p className="text-xs text-slate-500 mb-2">
                  Toggle whether this role is active in user assignment and
                  runtime authentication.
                </p>

                {editingRoleName === "ADMIN" ? (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-2.5 text-xs text-amber-800">
                    <Lock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      The <strong>ADMIN</strong> system role must always remain{" "}
                      <strong>ACTIVE</strong> to prevent admin lockout.
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => onSetEditStatus("ACTIVE")}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                        editStatus === "ACTIVE"
                          ? "border-emerald-300 bg-emerald-50/60 text-emerald-800 ring-1 ring-emerald-400"
                          : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100/70"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <p className="font-bold">Active</p>
                        <p className="text-xs font-normal text-slate-500">
                          Role enabled for users
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSetEditStatus("INACTIVE")}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                        editStatus === "INACTIVE"
                          ? "border-rose-300 bg-rose-50/60 text-rose-800 ring-1 ring-rose-400"
                          : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100/70"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                      <div>
                        <p className="font-bold">Inactive</p>
                        <p className="text-xs font-normal text-slate-500">
                          Suspended / Unavailable
                        </p>
                      </div>
                    </button>
                  </div>
                )}
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800 disabled:opacity-50"
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
