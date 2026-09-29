"use client";

import {
  AlertTriangle,
  CheckCircle2,
  RefreshCcw,
  RotateCcw,
  Route,
  ShieldAlert,
  Timer,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  AdminFilterToolbar,
  AdminPanelHeader,
} from "@/components/dashboard/admin/admin-shared";
import {
  AdvancedFilterBar,
  type FilterCondition,
} from "@/components/filters/advanced-filter-bar";
import { useAdminRules } from "@/hooks/admin/master-rules/useAdminRules";
import { useRuleActions } from "@/hooks/admin/master-rules/useRuleActions";
import { useRuleFilters } from "@/hooks/admin/master-rules/useRuleFilters";
import type { AdminMasterRulesProps } from "@/types/admin/master-rules";

import { AdminRuleConfigModal, ConfirmRuleDeleteModal } from "./modals";
import { RulesFilterPopover } from "./panels";
import { PriorityRulesView } from "./views/PriorityRulesView";
import { ReopenPoliciesView } from "./views/ReopenPoliciesView";
import { RoutingRulesView } from "./views/RoutingRulesView";
import { SlaPoliciesView } from "./views/SlaPoliciesView";

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

    editingRuleId,
    setEditingRuleId,
    ruleStatus,
    setRuleStatus,

    resetForm,
    handleCreateRule,
    setKeywords,
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

  const getTabStyle = (tabId: string) => {
    if (activeTab === tabId) {
      return "bg-[#0F766E] text-white shadow-sm ring-1 ring-[#0F766E]";
    }
    return "bg-white text-slate-600 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 shadow-2xs";
  };

  const getTabIconColor = (tabId: string) => {
    if (activeTab === tabId) return "text-white";
    return "text-slate-400 group-hover:text-teal-600";
  };

  return (
    <div
      id="master-configuration"
      className="rounded-2xl border border-slate-200/80 bg-white shadow-xs"
    >
      {/* Header */}
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <AdminPanelHeader
          title="Master Governance & Rules"
          description="Configure and manage the rules that govern grievance priority, department routing, SLA policies and reopen handling."
          action={
            <div className="flex items-center gap-3 shrink-0 flex-nowrap">
              {activeTab === "priority" && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setModalRuleType("priority");
                    setRuleModalOpen(true);
                  }}
                  className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#115E59] transition-colors"
                >
                  + Create Priority Rule
                </button>
              )}
              {activeTab === "routing" && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setModalRuleType("routing");
                    setRuleModalOpen(true);
                  }}
                  className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#115E59] transition-colors"
                >
                  + Create Routing Rule
                </button>
              )}
              {activeTab === "sla" && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setModalRuleType("sla");
                    setRuleModalOpen(true);
                  }}
                  className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#115E59] transition-colors"
                >
                  + Configure SLA Policy
                </button>
              )}
              {activeTab === "reopen" && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setModalRuleType("reopen");
                    setRuleModalOpen(true);
                  }}
                  className="rounded-lg bg-[#0F766E] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#115E59] transition-colors"
                >
                  Configure Reopen Policy
                </button>
              )}
            </div>
          }
        />
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("priority");
              handleResetFilters();
            }}
            className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-1 whitespace-nowrap ${getTabStyle("priority")}`}
          >
            <ShieldAlert
              className={`h-4 w-4 transition-colors ${getTabIconColor("priority")}`}
            />
            <span>
              Priority Rules{" "}
              {priorityRules.length > 0 && `(${priorityRules.length})`}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("routing");
              handleResetFilters();
            }}
            className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-1 whitespace-nowrap ${getTabStyle("routing")}`}
          >
            <Route
              className={`h-4 w-4 transition-colors ${getTabIconColor("routing")}`}
            />
            <span>
              Routing Rules{" "}
              {routingRules.length > 0 && `(${routingRules.length})`}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("sla");
              handleResetFilters();
            }}
            className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-1 whitespace-nowrap ${getTabStyle("sla")}`}
          >
            <Timer
              className={`h-4 w-4 transition-colors ${getTabIconColor("sla")}`}
            />
            <span>
              SLA Policies {slaPolicies.length > 0 && `(${slaPolicies.length})`}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("reopen");
              handleResetFilters();
            }}
            className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-1 whitespace-nowrap ${getTabStyle("reopen")}`}
          >
            <RefreshCcw
              className={`h-4 w-4 transition-colors ${getTabIconColor("reopen")}`}
            />
            <span>
              Reopen Policy{" "}
              {reopenPolicies.length > 0 && `(${reopenPolicies.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Global Action Banner */}
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
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="border-b border-slate-200/80 bg-slate-50/50 px-5 py-3 sm:px-6">
        <AdminFilterToolbar>
          <AdvancedFilterBar
            fields={[
              {
                id: "status",
                label: "Status",
                type: "select",
                options: [
                  { label: "Active", value: "ACTIVE" },
                  { label: "Inactive", value: "INACTIVE" },
                ],
              },
            ]}
            filters={statusFilter.map((s) => ({
              id: `status-${s}`,
              fieldId: "status",
              operator: "Is" as const,
              value: s,
            }))}
            onFiltersChange={(newFilters: FilterCondition[]) => {
              const selected = newFilters
                .filter((f) => f.fieldId === "status")
                .map((f) => f.value);
              setStatusFilter(selected);
            }}
            search={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Search rules..."
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
          />

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
        </AdminFilterToolbar>
      </div>

      {/* Main Tab Content */}
      <div className="p-5 sm:p-6">
        {activeTab === "priority" && (
          <PriorityRulesView
            rules={priorityRules}
            defaultRule={defaultPriorityRule}
            searchQuery={searchQuery}
            catFilter={catFilter}
            statusFilter={statusFilter}
            onToggleStatus={(r) =>
              handleToggleStatus("priority", r.priority_rule_id, r.status)
            }
            onDelete={(r) =>
              confirmDelete("priority", r.priority_rule_id, r.rule_name)
            }
            onEdit={(r) => {
              resetForm();
              setEditingRuleId(r.priority_rule_id);
              setRuleStatus(r.status as "ACTIVE" | "INACTIVE");
              setModalRuleType("priority");
              setRuleName(r.rule_name);
              setPriorityLevel(r.priority_level);
              setRuleOrder(r.rule_order.toString());
              setIsDefault(r.is_default);

              try {
                const cond = r.conditions as {
                  category_id?: string;
                  subcategory_id?: string;
                  department_ids?: string[];
                  keywords?: string[];
                };
                if (cond?.category_id)
                  setSelectedPriorityCatId(cond.category_id);
                if (cond?.subcategory_id)
                  setSelectedPrioritySubcatId(cond.subcategory_id);
                if (cond?.keywords) setKeywords(cond.keywords.join(", "));
              } catch (_e) {}
              setRuleModalOpen(true);
            }}
          />
        )}

        {activeTab === "routing" && (
          <RoutingRulesView
            rules={routingRules}
            searchQuery={searchQuery}
            catFilter={catFilter}
            deptFilter={deptFilter}
            statusFilter={statusFilter}
            onToggleStatus={(r) =>
              handleToggleStatus("routing", r.routing_rule_id, r.status)
            }
            onDelete={(r) =>
              confirmDelete("routing", r.routing_rule_id, r.rule_name)
            }
            onEdit={(r) => {
              resetForm();
              setEditingRuleId(r.routing_rule_id);
              setRuleStatus(r.status as "ACTIVE" | "INACTIVE");
              setModalRuleType("routing");
              setRuleName(r.rule_name);
              setRuleOrder(r.rule_order.toString());
              setInvolvementType(r.involvement_type);

              const matchedDept = departments.find(
                (d) => d.department_name === r.department_name,
              );
              if (matchedDept) setSelectedDeptId(matchedDept.department_id);

              const matchedCat = categories.find(
                (c) => c.category_name === r.category_name,
              );
              if (matchedCat) {
                setSelectedCatId(matchedCat.category_id);
                const matchedSub = matchedCat.subcategories?.find(
                  (s) => s.subcategory_name === r.subcategory_name,
                );
                if (matchedSub)
                  setSelectedRoutingSubcatId(matchedSub.subcategory_id);
              }

              if (r.supporting_departments) {
                const matchingSupports = departments
                  .filter((d) =>
                    r.supporting_departments?.includes(d.department_name),
                  )
                  .map((d) => d.department_id);
                setSelectedSupportingDepts(matchingSupports);
              }
              setRuleModalOpen(true);
            }}
          />
        )}

        {activeTab === "sla" && (
          <SlaPoliciesView
            policies={slaPolicies}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onToggleStatus={(p) =>
              handleToggleStatus("sla", p.sla_policy_id, p.status)
            }
            onDelete={(p) =>
              confirmDelete("sla", p.sla_policy_id, p.policy_name)
            }
            onEdit={(p) => {
              resetForm();
              setEditingRuleId(p.sla_policy_id);
              setRuleStatus(p.status as "ACTIVE" | "INACTIVE");
              setModalRuleType("sla");
              setRuleName(p.policy_name);
              setPriorityLevel(p.priority_level || "HIGH");
              setDurationHours((p.target_duration_minutes / 60).toString());
              setWarningPercent(p.warning_threshold_percent.toString());
              setEscalationPercent(p.escalation_threshold_percent.toString());

              setRuleModalOpen(true);
            }}
          />
        )}

        {activeTab === "reopen" && (
          <ReopenPoliciesView
            policies={reopenPolicies}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onToggleStatus={(p) =>
              handleToggleStatus("reopen", p.reopen_policy_id, p.status)
            }
            onDelete={(p) =>
              confirmDelete("reopen", p.reopen_policy_id, p.policy_name)
            }
            onEdit={(p) => {
              resetForm();
              setEditingRuleId(p.reopen_policy_id);
              setRuleStatus(p.status as "ACTIVE" | "INACTIVE");
              setModalRuleType("reopen");
              setRuleName(p.policy_name);
              setReopenWindowHours(p.reopen_window_hours?.toString() || "168");
              setMaxReopens(p.max_reopen_count.toString());
              setMaxReviews(p.max_manual_review_count.toString());

              setRuleModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Interactive Policy Creation / Configuration Modal */}
      <AdminRuleConfigModal
        open={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        editingRuleId={editingRuleId}
        ruleStatus={ruleStatus}
        setRuleStatus={setRuleStatus}
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
        isSubmitting={isSubmitting}
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
