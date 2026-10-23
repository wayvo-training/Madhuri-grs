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
import { type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DepartmentDependencyNode } from "@/lib/validations/dependency-graph";
import type {
  ParticipatingDepartmentRow,
  RoutingRuleModalProps,
} from "./types";

export function RoutingRuleModal({
  open,
  onClose,
  editingRuleId,
  ruleStatus,
  setRuleStatus,
  ruleName,
  setRuleName,
  selectedDeptId,
  setSelectedDeptId,
  selectedCatId,
  setSelectedCatId,
  selectedRoutingSubcatId,
  setSelectedRoutingSubcatId,
  selectedSupportingDepts,
  setSelectedSupportingDepts,
  dependencyType = "PARALLEL",
  setDependencyType,
  sequentialDependencies = [],
  setSequentialDependencies,
  departments,
  categories,
  newCategoryName,
  setNewCategoryName,
  newSubcategoryName,
  setNewSubcategoryName,
  isSubmitting,
  onSubmit,
}: RoutingRuleModalProps) {
  const [routingScope, setRoutingScope] = useState<"SINGLE" | "MULTI">(
    "SINGLE",
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [participatingRows, setParticipatingRows] = useState<
    ParticipatingDepartmentRow[]
  >([]);
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
    if (!open) {
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

    // 1. Only populate if initialLeadDeptId exists or there are supporting departments
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
      // MULTI scope: clear out so user can choose cleanly
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

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetIndex: number) => {
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

    if (newType === "PRIMARY") {
      updated = updated.map((r) =>
        r.rowId !== rowId && r.involvement_type === "PRIMARY"
          ? { ...r, involvement_type: "SUPPORT" as const }
          : r,
      );
    }

    syncRowsToParent(updated);
  };

  const handleRemoveDepartment = (rowId: string) => {
    const removedRow = participatingRows.find((r) => r.rowId === rowId);
    const removedName = removedRow?.department_name;

    let updated = participatingRows.filter((r) => r.rowId !== rowId);

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl transition-all duration-200">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editingRuleId ? "Edit Routing Rule" : "Configure Routing Rule"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Define category-to-department assignments, single/multi routing,
              and execution workflows.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4 text-xs">
          <div className="space-y-4">
            {/* Row 1: Policy Rule Name (Left) + Department Routing Scope (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="routing-rule-name-input"
                  className="block font-semibold text-slate-700 dark:text-slate-200 text-xs"
                >
                  Policy Rule Name *
                </label>
                <input
                  id="routing-rule-name-input"
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
                        className="flex h-9.5 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
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
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        required
                        className="h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedRoutingSubcatId("")}
                        className="flex h-9.5 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
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
              /* 4. Multi-Department Configuration (2-Column Board Layout) */
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
                            Select departments and arrange them in the execution
                            order. Configure SLA and role for each department.
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
                          const isPrimary = row.involvement_type === "PRIMARY";
                          const isFirst = index === 0;
                          const isLast = index === participatingRows.length - 1;

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

                                  {/* Controls: Reorder arrows & Trash */}
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
                                    {row.department_name || "Select Department"}
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
                                        value={row.sla_percent_allocation ?? ""}
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

                                <div className="shrink-0">
                                  {getDepartmentIcon(d.department_name)}
                                </div>

                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {d.department_name}
                                </span>
                              </div>

                              <div className="shrink-0 ml-2">
                                {isSelected ? (
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      participatingRows.find(
                                        (r) =>
                                          r.department_id === d.department_id ||
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

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            {editingRuleId && setRuleStatus && (
              <button
                type="button"
                onClick={() =>
                  setRuleStatus(ruleStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE")
                }
                className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition cursor-pointer ${
                  ruleStatus === "ACTIVE"
                    ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                    : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                {ruleStatus === "ACTIVE" ? "Deactivate" : "Activate"}
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {routingScope === "MULTI" && participatingRows.length < 2 && (
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Multi-department rules require at least 2 participating
                  departments.
                </span>
              )}
              {routingScope === "MULTI" &&
                participatingRows.length >= 2 &&
                !participatingRows.some(
                  (r) => r.involvement_type === "PRIMARY",
                ) && (
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    A Primary Department is mandatory. Please select one
                    department as Primary.
                  </span>
                )}
              {routingScope === "MULTI" &&
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
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !ruleName.trim() ||
                  !selectedCatId ||
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
                            (r) => (Number(r.sla_percent_allocation) || 0) <= 0,
                          )))))
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
