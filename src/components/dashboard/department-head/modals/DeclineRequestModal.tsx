"use client";

import { AlertCircle, AlertTriangle, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PriorityBadge } from "@/components/dashboard/badges";
import type { GrievanceItem } from "@/types/department-head";

interface DeclineRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  grievance: GrievanceItem | null;
  onConfirmDecline: (
    grievance: GrievanceItem,
    reason: string,
  ) => Promise<boolean>;
}

export function DeclineRequestModal({
  isOpen,
  onClose,
  grievance,
  onConfirmDecline,
}: DeclineRequestModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !grievance) return null;

  const isRework = grievance.status === "REWORK";
  const requestType = isRework ? "Rework" : "Reopening";
  const currentRejections = grievance.rejectionCount ?? 0;
  const nextRejectionAttempt = currentRejections + 1;
  const isFinalRejection = nextRejectionAttempt >= 3;
  const trimmedReason = reason.trim();
  const isValidLength = trimmedReason.length >= 15;
  const hasLetters = /[a-zA-Z]/.test(trimmedReason);
  const isValid = isValidLength && hasLetters;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      if (!isValidLength) {
        toast.error(
          `Please provide a justification of at least 15 characters (currently ${trimmedReason.length}).`,
        );
      } else if (!hasLetters) {
        toast.error(
          "Justification cannot consist of numbers or symbols alone.",
        );
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onConfirmDecline(grievance, trimmedReason);
      if (ok) {
        setReason("");
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Decline {requestType} Request
              </h3>
              <p className="text-xs text-slate-500">
                Ticket: {grievance.ticketCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isFinalRejection ? (
            <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-3.5 text-xs text-rose-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-800">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>
                  Final Review Rejection (Attempt 3 of 3) &bull; Case Will Close
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-900/90">
                This will be the 3rd rejection for this case. Confirming decline
                will permanently <strong>CLOSE</strong> this grievance and
                finalize dispute proceedings. The citizen will not be able to
                submit further rework or reopening requests.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900 space-y-1">
              <div className="flex items-center justify-between font-semibold text-amber-800">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Resolution Will Stand</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 font-bold text-amber-900 border border-amber-200">
                  Attempt {nextRejectionAttempt} of 3
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800/90">
                Declining this request will return the grievance to{" "}
                <strong>{isRework ? "RESOLVED" : "CLOSED"}</strong> status. Your
                reason will be shared with the citizen and recorded in the
                official audit trail. Note that upon reaching 3 rejections, the
                grievance will be permanently closed.
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <label htmlFor="decline-reason">
                Justification for Declining{" "}
                <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-medium ${
                  isValidLength ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {trimmedReason.length} / 15 chars min
              </span>
            </div>
            <textarea
              id="decline-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Explain why the initial resolution is justified and why ${requestType.toLowerCase()} is not warranted...`}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden transition resize-none"
            />
          </div>

          {/* Grievance Summary snippet */}
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 truncate">
                {grievance.title}
              </span>
              <PriorityBadge priority={grievance.priority} />
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {grievance.category} &bull;{" "}
              {grievance.assignedStaffName || "Unassigned"}
            </p>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Declining...</span>
                </>
              ) : isFinalRejection ? (
                <span>Confirm Final Decline &amp; Close Case</span>
              ) : (
                <span>Confirm Decline (Attempt {nextRejectionAttempt}/3)</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
