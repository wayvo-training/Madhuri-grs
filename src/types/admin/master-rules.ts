export type ModalRuleType = "routing" | "priority" | "sla" | "reopen";
export type MainTab = "matrix" | "global";

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

export interface DepartmentOption {
  department_id: string;
  department_name: string;
}

export interface CategoryOption {
  category_id: string;
  category_name: string;
  subcategories?: { subcategory_id: string; subcategory_name: string }[];
}

export interface RuleFeedback {
  type: "success" | "error";
  text: string;
}

export interface MatrixRow {
  subcategoryName: string;
  categoryName: string;
  departmentName: string;
  effectivePriority: string;
  matchedPriorityRule: SerializedPriorityRule | null;
  primaryRouteDept: string;
  supportingDepts: string[];
  effectiveSlaDuration: string;
  matchedSlaPolicy: SerializedSlaPolicy | null;
  routingRules: SerializedRoutingRule[];
  status: "ACTIVE" | "INACTIVE";
}

export interface MatrixCategoryNode {
  categoryName: string;
  count: number;
  subcategories: MatrixRow[];
}

export interface MatrixDepartmentNode {
  departmentName: string;
  count: number;
  categories: MatrixCategoryNode[];
}

export interface AdminMasterRulesProps {
  priorityRules: SerializedPriorityRule[];
  routingRules: SerializedRoutingRule[];
  slaPolicies: SerializedSlaPolicy[];
  reopenPolicies: SerializedReopenPolicy[];
  departments?: DepartmentOption[];
  categories?: SerializedCategory[];
}
