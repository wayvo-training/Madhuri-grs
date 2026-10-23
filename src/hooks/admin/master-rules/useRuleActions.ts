import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  type DepartmentDependencyNode,
  validateRoutingPolicy,
} from "@/lib/validations/dependency-graph";
import type {
  DepartmentOption,
  ModalRuleType,
  RuleFeedback,
  SerializedCategory,
  SerializedPriorityRule,
  SerializedReopenPolicy,
  SerializedRoutingRule,
  SerializedSlaPolicy,
} from "@/types/admin/master-rules";

export interface UseRuleActionsParams {
  departments: DepartmentOption[];
  categories: SerializedCategory[];
  setPriorityRules: React.Dispatch<
    React.SetStateAction<SerializedPriorityRule[]>
  >;
  setRoutingRules: React.Dispatch<
    React.SetStateAction<SerializedRoutingRule[]>
  >;
  setSlaPolicies: React.Dispatch<React.SetStateAction<SerializedSlaPolicy[]>>;
  setReopenPolicies: React.Dispatch<
    React.SetStateAction<SerializedReopenPolicy[]>
  >;
}

export interface SlaNotificationRecipients {
  warning: string[];
  at_risk: string[];
  critical: string[];
  escalation: string[];
}

export const DEFAULT_SLA_RECIPIENTS: SlaNotificationRecipients = {
  warning: ["ASSIGNED_STAFF"],
  at_risk: ["ASSIGNED_STAFF", "ALL_DEPT_HEADS"],
  critical: ["ASSIGNED_STAFF", "ALL_DEPT_HEADS"],
  escalation: ["PRIMARY_DEPT_HEAD", "ADMIN"],
};

