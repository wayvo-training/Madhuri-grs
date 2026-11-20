"use client";

import {
  AlertTriangle,
  Clock,
  Layers,
  Loader2,
  ShieldAlert,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isPurelyNumeric, type ReopenPolicyModalProps } from "./types";

const REOPEN_WINDOW_OPTIONS = [
  { label: "1 Day (24 hrs)", triggerLabel: "1 Day", val: "1" },
  { label: "2 Days (48 hrs)", triggerLabel: "2 Days", val: "2" },
  { label: "3 Days (72 hrs)", triggerLabel: "3 Days", val: "3" },
  { label: "5 Days (120 hrs)", triggerLabel: "5 Days", val: "5" },
  { label: "7 Days (1 Week)", triggerLabel: "7 Days", val: "7" },
  { label: "10 Days (240 hrs)", triggerLabel: "10 Days", val: "10" },
  {
    label: "14 Days (2 Weeks - Default)",
    triggerLabel: "14 Days (Default)",
    val: "14",
  },
  { label: "21 Days (3 Weeks)", triggerLabel: "21 Days", val: "21" },
  { label: "30 Days (1 Month - Max)", triggerLabel: "30 Days", val: "30" },
];

const INACTIVITY_AUTO_CLOSE_OPTIONS = [
  { label: "1 Day (24 hrs)", triggerLabel: "1 Day", val: "1" },
  { label: "2 Days (48 hrs)", triggerLabel: "2 Days", val: "2" },
  { label: "3 Days (72 hrs)", triggerLabel: "3 Days", val: "3" },
  { label: "5 Days (120 hrs)", triggerLabel: "5 Days", val: "5" },
  {
    label: "7 Days (1 Week - Default)",
    triggerLabel: "7 Days (Default)",
    val: "7",
  },
  { label: "10 Days (240 hrs)", triggerLabel: "10 Days", val: "10" },
  { label: "14 Days (2 Weeks)", triggerLabel: "14 Days", val: "14" },
  { label: "21 Days (3 Weeks)", triggerLabel: "21 Days", val: "21" },
  { label: "30 Days (1 Month - Max)", triggerLabel: "30 Days", val: "30" },
];

const MAX_REOPEN_ATTEMPT_OPTIONS = [
  { label: "1 Attempt", triggerLabel: "1 Attempt", val: "1" },
  { label: "2 Attempts", triggerLabel: "2 Attempts", val: "2" },
  {
    label: "3 Attempts (Default)",
    triggerLabel: "3 Attempts (Default)",
    val: "3",
  },
  { label: "4 Attempts", triggerLabel: "4 Attempts", val: "4" },
  { label: "5 Attempts (Max)", triggerLabel: "5 Attempts (Max)", val: "5" },
];

const MAX_REVIEW_CYCLE_OPTIONS = [
  { label: "1 Review Cycle", triggerLabel: "1 Cycle", val: "1" },
  { label: "2 Review Cycles", triggerLabel: "2 Cycles", val: "2" },
  {
    label: "3 Review Cycles (Default)",
    triggerLabel: "3 Cycles (Default)",
    val: "3",
  },
  { label: "4 Review Cycles", triggerLabel: "4 Cycles", val: "4" },
  { label: "5 Review Cycles (Max)", triggerLabel: "5 Cycles (Max)", val: "5" },
];

