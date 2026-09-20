"use client";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  PriorityBadge,
  SlaBadge,
  StatusBadge,
} from "@/components/dashboard/badges";

export interface SerializedGrievance {
  grievance_id: string;
  grievance_number: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  sla_status: string | null;
  due_at: string | null;
  created_at: string;
  category_name: string;
  subcategory_name: string;
  submitted_by_name: string;
  submitted_by_email: string;
  department_name: string | null;
  reopen_count: number;
  manual_review_count: number;
}

interface AdminGrievanceTableProps {
  initialGrievances: SerializedGrievance[];
  departments: { department_id: string; department_name: string }[];
}

export function AdminGrievanceTable({
  initialGrievances,
  departments,
}: AdminGrievanceTableProps) {
  const router = useRouter();
  const [grievancesList, setGrievancesList] =
    useState<SerializedGrievance[]>(initialGrievances);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [activeModalGrievance, setActiveModalGrievance] =
    useState<SerializedGrievance | null>(null);

  // Manual Routing Exception state
  const [targetDeptId, setTargetDeptId] = useState<string>("");
  const [isRouting, setIsRouting] = useState(false);
  const [routingFeedback, setRoutingFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleManualRoute(grievanceId: string) {
    if (!targetDeptId) return;

    try {
      setIsRouting(true);
      setRoutingFeedback(null);

      const res = await fetch(`/api/admin/grievances/${grievanceId}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department_id: targetDeptId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setRoutingFeedback({
          type: "error",
          text: data.message || "Failed to route grievance.",
        });
        setIsRouting(false);
        return;
      }

      const assignedDept = departments.find(
        (d) => d.department_id === targetDeptId,
      );

      setRoutingFeedback({
        type: "success",
        text: data.message || "Grievance routed successfully.",
      });

      // Update local state
      setGrievancesList((prev) =>
        prev.map((g) =>
          g.grievance_id === grievanceId
            ? {
                ...g,
                status: "ROUTED",
                department_name: assignedDept
                  ? assignedDept.department_name
                  : g.department_name,
                manual_review_count: g.manual_review_count + 1,
              }
            : g,
        ),
      );

      if (activeModalGrievance) {
        setActiveModalGrievance((prev) =>
          prev
            ? {
                ...prev,
                status: "ROUTED",
                department_name: assignedDept
                  ? assignedDept.department_name
                  : prev.department_name,
                manual_review_count: prev.manual_review_count + 1,
              }
            : null,
        );
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      setRoutingFeedback({
        type: "error",
        text: "An unexpected error occurred during manual routing.",
      });
    } finally {
      setIsRouting(false);
    }
  }

  // Table tabs
  type TableTab = "ALL" | "EXCEPTIONS" | "ACTIVE" | "SLA_RISK" | "CLOSED";
  const [activeTab, setActiveTab] = useState<TableTab>("ALL");

  // Sync with hash navigation (e.g. #routing-exceptions)
  useEffect(() => {
    function handleHash() {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes("exception") || hash.includes("routing-exceptions")) {
        setActiveTab("EXCEPTIONS");
      } else if (hash.includes("all-grievances")) {
        setActiveTab("ALL");
      }
    }
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Compute counts for tab counters
  const exceptionCount = useMemo(
    () =>
      grievancesList.filter(
        (g) => g.status === "SUBMITTED" || !g.department_name,
      ).length,
    [grievancesList],
  );

  const activeCount = useMemo(
    () =>
      grievancesList.filter((g) =>
        [
          "ROUTED",
          "ASSIGNED",
          "IN_PROGRESS",
          "UNDER_REVIEW",
          "REOPENED",
          "REOPEN_REVIEW",
        ].includes(g.status),
      ).length,
    [grievancesList],
  );

  const slaRiskCount = useMemo(
    () =>
      grievancesList.filter((g) =>
        ["AT_RISK", "BREACHED"].includes(g.sla_status || ""),
      ).length,
    [grievancesList],
  );

  const closedCount = useMemo(
    () => grievancesList.filter((g) => g.status === "CLOSED").length,
    [grievancesList],
  );

  // Filtered grievances
  const filteredGrievances = useMemo(() => {
    return grievancesList.filter((g) => {
      // Tab matching
      if (activeTab === "EXCEPTIONS") {
        if (g.status !== "SUBMITTED" && g.department_name) return false;
      } else if (activeTab === "ACTIVE") {
        if (
          ![
            "ROUTED",
            "ASSIGNED",
            "IN_PROGRESS",
            "UNDER_REVIEW",
            "REOPENED",
            "REOPEN_REVIEW",
          ].includes(g.status)
        )
          return false;
      } else if (activeTab === "SLA_RISK") {
        if (!["AT_RISK", "BREACHED"].includes(g.sla_status || "")) return false;
      } else if (activeTab === "CLOSED") {
        if (g.status !== "CLOSED") return false;
      }

      // Search matching
      const matchesSearch =
        !searchQuery ||
        g.grievance_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.submitted_by_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.subcategory_name.toLowerCase().includes(searchQuery.toLowerCase());

      // Priority matching
      const matchesPriority =
        selectedPriority === "ALL" || g.priority === selectedPriority;

      // Status matching
      const matchesStatus =
        selectedStatus === "ALL" || g.status === selectedStatus;

      // Department matching
      const matchesDept =
        selectedDept === "ALL" || g.department_name === selectedDept;

      return matchesSearch && matchesPriority && matchesStatus && matchesDept;
    });
  }, [
    grievancesList,
    activeTab,
    searchQuery,
    selectedPriority,
    selectedStatus,
    selectedDept,
  ]);

  const PAGE_SIZE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 on filter changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page when filter criteria changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedPriority, selectedStatus, selectedDept]);

  const totalPages = Math.ceil(filteredGrievances.length / PAGE_SIZE) || 1;
  const paginatedGrievances = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredGrievances.slice(start, start + PAGE_SIZE);
  }, [filteredGrievances, currentPage]);

  return (
    <div
      id="all-grievances"
      className="relative rounded-2xl border border-slate-200/80 bg-white shadow-xs"
    >
      <span id="routing-exceptions" className="absolute -top-24" />

      {/* Table Toolbar / Filters */}
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Live Grievance Oversight Queue
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Showing {filteredGrievances.length} of {initialGrievances.length}{" "}
              total records across all departments.
            </p>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "ALL"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({grievancesList.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("EXCEPTIONS")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === "EXCEPTIONS"
                  ? "bg-amber-500 text-white shadow-xs"
                  : exceptionCount > 0
                    ? "text-amber-700 bg-amber-50/80 hover:bg-amber-100"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Exceptions ({exceptionCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ACTIVE")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "ACTIVE"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Active ({activeCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("SLA_RISK")}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 transition ${
                activeTab === "SLA_RISK"
                  ? "bg-rose-600 text-white shadow-xs"
                  : slaRiskCount > 0
                    ? "text-rose-700 bg-rose-50 hover:bg-rose-100"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>SLA Risk ({slaRiskCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("CLOSED")}
              className={`rounded-lg px-3 py-1.5 transition ${
                activeTab === "CLOSED"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Closed ({closedCount})
            </button>
          </div>
        </div>

        {/* Search and Dropdown Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search ID, title, submitter, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/20"
            />
          </div>

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

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="ROUTED">Routed</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ESCALATED">Escalated</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3.5 pl-6 pr-3">Grievance ID</th>
              <th className="px-3 py-3.5">Subject & Category</th>
              <th className="px-3 py-3.5">Department</th>
              <th className="px-3 py-3.5">Submitter</th>
              <th className="px-3 py-3.5">Priority</th>
              <th className="px-3 py-3.5">Status</th>
              <th className="px-3 py-3.5">SLA Health</th>
              <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {filteredGrievances.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-slate-400 font-normal"
                >
                  <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  No grievances match the selected filters.
                </td>
              </tr>
            ) : (
              paginatedGrievances.map((g) => {
                const isException =
                  g.status === "SUBMITTED" || !g.department_name;

                return (
                  <tr
                    key={g.grievance_id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    {/* ID */}
                    <td className="whitespace-nowrap py-4 pl-6 pr-3 font-mono font-bold text-slate-900">
                      {g.grievance_number}
                    </td>

                    {/* Title & Category */}
                    <td className="max-w-xs px-3 py-4">
                      <p className="truncate font-semibold text-slate-900">
                        {g.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {g.category_name} &bull; {g.subcategory_name}
                      </p>
                    </td>

                    {/* Department */}
                    <td className="whitespace-nowrap px-3 py-4">
                      {g.department_name ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          {g.department_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          <AlertTriangle className="h-3 w-3" />
                          Unrouted Exception
                        </span>
                      )}
                    </td>

                    {/* Submitter */}
                    <td className="whitespace-nowrap px-3 py-4 text-slate-600">
                      <p className="font-medium text-slate-900">
                        {g.submitted_by_name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {g.submitted_by_email}
                      </p>
                    </td>

                    {/* Priority */}
                    <td className="whitespace-nowrap px-3 py-4">
                      <PriorityBadge priority={g.priority} />
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-3 py-4">
                      <StatusBadge status={g.status} />
                    </td>

                    {/* SLA Health */}
                    <td className="whitespace-nowrap px-3 py-4">
                      <SlaBadge status={g.sla_status} />
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap py-4 pl-3 pr-6 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setActiveModalGrievance(g)}
                        title="View Grievance Record"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-blue-600"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Inspect</span>
                      </button>

                      {/* Manual Routing Exception Action */}
                      {isException && (
                        <button
                          type="button"
                          onClick={() => setActiveModalGrievance(g)}
                          title="Manual Routing Exception"
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 shadow-xs transition hover:bg-amber-100"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          <span>Route</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredGrievances.length > PAGE_SIZE && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 px-6 py-3.5 text-xs text-slate-500">
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {(currentPage - 1) * PAGE_SIZE + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-700">
              {Math.min(currentPage * PAGE_SIZE, filteredGrievances.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {filteredGrievances.length}
            </span>{" "}
            tickets
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

      {/* Detail Modal / Drawer */}
      {activeModalGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-blue-600">
                    {activeModalGrievance.grievance_number}
                  </span>
                  <PriorityBadge priority={activeModalGrievance.priority} />
                  <StatusBadge status={activeModalGrievance.status} />
                </div>
                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  {activeModalGrievance.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalGrievance(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs text-slate-600">
              <div>
                <p className="font-semibold text-slate-700">Description</p>
                <p className="mt-1 rounded-xl bg-slate-50 p-3.5 leading-relaxed text-slate-800">
                  {activeModalGrievance.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 p-4">
                <div>
                  <p className="text-slate-400">Department</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {activeModalGrievance.department_name ||
                      "Pending Manual Routing"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Category & Subcategory</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {activeModalGrievance.category_name} &bull;{" "}
                    {activeModalGrievance.subcategory_name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Submitted By</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {activeModalGrievance.submitted_by_name} (
                    {activeModalGrievance.submitted_by_email})
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Submission Date</p>
                  <p className="mt-0.5 font-semibold text-slate-800">
                    {new Date(activeModalGrievance.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {activeModalGrievance.reopen_count > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
                  <p className="font-semibold">
                    Reopen Count: {activeModalGrievance.reopen_count}
                  </p>
                  <p className="mt-0.5 text-[11px]">
                    This grievance was reopened following previous resolution
                    rejection.
                  </p>
                </div>
              )}

              {/* Manual Routing Exception Action for Admin */}
              {(activeModalGrievance.status === "SUBMITTED" ||
                !activeModalGrievance.department_name) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Manual Routing Exception Workflow</span>
                  </div>
                  <p className="mt-1 text-[11px] text-amber-700">
                    This grievance requires manual department allocation because
                    automated routing rules did not match. Assign a primary
                    department to route this ticket to their triage queue.
                  </p>

                  <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <select
                      value={targetDeptId}
                      onChange={(e) => setTargetDeptId(e.target.value)}
                      className="h-9 flex-1 rounded-xl border border-amber-300 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                    >
                      <option value="">-- Select Target Department --</option>
                      {departments.map((d) => (
                        <option key={d.department_id} value={d.department_id}>
                          {d.department_name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        handleManualRoute(activeModalGrievance.grievance_id)
                      }
                      disabled={!targetDeptId || isRouting}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-700 disabled:opacity-50"
                    >
                      {isRouting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Routing...</span>
                        </>
                      ) : (
                        <>
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Confirm & Route</span>
                        </>
                      )}
                    </button>
                  </div>

                  {routingFeedback && (
                    <div
                      className={`mt-3 flex items-center gap-2 rounded-lg p-2.5 text-[11px] font-medium ${
                        routingFeedback.type === "success"
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border border-rose-200 bg-rose-50 text-rose-800"
                      }`}
                    >
                      {routingFeedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                      )}
                      <span>{routingFeedback.text}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setActiveModalGrievance(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
