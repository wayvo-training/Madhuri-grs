"use client";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  RotateCcw,
  Sliders,
  Sparkles,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  AdminRuleConfigModal,
  ConfirmRuleDeleteModal,
} from "@/components/dashboard/admin/admin-rule-modals";
import {
  CreatePolicyMenu,
  type MainTab,
  type ModalRuleType,
  RulesFilterPopover,
} from "@/components/dashboard/admin/admin-rules-panels";
import {
  AdminFilterToolbar,
  AdminPanelHeader,
  AdminSearchInput,
} from "@/components/dashboard/admin/admin-shared";
import { PriorityBadge } from "@/components/dashboard/badges";

export interface SerializedPriorityRule {
  priority_rule_id: string;
  rule_name: string;
  priority_level: string;
  rule_order: number;
  is_default: boolean;
  status: string;
  conditions: unknown;
}

export interface SerializedRoutingRule {
  routing_rule_id: string;
  rule_name: string;
  category_name: string | null;
  subcategory_name: string | null;
  department_name: string;
  involvement_type: string;
  supporting_departments?: string[];
  rule_order: number;
  status: string;
  conditions: unknown;
}

export interface SerializedSlaPolicy {
  sla_policy_id: string;
  policy_name: string;
  priority_level: string | null;
  sla_type: string;
  target_duration_minutes: number;
  warning_threshold_percent: string;
  escalation_threshold_percent: string;
  target_role: string;
  status: string;
}

export interface SerializedReopenPolicy {
  reopen_policy_id: string;
  policy_name: string;
  reopen_window_hours: number | null;
  max_reopen_count: number;
  max_manual_review_count: number;
  status: string;
}

export interface SerializedSubcategory {
  subcategory_id: string;
  subcategory_name: string;
}

export interface SerializedCategory {
  category_id: string;
  category_name: string;
  subcategories?: SerializedSubcategory[];
}

interface AdminMasterRulesProps {
  priorityRules: SerializedPriorityRule[];
  routingRules: SerializedRoutingRule[];
  slaPolicies: SerializedSlaPolicy[];
  reopenPolicies: SerializedReopenPolicy[];
  departments?: { department_id: string; department_name: string }[];
  categories?: SerializedCategory[];
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} mins`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hrs`;
  const days = (hours / 24).toFixed(1).replace(".0", "");
  return `${days} Days (${hours} hrs)`;
}

