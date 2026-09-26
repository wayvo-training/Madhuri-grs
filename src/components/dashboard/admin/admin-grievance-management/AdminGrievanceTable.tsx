"use client";

import { Loader2 } from "lucide-react";
import { AdminPagination } from "@/components/dashboard/admin/admin-shared";
import { useAdminGrievances } from "@/hooks/admin/grievance-management/useAdminGrievances";
import type { AdminGrievanceTableProps } from "@/types/admin/grievances";
import { AdminGrievanceToolbar } from "./components/AdminGrievanceToolbar";
import { GrievanceTableList } from "./components/GrievanceTableList";
import { AdminGrievanceModal } from "./modals/AdminGrievanceModal";

export function AdminGrievanceTable({
  initialGrievances,
  initialTotalCount = 0,
  initialCounts,
  departments,
}: AdminGrievanceTableProps) {
  const {
    grievancesList,
    totalCount,
    counts,
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedPriority,
    setSelectedPriority,
    selectedStatus,
    setSelectedStatus,
    selectedDept,
    setSelectedDept,
    activeTab,
    setActiveTab,
    activeModalGrievance,
    openGrievanceModal,
    closeGrievanceModal,
    handlePageChange,
    handleRouteSuccess,
  } = useAdminGrievances(initialGrievances, initialTotalCount, initialCounts);

  return (
    <div
      id="all-grievances"
      className="relative rounded-2xl border border-slate-200/80 bg-white shadow-xs"
    >
      <span id="routing-exceptions" className="absolute -top-24" />

      {/* Table Toolbar / Filters */}
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span>Live Grievance Oversight Queue</span>
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
              )}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Showing page {currentPage} of {totalPages} ({totalCount} total
              records across all departments).
            </p>
          </div>
        </div>

        {/* Search and Dropdown Filters */}
        <AdminGrievanceToolbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          counts={counts}
          departments={departments}
          selectedDept={selectedDept}
          setSelectedDept={setSelectedDept}
          selectedPriority={selectedPriority}
          setSelectedPriority={setSelectedPriority}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          setCurrentPage={setCurrentPage}
        />
      </div>

      {/* Table Content */}
      <GrievanceTableList
        grievancesList={grievancesList}
        isLoading={isLoading}
        onOpenModal={openGrievanceModal}
      />

      {/* Pagination Footer */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />

      {/* Detail Modal / Drawer */}
      {activeModalGrievance && (
        <AdminGrievanceModal
          grievance={activeModalGrievance}
          departments={departments}
          onClose={closeGrievanceModal}
          onRouteSuccess={handleRouteSuccess}
        />
      )}
    </div>
  );
}
