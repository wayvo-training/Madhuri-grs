"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building,
  Building2,
  Check,
  CheckCircle2,
  Cpu,
  DollarSign,
  Eye,
  GitMerge,
  GripVertical,
  Laptop,
  Loader2,
  Plus,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  Truck,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface AdminRuleConfigModalProps {
  open: boolean;
  onClose: () => void;
  editingRuleId?: string | null;
  ruleStatus?: "ACTIVE" | "INACTIVE";
  setRuleStatus?: (val: "ACTIVE" | "INACTIVE") => void;
  modalRuleType: ModalRuleType;
  setModalRuleType: (value: ModalRuleType) => void;
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

export interface ParticipatingDepartmentRow {
  rowId: string;
  department_id: string;
  department_name: string;
  involvement_type: "PRIMARY" | "SUPPORT";
  prerequisites: string[];
  sla_percent_allocation?: number | null;
  allocated_duration_minutes?: number | null;
}

export function AdminRuleConfigModal({
  open,
  onClose,
  editingRuleId,
  ruleStatus,
  setRuleStatus,
  modalRuleType,
  setModalRuleType,
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
  involvementType: _involvementType = "PRIMARY",
  setInvolvementType: _setInvolvementType,
  selectedSupportingDepts,
  setSelectedSupportingDepts,
  dependencyType = "PARALLEL",
  setDependencyType,
  sequentialDependencies = [],
  setSequentialDependencies,
  departmentalAllocationMode: _departmentalAllocationMode = "FULL",
  setDepartmentalAllocationMode: _setDepartmentalAllocationMode,
  selectedPriorityCatId,
  setSelectedPriorityCatId,
  selectedPrioritySubcatId,
  setSelectedPrioritySubcatId,
  keywords = "",
  setKeywords,
  durationHours,
  setDurationHours,
  warningPercent,
  setWarningPercent,
  atRiskPercent = "75",
  setAtRiskPercent,
  criticalPercent = "90",
  setCriticalPercent,
  escalationPercent,
  setEscalationPercent,
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

  isSubmitting,
  slaRecipients,
  setSlaRecipients,

  departments,
  categories,
  onSubmit,
}: AdminRuleConfigModalProps) {
  const [routingScope, setRoutingScope] = useState<"SINGLE" | "MULTI">(
    "SINGLE",
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [participatingRows, setParticipatingRows] = useState<
    ParticipatingDepartmentRow[]
  >([]);
  const [activeSlaTier, setActiveSlaTier] = useState<
    "warning" | "at_risk" | "critical" | "escalation"
  >("warning");
  const [deptSearchQuery, setDeptSearchQuery] = useState("");
  const [showDeptSidebar, setShowDeptSidebar] = useState(true);
  const lastInitKey = useRef<string>("");

  const filteredDepartments = useMemo(() => {
    if (!deptSearchQuery.trim()) return departments;
    const q = deptSearchQuery.toLowerCase();
    return departments.filter((d) =>
      d.department_name.toLowerCase().includes(q),
    );
  }, [departments, deptSearchQuery]);

  useEffect(() => {
    if (!open || modalRuleType !== "routing") {
      lastInitKey.current = "";
      return;
    }
    const currentKey = `${editingRuleId ?? "new"}-${open}`;
    if (lastInitKey.current === currentKey) {
      return;
    }
    lastInitKey.current = currentKey;

    const isMulti =
      (selectedSupportingDepts && selectedSupportingDepts.length > 0) ||
      (sequentialDependencies && sequentialDependencies.length > 1);

    setRoutingScope(isMulti ? "MULTI" : "SINGLE");

    let initialLeadDeptId = selectedDeptId;
    if (!isMulti && !initialLeadDeptId && departments.length > 0) {
      initialLeadDeptId = departments[0].department_id;
      setSelectedDeptId(initialLeadDeptId);
    }

    const rows: ParticipatingDepartmentRow[] = [];
    const leadDept = departments.find(
      (d) => d.department_id === initialLeadDeptId,
    );
    const leadDepNode = leadDept
      ? sequentialDependencies?.find(
          (s) => s.department_name === leadDept.department_name,
        )
      : undefined;

    // 1. Only populate if initialLeadDeptId exists or there are supporting departments (e.g. Editing rule or openConfigureRow)
    if (
      initialLeadDeptId ||
      (selectedSupportingDepts && selectedSupportingDepts.length > 0)
    ) {
      rows.push({
        rowId: `row-primary-${Date.now()}`,
        department_id: initialLeadDeptId || "",
        department_name: leadDept?.department_name || "",
        involvement_type: "PRIMARY",
        prerequisites: leadDepNode?.prerequisites || [],
        sla_percent_allocation:
          leadDepNode?.sla_percent_allocation ??
          (selectedSupportingDepts.length === 0 ? 100 : null),
        allocated_duration_minutes:
          leadDepNode?.allocated_duration_minutes ?? null,
      });

      // 2. Supporting departments (only for multi)
      if (isMulti) {
        selectedSupportingDepts.forEach((suppName, idx) => {
          const suppDept = departments.find(
            (d) => d.department_name === suppName,
          );
          const depNode = sequentialDependencies?.find(
            (s) => s.department_name === suppName,
          );
          rows.push({
            rowId: `row-supp-${idx}-${suppName}`,
            department_id: suppDept?.department_id || "",
            department_name: suppName,
            involvement_type: "SUPPORT",
            prerequisites: depNode?.prerequisites || [],
            sla_percent_allocation: depNode?.sla_percent_allocation,
            allocated_duration_minutes:
              depNode?.allocated_duration_minutes ?? null,
          });
        });

        // 3. Extra nodes in sequentialDependencies if any
        sequentialDependencies?.forEach((depNode, idx) => {
          const already = rows.some(
            (r) => r.department_name === depNode.department_name,
          );
          if (!already && depNode.department_name) {
            const dObj = departments.find(
              (d) => d.department_name === depNode.department_name,
            );
            rows.push({
              rowId: `row-extra-${idx}-${depNode.department_name}`,
              department_id: dObj?.department_id || "",
              department_name: depNode.department_name,
              involvement_type:
                depNode.involvement_type === "PRIMARY" ? "PRIMARY" : "SUPPORT",
              prerequisites: depNode.prerequisites || [],
              sla_percent_allocation: depNode.sla_percent_allocation,
              allocated_duration_minutes:
                depNode.allocated_duration_minutes ?? null,
            });
          }
        });
      }

      if (rows.length === 1 && rows[0].sla_percent_allocation == null) {
        rows[0].sla_percent_allocation = 100;
      }
    }

    setParticipatingRows(rows);
  }, [
    open,
    editingRuleId,
    modalRuleType,
    selectedDeptId,
    selectedSupportingDepts,
    sequentialDependencies,
    departments,
    setSelectedDeptId,
  ]);

  const handleSetRoutingScope = (scope: "SINGLE" | "MULTI") => {
    setRoutingScope(scope);
    if (scope === "SINGLE") {
      const primary =
        participatingRows.find((r) => r.involvement_type === "PRIMARY") ||
        participatingRows[0];
      const targetDeptId =
        primary?.department_id || (departments[0]?.department_id ?? "");
      const deptObj = departments.find((d) => d.department_id === targetDeptId);

      setSelectedDeptId(targetDeptId);
      setSelectedSupportingDepts([]);
      const updated: ParticipatingDepartmentRow[] = targetDeptId
        ? [
            {
              rowId: "row-single-primary",
              department_id: targetDeptId,
              department_name: deptObj?.department_name || "",
              involvement_type: "PRIMARY",
              prerequisites: [],
              sla_percent_allocation: null,
              allocated_duration_minutes: null,
            },
          ]
        : [];
      setParticipatingRows(updated);
      if (setSequentialDependencies) {
        setSequentialDependencies(
          updated.map((r, idx) => ({
            department_name: r.department_name,
            execution_order: idx + 1,
            stage: 1,
            prerequisites: [],
            involvement_type: "PRIMARY",
            sla_percent_allocation: null,
            allocated_duration_minutes: null,
          })),
        );
      }
    } else {
      // MULTI scope:
      // When user selects Multi-Department, do NOT auto-fill previous or fake departments.
      // Clear out so user can choose their own departments cleanly from the right-side checklist!
      syncRowsToParent([]);
    }
  };

  const handleSingleDeptChange = (newDeptId: string) => {
    setSelectedDeptId(newDeptId);
    setSelectedSupportingDepts([]);
    const deptObj = departments.find((d) => d.department_id === newDeptId);
    const updated: ParticipatingDepartmentRow[] = newDeptId
      ? [
          {
            rowId: "row-single-primary",
            department_id: newDeptId,
            department_name: deptObj?.department_name || "",
            involvement_type: "PRIMARY",
            prerequisites: [],
            sla_percent_allocation: null,
            allocated_duration_minutes: null,
          },
        ]
      : [];
    setParticipatingRows(updated);
    if (setSequentialDependencies) {
      setSequentialDependencies(
        updated.map((r, idx) => ({
          department_name: r.department_name,
          execution_order: idx + 1,
          stage: 1,
          prerequisites: [],
          involvement_type: "PRIMARY",
          sla_percent_allocation: null,
          allocated_duration_minutes: null,
        })),
      );
    }
  };

  const handleMoveRow = (index: number, direction: "UP" | "DOWN") => {
    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= participatingRows.length) return;
    const updated = [...participatingRows];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    syncRowsToParent(updated);
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetIndex: number,
  ) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }
    const updated = [...participatingRows];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, removed);
    setDraggedIndex(null);
    syncRowsToParent(updated);
  };

  const syncRowsToParent = (updatedRows: ParticipatingDepartmentRow[]) => {
    setParticipatingRows(updatedRows);

    // Find the lead department (PRIMARY first, otherwise first row)
    const primaryRow = updatedRows.find(
      (r) => r.involvement_type === "PRIMARY",
    );
    const leadRow = primaryRow || updatedRows[0];

    if (leadRow) {
      setSelectedDeptId(leadRow.department_id);
    } else {
      setSelectedDeptId("");
    }

    const nonLeadRows = updatedRows.filter(
      (r) => r !== leadRow && r.department_name.trim() !== "",
    );
    setSelectedSupportingDepts(nonLeadRows.map((r) => r.department_name));

    if (setSequentialDependencies) {
      const nodes: DepartmentDependencyNode[] = updatedRows
        .filter((r) => r.department_name.trim() !== "")
        .map((r, idx) => ({
          department_name: r.department_name,
          execution_order: idx + 1,
          stage: 1,
          prerequisites: r.prerequisites || [],
          involvement_type: r.involvement_type,
          sla_percent_allocation: r.sla_percent_allocation,
          allocated_duration_minutes: r.allocated_duration_minutes ?? null,
        }));
      setSequentialDependencies(nodes);
    }
  };

  const handleSelectDependencyType = (type: "PARALLEL" | "SEQUENTIAL") => {
    setDependencyType?.(type);
    if (type === "SEQUENTIAL") {
      const currentSum = participatingRows.reduce(
        (sum, r) => sum + (Number(r.sla_percent_allocation) || 0),
        0,
      );
      if (Math.round(currentSum) !== 100 && participatingRows.length > 0) {
        const count = participatingRows.length;
        const baseShare = Math.floor(100 / count);
        const remainder = 100 - baseShare * count;
        const updated = participatingRows.map((r, idx) => ({
          ...r,
          sla_percent_allocation: idx === 0 ? baseShare + remainder : baseShare,
        }));
        syncRowsToParent(updated);
      }
    } else {
      const updated = participatingRows.map((r) => ({
        ...r,
        sla_percent_allocation: null,
      }));
      syncRowsToParent(updated);
    }
  };

  const handleInvolvementChange = (
    rowId: string,
    newType: "PRIMARY" | "SUPPORT",
  ) => {
    let updated = participatingRows.map((r) =>
      r.rowId === rowId ? { ...r, involvement_type: newType } : r,
    );

    // If newType is PRIMARY, ensure no other row is PRIMARY (exactly 1 Primary Lead allowed)
    if (newType === "PRIMARY") {
      updated = updated.map((r) =>
        r.rowId !== rowId && r.involvement_type === "PRIMARY"
          ? { ...r, involvement_type: "SUPPORT" as const }
          : r,
      );
    }
    // If changed to SUPPORT, we do NOT automatically force any other department to become PRIMARY.
    // The user has 100% manual control over selecting which department is Primary Lead.

    syncRowsToParent(updated);
  };

  const handleRemoveDepartment = (rowId: string) => {
    const removedRow = participatingRows.find((r) => r.rowId === rowId);
    const removedName = removedRow?.department_name;

    let updated = participatingRows.filter((r) => r.rowId !== rowId);

    // If removed department was PRIMARY, do NOT force another row to become PRIMARY automatically.
    // The user can freely choose which remaining department is Primary Lead.

    if (removedName) {
      updated = updated.map((r) => ({
        ...r,
        prerequisites: r.prerequisites.filter((p) => p !== removedName),
      }));
    }

    if (updated.length === 1 && dependencyType === "SEQUENTIAL") {
      updated[0].sla_percent_allocation = 100;
    }

    syncRowsToParent(updated);
  };

  const handleToggleDeptInChecklist = (dept: {
    department_id: string;
    department_name: string;
  }) => {
    const existingIndex = participatingRows.findIndex(
      (r) =>
        r.department_id === dept.department_id ||
        r.department_name.toLowerCase() === dept.department_name.toLowerCase(),
    );

    if (existingIndex !== -1) {
      handleRemoveDepartment(participatingRows[existingIndex].rowId);
    } else {
      const hasPrimary = participatingRows.some(
        (r) => r.involvement_type === "PRIMARY",
      );
      const currentSum = participatingRows.reduce(
        (sum, r) => sum + (Number(r.sla_percent_allocation) || 0),
        0,
      );
      const remainingPct = Math.max(0, 100 - currentSum);

      const newRow: ParticipatingDepartmentRow = {
        rowId: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        department_id: dept.department_id,
        department_name: dept.department_name,
        involvement_type: hasPrimary ? "SUPPORT" : "PRIMARY",
        prerequisites: [],
        sla_percent_allocation:
          dependencyType === "PARALLEL"
            ? null
            : !hasPrimary
              ? 100
              : remainingPct > 0
                ? remainingPct
                : null,
        allocated_duration_minutes: null,
      };
      const updated = [...participatingRows, newRow];
      syncRowsToParent(updated);
    }
  };

  const handleClearAll = () => {
    syncRowsToParent([]);
  };

  const getDepartmentIcon = (name: string) => {
    const lower = (name || "").toLowerCase();
    if (lower.includes("complian"))
      return <Shield className="h-4 w-4 text-sky-500" />;
    if (
      lower.includes("financ") ||
      lower.includes("account") ||
      lower.includes("bill")
    )
      return <DollarSign className="h-4 w-4 text-purple-500" />;
    if (
      lower.includes("hr") ||
      lower.includes("human") ||
      lower.includes("personnel")
    )
      return <Users className="h-4 w-4 text-indigo-500" />;
    if (
      lower.includes("it") ||
      lower.includes("tech") ||
      lower.includes("softwar")
    )
      return <Laptop className="h-4 w-4 text-cyan-500" />;
    if (lower.includes("admin"))
      return <Building2 className="h-4 w-4 text-purple-600" />;
    if (
      lower.includes("facilit") ||
      lower.includes("estate") ||
      lower.includes("maint")
    )
      return <Building className="h-4 w-4 text-blue-500" />;
    if (
      lower.includes("transport") ||
      lower.includes("fleet") ||
      lower.includes("vehic")
    )
      return <Truck className="h-4 w-4 text-teal-500" />;
    if (lower.includes("legal") || lower.includes("law"))
      return <Scale className="h-4 w-4 text-emerald-600" />;
    if (
      lower.includes("sec") ||
      lower.includes("cyber") ||
      lower.includes("crime")
    )
      return <ShieldAlert className="h-4 w-4 text-rose-500" />;
    if (lower.includes("eng") || lower.includes("dev"))
      return <Cpu className="h-4 w-4 text-blue-600" />;
    return <Building className="h-4 w-4 text-slate-500" />;
  };

  const handleSlaPercentChange = (rowId: string, val: string) => {
    const trimmed = val.trim();
    const parsed = trimmed === "" ? null : Number.parseFloat(trimmed);
    const updated = participatingRows.map((r) =>
      r.rowId === rowId ? { ...r, sla_percent_allocation: parsed } : r,
    );
    syncRowsToParent(updated);
  };

  const totalConfiguredPercent = useMemo(() => {
    return participatingRows.reduce((sum, r) => {
      return sum + (Number(r.sla_percent_allocation) || 0);
    }, 0);
  }, [participatingRows]);

  const handleToggleRecipient = (
    tier: "warning" | "at_risk" | "critical" | "escalation",
    designation: string,
  ) => {
    if (!setSlaRecipients) return;
    setSlaRecipients((prev) => {
      const current = prev?.[tier] || [];
      const updated = current.includes(designation)
        ? current.filter((d) => d !== designation)
        : [...current, designation];
      return {
        ...prev,
        [tier]: updated,
      };
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl transition-all duration-200">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Configure Policy Rule
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Define automated triage, routing pathways, resolution SLAs, or
              reopen parameters.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setModalRuleType("routing")}
            className={`flex-1 rounded-lg py-1.5 text-center transition ${
              modalRuleType === "routing"
                ? "bg-white dark:bg-slate-800 text-[#0F766E] dark:text-teal-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Routing Rule
          </button>
          <button
            type="button"
            onClick={() => setModalRuleType("priority")}
            className={`flex-1 rounded-lg py-1.5 text-center transition ${
              modalRuleType === "priority"
                ? "bg-white dark:bg-slate-800 text-[#0F766E] dark:text-teal-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Priority Rule
          </button>
          <button
            type="button"
            onClick={() => setModalRuleType("sla")}
            className={`flex-1 rounded-lg py-1.5 text-center transition ${
              modalRuleType === "sla"
                ? "bg-white dark:bg-slate-800 text-[#0F766E] dark:text-teal-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            SLA Policy
          </button>
          <button
            type="button"
            onClick={() => setModalRuleType("reopen")}
            className={`flex-1 rounded-lg py-1.5 text-center transition ${
              modalRuleType === "reopen"
                ? "bg-white dark:bg-slate-800 text-[#0F766E] dark:text-teal-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            Reopen Policy
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4 text-xs">
          {modalRuleType !== "routing" && (
            <div>
              <label
                htmlFor="rule-name-input"
                className="block font-semibold text-slate-700 dark:text-slate-300"
              >
                Policy Rule Name *
              </label>
              <input
                id="rule-name-input"
                type="text"
                required
                placeholder={
                  modalRuleType === "priority"
                    ? "e.g. Critical Safety Escalation"
                    : modalRuleType === "sla"
                      ? "e.g. High Priority Resolution SLA"
                      : "e.g. Standard 72hr Reopen Policy"
                }
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-emerald-600"
              />
            </div>
          )}

          {modalRuleType === "priority" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="priority-level-select"
                    className="block font-semibold text-slate-700"
                  >
                    Assigned Priority *
                  </label>
                  <select
                    id="priority-level-select"
                    value={priorityLevel}
                    onChange={(e) => setPriorityLevel(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="rule-order-input"
                    className="block font-semibold text-slate-700"
                  >
                    Execution Order *
                  </label>
                  <input
                    id="rule-order-input"
                    type="number"
                    min="1"
                    value={ruleOrder}
                    onChange={(e) => setRuleOrder(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => {
                      setIsDefault(e.target.checked);
                      if (e.target.checked) {
                        setSelectedPriorityCatId("");
                        setSelectedPrioritySubcatId("");
                      }
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-700">
                    Default Fallback Rule
                  </span>
                </label>
              </div>

              {!isDefault && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="prio-cat-select"
                      className="block font-semibold text-slate-700"
                    >
                      Category Scope {!keywords.trim() && "*"}
                    </label>
                    {selectedPriorityCatId === "CUSTOM" ? (
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Enter custom category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          required
                          className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedPriorityCatId("")}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <select
                        id="prio-cat-select"
                        value={selectedPriorityCatId}
                        required={!isDefault && !keywords.trim()}
                        onChange={(e) => {
                          setSelectedPriorityCatId(e.target.value);
                          setSelectedPrioritySubcatId("");
                        }}
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-emerald-600"
                      >
                        <option value="">
                          -- All Categories (Keyword Rule) --
                        </option>
                        {categories.map((c) => (
                          <option key={c.category_id} value={c.category_id}>
                            {c.category_name}
                          </option>
                        ))}
                        <option value="CUSTOM">Custom (Add New)</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="prio-subcat-select"
                      className="block font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Subcategory Scope
                    </label>
                    {selectedPrioritySubcatId === "CUSTOM" ? (
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Enter custom subcategory name"
                          value={newSubcategoryName}
                          onChange={(e) =>
                            setNewSubcategoryName(e.target.value)
                          }
                          required
                          className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-emerald-600"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedPrioritySubcatId("")}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <select
                        id="prio-subcat-select"
                        value={selectedPrioritySubcatId}
                        disabled={!selectedPriorityCatId}
                        onChange={(e) =>
                          setSelectedPrioritySubcatId(e.target.value)
                        }
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-emerald-600 disabled:opacity-50"
                      >
                        <option value="">-- All Subcategories --</option>
                        {categories
                          .find((c) => c.category_id === selectedPriorityCatId)
                          ?.subcategories?.map((s) => (
                            <option
                              key={s.subcategory_id}
                              value={s.subcategory_id}
                            >
                              {s.subcategory_name}
                            </option>
                          ))}
                        {selectedPriorityCatId && (
                          <option value="CUSTOM">Custom (Add New)</option>
                        )}
                      </select>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label
                      htmlFor="prio-keywords-input"
                      className="block font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Trigger Keywords{" "}
                      {!selectedPriorityCatId && !isDefault
                        ? "*"
                        : "(Optional)"}
                    </label>
                    <input
                      id="prio-keywords-input"
                      type="text"
                      placeholder="e.g. emergency, ragging, hazard, leak (comma-separated)"
                      value={keywords}
                      onChange={(e) => setKeywords?.(e.target.value)}
                      required={!isDefault && !selectedPriorityCatId}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-emerald-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Matches case-insensitively against grievance title and
                      description.
                      {!selectedPriorityCatId &&
                        !isDefault &&
                        " Required when 'All Categories' is selected."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {modalRuleType === "routing" && (
            <div className="space-y-4">
              {/* Row 1: Policy Rule Name (Left) + Department Routing Scope (Right) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="rule-name-input"
                    className="block font-semibold text-slate-700 dark:text-slate-200 text-xs"
                  >
                    Policy Rule Name *
                  </label>
                  <input
                    id="rule-name-input"
                    type="text"
                    required
                    placeholder="e.g. Expense Reimbursement Routing"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-800 dark:text-slate-100 outline-none transition focus:border-teal-600"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="routing-scope-select"
                    className="block font-semibold text-slate-700 dark:text-slate-200 text-xs"
                  >
                    Department Routing Scope *
                  </label>
                  <Select
                    value={routingScope}
                    onValueChange={(val) => {
                      if (val === "SINGLE" || val === "MULTI") {
                        handleSetRoutingScope(val);
                      }
                    }}
                  >
                    <SelectTrigger
                      id="routing-scope-select"
                      className="h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-800 dark:text-slate-100 focus:border-teal-600 font-medium"
                    >
                      <SelectValue placeholder="Select Scope">
                        {routingScope === "SINGLE"
                          ? "Single Department (Handled end-to-end by 1 department)"
                          : "Multi-Department (Sequential or Parallel Collaboration)"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
                      <SelectItem
                        value="SINGLE"
                        className="text-xs cursor-pointer"
                      >
                        Single Department (Handled end-to-end by 1 department)
                      </SelectItem>
                      <SelectItem
                        value="MULTI"
                        className="text-xs cursor-pointer"
                      >
                        Multi-Department (Sequential or Parallel Collaboration)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {routingScope === "SINGLE"
                      ? "Grievance is handled and resolved end-to-end by one designated department."
                      : "Multiple departments collaborate sequentially or concurrently on resolution."}
                  </p>
                </div>
              </div>

              {/* Row 2: Rule Execution Mode (Left, if MULTI) + Category/Subcategory Scope (Right) */}
              <div
                className={`grid grid-cols-1 ${
                  routingScope === "MULTI" ? "md:grid-cols-2" : "grid-cols-1"
                } gap-4 items-start`}
              >
                {routingScope === "MULTI" && (
                  <div className="space-y-1.5">
                    <span className="block font-semibold text-slate-700 dark:text-slate-200 text-xs">
                      Rule Execution Mode *
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSelectDependencyType("PARALLEL")}
                        className={`flex flex-col p-3 rounded-xl border text-left transition cursor-pointer relative ${
                          dependencyType === "PARALLEL"
                            ? "bg-teal-50/70 dark:bg-teal-950/50 border-teal-500 dark:border-teal-400 text-teal-900 dark:text-teal-200 font-semibold shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                            <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                            <span className="text-slate-800 dark:text-slate-100">
                              Parallel (Concurrent)
                            </span>
                          </span>
                          <span
                            className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                              dependencyType === "PARALLEL"
                                ? "border-teal-600 bg-teal-600 text-white"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {dependencyType === "PARALLEL" && (
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-1.5 leading-snug">
                          All participating departments activate simultaneously
                          upon assignment.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectDependencyType("SEQUENTIAL")}
                        className={`flex flex-col p-3 rounded-xl border text-left transition cursor-pointer relative ${
                          dependencyType === "SEQUENTIAL"
                            ? "bg-teal-50/70 dark:bg-teal-950/50 border-teal-500 dark:border-teal-400 text-teal-900 dark:text-teal-200 font-semibold shadow-xs"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold flex items-center gap-1.5 text-teal-600 dark:text-teal-400">
                            <GitMerge className="h-3.5 w-3.5" />
                            <span className="text-slate-800 dark:text-slate-100">
                              Sequential (Dependency-Driven)
                            </span>
                          </span>
                          <span
                            className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                              dependencyType === "SEQUENTIAL"
                                ? "border-teal-600 bg-teal-600 text-white"
                                : "border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {dependencyType === "SEQUENTIAL" && (
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-1.5 leading-snug">
                          Departments activate in mandatory sequence order with
                          prerequisite dependencies.
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Category & Subcategory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="routing-cat-select"
                      className="block font-semibold text-slate-700 dark:text-slate-200 text-xs"
                    >
                      Category Scope *
                    </label>
                    {selectedCatId === "CUSTOM" ? (
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Enter custom category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          required
                          className="h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedCatId("")}
                          className="flex h-9.5 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <Select
                        value={selectedCatId || ""}
                        onValueChange={(val) => {
                          if (val) {
                            setSelectedCatId(val);
                            setSelectedRoutingSubcatId("");
                          }
                        }}
                      >
                        <SelectTrigger
                          id="routing-cat-select"
                          className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 font-medium"
                        >
                          <SelectValue placeholder="-- Select Category --">
                            {categories.find(
                              (c) => c.category_id === selectedCatId,
                            )?.category_name || (
                              <span className="text-slate-400">
                                -- Select Category --
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-60">
                          {categories.map((c) => (
                            <SelectItem
                              key={c.category_id}
                              value={c.category_id}
                              className="text-xs cursor-pointer"
                            >
                              {c.category_name}
                            </SelectItem>
                          ))}
                          <SelectItem
                            value="CUSTOM"
                            className="text-xs font-semibold text-teal-600 dark:text-teal-400 cursor-pointer"
                          >
                            + Custom (Add New)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="routing-subcat-select"
                      className="block font-semibold text-slate-700 dark:text-slate-200 text-xs"
                    >
                      Subcategory Scope *
                    </label>
                    {selectedRoutingSubcatId === "CUSTOM" ? (
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Enter custom subcategory name"
                          value={newSubcategoryName}
                          onChange={(e) =>
                            setNewSubcategoryName(e.target.value)
                          }
                          required
                          className="h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedRoutingSubcatId("")}
                          className="flex h-9.5 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <Select
                        value={selectedRoutingSubcatId || ""}
                        disabled={!selectedCatId}
                        onValueChange={(val) => {
                          if (val) setSelectedRoutingSubcatId(val);
                        }}
                      >
                        <SelectTrigger
                          id="routing-subcat-select"
                          className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 font-medium disabled:opacity-50"
                        >
                          <SelectValue placeholder="-- Select Subcategory --">
                            {categories
                              .find((c) => c.category_id === selectedCatId)
                              ?.subcategories?.find(
                                (s) =>
                                  s.subcategory_id === selectedRoutingSubcatId,
                              )?.subcategory_name || (
                              <span className="text-slate-400">
                                Select Subcategory
                              </span>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-60">
                          {categories
                            .find((c) => c.category_id === selectedCatId)
                            ?.subcategories?.map((s) => (
                              <SelectItem
                                key={s.subcategory_id}
                                value={s.subcategory_id}
                                className="text-xs cursor-pointer"
                              >
                                {s.subcategory_name}
                              </SelectItem>
                            ))}
                          {selectedCatId && (
                            <SelectItem
                              value="CUSTOM"
                              className="text-xs font-semibold text-teal-600 dark:text-teal-400 cursor-pointer"
                            >
                              + Custom (Add New)
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Single Department Assignment */}
              {routingScope === "SINGLE" ? (
                <div className="space-y-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                  <label
                    htmlFor="single-dept-select"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Assigned Department *
                  </label>
                  <Select
                    value={selectedDeptId || ""}
                    onValueChange={(val) => {
                      if (val) handleSingleDeptChange(val);
                    }}
                  >
                    <SelectTrigger
                      id="single-dept-select"
                      className="h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 font-medium"
                    >
                      <SelectValue placeholder="-- Select Department --">
                        {departments.find(
                          (d) => d.department_id === selectedDeptId,
                        )?.department_name || (
                          <span className="text-slate-400">
                            -- Select Department --
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-60">
                      {departments.map((d) => (
                        <SelectItem
                          key={d.department_id}
                          value={d.department_id}
                          className="text-xs cursor-pointer"
                        >
                          {d.department_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    All grievances matching this category and subcategory route
                    directly to this single department for full end-to-end
                    resolution.
                  </p>
                </div>
              ) : (
                /* 4. Multi-Department Configuration (2-Column Board Layout matching Image 2) */
                <div className="flex flex-col lg:flex-row gap-4 items-start">
                  {/* Left Column: Department Workflow Board & Workflow Preview */}
                  <div className="flex-1 min-w-0 space-y-4 w-full">
                    {/* A. Department Workflow Board */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              Department Workflow
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Select departments and arrange them in the
                              execution order. Configure SLA and role for each
                              department.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!showDeptSidebar && (
                            <button
                              type="button"
                              onClick={() => setShowDeptSidebar(true)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500 dark:border-teal-400 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add Departments</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleClearAll}
                            disabled={participatingRows.length === 0}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-40 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Clear All</span>
                          </button>
                        </div>
                      </div>

                      {/* Workflow Horizontal Pipeline Cards */}
                      {participatingRows.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-2 bg-white dark:bg-slate-800/40">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            No departments added to workflow
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Select departments from the right list to add them
                            here.
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-stretch gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin">
                          {participatingRows.map((row, index) => {
                            const isPrimary =
                              row.involvement_type === "PRIMARY";
                            const isFirst = index === 0;
                            const isLast =
                              index === participatingRows.length - 1;

                            return (
                              <div
                                key={row.rowId}
                                className="flex items-center shrink-0"
                              >
                                {/* Department Card */}
                                {/* biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop container card */}
                                <div
                                  draggable={dependencyType === "SEQUENTIAL"}
                                  onDragStart={(e) =>
                                    dependencyType === "SEQUENTIAL" &&
                                    handleDragStart(e, index)
                                  }
                                  onDragOver={
                                    dependencyType === "SEQUENTIAL"
                                      ? handleDragOver
                                      : undefined
                                  }
                                  onDrop={(e) =>
                                    dependencyType === "SEQUENTIAL" &&
                                    handleDrop(e, index)
                                  }
                                  onDragEnd={() => setDraggedIndex(null)}
                                  className={`w-64 rounded-xl border bg-white dark:bg-slate-800/95 p-3.5 shadow-2xs space-y-3 transition-all ${
                                    draggedIndex === index
                                      ? "opacity-40 border-teal-500 scale-[0.98]"
                                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                                  }`}
                                >
                                  {/* Card Header */}
                                  <div className="flex items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-1.5">
                                      {/* Sequential shows step number; Parallel shows Zap icon */}
                                      {dependencyType === "SEQUENTIAL" ? (
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-xs">
                                          {index + 1}
                                        </div>
                                      ) : (
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                          <Zap className="h-3 w-3" />
                                        </div>
                                      )}

                                      {/* shadcn UI Role Dropdown Selector */}
                                      <Select
                                        value={row.involvement_type}
                                        onValueChange={(val) => {
                                          if (
                                            val === "PRIMARY" ||
                                            val === "SUPPORT"
                                          ) {
                                            handleInvolvementChange(
                                              row.rowId,
                                              val,
                                            );
                                          }
                                        }}
                                      >
                                        <SelectTrigger
                                          size="sm"
                                          aria-label="Department Role"
                                          className={`h-6 rounded-full px-2.5 py-0 text-[10px] font-bold border transition cursor-pointer gap-1 [&_svg]:size-2.5 ${
                                            isPrimary
                                              ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                                              : "bg-sky-50 dark:bg-sky-950/70 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 hover:bg-sky-100"
                                          }`}
                                        >
                                          <SelectValue>
                                            {isPrimary
                                              ? "Primary Lead"
                                              : "Supporting"}
                                          </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent
                                          align="start"
                                          className="z-50 min-w-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-xl text-xs"
                                        >
                                          <SelectItem
                                            value="PRIMARY"
                                            className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 rounded-lg cursor-pointer"
                                          >
                                            Primary Lead
                                          </SelectItem>
                                          <SelectItem
                                            value="SUPPORT"
                                            className="text-xs font-semibold text-sky-700 dark:text-sky-300 rounded-lg cursor-pointer"
                                          >
                                            Supporting
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Controls: Reorder arrows (Sequential only) & Trash */}
                                    <div className="flex items-center gap-0.5">
                                      {dependencyType === "SEQUENTIAL" &&
                                        participatingRows.length > 1 && (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleMoveRow(index, "UP")
                                              }
                                              disabled={isFirst}
                                              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-20 cursor-pointer"
                                              title="Move earlier in sequence"
                                            >
                                              <ArrowLeft className="h-3 w-3" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleMoveRow(index, "DOWN")
                                              }
                                              disabled={isLast}
                                              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-20 cursor-pointer"
                                              title="Move later in sequence"
                                            >
                                              <ArrowRight className="h-3 w-3" />
                                            </button>
                                          </>
                                        )}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveDepartment(row.rowId)
                                        }
                                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                                        title="Remove from workflow"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Department Name & Icon */}
                                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                                    <div className="p-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/50">
                                      {getDepartmentIcon(row.department_name)}
                                    </div>
                                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                      {row.department_name ||
                                        "Select Department"}
                                    </span>
                                  </div>

                                  {/* SLA Share input (only for SEQUENTIAL) */}
                                  {dependencyType === "SEQUENTIAL" && (
                                    <div className="space-y-1 pt-1">
                                      <label
                                        htmlFor={`sla-share-${row.rowId}`}
                                        className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1"
                                      >
                                        SLA Share (%) *
                                      </label>
                                      <div className="relative">
                                        <input
                                          id={`sla-share-${row.rowId}`}
                                          type="number"
                                          min="1"
                                          max="100"
                                          step="any"
                                          value={
                                            row.sla_percent_allocation ?? ""
                                          }
                                          onChange={(e) =>
                                            handleSlaPercentChange(
                                              row.rowId,
                                              e.target.value,
                                            )
                                          }
                                          placeholder="e.g. 50"
                                          className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-2.5 pr-7 text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none transition focus:border-teal-600 focus:bg-white"
                                        />
                                        <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">
                                          %
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Inter-card Arrow: SEQUENTIAL mode only */}
                                {dependencyType === "SEQUENTIAL" && !isLast && (
                                  <div className="flex items-center justify-center px-2 text-slate-400 dark:text-slate-500">
                                    <ArrowRight className="h-5 w-5" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* B. Workflow Preview Card */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                            <Eye className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              Workflow Preview
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {dependencyType === "SEQUENTIAL"
                                ? "Visual representation of execution order and SLA allocation."
                                : "Visual representation of simultaneous multi-department activation."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {dependencyType === "SEQUENTIAL" ? (
                            <>
                              {Math.abs(totalConfiguredPercent - 100) < 0.01 ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>
                                    Total SLA Allocation: 100% (Balanced)
                                  </span>
                                </span>
                              ) : totalConfiguredPercent > 100 ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-3 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                                  <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                                  <span>
                                    ✕ SLA Exceeded: {totalConfiguredPercent}%
                                    (Exceeds 100% by{" "}
                                    {Number(
                                      (totalConfiguredPercent - 100).toFixed(2),
                                    )}
                                    %)
                                  </span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                  <span>
                                    ⚠ Total SLA: {totalConfiguredPercent}% (
                                    {Number(
                                      (100 - totalConfiguredPercent).toFixed(2),
                                    )}
                                    % remaining)
                                  </span>
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-300 dark:border-sky-800 px-3 py-1 text-[11px] font-bold text-sky-700 dark:text-sky-300">
                              <Zap className="h-3.5 w-3.5 text-sky-600" />
                              <span>
                                Parallel Execution (Simultaneous Activation)
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Visual Pipeline Nodes */}
                      <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-3 overflow-x-auto">
                        {participatingRows.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            No departments configured yet.
                          </p>
                        ) : dependencyType === "SEQUENTIAL" ? (
                          /* Sequential Pipeline: Step-by-step with sequence arrows */
                          <div className="flex items-center gap-3 min-w-max py-1">
                            {participatingRows.map((r, i) => (
                              <div
                                key={r.rowId}
                                className="flex items-center gap-3"
                              >
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 shadow-2xs">
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                                    {i + 1}
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                                      {r.department_name || "Unassigned"}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                      SLA: {r.sla_percent_allocation ?? 0}%
                                    </span>
                                  </div>
                                </div>
                                {i < participatingRows.length - 1 && (
                                  <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* Parallel Pipeline: Concurrent group, NO sequence arrows */
                          <div className="flex items-center gap-2 flex-wrap py-1">
                            {participatingRows.map((r) => (
                              <div
                                key={r.rowId}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 shadow-2xs"
                              >
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                  <Zap className="h-3 w-3" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                                    {r.department_name || "Unassigned"}
                                  </span>
                                  <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">
                                    {r.involvement_type === "PRIMARY"
                                      ? "Primary Lead"
                                      : "Supporting"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: "Select Departments" Checklist Panel */}
                  {showDeptSidebar && (
                    <div className="w-full lg:w-72 xl:w-80 shrink-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col space-y-3 shadow-xs">
                      {/* Top title & close */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            Select Departments
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Choose departments to include in this policy.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowDeptSidebar(false)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Close sidebar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search departments..."
                          value={deptSearchQuery}
                          onChange={(e) => setDeptSearchQuery(e.target.value)}
                          className="h-8.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 pl-8 pr-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600 focus:bg-white dark:focus:bg-slate-800"
                        />
                      </div>

                      {/* Department Checklist List */}
                      <div className="max-h-95 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                        {filteredDepartments.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-4">
                            No matching departments found
                          </p>
                        ) : (
                          filteredDepartments.map((d) => {
                            const isSelected = participatingRows.some(
                              (r) =>
                                r.department_id === d.department_id ||
                                r.department_name.toLowerCase() ===
                                  d.department_name.toLowerCase(),
                            );

                            return (
                              <button
                                type="button"
                                key={d.department_id}
                                onClick={() => handleToggleDeptInChecklist(d)}
                                className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition cursor-pointer ${
                                  isSelected
                                    ? "border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/30"
                                    : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {/* Checkbox Icon */}
                                  <div
                                    className={`h-4 w-4 rounded flex items-center justify-center border transition ${
                                      isSelected
                                        ? "border-blue-600 bg-blue-600 text-white"
                                        : "border-slate-300 dark:border-slate-600"
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check className="h-3 w-3 stroke-[3]" />
                                    )}
                                  </div>

                                  {/* Department Icon */}
                                  <div className="shrink-0">
                                    {getDepartmentIcon(d.department_name)}
                                  </div>

                                  {/* Department Name */}
                                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {d.department_name}
                                  </span>
                                </div>

                                {/* Right Status Badge / Action */}
                                <div className="shrink-0 ml-2">
                                  {isSelected ? (
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                        participatingRows.find(
                                          (r) =>
                                            r.department_id ===
                                              d.department_id ||
                                            r.department_name.toLowerCase() ===
                                              d.department_name.toLowerCase(),
                                        )?.involvement_type === "PRIMARY"
                                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                          : "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                                      }`}
                                    >
                                      {participatingRows.find(
                                        (r) =>
                                          r.department_id === d.department_id ||
                                          r.department_name.toLowerCase() ===
                                            d.department_name.toLowerCase(),
                                      )?.involvement_type === "PRIMARY"
                                        ? "Primary"
                                        : "Supporting"}
                                    </span>
                                  ) : (
                                    <span className="h-6 w-6 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition">
                                      <Plus className="h-3.5 w-3.5" />
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {modalRuleType === "sla" && (
            <div className="space-y-4">
              {/* A. Overall Grievance SLA */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      Overall Grievance SLA
                    </span>
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      Global Policy Clock
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Resolution timeline for entire grievance lifecycle
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="sla-priority-select"
                      className="block font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Priority Tier Scope *
                    </label>
                    <select
                      id="sla-priority-select"
                      value={priorityLevel}
                      onChange={(e) => setPriorityLevel(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-emerald-600"
                    >
                      <option value="CRITICAL">Critical Priority Tier</option>
                      <option value="HIGH">High Priority Tier</option>
                      <option value="MEDIUM">Medium Priority Tier</option>
                      <option value="LOW">Low Priority Tier</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="target-duration-input"
                      className="block font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Target Duration (Hours) *
                    </label>
                    <input
                      id="target-duration-input"
                      type="number"
                      min="1"
                      value={durationHours}
                      onChange={(e) => setDurationHours(e.target.value)}
                      placeholder="e.g. 24"
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* B. Notifications and Escalation */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      Notifications & Escalation Triggers
                    </span>
                    <span className="rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                      4-Tier Notification Engine
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                    Thresholds evaluated against active SLA clocks
                  </span>
                </div>

                {/* 1. Threshold Tiers Selector */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block">
                    Select Notification Tier:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* Warning (Tier 1) */}
                    <button
                      type="button"
                      onClick={() => setActiveSlaTier("warning")}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        activeSlaTier === "warning"
                          ? "bg-teal-50 dark:bg-teal-950/60 border-teal-500 dark:border-teal-400 ring-2 ring-teal-500/20 shadow-xs"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                          Tier 1
                        </span>
                        <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                          {warningPercent || 50}%
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        Warning
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {(slaRecipients?.warning || []).length} recipient
                        {(slaRecipients?.warning || []).length === 1 ? "" : "s"}
                      </span>
                    </button>

                    {/* At Risk (Tier 2) */}
                    <button
                      type="button"
                      onClick={() => setActiveSlaTier("at_risk")}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        activeSlaTier === "at_risk"
                          ? "bg-amber-50 dark:bg-amber-950/60 border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/20 shadow-xs"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          Tier 2
                        </span>
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                          {atRiskPercent || 75}%
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        At Risk
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {(slaRecipients?.at_risk || []).length} recipient
                        {(slaRecipients?.at_risk || []).length === 1 ? "" : "s"}
                      </span>
                    </button>

                    {/* Urgent / Critical (Tier 3) */}
                    <button
                      type="button"
                      onClick={() => setActiveSlaTier("critical")}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        activeSlaTier === "critical"
                          ? "bg-orange-50 dark:bg-orange-950/60 border-orange-500 dark:border-orange-400 ring-2 ring-orange-500/20 shadow-xs"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                          Tier 3
                        </span>
                        <span className="text-xs font-bold text-orange-800 dark:text-orange-300">
                          {criticalPercent || 90}%
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        Urgent / Critical
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {(slaRecipients?.critical || []).length} recipient
                        {(slaRecipients?.critical || []).length === 1
                          ? ""
                          : "s"}
                      </span>
                    </button>

                    {/* Breach (Tier 4) */}
                    <button
                      type="button"
                      onClick={() => setActiveSlaTier("escalation")}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        activeSlaTier === "escalation"
                          ? "bg-rose-50 dark:bg-rose-950/60 border-rose-500 dark:border-rose-400 ring-2 ring-rose-500/20 shadow-xs"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-700"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                          Tier 4
                        </span>
                        <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                          {escalationPercent || 100}%
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        Breach
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {(slaRecipients?.escalation || []).length} recipient
                        {(slaRecipients?.escalation || []).length === 1
                          ? ""
                          : "s"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. Unified Active Tier Configuration Card */}
                {(() => {
                  const currentTierKey = activeSlaTier;
                  const currentRecipients =
                    slaRecipients?.[currentTierKey] || [];
                  const isWarning = currentTierKey === "warning";
                  const isAtRisk = currentTierKey === "at_risk";
                  const isCritical = currentTierKey === "critical";
                  const isBreach = currentTierKey === "escalation";

                  const tierName = isWarning
                    ? "Warning Threshold"
                    : isAtRisk
                      ? "At Risk Threshold"
                      : isCritical
                        ? "Urgent / Critical Threshold"
                        : "Breach Threshold";

                  const tierTag = isWarning
                    ? "Tier 1"
                    : isAtRisk
                      ? "Tier 2"
                      : isCritical
                        ? "Tier 3"
                        : "Tier 4";

                  const tierDesc = isWarning
                    ? "Triggers early advisory alert when resolution reaches the initial elapsed threshold."
                    : isAtRisk
                      ? "Alerts staff and supervisors that the grievance is approaching SLA risk limits."
                      : isCritical
                        ? "High-priority notification for near-breach escalation requiring immediate intervention."
                        : "Triggers full system escalation and administrative alerts when SLA deadline is exceeded.";

                  const accentBorder = isWarning
                    ? "border-teal-200 dark:border-teal-800"
                    : isAtRisk
                      ? "border-amber-200 dark:border-amber-800"
                      : isCritical
                        ? "border-orange-200 dark:border-orange-800"
                        : "border-rose-200 dark:border-rose-800";

                  const accentBadge = isWarning
                    ? "bg-teal-100 dark:bg-teal-950/70 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300"
                    : isAtRisk
                      ? "bg-amber-100 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300"
                      : isCritical
                        ? "bg-orange-100 dark:bg-orange-950/70 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300"
                        : "bg-rose-100 dark:bg-rose-950/70 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300";

                  return (
                    <div
                      className={`rounded-xl border ${accentBorder} bg-white dark:bg-slate-800/90 p-4 space-y-4 shadow-xs`}
                    >
                      {/* Card Title & Description */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${accentBadge}`}
                            >
                              {tierTag}
                            </span>
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                              {tierName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {tierDesc}
                          </p>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                          {currentRecipients.length} designation
                          {currentRecipients.length === 1 ? "" : "s"} selected
                        </span>
                      </div>

                      {/* Step A: Threshold Percentage */}
                      <div className="space-y-1">
                        <label
                          htmlFor="active-tier-percent-input"
                          className="block text-xs font-bold text-slate-800 dark:text-slate-200"
                        >
                          1. Threshold Percentage (%) *
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="relative w-36">
                            {isWarning && (
                              <input
                                id="active-tier-percent-input"
                                type="number"
                                min="1"
                                max="99"
                                value={warningPercent}
                                onChange={(e) =>
                                  setWarningPercent(e.target.value)
                                }
                                placeholder="50"
                                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3 pr-8 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                              />
                            )}
                            {isAtRisk && (
                              <input
                                id="active-tier-percent-input"
                                type="number"
                                min="1"
                                max="99"
                                value={atRiskPercent}
                                onChange={(e) =>
                                  setAtRiskPercent?.(e.target.value)
                                }
                                placeholder="75"
                                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3 pr-8 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                              />
                            )}
                            {isCritical && (
                              <input
                                id="active-tier-percent-input"
                                type="number"
                                min="1"
                                max="99"
                                value={criticalPercent}
                                onChange={(e) =>
                                  setCriticalPercent?.(e.target.value)
                                }
                                placeholder="90"
                                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3 pr-8 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
                              />
                            )}
                            {isBreach && (
                              <input
                                id="active-tier-percent-input"
                                type="number"
                                min="100"
                                value={escalationPercent}
                                onChange={(e) =>
                                  setEscalationPercent(e.target.value)
                                }
                                placeholder="100"
                                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3 pr-8 text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                              />
                            )}
                            <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">
                              %
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {isBreach
                              ? "Triggered at 100%+ of elapsed target resolution SLA."
                              : `Triggered when elapsed clock reaches ${
                                  (isWarning
                                    ? warningPercent
                                    : isAtRisk
                                      ? atRiskPercent
                                      : criticalPercent) || 0
                                }% of total SLA.`}
                          </span>
                        </div>
                      </div>

                      {/* Step B: Designated Recipients */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                            2. Designated Recipients (Select Designations) *
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            Click to toggle designation
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {SLA_RECIPIENT_OPTIONS.map((opt) => {
                            const isSelected = currentRecipients.includes(
                              opt.id,
                            );
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  handleToggleRecipient(currentTierKey, opt.id)
                                }
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                  isSelected
                                    ? isWarning
                                      ? "bg-teal-50/70 dark:bg-teal-950/50 border-teal-400 dark:border-teal-700 text-teal-950 dark:text-teal-200 shadow-2xs"
                                      : isAtRisk
                                        ? "bg-amber-50/70 dark:bg-amber-950/50 border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-200 shadow-2xs"
                                        : isCritical
                                          ? "bg-orange-50/70 dark:bg-orange-950/50 border-orange-400 dark:border-orange-700 text-orange-950 dark:text-orange-200 shadow-2xs"
                                          : "bg-rose-50/70 dark:bg-rose-950/50 border-rose-400 dark:border-rose-700 text-rose-950 dark:text-rose-200 shadow-2xs"
                                    : "bg-slate-50/50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800"
                                }`}
                              >
                                <div
                                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                    isSelected
                                      ? isWarning
                                        ? "border-teal-600 bg-teal-600 text-white"
                                        : isAtRisk
                                          ? "border-amber-600 bg-amber-600 text-white"
                                          : isCritical
                                            ? "border-orange-600 bg-orange-600 text-white"
                                            : "border-rose-600 bg-rose-600 text-white"
                                      : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                  }`}
                                >
                                  {isSelected && (
                                    <span className="text-[10px] font-bold leading-none">
                                      ✓
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                  <p className="text-xs font-semibold leading-tight truncate">
                                    {opt.label}
                                  </p>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-1">
                                    {opt.description}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Pipeline Chain Summary */}
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Escalation Pipeline:
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSlaTier("warning")}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition ${
                      activeSlaTier === "warning"
                        ? "bg-teal-100 dark:bg-teal-950 font-bold text-teal-800 dark:text-teal-200"
                        : "hover:underline text-teal-700 dark:text-teal-300"
                    }`}
                  >
                    {warningPercent || 50}% Warning (
                    {(slaRecipients?.warning || []).length})
                  </button>
                  <span>➔</span>
                  <button
                    type="button"
                    onClick={() => setActiveSlaTier("at_risk")}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition ${
                      activeSlaTier === "at_risk"
                        ? "bg-amber-100 dark:bg-amber-950 font-bold text-amber-800 dark:text-amber-200"
                        : "hover:underline text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {atRiskPercent || 75}% At Risk (
                    {(slaRecipients?.at_risk || []).length})
                  </button>
                  <span>➔</span>
                  <button
                    type="button"
                    onClick={() => setActiveSlaTier("critical")}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition ${
                      activeSlaTier === "critical"
                        ? "bg-orange-100 dark:bg-orange-950 font-bold text-orange-800 dark:text-orange-200"
                        : "hover:underline text-orange-700 dark:text-orange-300"
                    }`}
                  >
                    {criticalPercent || 90}% Urgent (
                    {(slaRecipients?.critical || []).length})
                  </button>
                  <span>➔</span>
                  <button
                    type="button"
                    onClick={() => setActiveSlaTier("escalation")}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition ${
                      activeSlaTier === "escalation"
                        ? "bg-rose-100 dark:bg-rose-950 font-bold text-rose-800 dark:text-rose-200"
                        : "hover:underline text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {escalationPercent || 100}% Breach (
                    {(slaRecipients?.escalation || []).length})
                  </button>
                </div>
              </div>
            </div>
          )}

          {modalRuleType === "reopen" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="reopen-cat-select"
                    className="block font-semibold text-slate-700"
                  >
                    Category Scope
                  </label>
                  <select
                    id="reopen-cat-select"
                    value={selectedPriorityCatId}
                    onChange={(e) => {
                      setSelectedPriorityCatId(e.target.value);
                      setSelectedPrioritySubcatId("");
                    }}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                  >
                    <option value="">-- All Categories --</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                    <option value="CUSTOM">Custom (Add New)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="reopen-subcat-select"
                    className="block font-semibold text-slate-700"
                  >
                    Subcategory Scope
                  </label>
                  {selectedPrioritySubcatId === "CUSTOM" ? (
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Enter custom subcategory name"
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        required
                        className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedPrioritySubcatId("")}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <select
                      id="reopen-subcat-select"
                      value={selectedPrioritySubcatId}
                      disabled={!selectedPriorityCatId}
                      onChange={(e) =>
                        setSelectedPrioritySubcatId(e.target.value)
                      }
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                    >
                      <option value="">-- All Subcategories --</option>
                      {categories
                        .find((c) => c.category_id === selectedPriorityCatId)
                        ?.subcategories?.map((s) => (
                          <option
                            key={s.subcategory_id}
                            value={s.subcategory_id}
                          >
                            {s.subcategory_name}
                          </option>
                        ))}
                      {selectedPriorityCatId && (
                        <option value="CUSTOM">Custom (Add New)</option>
                      )}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="reopen-window-input"
                    className="block font-semibold text-slate-700"
                  >
                    Reopen Window (Hours) *
                  </label>
                  <input
                    id="reopen-window-input"
                    type="number"
                    min="1"
                    value={reopenWindowHours}
                    onChange={(e) => setReopenWindowHours(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="max-reopens-input"
                    className="block font-semibold text-slate-700"
                  >
                    Max Reopens *
                  </label>
                  <input
                    id="max-reopens-input"
                    type="number"
                    min="1"
                    value={maxReopens}
                    onChange={(e) => setMaxReopens(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="max-reviews-input"
                    className="block font-semibold text-slate-700"
                  >
                    Manual Reviews *
                  </label>
                  <input
                    id="max-reviews-input"
                    type="number"
                    min="1"
                    value={maxReviews}
                    onChange={(e) => setMaxReviews(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {editingRuleId && setRuleStatus && (
              <button
                type="button"
                onClick={() =>
                  setRuleStatus(ruleStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE")
                }
                className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition ${
                  ruleStatus === "ACTIVE"
                    ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                    : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                {ruleStatus === "ACTIVE" ? "Deactivate" : "Activate"}
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {modalRuleType === "routing" &&
                routingScope === "MULTI" &&
                participatingRows.length < 2 && (
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Multi-department rules require at least 2 participating
                    departments.
                  </span>
                )}
              {modalRuleType === "routing" &&
                routingScope === "MULTI" &&
                participatingRows.length >= 2 &&
                !participatingRows.some(
                  (r) => r.involvement_type === "PRIMARY",
                ) && (
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    A Primary Department is mandatory. Please select one
                    department as Primary.
                  </span>
                )}
              {modalRuleType === "routing" &&
                routingScope === "MULTI" &&
                dependencyType === "SEQUENTIAL" &&
                participatingRows.length >= 2 &&
                Math.abs(totalConfiguredPercent - 100) > 0.001 && (
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {totalConfiguredPercent > 100
                      ? `Sequential SLA total cannot exceed 100% (currently ${totalConfiguredPercent}% - exceeds 100% by ${Number((totalConfiguredPercent - 100).toFixed(2))}%)`
                      : `Sequential SLA total must equal 100% (currently ${totalConfiguredPercent}% - ${Number((100 - totalConfiguredPercent).toFixed(2))}% remaining)`}
                  </span>
                )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !ruleName.trim() ||
                  (modalRuleType === "priority" &&
                    !isDefault &&
                    !selectedPriorityCatId) ||
                  (modalRuleType === "routing" &&
                    (!selectedCatId ||
                      !selectedRoutingSubcatId ||
                      (routingScope === "SINGLE" &&
                        (!selectedDeptId || participatingRows.length === 0)) ||
                      (routingScope === "MULTI" &&
                        (participatingRows.length < 2 ||
                          participatingRows.some((r) => !r.department_id) ||
                          !participatingRows.some(
                            (r) => r.involvement_type === "PRIMARY",
                          ) ||
                          (dependencyType === "SEQUENTIAL" &&
                            (Math.abs(totalConfiguredPercent - 100) > 0.001 ||
                              participatingRows.some(
                                (r) =>
                                  (Number(r.sla_percent_allocation) || 0) <= 0,
                              )))))))
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                <span>Save Policy</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
