import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { SlaNotificationRecipients } from "@/hooks/admin/master-rules/useRuleActions";
import type { DepartmentDependencyNode } from "@/lib/validations/dependency-graph";
import type { ModalRuleType } from "@/types/admin/master-rules";

export function isPurelyNumeric(val: string): boolean {
  const trimmed = val.trim();
  return trimmed.length > 0 && !/[a-zA-Z]/.test(trimmed);
}

export function isInvalidCustomName(val: string): boolean {
  const trimmed = val.trim();
  if (trimmed.length === 0) return false;
  return trimmed.length < 10 || !/[a-zA-Z]/.test(trimmed);
}

export function getCustomNameValidationError(
  val: string,
  label: "Category name" | "Subcategory name" | string,
): string | null {
  const trimmed = val.trim();
  if (trimmed.length === 0) return null;
  if (!/[a-zA-Z]/.test(trimmed)) {
    return `${label} cannot consist of only numbers or symbols. It must include letters or letters and numbers.`;
  }
  if (trimmed.length < 10) {
    return `${label} must be at least 10 characters long (currently ${trimmed.length} characters).`;
  }
  return null;
}

export const SLA_RECIPIENT_OPTIONS = [
  {
    id: "ASSIGNED_STAFF",
    label: "Grievance Staff",
    description: "Direct handling staff assigned to work on the grievance",
  },
  {
    id: "PRIMARY_DEPT_HEAD",
    label: "Primary Dept Head",
    description: "Head of the primary responsible department",
  },
  {
    id: "SUPPORTING_DEPT_HEAD",
    label: "Supportive Dept Head",
    description: "Heads of participating supportive departments",
  },
  {
    id: "ALL_DEPT_HEADS",
    label: "All Dept Heads",
    description: "All departmental heads across the organization",
  },
  {
    id: "ADMIN",
    label: "Grievance Admin",
    description: "Central grievance administrators and oversight cell",
  },
] as const;

export interface RuleDepartmentOption {
  department_id: string;
  department_name: string;
}

export interface RuleSubcategoryOption {
  subcategory_id: string;
  subcategory_name: string;
}

export interface RuleCategoryOption {
  category_id: string;
  category_name: string;
  subcategories?: RuleSubcategoryOption[];
}

export interface ParticipatingDepartmentRow {
  rowId: string;
  department_id: string;
  department_name: string;
  involvement_type: "PRIMARY" | "SUPPORT";
  prerequisites: string[];
  sla_percent_allocation?: number | null;
  allocated_duration_minutes?: number | null;
}

export interface RoutingRuleModalProps {
  open: boolean;
  onClose: () => void;
  editingRuleId?: string | null;
  ruleStatus?: "ACTIVE" | "INACTIVE";
  setRuleStatus?: (val: "ACTIVE" | "INACTIVE") => void;
  ruleName: string;
  setRuleName: Dispatch<SetStateAction<string>>;
  selectedDeptId: string;
  setSelectedDeptId: Dispatch<SetStateAction<string>>;
  selectedCatId: string;
  setSelectedCatId: Dispatch<SetStateAction<string>>;
  selectedRoutingSubcatId: string;
  setSelectedRoutingSubcatId: Dispatch<SetStateAction<string>>;
  selectedSupportingDepts: string[];
  setSelectedSupportingDepts: Dispatch<SetStateAction<string[]>>;
  dependencyType?: "PARALLEL" | "SEQUENTIAL";
  setDependencyType?: Dispatch<SetStateAction<"PARALLEL" | "SEQUENTIAL">>;
  sequentialDependencies?: DepartmentDependencyNode[];
  setSequentialDependencies?: Dispatch<
    SetStateAction<DepartmentDependencyNode[]>
  >;
  departments: RuleDepartmentOption[];
  categories: RuleCategoryOption[];
  newCategoryName: string;
  setNewCategoryName: Dispatch<SetStateAction<string>>;
  newSubcategoryName: string;
  setNewSubcategoryName: Dispatch<SetStateAction<string>>;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent) => void;
}

