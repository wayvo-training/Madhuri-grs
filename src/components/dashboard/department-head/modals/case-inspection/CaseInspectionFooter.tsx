"use client";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Mail,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import {
  canHeadProposeKnowledge,
  canHeadSubmitResolution,
  hasHeadResolutionAuthority,
} from "@/lib/department-head/filters";
import type {
  CaseProgressData,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";
import { SendStaffDirectiveModal } from "./SendStaffDirectiveModal";

interface CaseInspectionFooterProps {
  currentGrievance: GrievanceItem;
  caseProgressData: CaseProgressData | null;
  staffList: StaffMember[];
  currentHodName: string;
  hodName: string;
  currentHodEmail?: string;
  hodEmail?: string;
  onClose: () => void;
  onAssignClick: (item: GrievanceItem) => void;
  onEscalateClick?: (item: GrievanceItem) => void;
  onReviewResolutionClick: (item: GrievanceItem) => void;
  onProposeKbClick?: (item: GrievanceItem) => void;
  onAddInternalNote?: (
    grievance: GrievanceItem,
    note: string,
  ) => Promise<GrievanceItem | undefined>;
}

export function CaseInspectionFooter({
  currentGrievance,
  caseProgressData,
  staffList,
  currentHodName,
  hodName,
  currentHodEmail,
  hodEmail,
  onClose,
  onAssignClick,
  onEscalateClick,
  onReviewResolutionClick,
  onProposeKbClick,
  onAddInternalNote,
}: CaseInspectionFooterProps) {
  const [isDirectiveModalOpen, setIsDirectiveModalOpen] = useState(false);

  const staffEmail =
    caseProgressData?.assignment?.email ||
    staffList.find(
      (s: StaffMember) => s.id === currentGrievance.assignedStaffId,
    )?.email;
  const staffName =
    caseProgressData?.assignment?.staffName ||
    currentGrievance.assignedStaffName ||
    "Staff Member";

  const headSenderName = currentHodName || hodName || "Department Head";
  const headSenderEmail = (currentHodEmail || hodEmail || "").trim();

  // Guard against self-directives: don't let HOD email themselves
  const isSelfAssigned = Boolean(
    staffEmail &&
      headSenderEmail &&
      staffEmail.trim().toLowerCase() === headSenderEmail.toLowerCase(),
  );

  const isClosedOrResolved =
    currentGrievance.status === "CLOSED" ||
    currentGrievance.status === "RESOLVED";

  const handlePostDirective = async (note: string): Promise<boolean> => {
    if (!onAddInternalNote) return false;
    const res = await onAddInternalNote(currentGrievance, note);
    return Boolean(res);
  };

  return (
    <>
      <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to SLA Monitoring</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* If assigned to staff, show contact button */}
          {staffEmail && !isSelfAssigned ? (
            <button
              type="button"
              onClick={() => setIsDirectiveModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
              title={`Issue directive to ${staffName} (${staffEmail})`}
            >
              <Mail className="h-3.5 w-3.5 text-slate-500" />
              <span>Contact Staff</span>
            </button>
          ) : null}

          {!isClosedOrResolved &&
            !hasHeadResolutionAuthority(currentGrievance) && (
              <button
                type="button"
                onClick={() => onAssignClick(currentGrievance)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                <span>Change Assignment</span>
              </button>
            )}

          {canHeadSubmitResolution(currentGrievance) &&
            (currentGrievance.isPrimaryDepartment !== false ? (
              <button
                type="button"
                onClick={() => onReviewResolutionClick(currentGrievance)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Submit Resolution</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                Supporting Dept · Lead Dept Submits Final Resolution
              </span>
            ))}

          {canHeadProposeKnowledge(currentGrievance) && onProposeKbClick && (
            <button
              type="button"
              onClick={() => onProposeKbClick(currentGrievance)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-300 bg-[#F0FDFA] px-3.5 py-2 text-xs font-semibold text-[#0F766E] shadow-2xs hover:bg-teal-100 transition cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Propose as Knowledge Article</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* In-App Directive Modal */}
      {staffEmail && !isSelfAssigned && (
        <SendStaffDirectiveModal
          isOpen={isDirectiveModalOpen}
          onClose={() => setIsDirectiveModalOpen(false)}
          staffName={staffName}
          staffEmail={staffEmail}
          headSenderName={headSenderName}
          headSenderEmail={headSenderEmail}
          grievance={currentGrievance}
          onPostDirective={handlePostDirective}
        />
      )}
    </>
  );
}
