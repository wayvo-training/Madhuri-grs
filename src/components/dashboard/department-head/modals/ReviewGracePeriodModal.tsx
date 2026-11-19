"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PriorityBadge } from "@/components/dashboard/badges";
import type { CaseProgressData, GrievanceItem } from "@/types/department-head";

interface ReviewGracePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  grievance: GrievanceItem;
  caseProgressData: CaseProgressData | null;
  onSuccess: (updatedDueAt?: string) => void;
}

export function ReviewGracePeriodModal({
  isOpen,
  onClose,
  grievance,
  caseProgressData,
  onSuccess,
}: ReviewGracePeriodModalProps) {
  const extension =
    caseProgressData?.latestExtension || grievance.latestExtension;

  const requestedMinutes = extension?.requestedMinutes || 240;
  const requestedHours = Math.round(requestedMinutes / 60);

  const [decision, setDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate projected new due date based on requested duration
  const projectedDueDateStr = useMemo(() => {
    const rawDue = caseProgressData?.sla?.dueAt || grievance.slaDeadline;
    if (!rawDue) return "N/A";

    const baseDate = new Date(rawDue);
    if (Number.isNaN(baseDate.getTime())) {
      return `+${requestedHours}h from current target`;
    }

    const projected = new Date(baseDate.getTime() + requestedMinutes * 60000);
    return projected.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [
    caseProgressData?.sla?.dueAt,
    grievance.slaDeadline,
    requestedMinutes,
    requestedHours,
  ]);

  if (!isOpen) return null;

  const staffName =
    extension?.requestedByName ||
    caseProgressData?.assignment?.staffName ||
    grievance.assignedStaffName ||
    "Assigned Staff";

  const cleanRejection = rejectionReason.trim();
  const isRejectionValid = cleanRejection.length >= 10;

  const handleSubmit = async () => {
    if (!extension?.id) {
      toast.error("No pending grace period request found.");
      return;
    }

    if (decision === "REJECT" && !isRejectionValid) {
      toast.error(
        "Please provide a rejection reason of at least 10 characters.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `/api/department-head/grievances/${grievance.id}/grace-period`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            extensionId: extension.id,
            decision,
            grantedMinutes:
              decision === "APPROVE" ? requestedMinutes : undefined,
            rejectionReason: decision === "REJECT" ? cleanRejection : undefined,
          }),
        },
      );

      const data = (await res.json()) as {
        success?: boolean;
        message?: string;
        newDueAt?: string;
      };

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to process grace period decision.");
        return;
      }

      toast.success(
        decision === "APPROVE"
          ? `Grace period approved (+${requestedHours}h). SLA target updated.`
          : "Grace period request declined.",
      );

      onSuccess(data.newDueAt);
      onClose();
    } catch (err) {
      console.error("Error submitting grace period review:", err);
      toast.error("Network error while submitting decision. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-teal-100 flex items-center justify-center border border-teal-200 text-teal-800 shrink-0 shadow-2xs">
              <Clock className="h-4.5 w-4.5 text-teal-700 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-none">
                Review SLA Grace Period Request
              </h3>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                <span>Ticket: {grievance.ticketCode}</span>
                <span>•</span>
                <PriorityBadge priority={grievance.priority} />
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close review modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Grievance Title & Context */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Grievance Subject
            </p>
            <p className="text-xs font-medium text-slate-800 mt-0.5 line-clamp-2">
              {grievance.title}
            </p>
          </div>

          {/* SLA Status Bar */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                Current SLA Status
              </span>
              <span className="font-bold text-amber-800 bg-amber-100/90 border border-amber-200 px-2 py-0.5 rounded-md">
                {caseProgressData?.sla?.consumptionPercent ??
                  grievance.slaConsumptionPercent ??
                  55}
                % Consumed
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-amber-200/80 overflow-hidden">
              <div
                className="h-full bg-amber-600 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    caseProgressData?.sla?.consumptionPercent ??
                      grievance.slaConsumptionPercent ??
                      55,
                  )}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-amber-900 pt-0.5">
              <span>
                Remaining:{" "}
                <strong>
                  {caseProgressData?.sla?.timeRemaining ||
                    grievance.slaTimeLeft ||
                    "In Progress"}
                </strong>
              </span>
              <span>
                Target Due:{" "}
                <strong>
                  {caseProgressData?.sla?.dueAt ||
                    grievance.slaDeadline ||
                    "Scheduled"}
                </strong>
              </span>
            </div>
          </div>

          {/* Staff Request Card */}
          <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-teal-100 border border-teal-300 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-teal-950">{staffName}</p>
                  <p className="text-[11px] text-teal-700">
                    Staff Investigating Officer
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-lg border border-teal-300 bg-white px-2.5 py-1 text-xs font-bold text-teal-800 shadow-2xs">
                Requested +{requestedHours} Hours (+{requestedMinutes}m)
              </span>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-teal-900 uppercase tracking-wide flex items-center gap-1">
                <FileText className="h-3 w-3 text-teal-700" />
                Staff Justification
              </p>
              <div className="mt-1 rounded-lg border border-teal-200/90 bg-white/90 p-2.5 text-xs text-slate-800 font-serif italic leading-relaxed">
                &ldquo;
                {extension?.reason ||
                  "Additional time requested to complete investigation."}
                &rdquo;
              </div>
            </div>
          </div>

          {/* Decision Selector */}
          <div className="space-y-3 pt-1">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Department Head Decision
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDecision("APPROVE")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition cursor-pointer ${
                  decision === "APPROVE"
                    ? "border-teal-600 bg-teal-50/90 text-teal-900 shadow-2xs ring-2 ring-teal-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <CheckCircle2
                  className={`h-4 w-4 ${
                    decision === "APPROVE" ? "text-teal-700" : "text-slate-400"
                  }`}
                />
                <span>Approve Extension (+{requestedHours}h)</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision("REJECT")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition cursor-pointer ${
                  decision === "REJECT"
                    ? "border-rose-500 bg-rose-50/90 text-rose-900 shadow-2xs ring-2 ring-rose-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <XCircle
                  className={`h-4 w-4 ${
                    decision === "REJECT" ? "text-rose-600" : "text-slate-400"
                  }`}
                />
                <span>Decline Request</span>
              </button>
            </div>

            {/* Approval Info Box */}
            {decision === "APPROVE" && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3 space-y-1.5 animate-in fade-in duration-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-teal-950 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-teal-700" />
                    Projected New Target Due Date:
                  </span>
                  <span className="font-bold text-teal-900 font-mono">
                    {projectedDueDateStr}
                  </span>
                </div>
                <p className="text-[11px] text-teal-800 leading-relaxed pt-1 border-t border-teal-200/60">
                  Approving will grant the requested{" "}
                  <strong>+{requestedHours} hours</strong> extension and update
                  the SLA target date. Staff will be notified automatically.
                </p>
              </div>
            )}

            {/* Decline Options */}
            {decision === "REJECT" && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3 space-y-2 animate-in fade-in duration-100">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="rejection-reason"
                    className="block text-xs font-bold text-rose-950"
                  >
                    Reason for Declining *
                  </label>
                  <span
                    className={`text-[11px] font-medium ${
                      isRejectionValid ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    {cleanRejection.length} / 10 chars min
                  </span>
                </div>
                <textarea
                  id="rejection-reason"
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this grace period cannot be approved so the staff officer can take prompt action..."
                  className="w-full rounded-lg border border-rose-300 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-5 py-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>

          {decision === "APPROVE" ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#115E59] active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Approve Extension (+{requestedHours}h)</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !isRejectionValid}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-rose-700 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Decline Request</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