export function useRuleActions({
  departments,
  categories,
  setPriorityRules,
  setRoutingRules,
  setSlaPolicies,
  setReopenPolicies,
}: UseRuleActionsParams) {
  const router = useRouter();

  // In-Page Action Notice (Msg Box banner)
  const [actionNotice, setActionNotice] = useState<RuleFeedback | null>(null);

  const showNotice = useCallback((type: "success" | "error", text: string) => {
    setActionNotice(null);
    toast.dismiss();
    if (type === "success") {
      toast.success(text, { id: "rule-action-toast" });
    } else {
      toast.error(text, { id: "rule-action-toast" });
    }
  }, []);

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    ruleType: "priority" | "routing" | "sla" | "reopen";
    id: string;
    name: string;
  } | null>(null);

  const confirmDelete = (
    ruleType: "priority" | "routing" | "sla" | "reopen",
    id: string,
    name: string,
  ) => {
    setDeleteModal({
      isOpen: true,
      ruleType,
      id,
      name,
    });
  };

  async function executeDelete() {
    if (!deleteModal) return;
    const { ruleType, id, name } = deleteModal;
    setDeleteModal(null);

    let endpoint = "";
    if (ruleType === "priority") {
      endpoint = `/api/admin/rules/priority?id=${id}`;
      setPriorityRules((prev) => prev.filter((r) => r.priority_rule_id !== id));
    } else if (ruleType === "routing") {
      endpoint = `/api/admin/rules/routing?id=${id}`;
      setRoutingRules((prev) => prev.filter((r) => r.routing_rule_id !== id));
    } else if (ruleType === "sla") {
      endpoint = `/api/admin/rules/sla?id=${id}`;
      setSlaPolicies((prev) => prev.filter((s) => s.sla_policy_id !== id));
    } else if (ruleType === "reopen") {
      endpoint = `/api/admin/rules/reopen?id=${id}`;
      setReopenPolicies((prev) =>
        prev.filter((p) => p.reopen_policy_id !== id),
      );
    }

    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showNotice(
          "success",
          `Rule '${name || "Rule"}' has been deactivated and removed successfully.`,
        );
      } else {
        showNotice("error", data.message || "Failed to delete rule.");
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to deactivate rule:", err);
      showNotice("error", "Network error. Could not complete delete request.");
    }
  }

  async function handleToggleStatus(
    ruleType: "priority" | "routing" | "sla" | "reopen",
    id: string,
    currentStatus: string,
  ) {
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    let endpoint = "";
    const bodyPayload: Record<string, unknown> = { status: nextStatus };

    if (ruleType === "priority") {
      endpoint = "/api/admin/rules/priority";
      bodyPayload.priority_rule_id = id;
      setPriorityRules((prev) =>
        prev.map((r) =>
          r.priority_rule_id === id ? { ...r, status: nextStatus } : r,
        ),
      );
    } else if (ruleType === "routing") {
      endpoint = "/api/admin/rules/routing";
      bodyPayload.routing_rule_id = id;
      setRoutingRules((prev) =>
        prev.map((r) =>
          r.routing_rule_id === id ? { ...r, status: nextStatus } : r,
        ),
      );
    } else if (ruleType === "sla") {
      endpoint = "/api/admin/rules/sla";
      bodyPayload.sla_policy_id = id;
      setSlaPolicies((prev) =>
        prev.map((s) =>
          s.sla_policy_id === id ? { ...s, status: nextStatus } : s,
        ),
      );
    } else if (ruleType === "reopen") {
      endpoint = "/api/admin/rules/reopen";
      bodyPayload.reopen_policy_id = id;
      setReopenPolicies((prev) =>
        prev.map((p) =>
          p.reopen_policy_id === id ? { ...p, status: nextStatus } : p,
        ),
      );
    }

    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Revert optimistic update
        if (ruleType === "priority") {
          setPriorityRules((prev) =>
            prev.map((r) =>
              r.priority_rule_id === id ? { ...r, status: currentStatus } : r,
            ),
          );
        } else if (ruleType === "routing") {
          setRoutingRules((prev) =>
            prev.map((r) =>
              r.routing_rule_id === id ? { ...r, status: currentStatus } : r,
            ),
          );
        } else if (ruleType === "sla") {
          setSlaPolicies((prev) =>
            prev.map((s) =>
              s.sla_policy_id === id ? { ...s, status: currentStatus } : s,
            ),
          );
        } else if (ruleType === "reopen") {
          setReopenPolicies((prev) =>
            prev.map((p) =>
              p.reopen_policy_id === id ? { ...p, status: currentStatus } : p,
            ),
          );
        }
        showNotice("error", data.message || "Failed to update rule status.");
        return;
      }
      showNotice(
        "success",
        `Rule status changed to ${nextStatus.toLowerCase()}.`,
      );
      router.refresh();
    } catch (err) {
      console.error("Failed to toggle status:", err);
      if (ruleType === "priority") {
        setPriorityRules((prev) =>
          prev.map((r) =>
            r.priority_rule_id === id ? { ...r, status: currentStatus } : r,
          ),
        );
      } else if (ruleType === "routing") {
        setRoutingRules((prev) =>
          prev.map((r) =>
            r.routing_rule_id === id ? { ...r, status: currentStatus } : r,
          ),
        );
      } else if (ruleType === "sla") {
        setSlaPolicies((prev) =>
          prev.map((s) =>
            s.sla_policy_id === id ? { ...s, status: currentStatus } : s,
          ),
        );
      } else if (ruleType === "reopen") {
        setReopenPolicies((prev) =>
          prev.map((p) =>
            p.reopen_policy_id === id ? { ...p, status: currentStatus } : p,
          ),
        );
      }
      toast.error("Network error updating rule status. Please try again.", {
        id: "rule-action-toast",
      });
    }
  }

  // Modal State for Rule Configuration / Creation
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [modalRuleType, setModalRuleType] = useState<ModalRuleType>("routing");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Common Form Fields
  const [ruleName, setRuleName] = useState("");
  const [priorityLevel, setPriorityLevel] = useState("HIGH");
  const [ruleOrder, setRuleOrder] = useState("10");
  const [isDefault, setIsDefault] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [ruleStatus, setRuleStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Routing-specific State
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [selectedRoutingSubcatId, setSelectedRoutingSubcatId] = useState("");
  const [involvementType, setInvolvementType] = useState("PRIMARY");
  const [selectedSupportingDepts, setSelectedSupportingDepts] = useState<
    string[]
  >([]);
  const [dependencyType, setDependencyType] = useState<
    "PARALLEL" | "SEQUENTIAL"
  >("SEQUENTIAL");
  const [sequentialDependencies, setSequentialDependencies] = useState<
    DepartmentDependencyNode[]
  >([]);

  // Priority-specific Taxonomy State
  const [selectedPriorityCatId, setSelectedPriorityCatId] = useState("");
  const [selectedPrioritySubcatId, setSelectedPrioritySubcatId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubcategoryName, setNewSubcategoryName] = useState("");

  // SLA-specific State
  const [durationHours, setDurationHours] = useState("24");
  const [warningPercent, setWarningPercent] = useState("50");
  const [atRiskPercent, setAtRiskPercent] = useState("75");
  const [criticalPercent, setCriticalPercent] = useState("90");
  const [escalationPercent, setEscalationPercent] = useState("100");
  const [departmentalAllocationMode, setDepartmentalAllocationMode] = useState<
    "FULL" | "EQUAL_SPLIT" | "LEAD_WEIGHTED"
  >("FULL");
  const [slaRecipients, setSlaRecipients] = useState<SlaNotificationRecipients>(
    DEFAULT_SLA_RECIPIENTS,
  );

  // Reopen-specific State
  const [reopenWindowHours, setReopenWindowHours] = useState("168");
  const [maxReopens, setMaxReopens] = useState("2");
  const [maxReviews, setMaxReviews] = useState("1");

  function resetForm() {
    setRuleName("");
    setPriorityLevel("HIGH");
    setRuleOrder("10");
    setIsDefault(false);
    setKeywords("");
    setEditingRuleId(null);
    setRuleStatus("ACTIVE");
    setSelectedDeptId("");
    setSelectedCatId("");
    setSelectedRoutingSubcatId("");
    setInvolvementType("PRIMARY");
    setSelectedPriorityCatId("");
    setSelectedPrioritySubcatId("");
    setSelectedSupportingDepts([]);
    setDependencyType("SEQUENTIAL");
    setSequentialDependencies([]);
    setDurationHours("24");
    setWarningPercent("50");
    setAtRiskPercent("75");
    setCriticalPercent("90");
    setEscalationPercent("100");
    setDepartmentalAllocationMode("FULL");
    setSlaRecipients(DEFAULT_SLA_RECIPIENTS);
    setNewCategoryName("");
    setNewSubcategoryName("");
  }

  const openConfigureRow = (
    deptName: string,
    catName: string,
    subcatName: string,
    currentPriority: string,
  ) => {
    resetForm();
    setModalRuleType("routing");

    const matchedDept = departments.find(
      (d) => d.department_name.toLowerCase() === deptName.toLowerCase(),
    );
    if (matchedDept) setSelectedDeptId(matchedDept.department_id);

    const matchedCat = categories.find(
      (c) => c.category_name.toLowerCase() === catName.toLowerCase(),
    );
    if (matchedCat) {
      setSelectedCatId(matchedCat.category_id);
      setSelectedPriorityCatId(matchedCat.category_id);
      const matchedSub = matchedCat.subcategories?.find(
        (s) => s.subcategory_name.toLowerCase() === subcatName.toLowerCase(),
      );
      if (matchedSub) {
        setSelectedRoutingSubcatId(matchedSub.subcategory_id);
        setSelectedPrioritySubcatId(matchedSub.subcategory_id);
      }
    }

    setPriorityLevel(currentPriority || "HIGH");
    setRuleName(`${subcatName} Routing to ${deptName}`);
    setRuleModalOpen(true);
  };

  const isPurelyNumbers = (val: string) => {
    const trimmed = val.trim();
    return trimmed.length > 0 && !/[a-zA-Z]/.test(trimmed);
  };

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    if (!ruleName.trim()) return;

    if (isPurelyNumbers(ruleName)) {
      showNotice(
        "error",
        "Rule name cannot consist of only numbers. It must include letters or letters and numbers.",
      );
      return;
    }

    if (
      (selectedCatId === "CUSTOM" || selectedPriorityCatId === "CUSTOM") &&
      isPurelyNumbers(newCategoryName)
    ) {
      showNotice(
        "error",
        "Category name cannot consist of only numbers. It must include letters or letters and numbers.",
      );
      return;
    }

    if (
      (selectedRoutingSubcatId === "CUSTOM" ||
        selectedPrioritySubcatId === "CUSTOM") &&
      isPurelyNumbers(newSubcategoryName)
    ) {
      showNotice(
        "error",
        "Subcategory name cannot consist of only numbers. It must include letters or letters and numbers.",
      );
      return;
    }

    try {
      setIsSubmitting(true);

      let endpoint = "";
      let payload: Record<string, unknown> = {};

      if (modalRuleType === "priority") {
        if (!isDefault && !selectedPriorityCatId && !keywords.trim()) {
          toast.error(
            "Category or trigger keywords are required. Every priority rule must define a Category or keywords (or be set as Default Fallback).",
            { id: "rule-action-toast" },
          );
          setIsSubmitting(false);
          return;
        }

        const prioCat = categories.find(
          (c) => c.category_id === selectedPriorityCatId,
        );
        const prioSubcat = prioCat?.subcategories?.find(
          (s) => s.subcategory_id === selectedPrioritySubcatId,
        );

        let conditions: Record<string, unknown> | null = null;
        if (!isDefault) {
          conditions = {};
          if (selectedPriorityCatId) {
            conditions.category_id = selectedPriorityCatId;
            conditions.category = prioCat?.category_name;
            if (selectedPrioritySubcatId) {
              conditions.subcategory_id = selectedPrioritySubcatId;
              conditions.subcategory = prioSubcat?.subcategory_name;
            }
          }
          if (keywords.trim()) {
            conditions.keywords = keywords
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean);
          }
        }

        endpoint = "/api/admin/rules/priority";
        payload = {
          rule_name: ruleName.trim(),
          priority_level: priorityLevel,
          rule_order: Number.parseInt(ruleOrder, 10) || 10,
          is_default: isDefault,
          status: ruleStatus,
          conditions,
          new_category_name:
            selectedPriorityCatId === "CUSTOM" ? newCategoryName : undefined,
          new_subcategory_name:
            selectedPrioritySubcatId === "CUSTOM"
              ? newSubcategoryName
              : undefined,
        };
      } else if (modalRuleType === "routing") {
        if (!selectedDeptId || !selectedCatId || !selectedRoutingSubcatId) {
          showNotice(
            "error",
            "Primary Department, Category, and Subcategory are strictly required.",
          );
          setIsSubmitting(false);
          return;
        }

        const chosenDept = departments.find(
          (d) => d.department_id === selectedDeptId,
        );
        const chosenCat = categories.find(
          (c) => c.category_id === selectedCatId,
        );
        const chosenSub = chosenCat?.subcategories?.find(
          (s) => s.subcategory_id === selectedRoutingSubcatId,
        );

        // Pre-save policy validation: exactly 1 primary, no duplicate supporting, valid prerequisites, no cycles, valid execution order
        const policyValidation = validateRoutingPolicy({
          primary_department_name: chosenDept?.department_name,
          primary_department_id: selectedDeptId,
          supporting_departments: selectedSupportingDepts,
          dependency_type: dependencyType,
          dependencies: sequentialDependencies,
        });

        if (!policyValidation.valid) {
          showNotice("error", policyValidation.errors[0]);
          setIsSubmitting(false);
          return;
        }

        // Validate SLA percentages strictly for Multi-Department SEQUENTIAL rules only
        // Validate Multi-Department rules
        const isMultiDepartment =
          selectedSupportingDepts && selectedSupportingDepts.length > 0;

        if (isMultiDepartment) {
          const primaryCount = sequentialDependencies.filter(
            (d) => d.involvement_type === "PRIMARY",
          ).length;
          if (primaryCount === 0) {
            showNotice(
              "error",
              "Multi-department rules require a designated PRIMARY (Lead Owner) department.",
            );
            setIsSubmitting(false);
            return;
          }
          if (primaryCount > 1) {
            showNotice(
              "error",
              "Multi-department rules can only have exactly one PRIMARY (Lead Owner) department.",
            );
            setIsSubmitting(false);
            return;
          }
        }

        if (isMultiDepartment && dependencyType === "SEQUENTIAL") {
          const missingPct = sequentialDependencies.find(
            (d) =>
              d.department_name &&
              (d.sla_percent_allocation == null ||
                Number(d.sla_percent_allocation) <= 0),
          );
          if (missingPct) {
            showNotice(
              "error",
              `Please specify a valid SLA percentage (> 0%) for department "${missingPct.department_name}".`,
            );
            setIsSubmitting(false);
            return;
          }

          const totalPct = sequentialDependencies.reduce(
            (sum, d) => sum + (Number(d.sla_percent_allocation) || 0),
            0,
          );
          if (Math.round(totalPct) !== 100) {
            showNotice(
              "error",
              `Total SLA percentage allocation across sequential departments must equal exactly 100% (currently ${totalPct}%). Please adjust them to equal 100%.`,
            );
            setIsSubmitting(false);
            return;
          }
        }

        const leadDeptNode = sequentialDependencies?.find(
          (d) => d.involvement_type === "PRIMARY",
        );
        const resolvedInvolvement = leadDeptNode?.involvement_type || "PRIMARY";

        endpoint = "/api/admin/rules/routing";
        payload = {
          rule_name: ruleName.trim(),
          department_id: selectedDeptId,
          category_id: selectedCatId,
          subcategory_id: selectedRoutingSubcatId,
          involvement_type: resolvedInvolvement,
          supporting_departments: selectedSupportingDepts,
          conditions: {
            dependency_type: dependencyType,
            dependencies: policyValidation.normalizedDependencies,
            primary_sla_percent: leadDeptNode?.sla_percent_allocation ?? null,
            primary_duration_minutes:
              leadDeptNode?.allocated_duration_minutes ?? null,
          },
          rule_order: Number.parseInt(ruleOrder, 10) || 10,
          status: ruleStatus,
          department_name: chosenDept?.department_name,
          category_name:
            selectedCatId === "CUSTOM"
              ? newCategoryName
              : chosenCat?.category_name,
          subcategory_name:
            selectedRoutingSubcatId === "CUSTOM"
              ? newSubcategoryName
              : chosenSub?.subcategory_name,
          new_category_name:
            selectedCatId === "CUSTOM" ? newCategoryName : undefined,
          new_subcategory_name:
            selectedRoutingSubcatId === "CUSTOM"
              ? newSubcategoryName
              : undefined,
        };
      } else if (modalRuleType === "sla") {
        endpoint = "/api/admin/rules/sla";
        payload = {
          policy_name: ruleName.trim(),
          priority_level: priorityLevel,
          sla_type: "RESOLUTION",
          target_duration_minutes:
            (Number.parseFloat(durationHours) || 24) * 60,
          warning_threshold_percent: Number.parseFloat(warningPercent) || 50,
          at_risk_threshold_percent: Number.parseFloat(atRiskPercent) || 75,
          critical_threshold_percent: Number.parseFloat(criticalPercent) || 90,
          escalation_threshold_percent:
            Number.parseFloat(escalationPercent) || 100,
          target_role: "DEPARTMENT_HEAD",
          status: ruleStatus,
          notification_recipients: slaRecipients,
          trigger_condition: {
            warning_threshold_percent: Number.parseFloat(warningPercent) || 50,
            at_risk_threshold_percent: Number.parseFloat(atRiskPercent) || 75,
            critical_threshold_percent:
              Number.parseFloat(criticalPercent) || 90,
            escalation_threshold_percent:
              Number.parseFloat(escalationPercent) || 100,
            notification_recipients: slaRecipients,
            departmental_allocation_mode: departmentalAllocationMode,
          },
        };
      } else if (modalRuleType === "reopen") {
        const conditions: Record<string, unknown> = {};
        if (selectedPriorityCatId) {
          if (selectedPriorityCatId !== "CUSTOM") {
            conditions.category_id = selectedPriorityCatId;
            const prioCat = categories.find(
              (c) => c.category_id === selectedPriorityCatId,
            );
            conditions.category = prioCat?.category_name;
          } else {
            conditions.category_id = "CUSTOM";
          }
        }
        if (selectedPrioritySubcatId) {
          if (selectedPrioritySubcatId !== "CUSTOM") {
            conditions.subcategory_id = selectedPrioritySubcatId;
            const prioCat = categories.find(
              (c) => c.category_id === selectedPriorityCatId,
            );
            const prioSubcat = prioCat?.subcategories?.find(
              (s) => s.subcategory_id === selectedPrioritySubcatId,
            );
            conditions.subcategory = prioSubcat?.subcategory_name;
          } else {
            conditions.subcategory_id = "CUSTOM";
          }
        }

        endpoint = "/api/admin/rules/reopen";
        payload = {
          policy_name: ruleName.trim(),
          reopen_window_hours: Number.parseInt(reopenWindowHours, 10) || 168,
          max_reopen_count: Number.parseInt(maxReopens, 10) || 2,
          max_manual_review_count: Number.parseInt(maxReviews, 10) || 1,
          status: ruleStatus,
          applicable_condition:
            Object.keys(conditions).length > 0 ? conditions : undefined,
          new_category_name:
            selectedPriorityCatId === "CUSTOM" ? newCategoryName : undefined,
          new_subcategory_name:
            selectedPrioritySubcatId === "CUSTOM"
              ? newSubcategoryName
              : undefined,
        };
      }

      const isEditing = Boolean(editingRuleId);
      const method =
        isEditing &&
        (modalRuleType === "priority" ||
          modalRuleType === "routing" ||
          modalRuleType === "sla" ||
          modalRuleType === "reopen")
          ? "PATCH"
          : "POST";
      const submitPayload =
        isEditing && modalRuleType === "priority"
          ? { ...payload, priority_rule_id: editingRuleId }
          : isEditing && modalRuleType === "routing"
            ? { ...payload, routing_rule_id: editingRuleId }
            : isEditing && modalRuleType === "sla"
              ? { ...payload, sla_policy_id: editingRuleId }
              : isEditing && modalRuleType === "reopen"
                ? { ...payload, reopen_policy_id: editingRuleId }
                : payload;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showNotice("error", data.message || "Failed to save policy rule.");
        setIsSubmitting(false);
        return;
      }

      if (modalRuleType === "priority") {
        if (isEditing) {
          setPriorityRules((prev) =>
            prev.map((r) =>
              r.priority_rule_id === editingRuleId
                ? {
                    ...r,
                    ...data.rule,
                    conditions: data.rule?.conditions ?? payload.conditions,
                  }
                : r,
            ),
          );
        } else {
          setPriorityRules((prev) => [...prev, data.rule]);
        }
      } else if (modalRuleType === "routing") {
        if (isEditing) {
          setRoutingRules((prev) =>
            prev.map((r) =>
              r.routing_rule_id === editingRuleId
                ? {
                    ...r,
                    ...data.rule,
                    conditions: data.rule?.conditions ?? payload.conditions,
                    supporting_departments:
                      data.rule?.supporting_departments ??
                      payload.supporting_departments,
                  }
                : r,
            ),
          );
        } else {
          setRoutingRules((prev) => [...prev, data.rule]);
        }
      } else if (modalRuleType === "sla") {
        if (isEditing) {
          setSlaPolicies((prev) =>
            prev.map((s) =>
              s.sla_policy_id === editingRuleId ? { ...s, ...data.policy } : s,
            ),
          );
        } else {
          setSlaPolicies((prev) => [...prev, data.policy]);
        }
      } else if (modalRuleType === "reopen") {
        if (isEditing) {
          setReopenPolicies((prev) =>
            prev.map((p) =>
              p.reopen_policy_id === editingRuleId
                ? { ...p, ...data.policy }
                : p,
            ),
          );
        } else {
          setReopenPolicies((prev) => [...prev, data.policy]);
        }
      }

      showNotice(
        "success",
        data.message || `Policy '${ruleName}' has been configured and saved.`,
      );

      setTimeout(() => {
        setRuleModalOpen(false);
        resetForm();
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error("Rule creation failed:", err);
      toast.error("Network error occurred while saving rule.", {
        id: "rule-action-toast",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    actionNotice,
    setActionNotice,
    showNotice,
    deleteModal,
    setDeleteModal,
    confirmDelete,
    executeDelete,
    handleToggleStatus,
    ruleModalOpen,
    setRuleModalOpen,
    modalRuleType,
    setModalRuleType,
    editingRuleId,
    setEditingRuleId,
    ruleStatus,
    setRuleStatus,
    isSubmitting,
    ruleName,
    setRuleName,
    priorityLevel,
    setPriorityLevel,
    ruleOrder,
    setRuleOrder,
    isDefault,
    setIsDefault,
    keywords,
    setKeywords,

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
    dependencyType,
    setDependencyType,
    sequentialDependencies,
    setSequentialDependencies,
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
    departmentalAllocationMode,
    setDepartmentalAllocationMode,
    slaRecipients,
    setSlaRecipients,
    reopenWindowHours,
    setReopenWindowHours,
    maxReopens,
    setMaxReopens,
    maxReviews,
    setMaxReviews,
    newCategoryName,
    setNewCategoryName,
    newSubcategoryName,
    setNewSubcategoryName,
    resetForm,
    openConfigureRow,
    handleCreateRule,
  };
}
