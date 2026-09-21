"use client";

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Power,
  Search,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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
  departments: { department_id: string; department_name: string }[];
  roles?: { role_id: string; role_name: string }[];
}

const rolePills: Record<string, string> = {
  ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
  DEPARTMENT_HEAD: "bg-blue-50 text-blue-700 border-blue-200",
  STAFF: "bg-amber-50 text-amber-700 border-amber-200",
  END_USER: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  DEPARTMENT_HEAD: "Department Head",
  STAFF: "Staff Member",
  END_USER: "End User",
};

export function AdminUserDirectory({
  initialUsers,
  departments,
  roles = [],
}: AdminUserDirectoryProps) {
  const router = useRouter();
  const [usersList, setUsersList] = useState<SerializedUser[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");

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

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const fullName = `${u.first_name} ${u.last_name || ""}`.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        fullName.includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.employee_code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        selectedRole === "ALL" || u.role_name === selectedRole;

      const matchesDept =
        selectedDept === "ALL" || u.department_name === selectedDept;

      return matchesSearch && matchesRole && matchesDept;
    });
  }, [usersList, searchQuery, selectedRole, selectedDept]);

  const PAGE_SIZE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 on filter changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page when filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole, selectedDept]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

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

      setUsersList((prev) => [data.user, ...prev]);
      setFeedback({
        type: "success",
        text: data.message || "User onboarded successfully.",
      });

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

      setUsersList((prev) =>
        prev.map((u) => (u.user_id === editingUserId ? data.user : u)),
      );

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
        setUsersList((prev) =>
          prev.map((usr) => (usr.user_id === u.user_id ? data.user : usr)),
        );
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  }

  return (
    <div
      id="users"
      className="rounded-2xl border border-slate-200/80 bg-white shadow-xs"
    >
      {/* Header & Controls */}
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                <Users className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                System User Directory
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Directory of {usersList.length} authenticated enterprise users,
              roles, and status controls.
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white"
              />
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white"
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
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.department_id} value={d.department_name}>
                  {d.department_name}
                </option>
              ))}
            </select>

            {/* Add User Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
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
            {filteredUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-slate-400 font-normal"
                >
                  No users match the search criteria.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => {
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
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
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
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-500"
                              : "bg-rose-500"
                          }`}
                        />
                        {u.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3.5 font-mono text-[11px] text-slate-400">
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
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition"
                          title="Edit User"
                        >
                          <Pencil className="h-3 w-3 text-blue-600" />
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
                            {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
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
      {filteredUsers.length > PAGE_SIZE && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 px-6 py-3.5 text-xs text-slate-500">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {(currentPage - 1) * PAGE_SIZE + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(currentPage * PAGE_SIZE, filteredUsers.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {filteredUsers.length}
            </span>{" "}
            users
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal: Onboard New User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
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
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 uppercase outline-none focus:border-blue-600 focus:bg-white"
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
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
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
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
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
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-user-password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Temporary Password <span className="text-rose-500">*</span>
                </label>
                <input
                  id="new-user-password"
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="new-user-role"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Role Assignment <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="new-user-role"
                    required
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="">Select a role...</option>
                    {roles.map((r) => (
                      <option key={r.role_id} value={r.role_id}>
                        {roleLabels[r.role_name] || r.role_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="new-user-department"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Department
                  </label>
                  <select
                    id="new-user-department"
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="">None (Organization-wide)</option>
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.department_name}
                      </option>
                    ))}
                  </select>
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
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing User */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                  <Pencil className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit User Account
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
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
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
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
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
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="edit-user-role"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Assigned Role
                  </label>
                  <select
                    id="edit-user-role"
                    value={editRoleId}
                    onChange={(e) => setEditRoleId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="">Select a role...</option>
                    {roles.map((r) => (
                      <option key={r.role_id} value={r.role_id}>
                        {roleLabels[r.role_name] || r.role_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-user-department"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Department
                  </label>
                  <select
                    id="edit-user-department"
                    value={editDeptId}
                    onChange={(e) => setEditDeptId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="">None (Organization-wide)</option>
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
                  htmlFor="edit-user-status"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Account Status
                </label>
                <select
                  id="edit-user-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="ACTIVE">ACTIVE (Full access)</option>
                  <option value="INACTIVE">INACTIVE (Access blocked)</option>
                </select>
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
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