export interface PriorityRuleModalProps {
  open: boolean;
  onClose: () => void;
  editingRuleId?: string | null;
  ruleStatus?: "ACTIVE" | "INACTIVE";
  setRuleStatus?: (val: "ACTIVE" | "INACTIVE") => void;
  ruleName: string;
  setRuleName: Dispatch<SetStateAction<string>>;
  priorityLevel: string;
  setPriorityLevel: Dispatch<SetStateAction<string>>;
  ruleOrder?: string;
  setRuleOrder?: Dispatch<SetStateAction<string>>;
  isDefault: boolean;
  setIsDefault: Dispatch<SetStateAction<boolean>>;
  selectedPriorityCatId: string;
  setSelectedPriorityCatId: Dispatch<SetStateAction<string>>;
  selectedPrioritySubcatId: string;
  setSelectedPrioritySubcatId: Dispatch<SetStateAction<string>>;
  keywords?: string;
  setKeywords?: Dispatch<SetStateAction<string>>;
  categories: RuleCategoryOption[];
  newCategoryName: string;
  setNewCategoryName: Dispatch<SetStateAction<string>>;
  newSubcategoryName: string;
  setNewSubcategoryName: Dispatch<SetStateAction<string>>;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent) => void;
}

export interface SlaPolicyModalProps {
  open: boolean;
  onClose: () => void;
  editingRuleId?: string | null;
  ruleStatus?: "ACTIVE" | "INACTIVE";
  setRuleStatus?: (val: "ACTIVE" | "INACTIVE") => void;
  ruleName: string;
  setRuleName: Dispatch<SetStateAction<string>>;
  priorityLevel: string;
  setPriorityLevel: Dispatch<SetStateAction<string>>;
  durationHours: string;
  setDurationHours: Dispatch<SetStateAction<string>>;
  warningPercent: string;
  setWarningPercent: Dispatch<SetStateAction<string>>;
  atRiskPercent?: string;
  setAtRiskPercent?: Dispatch<SetStateAction<string>>;
  escalationPercent: string;
  setEscalationPercent: Dispatch<SetStateAction<string>>;
  slaRecipients?: SlaNotificationRecipients;
  setSlaRecipients?: Dispatch<SetStateAction<SlaNotificationRecipients>>;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent) => void;
}

export interface ReopenPolicyModalProps {
  open: boolean;
  onClose: () => void;
  editingRuleId?: string | null;
  ruleStatus?: "ACTIVE" | "INACTIVE";
  setRuleStatus?: (val: "ACTIVE" | "INACTIVE") => void;
  ruleName: string;
  setRuleName: Dispatch<SetStateAction<string>>;
  selectedPriorityCatId: string;
  setSelectedPriorityCatId: Dispatch<SetStateAction<string>>;
  selectedPrioritySubcatId: string;
  setSelectedPrioritySubcatId: Dispatch<SetStateAction<string>>;
  reopenWindowHours: string;
  setReopenWindowHours: Dispatch<SetStateAction<string>>;
  maxReopens: string;
  setMaxReopens: Dispatch<SetStateAction<string>>;
  maxReviews: string;
  setMaxReviews: Dispatch<SetStateAction<string>>;
  resolutionInactivityDays?: string;
  setResolutionInactivityDays?: Dispatch<SetStateAction<string>>;
  additionalInfoInactivityDays?: string;
  setAdditionalInfoInactivityDays?: Dispatch<SetStateAction<string>>;
  maxRejections?: string;
  setMaxRejections?: Dispatch<SetStateAction<string>>;
  categories: RuleCategoryOption[];
  newCategoryName: string;
  setNewCategoryName: Dispatch<SetStateAction<string>>;
  newSubcategoryName: string;
  setNewSubcategoryName: Dispatch<SetStateAction<string>>;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent) => void;
}

