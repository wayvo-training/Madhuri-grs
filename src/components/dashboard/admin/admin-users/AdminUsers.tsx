"use client";

import { useUserActions } from "@/hooks/admin/user-management/useUserActions";
import { useUsers } from "@/hooks/admin/user-management/useUsers";
import type { AdminUsersProps } from "@/types/admin/users";
import { UserMetricCards } from "./components/UserMetricCards";
import { UserTable } from "./components/UserTable";
import { UserModals } from "./modals/UserModals";

export function AdminUsers({
  initialUsers,
  availableRoles = [],
  availableDepartments = [],
  stats,
}: AdminUsersProps) {
  const {
    users,
    setUsers,
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
  } = useUsers(initialUsers);

  const {
    openActionMenuId,
    setOpenActionMenuId,
    closeActionMenu,
    actionMenuRef,

    // Create
    isCreateModalOpen,
    setIsCreateModalOpen,
    openCreateModal,
    employeeCode,
    setEmployeeCode,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    password,
    setPassword,
    roleId,
    setRoleId,
    departmentId,
    setDepartmentId,
    status,
    setStatus,
    isSubmitting,
    handleCreateUser,

    // Edit
    isEditModalOpen,
    setIsEditModalOpen,
    editingUser,
    editEmployeeCode,
    setEditEmployeeCode,
    editFirstName,
    setEditFirstName,
    editLastName,
    setEditLastName,
    editEmail,
    setEditEmail,
    editRoleId,
    setEditRoleId,
    editDepartmentId,
    setEditDepartmentId,
    editStatus,
    setEditStatus,
    isEditSubmitting,
    openEditModal,
    handleSaveEditUser,

    // Reset Password
    isResetModalOpen,
    setIsResetModalOpen,
    resettingUser,
    newPassword,
    setNewPassword,
    isResetSubmitting,
    openResetModal,
    handleResetPassword,
  } = useUserActions(setUsers, availableRoles, availableDepartments);

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      {/* Top Metrics Cards */}
      <div className="shrink-0">
        <UserMetricCards users={users} stats={stats} />
      </div>

      {/* Main Users Table */}
      <UserTable
        users={users}
        filteredUsers={filteredUsers}
        paginatedUsers={paginatedUsers}
        availableRoles={availableRoles}
        availableDepartments={availableDepartments}
        onSearchChange={handleSearchChange}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onResetFilters={handleResetFilters}
        currentPage={currentPage}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        openActionMenuId={openActionMenuId}
        onToggleActionMenu={(id) =>
          setOpenActionMenuId(openActionMenuId === id ? null : id)
        }
        actionMenuRef={actionMenuRef}
        onCloseActionMenu={closeActionMenu}
        onOpenCreateModal={openCreateModal}
        onOpenEditModal={openEditModal}
        onOpenResetModal={openResetModal}
        onToggleStatus={handleToggleStatus}
      />

      {/* Modals for Create, Edit, and Password Reset */}
      <UserModals
        isCreateModalOpen={isCreateModalOpen}
        onCloseCreate={() => setIsCreateModalOpen(false)}
        onSubmitCreate={handleCreateUser}
        isCreateSubmitting={isSubmitting}
        employeeCode={employeeCode}
        onSetEmployeeCode={setEmployeeCode}
        firstName={firstName}
        onSetFirstName={setFirstName}
        lastName={lastName}
        onSetLastName={setLastName}
        email={email}
        onSetEmail={setEmail}
        password={password}
        onSetPassword={setPassword}
        roleId={roleId}
        onSetRoleId={setRoleId}
        departmentId={departmentId}
        onSetDepartmentId={setDepartmentId}
        status={status}
        onSetStatus={setStatus}
        isEditModalOpen={isEditModalOpen}
        onCloseEdit={() => setIsEditModalOpen(false)}
        onSubmitEdit={handleSaveEditUser}
        isEditSubmitting={isEditSubmitting}
        editingUser={editingUser}
        editEmployeeCode={editEmployeeCode}
        onSetEditEmployeeCode={setEditEmployeeCode}
        editFirstName={editFirstName}
        onSetEditFirstName={setEditFirstName}
        editLastName={editLastName}
        onSetEditLastName={setEditLastName}
        editEmail={editEmail}
        onSetEditEmail={setEditEmail}
        editRoleId={editRoleId}
        onSetEditRoleId={setEditRoleId}
        editDepartmentId={editDepartmentId}
        onSetEditDepartmentId={setEditDepartmentId}
        editStatus={editStatus}
        onSetEditStatus={setEditStatus}
        isResetModalOpen={isResetModalOpen}
        onCloseReset={() => setIsResetModalOpen(false)}
        onSubmitReset={handleResetPassword}
        isResetSubmitting={isResetSubmitting}
        resettingUser={resettingUser}
        newPassword={newPassword}
        onSetNewPassword={setNewPassword}
        availableRoles={availableRoles}
        availableDepartments={availableDepartments}
      />
    </div>
  );
}
