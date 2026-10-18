import { useMemo, useState } from "react";
import { toast } from "sonner";
import { updateUserAction } from "@/actions/user.actions";
import type {
  FilterMode,
  SearchCondition,
} from "@/components/ui/advanced-table-search";
import { evaluateSearchConditions } from "@/lib/search-evaluator";
import type {
  SerializedUser,
  UserRoleFilter,
  UserStatusFilter,
} from "@/types/admin/users";

export function useUsers(initialUsers: SerializedUser[]) {
  const [users, setUsers] = useState<SerializedUser[]>(initialUsers);
  const [searchConditions, setSearchConditions] = useState<SearchCondition[]>(
    [],
  );
  const [filterMode, setFilterMode] = useState<FilterMode>("AND");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleResetFilters = () => {
    setSearchConditions([]);
    setFilterMode("AND");
    setSearchQuery("");
    setRoleFilter("ALL");
    setDeptFilter("ALL");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  const handleSearchChange = (
    conditions: SearchCondition[],
    mode: FilterMode,
  ) => {
    setSearchConditions(conditions);
    setFilterMode(mode);
    setCurrentPage(1);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Smart search conditions check
      if (searchConditions.length > 0) {
        if (!evaluateSearchConditions(user, searchConditions, filterMode)) {
          return false;
        }
      }

      // Fallback search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName =
          `${user.first_name} ${user.last_name || ""}`.toLowerCase();
        const matchesQuery =
          fullName.includes(q) ||
          user.email.toLowerCase().includes(q) ||
          user.employee_code.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Role filter
      if (roleFilter !== "ALL" && user.role_name !== roleFilter) {
        return false;
      }

      // Department filter
      if (deptFilter !== "ALL" && user.department_id !== deptFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "ALL" && user.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [
    users,
    searchConditions,
    filterMode,
    searchQuery,
    roleFilter,
    deptFilter,
    statusFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handleToggleStatus = async (user: SerializedUser) => {
    const nextStatus: "ACTIVE" | "INACTIVE" =
      user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await updateUserAction({
        user_id: user.user_id,
        status: nextStatus,
      });
      const updatedUser = res.user;
      if (res.success && updatedUser) {
        setUsers((prev) =>
          prev.map((u) => (u.user_id === user.user_id ? updatedUser : u)),
        );
        toast.success(
          `User ${user.first_name} is now ${nextStatus.toLowerCase()}.`,
        );
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to toggle status",
      );
    }
  };

  return {
    users,
    setUsers,
    searchConditions,
    filterMode,
    handleSearchChange,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    deptFilter,
    setDeptFilter,
    statusFilter,
    setStatusFilter,
    handleResetFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    filteredUsers,
    paginatedUsers,
    handleToggleStatus,
  };
}
