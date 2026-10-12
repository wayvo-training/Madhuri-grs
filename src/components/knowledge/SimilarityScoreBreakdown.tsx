"use client";

import { Calculator, ChevronDown, ChevronUp, Info, Scale } from "lucide-react";
import { useState } from "react";

interface SimilarityScoreBreakdownProps {
  titleSimilarity?: number;
  descriptionSimilarity?: number;
  problemSimilarity?: number;
  resolutionSimilarity?: number;
  metadataScore: number;
  finalScore: number;
  classification: "LIKELY_DUPLICATE" | "SIMILAR" | "NO_SIGNIFICANT_MATCH";
  defaultExpanded?: boolean;
  compact?: boolean;
}

export function SimilarityScoreBreakdown({
  titleSimilarity,
  descriptionSimilarity,
  problemSimilarity,
  resolutionSimilarity,
  metadataScore,
  finalScore,
  classification,
  defaultExpanded = true,
  compact = false,
}: SimilarityScoreBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const resolvedTitleSimilarity = titleSimilarity ?? 0;
  const resolvedDescSimilarity =
    descriptionSimilarity ?? problemSimilarity ?? 0;
  const resolvedResSimilarity = resolutionSimilarity ?? 0;

  const hasResolution = resolvedResSimilarity > 0;
  const titleWeight = hasResolution ? 20 : 30;
  const descWeight = hasResolution ? 40 : 60;
  const resWeight = hasResolution ? 30 : 0;
  const metadataWeight = 10;

  const titleContribution =
    Math.round(((resolvedTitleSimilarity * titleWeight) / 100) * 100) / 100;
  const descContribution =
    Math.round(((resolvedDescSimilarity * descWeight) / 100) * 100) / 100;
  const resContribution =
    Math.round(((resolvedResSimilarity * resWeight) / 100) * 100) / 100;
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

      {/* Component Cards (Always Visible) - Title, Description, Resolution, Category */}
      <div
        className={`grid ${
          hasResolution
            ? "grid-cols-2 sm:grid-cols-4"
            : "grid-cols-1 sm:grid-cols-3"
        } gap-2 text-[11px]`}
      >
        {/* Title Card */}
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-2 space-y-0.5">
          <div className="flex items-center justify-between text-indigo-800 font-medium">
            <span>Title</span>
            <span className="text-[10px] bg-indigo-100/80 px-1.5 rounded-full font-bold">
              {titleWeight}% wt
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <strong className="text-xs font-bold text-slate-900">
              {resolvedTitleSimilarity}%
            </strong>
            <span className="text-[10px] text-indigo-900 font-semibold">
              +{titleContribution}%
            </span>
          </div>
        </div>

        {/* Description Card */}
        <div className="rounded-lg border border-teal-100 bg-teal-50/50 p-2 space-y-0.5">
          <div className="flex items-center justify-between text-teal-800 font-medium">
            <span>Description</span>
            <span className="text-[10px] bg-teal-100/80 px-1.5 rounded-full font-bold">
              {descWeight}% wt
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <strong className="text-xs font-bold text-slate-900">
              {resolvedDescSimilarity}%
            </strong>
            <span className="text-[10px] text-teal-900 font-semibold">
              +{descContribution}%
            </span>
          </div>
        </div>

        {/* Resolution Card */}
        {hasResolution && (
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-2 space-y-0.5">
            <div className="flex items-center justify-between text-blue-800 font-medium">
              <span>Resolution</span>
              <span className="text-[10px] bg-blue-100/80 px-1.5 rounded-full font-bold">
                {resWeight}% wt
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-0.5">
              <strong className="text-xs font-bold text-slate-900">
                {resolvedResSimilarity}%
              </strong>
              <span className="text-[10px] text-blue-900 font-semibold">
                +{resContribution}%
              </span>
            </div>
          </div>
        )}

        {/* Metadata Card (Category & Subcategory) */}
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-2 space-y-0.5">
          <div className="flex items-center justify-between text-emerald-800 font-medium">
            <span>Category &amp; Subcategory</span>
            <span className="text-[10px] bg-emerald-100/80 px-1.5 rounded-full font-bold">
              {metadataWeight}% wt
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
            className="bg-indigo-500 transition-all duration-300"
            style={{ width: `${titleContribution}%` }}
            title={`Title: ${titleContribution}%`}
          />
          <div
            className="bg-teal-500 transition-all duration-300"
            style={{ width: `${descContribution}%` }}
            title={`Description: ${descContribution}%`}
          />
          {hasResolution && (
            <div
              className="bg-blue-500 transition-all duration-300"
              style={{ width: `${resContribution}%` }}
              title={`Resolution: ${resContribution}%`}
            />
          )}
          <div
            className="bg-emerald-500 transition-all duration-300"
            style={{ width: `${metadataContribution}%` }}
            title={`Category & Subcategory: ${metadataContribution}%`}
          />
        </div>
      </div>

      {/* Expanded Mathematical Explanation */}
      {isExpanded && (
        <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-2.5 space-y-2 text-[11px] animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Scale className="h-3.5 w-3.5 text-slate-500" />
            <span>Mathematical Formula &amp; Scoring Model:</span>
          </div>

          <div className="rounded-md bg-white p-2 border border-slate-200 font-mono text-[10px] text-slate-700 space-y-1 overflow-x-auto">
            {hasResolution ? (
              <>
                <p className="text-slate-500 font-sans font-medium text-[10px]">
                  Final Score = (Title &times; 0.20) + (Description &times;
                  0.40) + (Resolution &times; 0.30) + (Category/Subcategory
                  &times; 0.10)
                </p>
                <p className="text-slate-900 font-bold">
                  = ({resolvedTitleSimilarity}% &times; 0.20) + (
                  {resolvedDescSimilarity}% &times; 0.40) + (
                  {resolvedResSimilarity}% &times; 0.30) + ({metadataScore}%
                  &times; 0.10)
                </p>
                <p className="text-teal-700 font-bold">
                  = {titleContribution}% + {descContribution}% +{" "}
                  {resContribution}% + {metadataContribution}% = {finalScore}%
                </p>
              </>
            ) : (
              <>
                <p className="text-slate-500 font-sans font-medium text-[10px]">
                  Final Score = (Title &times; 0.30) + (Description &times;
                  0.60) + (Category/Subcategory &times; 0.10)
                </p>
                <p className="text-slate-900 font-bold">
                  = ({resolvedTitleSimilarity}% &times; 0.30) + (
                  {resolvedDescSimilarity}% &times; 0.60) + ({metadataScore}%
                  &times; 0.10)
                </p>
                <p className="text-teal-700 font-bold">
                  = {titleContribution}% + {descContribution}% +{" "}
                  {metadataContribution}% = {finalScore}%
                </p>
              </>
            )}
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