export function AdminMasterRules({
  priorityRules: initialPriorityRules,
  routingRules: initialRoutingRules,
  slaPolicies: initialSlaPolicies,
  reopenPolicies: initialReopenPolicies,
  departments = [],
  categories = [],
}: AdminMasterRulesProps) {
  const router = useRouter();

  // Top-level Navigation: Policy Matrix vs Global Policies
  const [activeTab, setActiveTab] = useState<MainTab>("matrix");

  // Local state for instant updates
  const [priorityRules, setPriorityRules] = useState(initialPriorityRules);
  const [routingRules, setRoutingRules] = useState(initialRoutingRules);
  const [slaPolicies, setSlaPolicies] = useState(initialSlaPolicies);
  const [reopenPolicies, setReopenPolicies] = useState(initialReopenPolicies);

  // Status & Delete Actions
  const [tableFeedback, setTableFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Active custom dropdown
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Close dropdown on click outside
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

  // In-Page Action Notice (Msg Box banner)
  const [actionNotice, setActionNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [catFilter, setCatFilter] = useState("ALL");

  // Accordion Expand/Collapse States
  const [expandedMatrixDepts, setExpandedMatrixDepts] = useState<Set<string>>(
    () => new Set(["Finance", "Human Resources"]),
  );
  const [expandedMatrixCats, setExpandedMatrixCats] = useState<Set<string>>(
    () => new Set(),
  );
  // Tracks which subcategory rows have "View Routing Rules" open
  const [expandedRoutingViews, setExpandedRoutingViews] = useState<Set<string>>(
    () => new Set(),
  );
  // Default/Global policy panel open/close
  const [isDefaultsPanelOpen, setIsDefaultsPanelOpen] = useState(false);

  // Sync with global header search bar
  useEffect(() => {
    const handleHeaderSearch = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (typeof customEvent.detail === "string") {
        setSearchQuery(customEvent.detail);
      }
    };
    window.addEventListener("grs:header-search", handleHeaderSearch);
    return () => {
      window.removeEventListener("grs:header-search", handleHeaderSearch);
    };
  }, []);

  // Read initial search query from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const initial = new URLSearchParams(window.location.search).get("search");
      if (initial) {
        setSearchQuery(initial);
      }
    }
  }, []);

  // Effective Priority Resolver (mimics priority-engine.ts first-match-wins)
  const activePriorityRules = useMemo(() => {
    return [...priorityRules]
      .filter((r) => r.status === "ACTIVE")
      .sort((a, b) => a.rule_order - b.rule_order);
  }, [priorityRules]);

  const defaultPriorityRule = useMemo(() => {
    return (
      priorityRules.find((r) => r.is_default && r.status === "ACTIVE") ||
      priorityRules.find((r) => r.is_default) ||
      null
    );
  }, [priorityRules]);

  const resolveEffectivePriority = useCallback(
    (
      subcatName: string,
      catName: string,
    ): {
      priority: string;
      matchedRule: SerializedPriorityRule | null;
    } => {
      const sName = subcatName.toLowerCase().trim();
      const cName = catName.toLowerCase().trim();

      for (const rule of activePriorityRules) {
        if (rule.is_default) continue;
        const cond =
          rule.conditions && typeof rule.conditions === "object"
            ? (rule.conditions as Record<string, unknown>)
            : null;
        if (!cond) continue;

        const rSubcat = (
          (cond.subcategory || cond.subcategory_name || "") as string
        )
          .toLowerCase()
          .trim();
        const rCat = ((cond.category || cond.category_name || "") as string)
          .toLowerCase()
          .trim();

        if (rSubcat && rCat) {
          if (rSubcat === sName && rCat === cName) {
            return { priority: rule.priority_level, matchedRule: rule };
          }
        } else if (rSubcat) {
          if (rSubcat === sName) {
            return { priority: rule.priority_level, matchedRule: rule };
          }
        } else if (rCat) {
          if (rCat === cName) {
            return { priority: rule.priority_level, matchedRule: rule };
          }
        }
      }

      if (defaultPriorityRule) {
        return {
          priority: defaultPriorityRule.priority_level,
          matchedRule: defaultPriorityRule,
        };
      }

      return { priority: "MEDIUM", matchedRule: null };
    },
    [activePriorityRules, defaultPriorityRule],
  );

  // Effective SLA Resolver
  const resolveEffectiveSla = useCallback(
    (
      priorityLevel: string,
    ): {
      slaTarget: string;
      matchedPolicy: SerializedSlaPolicy | null;
    } => {
      const pLevel = priorityLevel.toUpperCase();
      const activeSlas = slaPolicies.filter((s) => s.status === "ACTIVE");
      const matched =
        activeSlas.find((s) => s.priority_level?.toUpperCase() === pLevel) ||
        activeSlas.find((s) => !s.priority_level) ||
        null;

      if (matched) {
        return {
          slaTarget: formatDuration(matched.target_duration_minutes),
          matchedPolicy: matched,
        };
      }
      return { slaTarget: "—", matchedPolicy: null };
    },
    [slaPolicies],
  );

  // Consolidated Policy Matrix Tree
  const isSearching = Boolean(searchQuery.trim());

  const matrixTree = useMemo(() => {
    // Group all routing rules by department -> category -> subcategory
    const deptMap = new Map<
      string,
      Map<string, Map<string, SerializedRoutingRule[]>>
    >();

    for (const rule of routingRules) {
      const dept = rule.department_name || "Unassigned";
      const cat = rule.category_name || "General";
      const subcat = rule.subcategory_name || "General";

      let catMap = deptMap.get(dept);
      if (!catMap) {
        catMap = new Map();
        deptMap.set(dept, catMap);
      }
      let subcatMap = catMap.get(cat);
      if (!subcatMap) {
        subcatMap = new Map();
        catMap.set(cat, subcatMap);
      }
      let list = subcatMap.get(subcat);
      if (!list) {
        list = [];
        subcatMap.set(subcat, list);
      }
      list.push(rule);
    }

    const q = searchQuery.toLowerCase().trim();

    const result = [];

    for (const [dept, catMap] of deptMap.entries()) {
      if (deptFilter !== "ALL" && dept !== deptFilter) continue;

      const categoriesList = [];

      for (const [cat, subcatMap] of catMap.entries()) {
        if (catFilter !== "ALL" && cat !== catFilter) continue;

        const subcategoriesList = [];

        for (const [subcat, rules] of subcatMap.entries()) {
          // Status filtering: check if subcategory has active or inactive rules
          const hasActive = rules.some((r) => r.status === "ACTIVE");
          if (statusFilter === "ACTIVE" && !hasActive) continue;
          if (statusFilter === "INACTIVE" && hasActive) continue;

          // Effective Priority
          const {
            priority: effectivePriority,
            matchedRule: matchedPriorityRule,
          } = resolveEffectivePriority(subcat, cat);

          // Primary routing rule
          const primaryRule =
            rules.find(
              (r) => r.status === "ACTIVE" && r.involvement_type === "PRIMARY",
            ) ||
            rules.find((r) => r.involvement_type === "PRIMARY") ||
            rules[0];

          const primaryRouteDept = primaryRule?.department_name || dept;

          // Supporting departments
          const supportingSet = new Set<string>();
          if (primaryRule?.supporting_departments) {
            for (const sd of primaryRule.supporting_departments) {
              if (sd && sd !== primaryRouteDept) supportingSet.add(sd);
            }
          }
          for (const r of rules) {
            if (
              r.involvement_type === "SUPPORTING" &&
              r.department_name !== primaryRouteDept
            ) {
              supportingSet.add(r.department_name);
            }
          }
          const supportingDepts = Array.from(supportingSet);

          // Effective SLA
          const { slaTarget, matchedPolicy: matchedSlaPolicy } =
            resolveEffectiveSla(effectivePriority);

          // Search filtering
          if (q) {
            const rowMatches =
              subcat.toLowerCase().includes(q) ||
              cat.toLowerCase().includes(q) ||
              dept.toLowerCase().includes(q) ||
              effectivePriority.toLowerCase().includes(q) ||
              primaryRouteDept.toLowerCase().includes(q) ||
              supportingDepts.some((sd) => sd.toLowerCase().includes(q)) ||
              slaTarget.toLowerCase().includes(q) ||
              rules.some(
                (r) =>
                  r.rule_name.toLowerCase().includes(q) ||
                  JSON.stringify(r.conditions || "")
                    .toLowerCase()
                    .includes(q),
              );

            if (!rowMatches) continue;
          }

          subcategoriesList.push({
            subcategoryName: subcat,
            categoryName: cat,
            departmentName: dept,
            effectivePriority,
            matchedPriorityRule,
            primaryRouteDept,
            supportingDepts,
            effectiveSlaDuration: slaTarget,
            matchedSlaPolicy,
            routingRules: rules,
            status: (hasActive ? "ACTIVE" : "INACTIVE") as
              | "ACTIVE"
              | "INACTIVE",
          });
        }

        if (subcategoriesList.length > 0) {
          categoriesList.push({
            categoryName: cat,
            count: subcategoriesList.length,
            subcategories: subcategoriesList,
          });
        }
      }

      if (categoriesList.length > 0) {
        const totalSubcats = categoriesList.reduce(
          (acc, c) => acc + c.count,
          0,
        );
        result.push({
          departmentName: dept,
          count: totalSubcats,
          categories: categoriesList,
        });
      }
    }

    return result;
  }, [
    routingRules,
    deptFilter,
    catFilter,
    statusFilter,
    searchQuery,
    resolveEffectiveSla,
    resolveEffectivePriority,
  ]);

  // Total count of configured grievance types in matrix
  const totalMatrixGrievanceTypes = useMemo(() => {
    return matrixTree.reduce((acc, d) => acc + d.count, 0);
  }, [matrixTree]);

  // Unique Categories list for dropdown
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of routingRules) {
      if (r.category_name) set.add(r.category_name);
    }
    return Array.from(set).sort();
  }, [routingRules]);

  // Global Policies List (Reopen Policies)
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

  // Toggle helpers
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

  const isFiltered =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "ALL" ||
    deptFilter !== "ALL" ||
    catFilter !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setDeptFilter("ALL");
    setCatFilter("ALL");
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("grs:component-search", { detail: "" }),
      );
    }
  };

  // Modal State for Rule Configuration / Creation
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [modalRuleType, setModalRuleType] = useState<ModalRuleType>("routing");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
  const [_slaType, _setSlaType] = useState("RESOLUTION");
  const [durationHours, setDurationHours] = useState("24");
  const [warningPercent, setWarningPercent] = useState("75");
  const [escalationPercent, setEscalationPercent] = useState("100");
  const [_targetRole, _setTargetRole] = useState("DEPARTMENT_HEAD");

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

  // Pre-fill modal for configuring a grievance type
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

        {/* ============================================================== */}
        {/* TAB 1: POLICY MATRIX */}
        {/* ============================================================== */}
        {activeTab === "matrix" && (
          <div id="policy-matrix-section" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Policy Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Configure and review priority, routing, and SLA policies for
                  grievance types.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#064E3B]">
                  {totalMatrixGrievanceTypes} Grievance{" "}
                  {totalMatrixGrievanceTypes === 1 ? "Type" : "Types"}{" "}
                  Configured
                </span>
              </div>
            </div>

            {matrixTree.length === 0 ? (
              <div className="rounded-xl border border-slate-200/80 bg-white py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                  <p className="font-semibold text-slate-700">
                    No grievance policies match your search or filter.
                  </p>
                  <p className="text-xs text-slate-400">
                    Try adjusting your department, category, or status filters.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset Filters</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {matrixTree.map((deptNode) => {
                  const isDeptOpen =
                    isSearching ||
                    expandedMatrixDepts.has(deptNode.departmentName);

                  return (
                    <div
                      key={deptNode.departmentName}
                      className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs transition-shadow"
                    >
                      {/* LEVEL 1: Department Header */}
                      <button
                        type="button"
                        onClick={() =>
                          toggleMatrixDept(deptNode.departmentName)
                        }
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          {isDeptOpen ? (
                            <ChevronDown className="h-4 w-4 text-slate-600 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                          <span className="rounded-lg bg-emerald-50 p-1 text-emerald-800">
                            <Building2 className="h-4 w-4" />
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {deptNode.departmentName}
                          </span>
                        </div>
                        <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {deptNode.count}{" "}
                          {deptNode.count === 1 ? "type" : "types"}
                        </span>
                      </button>

                      {/* LEVEL 2: Categories */}
                      {isDeptOpen && (
                        <div className="border-t border-slate-200/80 divide-y divide-slate-100">
                          {deptNode.categories.map((catNode) => {
                            const catKey = `${deptNode.departmentName}::${catNode.categoryName}`;
                            const isCatOpen =
                              isSearching || expandedMatrixCats.has(catKey);

                            return (
                              <div key={catKey} className="bg-white">
                                <button
                                  type="button"
                                  onClick={() => toggleMatrixCat(catKey)}
                                  className="w-full flex items-center justify-between pl-8 pr-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                                >
                                  <div className="flex items-center gap-2">
                                    {isCatOpen ? (
                                      <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    )}
                                    <span className="text-xs font-bold text-slate-800">
                                      {catNode.categoryName}
                                    </span>
                                  </div>
                                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                    {catNode.count}{" "}
                                    {catNode.count === 1 ? "type" : "types"}
                                  </span>
                                </button>

                                {/* LEVEL 3: Policy Matrix Table */}
                                {isCatOpen && (
                                  <div className="pl-8 pr-4 py-3 bg-slate-50/60 border-t border-slate-100">
                                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                      <table className="w-full text-left text-xs">
                                        <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                          <tr>
                                            <th className="py-2.5 pl-3 pr-2">
                                              Grievance Type
                                            </th>
                                            <th className="px-3 py-2.5">
                                              Priority
                                            </th>
                                            <th className="px-3 py-2.5">
                                              Primary Route
                                            </th>
                                            <th className="px-3 py-2.5">
                                              Supporting Dept
                                            </th>
                                            <th className="px-3 py-2.5">
                                              SLA Target
                                            </th>
                                            <th className="py-2.5 pl-3 pr-3 text-right">
                                              Actions
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                          {catNode.subcategories.map((row) => {
                                            const rowKey = `${deptNode.departmentName}::${catNode.categoryName}::${row.subcategoryName}`;
                                            const isRoutingExpanded =
                                              expandedRoutingViews.has(rowKey);

                                            return (
                                              <React.Fragment key={rowKey}>
                                                <tr className="hover:bg-slate-50/70 transition-colors">
                                                  {/* Grievance Type */}
                                                  <td className="py-2.5 pl-3 pr-2 font-bold text-slate-900">
                                                    {row.subcategoryName}
                                                  </td>

                                                  {/* Priority */}
                                                  <td className="px-3 py-2.5">
                                                    <PriorityBadge
                                                      priority={
                                                        row.effectivePriority
                                                      }
                                                    />
                                                  </td>

                                                  {/* Primary Route */}
                                                  <td className="px-3 py-2.5">
                                                    <span className="font-semibold text-slate-800">
                                                      {row.primaryRouteDept}
                                                    </span>
                                                  </td>

                                                  {/* Supporting Dept */}
                                                  <td className="px-3 py-2.5 text-xs text-slate-600">
                                                    {row.supportingDepts
                                                      .length > 0 ? (
                                                      <span className="inline-flex flex-wrap gap-1">
                                                        {row.supportingDepts.map(
                                                          (sd) => (
                                                            <span
                                                              key={sd}
                                                              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-700"
                                                            >
                                                              {sd}
                                                            </span>
                                                          ),
                                                        )}
                                                      </span>
                                                    ) : (
                                                      <span className="text-slate-400">
                                                        &mdash;
                                                      </span>
                                                    )}
                                                  </td>

                                                  {/* SLA Target */}
                                                  <td className="px-3 py-2.5">
                                                    <span className="font-semibold text-slate-800">
                                                      {row.effectiveSlaDuration}
                                                    </span>
                                                  </td>

                                                  {/* Actions */}
                                                  <td className="py-2.5 pl-3 pr-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                      {/* View Routing Rules */}
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          toggleRoutingView(
                                                            rowKey,
                                                          )
                                                        }
                                                        title="View individual routing rules for this grievance type"
                                                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition border shadow-2xs ${
                                                          isRoutingExpanded
                                                            ? "bg-slate-800 text-white border-slate-900"
                                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                                        }`}
                                                      >
                                                        <span>
                                                          {isRoutingExpanded
                                                            ? "Hide Rules"
                                                            : `View Routing Rules (${row.routingRules.length})`}
                                                        </span>
                                                        {isRoutingExpanded ? (
                                                          <ChevronDown className="h-3 w-3" />
                                                        ) : (
                                                          <ChevronRight className="h-3 w-3" />
                                                        )}
                                                      </button>

                                                      {/* Configure */}
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          openConfigureRow(
                                                            row.departmentName,
                                                            row.categoryName,
                                                            row.subcategoryName,
                                                            row.effectivePriority,
                                                          )
                                                        }
                                                        title="Configure policy for this grievance type"
                                                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition"
                                                      >
                                                        <span>Configure</span>
                                                      </button>
                                                    </div>
                                                  </td>
                                                </tr>

                                                {/* Expanded Detailed Routing View */}
                                                {isRoutingExpanded && (
                                                  <tr>
                                                    <td
                                                      colSpan={6}
                                                      className="bg-slate-50/80 p-3.5 border-t border-slate-100"
                                                    >
                                                      <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 pb-1">
                                                          <span>
                                                            Underlying Routing
                                                            Records (
                                                            {
                                                              row.routingRules
                                                                .length
                                                            }
                                                            )
                                                          </span>
                                                          <span className="text-slate-400 normal-case font-normal">
                                                            Every routing rule
                                                            remains an
                                                            individual distinct
                                                            record
                                                          </span>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                          {/* Sub-table Header */}
                                                          <div className="hidden sm:grid grid-cols-12 items-center gap-3 px-3 py-1.5 text-2xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/60">
                                                            <div className="col-span-5">
                                                              Rule & Target
                                                            </div>
                                                            <div className="col-span-2">
                                                              Involvement
                                                            </div>
                                                            <div className="col-span-2">
                                                              Supporting Dept
                                                            </div>
                                                            <div className="col-span-2">
                                                              Status
                                                            </div>
                                                            <div className="col-span-1 text-right">
                                                              Action
                                                            </div>
                                                          </div>

                                                          {row.routingRules.map(
                                                            (rr) => (
                                                              <div
                                                                key={
                                                                  rr.routing_rule_id
                                                                }
                                                                className="grid grid-cols-12 items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs hover:border-slate-300 transition"
                                                              >
                                                                {/* Rule Name & Target */}
                                                                <div className="col-span-12 sm:col-span-5 flex items-center gap-2 min-w-0">
                                                                  <span className="font-mono text-xs font-bold text-slate-500 shrink-0">
                                                                    #
                                                                    {
                                                                      rr.rule_order
                                                                    }
                                                                  </span>
                                                                  <span
                                                                    className="text-xs font-bold text-slate-900 truncate"
                                                                    title={
                                                                      rr.rule_name
                                                                    }
                                                                  >
                                                                    {
                                                                      rr.rule_name
                                                                    }
                                                                  </span>
                                                                  <span className="text-slate-400 shrink-0">
                                                                    &rarr;
                                                                  </span>
                                                                  <span
                                                                    className="text-xs font-semibold text-slate-800 truncate"
                                                                    title={
                                                                      rr.department_name
                                                                    }
                                                                  >
                                                                    {
                                                                      rr.department_name
                                                                    }
                                                                  </span>
                                                                </div>

                                                                {/* Involvement Badge */}
                                                                <div className="col-span-6 sm:col-span-2 flex items-center">
                                                                  <span
                                                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-2xs font-bold uppercase tracking-wider ${
                                                                      rr.involvement_type ===
                                                                      "PRIMARY"
                                                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                                                    }`}
                                                                  >
                                                                    {
                                                                      rr.involvement_type
                                                                    }
                                                                  </span>
                                                                </div>

                                                                {/* Supporting Depts */}
                                                                <div className="col-span-6 sm:col-span-2 flex items-center">
                                                                  {rr.supporting_departments &&
                                                                  rr
                                                                    .supporting_departments
                                                                    .length >
                                                                    0 ? (
                                                                    <span
                                                                      className="text-xs text-slate-600 truncate max-w-full"
                                                                      title={rr.supporting_departments.join(
                                                                        ", ",
                                                                      )}
                                                                    >
                                                                      {rr.supporting_departments.join(
                                                                        ", ",
                                                                      )}
                                                                    </span>
                                                                  ) : (
                                                                    <span className="text-slate-300 font-mono text-xs select-none">
                                                                      &mdash;
                                                                    </span>
                                                                  )}
                                                                </div>

                                                                {/* Status Toggle */}
                                                                <div className="col-span-6 sm:col-span-2 flex items-center">
                                                                  <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                      handleToggleStatus(
                                                                        "routing",
                                                                        rr.routing_rule_id,
                                                                        rr.status,
                                                                      )
                                                                    }
                                                                    title={
                                                                      rr.status ===
                                                                      "ACTIVE"
                                                                        ? "Click to Deactivate rule"
                                                                        : "Click to Activate rule"
                                                                    }
                                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition border shadow-2xs cursor-pointer ${
                                                                      rr.status ===
                                                                      "ACTIVE"
                                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                                                        : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                                                    }`}
                                                                  >
                                                                    <span
                                                                      className={`h-1.5 w-1.5 rounded-full ${
                                                                        rr.status ===
                                                                        "ACTIVE"
                                                                          ? "bg-emerald-500"
                                                                          : "bg-slate-400"
                                                                      }`}
                                                                    />
                                                                    <span>
                                                                      {rr.status ===
                                                                      "ACTIVE"
                                                                        ? "Active"
                                                                        : "Deactivated"}
                                                                    </span>
                                                                  </button>
                                                                </div>

                                                                {/* Delete Button */}
                                                                <div className="col-span-6 sm:col-span-1 flex items-center justify-end">
                                                                  <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                      confirmDelete(
                                                                        "routing",
                                                                        rr.routing_rule_id,
                                                                        rr.rule_name,
                                                                      )
                                                                    }
                                                                    title="Delete routing rule"
                                                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500 shadow-2xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                                                                  >
                                                                    <Trash2 className="h-3 w-3" />
                                                                    <span>
                                                                      Delete
                                                                    </span>
                                                                  </button>
                                                                </div>
                                                              </div>
                                                            ),
                                                          )}
                                                        </div>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                )}
                                              </React.Fragment>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Section: Global & Default Engine Policies */}
            <div className="mt-6 rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setIsDefaultsPanelOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {isDefaultsPanelOpen ? (
                    <ChevronDown className="h-4 w-4 text-slate-600 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                  <span className="rounded-lg bg-emerald-50 p-1 text-emerald-800">
                    <Sliders className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    Global Engine Defaults & Fallback Rules
                  </span>
                  <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-medium text-slate-700">
                    Fallback Rules
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {isDefaultsPanelOpen
                    ? "Click to collapse"
                    : "Click to view default fallbacks"}
                </span>
              </button>

              {isDefaultsPanelOpen && (
                <div className="p-4 border-t border-slate-100 space-y-4 text-xs">
                  {/* Default Priority Fallback Rule */}
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      <span>System Default Priority Fallback</span>
                    </h4>
                    <p className="text-xs text-slate-500 mb-2">
                      Evaluated when no category or subcategory specific
                      priority rule matches an incoming grievance.
                    </p>
                    {defaultPriorityRule ? (
                      <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            #{defaultPriorityRule.rule_order}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900">
                              {defaultPriorityRule.rule_name}
                            </span>
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              System Default
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <PriorityBadge
                            priority={defaultPriorityRule.priority_level}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(
                                "priority",
                                defaultPriorityRule.priority_rule_id,
                                defaultPriorityRule.status,
                              )
                            }
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${
                              defaultPriorityRule.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {defaultPriorityRule.status === "ACTIVE"
                              ? "Active"
                              : "Deactivated"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No default fallback rule configured.
                      </p>
                    )}
                  </div>

                  {/* Standard SLA Targets Matrix */}
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Standard SLA Target Duration Matrix</span>
                    </h4>
                    <p className="text-xs text-slate-500 mb-2">
                      Resolution deadlines matched dynamically by grievance
                      priority severity.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                      {slaPolicies.map((sla) => (
                        <div
                          key={sla.sla_policy_id}
                          className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            {sla.priority_level ? (
                              <PriorityBadge priority={sla.priority_level} />
                            ) : (
                              <span className="font-semibold text-slate-700 text-2xs">
                                General
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleStatus(
                                  "sla",
                                  sla.sla_policy_id,
                                  sla.status,
                                )
                              }
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                sla.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {sla.status}
                            </button>
                          </div>
                          <p className="text-xs font-bold text-slate-900">
                            {formatDuration(sla.target_duration_minutes)}
                          </p>
                          <p
                            className="text-xs text-slate-500 truncate"
                            title={sla.policy_name}
                          >
                            {sla.policy_name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: GLOBAL POLICIES (Resolution Reopen & Dissatisfaction) */}
        {/* ============================================================== */}
        {activeTab === "global" && (
          <div id="global-policies-section" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Global Policies
                </h3>
                <p className="text-xs text-slate-500">
                  Organization-wide policies governing grievance reopen windows,
                  manual review limits, and escalation parameters.
                </p>
              </div>
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#064E3B]">
                {reopenPolicies.length} Active Organization{" "}
                {reopenPolicies.length === 1 ? "Policy" : "Policies"}
              </span>
            </div>

            {filteredReopenPolicies.length === 0 ? (
              <div className="rounded-xl border border-slate-200/80 bg-white py-12 text-center">
                <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                  <p className="font-semibold text-slate-700">
                    No global reopen policies found.
                  </p>
                  <p className="text-xs text-slate-400">
                    Configure a global policy to govern resolution reopen
                    requests.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReopenPolicies.map((policy) => {
                  const windowStr = policy.reopen_window_hours
                    ? `${policy.reopen_window_hours} Hours (${(
                        policy.reopen_window_hours / 24
                      ).toFixed(0)} Days)`
                    : "Unlimited";

                  return (
                    <div
                      key={policy.reopen_policy_id}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-emerald-50 p-1.5 text-emerald-800">
                              <RotateCcw className="h-4 w-4" />
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">
                                {policy.policy_name}
                              </h4>
                              <span className="text-xs text-slate-400 font-mono">
                                ID: {policy.reopen_policy_id}
                              </span>
                            </div>
                          </div>

                          {/* Status toggle pill */}
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(
                                "reopen",
                                policy.reopen_policy_id,
                                policy.status,
                              )
                            }
                            title={
                              policy.status === "ACTIVE"
                                ? "Click to Deactivate policy"
                                : "Click to Activate policy"
                            }
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition border shadow-2xs ${
                              policy.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                policy.status === "ACTIVE"
                                  ? "bg-emerald-500 animate-pulse"
                                  : "bg-slate-400"
                              }`}
                            />
                            <span>
                              {policy.status === "ACTIVE"
                                ? "Active"
                                : "Deactivated"}
                            </span>
                          </button>
                        </div>

                        {/* Metric Highlights */}
                        <div className="grid grid-cols-3 gap-2.5 pt-2">
                          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
                            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Reopen Window
                            </span>
                            <span className="mt-0.5 block text-xs font-bold text-slate-900">
                              {windowStr}
                            </span>
                          </div>

                          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
                            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Max Attempts
                            </span>
                            <span className="mt-0.5 block text-xs font-bold text-slate-900">
                              {policy.max_reopen_count} Reopen{" "}
                              {policy.max_reopen_count === 1
                                ? "Attempt"
                                : "Attempts"}
                            </span>
                          </div>

                          <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5">
                            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                              Manual Reviews
                            </span>
                            <span className="mt-0.5 block text-xs font-bold text-slate-900">
                              {policy.max_manual_review_count}{" "}
                              {policy.max_manual_review_count === 1
                                ? "Review"
                                : "Reviews"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            resetForm();
                            setModalRuleType("reopen");
                            setRuleName(policy.policy_name);
                            setReopenWindowHours(
                              policy.reopen_window_hours?.toString() || "168",
                            );
                            setMaxReopens(policy.max_reopen_count.toString());
                            setMaxReviews(
                              policy.max_manual_review_count.toString(),
                            );
                            setRuleModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                        >
                          <span>Configure</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            confirmDelete(
                              "reopen",
                              policy.reopen_policy_id,
                              policy.policy_name,
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 shadow-2xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {/* ============================================================== */}
      {/* Interactive Policy Creation / Configuration Modal */}
      {/* ============================================================== */}
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
