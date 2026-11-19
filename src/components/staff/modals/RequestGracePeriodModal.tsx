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

const BASELINE_HOURS: Record<StaffPriority, number> = {
  CRITICAL: 24,
  HIGH: 48,
  MEDIUM: 72,
  LOW: 120,
};

export function RequestGracePeriodModal({
  isOpen,
  onClose,
  grievance,
  onSuccess,
}: RequestGracePeriodModalProps) {
  const normPriority =
    (grievance.priority?.toUpperCase() as StaffPriority) || "MEDIUM";
  const baselineHours = BASELINE_HOURS[normPriority] || 72;

  // Maximum single extension is min(24h, 25% of baseline)
  const maxAllowedHours = useMemo(() => {
    const twentyFivePercent = Math.round((baselineHours * 25) / 100);
    return Math.min(24, Math.max(1, twentyFivePercent));
  }, [baselineHours]);

  const presetHours = useMemo(() => {
    const candidates = [2, 4, 6, 8, 12, 18, 24];
    const filtered = candidates.filter((h) => h <= maxAllowedHours);
    if (!filtered.includes(maxAllowedHours)) {
      filtered.push(maxAllowedHours);
      filtered.sort((a, b) => a - b);
    }
    return filtered;
  }, [maxAllowedHours]);

  const [selectedHours, setSelectedHours] = useState<number>(() => {
    const defaultChoice =
      presetHours[Math.floor(presetHours.length / 2)] || maxAllowedHours;
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
  const isEligible50 = grievance.slaConsumptionPercent >= 50;
  const canSubmit =
    isValidLength &&
    hasLetters &&
    isEligible50 &&
    !hasExistingExtension &&
    !isSubmitting;

  const currentDue = grievance.dueAt ? new Date(grievance.dueAt) : new Date();
  const projectedDue = new Date(
    currentDue.getTime() + selectedHours * 60 * 60 * 1000,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasExistingExtension || hasExistingPending) {
      toast.error("You have already submitted a grace period request.");
      return;
    }
    if (!canSubmit) {
      if (!isEligible50) {
        toast.error(
          `Grace period can only be requested after at least 50% SLA is consumed (currently ${grievance.slaConsumptionPercent}%).`,
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
            requestedMinutes: selectedHours * 60,
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
          `Grace period request (+${selectedHours}h) submitted for Department Head review.`,
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
                  grievance.slaConsumptionPercent >= 75
                    ? "bg-rose-100 text-rose-800"
                    : grievance.slaConsumptionPercent >= 50
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {grievance.slaConsumptionPercent}% Consumed
              </span>
            </div>

            {/* SLA Progress Bar with 50% & 75% markers */}
            <div className="space-y-0.5">
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-300 ${
                    grievance.slaConsumptionPercent >= 75
                      ? "bg-rose-500"
                      : grievance.slaConsumptionPercent >= 50
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
                  50% (Grace Period Unlocked)
                </span>
                <span className="font-semibold text-rose-700">
                  75% (Auto-Escalate)
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
                  {baselineHours} Hours
                </span>
              </div>
            </div>
          </div>

          {/* Under 50% Warning */}
          {!isEligible50 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50/90 p-2 text-xs text-amber-900 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[11px]">
                  Minimum Threshold Not Reached
                </span>
                <p className="text-[10px] text-amber-800 leading-tight mt-0.5">
                  Grace period requests unlock after at least 50% SLA is
                  consumed (currently {grievance.slaConsumptionPercent}%).
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
                Max Allowed: +{maxAllowedHours}h (25% cap)
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
              {presetHours.map((hours) => (
                <button
                  key={hours}
                  type="button"
                  onClick={() => setSelectedHours(hours)}
                  disabled={!isEligible50}
                  className={`rounded-lg py-1.5 px-2 text-xs font-bold transition cursor-pointer border text-center ${
                    selectedHours === hours
                      ? "border-[#0F766E] bg-[#0F766E] text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  +{hours}h
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
              disabled={isSubmitting || !isEligible50}
              className="w-full rounded-xl border border-slate-300 p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] outline-hidden transition resize-none disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Policy Invariants Note */}
          <div className="rounded-lg bg-slate-50 border border-slate-200/70 px-2.5 py-1.5 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="leading-tight">
              1 request/cycle &bull; SLA clock continues running &bull; Grants +
              {selectedHours}h if approved.
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
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>Submit Grace Period Request (+{selectedHours}h)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
