"use client";

import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Lightbulb,
  Shield,
  X,
} from "lucide-react";

export interface KnowledgeArticleData {
  id: string;
  title: string;
  problem: string;
  solutionSteps: string;
  considerations?: string | null;
  references?: string | null;
  rejectionReason?: string | null;
  category?: string;
  subcategory?: string;
  createdBy?: string;
  createdAt?: string;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED";
}

interface KnowledgeArticleViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: KnowledgeArticleData | null;
}

export function KnowledgeArticleViewerModal({
  isOpen,
  onClose,
  article,
}: KnowledgeArticleViewerModalProps) {
  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-[#0F766E]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {article.title}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    article.status === "PUBLISHED"
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                      : article.status === "PENDING_REVIEW"
                        ? "bg-amber-100 text-amber-900 border border-amber-200"
                        : article.status === "REJECTED"
                          ? "bg-rose-100 text-rose-900 border border-rose-200"
                          : "bg-slate-100 text-slate-800 border border-slate-200"
                  }`}
                >
                  {article.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Category: {article.category || "General"} &bull; Subcategory:{" "}
                {article.subcategory || "General"}
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Rejection notice if rejected */}
          {article.status === "REJECTED" && article.rejectionReason && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900 space-y-1">
              <strong className="flex items-center gap-1.5 font-bold">
                <Shield className="h-3.5 w-3.5 text-rose-600" />
                Department Head Review Feedback (Rework Required):
              </strong>
              <p className="text-xs">{article.rejectionReason}</p>
            </div>
          )}

          {/* Problem / Issue Pattern */}
          <div className="space-y-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              Problem / Issue Pattern:
            </span>
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/50 text-slate-800 leading-relaxed font-normal">
              {article.problem}
            </div>
          </div>

          {/* Recommended Solution Steps */}
          <div className="space-y-1">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              Recommended Standard Solution Steps:
            </span>
            <div className="rounded-xl border border-emerald-200/80 p-3.5 bg-emerald-50/30 text-slate-900 leading-relaxed font-normal whitespace-pre-wrap">
              {article.solutionSteps}
            </div>
          </div>

          {/* Important Considerations */}
          {article.considerations && (
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                Important Governance &amp; Policy Considerations:
              </span>
              <div className="rounded-xl border border-amber-200 p-3 bg-amber-50/30 text-slate-800 leading-relaxed font-normal">
                {article.considerations}
              </div>
            </div>
          )}

          {/* Supporting References */}
          {article.references && (
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                Supporting Policy References &amp; Links:
              </span>
              <div className="rounded-xl border border-blue-200 p-3 bg-blue-50/30 text-slate-800 leading-relaxed font-normal">
                {article.references}
              </div>
            </div>
          )}

          {/* Informational Disclaimer Banner */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 leading-relaxed flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>
              This Knowledge Base article is an authorized reference guide for
              Staff. Staff retains full responsibility to investigate each
              individual grievance independently.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
