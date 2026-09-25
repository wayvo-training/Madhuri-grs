"use client";

import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PriorityBadge,
  SlaBadge,
  StatusBadge,
} from "@/components/dashboard/badges";
import { ActionMenu } from "@/components/ui/action-menu";
import { AdminGrievanceModal } from "./admin-grievance-modal";
import {
  AdminGrievanceToolbar,
  type TableTab,
} from "./admin-grievance-toolbar";

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
  supporting_departments?: {
    department_id: string;
    department_name: string;
  }[];
  reopen_count: number;
  manual_review_count: number;
}

export interface TabCounts {
  all: number;
  exceptions: number;
  active: number;
  slaRisk: number;
  closed: number;
}

interface AdminGrievanceTableProps {
  initialGrievances: SerializedGrievance[];
  initialTotalCount?: number;
  initialCounts?: TabCounts;
  departments: { department_id: string; department_name: string }[];
}

const PAGE_SIZE = 10;

export function AdminGrievanceTable({
  initialGrievances,
  initialTotalCount = 0,
  initialCounts,
  departments,
}: AdminGrievanceTableProps) {
  const router = useRouter();
  const [grievancesList, setGrievancesList] =
    useState<SerializedGrievance[]>(initialGrievances);
  const [totalCount, setTotalCount] = useState<number>(
    initialTotalCount || initialGrievances.length,
  );
  const [counts, setCounts] = useState<TabCounts>(
    initialCounts || {
      all: initialTotalCount || initialGrievances.length,
      exceptions: 0,
      active: 0,
      slaRisk: 0,
      closed: 0,
    },
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [activeModalGrievance, setActiveModalGrievance] =
    useState<SerializedGrievance | null>(null);

  const openGrievanceModal = (g: SerializedGrievance) => {
    setActiveModalGrievance(g);
  };

  // Table tabs
  const [activeTab, setActiveTab] = useState<TableTab>("ALL");

  const isInitialMount = useRef(true);

  // Debounce search query to avoid frequent server hits
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Check URL search params on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("search");
      if (q) {
        setSearchQuery(q);
        setDebouncedSearch(q);
      }
    }
  }, []);

  // Listen to global header search events
  useEffect(() => {
    const handleHeaderSearch = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (typeof customEvent.detail === "string") {
        setSearchQuery(customEvent.detail);
        setCurrentPage(1);
      }
    };
    window.addEventListener("grs:header-search", handleHeaderSearch);
    return () => {
      window.removeEventListener("grs:header-search", handleHeaderSearch);
    };
  }, []);

  // Fetch paginated grievances from server API
  const fetchGrievances = useCallback(
    async (
      page: number,
      tab: TableTab,
      search: string,
      priority: string,
      status: string,
      dept: string,
    ) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: PAGE_SIZE.toString(),
          tab,
          search,
          priority,
          status,
          department: dept,
        });

        const res = await fetch(`/api/admin/grievances?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch grievances");
        const data = await res.json();
        if (data.success) {
          setGrievancesList(data.grievances);
          setTotalCount(data.pagination.total);
          if (data.counts) {
            setCounts(data.counts);
          }
        }
      } catch (err) {
        console.error("Error fetching grievances:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const handleRouteSuccess = (
    grievanceId: string,
    assignedDept:
      | { department_id: string; department_name: string }
      | undefined,
    updatedSupporting: { department_id: string; department_name: string }[],
  ) => {
    setGrievancesList((prev) =>
      prev.map((g) =>
        g.grievance_id === grievanceId
          ? {
              ...g,
              status: "ROUTED",
              department_name: assignedDept
                ? assignedDept.department_name
                : g.department_name,
              supporting_departments: updatedSupporting,
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
              supporting_departments: updatedSupporting,
              manual_review_count: prev.manual_review_count + 1,
            }
          : null,
      );
    }

    fetchGrievances(
      currentPage,
      activeTab,
      debouncedSearch,
      selectedPriority,
      selectedStatus,
      selectedDept,
    );

    router.refresh();
  };

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

  // Filter or tab changes: reset to page 1 and fetch from server
  useEffect(() => {
    if (isInitialMount.current) {
      if (activeTab !== "ALL") {
        isInitialMount.current = false;
        fetchGrievances(
          1,
          activeTab,
          debouncedSearch,
          selectedPriority,
          selectedStatus,
          selectedDept,
        );
      } else {
        isInitialMount.current = false;
      }
      return;
    }

    setCurrentPage(1);
    fetchGrievances(
      1,
      activeTab,
      debouncedSearch,
      selectedPriority,
      selectedStatus,
      selectedDept,
    );
  }, [
    activeTab,
    debouncedSearch,
    selectedPriority,
    selectedStatus,
    selectedDept,
    fetchGrievances,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function handlePageChange(newPage: number) {
    if (newPage < 1 || newPage > totalPages || isLoading) return;
    setCurrentPage(newPage);
    fetchGrievances(
      newPage,
      activeTab,
      debouncedSearch,
      selectedPriority,
      selectedStatus,
      selectedDept,
    );
  }

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
            <h2 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Live Grievance Oversight Queue</span>
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
              )}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Showing page {currentPage} of {totalPages} ({totalCount} total
              records across all departments).
            </p>
          </div>
        </div>

        {/* Search and Dropdown Filters */}
        <AdminGrievanceToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={counts}
          departments={departments}
          selectedDept={selectedDept}
          setSelectedDept={setSelectedDept}
          selectedPriority={selectedPriority}
          setSelectedPriority={setSelectedPriority}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          setCurrentPage={setCurrentPage}
        />
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-2.5 pl-4 pr-2">Grievance ID</th>
              <th className="px-2 py-2.5">Subject</th>
              <th className="px-2 py-2.5">Category</th>
              <th className="px-2 py-2.5">Department</th>
              <th className="px-2 py-2.5">Submitter Name</th>
              <th className="px-2 py-2.5">Submitter Email</th>
              <th className="px-2 py-2.5">Priority</th>
              <th className="px-2 py-2.5">Status</th>
              <th className="px-2 py-2.5">SLA Health</th>
              <th className="py-2.5 pl-2 pr-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody
            className={`divide-y divide-slate-100 font-medium text-slate-700 transition-opacity duration-150 ${
              isLoading ? "opacity-50 pointer-events-none" : "opacity-100"
            }`}
          >
            {grievancesList.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="py-12 text-center text-slate-400 font-normal"
                >
                  <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  No grievances match the selected filters.
                </td>
              </tr>
            ) : (
              grievancesList.map((g) => {
                const isException =
                  g.status === "SUBMITTED" || !g.department_name;

                return (
                  <tr
                    key={g.grievance_id}
                    className="transition-colors hover:bg-slate-50/80"
                  >
                    {/* ID */}
                    <td className="whitespace-nowrap py-2.5 pl-4 pr-2 font-mono font-bold text-slate-900">
                      {g.grievance_number}
                    </td>

                    {/* Subject */}
                    <td className="max-w-xs px-2 py-2.5">
                      <p className="truncate font-semibold text-slate-900">
                        {g.title}
                      </p>
                    </td>

                    {/* Category */}
                    <td className="max-w-xs px-2 py-2.5">
                      <p className="text-xs font-medium text-slate-700">
                        {g.category_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {g.subcategory_name}
                      </p>
                    </td>

                    {/* Department */}
                    <td className="whitespace-nowrap px-2 py-2.5">
                      {g.department_name ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            {g.department_name}
                          </span>
                          {g.supporting_departments &&
                            g.supporting_departments.length > 0 && (
                              <span
                                title={`Supporting: ${g.supporting_departments.map((d) => d.department_name).join(", ")}`}
                                className="inline-flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5 text-xs font-medium text-slate-500 border border-slate-200/80 cursor-help"
                              >
                                +{g.supporting_departments.length} supporting
                              </span>
                            )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          <AlertTriangle className="h-3 w-3" />
                          Unrouted Exception
                        </span>
                      )}
                    </td>

                    {/* Submitter Name */}
                    <td className="whitespace-nowrap px-2 py-2.5 text-slate-600">
                      <p className="font-medium text-slate-900">
                        {g.submitted_by_name}
                      </p>
                    </td>

                    {/* Submitter Email */}
                    <td className="whitespace-nowrap px-2 py-2.5 text-slate-600">
                      <p className="text-xs text-slate-500">
                        {g.submitted_by_email}
                      </p>
                    </td>

                    {/* Priority */}
                    <td className="whitespace-nowrap px-2 py-2.5">
                      <PriorityBadge priority={g.priority} />
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-2 py-2.5">
                      <StatusBadge status={g.status} />
                    </td>

                    {/* SLA Health */}
                    <td className="whitespace-nowrap px-2 py-2.5">
                      <SlaBadge status={g.sla_status} />
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap py-2.5 pl-2 pr-4 text-right">
                      <ActionMenu
                        widthClass="w-24"
                        items={[
                          {
                            label: "View",
                            onClick: () => openGrievanceModal(g),
                          },
                          ...(isException
                            ? [
                                {
                                  label: "Route",
                                  icon: (
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                  ),
                                  variant: "warning" as const,
                                  onClick: () => openGrievanceModal(g),
                                },
                              ]
                            : []),
                        ]}
                      />
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
          of <span className="font-semibold text-slate-700">{totalCount}</span>{" "}
          tickets
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
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
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Detail Modal / Drawer */}
      {activeModalGrievance && (
        <AdminGrievanceModal
          grievance={activeModalGrievance}
          departments={departments}
          onClose={() => setActiveModalGrievance(null)}
          onRouteSuccess={handleRouteSuccess}
        />
      )}
    </div>
  );
}
