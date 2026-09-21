"use client";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  Plus,
  RotateCcw,
  Sliders,
  Trash2,
  Workflow,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

type RuleTab = "priority" | "routing" | "sla" | "reopen";

function PaginationFooter({
  currentPage,
  totalItems,
  pageSize,
  itemLabel = "rules",
  onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  itemLabel?: string;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
      <div>
        Showing <span className="font-semibold text-slate-700">{start}</span> to{" "}
        <span className="font-semibold text-slate-700">{end}</span> of{" "}
        <span className="font-semibold text-slate-700">{totalItems}</span>{" "}
        {itemLabel}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Prev</span>
        </button>
        <span className="px-2 font-semibold text-slate-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
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
  const [activeTab, setActiveTab] = useState<RuleTab>("priority");

  // Local state for instant updates
  const [priorityRules, setPriorityRules] = useState(initialPriorityRules);
  const [routingRules, setRoutingRules] = useState(initialRoutingRules);
  const [slaPolicies, setSlaPolicies] = useState(initialSlaPolicies);
  const [reopenPolicies, setReopenPolicies] = useState(initialReopenPolicies);

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
        return;
      }
      setTableFeedback({
        type: "success",
        text: data.message || "Rule status updated successfully.",
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to toggle status:", err);
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
        text: "Network error updating rule status. Please try again.",
      });
    }
  }

  async function handleDeleteRule(
    ruleType: "priority" | "routing" | "sla" | "reopen",
    id: string,
  ) {
    if (
      !window.confirm(
        "Are you sure you want to deactivate this rule configuration? (Deactivation preserves historical routing and audit trails)",
      )
    )
      return;

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
      await fetch(endpoint, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      console.error("Failed to deactivate rule:", err);
    }
  }

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [tableFeedback, setTableFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Common & tab-specific fields
  const [ruleName, setRuleName] = useState("");
  const [priorityLevel, setPriorityLevel] = useState("HIGH");
  const [ruleOrder, setRuleOrder] = useState("10");
  const [isDefault, setIsDefault] = useState(false);
  const [keywords, setKeywords] = useState("");
  const [ruleStatus, setRuleStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  // Pagination states for each rule category
  const [priorityPage, setPriorityPage] = useState(1);
  const [routingPage, setRoutingPage] = useState(1);
  const [slaPage, setSlaPage] = useState(1);
  const [reopenPage, setReopenPage] = useState(1);
  const PAGE_SIZE = 10;

  const paginatedPriorityRules = priorityRules.slice(
    (priorityPage - 1) * PAGE_SIZE,
    priorityPage * PAGE_SIZE,
  );
  const paginatedRoutingRules = routingRules.slice(
    (routingPage - 1) * PAGE_SIZE,
    routingPage * PAGE_SIZE,
  );
  const paginatedSlaPolicies = slaPolicies.slice(
    (slaPage - 1) * PAGE_SIZE,
    slaPage * PAGE_SIZE,
  );
  const paginatedReopenPolicies = reopenPolicies.slice(
    (reopenPage - 1) * PAGE_SIZE,
    reopenPage * PAGE_SIZE,
  );

  // Priority-specific Taxonomy State
  const [selectedPriorityCatId, setSelectedPriorityCatId] = useState("");
  const [selectedPrioritySubcatId, setSelectedPrioritySubcatId] = useState("");

  // Routing-specific State
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [selectedRoutingSubcatId, setSelectedRoutingSubcatId] = useState("");
  const [involvementType, setInvolvementType] = useState("PRIMARY");
  const [selectedSupportingDepts, setSelectedSupportingDepts] = useState<
    string[]
  >([]);

  const [_slaType, _setSlaType] = useState("RESOLUTION");
  const [durationHours, setDurationHours] = useState("24");
  const [warningPercent, setWarningPercent] = useState("75");
  const [escalationPercent, setEscalationPercent] = useState("100");
  const [_targetRole, _setTargetRole] = useState("DEPARTMENT_HEAD");

  const [reopenWindowHours, setReopenWindowHours] = useState("168");
  const [maxReopens, setMaxReopens] = useState("2");
  const [maxReviews, setMaxReviews] = useState("1");

  // Sync tab with URL hash if present
  useEffect(() => {
    function handleHash() {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes("priority")) setActiveTab("priority");
      else if (hash.includes("routing")) setActiveTab("routing");
      else if (hash.includes("sla")) setActiveTab("sla");
      else if (hash.includes("reopen")) setActiveTab("reopen");
    }

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hrs`;
    const days = (hours / 24).toFixed(1).replace(".0", "");
    return `${days} days (${hours} hrs)`;
  }

  function formatPriorityConditions(rule: SerializedPriorityRule) {
    if (rule.is_default) {
      return (
        <span className="italic text-slate-400">
          Default Fallback (All other grievances)
        </span>
      );
    }
    const cond = rule.conditions as
      | {
          category?: string;
          category_name?: string;
          subcategory?: string;
          subcategory_name?: string;
          contains?: string[];
          keywords?: string[];
        }
      | null
      | undefined;

    const category = cond?.category || cond?.category_name;
    const subcategory = cond?.subcategory || cond?.subcategory_name;

    if (category || subcategory) {
      return (
        <div className="flex items-center gap-1.5 font-medium text-slate-800">
          {category && (
            <span className="font-semibold text-slate-900">{category}</span>
          )}
          {category && subcategory && (
            <span className="text-slate-400">&rarr;</span>
          )}
          {subcategory ? (
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
              {subcategory}
            </span>
          ) : (
            <span className="text-slate-500 text-[11px]">
              (All Subcategories)
            </span>
          )}
        </div>
      );
    }

    const kws = cond?.contains || cond?.keywords;
    if (kws && Array.isArray(kws) && kws.length > 0) {
      return (
        <span className="text-slate-600 text-[11px]">
          Keywords: {kws.join(", ")}
        </span>
      );
    }

    return (
      <span className="font-mono text-[11px] text-slate-500">
        {JSON.stringify(rule.conditions)}
      </span>
    );
  }

  function resetForm() {
    setRuleName("");
    setKeywords("");
    setRuleOrder("10");
    setIsDefault(false);
    setSelectedDeptId("");
    setSelectedCatId("");
    setSelectedRoutingSubcatId("");
    setSelectedPriorityCatId("");
    setSelectedPrioritySubcatId("");
    setSelectedSupportingDepts([]);
    setRuleStatus("ACTIVE");
    setFeedback(null);
  }

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    if (!ruleName.trim()) return;

    try {
      setIsSubmitting(true);
      setFeedback(null);

      let endpoint = "";
      let payload: Record<string, unknown> = {};

      if (activeTab === "priority") {
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

        // Client-side Duplicate Checks
        if (ruleStatus === "ACTIVE") {
          // 1. Rule Name duplicate
          const nameConflict = priorityRules.find(
            (r) =>
              r.status === "ACTIVE" &&
              r.rule_name.trim().toLowerCase() ===
                ruleName.trim().toLowerCase(),
          );
          if (nameConflict) {
            setFeedback({
              type: "error",
              text: `A priority rule named "${ruleName.trim()}" already exists. Please choose a unique rule name.`,
            });
            setIsSubmitting(false);
            return;
          }

          // 2. Default Fallback duplicate
          if (isDefault) {
            const defaultConflict = priorityRules.find(
              (r) => r.status === "ACTIVE" && r.is_default,
            );
            if (defaultConflict) {
              setFeedback({
                type: "error",
                text: `A default fallback priority rule already exists ("${defaultConflict.rule_name}"). Please update or deactivate the existing default rule instead of creating a duplicate.`,
              });
              setIsSubmitting(false);
              return;
            }
          } else if (selectedPriorityCatId) {
            // 3. Taxonomy Scope duplicate
            const catName =
              prioCat?.category_name?.trim().toLowerCase() || null;
            const subcatName =
              prioSubcat?.subcategory_name?.trim().toLowerCase() || null;

            const scopeConflict = priorityRules.find((r) => {
              if (r.status !== "ACTIVE" || r.is_default) return false;
              const cond = r.conditions as Record<string, unknown> | null;
              if (!cond) return false;

              const rCatId = cond.category_id?.toString() || null;
              const rCatName =
                (cond.category as string)?.trim().toLowerCase() || null;
              const rSubcatId = cond.subcategory_id?.toString() || null;
              const rSubcatName =
                (
                  (cond.subcategory as string) ||
                  (cond.subcategory_name as string)
                )
                  ?.trim()
                  .toLowerCase() || null;

              // Subcategory duplicate
              if (
                (selectedPrioritySubcatId || subcatName) &&
                (rSubcatId || rSubcatName)
              ) {
                return (
                  (selectedPrioritySubcatId &&
                    rSubcatId &&
                    selectedPrioritySubcatId === rSubcatId) ||
                  (subcatName && rSubcatName && subcatName === rSubcatName)
                );
              }

              // Category-wide duplicate
              if (
                !selectedPrioritySubcatId &&
                !subcatName &&
                !rSubcatId &&
                !rSubcatName
              ) {
                return (
                  (selectedPriorityCatId &&
                    rCatId &&
                    selectedPriorityCatId === rCatId) ||
                  (catName && rCatName && catName === rCatName)
                );
              }

              return false;
            });

            if (scopeConflict) {
              const scopeDesc = prioSubcat
                ? `"${prioCat?.category_name} → ${prioSubcat.subcategory_name}"`
                : `"${prioCat?.category_name} (All Subcategories)"`;
              setFeedback({
                type: "error",
                text: `A priority rule already exists for ${scopeDesc}. Existing rule "${scopeConflict.rule_name}" assigns priority level ${scopeConflict.priority_level}. Please update or deactivate the existing rule instead of creating a duplicate.`,
              });
              setIsSubmitting(false);
              return;
            }
          }
        }

        endpoint = "/api/admin/rules/priority";
        payload = {
          rule_name: ruleName.trim(),
          priority_level: priorityLevel,
          rule_order: Number(ruleOrder),
          is_default: isDefault,
          status: ruleStatus,
          category_id: selectedPriorityCatId || undefined,
          subcategory_id: selectedPrioritySubcatId || undefined,
          conditions: isDefault
            ? { default: true }
            : {
                category_id: selectedPriorityCatId || undefined,
                category: prioCat?.category_name || undefined,
                subcategory_id: selectedPrioritySubcatId || undefined,
                subcategory: prioSubcat?.subcategory_name || undefined,
              },
        };
      } else if (activeTab === "routing") {
        if (!selectedCatId) {
          setFeedback({
            type: "error",
            text: "Category Scope is required. Every routing rule must belong to a Category.",
          });
          setIsSubmitting(false);
          return;
        }

        if (!selectedRoutingSubcatId) {
          setFeedback({
            type: "error",
            text: "Subcategory Scope is required. Every routing rule must target an exact Subcategory.",
          });
          setIsSubmitting(false);
          return;
        }

        if (!selectedDeptId) {
          setFeedback({
            type: "error",
            text: "Primary Target Department is required.",
          });
          setIsSubmitting(false);
          return;
        }

        endpoint = "/api/admin/rules/routing";
        payload = {
          rule_name: ruleName,
          department_id: selectedDeptId,
          category_id: selectedCatId,
          subcategory_id: selectedRoutingSubcatId || null,
          involvement_type: involvementType,
          supporting_departments: selectedSupportingDepts,
          rule_order: Number(ruleOrder),
          status: ruleStatus,
          conditions: keywords
            ? { contains: keywords.split(",").map((s) => s.trim()) }
            : {},
        };
      } else if (activeTab === "sla") {
        endpoint = "/api/admin/rules/sla";
        payload = {
          policy_name: ruleName,
          priority_level: priorityLevel,
          sla_type: "RESOLUTION",
          target_duration_minutes: Number(durationHours) * 60,
          warning_threshold_percent: Number(warningPercent),
          escalation_threshold_percent: Number(escalationPercent),
          target_role: "DEPARTMENT_HEAD",
          status: ruleStatus,
        };
      } else if (activeTab === "reopen") {
        endpoint = "/api/admin/rules/reopen";
        payload = {
          policy_name: ruleName,
          reopen_window_hours: reopenWindowHours
            ? Number(reopenWindowHours)
            : null,
          max_reopen_count: Number(maxReopens),
          max_manual_review_count: Number(maxReviews),
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
          text: data.message || "Failed to configure policy.",
        });
        setIsSubmitting(false);
        return;
      }

      setFeedback({
        type: "success",
        text: data.message || "Rule configured successfully.",
      });

      // Update state locally
      if (activeTab === "priority") {
        setPriorityRules((prev) => [
          ...prev,
          {
            priority_rule_id: data.rule.priority_rule_id,
            rule_name: data.rule.rule_name,
            priority_level: data.rule.priority_level,
            rule_order: data.rule.rule_order,
            is_default: data.rule.is_default,
            status: data.rule.status,
            conditions: payload.conditions,
          },
        ]);
      } else if (activeTab === "routing") {
        const assignedDept = departments.find(
          (d) => d.department_id === selectedDeptId,
        );
        const assignedCat = categories.find(
          (c) => c.category_id === selectedCatId,
        );
        const assignedSubcat = assignedCat?.subcategories?.find(
          (s) => s.subcategory_id === selectedRoutingSubcatId,
        );
        setRoutingRules((prev) => [
          ...prev,
          {
            routing_rule_id: data.rule.routing_rule_id,
            rule_name: data.rule.rule_name,
            category_name: assignedCat?.category_name || null,
            subcategory_name: assignedSubcat?.subcategory_name || null,
            department_name:
              assignedDept?.department_name || "Assigned Department",
            involvement_type: involvementType,
            supporting_departments: selectedSupportingDepts,
            rule_order: Number(ruleOrder),
            status: data.rule.status,
            conditions: payload.conditions,
          },
        ]);
      }

      setTimeout(() => {
        setIsModalOpen(false);
        resetForm();
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        text: "An unexpected error occurred while saving policy.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const tabTitles: Record<RuleTab, string> = {
    priority: "Priority Rule",
    routing: "Routing Rule",
    sla: "SLA Policy",
    reopen: "Reopen Policy",
  };

  return (
    <div
      id="master-configuration"
      className="rounded-2xl border border-slate-200/80 bg-white shadow-xs"
    >
      {/* Header & Tabs */}
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-50 p-1.5 text-blue-600">
                <Layers className="h-4 w-4" />
              </span>
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                Master Governance & Decision Policies
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Discrete administrative engines controlling automated triage,
              department routing, SLA clocks, and reopen rules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tab Buttons */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("priority")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  activeTab === "priority"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Priority ({priorityRules.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("routing")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  activeTab === "routing"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Workflow className="h-3.5 w-3.5" />
                <span>Routing ({routingRules.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("sla")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  activeTab === "sla"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>SLA ({slaPolicies.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("reopen")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                  activeTab === "reopen"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reopen ({reopenPolicies.length})</span>
              </button>
            </div>

            {/* Create Policy Button */}
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Configure {tabTitles[activeTab]}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="p-5 sm:p-6 space-y-4">
        {tableFeedback && (
          <div
            className={`flex items-center justify-between gap-2 rounded-xl p-3 text-xs font-medium ${
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
              <span>{tableFeedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setTableFeedback(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {/* ========================================================================= */}
        {/* 1. PRIORITY RULES TAB                                                     */}
        {/* ========================================================================= */}
        {activeTab === "priority" && (
          <div id="priority-rules" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Priority Calculation Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Evaluated in priority order upon grievance intake to assign
                  severity and SLA target.
                </p>
              </div>
              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                Rule Evaluation: Top-to-Bottom (First Match Wins)
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 pl-4 pr-2">Order</th>
                    <th className="px-3 py-3">Rule Name</th>
                    <th className="px-3 py-3">Assigned Level</th>
                    <th className="px-3 py-3">Conditions Expression</th>
                    <th className="px-3 py-3">Default Fallback</th>
                    <th className="py-3 pl-3 pr-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {priorityRules.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-slate-400"
                      >
                        No priority rules configured.
                      </td>
                    </tr>
                  ) : (
                    paginatedPriorityRules.map((rule) => (
                      <tr
                        key={rule.priority_rule_id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3.5 pl-4 pr-2 font-mono font-bold text-slate-500">
                          #{rule.rule_order}
                        </td>
                        <td className="px-3 py-3.5 font-bold text-slate-900">
                          {rule.rule_name}
                        </td>
                        <td className="px-3 py-3.5">
                          <PriorityBadge priority={rule.priority_level} />
                        </td>
                        <td className="px-3 py-3.5 text-xs text-slate-700">
                          {formatPriorityConditions(rule)}
                        </td>
                        <td className="px-3 py-3.5">
                          {rule.is_default ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              System Default
                            </span>
                          ) : (
                            <span className="text-slate-400">&mdash;</span>
                          )}
                        </td>
                        <td className="py-3.5 pl-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleStatus(
                                  "priority",
                                  rule.priority_rule_id,
                                  rule.status,
                                )
                              }
                              title={
                                rule.status === "ACTIVE"
                                  ? "Click to Deactivate rule"
                                  : "Click to Activate rule"
                              }
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition border shadow-2xs ${
                                rule.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  rule.status === "ACTIVE"
                                    ? "bg-emerald-500 animate-pulse"
                                    : "bg-slate-400"
                                }`}
                              />
                              <span>
                                {rule.status === "ACTIVE"
                                  ? "Active"
                                  : "Deactivated"}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteRule(
                                  "priority",
                                  rule.priority_rule_id,
                                )
                              }
                              title="Delete priority rule"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-500 shadow-2xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationFooter
              currentPage={priorityPage}
              totalItems={priorityRules.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPriorityPage}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. ROUTING RULES TAB                                                      */}
        {/* ========================================================================= */}
        {activeTab === "routing" && (
          <div id="routing-rules" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Automated Department Routing Engine
                </h3>
                <p className="text-xs text-slate-500">
                  Maps category taxonomies to operational divisions. Grievances
                  without a matching rule become Manual Routing Exceptions.
                </p>
              </div>
              <span className="rounded-md bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                Fallback: Admin Routing Exception
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 pl-4 pr-2">Order</th>
                    <th className="px-3 py-3">Rule Name</th>
                    <th className="px-3 py-3">Taxonomy Mapping</th>
                    <th className="px-3 py-3">Target Department</th>
                    <th className="px-3 py-3">Involvement Type</th>
                    <th className="py-3 pl-3 pr-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {routingRules.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-slate-400"
                      >
                        No routing rules configured.
                      </td>
                    </tr>
                  ) : (
                    paginatedRoutingRules.map((rule) => (
                      <tr
                        key={rule.routing_rule_id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3.5 pl-4 pr-2 font-mono font-bold text-slate-500">
                          #{rule.rule_order}
                        </td>
                        <td className="px-3 py-3.5 font-bold text-slate-900">
                          {rule.rule_name}
                        </td>
                        <td className="px-3 py-3.5 text-slate-700">
                          <span className="font-semibold text-slate-900">
                            {rule.category_name || "Any Category"}
                          </span>
                          {rule.subcategory_name && (
                            <span className="text-slate-400">
                              {" "}
                              &bull; {rule.subcategory_name}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800 w-fit">
                              <Building2 className="h-3 w-3 text-blue-600" />
                              {rule.department_name}
                            </span>
                            {rule.supporting_departments &&
                              rule.supporting_departments.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    Support:
                                  </span>
                                  {rule.supporting_departments.map((sd) => (
                                    <span
                                      key={sd}
                                      className="rounded bg-sky-50 px-1.5 py-0.2 text-[10px] font-medium text-sky-700 border border-sky-200/60"
                                    >
                                      {sd}
                                    </span>
                                  ))}
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {rule.involvement_type}
                          </span>
                        </td>
                        <td className="py-3.5 pl-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleStatus(
                                  "routing",
                                  rule.routing_rule_id,
                                  rule.status,
                                )
                              }
                              title={
                                rule.status === "ACTIVE"
                                  ? "Click to Deactivate rule"
                                  : "Click to Activate rule"
                              }
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition border shadow-2xs ${
                                rule.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  rule.status === "ACTIVE"
                                    ? "bg-emerald-500 animate-pulse"
                                    : "bg-slate-400"
                                }`}
                              />
                              <span>
                                {rule.status === "ACTIVE"
                                  ? "Active"
                                  : "Deactivated"}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteRule(
                                  "routing",
                                  rule.routing_rule_id,
                                )
                              }
                              title="Delete routing rule"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-500 shadow-2xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationFooter
              currentPage={routingPage}
              totalItems={routingRules.length}
              pageSize={PAGE_SIZE}
              onPageChange={setRoutingPage}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. SLA POLICIES TAB                                                       */}
        {/* ========================================================================= */}
        {activeTab === "sla" && (
          <div id="sla-policies" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Service Level Agreement (SLA) Thresholds
                </h3>
                <p className="text-xs text-slate-500">
                  Resolution and first-response timeframes by severity level,
                  triggering warnings and auto-escalations.
                </p>
              </div>
              <span className="rounded-md bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                Compliance Thresholds Enforced
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 pl-4 pr-3">Policy Name</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-3 py-3">SLA Type</th>
                    <th className="px-3 py-3">Target Duration</th>
                    <th className="px-3 py-3">Warning At</th>
                    <th className="px-3 py-3">Escalation Threshold</th>
                    <th className="px-3 py-3">Escalate To</th>
                    <th className="py-3 pl-3 pr-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {slaPolicies.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-slate-400"
                      >
                        No SLA policies configured.
                      </td>
                    </tr>
                  ) : (
                    paginatedSlaPolicies.map((policy) => (
                      <tr
                        key={policy.sla_policy_id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3.5 pl-4 pr-3 font-bold text-slate-900">
                          {policy.policy_name}
                        </td>
                        <td className="px-3 py-3.5">
                          {policy.priority_level ? (
                            <PriorityBadge priority={policy.priority_level} />
                          ) : (
                            <span className="text-slate-400">All Levels</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {policy.sla_type}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 font-bold text-slate-900">
                          {formatDuration(policy.target_duration_minutes)}
                        </td>
                        <td className="px-3 py-3.5 text-amber-700 font-semibold">
                          {policy.warning_threshold_percent}% elapsed
                        </td>
                        <td className="px-3 py-3.5 text-rose-700 font-bold">
                          {policy.escalation_threshold_percent}% elapsed
                        </td>
                        <td className="px-3 py-3.5 font-medium text-slate-700">
                          {policy.target_role.replace("_", " ")}
                        </td>
                        <td className="py-3.5 pl-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleStatus(
                                  "sla",
                                  policy.sla_policy_id,
                                  policy.status,
                                )
                              }
                              title={
                                policy.status === "ACTIVE"
                                  ? "Click to Deactivate policy"
                                  : "Click to Activate policy"
                              }
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition border shadow-2xs ${
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
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteRule("sla", policy.sla_policy_id)
                              }
                              title="Delete SLA policy"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-500 shadow-2xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationFooter
              currentPage={slaPage}
              totalItems={slaPolicies.length}
              pageSize={PAGE_SIZE}
              itemLabel="policies"
              onPageChange={setSlaPage}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. REOPEN POLICIES TAB                                                    */}
        {/* ========================================================================= */}
        {activeTab === "reopen" && (
          <div id="reopen-policies" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Resolution Reopen & Dissatisfaction Policies
                </h3>
                <p className="text-xs text-slate-500">
                  Defines allowable timeframes and attempt limits for end-users
                  to challenge resolved grievances.
                </p>
              </div>
              <span className="rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                Abuse Prevention & SLA Safeguards
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 pl-4 pr-3">Policy Name</th>
                    <th className="px-3 py-3">Reopen Window</th>
                    <th className="px-3 py-3">Max Allowed Reopens</th>
                    <th className="px-3 py-3">Max Manual Reviews</th>
                    <th className="py-3 pl-3 pr-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {reopenPolicies.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-slate-400"
                      >
                        No reopen policies configured.
                      </td>
                    </tr>
                  ) : (
                    paginatedReopenPolicies.map((policy) => (
                      <tr
                        key={policy.reopen_policy_id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="py-3.5 pl-4 pr-3 font-bold text-slate-900">
                          {policy.policy_name}
                        </td>
                        <td className="px-3 py-3.5 font-semibold text-slate-800">
                          {policy.reopen_window_hours
                            ? `${policy.reopen_window_hours} hours (${(
                                policy.reopen_window_hours / 24
                              ).toFixed(0)} days)`
                            : "Unlimited"}
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
                            {policy.max_reopen_count} Reopens
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-slate-600">
                          {policy.max_manual_review_count} Reviews
                        </td>
                        <td className="py-3.5 pl-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
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
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition border shadow-2xs ${
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
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteRule(
                                  "reopen",
                                  policy.reopen_policy_id,
                                )
                              }
                              title="Delete reopen policy"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-500 shadow-2xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationFooter
              currentPage={reopenPage}
              totalItems={reopenPolicies.length}
              pageSize={PAGE_SIZE}
              itemLabel="policies"
              onPageChange={setReopenPage}
            />
          </div>
        )}
      </div>

      {/* Interactive Policy Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Configure New {tabTitles[activeTab]}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {activeTab === "priority"
                    ? "Define rules and conditions that determine grievance priority."
                    : activeTab === "routing"
                      ? "Define automated primary and supporting department routing for grievances."
                      : activeTab === "sla"
                        ? "Define resolution deadlines and warning/escalation thresholds."
                        : "Define allowable windows and review limits for reopened grievances."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateRule}
              className="mt-5 space-y-4 text-xs"
            >
              <div>
                <label
                  htmlFor="rule-name-input"
                  className="block font-semibold text-slate-700"
                >
                  Policy / Rule Name *
                </label>
                <input
                  id="rule-name-input"
                  type="text"
                  placeholder={
                    activeTab === "priority"
                      ? "e.g. Workplace Safety - Critical"
                      : activeTab === "routing"
                        ? "e.g. Facilities Auto-Router, Compensation to Finance"
                        : "e.g. Standard Resolution Policy"
                  }
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  required
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                />
              </div>

              {/* Priority Form Fields */}
              {activeTab === "priority" && (
                <>
                  <div className="grid grid-cols-2 gap-3.5 items-start">
                    <div>
                      <label
                        htmlFor="priority-level-select"
                        className="block font-semibold text-slate-700"
                      >
                        Priority Level *
                      </label>
                      <select
                        id="priority-level-select"
                        value={priorityLevel}
                        onChange={(e) => setPriorityLevel(e.target.value)}
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600"
                      >
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Urgency & SLA escalation target.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="priority-order-input"
                        className="block font-semibold text-slate-700"
                      >
                        Evaluation Order *
                      </label>
                      <input
                        id="priority-order-input"
                        type="number"
                        min="1"
                        value={ruleOrder}
                        onChange={(e) => setRuleOrder(e.target.value)}
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600"
                      />
                      <p className="mt-1 text-[11px] text-slate-500">
                        Lower numbers are evaluated first.
                      </p>
                    </div>
                  </div>

                  {/* Taxonomy Condition: Category & Subcategory */}
                  {!isDefault && (
                    <div className="grid grid-cols-2 gap-3.5 items-start">
                      <div>
                        <label
                          htmlFor="priority-category-select"
                          className="block font-semibold text-slate-700"
                        >
                          Category *
                        </label>
                        <select
                          id="priority-category-select"
                          value={selectedPriorityCatId}
                          required={!isDefault}
                          onChange={(e) => {
                            const catId = e.target.value;
                            setSelectedPriorityCatId(catId);
                            setSelectedPrioritySubcatId("");
                            const cat = categories.find(
                              (c) => c.category_id === catId,
                            );
                            if (cat) {
                              setRuleName(`${cat.category_name} Priority`);
                            }
                          }}
                          className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600"
                        >
                          <option value="">
                            -- Select Category * (Required) --
                          </option>
                          {categories.map((c) => (
                            <option key={c.category_id} value={c.category_id}>
                              {c.category_name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Required primary category scope.
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="priority-subcategory-select"
                          className="block font-semibold text-slate-700"
                        >
                          Subcategory (Optional)
                        </label>
                        <select
                          id="priority-subcategory-select"
                          value={selectedPrioritySubcatId}
                          disabled={!selectedPriorityCatId}
                          onChange={(e) => {
                            const subId = e.target.value;
                            setSelectedPrioritySubcatId(subId);
                            const cat = categories.find(
                              (c) => c.category_id === selectedPriorityCatId,
                            );
                            const sub = cat?.subcategories?.find(
                              (s) => s.subcategory_id === subId,
                            );
                            if (cat && sub) {
                              setRuleName(
                                `${cat.category_name} - ${sub.subcategory_name}`,
                              );
                            } else if (cat) {
                              setRuleName(`${cat.category_name} Priority`);
                            }
                          }}
                          className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600 disabled:opacity-50"
                        >
                          <option value="">
                            All Subcategories (Category Rule)
                          </option>
                          {categories
                            .find(
                              (c) => c.category_id === selectedPriorityCatId,
                            )
                            ?.subcategories?.map((s) => (
                              <option
                                key={s.subcategory_id}
                                value={s.subcategory_id}
                              >
                                {s.subcategory_name}
                              </option>
                            ))}
                        </select>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Applies to all subcategories if not selected.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 transition hover:bg-slate-50">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isDefault}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsDefault(checked);
                          if (checked) {
                            setRuleName("Default Medium Priority Fallback");
                            setPriorityLevel("MEDIUM");
                          }
                        }}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-xs font-semibold text-slate-800">
                          Set as Default Fallback Priority Rule
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Evaluated when no other priority rules match the
                          grievance intake.
                        </p>
                      </div>
                    </label>
                  </div>
                </>
              )}

              {/* Routing Form Fields */}
              {activeTab === "routing" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="target-dept-select"
                        className="block font-semibold text-slate-700"
                      >
                        Primary Target Department *
                      </label>
                      <select
                        id="target-dept-select"
                        value={selectedDeptId}
                        onChange={(e) => {
                          const newDeptId = e.target.value;
                          setSelectedDeptId(newDeptId);
                          const dept = departments.find(
                            (d) => d.department_id === newDeptId,
                          );
                          if (dept) {
                            setSelectedSupportingDepts((prev) =>
                              prev.filter(
                                (name) => name !== dept.department_name,
                              ),
                            );
                          }
                        }}
                        required
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600"
                      >
                        <option value="">-- Select Department * --</option>
                        {departments.map((d) => (
                          <option key={d.department_id} value={d.department_id}>
                            {d.department_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="involvement-type-select"
                        className="block font-semibold text-slate-700"
                      >
                        Involvement Type *
                      </label>
                      <select
                        id="involvement-type-select"
                        value={involvementType}
                        onChange={(e) => setInvolvementType(e.target.value)}
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600"
                      >
                        <option value="PRIMARY">
                          PRIMARY (Lead Redressal)
                        </option>
                        <option value="SUPPORTING">SUPPORTING</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <span className="block font-semibold text-slate-700">
                      Supporting Department(s) (Optional Cross-Functional
                      Collaboration)
                    </span>
                    <p className="text-[11px] text-slate-500 mb-1.5">
                      Select any supporting department(s) that assist the
                      primary lead department on resolution.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {departments
                        .filter((d) => d.department_id !== selectedDeptId)
                        .map((d) => {
                          const isChecked = selectedSupportingDepts.includes(
                            d.department_name,
                          );
                          return (
                            <button
                              key={d.department_id}
                              type="button"
                              onClick={() => {
                                setSelectedSupportingDepts((prev) =>
                                  isChecked
                                    ? prev.filter(
                                        (name) => name !== d.department_name,
                                      )
                                    : [...prev, d.department_name],
                                );
                              }}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition border ${
                                isChecked
                                  ? "bg-sky-50 border-sky-300 text-sky-700 font-semibold"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isChecked ? "bg-sky-500" : "bg-slate-300"
                                }`}
                              />
                              {d.department_name}
                            </button>
                          );
                        })}
                      {departments.filter(
                        (d) => d.department_id !== selectedDeptId,
                      ).length === 0 && (
                        <span className="text-xs text-slate-400 italic">
                          Select a primary department above first.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="category-scope-select"
                        className="block font-semibold text-slate-700"
                      >
                        Category Scope *
                      </label>
                      <select
                        id="category-scope-select"
                        value={selectedCatId}
                        required
                        onChange={(e) => {
                          const catId = e.target.value;
                          setSelectedCatId(catId);
                          setSelectedRoutingSubcatId("");
                          const cat = categories.find(
                            (c) => c.category_id === catId,
                          );
                          if (cat) {
                            setRuleName(`${cat.category_name} Routing`);
                          }
                        }}
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600"
                      >
                        <option value="">
                          -- Select Category * (Required) --
                        </option>
                        {categories.map((c) => (
                          <option key={c.category_id} value={c.category_id}>
                            {c.category_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="routing-subcategory-select"
                        className="block font-semibold text-slate-700"
                      >
                        Subcategory Scope *
                      </label>
                      <select
                        id="routing-subcategory-select"
                        value={selectedRoutingSubcatId}
                        disabled={!selectedCatId}
                        required
                        onChange={(e) => {
                          const subId = e.target.value;
                          setSelectedRoutingSubcatId(subId);
                          const cat = categories.find(
                            (c) => c.category_id === selectedCatId,
                          );
                          const sub = cat?.subcategories?.find(
                            (s) => s.subcategory_id === subId,
                          );
                          if (cat && sub) {
                            setRuleName(
                              `${cat.category_name} - ${sub.subcategory_name} Routing`,
                            );
                          }
                        }}
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600 disabled:opacity-50"
                      >
                        <option value="">
                          {selectedCatId
                            ? "-- Select Subcategory * (Required) --"
                            : "-- Select a Category first --"}
                        </option>
                        {categories
                          .find((c) => c.category_id === selectedCatId)
                          ?.subcategories?.map((s) => (
                            <option
                              key={s.subcategory_id}
                              value={s.subcategory_id}
                            >
                              {s.subcategory_name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="routing-rule-order-input"
                      className="block font-semibold text-slate-700"
                    >
                      Rule Order (1 - 100,000)
                    </label>
                    <input
                      id="routing-rule-order-input"
                      type="number"
                      min="1"
                      max="100000"
                      value={ruleOrder}
                      onChange={(e) => setRuleOrder(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600"
                    />
                  </div>
                </>
              )}

              {/* SLA Form Fields */}
              {activeTab === "sla" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="sla-priority-scope-select"
                        className="block font-semibold text-slate-700"
                      >
                        Priority Scope
                      </label>
                      <select
                        id="sla-priority-scope-select"
                        value={priorityLevel}
                        onChange={(e) => setPriorityLevel(e.target.value)}
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600"
                      >
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="sla-duration-hours-input"
                        className="block font-semibold text-slate-700"
                      >
                        Target Duration (Hours) *
                      </label>
                      <input
                        id="sla-duration-hours-input"
                        type="number"
                        min="1"
                        value={durationHours}
                        onChange={(e) => setDurationHours(e.target.value)}
                        required
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="sla-warning-percent-input"
                        className="block font-semibold text-slate-700"
                      >
                        Warning Threshold (%)
                      </label>
                      <input
                        id="sla-warning-percent-input"
                        type="number"
                        min="10"
                        max="99"
                        value={warningPercent}
                        onChange={(e) => setWarningPercent(e.target.value)}
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="sla-escalation-percent-input"
                        className="block font-semibold text-slate-700"
                      >
                        Escalation Threshold (%)
                      </label>
                      <input
                        id="sla-escalation-percent-input"
                        type="number"
                        min="50"
                        max="150"
                        value={escalationPercent}
                        onChange={(e) => setEscalationPercent(e.target.value)}
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-blue-600"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Reopen Form Fields */}
              {activeTab === "reopen" && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                      <div className="flex-1">
                        <label
                          htmlFor="reopen-window-hours-input"
                          className="block font-semibold text-slate-800"
                        >
                          Reopen Window (Hours)
                        </label>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Time allowed after resolution for the end user to
                          challenge the outcome.
                        </p>
                      </div>
                      <div className="w-full sm:w-28">
                        <input
                          id="reopen-window-hours-input"
                          type="number"
                          min="1"
                          value={reopenWindowHours}
                          onChange={(e) => setReopenWindowHours(e.target.value)}
                          className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                      <div className="flex-1">
                        <label
                          htmlFor="max-reopens-input"
                          className="block font-semibold text-slate-800"
                        >
                          Max End User Reopens
                        </label>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Maximum number of times an end user can reject the
                          resolution and reopen the grievance.
                        </p>
                      </div>
                      <div className="w-full sm:w-28">
                        <input
                          id="max-reopens-input"
                          type="number"
                          min="1"
                          max="10"
                          value={maxReopens}
                          onChange={(e) => setMaxReopens(e.target.value)}
                          className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                      <div className="flex-1">
                        <label
                          htmlFor="max-reviews-input"
                          className="block font-semibold text-slate-800"
                        >
                          Max Manual Reviews
                        </label>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Maximum number of Department Head reviews allowed
                          after the maximum end user reopen limit is reached.
                        </p>
                      </div>
                      <div className="w-full sm:w-28">
                        <input
                          id="max-reviews-input"
                          type="number"
                          min="1"
                          max="10"
                          value={maxReviews}
                          onChange={(e) => setMaxReviews(e.target.value)}
                          className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Initial Status Selector */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <span className="block font-semibold text-slate-700 text-xs">
                  Initial Status
                </span>
                <div className="mt-2 flex items-center gap-5">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="rule-initial-status"
                      checked={ruleStatus === "ACTIVE"}
                      onChange={() => setRuleStatus("ACTIVE")}
                      className="accent-blue-600"
                    />
                    <span className="font-semibold text-emerald-700">
                      Active (Enabled)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="rule-initial-status"
                      checked={ruleStatus === "INACTIVE"}
                      onChange={() => setRuleStatus("INACTIVE")}
                      className="accent-blue-600"
                    />
                    <span className="font-semibold text-slate-500">
                      Deactivated (Disabled)
                    </span>
                  </label>
                </div>
              </div>

              {feedback && (
                <div
                  className={`flex items-center gap-2 rounded-lg p-2.5 text-xs font-medium ${
                    feedback.type === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !ruleName.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Policy...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create Policy</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
