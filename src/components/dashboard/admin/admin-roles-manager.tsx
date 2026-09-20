"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Loader2,
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
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

  function togglePermission(permId: string) {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId],
    );
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
              Administer system authorization profiles, assign capability sets,
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

                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                    <Users className="h-3 w-3 text-slate-500" />
                    {role.user_count} Users
                  </span>
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

      {/* Create Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Create New System Role
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Define a customized role identity and configure granular
                  operational permissions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateRole}
              className="mt-5 space-y-4 text-xs"
            >
              <div>
                <label
                  htmlFor="role-name-input"
                  className="block font-semibold text-slate-700"
                >
                  Role Identifier (Unique) *
                </label>
                <input
                  id="role-name-input"
                  type="text"
                  placeholder="e.g. COMPLIANCE_OFFICER, AUDITOR, HR_LEAD"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  required
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs font-mono uppercase text-slate-800 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Will be automatically formatted to uppercase with underscores.
                </p>
              </div>

              <div>
                <label
                  htmlFor="role-desc-input"
                  className="block font-semibold text-slate-700"
                >
                  Role Description
                </label>
                <textarea
                  id="role-desc-input"
                  rows={2}
                  placeholder="Summarize the operational scope and intended responsibilities for this role..."
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                />
              </div>

              <div>
                <p className="block font-semibold text-slate-700 mb-2">
                  Select Role Permissions ({selectedPermissionIds.length}{" "}
                  selected)
                </p>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 p-1">
                  {availablePermissions.map((perm) => {
                    const isChecked = selectedPermissionIds.includes(
                      perm.permission_id,
                    );

                    return (
                      <label
                        key={perm.permission_id}
                        className="flex items-start gap-2.5 p-2.5 transition hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePermission(perm.permission_id)}
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="font-bold text-slate-900 font-mono text-[11px]">
                            {perm.permission_code}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {perm.description || perm.permission_name}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {feedback && (
                <div
                  className={`flex items-center gap-2 rounded-lg p-2.5 text-xs font-medium ${
                    feedback.type === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newRoleName.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Creating Role...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create Role</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
