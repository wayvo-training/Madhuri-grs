import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { SlaNotificationRecipients } from "@/hooks/admin/master-rules/useRuleActions";
import type { DepartmentDependencyNode } from "@/lib/validations/dependency-graph";
import type { ModalRuleType } from "@/types/admin/master-rules";

export const SLA_RECIPIENT_OPTIONS = [
  {
    id: "ASSIGNED_STAFF",
    label: "Assigned Staff",
    description: "Direct handling officer assigned to work on the grievance",
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
    label: "System Admin",
    description: "Master system administrators and central grievance cell",
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
  ruleOrder: string;
  setRuleOrder: Dispatch<SetStateAction<string>>;
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
  criticalPercent?: string;
  setCriticalPercent?: Dispatch<SetStateAction<string>>;
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
  criticalPercent?: string;
  setCriticalPercent?: Dispatch<SetStateAction<string>>;
  escalationPercent: string;
  setEscalationPercent: Dispatch<SetStateAction<string>>;
  reopenWindowHours: string;
  setReopenWindowHours: Dispatch<SetStateAction<string>>;
  maxReopens: string;
  setMaxReopens: Dispatch<SetStateAction<string>>;
  maxReviews: string;
  setMaxReviews: Dispatch<SetStateAction<string>>;

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
