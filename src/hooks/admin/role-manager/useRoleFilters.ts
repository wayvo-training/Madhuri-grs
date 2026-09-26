"use client";

import { useMemo, useState } from "react";
import {
  filterPermissions,
  filterRoles,
} from "@/lib/admin/role-manager/role-filters";
import type {
  PermStatusFilter,
  RoleManagerTab,
  RoleStatusFilter,
  SerializedPermission,
  SerializedRole,
} from "@/types/admin/role-manager";

const PAGE_SIZE = 10;

export function useRoleFilters(
  roles: SerializedRole[],
  permissionsList: SerializedPermission[],
) {
  const [activeTab, setActiveTab] = useState<RoleManagerTab>("roles");

  // Filter & Search states for Roles
  const [roleSearch, setRoleSearch] = useState("");
  const [roleStatusFilter, setRoleStatusFilter] =
    useState<RoleStatusFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & Search states for Permissions
  const [permSearch, setPermSearch] = useState("");
  const [permStatusFilter, setPermStatusFilter] =
    useState<PermStatusFilter>("ALL");

  const filteredRoles = useMemo(() => {
    return filterRoles(roles, roleSearch, roleStatusFilter);
  }, [roles, roleSearch, roleStatusFilter]);

  const totalPages = Math.ceil(filteredRoles.length / PAGE_SIZE) || 1;

  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRoles.slice(start, start + PAGE_SIZE);
  }, [filteredRoles, currentPage]);

  const activeRolesCount = useMemo(
    () => roles.filter((r) => r.status === "ACTIVE").length,
    [roles],
  );

  const inactiveRolesCount = useMemo(
    () => roles.filter((r) => r.status === "INACTIVE").length,
    [roles],
  );

  const filteredPermissions = useMemo(() => {
    return filterPermissions(permissionsList, permSearch, permStatusFilter);
  }, [permissionsList, permSearch, permStatusFilter]);

  const activePermsCount = useMemo(
    () => permissionsList.filter((p) => p.status === "ACTIVE").length,
    [permissionsList],
  );

  const inactivePermsCount = useMemo(
    () => permissionsList.filter((p) => p.status === "INACTIVE").length,
    [permissionsList],
  );

  const handleRoleSearchChange = (value: string) => {
    setRoleSearch(value);
    setCurrentPage(1);
  };

  const handleRoleStatusChange = (status: RoleStatusFilter) => {
    setRoleStatusFilter(status);
    setCurrentPage(1);
  };

  return {
    activeTab,
    setActiveTab,
    roleSearch,
    setRoleSearch: handleRoleSearchChange,
    roleStatusFilter,
    setRoleStatusFilter: handleRoleStatusChange,
    currentPage,
    setCurrentPage,
    pageSize: PAGE_SIZE,
    totalPages,
    filteredRoles,
    paginatedRoles,
    activeRolesCount,
    inactiveRolesCount,
    permSearch,
    setPermSearch,
    permStatusFilter,
    setPermStatusFilter,
    filteredPermissions,
    activePermsCount,
    inactivePermsCount,
  };
}
