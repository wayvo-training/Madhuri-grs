"use client";

import { PriorityRuleModal } from "./PriorityRuleModal";
import { ReopenPolicyModal } from "./ReopenPolicyModal";
import { RoutingRuleModal } from "./RoutingRuleModal";
import { SlaPolicyModal } from "./SlaPolicyModal";
import type { AdminRuleConfigModalProps } from "./types";

export * from "./types";

export function AdminRuleConfigModal(props: AdminRuleConfigModalProps) {
  if (!props.open) return null;

  switch (props.modalRuleType) {
    case "routing":
      return (
        <RoutingRuleModal
          open={props.open}
          onClose={props.onClose}
          editingRuleId={props.editingRuleId}
          ruleStatus={props.ruleStatus}
          setRuleStatus={props.setRuleStatus}
          ruleName={props.ruleName}
          setRuleName={props.setRuleName}
          selectedDeptId={props.selectedDeptId}
          setSelectedDeptId={props.setSelectedDeptId}
          selectedCatId={props.selectedCatId}
          setSelectedCatId={props.setSelectedCatId}
          selectedRoutingSubcatId={props.selectedRoutingSubcatId}
          setSelectedRoutingSubcatId={props.setSelectedRoutingSubcatId}
          selectedSupportingDepts={props.selectedSupportingDepts}
          setSelectedSupportingDepts={props.setSelectedSupportingDepts}
          dependencyType={props.dependencyType}
          setDependencyType={props.setDependencyType}
          sequentialDependencies={props.sequentialDependencies}
          setSequentialDependencies={props.setSequentialDependencies}
          departments={props.departments}
          categories={props.categories}
          newCategoryName={props.newCategoryName}
          setNewCategoryName={props.setNewCategoryName}
          newSubcategoryName={props.newSubcategoryName}
          setNewSubcategoryName={props.setNewSubcategoryName}
          isSubmitting={props.isSubmitting}
          onSubmit={props.onSubmit}
        />
      );

    case "priority":
      return (
        <PriorityRuleModal
          open={props.open}
          onClose={props.onClose}
          editingRuleId={props.editingRuleId}
          ruleStatus={props.ruleStatus}
          setRuleStatus={props.setRuleStatus}
          ruleName={props.ruleName}
          setRuleName={props.setRuleName}
          priorityLevel={props.priorityLevel}
          setPriorityLevel={props.setPriorityLevel}
          ruleOrder={props.ruleOrder}
          setRuleOrder={props.setRuleOrder}
          isDefault={props.isDefault}
          setIsDefault={props.setIsDefault}
          selectedPriorityCatId={props.selectedPriorityCatId}
          setSelectedPriorityCatId={props.setSelectedPriorityCatId}
          selectedPrioritySubcatId={props.selectedPrioritySubcatId}
          setSelectedPrioritySubcatId={props.setSelectedPrioritySubcatId}
          keywords={props.keywords}
          setKeywords={props.setKeywords}
          categories={props.categories}
          newCategoryName={props.newCategoryName}
          setNewCategoryName={props.setNewCategoryName}
          newSubcategoryName={props.newSubcategoryName}
          setNewSubcategoryName={props.setNewSubcategoryName}
          isSubmitting={props.isSubmitting}
          onSubmit={props.onSubmit}
        />
      );

    case "sla":
      return (
        <SlaPolicyModal
          open={props.open}
          onClose={props.onClose}
          editingRuleId={props.editingRuleId}
          ruleStatus={props.ruleStatus}
          setRuleStatus={props.setRuleStatus}
          ruleName={props.ruleName}
          setRuleName={props.setRuleName}
          priorityLevel={props.priorityLevel}
          setPriorityLevel={props.setPriorityLevel}
          durationHours={props.durationHours}
          setDurationHours={props.setDurationHours}
          warningPercent={props.warningPercent}
          setWarningPercent={props.setWarningPercent}
          atRiskPercent={props.atRiskPercent}
          setAtRiskPercent={props.setAtRiskPercent}
          criticalPercent={props.criticalPercent}
          setCriticalPercent={props.setCriticalPercent}
          escalationPercent={props.escalationPercent}
          setEscalationPercent={props.setEscalationPercent}
          slaRecipients={props.slaRecipients}
          setSlaRecipients={props.setSlaRecipients}
          isSubmitting={props.isSubmitting}
          onSubmit={props.onSubmit}
        />
      );

    case "reopen":
      return (
        <ReopenPolicyModal
          open={props.open}
          onClose={props.onClose}
          editingRuleId={props.editingRuleId}
          ruleStatus={props.ruleStatus}
          setRuleStatus={props.setRuleStatus}
          ruleName={props.ruleName}
          setRuleName={props.setRuleName}
          selectedPriorityCatId={props.selectedPriorityCatId}
          setSelectedPriorityCatId={props.setSelectedPriorityCatId}
          selectedPrioritySubcatId={props.selectedPrioritySubcatId}
          setSelectedPrioritySubcatId={props.setSelectedPrioritySubcatId}
          reopenWindowHours={props.reopenWindowHours}
          setReopenWindowHours={props.setReopenWindowHours}
          maxReopens={props.maxReopens}
          setMaxReopens={props.setMaxReopens}
          maxReviews={props.maxReviews}
          setMaxReviews={props.setMaxReviews}
          categories={props.categories}
          newCategoryName={props.newCategoryName}
          setNewCategoryName={props.setNewCategoryName}
          newSubcategoryName={props.newSubcategoryName}
          setNewSubcategoryName={props.setNewSubcategoryName}
          isSubmitting={props.isSubmitting}
          onSubmit={props.onSubmit}
        />
      );

    default:
      return null;
  }
}
