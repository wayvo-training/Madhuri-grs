"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  SerializedGrievance,
  SupportingDepartment,
  TabCounts,
  TableTab,
} from "@/types/admin/grievances";

export function useAdminGrievances(
  initialGrievances: SerializedGrievance[],
  initialTotalCount = 0,
  initialCounts?: TabCounts,
  initialTab: TableTab = "ALL",
  initialPriority: string[] = [],
  initialStatus: string[] = [],
  initialSla: string[] = [],
  initialSearch = "",
  initialDept: string[] = [],
) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const deduped = useMemo(
    () =>
      Array.from(
        new Map(initialGrievances.map((g) => [g.grievance_id, g])).values(),
      ),
    [initialGrievances],
  );

  const [grievancesList, setGrievancesList] =
    useState<SerializedGrievance[]>(deduped);
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
  const [pageSize, setPageSize] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedPriority, setSelectedPriority] =
    useState<string[]>(initialPriority);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(initialStatus);
  const [selectedDept, setSelectedDept] = useState<string[]>(initialDept);
  const [selectedSla, setSelectedSla] = useState<string[]>(initialSla);
  const [activeTab, setActiveTab] = useState<TableTab>(initialTab);
  const [activeModalGrievance, setActiveModalGrievance] =
    useState<SerializedGrievance | null>(null);

  const isInitialMount = useRef(true);

  // Debounce search query to avoid frequent server hits
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync with reactive Next.js searchParams
  useEffect(() => {
    if (!searchParams) return;
    const tabParam =
      (searchParams.get("tab")?.toUpperCase() as TableTab) || "ALL";
    const statusParam = searchParams.get("status");
    let parsedStatus: string[] = [];
    if (statusParam && statusParam !== "ALL") {
      let stats = statusParam.split(",").map((s) => s.trim().toUpperCase());
      if (stats.includes("UNASSIGNED")) {
        stats = stats
          .filter((s) => s !== "UNASSIGNED")
          .concat(["SUBMITTED", "ROUTED"]);
      }
      if (stats.includes("IN_PROGRESS")) {
        if (!stats.includes("UNDER_REVIEW")) stats.push("UNDER_REVIEW");
        if (!stats.includes("ESCALATED")) stats.push("ESCALATED");
      }
      if (stats.includes("REOPENED") && !stats.includes("REOPEN_REVIEW")) {
        stats.push("REOPEN_REVIEW");
      }
      parsedStatus = stats;
    }
    const priorityParam = searchParams.get("priority");
    const parsedPriority =
      priorityParam && priorityParam !== "ALL"
        ? priorityParam.split(",").map((p) => p.trim().toUpperCase())
        : [];
    const slaParam = searchParams.get("sla_status") || searchParams.get("sla");
    let parsedSla: string[] = [];
    if (slaParam && slaParam !== "ALL") {
      let slas = slaParam.split(",").map((s) => s.trim().toUpperCase());
      slas = slas.map((s) =>
        s === "SLA_CRITICAL" ? "BREACHED" : s === "SLA_RISK" ? "AT_RISK" : s,
      );
      parsedSla = slas;
    }
    const q = searchParams.get("search")?.trim() || "";

    const tabChanged = tabParam !== activeTab;
    const statusChanged =
      JSON.stringify(parsedStatus) !== JSON.stringify(selectedStatus);
    const priorityChanged =
      JSON.stringify(parsedPriority) !== JSON.stringify(selectedPriority);
    const slaChanged =
      JSON.stringify(parsedSla) !== JSON.stringify(selectedSla);
    const searchChanged = q !== searchQuery;

    if (
      tabChanged ||
      statusChanged ||
      priorityChanged ||
      slaChanged ||
      searchChanged
    ) {
      if (tabChanged) setActiveTab(tabParam);
      if (statusChanged) setSelectedStatus(parsedStatus);
      if (priorityChanged) setSelectedPriority(parsedPriority);
      if (slaChanged) setSelectedSla(parsedSla);
      if (searchChanged) {
        setSearchQuery(q);
        setDebouncedSearch(q);
      }
    }
  }, [
    searchParams,
    activeTab,
    selectedStatus,
    selectedPriority,
    selectedSla,
    searchQuery,
  ]);

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
      priority: string[],
      status: string[],
      dept: string[],
      sla: string[],
      limitSize: number = pageSize,
    ) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limitSize.toString(),
          tab,
          search,
        });
        if (priority.length > 0) params.append("priority", priority.join(","));
        if (status.length > 0) params.append("status", status.join(","));
        if (dept.length > 0) params.append("department", dept.join(","));
        if (sla.length > 0) params.append("sla_status", sla.join(","));

        const res = await fetch(`/api/admin/grievances?${params.toString()}`);
        if (!res.ok) {
          const errData = (await res.json().catch(() => null)) as {
            message?: string;
          } | null;
          throw new Error(
            errData?.message ||
              `Failed to fetch grievances (HTTP ${res.status})`,
          );
        }
        const data = await res.json();
        if (data.success) {
          const unique = Array.from(
            new Map(
              (data.grievances as SerializedGrievance[]).map((g) => [
                g.grievance_id,
                g,
              ]),
            ).values(),
          );
          setGrievancesList(unique);
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
    [pageSize],
  );

  const handleRouteSuccess = (
    grievanceId: string,
    assignedDept:
      | { department_id: string; department_name: string }
      | undefined,
    updatedSupporting: SupportingDepartment[],
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
      selectedSla,
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
      isInitialMount.current = false;
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
      selectedSla,
    );
  }, [
    activeTab,
    debouncedSearch,
    selectedPriority,
    selectedStatus,
    selectedDept,
    selectedSla,
    fetchGrievances,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

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
      selectedSla,
      pageSize,
    );
  }

  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchGrievances(
      1,
      activeTab,
      debouncedSearch,
      selectedPriority,
      selectedStatus,
      selectedDept,
      selectedSla,
      newSize,
    );
  }

  return {
    grievancesList,
    totalCount,
    counts,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    onPageSizeChange: handlePageSizeChange,
    totalPages,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedPriority,
    setSelectedPriority,
    selectedStatus,
    setSelectedStatus,
    selectedDept,
    setSelectedDept,
    selectedSla,
    setSelectedSla,
    activeTab,
    setActiveTab,
    activeModalGrievance,
    setActiveModalGrievance,
    openGrievanceModal: (g: SerializedGrievance) => setActiveModalGrievance(g),
    closeGrievanceModal: () => setActiveModalGrievance(null),
    handlePageChange,
    handleRouteSuccess,
  };
}
