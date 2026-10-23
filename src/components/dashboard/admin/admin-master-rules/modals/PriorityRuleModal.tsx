"use client";

import { Loader2, X } from "lucide-react";
import { isPurelyNumeric, type PriorityRuleModalProps } from "./types";

export function PriorityRuleModal({
  open,
  onClose,
  editingRuleId,
  ruleStatus,
  setRuleStatus,
  ruleName,
  setRuleName,
  priorityLevel,
  setPriorityLevel,
  ruleOrder: _ruleOrder,
  setRuleOrder: _setRuleOrder,
  isDefault,
  setIsDefault,
  selectedPriorityCatId,
  setSelectedPriorityCatId,
  selectedPrioritySubcatId,
  setSelectedPrioritySubcatId,
  keywords = "",
  setKeywords,
  categories,
  newCategoryName,
  setNewCategoryName,
  newSubcategoryName,
  setNewSubcategoryName,
  isSubmitting,
  onSubmit,
}: PriorityRuleModalProps) {
  if (!open) return null;

  const isRuleNameNumeric = isPurelyNumeric(ruleName);
  const isCategoryNumeric =
    selectedPriorityCatId === "CUSTOM" && isPurelyNumeric(newCategoryName);
  const isSubcategoryNumeric =
    selectedPrioritySubcatId === "CUSTOM" &&
    isPurelyNumeric(newSubcategoryName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl transition-all duration-200">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editingRuleId ? "Edit Priority Rule" : "Configure Priority Rule"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Define automated priority triage based on grievance category,
              subcategory, and keyword triggers.
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
          <div>
            <label
              htmlFor="priority-rule-name-input"
              className="block font-semibold text-slate-700 dark:text-slate-300"
            >
              Policy Rule Name *
            </label>
            <input
              id="priority-rule-name-input"
              type="text"
              required
              placeholder="e.g. Critical Safety Escalation"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className={`mt-1 h-9 w-full rounded-xl border ${
                isRuleNameNumeric
                  ? "border-rose-500 focus:border-rose-600"
                  : "border-slate-200 dark:border-slate-700 focus:border-teal-600"
              } bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition`}
            />
            {isRuleNameNumeric && (
              <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                Rule name cannot consist of only numbers. It must include
                letters or an alphanumeric combination.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="priority-level-select"
                className="block font-semibold text-slate-700 dark:text-slate-300"
              >
                Assigned Priority *
              </label>
              <select
                id="priority-level-select"
                value={priorityLevel}
                onChange={(e) => setPriorityLevel(e.target.value)}
                className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
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
                  className="rounded border-slate-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Default Fallback Rule
                </span>
              </label>
            </div>

            {!isDefault && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="prio-cat-select"
                    className="block font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Category Scope {!keywords.trim() && "*"}
                  </label>
                  {selectedPriorityCatId === "CUSTOM" ? (
                    <div className="space-y-1">
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Enter custom category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          required
                          className={`h-9 w-full rounded-xl border ${
                            isCategoryNumeric
                              ? "border-rose-500 focus:border-rose-600"
                              : "border-slate-200 dark:border-slate-700 focus:border-teal-600"
                          } bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition`}
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedPriorityCatId("")}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                      {isCategoryNumeric && (
                        <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          Category name cannot consist of only numbers.
                        </p>
                      )}
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
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
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
                    <div className="space-y-1">
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Enter custom subcategory name"
                          value={newSubcategoryName}
                          onChange={(e) =>
                            setNewSubcategoryName(e.target.value)
                          }
                          required
                          className={`h-9 w-full rounded-xl border ${
                            isSubcategoryNumeric
                              ? "border-rose-500 focus:border-rose-600"
                              : "border-slate-200 dark:border-slate-700 focus:border-teal-600"
                          } bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition`}
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedPrioritySubcatId("")}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                      {isSubcategoryNumeric && (
                        <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          Subcategory name cannot consist of only numbers.
                        </p>
                      )}
                    </div>
                  ) : (
                    <select
                      id="prio-subcat-select"
                      value={selectedPrioritySubcatId}
                      disabled={!selectedPriorityCatId}
                      onChange={(e) =>
                        setSelectedPrioritySubcatId(e.target.value)
                      }
                      className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600 disabled:opacity-50"
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
                    {!selectedPriorityCatId && !isDefault ? "*" : "(Optional)"}
                  </label>
                  <input
                    id="prio-keywords-input"
                    type="text"
                    placeholder="e.g. emergency, ragging, hazard, leak (comma-separated)"
                    value={keywords}
                    onChange={(e) => setKeywords?.(e.target.value)}
                    required={!isDefault && !selectedPriorityCatId}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                    {selectedPriorityCatId
                      ? "Optional: Leave empty to apply to all grievances in this category, or enter keywords to narrow down."
                      : !isDefault
                        ? "Required when 'All Categories' is selected. Scans grievance title and description."
                        : "Matches case-insensitively against grievance title and description."}
                  </span>
                </div>
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
                  isRuleNameNumeric ||
                  (selectedPriorityCatId === "CUSTOM" &&
                    (!newCategoryName.trim() || isCategoryNumeric)) ||
                  (selectedPrioritySubcatId === "CUSTOM" &&
                    (!newSubcategoryName.trim() || isSubcategoryNumeric)) ||
                  (!isDefault && !selectedPriorityCatId && !keywords.trim())
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
