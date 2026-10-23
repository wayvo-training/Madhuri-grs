"use client";

import { Loader2, X } from "lucide-react";
import type { ReopenPolicyModalProps } from "./types";

export function ReopenPolicyModal({
  open,
  onClose,
  editingRuleId,
  ruleStatus,
  setRuleStatus,
  ruleName,
  setRuleName,
  selectedPriorityCatId,
  setSelectedPriorityCatId,
  selectedPrioritySubcatId,
  setSelectedPrioritySubcatId,
  reopenWindowHours,
  setReopenWindowHours,
  maxReopens,
  setMaxReopens,
  maxReviews,
  setMaxReviews,
  categories,
  newCategoryName,
  setNewCategoryName,
  newSubcategoryName,
  setNewSubcategoryName,
  isSubmitting,
  onSubmit,
}: ReopenPolicyModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl transition-all duration-200">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editingRuleId ? "Edit Reopen Policy" : "Configure Reopen Policy"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Define grievance reopen allowances, cooling-off windows, and
              maximum review thresholds.
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
              htmlFor="reopen-rule-name-input"
              className="block font-semibold text-slate-700 dark:text-slate-300"
            >
              Policy Rule Name *
            </label>
            <input
              id="reopen-rule-name-input"
              type="text"
              required
              placeholder="e.g. Standard 72hr Reopen Policy"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
            />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="reopen-cat-select"
                  className="block font-semibold text-slate-700 dark:text-slate-300"
                >
                  Category Scope
                </label>
                {selectedPriorityCatId === "CUSTOM" ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter custom category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                      className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedPriorityCatId("")}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <select
                    id="reopen-cat-select"
                    value={selectedPriorityCatId}
                    onChange={(e) => {
                      setSelectedPriorityCatId(e.target.value);
                      setSelectedPrioritySubcatId("");
                    }}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
                  >
                    <option value="">-- All Categories --</option>
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
                  htmlFor="reopen-subcat-select"
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
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                      required
                      className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedPrioritySubcatId("")}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
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
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600 disabled:opacity-50"
                  >
                    <option value="">-- All Subcategories --</option>
                    {categories
                      .find((c) => c.category_id === selectedPriorityCatId)
                      ?.subcategories?.map((s) => (
                        <option key={s.subcategory_id} value={s.subcategory_id}>
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
                  className="block font-semibold text-slate-700 dark:text-slate-300"
                >
                  Reopen Window (Hours) *
                </label>
                <input
                  id="reopen-window-input"
                  type="number"
                  min="1"
                  value={reopenWindowHours}
                  onChange={(e) => setReopenWindowHours(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
                />
              </div>

              <div>
                <label
                  htmlFor="max-reopens-input"
                  className="block font-semibold text-slate-700 dark:text-slate-300"
                >
                  Max Reopens *
                </label>
                <input
                  id="max-reopens-input"
                  type="number"
                  min="1"
                  value={maxReopens}
                  onChange={(e) => setMaxReopens(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
                />
              </div>

              <div>
                <label
                  htmlFor="max-reviews-input"
                  className="block font-semibold text-slate-700 dark:text-slate-300"
                >
                  Manual Reviews *
                </label>
                <input
                  id="max-reviews-input"
                  type="number"
                  min="1"
                  value={maxReviews}
                  onChange={(e) => setMaxReviews(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
                />
              </div>
            </div>
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
                  !reopenWindowHours ||
                  !maxReopens ||
                  !maxReviews
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
