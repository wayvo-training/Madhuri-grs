"use client";

import { useMemo, useState } from "react";
import { filterDepartments } from "@/lib/admin/department-management/department-filters";
import type { SerializedDepartment } from "@/types/admin/departments";

const DEFAULT_PAGE_SIZE = 10;

export function useDepartments(initialDepartments: SerializedDepartment[]) {
  const [departments, setDepartments] =
    useState<SerializedDepartment[]>(initialDepartments);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const filteredDepartments = useMemo(() => {
    return filterDepartments(departments, searchQuery, statusFilter);
  }, [departments, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredDepartments.length / pageSize) || 1;

  const paginatedDepartments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDepartments.slice(start, start + pageSize);
  }, [filteredDepartments, currentPage, pageSize]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (statuses: string[]) => {
    setStatusFilter(statuses);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setCurrentPage(1);
  };

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

  return {
    departments,
    setDepartments,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    searchQuery,
    setSearchQuery: handleSearchChange,
    handleResetFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    filteredDepartments,
    paginatedDepartments,
    handleToggleStatus,
  };
}
