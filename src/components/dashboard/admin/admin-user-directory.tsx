"use client";

import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Pencil,
  Plus,
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
        <button
          type="button"
          onClick={() => {
            setSelectedStatus("ALL");
            setCurrentPage(1);
          }}
          className={`relative overflow-hidden rounded-2xl border text-left p-5 shadow-xs transition hover:shadow-md cursor-pointer ${
            selectedStatus === "ALL"
              ? "border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20"
              : "border-slate-200/80 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Total Enrolled Users
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-800">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {stats?.total ?? totalCount}
            </span>
            <span className="text-xs font-medium text-slate-400">
              Registered
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-800 font-normal">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Active enterprise directory
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatus("ACTIVE");
            setCurrentPage(1);
          }}
          className={`relative overflow-hidden rounded-2xl border text-left p-5 shadow-xs transition hover:shadow-md cursor-pointer ${
            selectedStatus === "ACTIVE"
              ? "border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/20"
              : "border-slate-200/80 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Active Accounts
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600">
              {stats?.active ??
                usersList.filter(
                  (u: SerializedUser) => (u.status || "ACTIVE") === "ACTIVE",
                ).length}
            </span>
            <span className="text-xs font-medium text-slate-400">
              Can authenticate
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-normal">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Access permitted
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedStatus("INACTIVE");
            setCurrentPage(1);
          }}
          className={`relative overflow-hidden rounded-2xl border text-left p-5 shadow-xs transition hover:shadow-md cursor-pointer ${
            selectedStatus === "INACTIVE"
              ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
              : "border-slate-200/80 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Suspended Accounts
            </span>
            <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
              <UserX className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-800">
              {stats?.inactive ??
                usersList.filter((u: SerializedUser) => u.status === "INACTIVE")
                  .length}
            </span>
            <span className="text-xs font-medium text-slate-400">Locked</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 font-normal">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
            Revoked access
          </div>
        </button>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              Department Heads & Staff
            </span>
            <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {stats?.admins ??
                usersList.filter(
                  (u: SerializedUser) =>
                    u.role_name === "ADMIN" ||
                    u.role_name === "DEPARTMENT_HEAD" ||
                    u.role_name === "STAFF",
                ).length}
            </span>
            <span className="text-xs font-medium text-slate-400">
              Operational
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 font-normal">
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
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  System User Directory
                </h2>
              </div>
              <p className="mt-0.5 text-[13px] font-normal text-slate-500">
                Directory of {totalCount} authenticated enterprise users, roles,
                and status controls.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-50">
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
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
                />
              </div>

              {/* Status Filter */}
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

              {/* Role Filter */}
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
                        { value: "DEPARTMENT_HEAD", label: "Department Head" },
                        { value: "STAFF", label: "Staff Member" },
                        { value: "END_USER", label: "End User" },
                      ]),
                ]}
              />

              {/* Department Filter */}
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

              {/* Add User Button */}
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-3.5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-900 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add User</span>
              </button>
            </div>
          </div>
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
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.status === "ACTIVE"
                                ? "bg-emerald-600"
                                : "bg-slate-400"
                            }`}
                          />
                          {u.status === "ACTIVE" ? "Active" : "Suspended"}
                        </span>
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
                    setShowPassword(false);
                    setHasCopiedPassword(false);
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

              <form
                onSubmit={handleCreateUser}
                autoComplete="off"
                className="mt-4 space-y-3.5"
              >
                {/* Hidden dummy fields to prevent browser password managers from autofilling admin credentials */}
                <input
                  type="text"
                  name="fake_username_autofill"
                  style={{ display: "none" }}
                  tabIndex={-1}
                  aria-hidden="true"
                  autoComplete="off"
                />
                <input
                  type="password"
                  name="fake_password_autofill"
                  style={{ display: "none" }}
                  tabIndex={-1}
                  aria-hidden="true"
                  autoComplete="new-password"
                />

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
                      name="enterprise_user_empcode"
                      type="text"
                      required
                      autoComplete="off"
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
                      name="enterprise_user_email"
                      type="email"
                      required
                      autoComplete="off"
                      data-lpignore="true"
                      data-form-type="other"
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
                    <div className="relative mt-1">
                      <input
                        id="new-user-password"
                        name="enterprise_user_password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        data-lpignore="true"
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-3 pr-16 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                        {password && (
                          <button
                            type="button"
                            onClick={handleCopyPassword}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            title={
                              hasCopiedPassword ? "Copied!" : "Copy password"
                            }
                            aria-label="Copy password"
                          >
                            {hasCopiedPassword ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          title={
                            showPassword ? "Hide password" : "Show password"
                          }
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="new-user-dept"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Assigned Department{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="new-user-dept"
                      required
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white"
                    >
                      <option value="">Select department...</option>
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
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white"
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
                    onClick={() => {
                      setIsModalOpen(false);
                      setShowPassword(false);
                      setHasCopiedPassword(false);
                    }}
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
                    <p className="text-xs text-slate-500">{editEmail}</p>
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
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="edit-user-dept"
                      required
                      value={editDeptId}
                      onChange={(e) => setEditDeptId(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white"
                    >
                      <option value="">Select department...</option>
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
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white"
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
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white"
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

        {/* Modal: Account Suspension (Requires Documented Justification) */}
        {suspensionModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-rose-50 p-1.5 text-rose-700">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Suspend User Account
                    </h3>
                    <p className="text-xs text-slate-500">
                      Mandatory documented justification required
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSuspensionModalUser(null);
                    setSuspensionFeedback(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {suspensionFeedback && (
                <div
                  className={`mt-4 rounded-xl border p-3 text-xs ${
                    suspensionFeedback.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  {suspensionFeedback.text}
                </div>
              )}

              {/* Target User Details */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">
                      {suspensionModalUser.first_name}{" "}
                      {suspensionModalUser.last_name || ""}
                    </span>
                    <span className="ml-2 font-mono text-xs text-slate-500">
                      ({suspensionModalUser.employee_code})
                    </span>
                  </div>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {suspensionModalUser.role_name}
                  </span>
                </div>
                <div className="mt-1 text-slate-600">
                  {suspensionModalUser.email}
                  {suspensionModalUser.department_name && (
                    <span className="ml-2 text-slate-400">
                      • {suspensionModalUser.department_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Security Warning Notice */}
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  Security Impact Notice
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  Suspending this user will immediately revoke all active
                  sessions across all devices, block login attempts, and log an
                  audit record with your justification.
                </p>
              </div>

              <form
                onSubmit={handleConfirmSuspension}
                className="mt-4 space-y-3.5"
              >
                <div>
                  <label
                    htmlFor="suspension-category"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Suspension Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="suspension-category"
                    required
                    value={suspensionCategory}
                    onChange={(e) => setSuspensionCategory(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-rose-600"
                  >
                    <option value="POLICY_VIOLATION">
                      Policy / Code of Conduct Violation
                    </option>
                    <option value="SECURITY_INCIDENT">
                      Suspected Compromise / Security Risk
                    </option>
                    <option value="EMPLOYMENT_STATUS_CHANGE">
                      Separation / Offboarding / Leave
                    </option>
                    <option value="MALICIOUS_ACTIVITY">
                      Unauthorized Access / Malicious Grievance Activity
                    </option>
                    <option value="ADMINISTRATIVE_HOLD">
                      Administrative Review Hold
                    </option>
                    <option value="OTHER">Other Documented Reason</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="suspension-reason"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Documented Justification Reason{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="suspension-reason"
                    required
                    rows={3}
                    placeholder="Enter detailed justification for suspending this account. This will be preserved in the immutable audit log..."
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 placeholder:text-slate-400"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Audit logs require verifiable documentation for regulatory
                    and compliance review.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSuspensionModalUser(null);
                      setSuspensionFeedback(null);
                    }}
                    className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmittingSuspension || !suspensionReason.trim()
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700 disabled:opacity-50"
                  >
                    {isSubmittingSuspension ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Suspending...</span>
                      </>
                    ) : (
                      <>
                        <UserX className="h-3.5 w-3.5" />
                        <span>Confirm Account Suspension</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Account Reactivation */}
        {reactivationModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-2xl border border-emerald-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-800">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Reactivate User Account
                    </h3>
                    <p className="text-xs text-slate-500">
                      Restore authentication and enterprise access
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReactivationModalUser(null);
                    setReactivationFeedback(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {reactivationFeedback && (
                <div
                  className={`mt-4 rounded-xl border p-3 text-xs ${
                    reactivationFeedback.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  {reactivationFeedback.text}
                </div>
              )}

              {/* Target User Details */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">
                      {reactivationModalUser.first_name}{" "}
                      {reactivationModalUser.last_name || ""}
                    </span>
                    <span className="ml-2 font-mono text-xs text-slate-500">
                      ({reactivationModalUser.employee_code})
                    </span>
                  </div>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {reactivationModalUser.role_name}
                  </span>
                </div>
                <div className="mt-1 text-slate-600">
                  {reactivationModalUser.email}
                  {reactivationModalUser.department_name && (
                    <span className="ml-2 text-slate-400">
                      • {reactivationModalUser.department_name}
                    </span>
                  )}
                </div>
              </div>

              <form
                onSubmit={handleConfirmReactivation}
                className="mt-4 space-y-3.5"
              >
                <div>
                  <label
                    htmlFor="reactivation-reason"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Reactivation Notes / Reason (Optional)
                  </label>
                  <textarea
                    id="reactivation-reason"
                    rows={2}
                    placeholder="e.g. Investigation completed, clearance reinstated, offboarding request canceled..."
                    value={reactivationReason}
                    onChange={(e) => setReactivationReason(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setReactivationModalUser(null);
                      setReactivationFeedback(null);
                    }}
                    className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReactivation}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-900 disabled:opacity-50"
                  >
                    {isSubmittingReactivation ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Reactivating...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Confirm Reactivation</span>
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
