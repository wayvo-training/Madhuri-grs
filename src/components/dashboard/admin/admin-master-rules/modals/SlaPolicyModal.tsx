"use client";

import { Loader2, X } from "lucide-react";
import { useState } from "react";
import {
  isPurelyNumeric,
  SLA_RECIPIENT_OPTIONS,
  type SlaPolicyModalProps,
} from "./types";

export function SlaPolicyModal({
  open,
  onClose,
  editingRuleId,
  ruleStatus,
  setRuleStatus,
  ruleName,
  setRuleName,
  priorityLevel,
  setPriorityLevel,
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
  slaRecipients,
  setSlaRecipients,
  isSubmitting,
  onSubmit,
}: SlaPolicyModalProps) {
  const isRuleNameNumeric = isPurelyNumeric(ruleName);
  const [activeSlaTier, setActiveSlaTier] = useState<
    "warning" | "at_risk" | "critical" | "escalation"
  >("warning");

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
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl transition-all duration-200">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editingRuleId ? "Edit SLA Policy" : "Configure SLA Policy"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Define target resolution timeframes, milestone warnings, and
              notification escalation recipients.
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
              htmlFor="sla-rule-name-input"
              className="block font-semibold text-slate-700 dark:text-slate-300"
            >
              Policy Rule Name *
            </label>
            <input
              id="sla-rule-name-input"
              type="text"
              required
              placeholder="e.g. High Priority Resolution SLA"
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
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
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
                    required
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition focus:border-teal-600"
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
                      {(slaRecipients?.critical || []).length === 1 ? "" : "s"}
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
                const currentRecipients = slaRecipients?.[currentTierKey] || [];
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
                        htmlFor="sla-tier-percent-input"
                        className="block text-xs font-bold text-slate-800 dark:text-slate-200"
                      >
                        1. Threshold Percentage (%) *
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative w-36">
                          {isWarning && (
                            <input
                              id="sla-tier-percent-input"
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
                              id="sla-tier-percent-input"
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
                              id="sla-tier-percent-input"
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
                              id="sla-tier-percent-input"
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
                          const isSelected = currentRecipients.includes(opt.id);
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
                  !durationHours
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
