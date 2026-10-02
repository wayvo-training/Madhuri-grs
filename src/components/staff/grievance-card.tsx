"use client";

import { Clock, Eye, FileCheck2, Mail, RotateCcw, User } from "lucide-react";
import {
  PriorityBadge,
  SlaBadge,
  StatusBadge,
} from "@/components/dashboard/badges";
import {
  buildGmailComposeUrl,
  buildStaffComplainantInquiryEmail,
} from "@/lib/email";
import type { StaffGrievanceItem } from "@/types/staff";

interface GrievanceCardProps {
  grievance: StaffGrievanceItem;
  staffName: string;
  staffEmail: string;
  onExamine: (item: StaffGrievanceItem) => void;
  onResolve: (item: StaffGrievanceItem) => void;
}

export function GrievanceCard({
  grievance,
  staffName,
  staffEmail,
  onExamine,
  onResolve,
}: GrievanceCardProps) {
  const isReopened =
    grievance.reopenCount > 0 || grievance.status === "REOPENED";
  const isCompleted =
    grievance.status === "CLOSED" || grievance.status === "UNDER_REVIEW";

  const inquiryUrl = buildGmailComposeUrl(
    buildStaffComplainantInquiryEmail({
      complainantEmail: grievance.submitterEmail,
      complainantName: grievance.submitterName,
      staffName,
      staffEmail,
      staffDesignation: "Investigating Staff",
      grievance: {
        ticketCode: grievance.grievanceNumber,
        title: grievance.title,
        category: grievance.category,
        priority: grievance.priority,
      },
    }),
  );

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all space-y-3.5">
      {/* Top Header: Code, Badges, SLA */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded border border-teal-200/80">
            {grievance.grievanceNumber}
          </span>
          <PriorityBadge priority={grievance.priority} />
          <StatusBadge status={grievance.status} />
        </div>

        <div className="flex items-center gap-2">
          {isReopened && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
              <span>Reopened ({grievance.reopenCount})</span>
            </span>
          )}
          <SlaBadge status={grievance.slaStatus} />
        </div>
      </div>

      {/* Title & Description */}
      <div>
        <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug line-clamp-1">
          {grievance.title}
        </h4>
        <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {grievance.description}
        </p>
      </div>

      {/* Metadata Strip: Submitter, Taxonomy, SLA Timer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs text-slate-500 border-t border-slate-100">
        <div className="flex items-center gap-1.5 truncate">
          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            <strong className="font-semibold text-slate-700">
              {grievance.submitterName}
            </strong>{" "}
            ({grievance.submitterRole})
          </span>
        </div>

        <div className="truncate">
          <span className="text-slate-400">Category:</span>{" "}
          <span className="font-medium text-slate-700">
            {grievance.category} / {grievance.subcategory}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:justify-end">
          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-800">
            {grievance.slaTimeLeft}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {grievance.submitterEmail && (
            <a
              href={inquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
              title={`Email complainant via Gmail (${grievance.submitterEmail})`}
            >
              <Mail className="h-3.5 w-3.5 text-slate-500" />
              <span>Email Complainant</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onExamine(grievance)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 text-slate-500" />
            <span>Examine Grievance</span>
          </button>

          {!isCompleted && (
            <button
              type="button"
              onClick={() => onResolve(grievance)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition cursor-pointer"
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Submit Resolution</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