const MAX_REJECTION_OPTIONS = [
  { label: "1 Rejection", triggerLabel: "1 Rejection", val: "1" },
  { label: "2 Rejections", triggerLabel: "2 Rejections", val: "2" },
  {
    label: "3 Rejections (Default)",
    triggerLabel: "3 Rejections (Default)",
    val: "3",
  },
  { label: "4 Rejections", triggerLabel: "4 Rejections", val: "4" },
  { label: "5 Rejections (Max)", triggerLabel: "5 Rejections (Max)", val: "5" },
];

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
  resolutionInactivityDays = "7",
  setResolutionInactivityDays,
  additionalInfoInactivityDays = "7",
  setAdditionalInfoInactivityDays,
  maxRejections = "3",
  setMaxRejections,
  categories,
  newCategoryName,
  setNewCategoryName,
  newSubcategoryName,
  setNewSubcategoryName,
  isSubmitting,
  onSubmit,
}: ReopenPolicyModalProps) {
  // 1. Citizen Reopen Window (Days): 1 to 30 days
  const windowDays = reopenWindowHours
    ? (Number(reopenWindowHours) / 24).toString()
    : "14";

  const [isCustomWindow, setIsCustomWindow] = useState(
    !REOPEN_WINDOW_OPTIONS.some((o) => o.val === windowDays),
  );
  const [isCustomResDays, setIsCustomResDays] = useState(
    !INACTIVITY_AUTO_CLOSE_OPTIONS.some(
      (o) => o.val === resolutionInactivityDays,
    ),
  );
  const [isCustomInfoDays, setIsCustomInfoDays] = useState(
    !INACTIVITY_AUTO_CLOSE_OPTIONS.some(
      (o) => o.val === additionalInfoInactivityDays,
    ),
  );

  useEffect(() => {
    if (open) {
      setIsCustomWindow(
        !REOPEN_WINDOW_OPTIONS.some((o) => o.val === windowDays),
      );
      setIsCustomResDays(
        !INACTIVITY_AUTO_CLOSE_OPTIONS.some(
          (o) => o.val === resolutionInactivityDays,
        ),
      );
      setIsCustomInfoDays(
        !INACTIVITY_AUTO_CLOSE_OPTIONS.some(
          (o) => o.val === additionalInfoInactivityDays,
        ),
      );
    }
  }, [
    open,
    windowDays,
    resolutionInactivityDays,
    additionalInfoInactivityDays,
  ]);

  if (!open) return null;

  const isRuleNameNumeric = isPurelyNumeric(ruleName);
  const isCategoryNumeric =
    selectedPriorityCatId === "CUSTOM" && isPurelyNumeric(newCategoryName);
  const isSubcategoryNumeric =
    selectedPrioritySubcatId === "CUSTOM" &&
    isPurelyNumeric(newSubcategoryName);
  const numDays = Number(windowDays);
  const isWindowOversized = numDays > 30 || numDays > 1000;
  const isWindowInvalid =
    !windowDays ||
    Number.isNaN(numDays) ||
    numDays < 1 ||
    numDays > 30 ||
    !Number.isInteger(numDays);

  // 2. Resolution Confirmation Inactivity Auto-Close (Days): 1 to 30 days (default 7)
  const numResDays = Number(resolutionInactivityDays || "7");
  const isResDaysOversized = numResDays > 30 || numResDays > 1000;
  const isResDaysInvalid =
    !resolutionInactivityDays ||
    Number.isNaN(numResDays) ||
    numResDays < 1 ||
    numResDays > 30 ||
    !Number.isInteger(numResDays);

  // 3. Additional Information Non-Response Auto-Close (Days): 1 to 30 days (default 7)
  const numInfoDays = Number(additionalInfoInactivityDays || "7");
  const isInfoDaysOversized = numInfoDays > 30 || numInfoDays > 1000;
  const isInfoDaysInvalid =
    !additionalInfoInactivityDays ||
    Number.isNaN(numInfoDays) ||
    numInfoDays < 1 ||
    numInfoDays > 30 ||
    !Number.isInteger(numInfoDays);

  // 4. Max Combined Rework & Reopen Attempts: 1 to 5
  const numReopens = Number(maxReopens || "3");
  const isMaxReopensOversized = numReopens > 5 || numReopens > 1000;
  const isMaxReopensInvalid =
    !maxReopens ||
    Number.isNaN(numReopens) ||
    numReopens < 1 ||
    numReopens > 5 ||
    !Number.isInteger(numReopens);

  // 5. Max Department Review / Rework Cycles: 1 to 5
  const numReviews = Number(maxReviews || "3");
  const isMaxReviewsOversized = numReviews > 5 || numReviews > 1000;
  const isMaxReviewsInvalid =
    !maxReviews ||
    Number.isNaN(numReviews) ||
    numReviews < 1 ||
    numReviews > 5 ||
    !Number.isInteger(numReviews);

  // 6. Max Rejections Before Permanent Closure: 1 to 5
  const numRejections = Number(maxRejections || "3");
  const isMaxRejectionsOversized = numRejections > 5 || numRejections > 1000;
  const isMaxRejectionsInvalid =
    !maxRejections ||
    Number.isNaN(numRejections) ||
    numRejections < 1 ||
    numRejections > 5 ||
    !Number.isInteger(numRejections);

  const hasAnyValidationErrors =
    !ruleName.trim() ||
    isRuleNameNumeric ||
    (selectedPriorityCatId === "CUSTOM" &&
      (!newCategoryName.trim() || isCategoryNumeric)) ||
    (selectedPrioritySubcatId === "CUSTOM" &&
      (!newSubcategoryName.trim() || isSubcategoryNumeric)) ||
    isWindowInvalid ||
    isResDaysInvalid ||
    isInfoDaysInvalid ||
    isMaxReopensInvalid ||
    isMaxReviewsInvalid ||
    isMaxRejectionsInvalid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl transition-all duration-200">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" />
              {editingRuleId
                ? "Edit Lifecycle & Closure Policy"
                : "Configure Lifecycle & Closure Policy"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Configure citizen reopening window, automated inactivity closures,
              and rework limits.
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
          {/* Policy Name */}
          <div>
            <label
              htmlFor="lifecycle-rule-name-input"
              className="block font-semibold text-slate-700 dark:text-slate-300"
            >
              Policy Rule Name *
            </label>
            <input
              id="lifecycle-rule-name-input"
              type="text"
              required
              placeholder="e.g. Standard Lifecycle & Closure Policy"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              className={`mt-1 h-9.5 w-full rounded-xl border ${
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

          {/* Scope (Category & Subcategory) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="lifecycle-cat-select"
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
                      className={`h-9.5 w-full rounded-xl border ${
                        isCategoryNumeric
                          ? "border-rose-500 focus:border-rose-600"
                          : "border-slate-200 dark:border-slate-700 focus:border-teal-600"
                      } bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition`}
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedPriorityCatId("")}
                      className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
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
                    id="lifecycle-cat-select"
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
                    <SelectItem value="ALL" className="text-xs cursor-pointer">
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
                htmlFor="lifecycle-subcat-select"
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
                      className={`h-9.5 w-full rounded-xl border ${
                        isSubcategoryNumeric
                          ? "border-rose-500 focus:border-rose-600"
                          : "border-slate-200 dark:border-slate-700 focus:border-teal-600"
                      } bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition`}
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedPrioritySubcatId("")}
                      className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
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
                    id="lifecycle-subcat-select"
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
                    <SelectItem value="ALL" className="text-xs cursor-pointer">
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

          {/* Section 1: Inactivity & Closure Timers (Shadcn Dropdowns) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Clock className="h-4 w-4 text-teal-600" />
              <span>Inactivity & Closure Timers (Select Days)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
              {/* Citizen Reopen Window */}
              <div className="space-y-1">
                <div className="h-8 flex flex-col justify-between">
                  <label
                    htmlFor="reopen-window-select"
                    className="block font-semibold text-slate-700 dark:text-slate-300 text-xs truncate"
                  >
                    Reopen Window *
                  </label>
                  <span className="text-[10px] text-slate-400 truncate">
                    Allowed: 1 - 30 days
                  </span>
                </div>

                {!isCustomWindow ? (
                  <Select
                    value={windowDays}
                    onValueChange={(val) => {
                      if (!val) return;
                      if (val === "CUSTOM") {
                        setIsCustomWindow(true);
                      } else {
                        setReopenWindowHours((Number(val) * 24).toString());
                      }
                    }}
                  >
                    <SelectTrigger
                      id="reopen-window-select"
                      className="h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 font-medium"
                    >
                      <SelectValue placeholder="Select Days">
                        {REOPEN_WINDOW_OPTIONS.find((o) => o.val === windowDays)
                          ?.triggerLabel || `${windowDays} Days`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-56 min-w-[240px]">
                      {REOPEN_WINDOW_OPTIONS.map((o) => (
                        <SelectItem
                          key={o.val}
                          value={o.val}
                          className="text-xs cursor-pointer"
                        >
                          {o.label}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="CUSTOM"
                        className="text-xs font-semibold text-teal-600 dark:text-teal-400 cursor-pointer"
                      >
                        Custom Days (1 - 30)...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
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
                      className={`h-9.5 w-full rounded-xl border ${
                        isWindowInvalid && windowDays !== ""
                          ? "border-rose-500 focus:border-rose-600"
                          : "border-slate-200 dark:border-slate-700 focus:border-teal-600"
                      } bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomWindow(false);
                        setReopenWindowHours((14 * 24).toString());
                      }}
                      className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer text-xs"
                      title="Back to dropdown options"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="h-4">
                  {isWindowOversized ? (
                    <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Max 30 days allowed.
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      {numDays
                        ? `${numDays} Days (${numDays * 24} hrs)`
                        : "Select window"}
                    </p>
                  )}
                </div>
              </div>

              {/* Resolution Inactivity Auto-Close */}
              <div className="space-y-1">
                <div className="h-8 flex flex-col justify-between">
                  <label
                    htmlFor="res-inactivity-select"
                    className="block font-semibold text-slate-700 dark:text-slate-300 text-xs truncate"
                  >
                    Resolution Auto-Close *
                  </label>
                  <span className="text-[10px] text-slate-400 truncate">
                    Auto-close if no confirmation
                  </span>
                </div>

                {!isCustomResDays ? (
                  <Select
                    value={resolutionInactivityDays}
                    onValueChange={(val) => {
                      if (!val) return;
                      if (val === "CUSTOM") {
                        setIsCustomResDays(true);
                      } else {
                        setResolutionInactivityDays?.(val);
                      }
                    }}
                  >
                    <SelectTrigger
                      id="res-inactivity-select"
                      className="h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 font-medium"
                    >
                      <SelectValue placeholder="Select Days">
                        {INACTIVITY_AUTO_CLOSE_OPTIONS.find(
                          (o) => o.val === resolutionInactivityDays,
                        )?.triggerLabel || `${resolutionInactivityDays} Days`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-56 min-w-[240px]">
                      {INACTIVITY_AUTO_CLOSE_OPTIONS.map((o) => (
                        <SelectItem
                          key={o.val}
                          value={o.val}
                          className="text-xs cursor-pointer"
                        >
                          {o.label}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="CUSTOM"
                        className="text-xs font-semibold text-teal-600 dark:text-teal-400 cursor-pointer"
                      >
                        Custom Days (1 - 30)...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      placeholder="1 - 30"
                      value={resolutionInactivityDays}
                      onChange={(e) =>
                        setResolutionInactivityDays?.(e.target.value)
                      }
                      className={`h-9.5 w-full rounded-xl border ${
                        isResDaysInvalid && resolutionInactivityDays !== ""
                          ? "border-rose-500 focus:border-rose-600"
                          : "border-slate-200 dark:border-slate-700 focus:border-teal-600"
                      } bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomResDays(false);
                        setResolutionInactivityDays?.("7");
                      }}
                      className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer text-xs"
                      title="Back to dropdown options"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="h-4">
                  {isResDaysOversized ? (
                    <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Max 30 days allowed.
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      {numResDays
                        ? `${numResDays} Days (${numResDays * 24} hrs)`
                        : "Select days"}
                    </p>
                  )}
                </div>
              </div>

              {/* Additional Information Inactivity Auto-Close */}
              <div className="space-y-1">
                <div className="h-8 flex flex-col justify-between">
                  <label
                    htmlFor="info-inactivity-select"
                    className="block font-semibold text-slate-700 dark:text-slate-300 text-xs truncate"
                  >
                    Addtl Info Auto-Close *
                  </label>
                  <span className="text-[10px] text-slate-400 truncate">
                    Auto-close if unresponsive
                  </span>
                </div>

                {!isCustomInfoDays ? (
                  <Select
                    value={additionalInfoInactivityDays}
                    onValueChange={(val) => {
                      if (!val) return;
                      if (val === "CUSTOM") {
                        setIsCustomInfoDays(true);
                      } else {
                        setAdditionalInfoInactivityDays?.(val);
                      }
                    }}
                  >
                    <SelectTrigger
                      id="info-inactivity-select"
                      className="h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 font-medium"
                    >
                      <SelectValue placeholder="Select Days">
                        {INACTIVITY_AUTO_CLOSE_OPTIONS.find(
                          (o) => o.val === additionalInfoInactivityDays,
                        )?.triggerLabel ||
                          `${additionalInfoInactivityDays} Days`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-56 min-w-[240px]">
                      {INACTIVITY_AUTO_CLOSE_OPTIONS.map((o) => (
                        <SelectItem
                          key={o.val}
                          value={o.val}
                          className="text-xs cursor-pointer"
                        >
                          {o.label}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="CUSTOM"
                        className="text-xs font-semibold text-teal-600 dark:text-teal-400 cursor-pointer"
                      >
                        Custom Days (1 - 30)...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      placeholder="1 - 30"
                      value={additionalInfoInactivityDays}
                      onChange={(e) =>
                        setAdditionalInfoInactivityDays?.(e.target.value)
                      }
                      className={`h-9.5 w-full rounded-xl border ${
                        isInfoDaysInvalid && additionalInfoInactivityDays !== ""
                          ? "border-rose-500 focus:border-rose-600"
                          : "border-slate-200 dark:border-slate-700 focus:border-teal-600"
                      } bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomInfoDays(false);
                        setAdditionalInfoInactivityDays?.("7");
                      }}
                      className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer text-xs"
                      title="Back to dropdown options"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="h-4">
                  {isInfoDaysOversized ? (
                    <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Max 30 days allowed.
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      {numInfoDays
                        ? `${numInfoDays} Days (${numInfoDays * 24} hrs)`
                        : "Select days"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Cycle & Review Limits (Shadcn Dropdowns) */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Layers className="h-4 w-4 text-indigo-600" />
              <span>Governance & Attempt Limits (Select Limits)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
              {/* Max Combined Attempts */}
              <div className="space-y-1">
                <div className="h-8 flex flex-col justify-between">
                  <label
                    htmlFor="max-reopens-select"
                    className="block font-semibold text-slate-700 dark:text-slate-300 text-xs truncate"
                  >
                    Max Reopens & Rework *
                  </label>
                  <span className="text-[10px] text-slate-400 truncate">
                    Lifetime limit per grievance
                  </span>
                </div>

                <Select
                  value={maxReopens || "3"}
                  onValueChange={(val) => {
                    if (val) setMaxReopens(val);
                  }}
                >
                  <SelectTrigger
                    id="max-reopens-select"
                    className="h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 font-medium"
                  >
                    <SelectValue placeholder="Select Limit">
                      {MAX_REOPEN_ATTEMPT_OPTIONS.find(
                        (o) => o.val === (maxReopens || "3"),
                      )?.triggerLabel || `${maxReopens || "3"} Attempts`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl min-w-[240px]">
                    {MAX_REOPEN_ATTEMPT_OPTIONS.map((o) => (
                      <SelectItem
                        key={o.val}
                        value={o.val}
                        className="text-xs cursor-pointer"
                      >
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="h-4">
                  {isMaxReopensOversized ? (
                    <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                      <ShieldAlert className="h-3 w-3 shrink-0" />
                      Max 5 allowed.
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      Combined rework/reopen limit
                    </p>
                  )}
                </div>
              </div>

              {/* Max Department Reviews */}
              <div className="space-y-1">
                <div className="h-8 flex flex-col justify-between">
                  <label
                    htmlFor="max-reviews-select"
                    className="block font-semibold text-slate-700 dark:text-slate-300 text-xs truncate"
                  >
                    Max Review Cycles *
                  </label>
                  <span className="text-[10px] text-slate-400 truncate">
                    Department review limit
                  </span>
                </div>

                <Select
                  value={maxReviews || "3"}
                  onValueChange={(val) => {
                    if (val) setMaxReviews(val);
                  }}
                >
                  <SelectTrigger
                    id="max-reviews-select"
                    className="h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 font-medium"
                  >
                    <SelectValue placeholder="Select Limit">
                      {MAX_REVIEW_CYCLE_OPTIONS.find(
                        (o) => o.val === (maxReviews || "3"),
                      )?.triggerLabel || `${maxReviews || "3"} Cycles`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl min-w-[240px]">
                    {MAX_REVIEW_CYCLE_OPTIONS.map((o) => (
                      <SelectItem
                        key={o.val}
                        value={o.val}
                        className="text-xs cursor-pointer"
                      >
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="h-4">
                  {isMaxReviewsOversized ? (
                    <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                      <ShieldAlert className="h-3 w-3 shrink-0" />
                      Max 5 allowed.
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      HOD rework review limit
                    </p>
                  )}
                </div>
              </div>

              {/* Max Rejections Before Final Closure */}
              <div className="space-y-1">
                <div className="h-8 flex flex-col justify-between">
                  <label
                    htmlFor="max-rejections-select"
                    className="block font-semibold text-slate-700 dark:text-slate-300 text-xs truncate"
                  >
                    Max Final Rejections *
                  </label>
                  <span className="text-[10px] text-slate-400 truncate">
                    Permanent closure cutoff
                  </span>
                </div>

                <Select
                  value={maxRejections || "3"}
                  onValueChange={(val) => {
                    if (val) setMaxRejections?.(val);
                  }}
                >
                  <SelectTrigger
                    id="max-rejections-select"
                    className="h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 font-medium"
                  >
                    <SelectValue placeholder="Select Limit">
                      {MAX_REJECTION_OPTIONS.find(
                        (o) => o.val === (maxRejections || "3"),
                      )?.triggerLabel || `${maxRejections || "3"} Rejections`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl min-w-[240px]">
                    {MAX_REJECTION_OPTIONS.map((o) => (
                      <SelectItem
                        key={o.val}
                        value={o.val}
                        className="text-xs cursor-pointer"
                      >
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="h-4">
                  {isMaxRejectionsOversized ? (
                    <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                      <ShieldAlert className="h-3 w-3 shrink-0" />
                      Max 5 allowed.
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      Permanent closure cutoff
                    </p>
                  )}
                </div>
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
              disabled={isSubmitting || hasAnyValidationErrors}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] disabled:opacity-50 cursor-pointer transition"
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
