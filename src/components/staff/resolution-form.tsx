"use client";

import { AlertCircle, CheckCircle2, FileCheck2, Send, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { StaffGrievanceItem, StaffResolutionData } from "@/types/staff";

interface ResolutionFormProps {
  isOpen: boolean;
  onClose: () => void;
  grievance: StaffGrievanceItem;
  onResolutionSuccess?: (grievanceId: string) => void;
  onSubmit?: (
    grievanceId: string,
    resolution: StaffResolutionData,
  ) => Promise<void>;
}

export function ResolutionForm({
  isOpen,
  onClose,
  grievance,
  onResolutionSuccess,
  onSubmit,
}: ResolutionFormProps) {
  const [problemSummary, setProblemSummary] = useState(
    `Investigation into ${grievance.category} concern (${grievance.grievanceNumber}): ${grievance.title}`,
  );
  const [findings, setFindings] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [outcome, setOutcome] = useState("");
  const [evidence, setEvidence] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !problemSummary.trim() ||
      !findings.trim() ||
      !actionTaken.trim() ||
      !outcome.trim()
    ) {
      setErrorMsg(
        "Please complete all required fields before submitting the resolution.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (onSubmit) {
        await onSubmit(grievance.id, {
          problemSummary: problemSummary.trim(),
          findings: findings.trim(),
          actionTaken: actionTaken.trim(),
          outcome: outcome.trim(),
          evidence: evidence.trim() || null,
        });
      } else {
        const res = await fetch("/api/staff/resolutions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grievanceId: grievance.id,
            problemSummary: problemSummary.trim(),
            findings: findings.trim(),
            actionTaken: actionTaken.trim(),
            outcome: outcome.trim(),
            evidence: evidence.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to submit resolution");
        }
      }

      onResolutionSuccess?.(grievance.id);
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while submitting resolution",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Submit Grievance Resolution
              </h3>
              <p className="text-xs text-slate-500">
                Case {grievance.grievanceNumber} &bull; {grievance.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Problem Summary */}
          <div className="space-y-1">
            <label
              htmlFor="resolution-problem-summary"
              className="font-semibold text-slate-700"
            >
              Problem Summary <span className="text-rose-500">*</span>
            </label>
            <input
              id="resolution-problem-summary"
              type="text"
              required
              value={problemSummary}
              onChange={(e) => setProblemSummary(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              placeholder="Concise overview of the issue investigated"
            />
          </div>

          {/* Investigation Findings */}
          <div className="space-y-1">
            <label
              htmlFor="resolution-findings"
              className="font-semibold text-slate-700"
            >
              Investigation Findings <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="resolution-findings"
              rows={3}
              required
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 leading-relaxed font-sans"
              placeholder="Detail your findings, interviews conducted, policies referenced, or records verified..."
            />
          </div>

          {/* Action Taken */}
          <div className="space-y-1">
            <label
              htmlFor="resolution-action-taken"
              className="font-semibold text-slate-700"
            >
              Corrective Action Taken <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="resolution-action-taken"
              rows={3}
              required
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 leading-relaxed font-sans"
              placeholder="Specific remedies executed (e.g. system adjustments, policy explanation, corrective guidance)..."
            />
          </div>

          {/* Final Outcome */}
          <div className="space-y-1">
            <label
              htmlFor="resolution-outcome"
              className="font-semibold text-slate-700"
            >
              Proposed Settlement / Outcome{" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="resolution-outcome"
              type="text"
              required
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              placeholder="e.g. Grievance validated; leave ledger reconciled and updated"
            />
          </div>

          {/* Supporting Evidence / Notes */}
          <div className="space-y-1">
            <label
              htmlFor="resolution-evidence"
              className="font-semibold text-slate-700"
            >
              Supporting Evidence References (Optional)
            </label>
            <input
              id="resolution-evidence"
              type="text"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              placeholder="e.g. Verified against HR ledger ref #2026-Q1; email confirmation attached"
            />
          </div>

          {/* Governance Notice */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-[11px] text-slate-600 flex items-start gap-2 leading-relaxed">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              Submitting this resolution transitions the grievance to{" "}
              <strong>UNDER_REVIEW</strong>. Your Department Head and the
              Complainant will be notified to review and confirm the proposed
              resolution according to governance policy.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {isSubmitting
                  ? "Submitting Resolution..."
                  : "Submit Resolution for Review"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
