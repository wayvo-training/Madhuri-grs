"use client";

import {
  AlertCircle,
  Calendar,
  Clock,
  Loader2,
  ShieldAlert,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { StaffGrievanceItem, StaffPriority } from "@/types/staff";

interface RequestGracePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  grievance: StaffGrievanceItem;
  onSuccess?: () => void;
}

function formatDurationDisplay(mins: number): string {
  if (mins < 60) return `${mins} Minute${mins === 1 ? "" : "s"}`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h} Hour${h === 1 ? "" : "s"}`;
  return `${h}h ${m}m`;
}

function formatExtensionBadge(mins: number): string {
  if (mins < 60) return `+${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `+${h}h`;
  return `+${h}h ${m}m`;
}

export function RequestGracePeriodModal({
  isOpen,
  onClose,
  grievance,
  onSuccess,
}: RequestGracePeriodModalProps) {
  const normPriority =
    (grievance.priority?.toUpperCase() as StaffPriority) || "MEDIUM";

  // Base value: Use department's total allocated time, not total grievance time
  const baselineMinutes = useMemo(() => {
    // 1. Direct department allocated duration
    if (
      grievance.allocatedDurationMinutes &&
      grievance.allocatedDurationMinutes > 0
    ) {
      return grievance.allocatedDurationMinutes;
    }

    // 2. Look for assigned department in departmentsInvolved
    if (
      grievance.departmentsInvolved &&
      grievance.departmentsInvolved.length > 0
    ) {
      const myDept =
        grievance.departmentsInvolved.find((d) => d.isMyAssignment) ||
        grievance.departmentsInvolved.find(
          (d) => d.involvementType === "PRIMARY",
        ) ||
        grievance.departmentsInvolved[0];

      if (
        myDept?.allocatedDurationMinutes &&
        myDept.allocatedDurationMinutes > 0
      ) {
        return myDept.allocatedDurationMinutes;
      }
    }

    // 3. Calculated from configured SLA policy target duration and percentage share
    if (
      grievance.targetDurationMinutes &&
      grievance.targetDurationMinutes > 0
    ) {
      const share = Number(grievance.slaPercentAllocation || 100);
      return Math.max(
        1,
        Math.round((grievance.targetDurationMinutes * share) / 100),
      );
    }

    // 4. Fallback based on timestamps if available
    if (grievance.dueAt && grievance.submittedAt) {
      const diffMs =
        new Date(grievance.dueAt).getTime() -
        new Date(grievance.submittedAt).getTime();
      if (!Number.isNaN(diffMs) && diffMs > 0) {
        const share = Number(grievance.slaPercentAllocation || 100);
        return Math.max(1, Math.round((diffMs / 60000) * (share / 100)));
      }
    }

    // 5. Configured or standard priority duration fallback
    const defaultPriorityHours: Record<string, number> = {
      CRITICAL: 24,
      HIGH: 48,
      MEDIUM: 72,
      LOW: 120,
    };
    const totalHours = defaultPriorityHours[normPriority] || 72;
    const share = Number(grievance.slaPercentAllocation || 100);
    return Math.max(1, Math.round(totalHours * 60 * (share / 100)));
  }, [
    grievance.allocatedDurationMinutes,
    grievance.departmentsInvolved,
    grievance.targetDurationMinutes,
    grievance.slaPercentAllocation,
    grievance.dueAt,
    grievance.submittedAt,
    normPriority,
  ]);

  // Maximum single extension is 25% of department's allocated baseline
  const maxAllowedMinutes = useMemo(() => {
    return Math.max(1, Math.round((baselineMinutes * 25) / 100));
  }, [baselineMinutes]);

  // Dynamic extension presets scaled to maxAllowedMinutes
  const presetMinutes = useMemo(() => {
    if (maxAllowedMinutes <= 30) {
      const set = new Set<number>();
      if (maxAllowedMinutes >= 15) set.add(Math.round(maxAllowedMinutes / 3));
      if (maxAllowedMinutes >= 10)
        set.add(Math.round((maxAllowedMinutes * 2) / 3));
      set.add(maxAllowedMinutes);
      return Array.from(set)
        .filter((m) => m > 0)
        .sort((a, b) => a - b);
    }
    if (maxAllowedMinutes <= 120) {
      const set = new Set<number>();
      const candidates = [15, 30, 45, 60, 90, 120];
      for (const c of candidates) {
        if (c <= maxAllowedMinutes) set.add(c);
      }
      set.add(maxAllowedMinutes);
      return Array.from(set).sort((a, b) => a - b);
    }
    const hourCandidates = [1, 2, 4, 6, 8, 12, 18, 24];
    const set = new Set<number>();
    for (const h of hourCandidates) {
      if (h * 60 <= maxAllowedMinutes) set.add(h * 60);
    }
    set.add(maxAllowedMinutes);
    return Array.from(set).sort((a, b) => a - b);
  }, [maxAllowedMinutes]);

  const [selectedMinutes, setSelectedMinutes] = useState<number>(() => {
    const defaultChoice =
      presetMinutes[Math.floor(presetMinutes.length / 2)] || maxAllowedMinutes;
    return defaultChoice;
  });

  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const hasExistingPending = grievance.latestExtension?.status === "PENDING";
  const hasExistingExtension = Boolean(grievance.latestExtension);

  const trimmedReason = reason.trim();
  const isValidLength = trimmedReason.length >= 15;
  const hasLetters = /[a-zA-Z]/.test(trimmedReason);

  // Dynamic thresholds configured by admin (default: 50% warning, 75% auto-escalation)
  const warningThreshold = grievance.warningThresholdPercent ?? 50;
  const escalationThreshold = grievance.escalationThresholdPercent ?? 75;

  const isEligibleWarning =
    (grievance.slaConsumptionPercent ?? 0) >= warningThreshold;
  const isUnderEscalation =
    (grievance.slaConsumptionPercent ?? 0) < escalationThreshold;
  const isNotBreached =
    grievance.slaStatus !== "BREACHED" &&
    (grievance.slaConsumptionPercent ?? 0) < 100;
  const canSubmit =
    isValidLength &&
    hasLetters &&
    isEligibleWarning &&
    isUnderEscalation &&
    isNotBreached &&
    !hasExistingExtension &&
    !isSubmitting;

  const currentDue = grievance.dueAt ? new Date(grievance.dueAt) : new Date();
  const projectedDue = new Date(
    currentDue.getTime() + selectedMinutes * 60 * 1000,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasExistingExtension || hasExistingPending) {
      toast.error("You have already submitted a grace period request.");
      return;
    }
    if (!canSubmit) {
      if (
        grievance.slaStatus === "BREACHED" ||
        (grievance.slaConsumptionPercent ?? 0) >= 100
      ) {
        toast.error("Grace period cannot be requested after SLA has breached.");
      } else if (!isUnderEscalation) {
        toast.error(
          `Grace period requests close at ${escalationThreshold}% SLA when the case auto-escalates to Department Head.`,
        );
      } else if (!isEligibleWarning) {
        toast.error(
          `Grace period can only be requested after at least ${warningThreshold}% SLA is consumed (currently ${grievance.slaConsumptionPercent}%).`,
        );
      } else if (!isValidLength) {
        toast.error(
          `Please provide a descriptive reason of at least 15 characters (currently ${trimmedReason.length}).`,
        );
      } else if (!hasLetters) {
        toast.error("Reason cannot consist of numbers or symbols alone.");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/staff/grievances/${grievance.id}/grace-period`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestedMinutes: selectedMinutes,
            reason: trimmedReason,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to submit grace period request.");
        return;
      }

      toast.success(
        data.message ||
          `Grace period request (${formatExtensionBadge(selectedMinutes)}) submitted for Department Head review.`,
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error submitting grace period request:", err);
      toast.error("An unexpected error occurred while submitting request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-[#0F766E] border border-teal-200">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                Request SLA Grace Period
              </h3>
              <p className="text-[11px] text-slate-500">
                Ticket: {grievance.grievanceNumber} &bull; Priority:{" "}
                {normPriority}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto">
          {/* Current SLA Status Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 text-xs">
                Current SLA Status
              </span>
              <span
                className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                  grievance.slaConsumptionPercent >= escalationThreshold
                    ? "bg-rose-100 text-rose-800"
                    : grievance.slaConsumptionPercent >= warningThreshold
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {grievance.slaConsumptionPercent}% Consumed
              </span>
            </div>

            {/* SLA Progress Bar with dynamic warning & escalation markers */}
            <div className="space-y-0.5">
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-300 ${
                    grievance.slaConsumptionPercent >= escalationThreshold
                      ? "bg-rose-500"
                      : grievance.slaConsumptionPercent >= warningThreshold
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(100, grievance.slaConsumptionPercent)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>0%</span>
                <span className="font-semibold text-amber-700">
                  {warningThreshold}% (Grace Period Unlocked)
                </span>
                <span className="font-semibold text-rose-700">
                  {escalationThreshold}% (Auto-Escalate)
                </span>
                <span>100%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[10px]">
              <div>
                <span className="text-slate-500">Remaining:</span>{" "}
                <span className="font-semibold text-slate-800">
                  {grievance.slaTimeLeft}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Baseline Budget:</span>{" "}
                <span className="font-semibold text-slate-800">
                  {formatDurationDisplay(baselineMinutes)}
                </span>
              </div>
            </div>
          </div>

          {/* Under Warning Threshold */}
          {!isEligibleWarning && (
            <div className="rounded-lg border border-amber-300 bg-amber-50/90 p-2 text-xs text-amber-900 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[11px]">
                  Minimum Threshold Not Reached
                </span>
                <p className="text-[10px] text-amber-800 leading-tight mt-0.5">
                  Grace period requests unlock after at least {warningThreshold}
                  % of department SLA is consumed (currently{" "}
                  {grievance.slaConsumptionPercent}%).
                </p>
              </div>
            </div>
          )}

          {/* Over Escalation Threshold or Breached Warning */}
          {(!isUnderEscalation || !isNotBreached) && (
            <div className="rounded-lg border border-rose-300 bg-rose-50/90 p-2 text-xs text-rose-900 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[11px]">
                  {!isNotBreached
                    ? "SLA Breached"
                    : "Grace Period Window Closed (Escalated)"}
                </span>
                <p className="text-[10px] text-rose-800 leading-tight mt-0.5">
                  {!isNotBreached
                    ? "This grievance has already breached its SLA. Grace period extensions cannot be requested after breach."
                    : `SLA consumption has reached ${grievance.slaConsumptionPercent}%. Grace period requests are restricted to before ${escalationThreshold}% auto-escalation.`}
                </p>
              </div>
            </div>
          )}

          {/* Duration Selection */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>
                Extension Duration <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] font-normal text-slate-500">
                Max Allowed: {formatExtensionBadge(maxAllowedMinutes)} (25% cap)
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {presetMinutes.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setSelectedMinutes(mins)}
                  disabled={
                    !isEligibleWarning || !isUnderEscalation || !isNotBreached
                  }
                  className={`rounded-lg py-1.5 px-3 text-xs font-bold transition cursor-pointer border text-center ${
                    selectedMinutes === mins
                      ? "border-[#0F766E] bg-[#0F766E] text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  {formatExtensionBadge(mins)}
                </button>
              ))}
            </div>

            {/* Projected Date Preview */}
            <div className="mt-1.5 flex items-center justify-between rounded-lg bg-teal-50/70 border border-teal-200/80 px-2.5 py-1 text-xs text-teal-900">
              <div className="flex items-center gap-1.5 font-medium text-[11px]">
                <Calendar className="h-3 w-3 text-teal-700" />
                <span>Projected New Due Date:</span>
              </div>
              <span className="font-bold text-[11px]">
                {projectedDue.toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Justification Textarea */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
              <label htmlFor="grace-period-reason">
                Justification for Department Head{" "}
                <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[10px] font-medium ${
                  isValidLength ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {trimmedReason.length} / 15 chars min
              </span>
            </div>
            <textarea
              id="grace-period-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detail the operational reason for requesting extra time (e.g. Awaiting third-party forensic analysis, vendor delay)..."
              disabled={
                isSubmitting ||
                !isEligibleWarning ||
                !isUnderEscalation ||
                !isNotBreached
              }
              className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-hidden transition resize-none disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Policy Invariants Note */}
          <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-2.5 py-1.5 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="leading-tight">
              1 request/cycle &bull; SLA clock continues running &bull; Grants{" "}
              {formatExtensionBadge(selectedMinutes)} if approved.
            </span>
          </div>

          {hasExistingExtension && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                {grievance.latestExtension?.status === "PENDING"
                  ? "You have already submitted a grace period request. It is awaiting Department Head review."
                  : "An SLA extension request has already been submitted for this cycle."}
              </span>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || hasExistingExtension}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : hasExistingExtension ? (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>Request Already Submitted</span>
                </>
              ) : !isNotBreached ? (
                <>
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>SLA Breached (Closed)</span>
                </>
              ) : !isUnderEscalation ? (
                <>
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>
                    Auto-Escalated to Head (&ge;{escalationThreshold}%)
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    Submit Grace Period Request (
                    {formatExtensionBadge(selectedMinutes)})
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
