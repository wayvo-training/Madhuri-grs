"use client";

import { AdminPanelHeader } from "@/components/dashboard/admin/admin-shared";
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
    setPageSize,
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
        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
      >
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-slate-800 p-5 sm:p-6">
          <AdminPanelHeader
            title="Observability & Audit Trail"
            description="Complete record of sessions, API requests, route navigation, errors, and administrative governance."
          />

          {/* Search + Category Filter (combined via AdvancedFilterBar) */}
          <AuditCategoryTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <AuditLogTable
          logs={logs}
          isLoading={isLoading}
          searchQuery={searchQuery}
          activeTab={activeTab}
          expandedLogId={expandedLogId}
          onResetFilters={handleResetFilters}
          onToggleExpand={toggleExpandLog}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />

        {/* Expanded Payload Inspector Drawer */}
        <AuditPayloadDrawer
          expandedLogId={expandedLogId}
          logs={logs}
          onClose={() => setExpandedLogId(null)}
        />
      </div>
    </div>
  );
}
