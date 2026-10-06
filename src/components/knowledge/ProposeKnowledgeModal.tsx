"use client";

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Eye,
  Loader2,
  Search,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type KnowledgeArticleData,
  KnowledgeArticleViewerModal,
} from "./KnowledgeArticleViewerModal";

export interface ProposeKnowledgeGrievance {
  id: string;
  grievanceNumber?: string;
  ticketCode?: string;
  title: string;
  category: string;
  subcategory: string;
  categoryId?: string | null;
  subcategoryId?: string | null;
  description?: string;
  submitterName?: string;
  submitterEmail?: string;
  submittedResolution?: {
    id?: string;
    problemSummary?: string;
    actionTaken?: string;
    findings?: string;
    outcome?: string;
    note?: string;
    staffName?: string;
  } | null;
}

interface ProposeKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  grievance: ProposeKnowledgeGrievance;
}

interface DuplicateCandidate {
  articleId: string;
  articleTitle: string;
  status: string;
  problemSimilarity: number;
  resolutionSimilarity: number;
  titleSimilarity: number;
  metadataScore: number;
  finalScore: number;
  classification: "LIKELY_DUPLICATE" | "SIMILAR" | "NO_SIGNIFICANT_MATCH";
  problemText?: string;
  resolutionText?: string;
}

interface DuplicateCheckState {
  hasChecked: boolean;
  isChecking: boolean;
  classification:
    | "LIKELY_DUPLICATE"
    | "SIMILAR"
    | "NO_SIGNIFICANT_MATCH"
    | null;
  highestMatch: DuplicateCandidate | null;
  candidates: DuplicateCandidate[];
}

/**
 * Sanitizes text to remove direct personal identifiers
 */
function sanitizePii(
  text: string,
  submitterName?: string,
  submitterEmail?: string,
): string {
  if (!text) return "";
  let clean = text;
  if (submitterName && submitterName.trim()) {
    const nameRegex = new RegExp(submitterName.trim(), "gi");
    clean = clean.replace(nameRegex, "[Citizen/Employee]");
  }
  if (submitterEmail && submitterEmail.trim()) {
    const emailRegex = new RegExp(submitterEmail.trim(), "gi");
    clean = clean.replace(emailRegex, "[user@email.hidden]");
  }
  clean = clean.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "[email.hidden]",
  );
  clean = clean.replace(/\b\d{10}\b/g, "[phone.hidden]");
  return clean;
}

