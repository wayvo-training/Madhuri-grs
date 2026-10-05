"use client";

import { AlertTriangle, CheckCircle2, RotateCcw, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  AdminFilterToolbar,
  AdminPanelHeader,
} from "@/components/dashboard/admin/admin-shared";
import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
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
    atRiskPercent,
    setAtRiskPercent,
    criticalPercent,
    setCriticalPercent,
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
    newCategoryName,
    setNewCategoryName,
    newSubcategoryName,
    setNewSubcategoryName,

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

  return (
    <div
      id="master-configuration"
      className="rounded-2xl border border-slate-200/80 bg-white shadow-xs"
    >
      {/* Header */}
      <div className="pt-5 sm:pt-6 px-5 sm:px-6">
        <AdminPanelHeader
          title="Master Governance & Rules"
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

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 px-5 sm:px-6 mt-2 overflow-x-auto no-scrollbar">
        {[
          {
            id: "priority",
            label: "Priority Rules",
            count: priorityRules.length,
          },
          { id: "routing", label: "Routing Rules", count: routingRules.length },
          { id: "sla", label: "SLA Policies", count: slaPolicies.length },
          {
            id: "reopen",
            label: "Reopen Policy",
            count: reopenPolicies.length,
          },
        ].map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as "routing" | "priority" | "sla" | "reopen");
              handleResetFilters();
            }}
            className={`flex items-center gap-2 px-2 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-[#0F766E] text-[#0F766E] dark:text-teal-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            {tab.label}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.id
                  ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 px-5 py-3 sm:px-6">
        <div className="flex-1 w-full lg:w-3/5">
          <AdvancedTableSearch
            fields={(() => {
              const commonStatus = {
                id: "status",
                label: "Status",
                type: "select" as const,
                options: [
                  { label: "Active", value: "ACTIVE" },
                  { label: "Inactive", value: "INACTIVE" },
                ],
              };
              if (activeTab === "priority") {
                return [
                  {
                    id: "rule_name",
                    label: "Rule Name",
                    type: "text" as const,
                  },
                  { id: "category", label: "Category", type: "text" as const },
                  {
                    id: "priority",
                    label: "Priority Level",
                    type: "text" as const,
                  },
                  commonStatus,
                ];
              }
              if (activeTab === "routing") {
                return [
                  {
                    id: "rule_name",
                    label: "Rule Name",
                    type: "text" as const,
                  },
                  { id: "category", label: "Category", type: "text" as const },
                  {
                    id: "subcategory",
                    label: "Subcategory",
                    type: "text" as const,
                  },
                  { id: "priority", label: "Priority", type: "text" as const },
                  {
                    id: "department",
                    label: "Department",
                    type: "text" as const,
                  },
                  {
                    id: "involvement",
                    label: "Involvement",
                    type: "text" as const,
                  },
                  commonStatus,
                ];
              }
              if (activeTab === "sla") {
                return [
                  {
                    id: "policy_name",
                    label: "Policy Name",
                    type: "text" as const,
                  },
                  {
                    id: "description",
                    label: "Description",
                    type: "text" as const,
                  },
                  {
                    id: "duration_hours",
                    label: "Resolution Target",
                    type: "number" as const,
                  },
                  {
                    id: "warning_percent",
                    label: "Warning %",
                    type: "number" as const,
                  },
                  {
                    id: "escalation_percent",
                    label: "Escalation %",
                    type: "number" as const,
                  },
                  commonStatus,
                ];
              }
              if (activeTab === "reopen") {
                return [
                  {
                    id: "policy_name",
                    label: "Policy Name",
                    type: "text" as const,
                  },
                  {
                    id: "description",
                    label: "Description",
                    type: "text" as const,
                  },
                  {
                    id: "reopen_window_hours",
                    label: "Reopen Window",
                    type: "number" as const,
                  },
                  {
                    id: "max_reopens",
                    label: "Max Reopens",
                    type: "number" as const,
                  },
                  {
                    id: "max_reviews",
                    label: "Max Reviews",
                    type: "number" as const,
                  },
                  commonStatus,
                ];
              }
              return [commonStatus];
            })()}
            onSearch={(conditions: SearchCondition[], mode: string) => {
              setStatusFilter([]);
              setSearchQuery("");
              const newStatus: string[] = [];
              let newSearch = "";

              conditions.forEach((condition) => {
                const valArray = Array.isArray(condition.value)
                  ? condition.value
                  : [condition.value as string];

                if (condition.field === "status") {
                  newStatus.push(...valArray);
                } else {
                  // Any other field is treated as a generic search term for the view
                  newSearch = valArray[0] || newSearch;
                }
              });

              if (newStatus.length > 0) setStatusFilter(newStatus);
              if (newSearch) setSearchQuery(newSearch);
            }}
            className="w-full"
          />
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-5 sm:p-6">
        {activeTab === "priority" && (
          <PriorityRulesView
            rules={priorityRules}
            categories={categories}
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
              setWarningPercent(
                p.warning_threshold_percent?.toString() || "50",
              );
              setAtRiskPercent(p.at_risk_threshold_percent?.toString() || "75");
              setCriticalPercent(
                p.critical_threshold_percent?.toString() || "90",
              );
              setEscalationPercent(
                p.escalation_threshold_percent?.toString() || "100",
              );

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

              try {
                const cond = p.applicable_condition as {
                  category_id?: string;
                  subcategory_id?: string;
                };
                if (cond?.category_id)
                  setSelectedPriorityCatId(cond.category_id);
                if (cond?.subcategory_id)
                  setSelectedPrioritySubcatId(cond.subcategory_id);
              } catch (_e) {}

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
        atRiskPercent={atRiskPercent}
        setAtRiskPercent={setAtRiskPercent}
        criticalPercent={criticalPercent}
        setCriticalPercent={setCriticalPercent}
        escalationPercent={escalationPercent}
        setEscalationPercent={setEscalationPercent}
        reopenWindowHours={reopenWindowHours}
        setReopenWindowHours={setReopenWindowHours}
        maxReopens={maxReopens}
        setMaxReopens={setMaxReopens}
        maxReviews={maxReviews}
        setMaxReviews={setMaxReviews}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        newSubcategoryName={newSubcategoryName}
        setNewSubcategoryName={setNewSubcategoryName}
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
