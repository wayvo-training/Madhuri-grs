"use client";

import { AlertCircle, BookOpen, CheckCircle2, Send, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { StaffGrievanceItem } from "@/types/staff";

interface ProposeKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  grievance: StaffGrievanceItem;
}

export function ProposeKnowledgeModal({
  isOpen,
  onClose,
  grievance,
}: ProposeKnowledgeModalProps) {
  const resolution = grievance.submittedResolution;

  const [title, setTitle] = useState(
    `Handling ${grievance.category} Concerns — ${grievance.title}`,
  );
  const [problemSummary, setProblemSummary] = useState(
    resolution?.problemSummary || grievance.description || "",
  );
  const [solutionSteps, setSolutionSteps] = useState(
    resolution
      ? `${resolution.actionTaken}\n\nKey Findings: ${resolution.findings}`
      : "",
  );
  const [considerations, setConsiderations] = useState("");
  const [references, setReferences] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !problemSummary.trim() || !solutionSteps.trim()) {
      setErrorMsg(
        "Please fill in the title, problem pattern, and solution steps.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const catId =
        (grievance as unknown as Record<string, unknown>).categoryId ||
        undefined;
      const subCatId =
        (grievance as unknown as Record<string, unknown>).subcategoryId ||
        undefined;

      const res = await fetch("/api/staff/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          problemSummary: problemSummary.trim(),
          solutionSteps: solutionSteps.trim(),
          considerations: considerations.trim() || undefined,
          references: references.trim() || undefined,
          categoryId: catId,
          subcategoryId: subCatId,
          sourceResolutionId: resolution?.id || undefined,
          status: "PENDING_REVIEW",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to propose Knowledge Article.");
      }

      setSuccessMsg(
        "Knowledge Base Article proposed successfully! Your Department Head will review it before publication.",
      );
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 2000);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Failed to propose Knowledge Article",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-[#0F766E]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Propose Reusable Knowledge Article
              </h3>
              <p className="text-xs text-slate-500">
                Case {grievance.grievanceNumber} &bull; {grievance.category}
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
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4 text-xs"
        >
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

          <div className="rounded-xl border border-teal-200 bg-[#F0FDFA]/70 p-3 text-[11px] text-teal-800 leading-relaxed">
            Extract generalized, reusable resolution guidance from this case to
            assist staff with future grievances. Please ensure all employee
            personal identifiers are sanitized.
          </div>

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
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E]"
              placeholder="e.g. Standard Procedure for Performance Evaluation Reviews"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="prop-problem"
              className="font-semibold text-slate-700"
            >
              Problem / Issue Pattern <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="prop-problem"
              rows={3}
              required
              value={problemSummary}
              onChange={(e) => setProblemSummary(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] leading-relaxed"
              placeholder="Generic description of the common grievance issue pattern..."
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="prop-solution"
              className="font-semibold text-slate-700"
            >
              Recommended Solution Steps{" "}
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="prop-solution"
              rows={4}
              required
              value={solutionSteps}
              onChange={(e) => setSolutionSteps(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] leading-relaxed"
              placeholder="Step-by-step guidance to resolve similar cases effectively..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="prop-considerations"
                className="font-semibold text-slate-700"
              >
                Important Considerations (Optional)
              </label>
              <input
                id="prop-considerations"
                type="text"
                value={considerations}
                onChange={(e) => setConsiderations(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E]"
                placeholder="Nuances, edge cases, SLA constraints..."
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="prop-references"
                className="font-semibold text-slate-700"
              >
                Supporting References (Optional)
              </label>
              <input
                id="prop-references"
                type="text"
                value={references}
                onChange={(e) => setReferences(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#0F766E]"
                placeholder="Policy section, circular ref #..."
              />
            </div>
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
                {isSubmitting ? "Submitting..." : "Submit to Department Head"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
