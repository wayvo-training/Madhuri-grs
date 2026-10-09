"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  FileText,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadFileToSupabase } from "@/lib/storage-client";
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
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && grievance.id) {
      const saved = localStorage.getItem(`draft_resolution_${grievance.id}`);
      if (saved) {
        try {
          const draftData = JSON.parse(saved);
          if (draftData.problemSummary)
            setProblemSummary(draftData.problemSummary);
          if (draftData.findings) setFindings(draftData.findings);
          if (draftData.actionTaken) setActionTaken(draftData.actionTaken);
          if (draftData.outcome) setOutcome(draftData.outcome);
          if (draftData.evidence) setEvidence(draftData.evidence);
        } catch (e) {
          console.error("Failed to parse saved draft", e);
        }
      }
    }
  }, [isOpen, grievance.id]);

  if (!isOpen) return null;

  const submitForm = async (isDraft: boolean) => {
    if (isDraft) {
      const draftData = {
        problemSummary,
        findings,
        actionTaken,
        outcome,
        evidence,
      };
      localStorage.setItem(
        `draft_resolution_${grievance.id}`,
        JSON.stringify(draftData),
      );
      toast.success("Resolution draft saved to your browser.");
      onClose();
      return;
    }

    if (
      !problemSummary.trim() ||
      !findings.trim() ||
      !actionTaken.trim() ||
      !outcome.trim()
    ) {
      setErrorMsg("Please complete all required fields before submitting.");
      return;
    }

    if (isSubmittingRef.current) return;
    setIsSubmitting(true);
    isSubmittingRef.current = true;
    setErrorMsg(null);

    try {
      const attachmentPayloads = await Promise.all(
        supportingFiles.map(async (f) => {
          const uploadRes = await uploadFileToSupabase(f, "resolutions");
          return {
            id: String(Date.now() + Math.random()),
            name: f.name,
            size: `${(f.size / 1024).toFixed(1)} KB`,
            type: f.type || "Document",
            path: uploadRes.fileUrl || uploadRes.filePath,
            uploadedAt: new Date().toISOString(),
          };
        }),
      );
      if (grievance.isPrimaryOwner === false) {
        // Supporting Department Findings Submission
        const res = await fetch(
          `/api/staff/grievances/${grievance.id}/findings`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              findings: findings.trim(),
              actionTaken: actionTaken.trim(),
              notes: `${problemSummary.trim()}\n\nOutcome / Recommendations:\n${outcome.trim()}`,
            }),
          },
        );

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(
            data.message || "Failed to submit department findings",
          );
        }
        toast.success(
          "Department findings submitted! Forwarded to Lead Department.",
        );
      } else if (onSubmit) {
        await onSubmit(grievance.id, {
          problemSummary: problemSummary.trim(),
          findings: findings.trim(),
          actionTaken: actionTaken.trim(),
          outcome: outcome.trim(),
          evidence: evidence.trim() || null,
          attachments: attachmentPayloads,
          isDraft,
        });
        toast.success(
          isDraft
            ? "Resolution draft saved successfully!"
            : "Resolution submitted successfully for Department Head review!",
        );
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
            attachments: attachmentPayloads.map((att) => ({
              fileName: att.name,
              fileType: att.type,
              fileSize: Number.parseFloat(att.size) * 1024,
              filePath: att.path,
            })),
            isDraft,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to submit resolution");
        }
        toast.success(
          isDraft
            ? "Resolution draft saved successfully!"
            : "Resolution submitted successfully for Department Head review!",
        );
      }

      localStorage.removeItem(`draft_resolution_${grievance.id}`);
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
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                grievance.isPrimaryOwner === false
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {grievance.isPrimaryOwner === false
                  ? "Submit Department Findings & Sign-Off"
                  : "Submit Grievance Resolution"}
              </h3>
              <p className="text-xs text-slate-500">
                Case {grievance.grievanceNumber} &bull; {grievance.title}
                {grievance.isPrimaryOwner === false && (
                  <span className="ml-1 text-amber-600 font-medium">
                    (Supporting Contributor)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Supporting Contributor Notice Banner */}
        {grievance.isPrimaryOwner === false && (
          <div className="bg-amber-50/80 border-b border-amber-200/60 px-5 py-2.5 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Supporting Department Role:</strong> Submitting your
              departmental findings completes your investigation and updates
              your departmental status to <strong>COMPLETED</strong>. Your
              findings will be shared with the Lead Department to compile the
              final employee resolution.
            </span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

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

          {/* Supporting Documents (Optional) */}
          <div className="space-y-1.5">
            <div className="font-semibold text-slate-700 flex items-center justify-between text-xs">
              <span>Supporting Documents (Optional)</span>
              <span className="text-[11px] font-normal text-slate-500">
                PDF, Images, Sheets, Docs
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition cursor-pointer">
                <Paperclip className="h-3.5 w-3.5 text-[#0F766E]" />
                <span>Attach Document</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const newFiles = Array.from(e.target.files);
                      setSupportingFiles((prev) => [...prev, ...newFiles]);
                    }
                    e.target.value = "";
                  }}
                />
              </label>
              <span className="text-[11px] text-slate-500">
                {supportingFiles.length === 0
                  ? "No documents attached"
                  : `${supportingFiles.length} file(s) attached`}
              </span>
            </div>

            {supportingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {supportingFiles.map((file, fileIndex) => (
                  <span
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/70 px-2.5 py-1 text-[11px] font-medium text-teal-900 shadow-2xs"
                  >
                    <FileText className="h-3 w-3 text-[#0F766E]" />
                    <span className="max-w-[180px] truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[10px] text-teal-700">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSupportingFiles((prev) =>
                          prev.filter((_, i) => i !== fileIndex),
                        )
                      }
                      className="rounded-xs p-0.5 text-teal-600 hover:bg-teal-100 hover:text-teal-900 transition cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Governance Notice */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-[11px] text-slate-600 flex items-start gap-2 leading-relaxed">
            <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              {grievance.isPrimaryOwner === false ? (
                <>
                  Submitting department findings will mark your department's
                  involvement as <strong>COMPLETED</strong> and record your
                  findings in the collaborative case file. The Lead Department
                  will be alerted to review your findings and submit the final
                  customer resolution.
                </>
              ) : grievance.reopenCount >= 3 ? (
                <>
                  Submitting this resolution transitions the grievance to{" "}
                  <strong>UNDER_REVIEW</strong>. Your Department Head and the
                  Employee will be notified to review and confirm the proposed
                  resolution according to governance policy.
                </>
              ) : (
                <>
                  Submitting this resolution will finalize and resolve the
                  grievance directly, notifying the Employee.
                </>
              )}
            </span>
          </div>
        </div>

        {/* Footer Actions (Pinned) */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-slate-100 bg-slate-50/80 rounded-b-2xl shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => submitForm(true)}
            disabled={isSubmitting}
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition disabled:opacity-50 cursor-pointer"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => submitForm(false)}
            disabled={
              isSubmitting ||
              !problemSummary.trim() ||
              !findings.trim() ||
              !actionTaken.trim() ||
              !outcome.trim()
            }
            className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer ${
              grievance.isPrimaryOwner === false
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-[#0F766E] hover:bg-[#115E59]"
            }`}
          >
            <Send className="h-3.5 w-3.5" />
            <span>
              {isSubmitting
                ? "Submitting..."
                : grievance.isPrimaryOwner === false
                  ? "Submit Department Findings"
                  : grievance.reopenCount >= 3
                    ? "Submit for Review"
                    : "Resolve Grievance"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
