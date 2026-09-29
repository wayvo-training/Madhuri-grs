"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  SerializedGrievance,
  SupportingDepartment,
  TabCounts,
  TableTab,
} from "@/types/admin/grievances";

const PAGE_SIZE = 10;

export function useAdminGrievances(
  initialGrievances: SerializedGrievance[],
  initialTotalCount = 0,
  initialCounts?: TabCounts,
) {
  const router = useRouter();
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
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string[]>([]);
  const [selectedSla, setSelectedSla] = useState<string[]>([]);
  const [activeModalGrievance, setActiveModalGrievance] =
    useState<SerializedGrievance | null>(null);

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
      priority: string[],
      status: string[],
      dept: string[],
      sla: string[],
    ) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: PAGE_SIZE.toString(),
          tab,
          search,
        });
        if (priority.length > 0) params.append("priority", priority.join(","));
        if (status.length > 0) params.append("status", status.join(","));
        if (dept.length > 0) params.append("department", dept.join(","));
        if (sla.length > 0) params.append("sla_status", sla.join(","));

        const res = await fetch(`/api/admin/grievances?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch grievances");
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
    [],
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
      if (activeTab !== "ALL") {
        isInitialMount.current = false;
        fetchGrievances(
          1,
          activeTab,
          debouncedSearch,
          selectedPriority,
          selectedStatus,
          selectedDept,
          selectedSla,
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
      selectedSla,
    );
  }

  return {
    grievancesList,
    totalCount,
    counts,
    currentPage,
    setCurrentPage,
    pageSize: PAGE_SIZE,
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
