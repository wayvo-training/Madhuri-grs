"use client";

import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export interface SerializedRole {
  role_id: string;
  role_name: string;
  description: string | null;
  user_count: number;
  permissions: {
    permission_id: string;
    permission_code: string;
    permission_name: string;
  }[];
}

export interface SerializedPermission {
  permission_id: string;
  permission_code: string;
  permission_name: string;
  description: string | null;
}

interface AdminRolesManagerProps {
  initialRoles: SerializedRole[];
  availablePermissions: SerializedPermission[];
}

export function AdminRolesManager({
  initialRoles,
  availablePermissions,
}: AdminRolesManagerProps) {
  const router = useRouter();
  const [roles, setRoles] = useState<SerializedRole[]>(initialRoles);

  const PAGE_SIZE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(roles.length / PAGE_SIZE) || 1;
  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return roles.slice(start, start + PAGE_SIZE);
  }, [roles, currentPage]);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    [],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPermissionIds, setEditPermissionIds] = useState<string[]>([]);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function togglePermission(permId: string) {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId],
    );
  }

  function toggleEditPermission(permId: string) {
    setEditPermissionIds((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId],
    );
  }

  function openEditRoleModal(role: SerializedRole) {
    setEditingRoleId(role.role_id);
    setEditingRoleName(role.role_name);
    setEditDescription(role.description || "");
    setEditPermissionIds(role.permissions.map((p) => p.permission_id));
    setEditFeedback(null);
    setIsEditModalOpen(true);
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_name: newRoleName,
          description: newRoleDescription,
          permission_ids: selectedPermissionIds,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({
          type: "error",
          text: data.message || "Failed to create role.",
        });
        setIsSubmitting(false);
        return;
      }

      const assignedPerms = availablePermissions
        .filter((p) => selectedPermissionIds.includes(p.permission_id))
        .map((p) => ({
          permission_id: p.permission_id,
          permission_code: p.permission_code,
          permission_name: p.permission_name,
        }));

      const newlyAddedRole: SerializedRole = {
        role_id: data.role.role_id,
        role_name: data.role.role_name,
        description: data.role.description,
        user_count: 0,
        permissions: assignedPerms,
      };

      setRoles((prev) => [...prev, newlyAddedRole]);
      setFeedback({
        type: "success",
        text: data.message || "Role created successfully.",
      });

      setTimeout(() => {
        setIsModalOpen(false);
        setNewRoleName("");
        setNewRoleDescription("");
        setSelectedPermissionIds([]);
        setFeedback(null);
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error("Failed to create role:", err);
      setFeedback({
        type: "error",
        text: "An unexpected error occurred while creating role.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveEditRole(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRoleId) return;

    try {
      setIsEditSubmitting(true);
      setEditFeedback(null);

      const res = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id: editingRoleId,
          description: editDescription,
          permission_ids: editPermissionIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setEditFeedback({
          type: "error",
          text: data.message || "Failed to update role.",
        });
        setIsEditSubmitting(false);
        return;
      }

      const updatedPermissions = availablePermissions
        .filter((p) => editPermissionIds.includes(p.permission_id))
        .map((p) => ({
          permission_id: p.permission_id,
          permission_code: p.permission_code,
          permission_name: p.permission_name,
        }));

      setRoles((prev) =>
        prev.map((r) =>
          r.role_id === editingRoleId
            ? {
                ...r,
                description: editDescription,
                permissions: updatedPermissions,
              }
            : r,
        ),
      );

      setEditFeedback({
        type: "success",
        text: "Role updated successfully.",
      });

      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingRoleId(null);
        setEditFeedback(null);
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error("Failed to update role:", err);
      setEditFeedback({
        type: "error",
        text: "An unexpected error occurred while updating role.",
      });
    } finally {
      setIsEditSubmitting(false);
    }
  }

  return (
    <div
      id="roles-permissions"
      className="rounded-2xl border border-slate-200/80 bg-white shadow-xs"
    >
      {/* Header */}
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                Role & Permission Matrix Governance
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Administer system authorization profiles, adjust capability sets,
              or create custom organizational roles.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create New Role</span>
          </button>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {paginatedRoles.map((role) => (
            <div
              key={role.role_id}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 transition hover:border-slate-300"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">
                      {role.role_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-mono text-sm font-bold text-slate-900">
                        {role.role_name}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {role.description || "No description provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                      <Users className="h-3 w-3 text-slate-500" />
                      {role.user_count} Users
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditRoleModal(role)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                      title="Edit Capabilities"
                    >
                      <Pencil className="h-2.5 w-2.5 text-blue-600" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>

                {/* Assigned Permissions */}
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Assigned Capabilities ({role.permissions.length})
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {role.permissions.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">
                        No permissions assigned
                      </span>
                    ) : (
                      role.permissions.map((p) => (
                        <span
                          key={p.permission_id}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700"
                        >
                          <KeyRound className="h-2.5 w-2.5 text-blue-600" />
                          {p.permission_code}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Footer */}
        {roles.length > PAGE_SIZE && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 mt-6 pt-4 text-xs text-slate-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {(currentPage - 1) * PAGE_SIZE + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * PAGE_SIZE, roles.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {roles.length}
              </span>{" "}
              roles
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <span className="px-2 font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Role */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                  <KeyRound className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Create Custom Role
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setFeedback(null);
                }}
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

            <form onSubmit={handleCreateRole} className="mt-4 space-y-4">
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
                    setNewRoleName(
                      e.target.value.toUpperCase().replace(/\s+/g, "_"),
                    )
                  }
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 font-mono text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
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
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700">
                  Assign Permission Capabilities
                </span>
                <p className="text-[11px] text-slate-500">
                  Select which capabilities members of this role are authorized
                  to perform.
                </p>

                <div className="mt-2.5 max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
                  {availablePermissions.map((perm) => {
                    const isChecked = selectedPermissionIds.includes(
                      perm.permission_id,
                    );
                    return (
                      <label
                        key={perm.permission_id}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-lg p-2 transition ${
                          isChecked
                            ? "bg-blue-50/80 text-blue-900"
                            : "hover:bg-slate-100/70 text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.permission_id)}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-mono text-xs font-bold">
                            {perm.permission_code}
                          </p>
                          <p className="text-[11px] text-slate-500">
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
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newRoleName.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
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

      {/* Modal: Edit Existing Role & Permissions */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                  <Pencil className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Role: {editingRoleName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditFeedback(null);
                }}
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

            <form onSubmit={handleSaveEditRole} className="mt-4 space-y-4">
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
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700">
                  Assigned Permission Capabilities
                </span>
                <p className="text-[11px] text-slate-500">
                  Toggle capabilities assigned to users with this role.
                </p>

                <div className="mt-2.5 max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
                  {availablePermissions.map((perm) => {
                    const isChecked = editPermissionIds.includes(
                      perm.permission_id,
                    );
                    return (
                      <label
                        key={perm.permission_id}
                        className={`flex cursor-pointer items-start gap-2.5 rounded-lg p-2 transition ${
                          isChecked
                            ? "bg-blue-50/80 text-blue-900"
                            : "hover:bg-slate-100/70 text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            toggleEditPermission(perm.permission_id)
                          }
                          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-mono text-xs font-bold">
                            {perm.permission_code}
                          </p>
                          <p className="text-[11px] text-slate-500">
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
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
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
    </div>
  );
}
