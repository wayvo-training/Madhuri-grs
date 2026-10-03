"use client";

import { AlertCircle, BookOpen, CheckCircle2, Send, ShieldAlert, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
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

/**
 * Sanitizes text to remove direct personal identifiers
 */
function sanitizePii(text: string, submitterName?: string, submitterEmail?: string): string {
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
  // Remove email patterns
  clean = clean.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email.hidden]");
  // Remove 10-digit phone patterns
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

  // 1. Problem / Scenario: Copy from grievance description or resolution problem summary without internal ticket prefix
  let rawProblem = grievance.description || "";
  if (!rawProblem && resolution?.problemSummary) {
    rawProblem = resolution.problemSummary.replace(
      /^Investigation into [^:]+:\s*/i,
      "",
    );
  }

  // 2. Resolution / Recommended Approach: Copy strictly what was submitted in the resolution (actionTaken & findings)
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

  // 3. Key Points / Preventive Guidance: Copy actual resolution outcome if present; never inject hardcoded text
  const rawKeyPoints = resolution?.outcome ? resolution.outcome.trim() : "";

  const [title, setTitle] = useState(
    `Handling ${grievance.category} / ${grievance.subcategory} — Standard Operating Procedure`,
  );
  const [category, setCategory] = useState(grievance.category || "General");
  const [subcategory, setSubcategory] = useState(
    grievance.subcategory || "General",
  );
  const [problemScenario, setProblemScenario] = useState(
    sanitizePii(rawProblem, grievance.submitterName, grievance.submitterEmail),
  );
  const [resolutionApproach, setResolutionApproach] = useState(
    sanitizePii(rawSolution, grievance.submitterName, grievance.submitterEmail),
  );
  const [keyPointsGuidance, setKeyPointsGuidance] = useState(
    sanitizePii(rawKeyPoints, grievance.submitterName, grievance.submitterEmail),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !problemScenario.trim() || !resolutionApproach.trim()) {
      const msg = "Please provide a Title, Problem / Scenario, and Resolution / Recommended Approach.";
      setErrorMsg(msg);
      toast.error("Required fields missing", { description: msg });
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const catId = grievance.categoryId || (grievance as unknown as Record<string, unknown>).category_id || undefined;
      const subCatId = grievance.subcategoryId || (grievance as unknown as Record<string, unknown>).subcategory_id || undefined;

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
        description: "Article submitted successfully for Department Head review.",
      });

      onSuccess?.();

      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to propose Knowledge Article";
      setErrorMsg(msg);
      toast.error("Submission Failed", {
        description: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
                Case {grievance.grievanceNumber || grievance.ticketCode || grievance.id} &bull; {grievance.category} / {grievance.subcategory}
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Privacy Notice Banner */}
          <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2.5 shadow-2xs">
            <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-amber-950 mb-0.5">
                Privacy Protection &amp; Confidentiality Notice
              </strong>
              Never expose employee/citizen names, personal contact information, private case details, or confidential evidence.
              Content has been pre-filled from this closed case for your convenience. Please carefully review and edit all fields below before submitting.
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label htmlFor="prop-title" className="font-semibold text-slate-700">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="prop-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
              placeholder="e.g. Standard Procedure for Processing Payroll Adjustments"
            />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="prop-category" className="font-semibold text-slate-700">
                Category
              </label>
              <input
                id="prop-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E] bg-slate-50"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="prop-subcategory" className="font-semibold text-slate-700">
                Subcategory
              </label>
              <input
                id="prop-subcategory"
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E] bg-slate-50"
              />
            </div>
          </div>

          {/* Problem / Scenario */}
          <div className="space-y-1">
            <label htmlFor="prop-problem" className="font-semibold text-slate-700">
              Problem / Scenario <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="prop-problem"
              rows={3}
              required
              value={problemScenario}
              onChange={(e) => setProblemScenario(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] leading-relaxed"
              placeholder="Generalized description of the common problem scenario or grievance pattern..."
            />
          </div>

          {/* Resolution / Recommended Approach */}
          <div className="space-y-1">
            <label htmlFor="prop-solution" className="font-semibold text-slate-700">
              Resolution / Recommended Approach <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="prop-solution"
              rows={4}
              required
              value={resolutionApproach}
              onChange={(e) => setResolutionApproach(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] leading-relaxed"
              placeholder="Step-by-step recommended resolution procedure and best practices..."
            />
          </div>

          {/* Key Points / Preventive Guidance */}
          <div className="space-y-1">
            <label htmlFor="prop-keypoints" className="font-semibold text-slate-700">
              Key Points / Preventive Guidance
            </label>
            <textarea
              id="prop-keypoints"
              rows={3}
              value={keyPointsGuidance}
              onChange={(e) => setKeyPointsGuidance(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] leading-relaxed"
              placeholder="Key lessons learned, compliance constraints, and guidance to prevent recurrence..."
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
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
                {isSubmitting ? "Submitting..." : "Submit for Review"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
