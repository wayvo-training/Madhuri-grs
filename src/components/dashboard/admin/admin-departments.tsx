"use client";

import {
  Activity,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DepartmentModals } from "@/components/dashboard/admin/admin-departments-modals";
import {
  AdminFilterToolbar,
  AdminMetricCard,
  AdminPanelHeader,
  AdminSearchInput,
  AdminToolbarAction,
} from "@/components/dashboard/admin/admin-shared";

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
  departmentHeads?: {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
  }[];
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
  departmentHeads = [],
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
  const [deptCode, setDeptCode] = useState("");
  const [selectedHeadId, setSelectedHeadId] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
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

  // Action menu state (3-dot menu)
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  const closeActionMenu = useCallback(() => setOpenActionMenuId(null), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(e.target as Node)
      ) {
        closeActionMenu();
      }
    }
    if (openActionMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openActionMenuId, closeActionMenu]);

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
    if (!deptName.trim()) {
      setFeedback({ type: "error", text: "Department name is required." });
      return;
    }
    if (!deptCode.trim() || deptCode.trim().length < 2) {
      setFeedback({
        type: "error",
        text: "Department code is required (e.g. HR, FIN, IT, FAC).",
      });
      return;
    }
    if (!selectedHeadId) {
      setFeedback({
        type: "error",
        text: "Department Head is required. Please select a Department Head.",
      });
      return;
    }
    if (!contactEmail.trim()) {
      setFeedback({
        type: "error",
        text: "Department contact email is required.",
      });
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      setFeedback({
        type: "error",
        text: "Department description is mandatory (minimum 20 characters) detailing grievance jurisdiction.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department_name: deptName.trim(),
          department_code: deptCode.trim().toUpperCase(),
          head_user_id: selectedHeadId,
          description: description.trim(),
          contact_email: contactEmail.trim(),
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
          user_count: 1,
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
        setDeptCode("");
        setSelectedHeadId("");
        setDescription("");
        setContactEmail("");
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard
          title="Total Departments"
          value={stats?.total ?? departments.length}
          helper="Divisions"
          icon={Building2}
          accent="emerald"
        />
        <AdminMetricCard
          title="Active Departments"
          value={
            stats?.active ??
            departments.filter((d) => (d.status || "ACTIVE") === "ACTIVE")
              .length
          }
          helper="Routing enabled"
          icon={CheckCircle2}
          accent="emerald"
        />
        <AdminMetricCard
          title="Deactivated / Inactive"
          value={
            stats?.inactive ??
            departments.filter((d) => d.status === "INACTIVE").length
          }
          helper="Suspended"
          icon={Power}
          accent="amber"
        />
        <AdminMetricCard
          title="Assigned Grievances"
          value={stats?.totalGrievances ?? totalGrievances}
          helper="In lifecycle"
          icon={Activity}
          accent="slate"
        />
      </div>

      <div
        id="departments"
        className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs"
      >
        <div className="border-b border-slate-100 pb-5">
          <AdminPanelHeader
            title="Department Workload & Governance"
            description="Enterprise divisions configured for automated routing, status governance, and workload resolution."
            action={
              <AdminFilterToolbar
                action={
                  <AdminToolbarAction onClick={() => setIsModalOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Department</span>
                  </AdminToolbarAction>
                }
              >
                <AdminSearchInput
                  value={searchQuery}
                  onChange={(value) => {
                    setSearchQuery(value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search department..."
                />
                <div className="relative shrink-0">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(
                        e.target.value as "ALL" | "ACTIVE" | "INACTIVE",
                      );
                      setCurrentPage(1);
                    }}
                    className="h-9 appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-3 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </div>
                </div>
              </AdminFilterToolbar>
            }
          />
        </div>

        {/* Departments Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  S.No
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Department
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Description
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Status
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Staff
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Cases
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-8 ring-emerald-50/50">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 text-sm font-bold text-slate-900">
                        No matching departments found
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        No departments match your current status filter or
                        search query.
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
                  </td>
                </tr>
              ) : (
                paginatedDepartments.map((dept, index) => {
                  const isDeptActive = (dept.status || "ACTIVE") === "ACTIVE";

                  return (
                    <tr
                      key={dept.department_id}
                      className={`border-b border-slate-100 transition ${
                        isDeptActive
                          ? "bg-white hover:bg-slate-50/60"
                          : "bg-slate-50/40 opacity-80"
                      }`}
                    >
                      {/* S.No */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-slate-500">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>

                      {/* Department Name */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                              isDeptActive
                                ? "bg-emerald-100/80 text-emerald-800"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            <Building2 className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm font-semibold text-slate-900">
                            {dept.department_name}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="max-w-[220px] px-4 py-3.5">
                        <p className="truncate text-sm font-normal text-slate-500">
                          {dept.description || "—"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                            isDeptActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isDeptActive ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          {isDeptActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Staff */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-sm text-slate-600 font-medium">
                          <Users className="h-3 w-3 text-slate-400" />
                          {dept.user_count ?? 0}
                        </span>
                      </td>

                      {/* Cases */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm font-medium text-slate-700">
                        {dept.grievance_count}
                      </td>

                      {/* Action - 3 dots menu */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div
                          className="relative"
                          ref={
                            openActionMenuId === dept.department_id
                              ? actionMenuRef
                              : undefined
                          }
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenActionMenuId(
                                openActionMenuId === dept.department_id
                                  ? null
                                  : dept.department_id,
                              )
                            }
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </button>
                          {openActionMenuId === dept.department_id && (
                            <div className="absolute right-0 top-full z-20 mt-1 min-w-[120px] rounded-xl border border-slate-200 bg-white py-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
                              <button
                                type="button"
                                onClick={() => {
                                  closeActionMenu();
                                  openEditModal(dept);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-emerald-800"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  closeActionMenu();
                                  handleToggleStatus(dept);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-emerald-800"
                              >
                                <Power className="h-3 w-3" />
                                {isDeptActive ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Persistent Pagination Footer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 mt-5 pt-3.5 text-[13px] text-slate-500">
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

        <DepartmentModals
          isModalOpen={isModalOpen}
          feedback={feedback}
          deptName={deptName}
          deptCode={deptCode}
          selectedHeadId={selectedHeadId}
          description={description}
          contactEmail={contactEmail}
          deptStatus={deptStatus}
          isSubmitting={isSubmitting}
          departmentHeads={departmentHeads}
          onCloseCreate={() => {
            setIsModalOpen(false);
            setFeedback(null);
          }}
          onSubmitCreate={handleCreateDepartment}
          onSetDeptName={setDeptName}
          onSetDeptCode={setDeptCode}
          onSetSelectedHeadId={setSelectedHeadId}
          onSetDescription={setDescription}
          onSetContactEmail={setContactEmail}
          onSetDeptStatus={setDeptStatus}
          isEditModalOpen={isEditModalOpen}
          editDeptName={editDeptName}
          editDescription={editDescription}
          editStatus={editStatus}
          isEditSubmitting={isEditSubmitting}
          editFeedback={editFeedback}
          onCloseEdit={() => {
            setIsEditModalOpen(false);
            setEditFeedback(null);
          }}
          onSubmitEdit={handleSaveEditDepartment}
          onSetEditDeptName={setEditDeptName}
          onSetEditDescription={setEditDescription}
          onSetEditStatus={setEditStatus}
        />
      </div>
    </div>
  );
}
