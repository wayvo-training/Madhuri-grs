"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SerializedAuditLog, TabCategory } from "@/types/admin/audit";

const PAGE_SIZE = 10;

export function useAdminAudit(
  initialLogs: SerializedAuditLog[],
  initialTotalCount?: number,
) {
  const [logs, setLogs] = useState<SerializedAuditLog[]>(initialLogs);
  const [totalCount, setTotalCount] = useState<number>(
    initialTotalCount ?? initialLogs.length,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const isFirstMount = useRef(true);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  // Fetch paginated logs from server
  const fetchLogs = useCallback(
    async (page: number, category: TabCategory, search: string) => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: PAGE_SIZE.toString(),
        });
        if (category !== "ALL") params.set("category", category);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setLogs(data.logs || []);
          if (data.pagination) {
            setTotalCount(data.pagination.total);
          }
        }
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Debounced server query on search or tab filter change
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      fetchLogs(currentPage, activeTab, searchQuery);
    }, 300);

    return () => clearTimeout(timer);
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
    pageSize: PAGE_SIZE,
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
