"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Power,
  Search,
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
  status: "ACTIVE" | "INACTIVE";
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
  status: "ACTIVE" | "INACTIVE";
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
  const [permissionsList, setPermissionsList] =
    useState<SerializedPermission[]>(availablePermissions);

  // Active top-level tab: "roles" | "permissions"
  const [activeTab, setActiveTab] = useState<"roles" | "permissions">("roles");

  // Filter & Search states for Roles
  const [roleSearch, setRoleSearch] = useState("");
  const [roleStatusFilter, setRoleStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");

  // Filter & Search states for Permissions
  const [permSearch, setPermSearch] = useState("");
  const [permStatusFilter, setPermStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");

  // Global action loading indicators
  const [togglingRoleId, setTogglingRoleId] = useState<string | null>(null);
  const [togglingPermId, setTogglingPermId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Pagination for Roles
  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchesSearch =
        role.role_name.toLowerCase().includes(roleSearch.toLowerCase()) ||
        Boolean(
          role.description?.toLowerCase().includes(roleSearch.toLowerCase()),
        );

      const matchesStatus =
        roleStatusFilter === "ALL" || role.status === roleStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [roles, roleSearch, roleStatusFilter]);

  const totalPages = Math.ceil(filteredRoles.length / PAGE_SIZE) || 1;
  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRoles.slice(start, start + PAGE_SIZE);
  }, [filteredRoles, currentPage]);

  // Counts for role status tabs
  const activeRolesCount = useMemo(
    () => roles.filter((r) => r.status === "ACTIVE").length,
    [roles],
  );
  const inactiveRolesCount = useMemo(
    () => roles.filter((r) => r.status === "INACTIVE").length,
    [roles],
  );

  // Filtered Permissions for registry tab
  const filteredPermissions = useMemo(() => {
    return permissionsList.filter((perm) => {
      const matchesSearch =
        perm.permission_code.toLowerCase().includes(permSearch.toLowerCase()) ||
        perm.permission_name.toLowerCase().includes(permSearch.toLowerCase()) ||
        Boolean(
          perm.description?.toLowerCase().includes(permSearch.toLowerCase()),
        );

      const matchesStatus =
        permStatusFilter === "ALL" || perm.status === permStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [permissionsList, permSearch, permStatusFilter]);

  const activePermsCount = useMemo(
    () => permissionsList.filter((p) => p.status === "ACTIVE").length,
    [permissionsList],
  );
  const inactivePermsCount = useMemo(
    () => permissionsList.filter((p) => p.status === "INACTIVE").length,
    [permissionsList],
  );

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRoleStatus, setNewRoleStatus] = useState<"ACTIVE" | "INACTIVE">(
    "ACTIVE",
  );
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
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
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
    setEditStatus(role.status);
    setEditPermissionIds(role.permissions.map((p) => p.permission_id));
    setEditFeedback(null);
    setIsEditModalOpen(true);
  }

  // Toggle Role Status (ACTIVE <-> INACTIVE)
  async function handleToggleRoleStatus(role: SerializedRole) {
    if (role.role_name === "ADMIN") {
      setActionNotice({
        type: "error",
        text: "The System Administrator (ADMIN) role cannot be deactivated.",
      });
      setTimeout(() => setActionNotice(null), 4000);
      return;
    }

    const nextStatus = role.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      setTogglingRoleId(role.role_id);
      setActionNotice(null);

      const res = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role_id: role.role_id,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionNotice({
          type: "error",
          text: data.message || "Failed to update role status.",
        });
        return;
      }

      setRoles((prev) =>
        prev.map((r) =>
          r.role_id === role.role_id ? { ...r, status: nextStatus } : r,
        ),
      );

      setActionNotice({
        type: "success",
        text: `Role '${role.role_name}' is now ${nextStatus}.`,
      });
      setTimeout(() => setActionNotice(null), 3000);
      router.refresh();
    } catch (err) {
      console.error("Failed to toggle role status:", err);
      setActionNotice({
        type: "error",
        text: "An unexpected error occurred while toggling role status.",
      });
    } finally {
      setTogglingRoleId(null);
    }
  }

  // Toggle Permission Status (ACTIVE <-> INACTIVE)
  async function handleTogglePermStatus(perm: SerializedPermission) {
    const nextStatus = perm.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      setTogglingPermId(perm.permission_id);
      setActionNotice(null);

      const res = await fetch("/api/admin/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permission_id: perm.permission_id,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionNotice({
          type: "error",
          text: data.message || "Failed to update permission status.",
        });
        return;
      }

      setPermissionsList((prev) =>
        prev.map((p) =>
          p.permission_id === perm.permission_id
            ? { ...p, status: nextStatus }
            : p,
        ),
      );

      setActionNotice({
        type: "success",
        text: `Permission '${perm.permission_code}' is now ${nextStatus}.`,
      });
      setTimeout(() => setActionNotice(null), 3000);
      router.refresh();
    } catch (err) {
      console.error("Failed to toggle permission status:", err);
      setActionNotice({
        type: "error",
        text: "An unexpected error occurred while toggling permission status.",
      });
    } finally {
      setTogglingPermId(null);
    }
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
          status: newRoleStatus,
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

      const assignedPerms = permissionsList
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
        status: data.role.status || newRoleStatus,
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
        setNewRoleStatus("ACTIVE");
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
          status: editStatus,
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

      const updatedPermissions = permissionsList
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
                status: editStatus,
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
              <span className="rounded-lg bg-emerald-50 p-1.5 text-[#064E3B]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                Roles & Permission Matrix Governance
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Administer system authorization profiles, toggle active/inactive
              status, adjust capability sets, or create custom roles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "roles" && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create New Role</span>
              </button>
            )}
          </div>
        </div>

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
            onClick={() => setActiveTab("roles")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "roles"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Roles Matrix</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "roles"
                  ? "bg-slate-800 text-slate-200"
                  : "bg-slate-200/70 text-slate-600"
              }`}
            >
              {roles.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("permissions")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "permissions"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100/70 text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Security Permissions</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeTab === "permissions"
                  ? "bg-slate-800 text-slate-200"
                  : "bg-slate-200/70 text-slate-600"
              }`}
            >
              {permissionsList.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: ROLES MATRIX */}
      {activeTab === "roles" && (
        <div className="p-5 sm:p-6">
          {/* Controls Bar: Search & Status Filters */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => {
                  setRoleStatusFilter("ALL");
                  setCurrentPage(1);
                }}
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
                onClick={() => {
                  setRoleStatusFilter("ACTIVE");
                  setCurrentPage(1);
                }}
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
                onClick={() => {
                  setRoleStatusFilter("INACTIVE");
                  setCurrentPage(1);
                }}
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

            {/* Role Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search roles..."
                value={roleSearch}
                onChange={(e) => {
                  setRoleSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Role Cards Grid */}
          {paginatedRoles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-slate-700">
                No roles match your filter criteria
              </p>
              <p className="text-[11px] text-slate-400">
                Try adjusting your search query or status filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {paginatedRoles.map((role) => {
                const isToggling = togglingRoleId === role.role_id;
                const isAdmin = role.role_name === "ADMIN";

                return (
                  <div
                    key={role.role_id}
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
                                  className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200"
                                  title="Core System Role"
                                >
                                  <Lock className="h-2.5 w-2.5" />
                                  Core
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {role.description || "No description provided"}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge & User count */}
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          {/* Active / Inactive Status Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              role.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                role.status === "ACTIVE"
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            {role.status}
                          </span>

                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                            <Users className="h-3 w-3 text-slate-400" />
                            {role.user_count} Users
                          </span>
                        </div>
                      </div>

                      {/* Assigned Permissions */}
                      <div className="mt-4 pt-3 border-t border-slate-200/60">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Assigned Capabilities ({role.permissions.length})
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {role.permissions.length === 0 ? (
                            <span className="text-[11px] text-slate-400 italic">
                              No permissions assigned
                            </span>
                          ) : (
                            role.permissions.map((p) => (
                              <span
                                key={p.permission_id}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-700 shadow-2xs"
                              >
                                <KeyRound className="h-2.5 w-2.5 text-emerald-700" />
                                {p.permission_code}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Action Controls: Edit & Activate/Deactivate (Delete not included) */}
                    <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-200/60 pt-3">
                      {/* Edit capabilities & details */}
                      <button
                        type="button"
                        onClick={() => openEditRoleModal(role)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                      >
                        <Pencil className="h-3 w-3 text-emerald-700" />
                        <span>Edit</span>
                      </button>

                      {/* Activate / Deactivate Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleRoleStatus(role)}
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
                        <span>
                          {role.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Persistent Pagination Footer */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 mt-6 pt-4 text-xs text-slate-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredRoles.length === 0
                  ? 0
                  : (currentPage - 1) * PAGE_SIZE + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * PAGE_SIZE, filteredRoles.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {filteredRoles.length}
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
        </div>
      )}

      {/* TAB CONTENT 2: SECURITY PERMISSIONS REGISTRY */}
      {activeTab === "permissions" && (
        <div className="p-5 sm:p-6">
          {/* Controls Bar */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setPermStatusFilter("ALL")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  permStatusFilter === "ALL"
                    ? "bg-[#064E3B] font-semibold text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                All Permissions ({permissionsList.length})
              </button>
              <button
                type="button"
                onClick={() => setPermStatusFilter("ACTIVE")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  permStatusFilter === "ACTIVE"
                    ? "bg-emerald-50 font-semibold text-emerald-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active ({activePermsCount})
              </button>
              <button
                type="button"
                onClick={() => setPermStatusFilter("INACTIVE")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  permStatusFilter === "INACTIVE"
                    ? "bg-rose-50 font-semibold text-rose-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Inactive ({inactivePermsCount})
              </button>
            </div>

            {/* Permission Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search permissions..."
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Permissions Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-700 font-semibold">
                <tr>
                  <th className="px-4 py-3">Permission Code</th>
                  <th className="px-4 py-3">Display Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPermissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-xs text-slate-400 italic"
                    >
                      No permissions match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPermissions.map((perm) => {
                    const isToggling = togglingPermId === perm.permission_id;

                    return (
                      <tr
                        key={perm.permission_id}
                        className="hover:bg-slate-50/70 transition"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          <span className="inline-flex items-center gap-1.5">
                            <KeyRound className="h-3 w-3 text-emerald-700" />
                            {perm.permission_code}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {perm.permission_name}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {perm.description || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                              perm.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                perm.status === "ACTIVE"
                                  ? "bg-emerald-500"
                                  : "bg-rose-500"
                              }`}
                            />
                            {perm.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleTogglePermStatus(perm)}
                            disabled={isToggling}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                              perm.status === "ACTIVE"
                                ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-2xs"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shadow-2xs"
                            }`}
                          >
                            {isToggling ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Power className="h-3 w-3" />
                            )}
                            <span>
                              {perm.status === "ACTIVE"
                                ? "Deactivate"
                                : "Activate"}
                            </span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Role */}
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
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              {/* Status Selection (Active / Inactive) */}
              <div>
                <span className="block text-xs font-semibold text-slate-700">
                  Role Status <span className="text-rose-500">*</span>
                </span>
                <p className="text-[11px] text-slate-500 mb-2">
                  Configure whether this role is immediately operational for
                  users.
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewRoleStatus("ACTIVE")}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                      newRoleStatus === "ACTIVE"
                        ? "border-emerald-300 bg-emerald-50/60 text-emerald-800 ring-1 ring-emerald-400"
                        : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100/70"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <p className="font-bold">Active</p>
                      <p className="text-[10px] font-normal text-slate-500">
                        Can be assigned to users
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRoleStatus("INACTIVE")}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                      newRoleStatus === "INACTIVE"
                        ? "border-rose-300 bg-rose-50/60 text-rose-800 ring-1 ring-rose-400"
                        : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100/70"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                    <div>
                      <p className="font-bold">Inactive</p>
                      <p className="text-[10px] font-normal text-slate-500">
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
                <p className="text-[11px] text-slate-500">
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
                          onChange={() => togglePermission(perm.permission_id)}
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

      {/* Modal: Edit Existing Role & Permissions */}
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
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              {/* Status Selection (Active / Inactive) */}
              <div>
                <span className="block text-xs font-semibold text-slate-700">
                  Role Status <span className="text-rose-500">*</span>
                </span>
                <p className="text-[11px] text-slate-500 mb-2">
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
                      onClick={() => setEditStatus("ACTIVE")}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                        editStatus === "ACTIVE"
                          ? "border-emerald-300 bg-emerald-50/60 text-emerald-800 ring-1 ring-emerald-400"
                          : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100/70"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <p className="font-bold">Active</p>
                        <p className="text-[10px] font-normal text-slate-500">
                          Role enabled for users
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditStatus("INACTIVE")}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                        editStatus === "INACTIVE"
                          ? "border-rose-300 bg-rose-50/60 text-rose-800 ring-1 ring-rose-400"
                          : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100/70"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                      <div>
                        <p className="font-bold">Inactive</p>
                        <p className="text-[10px] font-normal text-slate-500">
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
                <p className="text-[11px] text-slate-500">
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
                            toggleEditPermission(perm.permission_id)
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
    </div>
  );
}
