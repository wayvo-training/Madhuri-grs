"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileEdit,
  Mail,
  Shield,
  UserCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  canHeadProposeKnowledge,
  canHeadSubmitResolution,
  hasHeadResolutionAuthority,
  isResolutionSubmittedByHead,
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
  onDirectInterveneClick?: (item: GrievanceItem) => void;
  onDeclineRequestClick?: (item: GrievanceItem) => void;
  onEscalateClick?: (item: GrievanceItem) => void;
  onReviewResolutionClick: (item: GrievanceItem) => void;
  onProposeKbClick?: (item: GrievanceItem) => void;
  onAddInternalNote?: (
    grievance: GrievanceItem,
    note: string,
  ) => Promise<GrievanceItem | undefined>;
  onReviewGracePeriodClick?: () => void;
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
  onDirectInterveneClick,
  onDeclineRequestClick,
  onEscalateClick,
  onReviewResolutionClick,
  onProposeKbClick,
  onAddInternalNote,
  onReviewGracePeriodClick,
}: CaseInspectionFooterProps) {
  const [isDirectiveModalOpen, setIsDirectiveModalOpen] = useState(false);
  const [isReworkAccepted, setIsReworkAccepted] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && currentGrievance?.id) {
      const saved = localStorage.getItem(
        `draft_resolution_${currentGrievance.id}`,
      );
      setHasDraft(Boolean(saved));
    }
  }, [currentGrievance?.id]);

  const isBlocked = Boolean(
    currentGrievance.isBlocked || currentGrievance.status === "BLOCKED",
  );

  const staffEmail = isBlocked
    ? null
    : caseProgressData?.assignment?.email ||
      staffList.find(
        (s: StaffMember) => s.id === currentGrievance.assignedStaffId,
      )?.email;
  const staffName = isBlocked
    ? "Blocked"
    : caseProgressData?.assignment?.staffName ||
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
          <span>Back to Live Queue</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* If assigned to staff, show contact button */}
          {staffEmail && !isSelfAssigned && !isClosedOrResolved ? (
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

          {(currentGrievance.hasPendingExtension ||
            caseProgressData?.latestExtension?.status === "PENDING") && (
            <button
              type="button"
              onClick={onReviewGracePeriodClick}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 hover:border-teal-400 active:scale-95 px-3 py-2 text-xs font-semibold text-teal-800 shadow-2xs transition cursor-pointer"
              title="Click to review staff grace period extension request"
            >
              <Clock className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
              <span>Grace Period Requested</span>
            </button>
          )}

          {(currentGrievance.status === "REWORK" ||
            currentGrievance.status === "REOPENED") &&
          (currentGrievance.isPrimaryDepartment ?? true) ? (
            !isReworkAccepted ? (
              <>
                {onDeclineRequestClick && (
                  <button
                    type="button"
                    onClick={() => onDeclineRequestClick(currentGrievance)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50/80 px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-2xs hover:bg-rose-100 transition cursor-pointer"
                    title={`Decline ${currentGrievance.status === "REOPENED" ? "reopening" : "rework"} request`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    <span>Decline Request</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsReworkAccepted(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#115E59] transition cursor-pointer"
                  title={`Accept ${currentGrievance.status === "REOPENED" ? "reopening" : "rework"} request to assign staff or assume direct authority`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Accept Request</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 animate-in fade-in duration-150">
                <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-200">
                  Request Accepted
                </span>
                <button
                  type="button"
                  onClick={() => onAssignClick(currentGrievance)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-300 bg-white px-3.5 py-2 text-xs font-semibold text-teal-800 shadow-2xs hover:bg-teal-50 hover:text-teal-900 transition cursor-pointer"
                  title="Assign an eligible staff member for re-investigation"
                >
                  <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                  <span>Assign Staff</span>
                </button>
                {onDirectInterveneClick && (
                  <button
                    type="button"
                    onClick={() => onDirectInterveneClick(currentGrievance)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#115E59] transition cursor-pointer"
                    title="Assume direct authority to investigate and resolve personally"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    <span>Assume Authority</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsReworkAccepted(false)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  title="Back to Accept / Decline"
                >
                  <span>Back</span>
                </button>
              </div>
            )
          ) : (
            !isClosedOrResolved &&
            currentGrievance.status !== "COMPLETED" &&
            currentGrievance.status !== "UNDER_REVIEW" &&
            (currentGrievance.myDepartmentStatus !== "COMPLETED" ||
              Boolean(currentGrievance.isReopened)) &&
            !hasHeadResolutionAuthority(currentGrievance) &&
            !currentGrievance.isAssignedToHead && (
              <button
                type="button"
                onClick={() => onAssignClick(currentGrievance)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
              >
                <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                <span>
                  {currentGrievance.myDepartmentStatus === "PENDING_ASSIGNMENT"
                    ? "Assign Staff"
                    : currentGrievance.assignedStaffId &&
                        currentGrievance.assignedStaffName !== "Unassigned" &&
                        currentGrievance.myDepartmentStatus !==
                          "PENDING_ASSIGNMENT" &&
                        currentGrievance.status !== "PENDING_ASSIGNMENT" &&
                        currentGrievance.status !== "ROUTED" &&
                        currentGrievance.status !== "SUBMITTED"
                      ? "Change Assignment"
                      : "Assign Staff"}
                </span>
              </button>
            )
          )}

          {!isClosedOrResolved &&
            currentGrievance.status !== "COMPLETED" &&
            currentGrievance.status !== "REWORK" &&
            currentGrievance.status !== "REOPENED" &&
            (currentGrievance.myDepartmentStatus !== "COMPLETED" ||
              Boolean(currentGrievance.isReopened)) &&
            !hasHeadResolutionAuthority(currentGrievance) &&
            onEscalateClick &&
            (currentGrievance.slaStatus === "AT_RISK" ||
              currentGrievance.slaStatus === "BREACHED" ||
              currentGrievance.status === "ESCALATED" ||
              Boolean(currentGrievance.escalationReason) ||
              currentGrievance.escalationStage === "GRIEVANCE_ESCALATED" ||
              Boolean(currentGrievance.isReopened)) && (
              <button
                type="button"
                onClick={() => onEscalateClick(currentGrievance)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-amber-700 transition cursor-pointer"
                title="Intervene directly or assume resolution authority on escalated / at-risk case"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Intervene / Assume Authority</span>
              </button>
            )}

          {currentGrievance.status !== "REWORK" &&
          currentGrievance.status !== "REOPENED" &&
          canHeadSubmitResolution(currentGrievance) ? (
            currentGrievance.canSubmitFinalResolution !== false ? (
              <button
                type="button"
                onClick={() => onReviewResolutionClick(currentGrievance)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition cursor-pointer ${
                  hasDraft
                    ? "bg-emerald-700 hover:bg-emerald-800 ring-2 ring-emerald-400/50"
                    : "bg-[#0F766E] hover:bg-[#115E59]"
                }`}
                title={
                  hasDraft
                    ? "Resume and edit your saved resolution draft"
                    : "Formulate and submit grievance resolution"
                }
              >
                {hasDraft ? (
                  <FileEdit className="h-3.5 w-3.5" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                <span>
                  {hasDraft ? "Resume Draft Resolution" : "Submit Resolution"}
                </span>
              </button>
            ) : currentGrievance.myDepartmentStatus === "COMPLETED" ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Department Findings Submitted · Next Stage Activated
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onReviewResolutionClick(currentGrievance)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition cursor-pointer"
              >
                <FileCheck2 className="h-3.5 w-3.5" />
                <span>Submit Department Findings</span>
              </button>
            )
          ) : isResolutionSubmittedByHead(currentGrievance) ||
            (currentGrievance.status === "UNDER_REVIEW" &&
              (currentGrievance.submittedResolution?.submittedByRole ===
                "DEPARTMENT_HEAD" ||
                currentGrievance.submittedResolution?.submittedByRole ===
                  "ADMIN")) ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 bg-teal-50 px-3.5 py-2 rounded-xl border border-teal-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
              Resolution Submitted · Awaiting Employee Review
            </span>
          ) : null}

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
