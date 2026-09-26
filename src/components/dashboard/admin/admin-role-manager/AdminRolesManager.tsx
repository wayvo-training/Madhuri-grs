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
    feedback,
    setFeedback,
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
    editFeedback,
    setEditFeedback,
    openEditRoleModal,
    handleSaveEditRole,
  } = useRoleActions(permissionsList, setRoles);

  return (
    <div
      id="roles-permissions"
      className="rounded-2xl border border-slate-200/80 bg-white shadow-xs"
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
          togglingRoleId={togglingRoleId}
          onEditRole={openEditRoleModal}
          onToggleRoleStatus={handleToggleRoleStatus}
        />
      )}

      {activeTab === "permissions" && (
        <PermissionsTab
          permissionsList={permissionsList}
          filteredPermissions={filteredPermissions}
          activePermsCount={activePermsCount}
          inactivePermsCount={inactivePermsCount}
          permSearch={permSearch}
          onPermSearchChange={setPermSearch}
          permStatusFilter={permStatusFilter}
          onPermStatusChange={setPermStatusFilter}
          togglingPermId={togglingPermId}
          onTogglePermStatus={handleTogglePermStatus}
        />
      )}

      <RoleManagerModals
        isModalOpen={isModalOpen}
        feedback={feedback}
        newRoleName={newRoleName}
        newRoleDescription={newRoleDescription}
        newRoleStatus={newRoleStatus}
        permissionsList={permissionsList}
        selectedPermissionIds={selectedPermissionIds}
        isSubmitting={isSubmitting}
        onCloseCreate={() => {
          setIsModalOpen(false);
          setFeedback(null);
        }}
        onSubmitCreate={handleCreateRole}
        onSetNewRoleName={setNewRoleName}
        onSetNewRoleDescription={setNewRoleDescription}
        onSetNewRoleStatus={setNewRoleStatus}
        onTogglePermission={togglePermission}
        isEditModalOpen={isEditModalOpen}
        editingRoleName={editingRoleName}
        editDescription={editDescription}
        editStatus={editStatus}
        editPermissionIds={editPermissionIds}
        editFeedback={editFeedback}
        isEditSubmitting={isEditSubmitting}
        onCloseEdit={() => {
          setIsEditModalOpen(false);
          setEditFeedback(null);
        }}
        onSubmitEdit={handleSaveEditRole}
        onSetEditDescription={setEditDescription}
        onSetEditStatus={setEditStatus}
        onToggleEditPermission={toggleEditPermission}
      />
    </div>
  );
}
