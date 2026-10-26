"use client";

import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  isPurelyNumeric,
  SLA_RECIPIENT_OPTIONS,
  type SlaPolicyModalProps,
} from "./types";

export function SlaPolicyModal({
  open,
  onClose,
  editingRuleId,
  ruleName,
  setRuleName,
  priorityLevel,
  setPriorityLevel,
  durationHours,
  setDurationHours,
  warningPercent,
  atRiskPercent = "75",
  criticalPercent = "90",
  escalationPercent,
  slaRecipients,
  setSlaRecipients,
  isSubmitting,
  onSubmit,
}: SlaPolicyModalProps) {
  const isRuleNameNumeric = isPurelyNumeric(ruleName);
  const durationNum = Number(durationHours);
  const isDurationValidNumber =
    Boolean(durationHours) &&
    !Number.isNaN(durationNum) &&
    Number.isInteger(durationNum);
  const isDurationTooLow = isDurationValidNumber && durationNum < 1;
  const isDurationTooHigh = isDurationValidNumber && durationNum > 720;
  const isDurationInvalid =
    !isDurationValidNumber || isDurationTooLow || isDurationTooHigh;

  const getDurationDisplay = (hours: number) => {
    if (hours < 1) return null;
    if (hours > 720) {
      const days = Math.round(hours / 24).toLocaleString();
      return `Exceeds maximum limit: ${hours.toLocaleString()} hours is ≈ ${days} days. Maximum allowed is 720 hours (30 days).`;
    }
    if (hours % 24 === 0) {
      const days = hours / 24;
      return `Equivalent to ${days} Day${days > 1 ? "s" : ""}`;
    }
    if (hours >= 24) {
      const days = (hours / 24).toFixed(1);
      return `Equivalent to ≈ ${days} Days (${hours} Hours)`;
    }
    return `Equivalent to ${hours} Hour${hours > 1 ? "s" : ""}`;
  };

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
                  <Select
                    value={priorityLevel}
                    onValueChange={(val) => {
                      if (val) setPriorityLevel(val);
                    }}
                  >
                    <SelectTrigger
                      id="sla-priority-select"
                      className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-800 dark:text-slate-200 focus:border-teal-600 font-medium"
                    >
                      <SelectValue placeholder="Select Priority Tier">
                        {priorityLevel
                          ? `${priorityLevel.charAt(0) + priorityLevel.slice(1).toLowerCase()} Priority Tier`
                          : "Select Priority Tier"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
                      <SelectItem
                        value="CRITICAL"
                        className="text-xs cursor-pointer"
                      >
                        Critical Priority Tier
                      </SelectItem>
                      <SelectItem
                        value="HIGH"
                        className="text-xs cursor-pointer"
                      >
                        High Priority Tier
                      </SelectItem>
                      <SelectItem
                        value="MEDIUM"
                        className="text-xs cursor-pointer"
                      >
                        Medium Priority Tier
                      </SelectItem>
                      <SelectItem
                        value="LOW"
                        className="text-xs cursor-pointer"
                      >
                        Low Priority Tier
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="target-duration-input"
                      className="block font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Target Duration (Hours) *
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Range: 1 - 720 Hours (Max 30 Days)
                    </span>
                  </div>
                  <input
                    id="target-duration-input"
                    type="number"
                    min="1"
                    max="720"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    placeholder="e.g. 24"
                    required
                    className={`mt-1 h-9 w-full rounded-xl border ${
                      durationHours && isDurationInvalid
                        ? "border-rose-500 focus:border-rose-600 bg-rose-50/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-teal-600 bg-white dark:bg-slate-800"
                    } px-3 text-xs text-slate-800 dark:text-slate-200 outline-none transition`}
                  />

                  {/* Quick Preset Buttons */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Presets:
                    </span>
                    {[
                      { label: "1 Day (24h)", val: "24" },
                      { label: "2 Days (48h)", val: "48" },
                      { label: "3 Days (72h)", val: "72" },
                      { label: "5 Days (120h)", val: "120" },
                      { label: "7 Days (168h)", val: "168" },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setDurationHours(p.val)}
                        className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition cursor-pointer border ${
                          durationHours === p.val
                            ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-500"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Oversized Input Alert (e.g. 168932566) */}
                  {durationHours && isDurationTooHigh && (
                    <div className="mt-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-2.5 text-rose-800 dark:text-rose-200 shadow-xs">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-xs">
                          <p className="font-bold text-rose-700 dark:text-rose-300">
                            {durationNum.toLocaleString()} Hours ≈{" "}
                            {Math.round(durationNum / 24).toLocaleString()} Days
                            {durationNum >= 8760
                              ? ` (≈ ${(durationNum / 8760).toFixed(1)} Years!)`
                              : ""}
                          </p>
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-normal">
                            ⚠️ This value is unrealistically high! Maximum
                            allowed resolution SLA is{" "}
                            <strong>720 Hours (30 Days)</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Below Minimum Input Alert (<1) */}
                  {durationHours && isDurationTooLow && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>Duration must be at least 1 hour.</span>
                    </div>
                  )}

                  {/* Valid Conversion Display (e.g. 24 -> 1 Day) */}
                  {durationHours && !isDurationInvalid && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1.5 rounded-xl">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>✓ {getDurationDisplay(durationNum)}</span>
                    </div>
                  )}
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

                    {/* Designated Recipients */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          Designated Recipients (Select Designations) *
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
                !durationHours ||
                isDurationInvalid
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
