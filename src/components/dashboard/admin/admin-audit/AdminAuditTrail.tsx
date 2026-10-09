"use client";

import { AdminPanelHeader } from "@/components/dashboard/admin/admin-shared";
import { useAdminAudit } from "@/hooks/admin/audit/useAdminAudit";
import { CATEGORY_TABS } from "@/lib/admin/audit/audit-constants";
import type { AdminAuditTrailProps, TabCategory } from "@/types/admin/audit";
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
        <div className="pt-5 sm:pt-6 px-5 sm:px-6">
          <AdminPanelHeader title="Observability & Audit Trail" />

          {/* Top-Level Tabs */}
          <div className="flex items-center gap-6 mt-2 border-b border-slate-100 overflow-x-auto no-scrollbar pb-1">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabCategory)}
                  className={`flex items-center gap-2 px-1 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-[#0F766E] text-[#0F766E]"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

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
