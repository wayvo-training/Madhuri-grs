"use client";

import { useMemo, useState } from "react";
import type {
  FilterMode,
  SearchCondition,
} from "@/components/ui/advanced-table-search";
import {
  filterPermissions,
  filterRoles,
} from "@/lib/admin/role-manager/role-filters";
import type {
  RoleManagerTab,
  SerializedPermission,
  SerializedRole,
} from "@/types/admin/role-manager";

const DEFAULT_PAGE_SIZE = 10;

export function useRoleFilters(
  roles: SerializedRole[],
  permissionsList: SerializedPermission[],
) {
  const [activeTab, setActiveTab] = useState<RoleManagerTab>("roles");

  // Filter & Search states for Roles
  const [roleSearch, setRoleSearch] = useState("");
  const [roleConditions, setRoleConditions] = useState<SearchCondition[]>([]);
  const [roleFilterMode, setRoleFilterMode] = useState<FilterMode>("AND");
  const [roleStatusFilter, setRoleStatusFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [rolePageSize, setRolePageSize] = useState(DEFAULT_PAGE_SIZE);

  // Filter & Search states for Permissions
  const [permSearch, setPermSearch] = useState("");
  const [permConditions, setPermConditions] = useState<SearchCondition[]>([]);
  const [permFilterMode, setPermFilterMode] = useState<FilterMode>("AND");
  const [permStatusFilter, setPermStatusFilter] = useState<string[]>([]);
  const [permCurrentPage, setPermCurrentPage] = useState(1);
  const [permPageSize, setPermPageSize] = useState(DEFAULT_PAGE_SIZE);

  const filteredRoles = useMemo(() => {
    return filterRoles(
      roles,
      roleSearch,
      roleStatusFilter,
      roleConditions,
      roleFilterMode,
    );
  }, [roles, roleSearch, roleStatusFilter, roleConditions, roleFilterMode]);

  const totalPages = Math.ceil(filteredRoles.length / rolePageSize) || 1;

  const paginatedRoles = useMemo(() => {
    const start = (currentPage - 1) * rolePageSize;
    return filteredRoles.slice(start, start + rolePageSize);
  }, [filteredRoles, currentPage, rolePageSize]);

  const activeRolesCount = useMemo(
    () => roles.filter((r) => r.status === "ACTIVE").length,
    [roles],
  );

  const inactiveRolesCount = useMemo(
    () => roles.filter((r) => r.status === "INACTIVE").length,
    [roles],
  );

  const filteredPermissions = useMemo(() => {
    return filterPermissions(
      permissionsList,
      permSearch,
      permStatusFilter,
      permConditions,
      permFilterMode,
    );
  }, [
    permissionsList,
    permSearch,
    permStatusFilter,
    permConditions,
    permFilterMode,
  ]);

  const permTotalPages =
    Math.ceil(filteredPermissions.length / permPageSize) || 1;

  const paginatedPermissions = useMemo(() => {
    const start = (permCurrentPage - 1) * permPageSize;
    return filteredPermissions.slice(start, start + permPageSize);
  }, [filteredPermissions, permCurrentPage, permPageSize]);

  const activePermsCount = useMemo(
    () => permissionsList.filter((p) => p.status === "ACTIVE").length,
    [permissionsList],
  );

  const inactivePermsCount = useMemo(
    () => permissionsList.filter((p) => p.status === "INACTIVE").length,
    [permissionsList],
  );

  const handleRoleConditionsChange = (
    conditions: SearchCondition[],
    mode: FilterMode,
  ) => {
    setRoleConditions(conditions);
    setRoleFilterMode(mode || "AND");
    setCurrentPage(1);
  };

  const handleRoleSearchChange = (value: string) => {
    setRoleSearch(value);
    setCurrentPage(1);
  };

  const handleRoleStatusChange = (statuses: string[]) => {
    setRoleStatusFilter(statuses);
    setCurrentPage(1);
  };

  const handlePermConditionsChange = (
    conditions: SearchCondition[],
    mode: FilterMode,
  ) => {
    setPermConditions(conditions);
    setPermFilterMode(mode || "AND");
    setPermCurrentPage(1);
  };

  const handlePermSearchChange = (value: string) => {
    setPermSearch(value);
    setPermCurrentPage(1);
  };

  const handlePermStatusChange = (statuses: string[]) => {
    setPermStatusFilter(statuses);
    setPermCurrentPage(1);
  };

  return {
    activeTab,
    setActiveTab,
    roleSearch,
    setRoleSearch: handleRoleSearchChange,
    roleConditions,
    roleFilterMode,
    handleRoleConditionsChange,
    roleStatusFilter,
    setRoleStatusFilter: handleRoleStatusChange,
    currentPage,
    setCurrentPage,
    pageSize: rolePageSize,
    setPageSize: setRolePageSize,
    totalPages,
    filteredRoles,
    paginatedRoles,
    activeRolesCount,
    inactiveRolesCount,
    permSearch,
    setPermSearch: handlePermSearchChange,
    permConditions,
    permFilterMode,
    handlePermConditionsChange,
    permStatusFilter,
    setPermStatusFilter: handlePermStatusChange,
    filteredPermissions,
    paginatedPermissions,
    activePermsCount,
    inactivePermsCount,
    permCurrentPage,
    setPermCurrentPage,
    permPageSize,
    setPermPageSize,
    permTotalPages,
  };
}
