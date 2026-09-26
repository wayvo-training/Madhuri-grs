"use client";

import { useMemo, useState } from "react";
import { filterDepartments } from "@/lib/admin/department-management/department-filters";
import type {
  DepartmentStatusFilter,
  SerializedDepartment,
} from "@/types/admin/departments";

const PAGE_SIZE = 10;

export function useDepartments(initialDepartments: SerializedDepartment[]) {
  const [departments, setDepartments] =
    useState<SerializedDepartment[]>(initialDepartments);
  const [statusFilter, setStatusFilter] =
    useState<DepartmentStatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredDepartments = useMemo(() => {
    return filterDepartments(departments, searchQuery, statusFilter);
  }, [departments, statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredDepartments.length / PAGE_SIZE) || 1;

  const paginatedDepartments = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredDepartments.slice(start, start + PAGE_SIZE);
  }, [filteredDepartments, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: DepartmentStatusFilter) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
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
    pageSize: PAGE_SIZE,
    totalPages,
    filteredDepartments,
    paginatedDepartments,
    handleToggleStatus,
  };
}
