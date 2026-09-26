"use client";

import {
  AdminPagination,
  AdminPanelHeader,
  AdminSearchInput,
} from "@/components/dashboard/admin/admin-shared";
import { useAdminAudit } from "@/hooks/admin/audit/useAdminAudit";
import type { AdminAuditTrailProps } from "@/types/admin/audit";
import { AuditCategoryTabs } from "./components/AuditCategoryTabs";
import { AuditLogTable } from "./components/AuditLogTable";
import { AuditMetricCards } from "./components/AuditMetricCards";
import { AuditPayloadDrawer } from "./components/AuditPayloadDrawer";

export function AdminAuditTrail({
  initialLogs,
  initialTotalCount,
  stats,
}: AdminAuditTrailProps) {
  const {
    logs,
    totalCount,
    currentPage,
    setCurrentPage,
    pageSize,
    totalPages,
    isLoading,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    handleResetFilters,
    expandedLogId,
    setExpandedLogId,
    toggleExpandLog,
  } = useAdminAudit(initialLogs, initialTotalCount);

  return (
    <div className="space-y-6">
      <AuditMetricCards totalCount={totalCount} stats={stats} />

      <div
        id="audit-logs"
        className="rounded-2xl border border-slate-200/80 bg-white shadow-xs"
      >
        {/* Header */}
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <AdminPanelHeader
            title="Observability & Audit Trail"
            description="Complete record of sessions, API requests, route navigation, errors, and administrative governance."
            action={
              <AdminSearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search actor, email, IP, action..."
              />
            }
          />

          <AuditCategoryTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Logs Table */}
        <AuditLogTable
          logs={logs}
          isLoading={isLoading}
          searchQuery={searchQuery}
          activeTab={activeTab}
          expandedLogId={expandedLogId}
          onResetFilters={handleResetFilters}
          onToggleExpand={toggleExpandLog}
        />

        {/* Expanded Payload Inspector Drawer */}
        <AuditPayloadDrawer
          expandedLogId={expandedLogId}
          logs={logs}
          onClose={() => setExpandedLogId(null)}
        />

        {/* Pagination Footer */}
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
