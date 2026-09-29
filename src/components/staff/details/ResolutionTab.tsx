"use client";

import { FileCheck2 } from "lucide-react";
import type { StaffGrievanceItem } from "@/types/staff";

interface ResolutionTabProps {
  grievance: StaffGrievanceItem;
}

export function ResolutionTab({ grievance }: ResolutionTabProps) {
  if (!grievance.submittedResolution) {
    return null;
  }

  return (
    <div className="space-y-4 text-xs">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-emerald-900 flex items-center gap-1.5">
            <FileCheck2 className="h-4 w-4 text-emerald-700" />
            Submitted Resolution Record
          </span>
          {grievance.submittedResolution.reviewStatus && (
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                grievance.submittedResolution.reviewStatus === "ACCEPTED"
                  ? "bg-emerald-100 text-emerald-900"
                  : grievance.submittedResolution.reviewStatus === "REJECTED"
                    ? "bg-rose-100 text-rose-900"
                    : "bg-amber-100 text-amber-900"
              }`}
            >
              {grievance.submittedResolution.reviewStatus}
            </span>
          )}
        </div>
        {grievance.submittedResolution.rejectionReason && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-rose-800 text-xs">
            <strong>Rejection / Rework Feedback:</strong>{" "}
            {grievance.submittedResolution.rejectionReason}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <span className="font-semibold text-slate-700">Problem Summary:</span>
        <p className="rounded-xl border border-slate-200 p-3 bg-white text-slate-800 leading-relaxed">
          {grievance.submittedResolution.problemSummary}
        </p>
      </div>

      <div className="space-y-1">
        <span className="font-semibold text-slate-700">
          Investigation Findings:
        </span>
        <p className="rounded-xl border border-slate-200 p-3 bg-white text-slate-800 leading-relaxed">
          {grievance.submittedResolution.findings}
        </p>
      </div>

      <div className="space-y-1">
        <span className="font-semibold text-slate-700">
          Corrective Action Taken:
        </span>
        <p className="rounded-xl border border-slate-200 p-3 bg-white text-slate-800 leading-relaxed">
          {grievance.submittedResolution.actionTaken}
        </p>
      </div>

      <div className="space-y-1">
        <span className="font-semibold text-slate-700">Final Outcome:</span>
        <p className="rounded-xl border border-slate-200 p-3 bg-white text-slate-800 leading-relaxed font-medium">
          {grievance.submittedResolution.outcome}
        </p>
      </div>

      {grievance.submittedResolution.evidence && (
        <div className="space-y-1">
          <span className="font-semibold text-slate-700">
            Evidence References:
          </span>
          <p className="rounded-xl border border-slate-200 p-3 bg-white text-slate-800 leading-relaxed">
            {grievance.submittedResolution.evidence}
          </p>
        </div>
      )}
    </div>
  );
}
