"use client";

import {
  Activity,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export interface SerializedDepartment {
  department_id: string;
  department_name: string;
  description?: string | null;
  status?: string;
  user_count?: number;
  grievance_count: number;
}

interface AdminDepartmentsProps {
  initialDepartments: SerializedDepartment[];
  totalGrievances: number;
  stats?: {
    total: number;
    active: number;
    inactive: number;
    totalGrievances: number;
  };
}

export function AdminDepartments({
  initialDepartments,
  totalGrievances,
  stats,
}: AdminDepartmentsProps) {
  const router = useRouter();
  const [departments, setDepartments] =
    useState<SerializedDepartment[]>(initialDepartments);

  // Filter & Search State
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [description, setDescription] = useState("");
  const [deptStatus, setDeptStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Filter departments by status and search
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const currentStatus = d.status || "ACTIVE";
      const matchesStatus =
        statusFilter === "ALL" || currentStatus === statusFilter;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        d.department_name.toLowerCase().includes(query) ||
        (d.description || "").toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [departments, statusFilter, searchQuery]);

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredDepartments.length / PAGE_SIZE) || 1;
  const paginatedDepartments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredDepartments.slice(start, start + PAGE_SIZE);
  }, [filteredDepartments, currentPage]);

  // Handle Toggle Active/Inactive Status
  async function handleToggleStatus(dept: SerializedDepartment) {
    const nextStatus = dept.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/departments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department_id: dept.department_id,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDepartments((prev) =>
          prev.map((d) =>
            d.department_id === dept.department_id
              ? { ...d, status: nextStatus }
              : d,
          ),
        );
      } else {
        alert(data.message || "Failed to update department status.");
      }
    } catch (err) {
      console.error("Failed to toggle department status:", err);
      alert("An unexpected error occurred while toggling status.");
    }
  }

  // Open Edit Modal
  function openEditModal(dept: SerializedDepartment) {
    setEditingDeptId(dept.department_id);
    setEditDeptName(dept.department_name);
    setEditDescription(dept.description || "");
    setEditStatus((dept.status as "ACTIVE" | "INACTIVE") || "ACTIVE");
    setEditFeedback(null);
    setIsEditModalOpen(true);
  }

  // Handle Save Edit Department
  async function handleSaveEditDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!editingDeptId || !editDeptName.trim()) return;

    try {
      setIsEditSubmitting(true);
      setEditFeedback(null);

      const res = await fetch("/api/admin/departments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department_id: editingDeptId,
          department_name: editDeptName.trim(),
          description: editDescription.trim() || null,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setEditFeedback({
          type: "error",
          text: data.message || "Failed to update department.",
        });
        setIsEditSubmitting(false);
        return;
      }

      setDepartments((prev) =>
        prev.map((d) =>
          d.department_id === editingDeptId
            ? {
                ...d,
                department_name: data.department.department_name,
                description: data.department.description,
                status: data.department.status,
              }
            : d,
        ),
      );

      setEditFeedback({
        type: "success",
        text: "Department updated successfully.",
      });

      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingDeptId(null);
        setEditFeedback(null);
        router.refresh();
      }, 900);
    } catch (err) {
      console.error("Failed to update department:", err);
      setEditFeedback({
        type: "error",
        text: "An unexpected error occurred while updating department.",
      });
    } finally {
      setIsEditSubmitting(false);
    }
  }

  // Handle Create Department
  async function handleCreateDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!deptName.trim()) return;

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department_name: deptName.trim(),
          description: description.trim(),
          status: deptStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFeedback({
          type: "error",
          text: data.message || "Failed to create department.",
        });
        setIsSubmitting(false);
        return;
      }

      setDepartments((prev) => [
        ...prev,
        {
          department_id: data.department.department_id,
          department_name: data.department.department_name,
          description: data.department.description,
          status: data.department.status,
          user_count: 0,
          grievance_count: 0,
        },
      ]);

      setFeedback({
        type: "success",
        text: data.message || "Department created successfully.",
      });

      setTimeout(() => {
        setIsModalOpen(false);
        setDeptName("");
        setDescription("");
        setDeptStatus("ACTIVE");
        setFeedback(null);
        router.refresh();
      }, 900);
    } catch (err) {
      console.error("Failed to create department:", err);
      setFeedback({
        type: "error",
        text: "An unexpected error occurred while creating department.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Executive Metric Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Total Departments
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {stats?.total ?? departments.length}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Divisions
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-blue-600 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
            Enterprise organization units
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Active Departments
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-emerald-600">
              {stats?.active ??
                departments.filter((d) => (d.status || "ACTIVE") === "ACTIVE")
                  .length}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Routing enabled
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Accepting grievances
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Deactivated / Inactive
            </span>
            <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
              <Power className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-rose-600">
              {stats?.inactive ??
                departments.filter((d) => d.status === "INACTIVE").length}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Suspended
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-rose-600 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
            Excluded from new intake
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Assigned Grievances
            </span>
            <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-purple-700">
              {totalGrievances}
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              Total workload
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-purple-600 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500" />
            Active distribution
          </div>
        </div>
      </div>

      {/* Main Departments Panel */}
      <div
        id="departments"
        className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs"
      >
        {/* Header with Search, Filter & New Button */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                <Building2 className="h-4 w-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                Department Workload & Governance
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Enterprise divisions configured for automated routing, status
              governance, and workload resolution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search department..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white"
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {(["ALL", "ACTIVE", "INACTIVE"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st);
                    setCurrentPage(1);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    statusFilter === st
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {st === "ALL"
                    ? "All"
                    : st === "ACTIVE"
                      ? "Active"
                      : "Inactive"}
                </button>
              ))}
            </div>

            {/* New Department Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Department</span>
            </button>
          </div>
        </div>

        {/* Departments List */}
        <div className="mt-5 space-y-3.5">
          {filteredDepartments.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex max-w-sm flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-8 ring-blue-50/50">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-900">
                  No matching departments found
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  No departments match your current status filter or search
                  query.
                </p>
                {(searchQuery || statusFilter !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("ALL");
                      setCurrentPage(1);
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            paginatedDepartments.map((dept) => {
              const isDeptActive = (dept.status || "ACTIVE") === "ACTIVE";
              const percentage =
                totalGrievances > 0
                  ? Math.round((dept.grievance_count / totalGrievances) * 100)
                  : 0;

              return (
                <div
                  key={dept.department_id}
                  className={`rounded-xl border p-4 transition ${
                    isDeptActive
                      ? "border-slate-100 bg-white hover:border-slate-200 hover:shadow-xs"
                      : "border-slate-200/60 bg-slate-50/70 opacity-80"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs">
                    {/* Department Identity */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold ${
                          isDeptActive
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {dept.department_name}
                          </span>
                          {/* Status Pill */}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                              isDeptActive
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isDeptActive ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            {isDeptActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {dept.description && (
                          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                            {dept.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-3">
                      {dept.user_count !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          <Users className="h-3 w-3 text-slate-400" />
                          {dept.user_count} staff
                        </span>
                      )}
                      <span className="font-semibold text-slate-700">
                        {dept.grievance_count} cases ({percentage}%)
                      </span>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openEditModal(dept)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600 transition"
                      >
                        <Pencil className="h-3 w-3" />
                        <span>Edit</span>
                      </button>

                      {/* Activate / Deactivate Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(dept)}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                          isDeptActive
                            ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        <Power className="h-3 w-3" />
                        <span>{isDeptActive ? "Deactivate" : "Activate"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Workload Distribution Bar */}
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDeptActive ? "bg-blue-600" : "bg-slate-400"
                      }`}
                      style={{ width: `${Math.max(percentage, 3)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Persistent Pagination Footer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 mt-5 pt-3.5 text-xs text-slate-500">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredDepartments.length === 0
                ? 0
                : (currentPage - 1) * PAGE_SIZE + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(currentPage * PAGE_SIZE, filteredDepartments.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {filteredDepartments.length}
            </span>{" "}
            departments
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

        {/* Modal: Create Department */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Create New Department
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

              <form
                onSubmit={handleCreateDepartment}
                className="mt-4 space-y-4"
              >
                <div>
                  <label
                    htmlFor="new-dept-name"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="new-dept-name"
                    type="text"
                    required
                    placeholder="e.g. Legal & Compliance, Facilities, Payroll"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-dept-desc"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="new-dept-desc"
                    rows={2}
                    placeholder="Mandate and scope of this department..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-dept-status"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Initial Status
                  </label>
                  <select
                    id="new-dept-status"
                    value={deptStatus}
                    onChange={(e) =>
                      setDeptStatus(e.target.value as "ACTIVE" | "INACTIVE")
                    }
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white"
                  >
                    <option value="ACTIVE">ACTIVE (Accepts grievances)</option>
                    <option value="INACTIVE">
                      INACTIVE (Routing suspended)
                    </option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
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
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Create Department</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Department */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                    <Pencil className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Department
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

              <form
                onSubmit={handleSaveEditDepartment}
                className="mt-4 space-y-4"
              >
                <div>
                  <label
                    htmlFor="edit-dept-name"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="edit-dept-name"
                    type="text"
                    required
                    value={editDeptName}
                    onChange={(e) => setEditDeptName(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-dept-desc"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="edit-dept-desc"
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-dept-status"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Department Status
                  </label>
                  <select
                    id="edit-dept-status"
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as "ACTIVE" | "INACTIVE")
                    }
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white"
                  >
                    <option value="ACTIVE">ACTIVE (Accepts grievances)</option>
                    <option value="INACTIVE">
                      INACTIVE (Routing suspended)
                    </option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditSubmitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
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
