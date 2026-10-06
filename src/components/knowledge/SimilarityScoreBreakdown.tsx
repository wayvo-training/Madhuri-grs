"use client";

import { Calculator, ChevronDown, ChevronUp, Info, Scale } from "lucide-react";
import { useState } from "react";

interface SimilarityScoreBreakdownProps {
  problemSimilarity: number;
  resolutionSimilarity: number;
  titleSimilarity: number;
  metadataScore: number;
  finalScore: number;
  classification: "LIKELY_DUPLICATE" | "SIMILAR" | "NO_SIGNIFICANT_MATCH";
  defaultExpanded?: boolean;
  compact?: boolean;
}

export function SimilarityScoreBreakdown({
  problemSimilarity,
  resolutionSimilarity,
  titleSimilarity,
  metadataScore,
  finalScore,
  classification,
  defaultExpanded = true,
  compact = false,
}: SimilarityScoreBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Weighted component contributions
  const problemWeight = 40;
  const resolutionWeight = 35;
  const titleWeight = 15;
  const metadataWeight = 10;

  const problemContribution =
    Math.round(((problemSimilarity * problemWeight) / 100) * 100) / 100;
  const resolutionContribution =
    Math.round(((resolutionSimilarity * resolutionWeight) / 100) * 100) / 100;
  const titleContribution =
    Math.round(((titleSimilarity * titleWeight) / 100) * 100) / 100;
  const metadataContribution =
    Math.round(((metadataScore * metadataWeight) / 100) * 100) / 100;

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 space-y-3 shadow-2xs text-slate-800">
      {/* Header: Score & Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Calculator className="h-4 w-4 text-teal-600 shrink-0" />
          <span className="font-bold text-xs text-slate-900">
            Similarity Calculation Breakdown
          </span>
          <span
            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
              classification === "LIKELY_DUPLICATE"
                ? "bg-rose-100 text-rose-800 border border-rose-200"
                : classification === "SIMILAR"
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
            }`}
          >
            {finalScore}% ({classification.replace("_", " ")})
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 transition cursor-pointer"
        >
          <span>{isExpanded ? "Hide formula" : "How is this calculated?"}</span>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Component Cards (Always Visible) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        {/* Problem Card */}
        <div className="rounded-lg border border-teal-100 bg-teal-50/50 p-2 space-y-0.5">
          <div className="flex items-center justify-between text-teal-800 font-medium">
            <span>Problem</span>
            <span className="text-[10px] bg-teal-100/80 px-1.5 rounded-full font-bold">
              40% wt
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <strong className="text-xs font-bold text-slate-900">
              {problemSimilarity}%
            </strong>
            <span className="text-[10px] text-teal-900 font-semibold">
              +{problemContribution}%
            </span>
          </div>
        </div>

        {/* Resolution Card */}
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-2 space-y-0.5">
          <div className="flex items-center justify-between text-blue-800 font-medium">
            <span>Resolution</span>
            <span className="text-[10px] bg-blue-100/80 px-1.5 rounded-full font-bold">
              35% wt
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <strong className="text-xs font-bold text-slate-900">
              {resolutionSimilarity}%
            </strong>
            <span className="text-[10px] text-blue-900 font-semibold">
              +{resolutionContribution}%
            </span>
          </div>
        </div>

        {/* Title Card */}
        <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-2 space-y-0.5">
          <div className="flex items-center justify-between text-purple-800 font-medium">
            <span>Title</span>
            <span className="text-[10px] bg-purple-100/80 px-1.5 rounded-full font-bold">
              15% wt
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <strong className="text-xs font-bold text-slate-900">
              {titleSimilarity}%
            </strong>
            <span className="text-[10px] text-purple-900 font-semibold">
              +{titleContribution}%
            </span>
          </div>
        </div>

        {/* Metadata Card */}
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-2 space-y-0.5">
          <div className="flex items-center justify-between text-emerald-800 font-medium">
            <span>Metadata</span>
            <span className="text-[10px] bg-emerald-100/80 px-1.5 rounded-full font-bold">
              10% wt
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <strong className="text-xs font-bold text-slate-900">
              {metadataScore}%
            </strong>
            <span className="text-[10px] text-emerald-900 font-semibold">
              +{metadataContribution}%
            </span>
          </div>
        </div>
      </div>

      {/* Visual Multi-Segment Contribution Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>Weighted Contribution to Total Score:</span>
          <strong className="text-slate-900 font-bold">{finalScore}%</strong>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
          <div
            className="bg-teal-500 transition-all duration-300"
            style={{ width: `${problemContribution}%` }}
            title={`Problem: ${problemContribution}%`}
          />
          <div
            className="bg-blue-500 transition-all duration-300"
            style={{ width: `${resolutionContribution}%` }}
            title={`Resolution: ${resolutionContribution}%`}
          />
          <div
            className="bg-purple-500 transition-all duration-300"
            style={{ width: `${titleContribution}%` }}
            title={`Title: ${titleContribution}%`}
          />
          <div
            className="bg-emerald-500 transition-all duration-300"
            style={{ width: `${metadataContribution}%` }}
            title={`Metadata: ${metadataContribution}%`}
          />
        </div>
      </div>

      {/* Expanded Mathematical Explanation (Section 9) */}
      {isExpanded && (
        <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-2.5 space-y-2 text-[11px] animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Scale className="h-3.5 w-3.5 text-slate-500" />
            <span>Mathematical Formula &amp; Scoring Model:</span>
          </div>

          <div className="rounded-md bg-white p-2 border border-slate-200 font-mono text-[10px] text-slate-700 space-y-1 overflow-x-auto">
            <p className="text-slate-500 font-sans font-medium text-[10px]">
              Final Score = (Problem &times; 0.40) + (Resolution &times; 0.35) +
              (Title &times; 0.15) + (Metadata &times; 0.10)
            </p>
            <p className="text-slate-900 font-bold">
              = ({problemSimilarity}% &times; 0.40) + ({resolutionSimilarity}%
              &times; 0.35) + ({titleSimilarity}% &times; 0.15) + (
              {metadataScore}% &times; 0.10)
            </p>
            <p className="text-teal-700 font-bold">
              = {problemContribution}% + {resolutionContribution}% +{" "}
              {titleContribution}% + {metadataContribution}% = {finalScore}%
            </p>
          </div>

          {!compact && (
            <div className="text-[10px] text-slate-500 space-y-1 pt-1 border-t border-slate-200/70">
              <div className="flex items-start gap-1">
                <Info className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                <span>
                  <strong>Thresholds:</strong> &ge; 90% is classified as{" "}
                  <strong>Likely Duplicate</strong> (strong warning &amp;
                  justification required). 75–89% is{" "}
                  <strong>Similar Knowledge</strong> (review recommended). Below
                  75% indicates no significant overlap.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
