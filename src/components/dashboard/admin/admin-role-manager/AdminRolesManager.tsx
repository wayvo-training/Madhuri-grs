"use client";

import { useAdminRoles } from "@/hooks/admin/role-manager/useAdminRoles";
import { useRoleActions } from "@/hooks/admin/role-manager/useRoleActions";
import { useRoleFilters } from "@/hooks/admin/role-manager/useRoleFilters";
import type { AdminRolesManagerProps } from "@/types/admin/role-manager";
import { PermissionsTab } from "./components/PermissionsTab";
import { RoleManagerHeader } from "./components/RoleManagerHeader";
import { RolesTab } from "./components/RolesTab";
import { RoleManagerModals } from "./modals/RoleManagerModals";

export function AdminRolesManager({
  initialRoles,
  availablePermissions,
}: AdminRolesManagerProps) {
  const {
    roles,
    setRoles,
    permissionsList,
    togglingRoleId,
    togglingPermId,
    actionNotice,
    handleToggleRoleStatus,
    handleTogglePermStatus,
  } = useAdminRoles(initialRoles, availablePermissions);

  const {
    activeTab,
    setActiveTab,
    roleSearch,
    setRoleSearch,
    roleStatusFilter,
    setRoleStatusFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
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
    paginatedPermissions,
    activePermsCount,
    inactivePermsCount,
    permCurrentPage,
    setPermCurrentPage,
    permPageSize,
    setPermPageSize,
    permTotalPages,
  } = useRoleFilters(roles, permissionsList);

  const {
    isModalOpen,
    setIsModalOpen,
    newRoleName,
    setNewRoleName,
    newRoleDescription,
    setNewRoleDescription,
    newRoleStatus,
    setNewRoleStatus,
    selectedPermissionIds,
    togglePermission,
    isSubmitting,
    handleCreateRole,
    isEditModalOpen,
    setIsEditModalOpen,
    editingRoleName,
    editDescription,
    setEditDescription,
    editStatus,
    setEditStatus,
    editPermissionIds,
    toggleEditPermission,
    isEditSubmitting,
    openEditRoleModal,
    handleSaveEditRole,
  } = useRoleActions(permissionsList, setRoles);

  return (
    <div
      id="roles-permissions"
      className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
    >
      <RoleManagerHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCreateModal={() => setIsModalOpen(true)}
        rolesCount={roles.length}
        permissionsCount={permissionsList.length}
        actionNotice={actionNotice}
      />

      {activeTab === "roles" && (
        <RolesTab
          roles={roles}
          paginatedRoles={paginatedRoles}
          filteredRolesCount={filteredRoles.length}
          activeRolesCount={activeRolesCount}
          inactiveRolesCount={inactiveRolesCount}
          roleSearch={roleSearch}
          onRoleSearchChange={setRoleSearch}
          roleStatusFilter={roleStatusFilter}
          onRoleStatusChange={setRoleStatusFilter}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          togglingRoleId={togglingRoleId}
          onEditRole={openEditRoleModal}
          onToggleRoleStatus={handleToggleRoleStatus}
          onTabChange={setActiveTab}
        />
      )}

      {activeTab === "permissions" && (
        <PermissionsTab
          permissionsList={permissionsList}
          filteredPermissions={filteredPermissions}
          paginatedPermissions={paginatedPermissions}
          activePermsCount={activePermsCount}
          inactivePermsCount={inactivePermsCount}
          permSearch={permSearch}
          onPermSearchChange={setPermSearch}
          permStatusFilter={permStatusFilter}
          onPermStatusChange={setPermStatusFilter}
          togglingPermId={togglingPermId}
          onTogglePermStatus={handleTogglePermStatus}
          currentPage={permCurrentPage}
          totalPages={permTotalPages}
          pageSize={permPageSize}
          onPageChange={setPermCurrentPage}
          onPageSizeChange={setPermPageSize}
          onTabChange={setActiveTab}
        />
      )}

      <RoleManagerModals
        isModalOpen={isModalOpen}
        newRoleName={newRoleName}
        newRoleDescription={newRoleDescription}
        permissionsList={permissionsList}
        selectedPermissionIds={selectedPermissionIds}
        isSubmitting={isSubmitting}
        onCloseCreate={() => {
          setIsModalOpen(false);
        }}
        onSubmitCreate={handleCreateRole}
        onSetNewRoleName={setNewRoleName}
        onSetNewRoleDescription={setNewRoleDescription}
        onTogglePermission={togglePermission}
        isEditModalOpen={isEditModalOpen}
        editingRoleName={editingRoleName}
        editDescription={editDescription}
        editPermissionIds={editPermissionIds}
        isEditSubmitting={isEditSubmitting}
        onCloseEdit={() => {
          setIsEditModalOpen(false);
        }}
        onSubmitEdit={handleSaveEditRole}
        onSetEditDescription={setEditDescription}
        onToggleEditPermission={toggleEditPermission}
      />
    </div>
  );
}
