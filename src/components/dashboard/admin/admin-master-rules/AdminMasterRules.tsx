"use client";

import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Workflow,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import {
  AdminFilterToolbar,
  AdminPanelHeader,
  AdminSearchInput,
} from "@/components/dashboard/admin/admin-shared";
import { useAdminRules } from "@/hooks/admin/master-rules/useAdminRules";
import { useRuleActions } from "@/hooks/admin/master-rules/useRuleActions";
import { useRuleFilters } from "@/hooks/admin/master-rules/useRuleFilters";
import { buildPolicyMatrixTree } from "@/lib/admin/master-rules/policy-matrix";
import type {
  AdminMasterRulesProps,
  SerializedReopenPolicy,
} from "@/types/admin/master-rules";

import { GlobalDefaultsPanel } from "./GlobalDefaults";
import { GlobalPolicies } from "./GlobalPolicies";
import { AdminRuleConfigModal, ConfirmRuleDeleteModal } from "./modals";
import { PolicyMatrix } from "./PolicyMatrix";
import { CreatePolicyMenu, RulesFilterPopover } from "./panels";

export function AdminMasterRules({
  priorityRules: initialPriorityRules,
  routingRules: initialRoutingRules,
  slaPolicies: initialSlaPolicies,
  reopenPolicies: initialReopenPolicies,
  departments = [],
  categories = [],
}: AdminMasterRulesProps) {
  // 1. Core Rules State
  const {
    priorityRules,
    setPriorityRules,
    routingRules,
    setRoutingRules,
    slaPolicies,
    setSlaPolicies,
    reopenPolicies,
    setReopenPolicies,
    activePriorityRules,
    defaultPriorityRule,
  } = useAdminRules({
    initialPriorityRules,
    initialRoutingRules,
    initialSlaPolicies,
    initialReopenPolicies,
  });

  // 2. Filters & Search State
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    deptFilter,
    setDeptFilter,
    catFilter,
    setCatFilter,
    isFiltered,
    handleResetFilters,
    categoryOptions,
  } = useRuleFilters({ routingRules });

  // 3. Rule Actions & Modals State
  const {
    tableFeedback,
    setTableFeedback,
    actionNotice,
    setActionNotice,
    deleteModal,
    setDeleteModal,
    confirmDelete,
    executeDelete,
    handleToggleStatus,
    ruleModalOpen,
    setRuleModalOpen,
    modalRuleType,
    setModalRuleType,
    isSubmitting,
    feedback,
    ruleName,
    setRuleName,
    priorityLevel,
    setPriorityLevel,
    ruleOrder,
    setRuleOrder,
    isDefault,
    setIsDefault,
    selectedDeptId,
    setSelectedDeptId,
    selectedCatId,
    setSelectedCatId,
    selectedRoutingSubcatId,
    setSelectedRoutingSubcatId,
    involvementType,
    setInvolvementType,
    selectedSupportingDepts,
    setSelectedSupportingDepts,
    selectedPriorityCatId,
    setSelectedPriorityCatId,
    selectedPrioritySubcatId,
    setSelectedPrioritySubcatId,
    durationHours,
    setDurationHours,
    warningPercent,
    setWarningPercent,
    escalationPercent,
    setEscalationPercent,
    reopenWindowHours,
    setReopenWindowHours,
    maxReopens,
    setMaxReopens,
    maxReviews,
    setMaxReviews,
    ruleStatus,
    setRuleStatus,
    resetForm,
    openConfigureRow,
    handleCreateRule,
  } = useRuleActions({
    departments,
    categories,
    setPriorityRules,
    setRoutingRules,
    setSlaPolicies,
    setReopenPolicies,
  });

  // 4. Dropdown Container Click-Outside Listener
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    function handleGlobalClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest("[data-dropdown-container]")) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, []);

  // 5. Accordion Expand/Collapse States
  const [expandedMatrixDepts, setExpandedMatrixDepts] = useState<Set<string>>(
    () => new Set(["Finance", "Human Resources"]),
  );
  const [expandedMatrixCats, setExpandedMatrixCats] = useState<Set<string>>(
    () => new Set(),
  );
  const [expandedRoutingViews, setExpandedRoutingViews] = useState<Set<string>>(
    () => new Set(),
  );
  const [isDefaultsPanelOpen, setIsDefaultsPanelOpen] = useState(false);

  // 6. Policy Matrix Tree Computation (Memoized pure business logic)
  const isSearching = Boolean(searchQuery.trim());

  const matrixTree = useMemo(() => {
    return buildPolicyMatrixTree({
      routingRules,
      activePriorityRules,
      defaultPriorityRule,
      slaPolicies,
      searchQuery,
      deptFilter,
      catFilter,
      statusFilter,
    });
  }, [
    routingRules,
    activePriorityRules,
    defaultPriorityRule,
    slaPolicies,
    searchQuery,
    deptFilter,
    catFilter,
    statusFilter,
  ]);

  const totalMatrixGrievanceTypes = useMemo(() => {
    return matrixTree.reduce((acc, d) => acc + d.count, 0);
  }, [matrixTree]);

  // 7. Global Policies Filtering (Reopen Policies)
  const filteredReopenPolicies = useMemo(() => {
    return reopenPolicies.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.policy_name.toLowerCase().includes(q) ||
        (p.reopen_window_hours
          ? `${p.reopen_window_hours} hours`
          : "unlimited"
        ).includes(q)
      );
    });
  }, [reopenPolicies, statusFilter, searchQuery]);

  // 8. Toggle and Expand/Collapse Handlers
  const toggleMatrixDept = (dept: string) => {
    setExpandedMatrixDepts((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });
  };

  const toggleMatrixCat = (key: string) => {
    setExpandedMatrixCats((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleRoutingView = (key: string) => {
    setExpandedRoutingViews((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleExpandAll = () => {
    const allDepts = new Set<string>();
    const allCats = new Set<string>();
    for (const d of matrixTree) {
      allDepts.add(d.departmentName);
      for (const c of d.categories) {
        allCats.add(`${d.departmentName}::${c.categoryName}`);
      }
    }
    setExpandedMatrixDepts(allDepts);
    setExpandedMatrixCats(allCats);
  };

  const handleCollapseAll = () => {
    setExpandedMatrixDepts(new Set());
    setExpandedMatrixCats(new Set());
    setExpandedRoutingViews(new Set());
  };

  return (
    <div
      id="master-configuration"
      className="rounded-2xl border border-slate-200/80 bg-white shadow-xs"
    >
      {/* Header & Tabs */}
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <AdminPanelHeader
          title="Master Governance & Rules Engine"
          description="Unified administrative engine controlling grievance triage, departmental routing, SLA timers, and global policies."
          action={
            <div className="flex items-center gap-3 shrink-0 flex-nowrap">
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("matrix")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition whitespace-nowrap ${
                    activeTab === "matrix"
                      ? "bg-white text-[#064E3B] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Workflow className="h-3.5 w-3.5" />
                  <span>Policy Matrix ({totalMatrixGrievanceTypes})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("global")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition whitespace-nowrap ${
                    activeTab === "global"
                      ? "bg-white text-[#064E3B] shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Global Policies ({reopenPolicies.length})</span>
                </button>
              </div>

              <CreatePolicyMenu
                activeDropdown={activeDropdown}
                setActiveDropdown={setActiveDropdown}
                onSelectType={(type) => {
                  resetForm();
                  setModalRuleType(type);
                  setRuleModalOpen(true);
                }}
              />
            </div>
          }
        />
      </div>

      {/* Global Action Banner (Msg Box) */}
      {actionNotice && (
        <div
          className={`mx-5 sm:mx-6 mt-4 flex items-center justify-between gap-2 rounded-xl border p-3 text-xs animate-in fade-in duration-150 ${
            actionNotice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span className="font-medium">{actionNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-600 transition cursor-pointer p-0.5"
            title="Dismiss message"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="border-b border-slate-200/80 bg-slate-50/50 px-5 py-3 sm:px-6">
        <AdminFilterToolbar>
          <AdminSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={
              activeTab === "matrix"
                ? "Search grievance types, routes, SLAs..."
                : "Search global reopen policies..."
            }
          />

          <RulesFilterPopover
            activeTab={activeTab}
            activeDropdown={activeDropdown}
            setActiveDropdown={setActiveDropdown}
            isFiltered={isFiltered}
            onReset={handleResetFilters}
            departments={departments}
            categoryOptions={categoryOptions}
            deptFilter={deptFilter}
            setDeptFilter={setDeptFilter}
            catFilter={catFilter}
            setCatFilter={setCatFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          {/* Clear Filters Button (When filtered) */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}

          {/* Expand/Collapse All (Matrix Tab) */}
          {activeTab === "matrix" && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleExpandAll}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 transition"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 transition"
              >
                Collapse All
              </button>
            </div>
          )}
        </AdminFilterToolbar>
      </div>

      {/* Main Tab Content */}
      <div className="p-5 sm:p-6">
        {/* Toast / Feedback Notice */}
        {tableFeedback && (
          <div
            className={`mb-5 flex items-center justify-between gap-2 rounded-xl p-3 text-xs transition-all ${
              tableFeedback.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {tableFeedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              )}
              <span className="font-medium">{tableFeedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setTableFeedback(null)}
              className="rounded p-0.5 hover:bg-black/5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* TAB 1: Policy Matrix */}
        {activeTab === "matrix" && (
          <>
            <PolicyMatrix
              matrixTree={matrixTree}
              totalMatrixGrievanceTypes={totalMatrixGrievanceTypes}
              isSearching={isSearching}
              expandedMatrixDepts={expandedMatrixDepts}
              expandedMatrixCats={expandedMatrixCats}
              expandedRoutingViews={expandedRoutingViews}
              onToggleDept={toggleMatrixDept}
              onToggleCat={toggleMatrixCat}
              onToggleRoutingView={toggleRoutingView}
              onResetFilters={handleResetFilters}
              onOpenConfigureRow={openConfigureRow}
              onToggleStatus={handleToggleStatus}
              onConfirmDelete={confirmDelete}
            />

            <GlobalDefaultsPanel
              isDefaultsPanelOpen={isDefaultsPanelOpen}
              onToggleDefaultsPanel={() =>
                setIsDefaultsPanelOpen((prev) => !prev)
              }
              defaultPriorityRule={defaultPriorityRule}
              slaPolicies={slaPolicies}
              onToggleStatus={handleToggleStatus}
            />
          </>
        )}

        {/* TAB 2: Global Policies */}
        {activeTab === "global" && (
          <GlobalPolicies
            reopenPolicies={reopenPolicies}
            filteredReopenPolicies={filteredReopenPolicies}
            onToggleStatus={handleToggleStatus}
            onOpenConfigure={(policy: SerializedReopenPolicy) => {
              resetForm();
              setModalRuleType("reopen");
              setRuleName(policy.policy_name);
              setReopenWindowHours(
                policy.reopen_window_hours?.toString() || "168",
              );
              setMaxReopens(policy.max_reopen_count.toString());
              setMaxReviews(policy.max_manual_review_count.toString());
              setRuleModalOpen(true);
            }}
            onConfirmDelete={confirmDelete}
          />
        )}
      </div>

      {/* Interactive Policy Creation / Configuration Modal */}
      <AdminRuleConfigModal
        open={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        modalRuleType={modalRuleType}
        setModalRuleType={setModalRuleType}
        ruleName={ruleName}
        setRuleName={setRuleName}
        priorityLevel={priorityLevel}
        setPriorityLevel={setPriorityLevel}
        ruleOrder={ruleOrder}
        setRuleOrder={setRuleOrder}
        isDefault={isDefault}
        setIsDefault={setIsDefault}
        selectedDeptId={selectedDeptId}
        setSelectedDeptId={setSelectedDeptId}
        selectedCatId={selectedCatId}
        setSelectedCatId={setSelectedCatId}
        selectedRoutingSubcatId={selectedRoutingSubcatId}
        setSelectedRoutingSubcatId={setSelectedRoutingSubcatId}
        involvementType={involvementType}
        setInvolvementType={setInvolvementType}
        selectedSupportingDepts={selectedSupportingDepts}
        setSelectedSupportingDepts={setSelectedSupportingDepts}
        selectedPriorityCatId={selectedPriorityCatId}
        setSelectedPriorityCatId={setSelectedPriorityCatId}
        selectedPrioritySubcatId={selectedPrioritySubcatId}
        setSelectedPrioritySubcatId={setSelectedPrioritySubcatId}
        durationHours={durationHours}
        setDurationHours={setDurationHours}
        warningPercent={warningPercent}
        setWarningPercent={setWarningPercent}
        escalationPercent={escalationPercent}
        setEscalationPercent={setEscalationPercent}
        reopenWindowHours={reopenWindowHours}
        setReopenWindowHours={setReopenWindowHours}
        maxReopens={maxReopens}
        setMaxReopens={setMaxReopens}
        maxReviews={maxReviews}
        setMaxReviews={setMaxReviews}
        ruleStatus={ruleStatus}
        setRuleStatus={setRuleStatus}
        isSubmitting={isSubmitting}
        feedback={feedback}
        departments={departments}
        categories={categories}
        onSubmit={handleCreateRule}
      />

      <ConfirmRuleDeleteModal
        open={Boolean(deleteModal)}
        onClose={() => setDeleteModal(null)}
        ruleName={deleteModal?.name ?? ""}
        onConfirm={executeDelete}
      />
    </div>
  );
}