export function ProposeKnowledgeModal({
  isOpen,
  onClose,
  onSuccess,
  grievance,
}: ProposeKnowledgeModalProps) {
  const resolution = grievance.submittedResolution;

  let rawProblem = grievance.description || "";
  if (!rawProblem && resolution?.problemSummary) {
    rawProblem = resolution.problemSummary.replace(
      /^Investigation into [^:]+:\s*/i,
      "",
    );
  }

  let rawSolution = resolution?.actionTaken || "";
  if (!rawSolution && resolution?.note) {
    rawSolution = resolution.note.replace(/^Investigation into [^:]+:\s*/i, "");
  }
  if (
    resolution?.findings &&
    resolution.findings.trim() &&
    resolution.findings.trim() !== rawSolution.trim()
  ) {
    rawSolution = rawSolution
      ? `${rawSolution}\n\nFindings:\n${resolution.findings}`
      : resolution.findings;
  }

  const rawKeyPoints = resolution?.outcome ? resolution.outcome.trim() : "";

  const [title, setTitle] = useState(
    `Handling ${grievance.category} / ${grievance.subcategory} — Standard Operating Procedure`,
  );
  const [category] = useState(grievance.category || "General");
  const [subcategory] = useState(grievance.subcategory || "General");
  const [problemScenario, setProblemScenario] = useState(
    sanitizePii(rawProblem, grievance.submitterName, grievance.submitterEmail),
  );
  const [resolutionApproach, setResolutionApproach] = useState(
    sanitizePii(rawSolution, grievance.submitterName, grievance.submitterEmail),
  );
  const [keyPointsGuidance, setKeyPointsGuidance] = useState(
    sanitizePii(
      rawKeyPoints,
      grievance.submitterName,
      grievance.submitterEmail,
    ),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Duplicate detection state (Section 11)
  const [dupState, setDupState] = useState<DuplicateCheckState>({
    hasChecked: false,
    isChecking: false,
    classification: null,
    highestMatch: null,
    candidates: [],
  });
  const [duplicateJustification, setDuplicateJustification] = useState("");
  const [viewingExistingArticle, setViewingExistingArticle] =
    useState<KnowledgeArticleData | null>(null);

  if (!isOpen) return null;

  const catId =
    grievance.categoryId ||
    (grievance as unknown as Record<string, unknown>).category_id ||
    undefined;
  const subCatId =
    grievance.subcategoryId ||
    (grievance as unknown as Record<string, unknown>).subcategory_id ||
    undefined;

  // Resets duplicate check status when text fields are modified
  const handleFieldChange = (setter: (val: string) => void, val: string) => {
    setter(val);
    if (dupState.hasChecked) {
      setDupState({
        hasChecked: false,
        isChecking: false,
        classification: null,
        highestMatch: null,
        candidates: [],
      });
    }
  };

  /**
   * Runs duplicate / similarity check against taxonomy-filtered existing knowledge articles.
   */
  const runDuplicateCheck = async (): Promise<DuplicateCheckState> => {
    setDupState((prev) => ({ ...prev, isChecking: true }));
    setErrorMsg(null);

    try {
      const res = await fetch("/api/staff/knowledge/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          problem: problemScenario.trim(),
          resolution: resolutionApproach.trim(),
          category: category.trim(),
          subcategory: subcategory.trim(),
          categoryId: catId,
          subcategoryId: subCatId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Duplicate check failed.");
      }

      const nextState: DuplicateCheckState = {
        hasChecked: true,
        isChecking: false,
        classification: data.highestClassification || "NO_SIGNIFICANT_MATCH",
        highestMatch: data.highestMatch || null,
        candidates: data.candidates || [],
      };

      setDupState(nextState);
      return nextState;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Duplicate check failed.";
      console.warn("Non-fatal duplicate check error:", msg);
      const fallbackState: DuplicateCheckState = {
        hasChecked: true,
        isChecking: false,
        classification: "NO_SIGNIFICANT_MATCH",
        highestMatch: null,
        candidates: [],
      };
      setDupState(fallbackState);
      return fallbackState;
    }
  };

  /**
   * Submits the knowledge article proposal to the backend.
   */
  const executeSubmit = async (justification?: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/staff/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category: category.trim(),
          subcategory: subcategory.trim(),
          problemSummary: problemScenario.trim(),
          solutionSteps: resolutionApproach.trim(),
          considerations: keyPointsGuidance.trim() || undefined,
          categoryId: catId,
          subcategoryId: subCatId,
          sourceResolutionId: resolution?.id || undefined,
          grievanceId: grievance.id,
          status: "PENDING_REVIEW",
          duplicateJustification: justification?.trim() || undefined,
          duplicateCheckResult: dupState.highestMatch
            ? {
                highestScore: dupState.highestMatch.finalScore,
                highestClassification: dupState.classification,
                matchedArticleId: dupState.highestMatch.articleId,
                matchedArticleTitle: dupState.highestMatch.articleTitle,
                matchedArticleStatus: dupState.highestMatch.status,
                problemSimilarity: dupState.highestMatch.problemSimilarity,
                resolutionSimilarity:
                  dupState.highestMatch.resolutionSimilarity,
                titleSimilarity: dupState.highestMatch.titleSimilarity,
                metadataScore: dupState.highestMatch.metadataScore,
              }
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to propose Knowledge Article.");
      }

      setSuccessMsg(
        "Knowledge Article submitted successfully for Department Head review (Status: PENDING_REVIEW).",
      );
      toast.success("Knowledge Article Proposed", {
        description:
          "Article submitted successfully for Department Head review.",
      });

      onSuccess?.();

      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1500);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to propose Knowledge Article";
      setErrorMsg(msg);
      toast.error("Submission Failed", {
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Primary form submit:
   * 1. Validates required fields.
   * 2. Runs duplicate detection if not yet checked.
   * 3. If NO_SIGNIFICANT_MATCH, completes proposal.
   * 4. If SIMILAR or LIKELY_DUPLICATE, shows match details for review first.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !title.trim() ||
      !problemScenario.trim() ||
      !resolutionApproach.trim()
    ) {
      const msg =
        "Please provide a Title, Problem / Scenario, and Resolution / Recommended Approach.";
      setErrorMsg(msg);
      toast.error("Required fields missing", { description: msg });
      return;
    }

    // Step 1: If duplicate check hasn't run yet, run it first
    if (!dupState.hasChecked) {
      const result = await runDuplicateCheck();
      if (result.classification === "NO_SIGNIFICANT_MATCH") {
        // No match -> directly proceed with submission
        await executeSubmit();
      }
      // If SIMILAR or LIKELY_DUPLICATE, stop here and show duplicate check UI
      return;
    }

    // Step 2: If LIKELY_DUPLICATE, require justification reason
    if (dupState.classification === "LIKELY_DUPLICATE") {
      if (!duplicateJustification.trim()) {
        const msg =
          "A highly similar knowledge article already exists. Please provide a justification reason to continue.";
        setErrorMsg(msg);
        toast.error("Reason required", { description: msg });
        return;
      }
      await executeSubmit(duplicateJustification);
      return;
    }

    // Step 3: Otherwise submit
    await executeSubmit(duplicateJustification);
  };

  const handleInspectExisting = (candidate: DuplicateCandidate) => {
    setViewingExistingArticle({
      id: candidate.articleId,
      title: candidate.articleTitle,
      problem:
        candidate.problemText ||
        "Pre-existing knowledge problem / scenario documentation.",
      resolution:
        candidate.resolutionText ||
        "Pre-existing recommended approach and resolution.",
      category,
      subcategory,
      status:
        (candidate.status as "PUBLISHED" | "PENDING_REVIEW") || "PUBLISHED",
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden my-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-5 shrink-0 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-[#0F766E]">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Propose Knowledge Article
                </h3>
                <p className="text-xs text-slate-500">
                  Case{" "}
                  {grievance.grievanceNumber ||
                    grievance.ticketCode ||
                    grievance.id}{" "}
                  &bull; {grievance.category} / {grievance.subcategory}
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

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-5 space-y-4 text-xs"
          >
            {/* Generalization Guidance Banner */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block font-semibold">
                  Organizational Knowledge Generalization:
                </strong>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Generalize details so they reflect recurring policy
                  procedures. Specific employee names, phone numbers, and IDs
                  have been automatically sanitized.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-rose-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Title */}
            <div className="space-y-1">
              <label
                htmlFor="prop-title"
                className="font-semibold text-slate-700"
              >
                Article Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="prop-title"
                type="text"
                required
                value={title}
                onChange={(e) => handleFieldChange(setTitle, e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
                placeholder="e.g. Annual Leave Discrepancy Correction Standard Operating Procedure"
              />
            </div>

            {/* Taxonomy Metadata (Filtered automatically) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label
                  htmlFor="prop-category"
                  className="font-semibold text-slate-700"
                >
                  Category
                </label>
                <input
                  id="prop-category"
                  type="text"
                  disabled
                  value={category}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600 font-medium cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="prop-subcategory"
                  className="font-semibold text-slate-700"
                >
                  Subcategory
                </label>
                <input
                  id="prop-subcategory"
                  type="text"
                  disabled
                  value={subcategory}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {/* Problem / Scenario */}
            <div className="space-y-1">
              <label
                htmlFor="prop-problem"
                className="font-semibold text-slate-700"
              >
                Problem / Scenario <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="prop-problem"
                rows={3}
                required
                value={problemScenario}
                onChange={(e) =>
                  handleFieldChange(setProblemScenario, e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] leading-relaxed"
                placeholder="Describe the generalized problem and recurring scenario..."
              />
            </div>

            {/* Resolution / Recommended Approach */}
            <div className="space-y-1">
              <label
                htmlFor="prop-solution"
                className="font-semibold text-slate-700"
              >
                Resolution / Recommended Approach{" "}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="prop-solution"
                rows={4}
                required
                value={resolutionApproach}
                onChange={(e) =>
                  handleFieldChange(setResolutionApproach, e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] leading-relaxed"
                placeholder="Step-by-step recommended resolution procedure and best practices..."
              />
            </div>

            {/* Key Points / Preventive Guidance */}
            <div className="space-y-1">
              <label
                htmlFor="prop-keypoints"
                className="font-semibold text-slate-700"
              >
                Key Points / Preventive Guidance
              </label>
              <textarea
                id="prop-keypoints"
                rows={2}
                value={keyPointsGuidance}
                onChange={(e) => setKeyPointsGuidance(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] leading-relaxed"
                placeholder="Key lessons learned, compliance constraints, and guidance to prevent recurrence..."
              />
            </div>

            {/* ==================================================== */}
            {/* DUPLICATE CHECK RESULTS DISPLAY (Section 11) */}
            {/* ==================================================== */}

            {dupState.isChecking && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 flex items-center gap-2.5 text-teal-900 animate-in fade-in">
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                <span className="font-semibold text-xs">
                  Checking existing knowledge...
                </span>
              </div>
            )}

            {!dupState.isChecking &&
              dupState.hasChecked &&
              dupState.classification === "NO_SIGNIFICANT_MATCH" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-center gap-2 text-emerald-900 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-xs">
                    ✓ No significant duplicate found.
                  </span>
                </div>
              )}

            {/* SIMILAR KNOWLEDGE FOUND (75–89%) */}
            {!dupState.isChecking &&
              dupState.hasChecked &&
              dupState.classification === "SIMILAR" &&
              dupState.highestMatch && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 space-y-3 text-amber-950 animate-in fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <strong className="font-bold text-xs text-amber-950">
                        Similar Knowledge Found
                      </strong>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/90 text-amber-900">
                      Similarity Score: {dupState.highestMatch.finalScore}%
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-900">
                    Similar knowledge found. Review before creating a new
                    article.
                  </p>

                  <div className="rounded-lg bg-white p-3 border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="font-bold text-xs text-slate-900 truncate">
                        {dupState.highestMatch.articleTitle}
                      </h5>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 shrink-0">
                        {dupState.highestMatch.status}
                      </span>
                    </div>

                    {/* Component scores */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 border-t border-slate-100 text-[10px]">
                      <div className="rounded-md bg-slate-50 p-1.5">
                        <span className="text-slate-500 block">Problem:</span>
                        <strong className="text-slate-900 font-bold">
                          {dupState.highestMatch.problemSimilarity}%
                        </strong>
                      </div>
                      <div className="rounded-md bg-slate-50 p-1.5">
                        <span className="text-slate-500 block">
                          Resolution:
                        </span>
                        <strong className="text-slate-900 font-bold">
                          {dupState.highestMatch.resolutionSimilarity}%
                        </strong>
                      </div>
                      <div className="rounded-md bg-slate-50 p-1.5">
                        <span className="text-slate-500 block">Title:</span>
                        <strong className="text-slate-900 font-bold">
                          {dupState.highestMatch.titleSimilarity}%
                        </strong>
                      </div>
                      <div className="rounded-md bg-slate-50 p-1.5">
                        <span className="text-slate-500 block">Metadata:</span>
                        <strong className="text-slate-900 font-bold">
                          {dupState.highestMatch.metadataScore}%
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (dupState.highestMatch) {
                          handleInspectExisting(dupState.highestMatch);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-amber-900 text-xs font-semibold hover:bg-amber-100 transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Existing Article</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => executeSubmit()}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition cursor-pointer disabled:opacity-50"
                    >
                      <span>Continue with Proposal</span>
                    </button>
                  </div>
                </div>
              )}

            {/* LIKELY DUPLICATE (>= 90%) */}
            {!dupState.isChecking &&
              dupState.hasChecked &&
              dupState.classification === "LIKELY_DUPLICATE" &&
              dupState.highestMatch && (
                <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-4 space-y-3 text-rose-950 animate-in fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                      <strong className="font-bold text-xs text-rose-950">
                        Likely Duplicate
                      </strong>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-200/90 text-rose-900">
                      Similarity Score: {dupState.highestMatch.finalScore}%
                    </span>
                  </div>

                  <p className="text-[11px] text-rose-900 font-medium leading-relaxed">
                    A highly similar knowledge article already exists. Review
                    the existing article before creating a new one.
                  </p>

                  <div className="rounded-lg bg-white p-3 border border-rose-200/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h5 className="font-bold text-xs text-slate-900 truncate">
                        {dupState.highestMatch.articleTitle}
                      </h5>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 shrink-0">
                        {dupState.highestMatch.status}
                      </span>
                    </div>

                    {/* Component scores */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 border-t border-slate-100 text-[10px]">
                      <div className="rounded-md bg-slate-50 p-1.5">
                        <span className="text-slate-500 block">Problem:</span>
                        <strong className="text-slate-900 font-bold">
                          {dupState.highestMatch.problemSimilarity}%
                        </strong>
                      </div>
                      <div className="rounded-md bg-slate-50 p-1.5">
                        <span className="text-slate-500 block">
                          Resolution:
                        </span>
                        <strong className="text-slate-900 font-bold">
                          {dupState.highestMatch.resolutionSimilarity}%
                        </strong>
                      </div>
                      <div className="rounded-md bg-slate-50 p-1.5">
                        <span className="text-slate-500 block">Title:</span>
                        <strong className="text-slate-900 font-bold">
                          {dupState.highestMatch.titleSimilarity}%
                        </strong>
                      </div>
                      <div className="rounded-md bg-slate-50 p-1.5">
                        <span className="text-slate-500 block">Metadata:</span>
                        <strong className="text-slate-900 font-bold">
                          {dupState.highestMatch.metadataScore}%
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Mandatory justification requirement */}
                  <div className="space-y-1 pt-1 border-t border-rose-200/70">
                    <label
                      htmlFor="prop-justification"
                      className="font-bold text-[11px] text-rose-950 block"
                    >
                      Reason for continuing with new proposal (Required):{" "}
                      <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      id="prop-justification"
                      rows={2}
                      required
                      value={duplicateJustification}
                      onChange={(e) =>
                        setDuplicateJustification(e.target.value)
                      }
                      className="w-full rounded-xl border border-rose-300 bg-white p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 leading-relaxed"
                      placeholder="Explain why this proposal is distinct or necessary despite the existing match..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (dupState.highestMatch) {
                          handleInspectExisting(dupState.highestMatch);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-300 bg-white text-rose-900 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Existing Article</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => executeSubmit(duplicateJustification)}
                      disabled={isSubmitting || !duplicateJustification.trim()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-semibold hover:bg-rose-800 transition cursor-pointer disabled:opacity-40"
                    >
                      <span>Continue with New Proposal</span>
                    </button>
                  </div>
                </div>
              )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {/* Optional Manual Duplicate Check button */}
              <button
                type="button"
                onClick={runDuplicateCheck}
                disabled={dupState.isChecking || isSubmitting}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                <Search className="h-3.5 w-3.5 text-slate-500" />
                <span>
                  {dupState.isChecking ? "Checking..." : "Check for Duplicates"}
                </span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                {(!dupState.hasChecked ||
                  dupState.classification === "NO_SIGNIFICANT_MATCH") && (
                  <button
                    type="submit"
                    disabled={isSubmitting || dupState.isChecking}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>
                      {isSubmitting
                        ? "Submitting..."
                        : dupState.isChecking
                          ? "Checking..."
                          : "Submit for Review"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Existing Article Viewer Modal */}
      {viewingExistingArticle && (
        <KnowledgeArticleViewerModal
          isOpen={!!viewingExistingArticle}
          onClose={() => setViewingExistingArticle(null)}
          article={viewingExistingArticle}
        />
      )}
    </>
  );
}
