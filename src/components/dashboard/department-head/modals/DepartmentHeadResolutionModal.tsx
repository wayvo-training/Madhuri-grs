"use client";

import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Paperclip,
  X,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import type { GrievanceItem } from "@/types/department-head";

export interface DepartmentHeadResolutionModalProps {
  grievance: GrievanceItem;
  decision: "APPROVE" | "CLARIFY" | "REJECT";
  feedback: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDecisionChange: (value: "APPROVE" | "CLARIFY") => void;
  onFeedbackChange: (value: string) => void;
}

export function DepartmentHeadResolutionModal({
  grievance,
  decision,
  feedback,
  onClose,
  onSubmit,
  onDecisionChange,
  onFeedbackChange,
}: DepartmentHeadResolutionModalProps) {
  const isClarify = decision === "CLARIFY" || decision === "REJECT";
  const isDirectResolution =
    (grievance.reopenCount ?? 0) >= 2 ||
    grievance.status === "ESCALATED" ||
    grievance.status !== "UNDER_REVIEW";

  const [directFindings, setDirectFindings] = useState("");
  const [directActionTaken, setDirectActionTaken] = useState("");

  const isFeedbackOnlyDigits = /^\d+$/.test(
    feedback.trim().replace(/\s+/g, ""),
  );
  const hasFeedbackLetters = /[a-zA-Z]/.test(feedback.trim());
  const isFeedbackLengthValid = feedback.trim().length >= 15;
  const isFeedbackValid =
    isFeedbackLengthValid && hasFeedbackLetters && !isFeedbackOnlyDigits;

  const isFindingsOnlyDigits = /^\d+$/.test(
    directFindings.trim().replace(/\s+/g, ""),
  );
  const hasFindingsLetters = /[a-zA-Z]/.test(directFindings.trim());
  const isFindingsLengthValid = directFindings.trim().length >= 20;
  const isFindingsValid =
    isFindingsLengthValid && hasFindingsLetters && !isFindingsOnlyDigits;

  const isActionTakenOnlyDigits = /^\d+$/.test(
    directActionTaken.trim().replace(/\s+/g, ""),
  );
  const hasActionTakenLetters = /[a-zA-Z]/.test(directActionTaken.trim());
  const isActionTakenLengthValid = directActionTaken.trim().length >= 20;
  const isActionTakenValid =
    isActionTakenLengthValid &&
    hasActionTakenLetters &&
    !isActionTakenOnlyDigits;

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isDirectResolution || feedback.trim().length > 0) {
      if (feedback.trim().length < 15) {
        toast.error(
          `Remarks must be at least 15 characters (currently ${feedback.trim().length}).`,
        );
        return;
      }
      if (!hasFeedbackLetters || isFeedbackOnlyDigits) {
        toast.error(
          "Remarks must contain letters/words and cannot consist only of digits or numbers.",
        );
        return;
      }
    }

    if (isDirectResolution) {
      if (directFindings.trim().length < 20) {
        toast.error(
          `Findings must be at least 20 characters (currently ${directFindings.trim().length}).`,
        );
        return;
      }
      if (!hasFindingsLetters || isFindingsOnlyDigits) {
        toast.error(
          "Findings must contain letters/words and cannot consist only of digits or numbers.",
        );
        return;
      }
      if (directActionTaken.trim().length < 20) {
        toast.error(
          `Action Taken must be at least 20 characters (currently ${directActionTaken.trim().length}).`,
        );
        return;
      }
      if (!hasActionTakenLetters || isActionTakenOnlyDigits) {
        toast.error(
          "Action Taken must contain letters/words and cannot consist only of digits or numbers.",
        );
        return;
      }
    }

    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {isDirectResolution
                ? "Direct Resolution Submission"
                : "Resolution Review & Clearance"}
            </h3>
            <p className="text-xs font-normal text-slate-500">
              {isDirectResolution
                ? "Submit final resolution for "
                : "Final sign-off for "}
              <span className="font-mono font-semibold text-[#0F766E]">
                {grievance.ticketCode}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
          {grievance.submittedResolution && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-slate-800 space-y-2.5">
              <div className="flex items-center justify-between font-semibold text-emerald-950 border-b border-emerald-200/60 pb-1.5">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-emerald-700" />
                  Assigned Staff Findings & Resolution:{" "}
                  {grievance.submittedResolution.staffName}
                </span>
                <span className="text-[11px] font-normal text-slate-500">
                  {grievance.submittedResolution.submittedAt}
                </span>
              </div>

              {grievance.submittedResolution.problemSummary && (
                <div>
                  <span className="font-semibold text-slate-700 block text-[11px]">
                    Problem Summary:
                  </span>
                  <p className="text-slate-800 font-normal leading-relaxed mt-0.5">
                    {grievance.submittedResolution.problemSummary}
                  </p>
                </div>
              )}

              {grievance.submittedResolution.findings && (
                <div>
                  <span className="font-semibold text-slate-700 block text-[11px]">
                    Findings:
                  </span>
                  <p className="text-slate-800 font-normal leading-relaxed mt-0.5">
                    {grievance.submittedResolution.findings}
                  </p>
                </div>
              )}

              {grievance.submittedResolution.actionTaken && (
                <div>
                  <span className="font-semibold text-slate-700 block text-[11px]">
                    Action Taken:
                  </span>
                  <p className="text-slate-800 font-normal leading-relaxed mt-0.5">
                    {grievance.submittedResolution.actionTaken}
                  </p>
                </div>
              )}

              {grievance.submittedResolution.outcome && (
                <div>
                  <span className="font-semibold text-slate-700 block text-[11px]">
                    Outcome / Recommendation:
                  </span>
                  <p className="text-slate-800 font-normal leading-relaxed mt-0.5">
                    {grievance.submittedResolution.outcome}
                  </p>
                </div>
              )}

              {grievance.submittedResolution.attachments &&
                grievance.submittedResolution.attachments.length > 0 && (
                  <div className="pt-2 border-t border-emerald-200/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-950">
                      <Paperclip className="h-3.5 w-3.5 text-emerald-700" />
                      <span>
                        Supportive Resolution Documents (
                        {grievance.submittedResolution.attachments.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {grievance.submittedResolution.attachments.map(
                        (att, idx) => (
                          <div
                            key={att.id || `res-att-${idx}`}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg border border-emerald-200/60 bg-white/90 shadow-2xs"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <FileText className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                              <div className="min-w-0">
                                <p
                                  className="text-[11px] font-medium text-slate-800 truncate"
                                  title={att.name}
                                >
                                  {att.name}
                                </p>
                                {att.size && (
                                  <p className="text-[9px] text-slate-400">
                                    {att.size}
                                  </p>
                                )}
                              </div>
                            </div>
                            {att.downloadUrl && (
                              <div className="flex items-center gap-1 shrink-0">
                                <a
                                  href={att.downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
                                  title="View document"
                                >
                                  <Eye className="h-2.5 w-2.5" />
                                  <span>View</span>
                                </a>
                                <a
                                  href={`${att.downloadUrl}${att.downloadUrl.includes("?") ? "&" : "?"}download=true`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={att.name}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                                  title="Download document"
                                >
                                  <Download className="h-2.5 w-2.5" />
                                  <span>Download</span>
                                </a>
                              </div>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {!isDirectResolution && (
            <div>
              <div className="block text-xs font-semibold text-slate-800 mb-1.5">
                Department Head Final Decision
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onDecisionChange("APPROVE")}
                  className={`rounded-xl border p-3 text-xs text-left transition ${
                    decision === "APPROVE"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-600"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700 font-normal"
                  }`}
                >
                  ✅ Approve & Clear Escalation
                  <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                    Clear escalation flag & mark grievance as CLOSED
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onDecisionChange("CLARIFY")}
                  className={`rounded-xl border p-3 text-xs text-left transition ${
                    isClarify
                      ? "border-slate-800 bg-slate-100 text-slate-900 font-semibold ring-1 ring-slate-800"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700 font-normal"
                  }`}
                >
                  🔄 Request Clarification
                  <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                    Return to assigned staff member for revision
                  </div>
                </button>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="review-feedback"
              className="block text-xs font-semibold text-slate-800 mb-1.5"
            >
              {isDirectResolution
                ? "Problem Summary"
                : decision === "APPROVE"
                  ? "Final Approval Remarks (Logged to Audit Trail)"
                  : "Clarification Directives"}
            </label>
            <textarea
              id="review-feedback"
              rows={isDirectResolution ? 2 : 3}
              value={feedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              placeholder={
                isDirectResolution
                  ? "e.g. Issue directly resolved by Department Head."
                  : decision === "APPROVE"
                    ? "e.g. Resolution verified and sanctioned. All compliance requirements fulfilled."
                    : "e.g. Please verify additional bank annexures before final submission."
              }
              className={`w-full rounded-xl border p-3 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition ${
                feedback.length > 0 && !isFeedbackValid
                  ? "border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                  : "border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              }`}
              required={!isDirectResolution}
            />
            {(!isDirectResolution || feedback.length > 0) && (
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span
                  className={
                    feedback.length > 0 && !isFeedbackValid
                      ? "text-amber-700 font-medium"
                      : "text-slate-500"
                  }
                >
                  {feedback.length === 0
                    ? "Minimum 15 characters required. Cannot be only numbers."
                    : feedback.trim().length < 15
                      ? `Minimum 15 characters required (${15 - feedback.trim().length} more needed)`
                      : !hasFeedbackLetters || isFeedbackOnlyDigits
                        ? "Must contain letters/words (cannot be only numbers)"
                        : "✓ Valid format"}
                </span>
                <span
                  className={
                    isFeedbackValid
                      ? "text-emerald-700 font-semibold"
                      : "text-slate-400"
                  }
                >
                  {feedback.length} chars
                </span>
              </div>
            )}
          </div>

          {isDirectResolution && (
            <>
              <div>
                <label
                  htmlFor="direct-findings"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  Findings / Investigation Details{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="direct-findings"
                  name="findings"
                  rows={3}
                  value={directFindings}
                  onChange={(e) => setDirectFindings(e.target.value)}
                  placeholder="e.g. Re-evaluated the investigation findings and documents provided by the employee..."
                  className={`w-full rounded-xl border p-3 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition ${
                    directFindings.length > 0 && !isFindingsValid
                      ? "border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                      : "border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  }`}
                  required
                />
                <div className="flex items-center justify-between text-[11px] mt-1">
                  <span
                    className={
                      directFindings.length > 0 && !isFindingsValid
                        ? "text-amber-700 font-medium"
                        : "text-slate-500"
                    }
                  >
                    {directFindings.length === 0
                      ? "Minimum 20 characters required. Cannot be only numbers."
                      : directFindings.trim().length < 20
                        ? `Minimum 20 characters required (${20 - directFindings.trim().length} more needed)`
                        : !hasFindingsLetters || isFindingsOnlyDigits
                          ? "Must contain letters/words (cannot be only numbers)"
                          : "✓ Valid format"}
                  </span>
                  <span
                    className={
                      isFindingsValid
                        ? "text-emerald-700 font-semibold"
                        : "text-slate-400"
                    }
                  >
                    {directFindings.length} chars
                  </span>
                </div>
              </div>
              <div>
                <label
                  htmlFor="direct-action"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  Action Taken <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="direct-action"
                  name="actionTaken"
                  rows={3}
                  value={directActionTaken}
                  onChange={(e) => setDirectActionTaken(e.target.value)}
                  placeholder="e.g. Approved the requested change and updated records."
                  className={`w-full rounded-xl border p-3 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition ${
                    directActionTaken.length > 0 && !isActionTakenValid
                      ? "border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                      : "border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  }`}
                  required
                />
                <div className="flex items-center justify-between text-[11px] mt-1">
                  <span
                    className={
                      directActionTaken.length > 0 && !isActionTakenValid
                        ? "text-amber-700 font-medium"
                        : "text-slate-500"
                    }
                  >
                    {directActionTaken.length === 0
                      ? "Minimum 20 characters required. Cannot be only numbers."
                      : directActionTaken.trim().length < 20
                        ? `Minimum 20 characters required (${20 - directActionTaken.trim().length} more needed)`
                        : !hasActionTakenLetters || isActionTakenOnlyDigits
                          ? "Must contain letters/words (cannot be only numbers)"
                          : "✓ Valid format"}
                  </span>
                  <span
                    className={
                      isActionTakenValid
                        ? "text-emerald-700 font-semibold"
                        : "text-slate-400"
                    }
                  >
                    {directActionTaken.length} chars
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer ${
                decision === "APPROVE"
                  ? "bg-[#0F766E] hover:bg-[#115E59]"
                  : "bg-slate-800 hover:bg-slate-900"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                {isDirectResolution
                  ? "Submit Resolution for Review"
                  : decision === "APPROVE"
                    ? "Endorse Resolution for Review"
                    : "Return to Staff with Feedback"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
