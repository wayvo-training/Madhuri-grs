"use client";

import { Eye, FileCheck2, FileX } from "lucide-react";
import type { KnowledgeArticleData } from "./KnowledgeArticleViewerModal";

interface KnowledgeArticleCardProps {
  article: KnowledgeArticleData;
  onInspect: (article: KnowledgeArticleData) => void;
  onApprove?: (article: KnowledgeArticleData) => void;
  onReject?: (article: KnowledgeArticleData) => void;
  isSubmitting?: boolean;
}

export function KnowledgeArticleCard({
  article,
  onInspect,
  onApprove,
  onReject,
  isSubmitting = false,
}: KnowledgeArticleCardProps) {
  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-4 shadow-2xs hover:border-teal-400/80 transition-all space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4
              className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-xl"
              title={article.title}
            >
              {article.title}
            </h4>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] shrink-0 ${
                article.status === "PUBLISHED"
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                  : article.status === "PENDING_REVIEW"
                    ? "bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                    : article.status === "REJECTED"
                      ? "bg-rose-100 text-rose-900 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                      : "bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {article.status.replace("_", " ")}
            </span>

            {/* Duplicate Check Indicator for review decision support */}
            {article.status === "PENDING_REVIEW" && article.duplicateCheck && (
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 shrink-0 ${
                  article.duplicateCheck.highestClassification ===
                  "LIKELY_DUPLICATE"
                    ? "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                    : article.duplicateCheck.highestClassification === "SIMILAR"
                      ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                }`}
              >
                {article.duplicateCheck.highestClassification ===
                "LIKELY_DUPLICATE"
                  ? `⚠️ Likely Duplicate (${article.duplicateCheck.highestScore}%)`
                  : article.duplicateCheck.highestClassification === "SIMILAR"
                    ? `⚠️ Similar Article Found (${article.duplicateCheck.highestScore}%)`
                    : article.duplicateCheck.highestScore > 0
                      ? `✓ Low Match (${article.duplicateCheck.highestScore}%)`
                      : "✓ No Duplicate (0%)"}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            Department:{" "}
            <strong className="text-slate-700 dark:text-slate-300">
              {article.departmentName || "General"}
            </strong>{" "}
            &bull; Category:{" "}
            <strong className="text-slate-700 dark:text-slate-300">
              {article.category}
            </strong>{" "}
            &bull; Subcategory:{" "}
            <strong className="text-slate-700 dark:text-slate-300">
              {article.subcategory}
            </strong>{" "}
            &bull; Author:{" "}
            <strong className="text-slate-700 dark:text-slate-300">
              {article.createdBy}
            </strong>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onInspect(article)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Inspect</span>
          </button>

          {article.status === "PENDING_REVIEW" &&
            (article.canApprove ? (
              <>
                {onReject && (
                  <button
                    type="button"
                    onClick={() => onReject(article)}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer disabled:opacity-50"
                  >
                    <FileX className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                    <span>Reject</span>
                  </button>
                )}

                {onApprove && (
                  <button
                    type="button"
                    onClick={() => onApprove(article)}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#0F766E] text-white text-xs font-semibold shadow-xs hover:bg-[#115E59] transition cursor-pointer disabled:opacity-50"
                  >
                    <FileCheck2 className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                )}
              </>
            ) : (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                {article.departmentName
                  ? `${article.departmentName} Review`
                  : "Respective Dept Review"}
              </span>
            ))}
        </div>
      </div>

      {/* Problem Snippet */}
      <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          Problem Pattern:
        </span>
        <p className="line-clamp-2 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
          {article.problem ||
            article.solutionSteps ||
            `Standard redressal procedure and recurring pattern for ${article.title}.`}
        </p>
      </div>

      {article.status === "REJECTED" && article.rejectionReason && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-2.5 text-xs text-rose-800 dark:text-rose-300">
          <strong>Rejection Feedback:</strong> {article.rejectionReason}
        </div>
      )}
    </div>
  );
}
