"use client";

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  AdminFilterToolbar,
  AdminMetricCard,
  AdminPanelHeader,
  AdminSearchInput,
  AdminStatusBadge,
} from "@/components/dashboard/admin/admin-shared";
import { UserDirectoryModals } from "@/components/dashboard/admin/admin-user-directory-modals";
import { CustomSelect } from "@/components/ui/custom-select";

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
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const isFirstMount = useRef(true);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Fetch paginated users from server
  const fetchUsers = useCallback(
    async (
      page: number,
      search: string,
      role: string,
      dept: string,
      status: string,
    ) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: PAGE_SIZE.toString(),
        });
        if (search.trim()) params.set("search", search.trim());
        if (role !== "ALL") params.set("role_id", role);
        if (dept !== "ALL") params.set("department_id", dept);
        if (status !== "ALL") params.set("status", status);

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
      fetchUsers(
        currentPage,
        searchQuery,
        selectedRole,
        selectedDept,
        selectedStatus,
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [
    currentPage,
    searchQuery,
    selectedRole,
    selectedDept,
    selectedStatus,
    fetchUsers,
  ]);

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
  const [showPassword, setShowPassword] = useState(false);
  const [hasCopiedPassword, setHasCopiedPassword] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setHasCopiedPassword(true);
    setTimeout(() => setHasCopiedPassword(false), 2000);
  };

  const openCreateModal = () => {
    setEmpCode("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setHasCopiedPassword(false);
    setSelectedRoleId("");
    setSelectedDeptId("");
    setFeedback(null);
    setIsModalOpen(true);
  };

  // Prevent browser autofill from inserting logged-in user credentials into onboarding fields
  useEffect(() => {
    if (isModalOpen) {
      setEmail("");
      setPassword("");
      const timer = setTimeout(() => {
        setEmail((curr) =>
          curr.includes("@") && curr === "admin@grs.local" ? "" : curr,
        );
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

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

  // Suspend User Modal State
  const [suspensionModalUser, setSuspensionModalUser] =
    useState<SerializedUser | null>(null);
  const [suspensionCategory, setSuspensionCategory] =
    useState("POLICY_VIOLATION");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionFeedback, setSuspensionFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmittingSuspension, setIsSubmittingSuspension] = useState(false);

  // Reactivate User Modal State
  const [reactivationModalUser, setReactivationModalUser] =
    useState<SerializedUser | null>(null);
  const [reactivationReason, setReactivationReason] = useState("");
  const [reactivationFeedback, setReactivationFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmittingReactivation, setIsSubmittingReactivation] =
    useState(false);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (
      !empCode ||
      !firstName ||
      !email ||
      !password ||
      !selectedRoleId ||
      !selectedDeptId
    ) {
      setFeedback({
        type: "error",
        text: "Please fill in all mandatory fields including department.",
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
      fetchUsers(
        currentPage,
        searchQuery,
        selectedRole,
        selectedDept,
        selectedStatus,
      );

      setTimeout(() => {
        setIsModalOpen(false);
        setEmpCode("");
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setShowPassword(false);
        setHasCopiedPassword(false);
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
    if (!editingUserId || !editFirstName || !editEmail || !editDeptId) {
      setEditFeedback({
        type: "error",
        text: "Please fill in all mandatory fields including department.",
      });
      return;
    }

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

      fetchUsers(
        currentPage,
        searchQuery,
        selectedRole,
        selectedDept,
        selectedStatus,
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

  function handleInitiateStatusChange(u: SerializedUser) {
    if (u.status === "ACTIVE") {
      setSuspensionModalUser(u);
      setSuspensionCategory("POLICY_VIOLATION");
      setSuspensionReason("");
      setSuspensionFeedback(null);
    } else {
      setReactivationModalUser(u);
      setReactivationReason("");
      setReactivationFeedback(null);
    }
  }

  async function handleConfirmSuspension(e: React.FormEvent) {
    e.preventDefault();
    if (!suspensionModalUser) return;

    if (!suspensionReason.trim()) {
      setSuspensionFeedback({
        type: "error",
        text: "A documented justification reason is required to suspend this account.",
      });
      return;
    }

    try {
      setIsSubmittingSuspension(true);
      setSuspensionFeedback(null);

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: suspensionModalUser.user_id,
          status: "INACTIVE",
          reason_category: suspensionCategory,
          reason: suspensionReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSuspensionFeedback({
          type: "error",
          text: data.message || "Failed to suspend account.",
        });
        setIsSubmittingSuspension(false);
        return;
      }

      setSuspensionFeedback({
        type: "success",
        text: `Account for ${suspensionModalUser.first_name} suspended and all active sessions revoked.`,
      });

      fetchUsers(
        currentPage,
        searchQuery,
        selectedRole,
        selectedDept,
        selectedStatus,
      );

      setTimeout(() => {
        setSuspensionModalUser(null);
        setSuspensionFeedback(null);
        setSuspensionReason("");
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error("Failed to suspend account:", err);
      setSuspensionFeedback({
        type: "error",
        text: "An unexpected network or server error occurred.",
      });
    } finally {
      setIsSubmittingSuspension(false);
    }
  }

  async function handleConfirmReactivation(e: React.FormEvent) {
    e.preventDefault();
    if (!reactivationModalUser) return;

    try {
      setIsSubmittingReactivation(true);
      setReactivationFeedback(null);

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: reactivationModalUser.user_id,
          status: "ACTIVE",
          reason: reactivationReason.trim() || "Administrative reactivation",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setReactivationFeedback({
          type: "error",
          text: data.message || "Failed to reactivate account.",
        });
        setIsSubmittingReactivation(false);
        return;
      }

      setReactivationFeedback({
        type: "success",
        text: `Account for ${reactivationModalUser.first_name} successfully reactivated.`,
      });

      fetchUsers(
        currentPage,
        searchQuery,
        selectedRole,
        selectedDept,
        selectedStatus,
      );

      setTimeout(() => {
        setReactivationModalUser(null);
        setReactivationFeedback(null);
        setReactivationReason("");
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error("Failed to reactivate account:", err);
      setReactivationFeedback({
        type: "error",
        text: "An unexpected network or server error occurred.",
      });
    } finally {
      setIsSubmittingReactivation(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Executive Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          title="Total Enrolled Users"
          value={stats?.total ?? totalCount}
          helper="Registered"
          icon={Users}
          accent="emerald"
          active={selectedStatus === "ALL"}
          onClick={() => {
            setSelectedStatus("ALL");
            setCurrentPage(1);
          }}
        />

        <AdminMetricCard
          title="Active Accounts"
          value={
            stats?.active ??
            usersList.filter(
              (u: SerializedUser) => (u.status || "ACTIVE") === "ACTIVE",
            ).length
          }
          helper="Can authenticate"
          icon={UserCheck}
          accent="emerald"
          active={selectedStatus === "ACTIVE"}
          onClick={() => {
            setSelectedStatus("ACTIVE");
            setCurrentPage(1);
          }}
        />

        <AdminMetricCard
          title="Suspended Accounts"
          value={
            stats?.inactive ??
            usersList.filter((u: SerializedUser) => u.status === "INACTIVE")
              .length
          }
          helper="Locked"
          icon={UserX}
          accent="rose"
          active={selectedStatus === "INACTIVE"}
          onClick={() => {
            setSelectedStatus("INACTIVE");
            setCurrentPage(1);
          }}
        />

        <AdminMetricCard
          title="Department Heads & Staff"
          value={
            stats?.admins ??
            usersList.filter(
              (u: SerializedUser) =>
                u.role_name === "ADMIN" ||
                u.role_name === "DEPARTMENT_HEAD" ||
                u.role_name === "STAFF",
            ).length
          }
          helper="Operational"
          icon={ShieldCheck}
          accent="slate"
        />
      </div>

      {/* Main Table Container */}
      <div
        id="user-table"
        className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs"
      >
        {/* Header & Controls */}
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <AdminPanelHeader
            title="System User Directory"
            description={`Directory of ${totalCount} authenticated enterprise users, roles, and status controls.`}
            action={
              <AdminFilterToolbar>
                <AdminSearchInput
                  placeholder="Search name, code, email..."
                  value={searchQuery}
                  onChange={(nextValue) => {
                    setSearchQuery(nextValue);
                    setCurrentPage(1);
                  }}
                />

                <CustomSelect
                  aria-label="Filter by account status"
                  value={selectedStatus}
                  onChange={(val) => {
                    setSelectedStatus(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "ALL", label: "All Statuses" },
                    { value: "ACTIVE", label: "Active Accounts" },
                    { value: "INACTIVE", label: "Suspended Accounts" },
                  ]}
                />

                <CustomSelect
                  aria-label="Filter by organizational role"
                  value={selectedRole}
                  onChange={(val) => {
                    setSelectedRole(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "ALL", label: "All Roles" },
                    ...(roles.length > 0
                      ? roles.map((r) => ({
                          value: r.role_id,
                          label: roleLabels[r.role_name] || r.role_name,
                        }))
                      : [
                          { value: "ADMIN", label: "Administrator" },
                          {
                            value: "DEPARTMENT_HEAD",
                            label: "Department Head",
                          },
                          { value: "STAFF", label: "Staff Member" },
                          { value: "END_USER", label: "End User" },
                        ]),
                  ]}
                />

                <CustomSelect
                  aria-label="Filter by assigned department"
                  value={selectedDept}
                  onChange={(val) => {
                    setSelectedDept(val);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "ALL", label: "All Departments" },
                    ...departments.map((d) => ({
                      value: d.department_id,
                      label: d.department_name,
                    })),
                  ]}
                />

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-3.5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-900 active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add User</span>
                </button>
              </AdminFilterToolbar>
            }
          />
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto relative">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                            <span className="font-mono text-xs text-slate-400">
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
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${pillStyle}`}
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
                        <AdminStatusBadge
                          status={u.status}
                          activeLabel="Active"
                          inactiveLabel="Suspended"
                        />
                      </td>

                      <td
                        suppressHydrationWarning
                        className="whitespace-nowrap px-3 py-3.5 font-mono text-xs text-slate-400"
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
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-800 transition"
                            title="Edit User"
                          >
                            <Pencil className="h-3 w-3 text-emerald-800" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleInitiateStatusChange(u)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition ${
                              u.status === "ACTIVE"
                                ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300"
                            }`}
                            title={
                              u.status === "ACTIVE"
                                ? "Suspend User Account (Requires Justification)"
                                : "Reactivate User Account"
                            }
                          >
                            {u.status === "ACTIVE" ? (
                              <>
                                <UserX className="h-3 w-3" />
                                <span>Suspend</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3 w-3" />
                                <span>Reactivate</span>
                              </>
                            )}
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

        <UserDirectoryModals
          isModalOpen={isModalOpen}
          isSubmitting={isSubmitting}
          feedback={feedback}
          empCode={empCode}
          firstName={firstName}
          lastName={lastName}
          email={email}
          password={password}
          showPassword={showPassword}
          hasCopiedPassword={hasCopiedPassword}
          selectedRoleId={selectedRoleId}
          selectedDeptId={selectedDeptId}
          departments={departments}
          roles={roles}
          onCloseCreate={() => {
            setIsModalOpen(false);
            setShowPassword(false);
            setHasCopiedPassword(false);
            setFeedback(null);
          }}
          onSubmitCreate={handleCreateUser}
          onSetEmpCode={setEmpCode}
          onSetFirstName={setFirstName}
          onSetLastName={setLastName}
          onSetEmail={setEmail}
          onSetPassword={setPassword}
          onSetShowPassword={setShowPassword}
          onCopyPassword={handleCopyPassword}
          onSetSelectedRoleId={setSelectedRoleId}
          onSetSelectedDeptId={setSelectedDeptId}
          isEditModalOpen={isEditModalOpen}
          editingUserId={editingUserId}
          editFirstName={editFirstName}
          editLastName={editLastName}
          editEmail={editEmail}
          editRoleId={editRoleId}
          editDeptId={editDeptId}
          editStatus={editStatus}
          editFeedback={editFeedback}
          isEditSubmitting={isEditSubmitting}
          onCloseEdit={() => {
            setIsEditModalOpen(false);
            setEditingUserId(null);
            setEditFeedback(null);
          }}
          onSubmitEdit={handleSaveEditUser}
          onSetEditFirstName={setEditFirstName}
          onSetEditLastName={setEditLastName}
          onSetEditEmail={setEditEmail}
          onSetEditRoleId={setEditRoleId}
          onSetEditDeptId={setEditDeptId}
          onSetEditStatus={setEditStatus}
          suspensionModalUser={suspensionModalUser}
          suspensionCategory={suspensionCategory}
          suspensionReason={suspensionReason}
          suspensionFeedback={suspensionFeedback}
          isSubmittingSuspension={isSubmittingSuspension}
          onCloseSuspend={() => {
            setSuspensionModalUser(null);
            setSuspensionFeedback(null);
          }}
          onSubmitSuspend={handleConfirmSuspension}
          onSetSuspensionCategory={setSuspensionCategory}
          onSetSuspensionReason={setSuspensionReason}
          reactivationModalUser={reactivationModalUser}
          reactivationReason={reactivationReason}
          reactivationFeedback={reactivationFeedback}
          isSubmittingReactivation={isSubmittingReactivation}
          onCloseReactivate={() => {
            setReactivationModalUser(null);
            setReactivationFeedback(null);
          }}
          onSubmitReactivate={handleConfirmReactivation}
          onSetReactivationReason={setReactivationReason}
        />
      </div>
    </div>
  );
}
