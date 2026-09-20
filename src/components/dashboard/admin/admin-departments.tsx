"use client";

import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
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
}

export function AdminDepartments({
  initialDepartments,
  totalGrievances,
}: AdminDepartmentsProps) {
  const router = useRouter();
  const [departments, setDepartments] =
    useState<SerializedDepartment[]>(initialDepartments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(departments.length / PAGE_SIZE) || 1;
  const paginatedDepartments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return departments.slice(start, start + PAGE_SIZE);
  }, [departments, currentPage]);

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
        setFeedback(null);
        router.refresh();
      }, 1000);
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
    <div
      id="departments"
      className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-2"
    >
      {/* Header with Add Department button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
              <Building2 className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Department Workload & Organization Structure
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Enterprise divisions configured for automated routing & resolution.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {departments.length} Active Departments
          </span>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Department</span>
          </button>
        </div>
      </div>

      {/* Departments Grid & Workload Bars */}
      <div className="mt-5 space-y-4">
        {departments.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-400">
            No active departments configured yet. Click "New Department" to get
            started.
          </p>
        ) : (
          paginatedDepartments.map((dept) => {
            const percentage =
              totalGrievances > 0
                ? Math.round((dept.grievance_count / totalGrievances) * 100)
                : 0;

            return (
              <div
                key={dept.department_id}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 transition hover:bg-slate-50"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 font-semibold text-slate-800">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                      <Building2 className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="text-slate-900 font-bold">
                        {dept.department_name}
                      </span>
                      {dept.description && (
                        <p className="text-[11px] font-normal text-slate-500 line-clamp-1">
                          {dept.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500">
                    {dept.user_count !== undefined && (
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <Users className="h-3 w-3 text-slate-400" />
                        {dept.user_count} staff
                      </span>
                    )}
                    <span className="font-semibold text-slate-700">
                      {dept.grievance_count} grievances ({percentage}%)
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${Math.max(percentage, 3)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {departments.length > PAGE_SIZE && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 mt-4 pt-3.5 text-xs text-slate-500">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {(currentPage - 1) * PAGE_SIZE + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(currentPage * PAGE_SIZE, departments.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {departments.length}
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
      )}

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

            <form onSubmit={handleCreateDepartment} className="mt-4 space-y-4">
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
    </div>
  );
}
