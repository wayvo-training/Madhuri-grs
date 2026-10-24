"use client";

import { Loader2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isPurelyNumeric, type ReopenPolicyModalProps } from "./types";

export function ReopenPolicyModal({
  open,
  onClose,
  editingRuleId,
  ruleStatus: _ruleStatus,
  setRuleStatus: _setRuleStatus,
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

  const isRuleNameNumeric = isPurelyNumeric(ruleName);
  const isCategoryNumeric =
    selectedPriorityCatId === "CUSTOM" && isPurelyNumeric(newCategoryName);
  const isSubcategoryNumeric =
    selectedPrioritySubcatId === "CUSTOM" &&
    isPurelyNumeric(newSubcategoryName);

  // Reopen window in days: 1 to 30 days
  const windowDays = reopenWindowHours
    ? (Number(reopenWindowHours) / 24).toString()
    : "";
  const numDays = Number(windowDays);
  const isWindowInvalid =
    !windowDays ||
    Number.isNaN(numDays) ||
    numDays < 1 ||
    numDays > 30 ||
    !Number.isInteger(numDays);

  // Max reopens limit: 1 to 10
  const numReopens = Number(maxReopens);
  const isMaxReopensInvalid =
    !maxReopens ||
    Number.isNaN(numReopens) ||
    numReopens < 1 ||
    numReopens > 10 ||
    !Number.isInteger(numReopens);

  // Manual reviews limit: 1 to 10
  const numReviews = Number(maxReviews);
  const isMaxReviewsInvalid =
    !maxReviews ||
    Number.isNaN(numReviews) ||
    numReviews < 1 ||
    numReviews > 10 ||
    !Number.isInteger(numReviews);

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
              className={`mt-1 h-9 w-full rounded-xl border ${
                isRuleNameNumeric
                  ? "border-rose-500 focus:border-rose-600"
                  : "border-slate-200 dark:border-slate-700 focus:border-teal-600"
              } bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition`}
            />
            {isRuleNameNumeric && (
              <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                Policy name cannot consist of only numbers. It must include
                letters or an alphanumeric combination.
              </p>
            )}
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
                  <Select
                    value={selectedPriorityCatId || "ALL"}
                    onValueChange={(val) => {
                      if (!val || val === "ALL") {
                        setSelectedPriorityCatId("");
                        setSelectedPrioritySubcatId("");
                      } else {
                        setSelectedPriorityCatId(val);
                        setSelectedPrioritySubcatId("");
                      }
                    }}
                  >
                    <SelectTrigger
                      id="reopen-cat-select"
                      className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 font-medium"
                    >
                      <SelectValue placeholder="-- All Categories --">
                        {selectedPriorityCatId
                          ? categories.find(
                              (c) => c.category_id === selectedPriorityCatId,
                            )?.category_name || selectedPriorityCatId
                          : "-- All Categories --"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-60">
                      <SelectItem
                        value="ALL"
                        className="text-xs cursor-pointer"
                      >
                        -- All Categories --
                      </SelectItem>
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
                  htmlFor="reopen-subcat-select"
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
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
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
                  <Select
                    value={selectedPrioritySubcatId || "ALL"}
                    disabled={!selectedPriorityCatId}
                    onValueChange={(val) => {
                      setSelectedPrioritySubcatId(
                        !val || val === "ALL" ? "" : val,
                      );
                    }}
                  >
                    <SelectTrigger
                      id="reopen-subcat-select"
                      className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 font-medium disabled:opacity-50"
                    >
                      <SelectValue placeholder="-- All Subcategories --">
                        {selectedPrioritySubcatId
                          ? categories
                              .find(
                                (c) => c.category_id === selectedPriorityCatId,
                              )
                              ?.subcategories?.find(
                                (s) =>
                                  s.subcategory_id === selectedPrioritySubcatId,
                              )?.subcategory_name || selectedPrioritySubcatId
                          : "-- All Subcategories --"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-60">
                      <SelectItem
                        value="ALL"
                        className="text-xs cursor-pointer"
                      >
                        -- All Subcategories --
                      </SelectItem>
                      {categories
                        .find((c) => c.category_id === selectedPriorityCatId)
                        ?.subcategories?.map((s) => (
                          <SelectItem
                            key={s.subcategory_id}
                            value={s.subcategory_id}
                            className="text-xs cursor-pointer"
                          >
                            {s.subcategory_name}
                          </SelectItem>
                        ))}
                      {selectedPriorityCatId && (
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="reopen-window-input"
                  className="block font-semibold text-slate-700 dark:text-slate-300"
                >
                  Reopen Window (Days) *
                </label>
                <input
                  id="reopen-window-input"
                  type="number"
                  min="1"
                  max="30"
                  placeholder="1 - 30"
                  value={windowDays}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setReopenWindowHours("");
                    } else {
                      const parsed = Number(val);
                      setReopenWindowHours((parsed * 24).toString());
                    }
                  }}
                  className={`mt-1 h-9 w-full rounded-xl border ${
                    isWindowInvalid && windowDays !== ""
                      ? "border-rose-500 focus:border-rose-600"
                      : "border-slate-200 dark:border-slate-700 focus:border-teal-600"
                  } bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition`}
                />
                {isWindowInvalid && windowDays !== "" ? (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    Must be 1 to 30 days.
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Max 30 days (
                    {numDays && numDays >= 1 && numDays <= 30
                      ? `${numDays * 24} hrs`
                      : "1 - 30"}
                    )
                  </p>
                )}
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
                  max="10"
                  placeholder="1 - 10"
                  value={maxReopens}
                  onChange={(e) => setMaxReopens(e.target.value)}
                  className={`mt-1 h-9 w-full rounded-xl border ${
                    isMaxReopensInvalid && maxReopens !== ""
                      ? "border-rose-500 focus:border-rose-600"
                      : "border-slate-200 dark:border-slate-700 focus:border-teal-600"
                  } bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition`}
                />
                {isMaxReopensInvalid && maxReopens !== "" ? (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    Must be 1 to 10.
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Limit: 1 - 10 times
                  </p>
                )}
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
                  max="10"
                  placeholder="1 - 10"
                  value={maxReviews}
                  onChange={(e) => setMaxReviews(e.target.value)}
                  className={`mt-1 h-9 w-full rounded-xl border ${
                    isMaxReviewsInvalid && maxReviews !== ""
                      ? "border-rose-500 focus:border-rose-600"
                      : "border-slate-200 dark:border-slate-700 focus:border-teal-600"
                  } bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition`}
                />
                {isMaxReviewsInvalid && maxReviews !== "" ? (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    Must be 1 to 10.
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Limit: 1 - 10 reviews
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
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
                isWindowInvalid ||
                isMaxReopensInvalid ||
                isMaxReviewsInvalid
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] disabled:opacity-50 cursor-pointer"
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
