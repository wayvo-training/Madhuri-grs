"use client";

import { Loader2, Plus, Trash2, X } from "lucide-react";
import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SlaNotificationRecipients } from "@/hooks/admin/master-rules/useRuleActions";
import {
  type DepartmentDependencyNode,
  type DerivedOrderNode,
  validateRoutingPolicy,
} from "@/lib/validations/dependency-graph";
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
    label: "Supporting Dept Head",
    description: "Heads of participating supporting departments",
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
  involvement_type: "PRIMARY" | "EQUAL" | "SUPPORT";
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
  const [participatingRows, setParticipatingRows] = useState<
    ParticipatingDepartmentRow[]
  >([]);
  const [activeSlaTier, setActiveSlaTier] = useState<
    "warning" | "at_risk" | "critical" | "escalation"
  >("warning");
  const lastInitKey = useRef<string>("");

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

    const rows: ParticipatingDepartmentRow[] = [];
    const leadDept = departments.find(
      (d) => d.department_id === selectedDeptId,
    );
    const leadDepNode = leadDept
      ? sequentialDependencies?.find(
          (s) => s.department_name === leadDept.department_name,
        )
      : undefined;

    // 1. Only populate if selectedDeptId exists or there are supporting departments (e.g. Editing rule or openConfigureRow)
    if (
      selectedDeptId ||
      (selectedSupportingDepts && selectedSupportingDepts.length > 0)
    ) {
      rows.push({
        rowId: `row-primary-${Date.now()}`,
        department_id: selectedDeptId || "",
        department_name: leadDept?.department_name || "",
        involvement_type: "PRIMARY",
        prerequisites: leadDepNode?.prerequisites || [],
        sla_percent_allocation:
          leadDepNode?.sla_percent_allocation ??
          (selectedSupportingDepts.length === 0 ? 100 : null),
        allocated_duration_minutes:
          leadDepNode?.allocated_duration_minutes ?? null,
      });

      // 2. Supporting departments
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
          involvement_type:
            depNode?.involvement_type === "EQUAL" ? "EQUAL" : "SUPPORT",
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
              depNode.involvement_type === "PRIMARY"
                ? "PRIMARY"
                : depNode.involvement_type === "EQUAL"
                  ? "EQUAL"
                  : "SUPPORT",
            prerequisites: depNode.prerequisites || [],
            sla_percent_allocation: depNode.sla_percent_allocation,
            allocated_duration_minutes:
              depNode.allocated_duration_minutes ?? null,
          });
        }
      });

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
  ]);

  const syncRowsToParent = (updatedRows: ParticipatingDepartmentRow[]) => {
    setParticipatingRows(updatedRows);

    // Find the lead department (PRIMARY first, otherwise EQUAL, otherwise first row)
    const primaryRow = updatedRows.find(
      (r) => r.involvement_type === "PRIMARY",
    );
    const equalRow = updatedRows.find((r) => r.involvement_type === "EQUAL");
    const leadRow = primaryRow || equalRow || updatedRows[0];

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

  const handleDepartmentChange = (rowId: string, newDeptId: string) => {
    const deptObj = departments.find((d) => d.department_id === newDeptId);
    const oldRow = participatingRows.find((r) => r.rowId === rowId);
    const oldDeptName = oldRow?.department_name;

    const updated = participatingRows.map((r) => {
      if (r.rowId === rowId) {
        return {
          ...r,
          department_id: newDeptId,
          department_name: deptObj?.department_name || "",
          prerequisites: r.prerequisites.filter(
            (p) => p !== deptObj?.department_name,
          ),
        };
      }
      if (oldDeptName && r.prerequisites.includes(oldDeptName)) {
        return {
          ...r,
          prerequisites: r.prerequisites
            .filter((p) => p !== oldDeptName)
            .concat(deptObj ? [deptObj.department_name] : []),
        };
      }
      return r;
    });
    syncRowsToParent(updated);
  };

  const handleInvolvementChange = (
    rowId: string,
    newType: "PRIMARY" | "EQUAL" | "SUPPORT",
  ) => {
    let updated = participatingRows.map((r) =>
      r.rowId === rowId ? { ...r, involvement_type: newType } : r,
    );

    // If newType is PRIMARY, demote any other existing PRIMARY row to SUPPORT (only 1 lead allowed)
    if (newType === "PRIMARY") {
      updated = updated.map((r) =>
        r.rowId !== rowId && r.involvement_type === "PRIMARY"
          ? { ...r, involvement_type: "SUPPORT" as const }
          : r,
      );
    }

    syncRowsToParent(updated);
  };

  const handleAddDepartment = () => {
    const availableDept = departments.find(
      (d) =>
        !participatingRows.some((r) => r.department_id === d.department_id),
    );
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
      department_id: availableDept?.department_id || "",
      department_name: availableDept?.department_name || "",
      involvement_type: hasPrimary ? "SUPPORT" : "PRIMARY",
      prerequisites: [],
      sla_percent_allocation: !hasPrimary
        ? 100
        : remainingPct > 0
          ? remainingPct
          : null,
      allocated_duration_minutes: null,
    };
    const updated = [...participatingRows, newRow];
    syncRowsToParent(updated);
  };

  const handleRemoveDepartment = (rowId: string) => {
    const removedRow = participatingRows.find((r) => r.rowId === rowId);
    const removedName = removedRow?.department_name;

    let updated = participatingRows.filter((r) => r.rowId !== rowId);

    if (removedRow?.involvement_type === "PRIMARY" && updated.length > 0) {
      updated = updated.map((r, idx) =>
        idx === 0 ? { ...r, involvement_type: "PRIMARY" as const } : r,
      );
    }

    if (removedName) {
      updated = updated.map((r) => ({
        ...r,
        prerequisites: r.prerequisites.filter((p) => p !== removedName),
      }));
    }

    if (updated.length === 1) {
      updated[0].sla_percent_allocation = 100;
    }

    syncRowsToParent(updated);
  };

  const handleTogglePrerequisite = (rowId: string, prereqDeptName: string) => {
    const updated = participatingRows.map((r) => {
      if (r.rowId !== rowId) return r;
      const exists = r.prerequisites.includes(prereqDeptName);
      const newPrereqs = exists
        ? r.prerequisites.filter((p) => p !== prereqDeptName)
        : [...r.prerequisites, prereqDeptName];
      return { ...r, prerequisites: newPrereqs };
    });
    syncRowsToParent(updated);
  };

  const handleLinearChain = () => {
    const validRows = participatingRows.filter(
      (r) => r.department_name.trim() !== "",
    );
    const updated = participatingRows.map((r) => {
      const idx = validRows.findIndex((vr) => vr.rowId === r.rowId);
      if (idx <= 0) {
        return { ...r, prerequisites: [] };
      }
      return { ...r, prerequisites: [validRows[idx - 1].department_name] };
    });
    syncRowsToParent(updated);
  };

  const handleMakeAllIndependent = () => {
    const updated = participatingRows.map((r) => ({
      ...r,
      prerequisites: [],
    }));
    syncRowsToParent(updated);
  };

  const handleSlaPercentChange = (rowId: string, val: string) => {
    const trimmed = val.trim();
    const parsed = trimmed === "" ? null : Number.parseFloat(trimmed);
    const updated = participatingRows.map((r) =>
      r.rowId === rowId ? { ...r, sla_percent_allocation: parsed } : r,
    );
    syncRowsToParent(updated);
  };

  const handleDurationMinutesChange = (rowId: string, val: string) => {
    const trimmed = val.trim();
    const parsed =
      trimmed === "" ? null : Math.max(1, Number.parseInt(trimmed, 10));
    const updated = participatingRows.map((r) =>
      r.rowId === rowId
        ? {
            ...r,
            allocated_duration_minutes:
              parsed === null || Number.isNaN(parsed) ? null : parsed,
          }
        : r,
    );
    syncRowsToParent(updated);
  };

  const handleSplitEqually = () => {
    if (participatingRows.length === 0) return;
    const count = participatingRows.length;
    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;
    const updated = participatingRows.map((r, idx) => ({
      ...r,
      sla_percent_allocation: base + (idx < remainder ? 1 : 0),
      allocated_duration_minutes: r.allocated_duration_minutes ?? null,
    }));
    syncRowsToParent(updated);
  };

  const handleAutoBalance = () => {
    if (participatingRows.length === 0) return;
    if (participatingRows.length === 1) {
      syncRowsToParent([
        {
          ...participatingRows[0],
          sla_percent_allocation: 100,
          allocated_duration_minutes:
            participatingRows[0].allocated_duration_minutes ?? null,
        },
      ]);
      return;
    }
    const allExceptLast = participatingRows.slice(0, -1);
    const sumExceptLast = allExceptLast.reduce(
      (acc, r) => acc + (Number(r.sla_percent_allocation) || 0),
      0,
    );
    const lastRowRemaining = Math.max(0, 100 - sumExceptLast);
    const updated = [
      ...allExceptLast,
      {
        ...participatingRows[participatingRows.length - 1],
        sla_percent_allocation: lastRowRemaining,
        allocated_duration_minutes:
          participatingRows[participatingRows.length - 1]
            .allocated_duration_minutes ?? null,
      },
    ];
    syncRowsToParent(updated);
  };

  const handleStaggeredParallel = () => {
    if (participatingRows.length === 0) return;
    const updated = participatingRows.map((r) => ({
      ...r,
      sla_percent_allocation:
        r.involvement_type === "PRIMARY" || r.involvement_type === "EQUAL"
          ? 100
          : 50,
      allocated_duration_minutes: r.allocated_duration_minutes ?? null,
    }));
    syncRowsToParent(updated);
  };

  const handleFullConcurrent = () => {
    if (participatingRows.length === 0) return;
    const updated = participatingRows.map((r) => ({
      ...r,
      sla_percent_allocation: 100,
      allocated_duration_minutes: r.allocated_duration_minutes ?? null,
    }));
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

  // Topological sorting derivation & validation
  const activeNodesForTopologicalSort: DepartmentDependencyNode[] =
    useMemo(() => {
      return participatingRows
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
    }, [participatingRows]);

  const hasLeadOrEqualOwner = useMemo(() => {
    if (participatingRows.length === 0) return true;
    return participatingRows.some(
      (r) => r.involvement_type === "PRIMARY" || r.involvement_type === "EQUAL",
    );
  }, [participatingRows]);

  const topologicalResult = useMemo(() => {
    const primaryRow = participatingRows.find(
      (r) => r.involvement_type === "PRIMARY",
    );
    const equalRow = participatingRows.find(
      (r) => r.involvement_type === "EQUAL",
    );
    const leadRow = primaryRow || equalRow;
    const nonLeadRows = participatingRows.filter(
      (r) => r !== leadRow && r.department_name.trim() !== "",
    );

    return validateRoutingPolicy({
      primary_department_name: leadRow?.department_name || undefined,
      primary_department_id: leadRow?.department_id || undefined,
      supporting_departments: nonLeadRows.map((r) => r.department_name),
      dependency_type: "SEQUENTIAL",
      dependencies: activeNodesForTopologicalSort,
    });
  }, [participatingRows, activeNodesForTopologicalSort]);

  // Group derived order by stage
  const stagesGrouped = useMemo(() => {
    const map = new Map<number, DerivedOrderNode[]>();
    for (const item of topologicalResult.derivedOrder || []) {
      const st = item.stage ?? 1;
      const arr = map.get(st) || [];
      arr.push(item);
      map.set(st, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [topologicalResult]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl">
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
          <div>
            <label
              htmlFor="rule-name-input"
              className="block font-semibold text-slate-700"
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
                  : modalRuleType === "routing"
                    ? "e.g. Salary & Pay Primary Routing"
                    : modalRuleType === "sla"
                      ? "e.g. High Priority Resolution SLA"
                      : "e.g. Standard 72hr Reopen Policy"
              }
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
            />
          </div>

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
              {/* Rule-Level Execution Mode Selector */}
              <div className="space-y-1.5">
                <span className="block font-semibold text-slate-700 dark:text-slate-200 text-xs">
                  Rule Execution Mode *
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDependencyType?.("PARALLEL")}
                    className={`flex flex-col p-3 rounded-xl border text-left transition cursor-pointer ${
                      dependencyType === "PARALLEL"
                        ? "bg-teal-50/70 dark:bg-teal-950/50 border-teal-500 dark:border-teal-400 text-teal-900 dark:text-teal-200 font-semibold shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      ⚡ Parallel (Concurrent)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-1 leading-snug">
                      All participating departments activate simultaneously upon
                      assignment.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDependencyType?.("SEQUENTIAL")}
                    className={`flex flex-col p-3 rounded-xl border text-left transition cursor-pointer ${
                      dependencyType === "SEQUENTIAL"
                        ? "bg-teal-50/70 dark:bg-teal-950/50 border-teal-500 dark:border-teal-400 text-teal-900 dark:text-teal-200 font-semibold shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      ⛓️ Sequential (Dependency-Driven)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-1 leading-snug">
                      Departments activate only after configured prerequisite
                      departments resolve.
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="routing-cat-select"
                    className="block font-semibold text-slate-700"
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
                        className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedCatId("")}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <select
                      id="routing-cat-select"
                      value={selectedCatId}
                      required
                      onChange={(e) => {
                        setSelectedCatId(e.target.value);
                        setSelectedRoutingSubcatId("");
                      }}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                    >
                      <option value="">-- Select Category --</option>
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
                    htmlFor="routing-subcat-select"
                    className="block font-semibold text-slate-700"
                  >
                    Subcategory Scope *
                  </label>
                  {selectedRoutingSubcatId === "CUSTOM" ? (
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
                        onClick={() => setSelectedRoutingSubcatId("")}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <select
                      id="routing-subcat-select"
                      value={selectedRoutingSubcatId}
                      disabled={!selectedCatId}
                      required
                      onChange={(e) =>
                        setSelectedRoutingSubcatId(e.target.value)
                      }
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                    >
                      <option value="">-- Select Subcategory --</option>
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
                      {selectedCatId && (
                        <option value="CUSTOM">Custom (Add New)</option>
                      )}
                    </select>
                  )}
                </div>
              </div>

              {/* 3. Repeatable Participating Department Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      Participating Departments & Involvement Roles
                    </span>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      {participatingRows.length} department
                      {participatingRows.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddDepartment}
                    disabled={
                      participatingRows.length >= departments.length &&
                      departments.length > 0
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Department</span>
                  </button>
                </div>

                {participatingRows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="h-10 w-10 mx-auto rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        No Departments Added Yet
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Click &quot;Add Department&quot; above to select
                        participating departments and configure sequential
                        dependencies &amp; SLA allocations.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDepartment}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white transition cursor-pointer shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Department</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* SLA Allocation Tracker */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-3 space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {dependencyType === "PARALLEL"
                              ? "Parallel SLA Tracker (Concurrent Milestones per Department)"
                              : "SLA Allocation Tracker (Total must be 100%)"}
                          </span>
                          {dependencyType === "PARALLEL" ? (
                            participatingRows.every(
                              (r) =>
                                Number(r.sla_percent_allocation) > 0 &&
                                Number(r.sla_percent_allocation) <= 100,
                            ) ? (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                                ✓ Concurrent Milestones Configured
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                                ⚠ Set 1–100% per department
                              </span>
                            )
                          ) : Math.round(totalConfiguredPercent) === 100 ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                              ✓ Total: 100% (Balanced)
                            </span>
                          ) : totalConfiguredPercent > 100 ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 dark:text-rose-300">
                              ✕ Total: {totalConfiguredPercent}% (
                              {totalConfiguredPercent - 100}% over limit)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                              ⚠ Total: {totalConfiguredPercent}% (
                              {100 - totalConfiguredPercent}% unallocated)
                            </span>
                          )}
                        </div>

                        {participatingRows.length > 1 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {dependencyType === "PARALLEL" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={handleStaggeredParallel}
                                  className="rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition cursor-pointer"
                                  title="Primary Lead gets 100% resolution window; Supporting depts get 50% investigation milestone"
                                >
                                  ⚡ Staggered (100% Lead · 50% Support)
                                </button>
                                <button
                                  type="button"
                                  onClick={handleFullConcurrent}
                                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition cursor-pointer"
                                  title="All departments get 100% concurrent window"
                                >
                                  100% Each
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSplitEqually}
                                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition cursor-pointer"
                                >
                                  Split Equally
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={handleSplitEqually}
                                  className="rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition cursor-pointer"
                                >
                                  Split Equally
                                </button>
                                <button
                                  type="button"
                                  onClick={handleAutoBalance}
                                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 transition cursor-pointer"
                                >
                                  Balance to 100%
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {dependencyType === "SEQUENTIAL" && (
                        <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              Math.round(totalConfiguredPercent) === 100
                                ? "bg-emerald-500"
                                : totalConfiguredPercent > 100
                                  ? "bg-rose-500"
                                  : "bg-amber-500"
                            }`}
                            style={{
                              width: `${Math.min(100, Math.max(0, totalConfiguredPercent))}%`,
                            }}
                          />
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {dependencyType === "PARALLEL"
                          ? "In Parallel mode, all departments activate concurrently. Lead/Equal departments can have up to 100% resolution window while supporting departments have concurrent milestones (e.g. 50% for findings handover)."
                          : "Each participating department receives a percentage share of the grievance's overall SLA window. Total allocation across all departments must equal strictly 100%. Resolution durations are calculated dynamically at runtime according to the grievance's Priority SLA Policy."}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {participatingRows.map((row, index) => {
                        const candidateDepts = participatingRows.filter(
                          (other) =>
                            other.rowId !== row.rowId &&
                            other.department_name.trim() !== "",
                        );

                        return (
                          <div
                            key={row.rowId}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 space-y-3"
                          >
                            {/* Header of Department Card */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                  Department #{index + 1}
                                </span>
                                {row.involvement_type === "PRIMARY" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    PRIMARY LEAD
                                  </span>
                                ) : row.involvement_type === "EQUAL" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950/70 border border-purple-300 dark:border-purple-700/60 px-2 py-0.5 text-[10px] font-bold text-purple-800 dark:text-purple-300">
                                    ⚖ EQUAL CO-OWNER
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 dark:bg-sky-950/70 border border-sky-300 dark:border-sky-700/60 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:text-sky-300">
                                    SUPPORTING
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveDepartment(row.rowId)
                                }
                                disabled={participatingRows.length <= 1}
                                className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer"
                                title={
                                  participatingRows.length <= 1
                                    ? "At least one department is required"
                                    : "Remove department"
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Fields: Department & Involvement Type */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label
                                  htmlFor={`dept-select-${row.rowId}`}
                                  className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                                >
                                  Department *
                                </label>
                                <select
                                  id={`dept-select-${row.rowId}`}
                                  value={row.department_id}
                                  required
                                  onChange={(e) =>
                                    handleDepartmentChange(
                                      row.rowId,
                                      e.target.value,
                                    )
                                  }
                                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
                                >
                                  <option value="">
                                    -- Select Department --
                                  </option>
                                  {departments.map((d) => {
                                    const isAlready = participatingRows.some(
                                      (other) =>
                                        other.rowId !== row.rowId &&
                                        other.department_id === d.department_id,
                                    );
                                    return (
                                      <option
                                        key={d.department_id}
                                        value={d.department_id}
                                        disabled={isAlready}
                                      >
                                        {d.department_name}
                                        {isAlready ? " (already selected)" : ""}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              <div>
                                <label
                                  htmlFor={`involvement-select-${row.rowId}`}
                                  className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                                >
                                  Involvement Role *
                                </label>
                                <select
                                  id={`involvement-select-${row.rowId}`}
                                  value={row.involvement_type}
                                  required
                                  onChange={(e) =>
                                    handleInvolvementChange(
                                      row.rowId,
                                      e.target.value as
                                        | "PRIMARY"
                                        | "EQUAL"
                                        | "SUPPORT",
                                    )
                                  }
                                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
                                >
                                  <option value="PRIMARY">
                                    PRIMARY (Lead Owner)
                                  </option>
                                  <option value="EQUAL">
                                    EQUAL (Equal Co-owner)
                                  </option>
                                  <option value="SUPPORT">
                                    SUPPORT (Supporting)
                                  </option>
                                </select>
                              </div>
                            </div>

                            {/* Dependent Select / Prerequisites */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                  Dependent Select (Prerequisites):
                                </span>
                                {row.prerequisites.length === 0 ? (
                                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                                    ● Independent Starter (Stage 1)
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                                    Requires {row.prerequisites.length}{" "}
                                    prerequisite
                                    {row.prerequisites.length !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>

                              {candidateDepts.length === 0 ? (
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                                  Add another department using &quot;+ Add
                                  Department&quot; above to configure
                                  dependencies.
                                </p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {candidateDepts.map((cand) => {
                                    const isPrereq = row.prerequisites.includes(
                                      cand.department_name,
                                    );
                                    return (
                                      <button
                                        key={cand.rowId}
                                        type="button"
                                        onClick={() => {
                                          if (dependencyType !== "SEQUENTIAL") {
                                            setDependencyType?.("SEQUENTIAL");
                                          }
                                          handleTogglePrerequisite(
                                            row.rowId,
                                            cand.department_name,
                                          );
                                        }}
                                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition border cursor-pointer font-medium ${
                                          isPrereq
                                            ? "bg-amber-100 dark:bg-amber-950/70 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold shadow-2xs"
                                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                        }`}
                                      >
                                        <span
                                          className={
                                            isPrereq
                                              ? "text-amber-700 dark:text-amber-300"
                                              : "text-slate-400"
                                          }
                                        >
                                          {isPrereq
                                            ? "✓ Depends on"
                                            : "+ Depends on"}
                                        </span>
                                        <span className="font-semibold">
                                          {cand.department_name}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* SLA Allocation for this Department */}
                            <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-800 space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                  Department SLA Allocation:
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Percentage share &amp; optional fixed duration
                                  override
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label
                                    htmlFor={`sla-pct-${row.rowId}`}
                                    className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1"
                                  >
                                    SLA Window Share (%) *
                                  </label>
                                  <div className="relative">
                                    <input
                                      id={`sla-pct-${row.rowId}`}
                                      type="number"
                                      min="1"
                                      max="100"
                                      value={row.sla_percent_allocation ?? ""}
                                      onChange={(e) =>
                                        handleSlaPercentChange(
                                          row.rowId,
                                          e.target.value,
                                        )
                                      }
                                      placeholder="e.g. 50"
                                      className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 pr-8 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
                                    />
                                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-bold">
                                      %
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <label
                                    htmlFor={`sla-dur-${row.rowId}`}
                                    className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1"
                                  >
                                    Fixed Duration (minutes, optional)
                                  </label>
                                  <div className="relative">
                                    <input
                                      id={`sla-dur-${row.rowId}`}
                                      type="number"
                                      min="1"
                                      value={
                                        row.allocated_duration_minutes ?? ""
                                      }
                                      onChange={(e) =>
                                        handleDurationMinutesChange(
                                          row.rowId,
                                          e.target.value,
                                        )
                                      }
                                      placeholder="e.g. 120"
                                      className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 pr-10 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
                                    />
                                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-medium">
                                      min
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* 4. Execution Flow Visualization & Dependency Validation */}
              {dependencyType === "PARALLEL" ? (
                <div className="rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50/40 dark:bg-teal-950/30 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
                    <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                      Parallel Activation Summary
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    All configured departments activate concurrently at Stage 1
                    upon grievance assignment:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {participatingRows
                      .filter((r) => r.department_name)
                      .map((r) => (
                        <span
                          key={r.rowId}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 dark:border-teal-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                        >
                          <span className="font-semibold">
                            {r.department_name}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1 rounded ${
                              r.involvement_type === "PRIMARY"
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                                : r.involvement_type === "EQUAL"
                                  ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300"
                                  : "bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300"
                            }`}
                          >
                            {r.involvement_type}
                          </span>
                        </span>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Presets and DAG Validation status */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleLinearChain}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                      >
                        ⛓️ Linear Chain (1 → 2 → 3)
                      </button>
                      <button
                        type="button"
                        onClick={handleMakeAllIndependent}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                      >
                        ⚡ Make All Independent
                      </button>
                    </div>

                    {!topologicalResult.valid ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 dark:text-rose-300">
                        ⚠ Dependency Issue Detected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                        ✓ Valid DAG Workflow ({stagesGrouped.length} Stage
                        {stagesGrouped.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </div>

                  {!topologicalResult.valid && (
                    <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-2.5 text-xs text-rose-700 dark:text-rose-300">
                      {topologicalResult.errors[0] ||
                        "A circular dependency exists between the configured departments. Prerequisites must not loop."}
                    </div>
                  )}

                  {/* Derived Execution Flow Card */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Derived Execution Flow
                      </span>
                    </div>

                    {stagesGrouped.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                        Select departments to generate the execution flow.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {stagesGrouped.map(([stageNum, depts], sIdx) => (
                          <div key={stageNum} className="space-y-1.5">
                            {sIdx > 0 && (
                              <div className="flex items-center justify-center py-0.5 text-slate-400 dark:text-slate-500 text-xs">
                                <span>↓ then next stage activates</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs shadow-2xs">
                              <span className="rounded-md bg-teal-100 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 px-2 py-0.5 text-[10px] font-bold text-teal-800 dark:text-teal-300 whitespace-nowrap">
                                Stage {stageNum}
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {depts.map((d) => (
                                  <span
                                    key={d.department_name}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200"
                                  >
                                    <span className="font-semibold">
                                      {d.department_name}
                                    </span>
                                    <span
                                      className={`text-[9px] font-bold px-1 rounded ${
                                        d.involvement_type === "PRIMARY"
                                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                                          : d.involvement_type === "EQUAL"
                                            ? "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300"
                                            : "bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300"
                                      }`}
                                    >
                                      {d.involvement_type || "SUPPORT"}
                                    </span>
                                    {d.prerequisites &&
                                      d.prerequisites.length > 0 && (
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                          (after {d.prerequisites.join(" & ")})
                                        </span>
                                      )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                participatingRows.length > 0 &&
                !hasLeadOrEqualOwner && (
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Cannot have only supporting departments. At least one must
                    be Primary or Equal.
                  </span>
                )}
              {modalRuleType === "routing" &&
                participatingRows.length > 0 &&
                hasLeadOrEqualOwner &&
                dependencyType === "SEQUENTIAL" &&
                Math.round(totalConfiguredPercent) !== 100 && (
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Sequential SLA total must equal 100% (currently{" "}
                    {totalConfiguredPercent}%)
                  </span>
                )}
              {modalRuleType === "routing" &&
                participatingRows.length > 0 &&
                dependencyType === "PARALLEL" &&
                participatingRows.some(
                  (r) =>
                    (Number(r.sla_percent_allocation) || 0) <= 0 ||
                    (Number(r.sla_percent_allocation) || 0) > 100,
                ) && (
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Each parallel department SLA must be between 1% and 100%
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
                    (!selectedDeptId ||
                      !selectedCatId ||
                      !selectedRoutingSubcatId ||
                      participatingRows.length === 0 ||
                      !hasLeadOrEqualOwner ||
                      (dependencyType === "SEQUENTIAL" &&
                        Math.round(totalConfiguredPercent) !== 100) ||
                      (dependencyType === "PARALLEL" &&
                        participatingRows.some(
                          (r) =>
                            (Number(r.sla_percent_allocation) || 0) <= 0 ||
                            (Number(r.sla_percent_allocation) || 0) > 100,
                        ))))
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
