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
    deptStatus,
    setDeptStatus,
    isSubmitting,
    feedback,
    setFeedback,
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
    editFeedback,
    setEditFeedback,
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
        feedback={feedback}
        deptName={deptName}
        deptCode={deptCode}
        selectedHeadId={selectedHeadId}
        description={description}
        contactEmail={contactEmail}
        deptStatus={deptStatus}
        isSubmitting={isSubmitting}
        departmentHeads={departmentHeads}
        onCloseCreate={() => {
          setIsModalOpen(false);
          setFeedback(null);
        }}
        onSubmitCreate={handleCreateDepartment}
        onSetDeptName={setDeptName}
        onSetDeptCode={setDeptCode}
        onSetSelectedHeadId={setSelectedHeadId}
        onSetDescription={setDescription}
        onSetContactEmail={setContactEmail}
        onSetDeptStatus={setDeptStatus}
        isEditModalOpen={isEditModalOpen}
        editDeptName={editDeptName}
        editDescription={editDescription}
        editStatus={editStatus}
        isEditSubmitting={isEditSubmitting}
        editFeedback={editFeedback}
        onCloseEdit={() => {
          setIsEditModalOpen(false);
          setEditFeedback(null);
        }}
        onSubmitEdit={handleSaveEditDepartment}
        onSetEditDeptName={setEditDeptName}
        onSetEditDescription={setEditDescription}
        onSetEditStatus={setEditStatus}
      />
    </div>
  );
}
