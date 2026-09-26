import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
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

export function useRuleActions({
  departments,
  categories,
  setPriorityRules,
  setRoutingRules,
  setSlaPolicies,
  setReopenPolicies,
}: UseRuleActionsParams) {
  const router = useRouter();

  // Status & Table Feedback
  const [tableFeedback, setTableFeedback] = useState<RuleFeedback | null>(null);

  // In-Page Action Notice (Msg Box banner)
  const [actionNotice, setActionNotice] = useState<RuleFeedback | null>(null);

  const showNotice = useCallback((type: "success" | "error", text: string) => {
    setActionNotice({ type, text });
    setTimeout(() => {
      setActionNotice((prev) => (prev?.text === text ? null : prev));
    }, 5000);
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
      setPriorityRules((prev) =>
        prev.map((r) =>
          r.priority_rule_id === id ? { ...r, status: "INACTIVE" } : r,
        ),
      );
    } else if (ruleType === "routing") {
      endpoint = `/api/admin/rules/routing?id=${id}`;
      setRoutingRules((prev) =>
        prev.map((r) =>
          r.routing_rule_id === id ? { ...r, status: "INACTIVE" } : r,
        ),
      );
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
        setTableFeedback({
          type: "error",
          text: data.message || "Failed to update rule status.",
        });
        showNotice("error", data.message || "Failed to update rule status.");
        return;
      }
      setTableFeedback({
        type: "success",
        text: data.message || "Rule status updated successfully.",
      });
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
      setTableFeedback({
        type: "error",
        text: "Network error updating rule status. Please try again.",
      });
    }
  }

  // Modal State for Rule Configuration / Creation
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [modalRuleType, setModalRuleType] = useState<ModalRuleType>("routing");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<RuleFeedback | null>(null);

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

  // Priority-specific Taxonomy State
  const [selectedPriorityCatId, setSelectedPriorityCatId] = useState("");
  const [selectedPrioritySubcatId, setSelectedPrioritySubcatId] = useState("");

  // SLA-specific State
  const [durationHours, setDurationHours] = useState("24");
  const [warningPercent, setWarningPercent] = useState("75");
  const [escalationPercent, setEscalationPercent] = useState("100");

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
    setSelectedDeptId("");
    setSelectedCatId("");
    setSelectedRoutingSubcatId("");
    setSelectedPriorityCatId("");
    setSelectedPrioritySubcatId("");
    setSelectedSupportingDepts([]);
    setRuleStatus("ACTIVE");
    setFeedback(null);
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

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    if (!ruleName.trim()) return;

    try {
      setIsSubmitting(true);
      setFeedback(null);

      let endpoint = "";
      let payload: Record<string, unknown> = {};

      if (modalRuleType === "priority") {
        if (!isDefault && !selectedPriorityCatId) {
          setFeedback({
            type: "error",
            text: "Category is required. Every priority rule must be scoped to a Category (or set as Default Fallback).",
          });
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
          conditions = {
            category_id: selectedPriorityCatId,
            category: prioCat?.category_name,
          };
          if (selectedPrioritySubcatId) {
            conditions.subcategory_id = selectedPrioritySubcatId;
            conditions.subcategory = prioSubcat?.subcategory_name;
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
        };
      } else if (modalRuleType === "routing") {
        if (!selectedDeptId || !selectedCatId || !selectedRoutingSubcatId) {
          setFeedback({
            type: "error",
            text: "Primary Department, Category, and Subcategory are strictly required.",
          });
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

        endpoint = "/api/admin/rules/routing";
        payload = {
          rule_name: ruleName.trim(),
          department_id: selectedDeptId,
          category_id: selectedCatId,
          subcategory_id: selectedRoutingSubcatId,
          involvement_type: involvementType,
          supporting_departments: selectedSupportingDepts,
          rule_order: Number.parseInt(ruleOrder, 10) || 10,
          status: ruleStatus,
          department_name: chosenDept?.department_name,
          category_name: chosenCat?.category_name,
          subcategory_name: chosenSub?.subcategory_name,
        };
      } else if (modalRuleType === "sla") {
        endpoint = "/api/admin/rules/sla";
        payload = {
          policy_name: ruleName.trim(),
          priority_level: priorityLevel,
          sla_type: "RESOLUTION",
          target_duration_minutes:
            (Number.parseFloat(durationHours) || 24) * 60,
          warning_threshold_percent: Number.parseFloat(warningPercent) || 75,
          escalation_threshold_percent:
            Number.parseFloat(escalationPercent) || 100,
          target_role: "DEPARTMENT_HEAD",
          status: ruleStatus,
        };
      } else if (modalRuleType === "reopen") {
        endpoint = "/api/admin/rules/reopen";
        payload = {
          policy_name: ruleName.trim(),
          reopen_window_hours: Number.parseInt(reopenWindowHours, 10) || 168,
          max_reopen_count: Number.parseInt(maxReopens, 10) || 2,
          max_manual_review_count: Number.parseInt(maxReviews, 10) || 1,
          status: ruleStatus,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({
          type: "error",
          text: data.message || "Failed to create policy rule.",
        });
        showNotice("error", data.message || "Failed to create policy rule.");
        setIsSubmitting(false);
        return;
      }

      if (modalRuleType === "priority") {
        setPriorityRules((prev) => [...prev, data.rule]);
      } else if (modalRuleType === "routing") {
        setRoutingRules((prev) => [...prev, data.rule]);
      } else if (modalRuleType === "sla") {
        setSlaPolicies((prev) => [...prev, data.policy]);
      } else if (modalRuleType === "reopen") {
        setReopenPolicies((prev) => [...prev, data.policy]);
      }

      setFeedback({
        type: "success",
        text: data.message || "Rule saved successfully.",
      });
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
      setFeedback({
        type: "error",
        text: "Network error occurred while saving rule.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    tableFeedback,
    setTableFeedback,
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
    isSubmitting,
    feedback,
    setFeedback,
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
    ruleStatus,
    setRuleStatus,
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
    resetForm,
    openConfigureRow,
    handleCreateRule,
  };
}
