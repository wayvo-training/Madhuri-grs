import { Loader2, X } from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  type DepartmentDependencyNode,
  validateRoutingPolicy,
} from "@/lib/validations/dependency-graph";
import type { ModalRuleType } from "@/types/admin/master-rules";

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

  departments: RuleDepartmentOption[];
  categories: RuleCategoryOption[];
  onSubmit: (event: FormEvent) => void;
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
  departmentalAllocationMode = "FULL",
  setDepartmentalAllocationMode,
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

  departments,
  categories,
  onSubmit,
}: AdminRuleConfigModalProps) {
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
                      htmlFor="prio-subcat-select"
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
                          onChange={(e) =>
                            setNewSubcategoryName(e.target.value)
                          }
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
                        id="prio-subcat-select"
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

                  <div className="col-span-2">
                    <label
                      htmlFor="prio-keywords-input"
                      className="block font-semibold text-slate-700"
                    >
                      Trigger Keywords (Optional)
                    </label>
                    <input
                      id="prio-keywords-input"
                      type="text"
                      placeholder="e.g. emergency, ragging, hazard, leak (comma-separated)"
                      value={keywords}
                      onChange={(e) => setKeywords?.(e.target.value)}
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Matches case-insensitively against grievance title and
                      description.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {modalRuleType === "routing" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="dept-target-select"
                    className="block font-semibold text-slate-700"
                  >
                    Primary Lead Department *
                  </label>
                  <select
                    id="dept-target-select"
                    value={selectedDeptId}
                    required
                    onChange={(e) => {
                      setSelectedDeptId(e.target.value);
                      setSelectedSupportingDepts((prev) =>
                        prev.filter((d) => {
                          const dept = departments.find(
                            (item) => item.department_id === e.target.value,
                          );
                          return dept ? d !== dept.department_name : true;
                        }),
                      );
                    }}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block font-semibold text-slate-700 dark:text-slate-300">
                    Lead Role Assignment
                  </span>
                  <div className="mt-1 flex h-9 w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/40 dark:border-emerald-800/60 px-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      PRIMARY (Lead Owner)
                    </span>
                    <span className="rounded-md bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 tracking-wider">
                      Fixed Lead
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Routing rule defines the primary accountable lead
                    department.
                  </p>
                </div>
              </div>

              {/* SLA Policy Architecture Notice */}
              <div className="rounded-xl border border-sky-200/80 dark:border-sky-800/50 bg-sky-50/60 dark:bg-sky-950/30 p-2.5 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <span className="text-sm">ℹ️</span>
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    SLA Architecture Notice:
                  </span>{" "}
                  Routing rules determine participating departments and workflow
                  dependencies. Overall SLA duration targets and department time
                  allocations are defined under the{" "}
                  <strong>SLA Policy tab</strong>.
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

              <div>
                <span className="block font-semibold text-slate-700 mb-1">
                  Supporting Department(s)
                </span>
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
                            setSelectedSupportingDepts((prev) => {
                              const updated = isChecked
                                ? prev.filter(
                                    (name) => name !== d.department_name,
                                  )
                                : [...prev, d.department_name];
                              return updated;
                            });
                          }}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition border cursor-pointer ${
                            isChecked
                              ? "bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700/60 text-sky-700 dark:text-sky-300 font-semibold"
                              : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isChecked
                                ? "bg-sky-500 dark:bg-sky-400"
                                : "bg-slate-300 dark:bg-slate-500"
                            }`}
                          />
                          {d.department_name}
                        </button>
                      );
                    })}
                </div>
              </div>

              {selectedSupportingDepts.length > 0 && setDependencyType && (
                <div className="space-y-3">
                  <div>
                    <span className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5 text-xs">
                      Multi-Department Collaboration Mode
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDependencyType("PARALLEL")}
                        className={`flex flex-col p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          dependencyType === "PARALLEL"
                            ? "bg-sky-50 dark:bg-sky-950/60 border-sky-400 text-sky-900 dark:text-sky-200 font-semibold shadow-2xs"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        <span className="text-xs font-bold flex items-center gap-1">
                          ⚡ Concurrent (Parallel)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                          Lead and supporting departments work simultaneously.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDependencyType("SEQUENTIAL");
                          // Ensure sequential dependencies are initialized
                          if (
                            setSequentialDependencies &&
                            sequentialDependencies.length === 0
                          ) {
                            const leadName =
                              departments.find(
                                (d) => d.department_id === selectedDeptId,
                              )?.department_name || "";
                            setSequentialDependencies(
                              selectedSupportingDepts.map((name, i) => ({
                                department_name: name,
                                execution_order: i + 2,
                                prerequisites: leadName ? [leadName] : [],
                              })),
                            );
                          }
                        }}
                        className={`flex flex-col p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          dependencyType === "SEQUENTIAL"
                            ? "bg-sky-50 dark:bg-sky-950/60 border-sky-400 text-sky-900 dark:text-sky-200 font-semibold shadow-2xs"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                        }`}
                      >
                        <span className="text-xs font-bold flex items-center gap-1">
                          ⏳ Sequential (Step-by-Step)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                          Supporting departments activate in configured order
                          after prerequisites finish.
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Sequential Workflow & Dependency Builder */}
                  {dependencyType === "SEQUENTIAL" && (
                    <div className="rounded-xl border border-amber-200/80 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                            Sequential Execution & Prerequisites Workflow
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Configure execution stages and prerequisites for
                            each participating department.
                          </p>
                        </div>
                        {setSequentialDependencies && (
                          <button
                            type="button"
                            onClick={() => {
                              const leadName =
                                departments.find(
                                  (d) => d.department_id === selectedDeptId,
                                )?.department_name || "";
                              setSequentialDependencies(
                                selectedSupportingDepts.map((name, idx) => ({
                                  department_name: name,
                                  execution_order: idx + 2,
                                  prerequisites:
                                    idx === 0
                                      ? leadName
                                        ? [leadName]
                                        : []
                                      : [selectedSupportingDepts[idx - 1]],
                                })),
                              );
                            }}
                            className="rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-50 shadow-2xs transition"
                          >
                            ⚡ Auto-Cascade (Linear Chain)
                          </button>
                        )}
                      </div>

                      {/* Step 1: Fixed Lead Department */}
                      <div className="flex items-center justify-between rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/40 p-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-2xs">
                            1
                          </span>
                          <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                            {departments.find(
                              (d) => d.department_id === selectedDeptId,
                            )?.department_name || "Lead Department"}
                          </span>
                          <span className="rounded bg-emerald-200/70 dark:bg-emerald-900 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                            Primary Lead
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Initiates Workflow · 0 Prerequisites
                        </span>
                      </div>

                      {/* Supporting Departments Dependencies List */}
                      <div className="space-y-2">
                        {selectedSupportingDepts.map((suppName, idx) => {
                          const leadName =
                            departments.find(
                              (d) => d.department_id === selectedDeptId,
                            )?.department_name || "";
                          const currentDep = sequentialDependencies.find(
                            (d) =>
                              d.department_name.toLowerCase() ===
                              suppName.toLowerCase(),
                          ) || {
                            department_name: suppName,
                            execution_order: idx + 2,
                            prerequisites: leadName ? [leadName] : [],
                          };

                          const availablePrereqs = [
                            ...(leadName ? [leadName] : []),
                            ...selectedSupportingDepts.filter(
                              (s) => s !== suppName,
                            ),
                          ];

                          return (
                            <div
                              key={suppName}
                              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs shadow-2xs space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-2xs">
                                    {currentDep.execution_order}
                                  </span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                                    {suppName}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <label
                                    htmlFor={`order-select-${suppName}`}
                                    className="text-[11px] text-slate-500"
                                  >
                                    Step:
                                  </label>
                                  <select
                                    id={`order-select-${suppName}`}
                                    value={currentDep.execution_order}
                                    onChange={(e) => {
                                      const newOrder = Number.parseInt(
                                        e.target.value,
                                        10,
                                      );
                                      if (setSequentialDependencies) {
                                        setSequentialDependencies((prev) => {
                                          const exists = prev.some(
                                            (d) =>
                                              d.department_name.toLowerCase() ===
                                              suppName.toLowerCase(),
                                          );
                                          if (exists) {
                                            return prev.map((d) =>
                                              d.department_name.toLowerCase() ===
                                              suppName.toLowerCase()
                                                ? {
                                                    ...d,
                                                    execution_order: newOrder,
                                                  }
                                                : d,
                                            );
                                          }
                                          return [
                                            ...prev,
                                            {
                                              department_name: suppName,
                                              execution_order: newOrder,
                                              prerequisites:
                                                currentDep.prerequisites,
                                            },
                                          ];
                                        });
                                      }
                                    }}
                                    className="h-6 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 text-xs text-slate-800 dark:text-slate-200 outline-none"
                                  >
                                    {[2, 3, 4, 5, 6, 7, 8, 9, 10]
                                      .slice(
                                        0,
                                        selectedSupportingDepts.length + 1,
                                      )
                                      .map((stepNum) => (
                                        <option key={stepNum} value={stepNum}>
                                          Step {stepNum}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              </div>

                              <div>
                                <span className="block text-[11px] font-medium text-slate-500 mb-1">
                                  Waits for Completion of:
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {availablePrereqs.map((prereqName) => {
                                    const isPrereq =
                                      currentDep.prerequisites.some(
                                        (p) =>
                                          p.toLowerCase() ===
                                          prereqName.toLowerCase(),
                                      );
                                    return (
                                      <button
                                        key={prereqName}
                                        type="button"
                                        onClick={() => {
                                          if (setSequentialDependencies) {
                                            setSequentialDependencies(
                                              (prev) => {
                                                const newPrereqs = isPrereq
                                                  ? currentDep.prerequisites.filter(
                                                      (p) =>
                                                        p.toLowerCase() !==
                                                        prereqName.toLowerCase(),
                                                    )
                                                  : [
                                                      ...currentDep.prerequisites,
                                                      prereqName,
                                                    ];

                                                const exists = prev.some(
                                                  (d) =>
                                                    d.department_name.toLowerCase() ===
                                                    suppName.toLowerCase(),
                                                );
                                                if (exists) {
                                                  return prev.map((d) =>
                                                    d.department_name.toLowerCase() ===
                                                    suppName.toLowerCase()
                                                      ? {
                                                          ...d,
                                                          prerequisites:
                                                            newPrereqs,
                                                        }
                                                      : d,
                                                  );
                                                }
                                                return [
                                                  ...prev,
                                                  {
                                                    department_name: suppName,
                                                    execution_order:
                                                      currentDep.execution_order,
                                                    prerequisites: newPrereqs,
                                                  },
                                                ];
                                              },
                                            );
                                          }
                                        }}
                                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs transition border cursor-pointer ${
                                          isPrereq
                                            ? "bg-amber-100 dark:bg-amber-900/60 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-semibold"
                                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100"
                                        }`}
                                      >
                                        <span>{isPrereq ? "✓" : "+"}</span>
                                        {prereqName}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Real-time DAG & Prerequisite Validation Result Indicator */}
                      {(() => {
                        const leadName =
                          departments.find(
                            (d) => d.department_id === selectedDeptId,
                          )?.department_name || "";
                        const val = validateRoutingPolicy({
                          primary_department_name: leadName,
                          primary_department_id: selectedDeptId,
                          supporting_departments: selectedSupportingDepts,
                          dependency_type: "SEQUENTIAL",
                          dependencies: sequentialDependencies,
                        });

                        if (!val.valid) {
                          return (
                            <div className="rounded-lg border border-rose-300 bg-rose-50/80 dark:bg-rose-950/40 p-2 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-1.5">
                              <span className="font-bold">⚠️</span>
                              <div>
                                <span className="font-semibold">
                                  Validation Error:
                                </span>{" "}
                                {val.errors[0]}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/30 p-2 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <span className="font-bold">✓</span>
                            <span>
                              Valid execution sequence: Verified Directed
                              Acyclic Graph (DAG) with no circular dependencies.
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {modalRuleType === "sla" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="sla-priority-select"
                    className="block font-semibold text-slate-700"
                  >
                    Priority Tier Scope *
                  </label>
                  <select
                    id="sla-priority-select"
                    value={priorityLevel}
                    onChange={(e) => setPriorityLevel(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
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
                    className="block font-semibold text-slate-700"
                  >
                    Target Duration (Hours) *
                  </label>
                  <input
                    id="target-duration-input"
                    type="number"
                    min="1"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 mb-2.5">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    SLA Thresholds
                  </span>
                  <span className="text-[11px] text-slate-500">
                    4-Tier notification & escalation triggers
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label
                      htmlFor="warning-percent-input"
                      className="block font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Warning Threshold (%) *
                    </label>
                    <input
                      id="warning-percent-input"
                      type="number"
                      min="1"
                      max="99"
                      value={warningPercent}
                      onChange={(e) => setWarningPercent(e.target.value)}
                      placeholder="50"
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-emerald-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Staff notification
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="at-risk-percent-input"
                      className="block font-semibold text-slate-700 dark:text-slate-300"
                    >
                      At Risk Threshold (%) *
                    </label>
                    <input
                      id="at-risk-percent-input"
                      type="number"
                      min="1"
                      max="99"
                      value={atRiskPercent}
                      onChange={(e) => setAtRiskPercent?.(e.target.value)}
                      placeholder="75"
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-emerald-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Staff + Dept Head
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="critical-percent-input"
                      className="block font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Critical Threshold (%) *
                    </label>
                    <input
                      id="critical-percent-input"
                      type="number"
                      min="1"
                      max="99"
                      value={criticalPercent}
                      onChange={(e) => setCriticalPercent?.(e.target.value)}
                      placeholder="90"
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-emerald-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Staff + Head + Urgent
                    </span>
                  </div>

                  <div>
                    <label
                      htmlFor="escalation-percent-input"
                      className="block font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Breach Threshold (%) *
                    </label>
                    <input
                      id="escalation-percent-input"
                      type="number"
                      min="100"
                      value={escalationPercent}
                      onChange={(e) => setEscalationPercent(e.target.value)}
                      placeholder="100"
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-emerald-600"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Breached + Escalated
                    </span>
                  </div>
                </div>
              </div>

              {/* Departmental SLA Allocation Strategy (Correction 2) */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    Departmental SLA Allocation Mode
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Multi-department apportionment rule
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepartmentalAllocationMode?.("FULL")}
                    className={`flex flex-col p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      departmentalAllocationMode === "FULL"
                        ? "bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-900 dark:text-teal-200 font-semibold shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-xs font-bold">100% Full Window</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                      Each department receives 100% of the SLA duration. (Ideal
                      for Parallel workflows)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDepartmentalAllocationMode?.("EQUAL_SPLIT")
                    }
                    className={`flex flex-col p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      departmentalAllocationMode === "EQUAL_SPLIT"
                        ? "bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-900 dark:text-teal-200 font-semibold shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-xs font-bold">
                      Equal Sequential Split
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                      Overall target hours divided equally across sequential
                      department stages.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDepartmentalAllocationMode?.("LEAD_WEIGHTED")
                    }
                    className={`flex flex-col p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      departmentalAllocationMode === "LEAD_WEIGHTED"
                        ? "bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-900 dark:text-teal-200 font-semibold shadow-2xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-xs font-bold">
                      Weighted (60% / 40%)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                      Primary Lead receives 60% of SLA time; supporting
                      departments share 40%.
                    </span>
                  </button>
                </div>

                {/* Calculation preview explanation */}
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2 text-2xs text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    SLA Allocation Preview ({durationHours || "24"}h Target):
                  </span>{" "}
                  {departmentalAllocationMode === "FULL"
                    ? `Each participating department receives ${durationHours || "24"} hours.`
                    : departmentalAllocationMode === "EQUAL_SPLIT"
                      ? `In a 2-department workflow, each department receives ${(Number(durationHours || 24) / 2).toFixed(1)} hours.`
                      : `Lead receives ${(Number(durationHours || 24) * 0.6).toFixed(1)} hours; supporting departments split ${(Number(durationHours || 24) * 0.4).toFixed(1)} hours.`}
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
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
                      !selectedRoutingSubcatId))
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] disabled:opacity-50"
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