export interface AdminRuleConfigModalProps {
  open: boolean;
  onClose: () => void;
  editingRuleId?: string | null;
  ruleStatus?: "ACTIVE" | "INACTIVE";
  setRuleStatus?: (val: "ACTIVE" | "INACTIVE") => void;
  modalRuleType: ModalRuleType;
  setModalRuleType?: (value: ModalRuleType) => void;
  ruleName: string;
  setRuleName: Dispatch<SetStateAction<string>>;
  priorityLevel: string;
  setPriorityLevel: Dispatch<SetStateAction<string>>;
  ruleOrder: string;
  setRuleOrder: Dispatch<SetStateAction<string>>;
  isDefault: boolean;
  setIsDefault: Dispatch<SetStateAction<boolean>>;
  selectedDeptId: string;
  setSelectedDeptId: Dispatch<SetStateAction<string>>;
  selectedCatId: string;
  setSelectedCatId: Dispatch<SetStateAction<string>>;
  selectedRoutingSubcatId: string;
  setSelectedRoutingSubcatId: Dispatch<SetStateAction<string>>;
  involvementType?: string;
  setInvolvementType?: Dispatch<SetStateAction<string>>;
  selectedSupportingDepts: string[];
  setSelectedSupportingDepts: Dispatch<SetStateAction<string[]>>;
  dependencyType?: "PARALLEL" | "SEQUENTIAL";
  setDependencyType?: Dispatch<SetStateAction<"PARALLEL" | "SEQUENTIAL">>;
  sequentialDependencies?: DepartmentDependencyNode[];
  setSequentialDependencies?: Dispatch<
    SetStateAction<DepartmentDependencyNode[]>
  >;
  departmentalAllocationMode?: "FULL" | "EQUAL_SPLIT" | "LEAD_WEIGHTED";
  setDepartmentalAllocationMode?: Dispatch<
    SetStateAction<"FULL" | "EQUAL_SPLIT" | "LEAD_WEIGHTED">
  >;
  selectedPriorityCatId: string;
  setSelectedPriorityCatId: Dispatch<SetStateAction<string>>;
  selectedPrioritySubcatId: string;
  setSelectedPrioritySubcatId: Dispatch<SetStateAction<string>>;
  keywords?: string;
  setKeywords?: Dispatch<SetStateAction<string>>;
  durationHours: string;
  setDurationHours: Dispatch<SetStateAction<string>>;
  warningPercent: string;
  setWarningPercent: Dispatch<SetStateAction<string>>;
  atRiskPercent?: string;
  setAtRiskPercent?: Dispatch<SetStateAction<string>>;
  escalationPercent: string;
  setEscalationPercent: Dispatch<SetStateAction<string>>;
  reopenWindowHours: string;
  setReopenWindowHours: Dispatch<SetStateAction<string>>;
  maxReopens: string;
  setMaxReopens: Dispatch<SetStateAction<string>>;
  maxReviews: string;
  setMaxReviews: Dispatch<SetStateAction<string>>;
  resolutionInactivityDays?: string;
  setResolutionInactivityDays?: Dispatch<SetStateAction<string>>;
  additionalInfoInactivityDays?: string;
  setAdditionalInfoInactivityDays?: Dispatch<SetStateAction<string>>;
  maxRejections?: string;
  setMaxRejections?: Dispatch<SetStateAction<string>>;

  newCategoryName: string;
  setNewCategoryName: Dispatch<SetStateAction<string>>;
  newSubcategoryName: string;
  setNewSubcategoryName: Dispatch<SetStateAction<string>>;

  isSubmitting: boolean;
  slaRecipients?: SlaNotificationRecipients;
  setSlaRecipients?: Dispatch<SetStateAction<SlaNotificationRecipients>>;

  departments: RuleDepartmentOption[];
  categories: RuleCategoryOption[];
  onSubmit: (event: FormEvent) => void;
}
