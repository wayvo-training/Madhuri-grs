"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileCheck2,
  FileText,
  Loader2,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadFileToSupabase } from "@/lib/storage-client";
import type { StaffGrievanceItem, StaffResolutionData } from "@/types/staff";

export interface DraftAttachment {
  id: string;
  name: string;
  fileName?: string;
  size: string;
  fileSize?: number;
  type?: string;
  fileType?: string;
  path?: string;
  filePath?: string;
  fileUrl?: string;
}

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
  const [existingAttachments, setExistingAttachments] = useState<
    DraftAttachment[]
  >([]);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const isSubmittingRef = useRef(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Review governance: Reopened grievances or those with manual review trigger Head review
  const isReviewRequired =
    Boolean(grievance.reopenCount && grievance.reopenCount > 0) ||
    grievance.status === "REWORK" ||
    grievance.status === "REOPENED" ||
    (grievance.manualReviewCount ?? 0) > 0;

  // Determine whether this form operates in Resolution Mode vs Department Findings Mode.
  // Primary Lead, Equal Co-Lead, and Final Sequential departments formulate the grievance resolution.
  // In-department supporting staff and supportive contributing departments submit departmental findings.
  const isResolving =
    !grievance.isSupportingStaff &&
    grievance.myInvolvementType !== "SUPPORTING" &&
    (grievance.isPrimaryOwner !== false ||
      grievance.myInvolvementType === "EQUAL" ||
      Boolean(grievance.isFinalSequentialDepartment));

  // Validation checks for resolution fields
  const isProblemSummaryOnlyDigits = /^\d+$/.test(
    problemSummary.trim().replace(/\s+/g, ""),
  );
  const hasProblemSummaryLetters = /[a-zA-Z]/.test(problemSummary.trim());
  const isProblemSummaryLengthValid = problemSummary.trim().length >= 20;
  const isProblemSummaryValid =
    isProblemSummaryLengthValid &&
    hasProblemSummaryLetters &&
    !isProblemSummaryOnlyDigits;

  const isFindingsOnlyDigits = /^\d+$/.test(
    findings.trim().replace(/\s+/g, ""),
  );
  const hasFindingsLetters = /[a-zA-Z]/.test(findings.trim());
  const isFindingsLengthValid = findings.trim().length >= 20;
  const isFindingsValid =
    isFindingsLengthValid && hasFindingsLetters && !isFindingsOnlyDigits;

  const isActionTakenOnlyDigits = /^\d+$/.test(
    actionTaken.trim().replace(/\s+/g, ""),
  );
  const hasActionTakenLetters = /[a-zA-Z]/.test(actionTaken.trim());
  const isActionTakenLengthValid = actionTaken.trim().length >= 20;
  const isActionTakenValid =
    isActionTakenLengthValid &&
    hasActionTakenLetters &&
    !isActionTakenOnlyDigits;

  const isOutcomeOnlyDigits = /^\d+$/.test(outcome.trim().replace(/\s+/g, ""));
  const hasOutcomeLetters = /[a-zA-Z]/.test(outcome.trim());
  const isOutcomeLengthValid = outcome.trim().length >= 15;
  const isOutcomeValid =
    isOutcomeLengthValid && hasOutcomeLetters && !isOutcomeOnlyDigits;

  const isFormValid = grievance.isSupportingStaff
    ? isFindingsValid
    : isProblemSummaryValid &&
      isFindingsValid &&
      isActionTakenValid &&
      isOutcomeValid;

  const getValidationError = (): string | null => {
    if (grievance.isSupportingStaff) {
      if (!findings.trim()) return "Investigation findings are required.";
      if (!isFindingsLengthValid)
        return `Investigation findings must be at least 20 characters (currently ${findings.trim().length}).`;
      if (!hasFindingsLetters || isFindingsOnlyDigits)
        return "Investigation findings must contain letters/words and cannot consist only of digits/numbers.";
      return null;
    }

    if (!problemSummary.trim()) return "Problem summary is required.";
    if (!isProblemSummaryLengthValid)
      return `Problem summary must be at least 20 characters (currently ${problemSummary.trim().length}).`;
    if (!hasProblemSummaryLetters || isProblemSummaryOnlyDigits)
      return "Problem summary must contain letters/words and cannot consist only of digits/numbers.";

    if (!findings.trim()) return "Investigation findings are required.";
    if (!isFindingsLengthValid)
      return `Investigation findings must be at least 20 characters (currently ${findings.trim().length}).`;
    if (!hasFindingsLetters || isFindingsOnlyDigits)
      return "Investigation findings must contain letters/words and cannot consist only of digits/numbers.";

    if (!actionTaken.trim()) return "Corrective action taken is required.";
    if (!isActionTakenLengthValid)
      return `Corrective action taken must be at least 20 characters (currently ${actionTaken.trim().length}).`;
    if (!hasActionTakenLetters || isActionTakenOnlyDigits)
      return "Corrective action taken must contain letters/words and cannot consist only of digits/numbers.";

    if (!outcome.trim()) return "Proposed settlement / outcome is required.";
    if (!isOutcomeLengthValid)
      return `Proposed settlement / outcome must be at least 15 characters (currently ${outcome.trim().length}).`;
    if (!hasOutcomeLetters || isOutcomeOnlyDigits)
      return "Proposed settlement / outcome must contain letters/words and cannot consist only of digits/numbers.";

    return null;
  };

  const handleRemoveExistingAttachment = (index: number) => {
    setExistingAttachments((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      const saved = localStorage.getItem(`draft_resolution_${grievance.id}`);
      if (saved) {
        try {
          const draftData = JSON.parse(saved);
          draftData.attachments = updated;
          localStorage.setItem(
            `draft_resolution_${grievance.id}`,
            JSON.stringify(draftData),
          );
        } catch (e) {
          console.error("Failed to update draft attachments in storage", e);
        }
      }
      return updated;
    });
  };

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
          if (Array.isArray(draftData.attachments)) {
            setExistingAttachments(draftData.attachments);
          } else {
            setExistingAttachments([]);
          }
          setHasRestoredDraft(true);
        } catch (e) {
          console.error("Failed to parse saved draft", e);
          setHasRestoredDraft(false);
        }
      } else {
        setExistingAttachments([]);
        setSupportingFiles([]);
        setHasRestoredDraft(false);
      }
    }
  }, [isOpen, grievance.id]);

  if (!isOpen) return null;

  const submitForm = async (isDraft: boolean) => {
    if (isDraft) {
      if (isSubmittingRef.current) return;
      setIsSavingDraft(true);
      isSubmittingRef.current = true;
      setErrorMsg(null);

      try {
        let newlyUploaded: DraftAttachment[] = [];
        if (supportingFiles.length > 0) {
          newlyUploaded = await Promise.all(
            supportingFiles.map(async (f) => {
              const uploadRes = await uploadFileToSupabase(f, "resolutions");
              const safePath = uploadRes.filePath || uploadRes.fileUrl;
              return {
                id: String(Date.now() + Math.random()),
                name: f.name,
                fileName: f.name,
                size: `${(f.size / 1024).toFixed(1)} KB`,
                fileSize: f.size,
                type: f.type || "Document",
                fileType: f.type || "Document",
                path: safePath,
                filePath: safePath,
                fileUrl: uploadRes.fileUrl,
              };
            }),
          );
        }

        const mergedAttachments = [...existingAttachments, ...newlyUploaded];
        setExistingAttachments(mergedAttachments);
        setSupportingFiles([]);

        const draftData = {
          problemSummary,
          findings,
          actionTaken,
          outcome,
          evidence,
          attachments: mergedAttachments,
        };
        localStorage.setItem(
          `draft_resolution_${grievance.id}`,
          JSON.stringify(draftData),
        );
        toast.success(
          mergedAttachments.length > 0
            ? `Resolution draft and ${mergedAttachments.length} document(s) saved.`
            : "Resolution draft saved to your browser.",
        );
        onClose();
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to save draft attachments";
        setErrorMsg(msg);
        toast.error(msg);
      } finally {
        setIsSavingDraft(false);
        isSubmittingRef.current = false;
      }
      return;
    }

    const validationError = getValidationError();
    if (validationError) {
      setErrorMsg(validationError);
      toast.error(validationError);
      return;
    }

    if (isSubmittingRef.current) return;
    setIsSubmitting(true);
    isSubmittingRef.current = true;
    setErrorMsg(null);

    try {
      let newlyUploaded: DraftAttachment[] = [];
      if (supportingFiles.length > 0) {
        newlyUploaded = await Promise.all(
          supportingFiles.map(async (f) => {
            const uploadRes = await uploadFileToSupabase(f, "resolutions");
            const safePath = uploadRes.filePath || uploadRes.fileUrl;
            return {
              id: String(Date.now() + Math.random()),
              name: f.name,
              fileName: f.name,
              size: `${(f.size / 1024).toFixed(1)} KB`,
              fileSize: f.size,
              type: f.type || "Document",
              fileType: f.type || "Document",
              path: safePath,
              filePath: safePath,
              fileUrl: uploadRes.fileUrl,
            };
          }),
        );
      }

      const allAttachments = [...existingAttachments, ...newlyUploaded];
      const attachmentPayloads = allAttachments.map((att) => ({
        id: att.id,
        name: att.name || att.fileName || "Document",
        fileName: att.fileName || att.name || "Document",
        size: att.size || `${((att.fileSize || 0) / 1024).toFixed(1)} KB`,
        fileSize:
          typeof att.fileSize === "number"
            ? Math.round(att.fileSize)
            : Math.round(Number.parseFloat(att.size || "0") * 1024),
        type: att.type || att.fileType || "Document",
        fileType: att.fileType || att.type || "Document",
        path: att.path || att.filePath || "",
        filePath: att.filePath || att.path || "",
        uploadedAt: new Date().toISOString(),
      }));
      if (!isDraft && isResolving) {
        if (
          grievance.hasPendingSupportingDepartments &&
          (grievance.pendingSupportingDepartmentNames?.length ?? 0) > 0
        ) {
          const depts = grievance.pendingSupportingDepartmentNames?.join(", ");
          throw new Error(
            `Supporting department(s) (${depts}) have not yet submitted their departmental findings. All supporting findings must be submitted before the final resolution can be submitted.`,
          );
        }
      }

      if (grievance.isSupportingStaff) {
        // Supporting Investigator Findings submission (In-Department)
        const res = await fetch(
          `/api/staff/grievances/${grievance.id}/supporting-findings`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              findings: findings.trim(),
            }),
          },
        );

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(
            data.message || "Failed to submit supporting findings",
          );
        }
        toast.success(
          "Supporting findings submitted! Primary investigator and Department Head notified.",
        );
      } else if (!isResolving) {
        // Department Findings Submission (Sequential hand-off or Supportive contributor)
        const res = await fetch(
          `/api/staff/grievances/${grievance.id}/findings`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              findings: findings.trim(),
              actionTaken: actionTaken.trim(),
              notes: `${problemSummary.trim()}\n\nOutcome / Recommendations:\n${outcome.trim()}`,
              attachments: attachmentPayloads.map((att) => ({
                fileName: att.fileName || att.name,
                fileType: att.fileType || att.type,
                fileSize:
                  typeof att.fileSize === "number"
                    ? Math.round(att.fileSize)
                    : Math.round(Number.parseFloat(att.size || "0") * 1024),
                filePath: att.filePath || att.path,
              })),
            }),
          },
        );

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(
            data.message || "Failed to submit department findings",
          );
        }
        toast.success("Department findings submitted successfully!");
      } else if (onSubmit) {
        await onSubmit(grievance.id, {
          problemSummary: problemSummary.trim(),
          findings: findings.trim(),
          actionTaken: actionTaken.trim(),
          outcome: outcome.trim(),
          evidence: evidence.trim() || null,
          attachments: attachmentPayloads.map((att) => ({
            ...att,
            fileName: att.fileName || att.name,
            filePath: att.filePath || att.path,
            fileType: att.fileType || att.type,
            fileSize:
              typeof att.fileSize === "number"
                ? Math.round(att.fileSize)
                : Math.round(Number.parseFloat(att.size || "0") * 1024),
          })),
          isDraft,
        });
        toast.success(
          isDraft
            ? "Resolution draft saved successfully!"
            : "Resolution submitted and sent to complainant successfully!",
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
              fileName: att.fileName || att.name,
              fileType: att.fileType || att.type,
              fileSize:
                typeof att.fileSize === "number"
                  ? Math.round(att.fileSize)
                  : Math.round(Number.parseFloat(att.size || "0") * 1024),
              filePath: att.filePath || att.path,
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
            : data.message ||
                "Resolution submitted and sent to complainant successfully!",
        );
      }

      localStorage.removeItem(`draft_resolution_${grievance.id}`);
      onClose();
      onResolutionSuccess?.(grievance.id);
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
                grievance.isSupportingStaff
                  ? "bg-teal-100 text-teal-800"
                  : !isResolving
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
              }`}
            >
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {grievance.isSupportingStaff
                  ? "Submit Supporting Investigation Findings"
                  : !isResolving
                    ? "Submit Department Findings & Sign-Off"
                    : "Formal Grievance Resolution & Sign-Off"}
              </h3>
              <p className="text-xs text-slate-500">
                Case {grievance.grievanceNumber} &bull; {grievance.title}
                {grievance.isSupportingStaff ? (
                  <span className="ml-1 text-teal-700 font-semibold bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded">
                    Supporting Investigator
                  </span>
                ) : !isResolving ? (
                  <span className="ml-1 text-teal-700 font-medium">
                    (Department Findings)
                  </span>
                ) : null}
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

        {/* Draft Restored Banner */}
        {hasRestoredDraft && (
          <div className="bg-emerald-50 border-b border-emerald-200/80 px-5 py-2.5 text-[11px] text-emerald-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Resolution Draft Restored:</strong> Your previously
                saved draft details and {existingAttachments.length} attached
                document(s) have been loaded.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(`draft_resolution_${grievance.id}`);
                setProblemSummary(
                  `Investigation into ${grievance.category} concern (${grievance.grievanceNumber}): ${grievance.title}`,
                );
                setFindings("");
                setActionTaken("");
                setOutcome("");
                setEvidence("");
                setExistingAttachments([]);
                setSupportingFiles([]);
                setHasRestoredDraft(false);
                toast.info("Draft discarded.");
              }}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline shrink-0 ml-2 cursor-pointer"
            >
              Discard Draft
            </button>
          </div>
        )}

        {/* Supporting Investigator Mode Notice */}
        {grievance.isSupportingStaff ? (
          <div className="bg-teal-50/90 border-b border-teal-200/80 px-5 py-2.5 text-[11px] text-teal-950 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <span>
              <strong>Supporting Investigator Mode:</strong> Record your
              findings and evidence for this case. Your findings will be
              reviewed and consolidated by the Primary Investigator, who holds
              authority to submit the final resolution.
            </span>
          </div>
        ) : !isResolving ? (
          <div className="bg-amber-50/80 border-b border-amber-200/60 px-5 py-2.5 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Department Findings:</strong> Submitting your departmental
              findings completes your investigation and updates your
              departmental status to <strong>COMPLETED</strong> for final
              resolution review.
            </span>
          </div>
        ) : isResolving &&
          grievance.hasPendingSupportingDepartments &&
          (grievance.pendingSupportingDepartmentNames?.length ?? 0) > 0 ? (
          <div className="bg-amber-50/90 border-b border-amber-200/80 px-5 py-2.5 text-[11px] text-amber-950 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Awaiting Supporting Findings:</strong> Supporting
              department(s) (
              {grievance.pendingSupportingDepartmentNames?.join(", ")}) have not
              yet submitted their departmental findings. You can prepare and
              save your resolution as a draft now, but final resolution
              submission will remain blocked until all supporting findings are
              submitted.
            </span>
          </div>
        ) : null}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Problem Summary (Primary & Cross-Department only) */}
          {!grievance.isSupportingStaff && (
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
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 transition focus:outline-hidden ${
                  problemSummary.length > 0 && !isProblemSummaryValid
                    ? "border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                    : "border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                }`}
                placeholder="Concise overview of the issue investigated"
              />
              <div className="flex items-center justify-between text-[11px]">
                <span
                  className={
                    problemSummary.length > 0 && !isProblemSummaryValid
                      ? "text-amber-700 font-medium"
                      : "text-slate-500"
                  }
                >
                  {problemSummary.length === 0
                    ? "Minimum 20 characters required. Cannot be only numbers."
                    : problemSummary.trim().length < 20
                      ? `Minimum 20 characters required (${20 - problemSummary.trim().length} more needed)`
                      : !hasProblemSummaryLetters || isProblemSummaryOnlyDigits
                        ? "Must contain letters/words (cannot be only numbers)"
                        : "✓ Valid format"}
                </span>
                <span
                  className={
                    isProblemSummaryValid
                      ? "text-emerald-700 font-semibold"
                      : "text-slate-400"
                  }
                >
                  {problemSummary.length} chars
                </span>
              </div>
            </div>
          )}

          {/* Supporting Staff Findings Consolidation Section (For Primary Investigator) */}
          {!grievance.isSupportingStaff &&
            grievance.supportingStaffFindings &&
            grievance.supportingStaffFindings.length > 0 && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-teal-700" />
                    <span>
                      Supporting Staff Investigation Findings (
                      {grievance.supportingStaffFindings.length})
                    </span>
                  </span>
                  <span className="text-[10px] text-teal-700 font-medium">
                    Synthesize into final findings
                  </span>
                </div>

                <div className="space-y-2">
                  {grievance.supportingStaffFindings.map((sf) => (
                    <div
                      key={sf.id}
                      className="rounded-lg border border-teal-200/60 bg-white p-2.5 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-800">
                          {sf.staffName} ({sf.departmentName || "Supporting"})
                        </span>
                        <span>{new Date(sf.submittedAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-[11px]">
                        {sf.findings}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const snippet = `\n\n[Findings from Supporting Staff ${sf.staffName}]:\n${sf.findings}`;
                          setFindings((prev) =>
                            prev ? prev + snippet : sf.findings,
                          );
                          toast.success(`Inserted ${sf.staffName}'s findings`);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded border border-teal-200 transition cursor-pointer"
                      >
                        + Insert into Resolution Findings
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              rows={4}
              required
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 leading-relaxed font-sans transition focus:outline-hidden ${
                findings.length > 0 && !isFindingsValid
                  ? "border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                  : "border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              }`}
              placeholder={
                grievance.isSupportingStaff
                  ? "Detail your investigation findings, inquiries made, records verified, or departmental assessments..."
                  : "Detail your findings, interviews conducted, policies referenced, or records verified..."
              }
            />
            <div className="flex items-center justify-between text-[11px]">
              <span
                className={
                  findings.length > 0 && !isFindingsValid
                    ? "text-amber-700 font-medium"
                    : "text-slate-500"
                }
              >
                {findings.length === 0
                  ? "Minimum 20 characters required. Cannot be only numbers."
                  : findings.trim().length < 20
                    ? `Minimum 20 characters required (${20 - findings.trim().length} more needed)`
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
                {findings.length} chars
              </span>
            </div>
          </div>

          {/* Action Taken (Primary & Cross-Department only) */}
          {!grievance.isSupportingStaff && (
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
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 leading-relaxed font-sans transition focus:outline-hidden ${
                  actionTaken.length > 0 && !isActionTakenValid
                    ? "border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                    : "border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                }`}
                placeholder="Specific remedies executed (e.g. system adjustments, policy explanation, corrective guidance)..."
              />
              <div className="flex items-center justify-between text-[11px]">
                <span
                  className={
                    actionTaken.length > 0 && !isActionTakenValid
                      ? "text-amber-700 font-medium"
                      : "text-slate-500"
                  }
                >
                  {actionTaken.length === 0
                    ? "Minimum 20 characters required. Cannot be only numbers."
                    : actionTaken.trim().length < 20
                      ? `Minimum 20 characters required (${20 - actionTaken.trim().length} more needed)`
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
                  {actionTaken.length} chars
                </span>
              </div>
            </div>
          )}

          {/* Final Outcome (Primary & Cross-Department only) */}
          {!grievance.isSupportingStaff && (
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
                className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 transition focus:outline-hidden ${
                  outcome.length > 0 && !isOutcomeValid
                    ? "border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-200"
                    : "border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                }`}
                placeholder="e.g. Grievance validated; leave ledger reconciled and updated"
              />
              <div className="flex items-center justify-between text-[11px]">
                <span
                  className={
                    outcome.length > 0 && !isOutcomeValid
                      ? "text-amber-700 font-medium"
                      : "text-slate-500"
                  }
                >
                  {outcome.length === 0
                    ? "Minimum 15 characters required. Cannot be only numbers."
                    : outcome.trim().length < 15
                      ? `Minimum 15 characters required (${15 - outcome.trim().length} more needed)`
                      : !hasOutcomeLetters || isOutcomeOnlyDigits
                        ? "Must contain letters/words (cannot be only numbers)"
                        : "✓ Valid format"}
                </span>
                <span
                  className={
                    isOutcomeValid
                      ? "text-emerald-700 font-semibold"
                      : "text-slate-400"
                  }
                >
                  {outcome.length} chars
                </span>
              </div>
            </div>
          )}

          {/* Supporting Evidence / Notes */}
          <div className="space-y-1">
            <label
              htmlFor="resolution-evidence"
              className="font-semibold text-slate-700"
            >
              Supportive Evidence References (Optional)
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
              <span>Supportive Documents (Optional)</span>
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
                {existingAttachments.length + supportingFiles.length === 0
                  ? "No documents attached"
                  : `${existingAttachments.length + supportingFiles.length} file(s) attached`}
              </span>
            </div>

            {(existingAttachments.length > 0 || supportingFiles.length > 0) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {/* Previously drafted / saved attachments */}
                {existingAttachments.map((att, attIndex) => (
                  <span
                    key={att.id || `draft-att-${attIndex}-${att.name}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/70 px-2.5 py-1 text-[11px] font-medium text-teal-900 shadow-2xs"
                  >
                    <FileText className="h-3 w-3 text-[#0F766E]" />
                    <span
                      className="max-w-[180px] truncate"
                      title={att.name || att.fileName}
                    >
                      {att.name || att.fileName}
                    </span>
                    <span className="text-[10px] text-teal-700">
                      (
                      {att.size ||
                        (att.fileSize
                          ? `${(att.fileSize / 1024).toFixed(0)} KB`
                          : "Attached")}
                      )
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingAttachment(attIndex)}
                      className="rounded-xs p-0.5 text-teal-600 hover:bg-teal-100 hover:text-teal-900 transition cursor-pointer"
                      title="Remove document"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}

                {/* Newly selected files */}
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
                      title="Remove document"
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
              ) : isReviewRequired ? (
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
            disabled={isSubmitting || isSavingDraft}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => submitForm(true)}
            disabled={isSubmitting || isSavingDraft}
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition disabled:opacity-50 cursor-pointer"
          >
            {isSavingDraft ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving Draft...</span>
              </span>
            ) : (
              "Save as Draft"
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              const validationError = getValidationError();
              if (validationError) {
                setErrorMsg(validationError);
                toast.error(validationError);
                return;
              }
              setErrorMsg(null);
              if (grievance.isSupportingStaff || !isResolving) {
                // Direct submission for supporting findings or department findings - avoids redundant double modal popup
                submitForm(false);
              } else if (
                grievance.hasPendingSupportingDepartments &&
                (grievance.pendingSupportingDepartmentNames?.length ?? 0) > 0
              ) {
                const depts =
                  grievance.pendingSupportingDepartmentNames?.join(", ");
                const error = `Supporting department(s) (${depts}) have not yet submitted their departmental findings. All supporting findings must be submitted before the final resolution can be submitted.`;
                setErrorMsg(error);
                toast.error(error);
              } else {
                setShowConfirmModal(true);
              }
            }}
            disabled={isSubmitting || isSavingDraft || !isFormValid}
            className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer ${
              grievance.isSupportingStaff
                ? "bg-teal-700 hover:bg-teal-800"
                : !isResolving
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-[#0F766E] hover:bg-[#115E59]"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>
                  {grievance.isSupportingStaff
                    ? "Submit Supporting Findings"
                    : !isResolving
                      ? "Submit Department Findings"
                      : isReviewRequired
                        ? "Submit for Review"
                        : "Resolve Grievance"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirmation Modal: Are you sure? */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-left space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {!isResolving
                    ? "Confirm Findings Submission"
                    : isReviewRequired
                      ? "Confirm Review Submission"
                      : "Confirm Grievance Resolution"}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {!isResolving
                    ? `Are you sure you want to submit your department's findings for ${grievance.grievanceNumber}? This will mark your participation as completed and activate the next department stage.`
                    : isReviewRequired
                      ? `Are you sure you want to submit this resolution for ${grievance.grievanceNumber}? Because this grievance is reopened, submitting will transition it to UNDER_REVIEW for Department Head approval.`
                      : `Are you sure you want to resolve ${grievance.grievanceNumber}? This will finalize the investigation, mark the grievance as RESOLVED, and notify the employee.`}
                </p>
              </div>
            </div>

            {/* Quick summary recap */}
            <div className="rounded-xl bg-slate-50 p-3.5 text-xs space-y-2 border border-slate-100">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium text-slate-500">Grievance:</span>
                <span className="font-semibold text-slate-800">
                  {grievance.grievanceNumber}
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-500 block mb-0.5">
                  Action Taken:
                </span>
                <p className="text-slate-800 line-clamp-2 italic font-normal bg-white p-2 rounded-lg border border-slate-200/60">
                  {actionTaken}
                </p>
              </div>
              <div>
                <span className="font-medium text-slate-500 block mb-0.5">
                  Outcome Summary:
                </span>
                <p className="text-slate-800 line-clamp-2 italic font-normal bg-white p-2 rounded-lg border border-slate-200/60">
                  {outcome}
                </p>
              </div>
              {existingAttachments.length + supportingFiles.length > 0 && (
                <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200/50">
                  <span className="font-medium text-slate-500">
                    Supportive Files:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {existingAttachments.length + supportingFiles.length}{" "}
                    file(s) attached
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Review Again
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  if (
                    isResolving &&
                    grievance.hasPendingSupportingDepartments &&
                    (grievance.pendingSupportingDepartmentNames?.length ?? 0) >
                      0
                  ) {
                    const depts =
                      grievance.pendingSupportingDepartmentNames?.join(", ");
                    const error = `Supporting department(s) (${depts}) have not yet submitted their departmental findings. All supporting findings must be submitted before the final resolution can be submitted.`;
                    setErrorMsg(error);
                    toast.error(error);
                    setShowConfirmModal(false);
                    return;
                  }
                  setShowConfirmModal(false);
                  await submitForm(false);
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer ${
                  !isResolving
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-[#0F766E] hover:bg-[#115E59]"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Yes, Confirm & Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
