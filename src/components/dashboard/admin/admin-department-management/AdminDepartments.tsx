"use client";

import { useDepartmentActions } from "@/hooks/admin/department-management/useDepartmentActions";
import { useDepartments } from "@/hooks/admin/department-management/useDepartments";
import type { AdminDepartmentsProps } from "@/types/admin/departments";
import { DepartmentMetricCards } from "./components/DepartmentMetricCards";
import { DepartmentTable } from "./components/DepartmentTable";
import { DepartmentModals } from "./modals/DepartmentModals";

export function AdminDepartments({
  initialDepartments,
  departmentHeads = [],
  totalGrievances,
  stats,
}: AdminDepartmentsProps) {
  const {
    departments,
    setDepartments,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    handleResetFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    filteredDepartments,
    paginatedDepartments,
    handleToggleStatus,
  } = useDepartments(initialDepartments);

  const {
    isModalOpen,
    setIsModalOpen,
    deptName,
    setDeptName,
    deptCode,
    setDeptCode,
    selectedHeadId,
    setSelectedHeadId,
    description,
    setDescription,
    contactEmail,
    setContactEmail,
    isSubmitting,
    handleCreateDepartment,
    isEditModalOpen,
    setIsEditModalOpen,
    editDeptName,
    setEditDeptName,
    editDescription,
    setEditDescription,
    editStatus,
    setEditStatus,
    isEditSubmitting,
    openEditModal,
    handleSaveEditDepartment,
    openActionMenuId,
    setOpenActionMenuId,
    closeActionMenu,
    actionMenuRef,
  } = useDepartmentActions(setDepartments, departmentHeads);

  return (
    <div className="space-y-6">
      <DepartmentMetricCards
        departments={departments}
        totalGrievances={totalGrievances}
        stats={stats}
      />

      <DepartmentTable
        departments={departments}
        filteredDepartments={filteredDepartments}
        paginatedDepartments={paginatedDepartments}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
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
        onOpenCreateModal={() => setIsModalOpen(true)}
        onOpenEditModal={openEditModal}
        onToggleStatus={handleToggleStatus}
        onCloseActionMenu={closeActionMenu}
      />

      <DepartmentModals
        isModalOpen={isModalOpen}
        deptName={deptName}
        deptCode={deptCode}
        selectedHeadId={selectedHeadId}
        description={description}
        contactEmail={contactEmail}
        isSubmitting={isSubmitting}
        departmentHeads={departmentHeads}
        onCloseCreate={() => {
          setIsModalOpen(false);
        }}
        onSubmitCreate={handleCreateDepartment}
        onSetDeptName={setDeptName}
        onSetDeptCode={setDeptCode}
        onSetSelectedHeadId={setSelectedHeadId}
        onSetDescription={setDescription}
        onSetContactEmail={setContactEmail}
        isEditModalOpen={isEditModalOpen}
        editStatus={editStatus}
        editDeptName={editDeptName}
        editDescription={editDescription}
        isEditSubmitting={isEditSubmitting}
        onCloseEdit={() => {
          setIsEditModalOpen(false);
        }}
        onSubmitEdit={handleSaveEditDepartment}
        onSetEditDeptName={setEditDeptName}
        onSetEditDescription={setEditDescription}
        onSetEditStatus={setEditStatus}
      />
    </div>
  );
}
