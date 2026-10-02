import { useMemo, useState } from "react";
import type {
  SerializedPriorityRule,
  SerializedReopenPolicy,
  SerializedRoutingRule,
  SerializedSlaPolicy,
} from "@/types/admin/master-rules";

export interface UseAdminRulesParams {
  initialPriorityRules: SerializedPriorityRule[];
  initialRoutingRules: SerializedRoutingRule[];
  initialSlaPolicies: SerializedSlaPolicy[];
  initialReopenPolicies: SerializedReopenPolicy[];
}

export function useAdminRules({
  initialPriorityRules,
  initialRoutingRules,
  initialSlaPolicies,
  initialReopenPolicies,
}: UseAdminRulesParams) {
  const [priorityRules, setPriorityRules] =
    useState<SerializedPriorityRule[]>(initialPriorityRules);
  const [routingRules, setRoutingRules] =
    useState<SerializedRoutingRule[]>(initialRoutingRules);
  const [slaPolicies, setSlaPolicies] =
    useState<SerializedSlaPolicy[]>(initialSlaPolicies);
  const [reopenPolicies, setReopenPolicies] = useState<
    SerializedReopenPolicy[]
  >(initialReopenPolicies);

  // Active Priority Rules (sorted by rule_order asc)
  const activePriorityRules = useMemo(() => {
    return [...priorityRules]
      .filter((r) => r.status === "ACTIVE")
      .sort((a, b) => a.rule_order - b.rule_order);
  }, [priorityRules]);

  // Default Priority Rule Fallback
  const defaultPriorityRule = useMemo(() => {
    return (
      priorityRules.find((r) => r.is_default && r.status === "ACTIVE") ||
      priorityRules.find((r) => r.is_default) ||
      null
    );
  }, [priorityRules]);

  return {
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
  };
}
