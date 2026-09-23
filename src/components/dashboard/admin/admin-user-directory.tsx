"use client";

import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export interface SerializedUser {
  user_id: string;
  employee_code: string;
  first_name: string;
  last_name: string | null;
  email: string;
  role_name: string;
  role_id?: string;
  department_name: string | null;
  department_id?: string | null;
  status: string;
  created_at: string;
}

interface AdminUserDirectoryProps {
  initialUsers: SerializedUser[];
  initialTotalCount?: number;
  departments: { department_id: string; department_name: string }[];
  roles?: { role_id: string; role_name: string }[];
  stats?: {
    total: number;
    active: number;
    admins: number;
    inactive: number;
  };
}

const rolePills: Record<string, string> = {
  ADMIN: "bg-slate-100 text-slate-900 border-slate-300 font-semibold",
  DEPARTMENT_HEAD: "bg-slate-100 text-slate-800 border-slate-200 font-medium",
  STAFF: "bg-slate-50 text-slate-700 border-slate-200 font-normal",
  END_USER: "bg-slate-50 text-slate-600 border-slate-200 font-normal",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  DEPARTMENT_HEAD: "Department Head",
  STAFF: "Staff Member",
  END_USER: "End User",
};

export function AdminUserDirectory({
  initialUsers,
  initialTotalCount,
  departments,
  roles = [],
  stats,
}: AdminUserDirectoryProps) {
  const router = useRouter();
  const PAGE_SIZE = 10;
  const [usersList, setUsersList] = useState<SerializedUser[]>(initialUsers);
  const [totalCount, setTotalCount] = useState<number>(
    initialTotalCount ?? initialUsers.length,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");

  const isFirstMount = useRef(true);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Fetch paginated users from server
  const fetchUsers = useCallback(
    async (page: number, search: string, role: string, dept: string) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: PAGE_SIZE.toString(),
        });
        if (search.trim()) params.set("search", search.trim());
        if (role !== "ALL") params.set("role_id", role);
        if (dept !== "ALL") params.set("department_id", dept);

        const res = await fetch(`/api/admin/users?${params.toString()}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setUsersList(data.users || []);
          if (data.pagination) {
            setTotalCount(data.pagination.total);
          }
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Debounced server query on search or filter change
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      fetchUsers(currentPage, searchQuery, selectedRole, selectedDept);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentPage, searchQuery, selectedRole, selectedDept, fetchUsers]);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Create Form State
  const [empCode, setEmpCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRoleId, setEditRoleId] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editFeedback, setEditFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!empCode || !firstName || !email || !password || !selectedRoleId) {
      setFeedback({
        type: "error",
        text: "Please fill in all mandatory fields.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_code: empCode,
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          role_id: selectedRoleId,
          department_id: selectedDeptId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({
          type: "error",
          text: data.message || "Failed to create user.",
        });
        setIsSubmitting(false);
        return;
      }

      setFeedback({
        type: "success",
        text: data.message || "User onboarded successfully.",
      });
      fetchUsers(currentPage, searchQuery, selectedRole, selectedDept);

      setTimeout(() => {
        setIsModalOpen(false);
        setEmpCode("");
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setSelectedRoleId("");
        setSelectedDeptId("");
        setFeedback(null);
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error("Failed to onboard user:", err);
      setFeedback({
        type: "error",
        text: "An unexpected error occurred while creating user.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditModal(u: SerializedUser) {
    setEditingUserId(u.user_id);
    setEditFirstName(u.first_name);
    setEditLastName(u.last_name || "");
    setEditEmail(u.email);
    setEditStatus(u.status);

    // Find role id
    const foundRole = roles.find((r) => r.role_name === u.role_name);
    setEditRoleId(foundRole?.role_id || "");

    // Find dept id
    const foundDept = departments.find(
      (d) => d.department_name === u.department_name,
    );
    setEditDeptId(foundDept?.department_id || "");

    setEditFeedback(null);
    setIsEditModalOpen(true);
  }

  async function handleSaveEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUserId || !editFirstName || !editEmail) return;

    try {
      setIsEditSubmitting(true);
      setEditFeedback(null);

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: editingUserId,
          first_name: editFirstName,
          last_name: editLastName,
          email: editEmail,
          role_id: editRoleId || undefined,
          department_id: editDeptId || null,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setEditFeedback({
          type: "error",
          text: data.message || "Failed to update user.",
        });
        setIsEditSubmitting(false);
        return;
      }

      fetchUsers(currentPage, searchQuery, selectedRole, selectedDept);

      setEditFeedback({
        type: "success",
        text: "User profile updated successfully.",
      });

      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingUserId(null);
        setEditFeedback(null);
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error("Failed to update user:", err);
      setEditFeedback({
        type: "error",
        text: "An unexpected error occurred while updating user.",
      });
    } finally {
      setIsEditSubmitting(false);
    }
  }

  async function handleToggleStatus(u: SerializedUser) {
    const nextStatus = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: u.user_id,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchUsers(currentPage, searchQuery, selectedRole, selectedDept);
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Executive Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Total Enrolled Users
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-800">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {stats?.total ?? totalCount}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Registered
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Active enterprise directory
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Active Accounts
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-emerald-600">
              {stats?.active ??
                usersList.filter(
                  (u: SerializedUser) => (u.status || "ACTIVE") === "ACTIVE",
                ).length}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Can authenticate
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Access permitted
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Suspended Accounts
            </span>
            <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
              <UserX className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-800">
              {stats?.inactive ??
                usersList.filter((u: SerializedUser) => u.status === "INACTIVE")
                  .length}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Locked
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
            Revoked access
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Department Heads & Staff
            </span>
            <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {stats?.admins ??
                usersList.filter(
                  (u: SerializedUser) =>
                    u.role_name === "ADMIN" ||
                    u.role_name === "DEPARTMENT_HEAD" ||
                    u.role_name === "STAFF",
                ).length}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Operational
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
            Resolution staff
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div
        id="user-table"
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs"
      >
        {/* Header & Controls */}
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-800">
                  <Users className="h-4 w-4" />
                </span>
                <h2 className="text-base font-bold tracking-tight text-slate-900">
                  System User Directory
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Directory of {totalCount} authenticated enterprise users, roles,
                and status controls.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[200px]">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search name, code, email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
                />
              </div>

              {/* Role Filter */}
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Administrator</option>
                <option value="DEPARTMENT_HEAD">Department Head</option>
                <option value="STAFF">Staff Member</option>
                <option value="END_USER">End User</option>
              </select>

              {/* Department Filter */}
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.department_name}
                  </option>
                ))}
              </select>

              {/* Add User Button */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-900 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add User</span>
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto relative">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 pl-6 pr-3">User & Code</th>
                <th className="px-3 py-3.5">Email Contact</th>
                <th className="px-3 py-3.5">Assigned Role</th>
                <th className="px-3 py-3.5">Department</th>
                <th className="px-3 py-3.5">Status</th>
                <th className="px-3 py-3.5">Registered</th>
                <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr
                    key={`skeleton-${
                      // biome-ignore lint/suspicious/noArrayIndexKey: skeleton items
                      i
                    }`}
                    className="animate-pulse"
                  >
                    <td className="py-3.5 pl-6 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="h-3 w-28 rounded bg-slate-200" />
                          <div className="h-2.5 w-16 rounded bg-slate-100" />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="h-3 w-36 rounded bg-slate-200" />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="h-5 w-20 rounded-md bg-slate-100" />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="h-3 w-24 rounded bg-slate-200" />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="h-5 w-16 rounded-full bg-slate-100" />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="h-3 w-20 rounded bg-slate-200" />
                    </td>
                    <td className="py-3.5 pl-3 pr-6 text-right">
                      <div className="h-6 w-16 ml-auto rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-8 ring-emerald-50/50">
                        <Users className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 text-sm font-bold text-slate-900">
                        No matching users found
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        We couldn't find any enterprise accounts matching your
                        current search query or filter selections.
                      </p>
                      {(searchQuery ||
                        selectedRole !== "ALL" ||
                        selectedDept !== "ALL") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedRole("ALL");
                            setSelectedDept("ALL");
                            setCurrentPage(1);
                          }}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                        >
                          <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                          <span>Reset Filters</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                usersList.map((u) => {
                  const initials =
                    `${u.first_name[0] || ""}${u.last_name ? u.last_name[0] : ""}`.toUpperCase() ||
                    "U";
                  const pillStyle =
                    rolePills[u.role_name] ||
                    "bg-slate-100 text-slate-700 border-slate-200";
                  const label = roleLabels[u.role_name] || u.role_name;

                  return (
                    <tr
                      key={u.user_id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="whitespace-nowrap py-3.5 pl-6 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-[#064E3B]">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {u.first_name} {u.last_name || ""}
                            </p>
                            <span className="font-mono text-[10px] text-slate-400">
                              {u.employee_code}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${pillStyle}`}
                        >
                          {label}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5">
                        {u.department_name ? (
                          <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            {u.department_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            Organization-wide
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                            u.status === "ACTIVE"
                              ? "bg-slate-50 text-slate-700 border-slate-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.status === "ACTIVE"
                                ? "bg-emerald-600"
                                : "bg-slate-400"
                            }`}
                          />
                          {u.status}
                        </span>
                      </td>

                      <td
                        suppressHydrationWarning
                        className="whitespace-nowrap px-3 py-3.5 font-mono text-[11px] text-slate-400"
                      >
                        {new Date(u.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Quick Action Buttons */}
                      <td className="whitespace-nowrap py-3.5 pl-3 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-800 transition"
                            title="Edit User"
                          >
                            <Pencil className="h-3 w-3 text-emerald-800" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition ${
                              u.status === "ACTIVE"
                                ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                            title={
                              u.status === "ACTIVE"
                                ? "Deactivate User"
                                : "Activate User"
                            }
                          >
                            <Power className="h-3 w-3" />
                            <span>
                              {u.status === "ACTIVE"
                                ? "Deactivate"
                                : "Activate"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 px-6 py-3.5 text-xs text-slate-500">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(currentPage * PAGE_SIZE, totalCount)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">{totalCount}</span>{" "}
            users
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Modal: Onboard New User */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-800">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Onboard Enterprise User
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

              <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="new-user-empcode"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Employee Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="new-user-empcode"
                      type="text"
                      required
                      placeholder="e.g. EMP-1055"
                      value={empCode}
                      onChange={(e) => setEmpCode(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 uppercase outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-user-email"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Corporate Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="new-user-email"
                      type="email"
                      required
                      placeholder="user@enterprise.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="new-user-firstname"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="new-user-firstname"
                      type="text"
                      required
                      placeholder="e.g. Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-user-lastname"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Last Name
                    </label>
                    <input
                      id="new-user-lastname"
                      type="text"
                      placeholder="e.g. Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="new-user-password"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Temporary Password{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="new-user-password"
                      type="password"
                      required
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-user-dept"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Assigned Department
                    </label>
                    <select
                      id="new-user-dept"
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      <option value="">Select department (optional)...</option>
                      {departments.map((d) => (
                        <option key={d.department_id} value={d.department_id}>
                          {d.department_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="new-user-role"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Organizational Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="new-user-role"
                    required
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600 focus:bg-white"
                  >
                    <option value="">Select a role...</option>
                    {roles.map((r) => (
                      <option key={r.role_id} value={r.role_id}>
                        {r.role_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-900 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Existing User */}
        {isEditModalOpen && editingUserId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-800">
                    <Pencil className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Edit User Profile
                    </h3>
                    <p className="text-[11px] text-slate-500">{editEmail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUserId(null);
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

              <form onSubmit={handleSaveEditUser} className="mt-4 space-y-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-user-firstname"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="edit-user-firstname"
                      type="text"
                      required
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-user-lastname"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Last Name
                    </label>
                    <input
                      id="edit-user-lastname"
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="edit-user-email"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="edit-user-email"
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="edit-user-dept"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Department
                    </label>
                    <select
                      id="edit-user-dept"
                      value={editDeptId}
                      onChange={(e) => setEditDeptId(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      <option value="">None / Unassigned</option>
                      {departments.map((d) => (
                        <option key={d.department_id} value={d.department_id}>
                          {d.department_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-user-role"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="edit-user-role"
                      required
                      value={editRoleId}
                      onChange={(e) => setEditRoleId(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      <option value="">Select a role...</option>
                      {roles.map((r) => (
                        <option key={r.role_id} value={r.role_id}>
                          {r.role_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-user-status"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Status <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="edit-user-status"
                      required
                      value={editStatus}
                      onChange={(e) =>
                        setEditStatus(e.target.value as "ACTIVE" | "INACTIVE")
                      }
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingUserId(null);
                      setEditFeedback(null);
                    }}
                    className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditSubmitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-900 disabled:opacity-50"
                  >
                    {isEditSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
