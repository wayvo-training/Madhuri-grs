import { AlertTriangle, Loader2, X } from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";

import type { ModalRuleType } from "@/components/dashboard/admin/admin-rules-panels";

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

export interface RuleFeedback {
  type: "success" | "error";
  text: string;
}

interface AdminRuleConfigModalProps {
  open: boolean;
  onClose: () => void;
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
  involvementType: string;
  setInvolvementType: Dispatch<SetStateAction<string>>;
  selectedSupportingDepts: string[];
  setSelectedSupportingDepts: Dispatch<SetStateAction<string[]>>;
  selectedPriorityCatId: string;
  setSelectedPriorityCatId: Dispatch<SetStateAction<string>>;
  selectedPrioritySubcatId: string;
  setSelectedPrioritySubcatId: Dispatch<SetStateAction<string>>;
  durationHours: string;
  setDurationHours: Dispatch<SetStateAction<string>>;
  warningPercent: string;
  setWarningPercent: Dispatch<SetStateAction<string>>;
  escalationPercent: string;
  setEscalationPercent: Dispatch<SetStateAction<string>>;
  reopenWindowHours: string;
  setReopenWindowHours: Dispatch<SetStateAction<string>>;
  maxReopens: string;
  setMaxReopens: Dispatch<SetStateAction<string>>;
  maxReviews: string;
  setMaxReviews: Dispatch<SetStateAction<string>>;
  ruleStatus: "ACTIVE" | "INACTIVE";
  setRuleStatus: Dispatch<SetStateAction<"ACTIVE" | "INACTIVE">>;
  isSubmitting: boolean;
  feedback: RuleFeedback | null;
  departments: RuleDepartmentOption[];
  categories: RuleCategoryOption[];
  onSubmit: (event: FormEvent) => void;
}

export function AdminRuleConfigModal({
  open,
  onClose,
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
  involvementType,
  setInvolvementType,
  selectedSupportingDepts,
  setSelectedSupportingDepts,
  selectedPriorityCatId,
  setSelectedPriorityCatId,
  selectedPrioritySubcatId,
  setSelectedPrioritySubcatId,
  durationHours,
  setDurationHours,
  warningPercent,
  setWarningPercent,
  escalationPercent,
  setEscalationPercent,
  reopenWindowHours,
  setReopenWindowHours,
  maxReopens,
  setMaxReopens,
  maxReviews,
  setMaxReviews,
  ruleStatus,
  setRuleStatus,
  isSubmitting,
  feedback,
  departments,
  categories,
  onSubmit,
}: AdminRuleConfigModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Configure Policy Rule
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Define automated triage, routing pathways, resolution SLAs, or
              reopen parameters.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setModalRuleType("routing")}
            className={`flex-1 rounded-lg py-1.5 text-center transition ${
              modalRuleType === "routing"
                ? "bg-white text-[#064E3B] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Routing Rule
          </button>
          <button
            type="button"
            onClick={() => setModalRuleType("priority")}
            className={`flex-1 rounded-lg py-1.5 text-center transition ${
              modalRuleType === "priority"
                ? "bg-white text-[#064E3B] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Priority Rule
          </button>
          <button
            type="button"
            onClick={() => setModalRuleType("sla")}
            className={`flex-1 rounded-lg py-1.5 text-center transition ${
              modalRuleType === "sla"
                ? "bg-white text-[#064E3B] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            SLA Policy
          </button>
          <button
            type="button"
            onClick={() => setModalRuleType("reopen")}
            className={`flex-1 rounded-lg py-1.5 text-center transition ${
              modalRuleType === "reopen"
                ? "bg-white text-[#064E3B] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
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
                      Category Scope *
                    </label>
                    <select
                      id="prio-cat-select"
                      value={selectedPriorityCatId}
                      required={!isDefault}
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
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="prio-subcat-select"
                      className="block font-semibold text-slate-700"
                    >
                      Subcategory Scope
                    </label>
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
                    </select>
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
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                  >
                    <option value="PRIMARY">PRIMARY (Lead Owner)</option>
                    <option value="SUPPORTING">
                      SUPPORTING (Collaborator)
                    </option>
                  </select>
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
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="routing-subcat-select"
                    className="block font-semibold text-slate-700"
                  >
                    Subcategory Scope *
                  </label>
                  <select
                    id="routing-subcat-select"
                    value={selectedRoutingSubcatId}
                    disabled={!selectedCatId}
                    required
                    onChange={(e) => setSelectedRoutingSubcatId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                  >
                    <option value="">-- Select Subcategory --</option>
                    {categories
                      .find((c) => c.category_id === selectedCatId)
                      ?.subcategories?.map((s) => (
                        <option key={s.subcategory_id} value={s.subcategory_id}>
                          {s.subcategory_name}
                        </option>
                      ))}
                  </select>
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
                </div>
              </div>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="warning-percent-input"
                    className="block font-semibold text-slate-700"
                  >
                    Warning Warning Threshold (%) *
                  </label>
                  <input
                    id="warning-percent-input"
                    type="number"
                    min="1"
                    max="99"
                    value={warningPercent}
                    onChange={(e) => setWarningPercent(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="escalation-percent-input"
                    className="block font-semibold text-slate-700"
                  >
                    Escalation Breach Threshold (%) *
                  </label>
                  <input
                    id="escalation-percent-input"
                    type="number"
                    min="100"
                    value={escalationPercent}
                    onChange={(e) => setEscalationPercent(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {modalRuleType === "reopen" && (
            <div className="space-y-4">
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

          <div>
            <span className="block font-semibold text-slate-700 mb-1.5">
              Initial Status
            </span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="ruleStatus"
                  checked={ruleStatus === "ACTIVE"}
                  onChange={() => setRuleStatus("ACTIVE")}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-800 font-medium">Active</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="ruleStatus"
                  checked={ruleStatus === "INACTIVE"}
                  onChange={() => setRuleStatus("INACTIVE")}
                  className="text-slate-600 focus:ring-slate-500"
                />
                <span className="text-slate-800 font-medium">Deactivated</span>
              </label>
            </div>
          </div>

          {feedback && (
            <div
              className={`rounded-xl p-3 text-xs ${
                feedback.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Policy</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ConfirmRuleDeleteModalProps {
  open: boolean;
  onClose: () => void;
  ruleName: string;
  onConfirm: () => void;
}

export function ConfirmRuleDeleteModal({
  open,
  onClose,
  ruleName,
  onConfirm,
}: ConfirmRuleDeleteModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-4 ring-rose-50/50">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Confirm Rule Deletion
            </h3>
            <p className="text-xs text-slate-500">
              This action requires explicit administrative confirmation.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-700 leading-relaxed">
          Are you sure you want to delete{" "}
          <strong className="text-slate-900">&lsquo;{ruleName}&rsquo;</strong>?
          This will deactivate the rule and remove it from live triage
          evaluation. Historical audit records will be preserved.
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Yes, Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
