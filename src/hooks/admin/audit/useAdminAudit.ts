"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SerializedAuditLog, TabCategory } from "@/types/admin/audit";

const DEFAULT_PAGE_SIZE = 10;

export function useAdminAudit(
  initialLogs: SerializedAuditLog[],
  initialTotalCount?: number,
) {
  const [logs, setLogs] = useState<SerializedAuditLog[]>(initialLogs);
  const [totalCount, setTotalCount] = useState<number>(
    initialTotalCount ?? initialLogs.length,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const isFirstMount = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Fetch paginated logs from server
  const fetchLogs = useCallback(
    async (
      page: number,
      category: TabCategory,
      search: string,
      signal?: AbortSignal,
    ) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pageSize.toString(),
        });
        if (category !== "ALL") params.set("category", category);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
          signal,
        });

        if (!res.ok) {
          console.warn(`Audit logs API responded with status ${res.status}`);
          return;
        }

        const data = await res.json();
        if (data.success) {
          setLogs(data.logs || []);
          if (data.pagination) {
            setTotalCount(data.pagination.total);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was deliberately cancelled due to new query or component unmount; ignore safely
          return;
        }
        console.warn(
          "Could not retrieve audit logs (server may be offline or restarting):",
          err,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize],
  );

  // Debounced server query on search or tab filter change
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(() => {
      fetchLogs(currentPage, activeTab, searchQuery, controller.signal);
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [currentPage, activeTab, searchQuery, fetchLogs]);

  const handleTabChange = (category: TabCategory) => {
    setActiveTab(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setActiveTab("ALL");
    setCurrentPage(1);
  };

  const toggleExpandLog = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  return {
    logs,
    totalCount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    isLoading,
    activeTab,
    setActiveTab: handleTabChange,
    searchQuery,
    setSearchQuery: handleSearchChange,
    handleResetFilters,
    expandedLogId,
    setExpandedLogId,
    toggleExpandLog,
  };
}
