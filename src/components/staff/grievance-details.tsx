"use client";

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  FileCheck2,
  Lock,
  Play,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import { DepartmentFindingsTab } from "@/components/dashboard/DepartmentFindingsTab";
import { ProposeKnowledgeModal } from "@/components/knowledge/ProposeKnowledgeModal";
import {
  buildGmailComposeUrl,
  buildStaffComplainantInquiryEmail,
  buildStaffHodEscalationEmail,
} from "@/lib/email";
import { canStaffProposeKnowledge } from "@/lib/staff/utils";
import type { StaffGrievanceItem } from "@/types/staff";
import { ActivityTab } from "./details/ActivityTab";
import { CollaborationTab } from "./details/CollaborationTab";
import { InvestigationTab } from "./details/InvestigationTab";
import { ResolutionTab } from "./details/ResolutionTab";
import { StatementTab } from "./details/StatementTab";
import { RequestGracePeriodModal } from "./modals/RequestGracePeriodModal";

interface GrievanceDetailsProps {
  grievance: StaffGrievanceItem;
  staffName: string;
  staffEmail: string;
  isOpen?: boolean;
  initialTab?:
    | "statement"
    | "investigation"
    | "resolution"
    | "activity"
    | "collaboration"
    | "findings";
  hodEmail?: string;
  hodName?: string;
  onClose: () => void;
  onStartInvestigation: (grievanceId: string) => Promise<void>;
  onRequestAdditionalInfo?: (
    grievanceId: string,
    payload: {
      channels: ("IN_APP" | "EMAIL")[];
      subject: string;
      message: string;
      requestedDocs: string[];
    },
  ) => Promise<void>;
  onResumeInvestigation?: (grievanceId: string) => Promise<void>;
  onAddNote: (
    grievanceId: string,
    note: string,
    parentId?: string,
    replyToAuthor?: string,
    scope?: "INTERNAL" | "COLLABORATION",
  ) => Promise<void>;
  onOpenResolutionForm?: (grievance: StaffGrievanceItem) => void;
  onOpenResolveModal?: () => void;
  onOpenDocumentPreview?: (doc: {
    name: string;
    size: string;
    type: string;
    path?: string;
    uploadedAt?: string;
    grievanceNumber?: string;
    category?: string;
    title?: string;
    submitterName?: string;
    submitterRole?: string;
  }) => void;
}

export function GrievanceDetails({
  grievance,
  staffName,
  staffEmail,
  isOpen = true,
  initialTab = "statement",
  hodEmail,
  hodName,
  onClose,
  onStartInvestigation,
  onRequestAdditionalInfo,
  onResumeInvestigation,
  onAddNote,
  onOpenResolutionForm,
  onOpenResolveModal,
  onOpenDocumentPreview,
}: GrievanceDetailsProps) {
  const [activeTab, setActiveTab] = useState<
    | "statement"
    | "investigation"
    | "resolution"
    | "collaboration"
    | "activity"
    | "findings"
  >(initialTab);
  const [isStarting, setIsStarting] = useState(false);
  const [autoOpenRequestModal, _setAutoOpenRequestModal] = useState(false);
  const [isProposeKbOpen, setIsProposeKbOpen] = useState(false);
  const [isGracePeriodModalOpen, setIsGracePeriodModalOpen] = useState(false);
  const [localExtension, setLocalExtension] = useState(
    grievance.latestExtension || null,
  );
  const [hasProposedKb, setHasProposedKb] = useState(
    Boolean(grievance.hasProposedKb),
  );
  const [showPendingSupportingModal, setShowPendingSupportingModal] =
    useState(false);

  const triggerOpenResolution = () => {
    if (onOpenResolutionForm) {
      onOpenResolutionForm(grievance);
    } else {
      onOpenResolveModal?.();
    }
  };

  const handleOpenFinalResolution = () => {
    if (
      grievance.hasPendingSupportingDepartments &&
      (grievance.pendingSupportingDepartmentNames?.length ?? 0) > 0
    ) {
      setShowPendingSupportingModal(true);
    } else {
      triggerOpenResolution();
    }
  };

  useEffect(() => {
    if (grievance.latestExtension !== undefined) {
      setLocalExtension(grievance.latestExtension);
    }
  }, [grievance.latestExtension]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  const isCompleted =
    grievance.status === "CLOSED" ||
    grievance.status === "RESOLUTION_PENDING_APPROVAL" ||
    grievance.status === "UNDER_REVIEW" ||
    grievance.status === "RESOLVED" ||
    grievance.status === "COMPLETED" ||
    grievance.overallStatus === "CLOSED" ||
    grievance.overallStatus === "RESOLVED";
  const isWaitingOnUser =
    grievance.status === "AWAITING_INFORMATION" ||
    grievance.status === "WAITING_ON_USER";
  const isInProgress =
    grievance.status === "IN_PROGRESS" || grievance.status === "REWORK";

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

  const hodEscalationUrl = hodEmail
    ? buildGmailComposeUrl(
        buildStaffHodEscalationEmail({
          hodEmail,
          hodName: hodName || "Department Head",
          staffName,
          staffEmail,
          grievance: {
            ticketCode: grievance.grievanceNumber,
            title: grievance.title,
            category: grievance.category,
            priority: grievance.priority,
          },
        }),
      )
    : null;

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await onStartInvestigation(grievance.id);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex flex-col border-b border-slate-200/90 bg-slate-50/70 px-6 py-4 shrink-0 gap-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-900 transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to My Grievances Queue</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900">
                {grievance.grievanceNumber}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3 pt-0.5">
            <div className="space-y-1 max-w-[80%]">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-[-0.02em] line-clamp-1">
                {grievance.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                <span>{grievance.category}</span>
                <span className="text-slate-300">&bull;</span>
                <span>{grievance.subcategory}</span>
                <span className="text-slate-300">&bull;</span>
                <PriorityBadge priority={grievance.priority} />
                <StatusBadge
                  status={
                    grievance.status === "COMPLETED" ||
                    grievance.myDepartmentStatus === "COMPLETED"
                      ? "RESOLVED"
                      : grievance.status
                  }
                  label={
                    grievance.status === "COMPLETED" ||
                    grievance.myDepartmentStatus === "COMPLETED"
                      ? "Resolved"
                      : undefined
                  }
                />
                {grievance.isSupportingStaff ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-teal-300 bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
                    Supporting Investigator
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {grievance.reopenCount > 0 && (
                <span className="text-xs font-bold text-slate-900">
                  Reopened ({grievance.reopenCount})
                </span>
              )}
              {grievance.slaStatus && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  {grievance.status === "COMPLETED" ||
                  grievance.isMyDepartmentCompleted ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {grievance.slaStatus === "BREACHED"
                        ? "Completed Past SLA"
                        : "Completed On Track"}
                    </>
                  ) : (
                    <>
                      {grievance.slaStatus === "BREACHED" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                      )}
                      {grievance.slaStatus === "AT_RISK" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      )}
                      {grievance.slaStatus === "ON_TRACK" && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                      {grievance.slaStatus === "BREACHED"
                        ? "SLA Breached"
                        : grievance.slaStatus === "AT_RISK"
                          ? "SLA At Risk"
                          : "Within SLA"}
                    </>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-white gap-6 text-sm font-semibold shrink-0 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("statement")}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === "statement"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Statement & Proofs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("investigation")}
            className={`py-3 border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === "investigation"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Internal Discussion</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-2.5 text-slate-600">
              {grievance.internalNotes?.length || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activity")}
            className={`py-3 border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === "activity"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Activities</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
              {grievance.auditTrail?.length || 0}
            </span>
          </button>
          {((grievance.departmentsInvolved &&
            grievance.departmentsInvolved.length > 1) ||
            grievance.isCrossDepartment ||
            (grievance.collaboratingDepartments &&
              grievance.collaboratingDepartments.length > 1)) && (
            <button
              type="button"
              onClick={() => setActiveTab("collaboration")}
              className={`py-3 border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === "collaboration"
                  ? "border-[#0F766E] text-[#0F766E]"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>Collaboration</span>
              <span className="rounded-full bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.2 text-[10px] font-bold">
                {grievance.collaborationNotes?.length || 0}
              </span>
            </button>
          )}
          {((grievance.departmentsInvolved &&
            grievance.departmentsInvolved.length > 1) ||
            grievance.isCrossDepartment ||
            (grievance.collaboratingDepartments &&
              grievance.collaboratingDepartments.length > 1) ||
            (grievance.supportingFindings &&
              grievance.supportingFindings.length > 0)) && (
            <button
              type="button"
              onClick={() => setActiveTab("findings")}
              className={`py-3 border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === "findings"
                  ? "border-[#0F766E] text-[#0F766E]"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>Department Findings</span>
              <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-bold">
                {grievance.supportingFindings?.length || 0}
              </span>
            </button>
          )}
          {grievance.hasResolution && (
            <button
              type="button"
              onClick={() => setActiveTab("resolution")}
              className={`py-3 border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === "resolution"
                  ? "border-[#0F766E] text-[#0F766E]"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>Resolution Record</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {activeTab === "statement" && (
            <StatementTab
              grievance={grievance}
              inquiryUrl={inquiryUrl}
              hodEscalationUrl={hodEscalationUrl}
              hodName={hodName}
              onOpenDocumentPreview={onOpenDocumentPreview}
              isWaitingOnUser={isWaitingOnUser}
              isInProgress={isInProgress}
              autoOpenRequestModal={autoOpenRequestModal}
              onResumeInvestigation={onResumeInvestigation}
              onRequestAdditionalInfo={onRequestAdditionalInfo}
            />
          )}

          {activeTab === "collaboration" && (
            <CollaborationTab
              grievance={grievance}
              onAddNote={(gid, note, pid, rta) =>
                onAddNote(gid, note, pid, rta, "COLLABORATION")
              }
            />
          )}

          {activeTab === "findings" && (
            <DepartmentFindingsTab
              findings={grievance.supportingFindings || []}
            />
          )}

          {activeTab === "investigation" && (
            <InvestigationTab
              grievance={grievance}
              onAddNote={(gid, note, pid, rta) =>
                onAddNote(gid, note, pid, rta, "INTERNAL")
              }
            />
          )}

          {activeTab === "activity" && <ActivityTab grievance={grievance} />}

          {activeTab === "resolution" && (
            <ResolutionTab
              grievance={grievance}
              onOpenDocumentPreview={onOpenDocumentPreview}
            />
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              SLA Consumption:{" "}
              <strong className="text-slate-800">
                {grievance.slaConsumptionPercent}%
              </strong>{" "}
              (
              {grievance.isMyDepartmentCompleted ||
              grievance.myDepartmentStatus === "COMPLETED" ||
              grievance.status === "RESOLUTION_PENDING_APPROVAL" ||
              grievance.status === "RESOLVED" ||
              grievance.status === "CLOSED"
                ? grievance.status === "RESOLUTION_PENDING_APPROVAL"
                  ? "Resolution Pending Approval (SLA Paused)"
                  : grievance.status === "RESOLVED"
                    ? "Resolution Proposed (SLA Paused)"
                    : grievance.status === "CLOSED"
                      ? "Case Closed"
                      : grievance.slaTimeLeft === "Completed (Past SLA)"
                        ? "Completed Past SLA"
                        : "Completed"
                : grievance.slaTimeLeft}
              )
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {grievance.status === "ASSIGNED" && (
              <>
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={isStarting}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400 bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-current text-white" />
                  <span>
                    {isStarting ? "Initiating..." : "Start Investigation"}
                  </span>
                </button>

                <button
                  type="button"
                  disabled
                  title="Click 'Start Investigation' first to enable resolution submission"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed"
                >
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {grievance.isSupportingStaff
                      ? "Submit Investigation Findings"
                      : grievance.isPrimaryOwner === false
                        ? "Submit Department Findings"
                        : "Submit Final Resolution"}
                  </span>
                </button>
              </>
            )}

            {!isCompleted &&
              grievance.status !== "ASSIGNED" &&
              (grievance.myDepartmentStatus === "BLOCKED" ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 border border-slate-200"
                  title="Awaiting prerequisite departments to complete their investigation stage."
                >
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>Stage Blocked · Awaiting Prerequisites</span>
                </span>
              ) : grievance.isSupportingStaff ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenResolutionForm) {
                      onOpenResolutionForm(grievance);
                    } else {
                      onOpenResolveModal?.();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal-800 transition cursor-pointer"
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>Submit Investigation Findings</span>
                </button>
              ) : !grievance.isSupportingStaff &&
                grievance.myInvolvementType !== "SUPPORTING" &&
                (grievance.isPrimaryOwner !== false ||
                  grievance.myInvolvementType === "EQUAL" ||
                  Boolean(grievance.isFinalSequentialDepartment)) ? (
                <div className="flex items-center gap-2">
                  {grievance.hasPendingSupportingDepartments &&
                    (grievance.pendingSupportingDepartmentNames?.length ?? 0) >
                      0 && (
                      <span
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 border border-amber-200"
                        title={`Awaiting findings from: ${grievance.pendingSupportingDepartmentNames?.join(", ")}`}
                      >
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span>
                          Awaiting Supportive Findings (
                          {grievance.pendingSupportingDepartmentNames?.join(
                            ", ",
                          )}
                          )
                        </span>
                      </span>
                    )}
                  <button
                    type="button"
                    onClick={handleOpenFinalResolution}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition cursor-pointer"
                  >
                    <FileCheck2 className="h-3.5 w-3.5" />
                    <span>Submit Final Resolution</span>
                  </button>
                </div>
              ) : grievance.isMyDepartmentCompleted ||
                grievance.myDepartmentStatus === "COMPLETED" ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Department Findings Submitted · Awaiting Subsequent Stage
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenResolutionForm) {
                      onOpenResolutionForm(grievance);
                    } else {
                      onOpenResolveModal?.();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 transition cursor-pointer"
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>Submit Department Findings</span>
                </button>
              ))}

            {grievance.status === "CLOSED" ||
            grievance.overallStatus === "CLOSED" ||
            grievance.status === "RESOLVED" ||
            grievance.overallStatus === "RESOLVED" ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {grievance.status === "CLOSED" ||
                grievance.overallStatus === "CLOSED"
                  ? "Case Closed"
                  : "Case Resolved"}
              </span>
            ) : isCompleted ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Department Findings Submitted
              </span>
            ) : null}

            {!isCompleted &&
              grievance.myDepartmentStatus !== "BLOCKED" &&
              (localExtension?.status === "PENDING" ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 shadow-2xs"
                  title={`Awaiting Department Head decision on requested extension of +${Math.round(localExtension.requestedMinutes / 60)}h`}
                >
                  <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                  <span>
                    Grace Period Pending (+
                    {Math.round(localExtension.requestedMinutes / 60)}h)
                  </span>
                </span>
              ) : localExtension?.status === "APPROVED" ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-2xs"
                  title="Grace period approved by Department Head"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>
                    Grace Period Granted (+
                    {Math.round(
                      (localExtension.grantedMinutes ||
                        localExtension.requestedMinutes) / 60,
                    )}
                    h)
                  </span>
                </span>
              ) : localExtension?.status === "REJECTED" ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 shadow-2xs"
                  title="Grace period request was declined by Department Head"
                >
                  <Clock className="h-3.5 w-3.5 text-rose-600" />
                  <span>Grace Period Declined</span>
                </span>
              ) : (
                (() => {
                  const warningThresh = grievance.warningThresholdPercent ?? 50;
                  const escalationThresh =
                    grievance.escalationThresholdPercent ?? 75;
                  const isUnderWarning =
                    (grievance.slaConsumptionPercent ?? 0) < warningThresh;
                  const isOverEscalation =
                    (grievance.slaConsumptionPercent ?? 0) >= escalationThresh;
                  const isBreached =
                    grievance.slaStatus === "BREACHED" ||
                    (grievance.slaConsumptionPercent ?? 0) >= 100;
                  const canRequest =
                    !isUnderWarning &&
                    !isOverEscalation &&
                    !isBreached &&
                    !localExtension;

                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (localExtension) {
                          toast.error(
                            "You have already submitted a grace period request.",
                          );
                          return;
                        }
                        if (isBreached) {
                          toast.error(
                            "Grace period cannot be requested after SLA has breached.",
                          );
                          return;
                        }
                        if (isOverEscalation) {
                          toast.error(
                            `Grace period requests close at ${escalationThresh}% SLA when the case auto-escalates to Department Head.`,
                          );
                          return;
                        }
                        if (isUnderWarning) {
                          toast.error(
                            `Grace period can only be requested after at least ${warningThresh}% SLA is consumed (currently ${grievance.slaConsumptionPercent}%).`,
                          );
                          return;
                        }
                        setIsGracePeriodModalOpen(true);
                      }}
                      disabled={!canRequest}
                      title={
                        localExtension
                          ? "A grace period request has already been submitted for this cycle"
                          : isBreached
                            ? "SLA has breached. Grace period cannot be requested after SLA breach."
                            : isOverEscalation
                              ? `Grace period requests close at ${escalationThresh}% SLA (auto-escalated to Department Head)`
                              : isUnderWarning
                                ? `Grace period unlocks after ${warningThresh}% SLA is consumed (currently ${grievance.slaConsumptionPercent}%)`
                                : "Request SLA grace period / extension from Department Head"
                      }
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer shadow-2xs ${
                        canRequest
                          ? "border-teal-300 bg-teal-50/80 text-[#0F766E] hover:bg-teal-100"
                          : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>Request Grace Period</span>
                    </button>
                  );
                })()
              ))}

            {!hasProposedKb && canStaffProposeKnowledge(grievance) && (
              <button
                type="button"
                onClick={() => setIsProposeKbOpen(true)}
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

        {/* Propose Knowledge Article Modal */}
        <ProposeKnowledgeModal
          isOpen={isProposeKbOpen}
          onClose={() => setIsProposeKbOpen(false)}
          onSuccess={() => setHasProposedKb(true)}
          grievance={grievance}
        />

        {/* Request Grace Period (SLA Extension) Modal */}
        <RequestGracePeriodModal
          isOpen={isGracePeriodModalOpen}
          onClose={() => setIsGracePeriodModalOpen(false)}
          grievance={grievance}
          onSuccess={() => {
            setLocalExtension({
              id: "temp",
              status: "PENDING",
              requestedMinutes: 240,
              reason: "Grace period request pending review",
              createdAt: new Date().toISOString(),
            });
          }}
        />
        {/* Early Resolution Confirmation Modal when Supporting Findings are Pending */}
        {showPendingSupportingModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in-50">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-left space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900">
                    Supporting Findings Still Pending
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Supporting department(s){" "}
                    <strong className="text-slate-900 font-semibold">
                      {grievance.pendingSupportingDepartmentNames?.join(", ")}
                    </strong>{" "}
                    have not submitted their investigation findings yet.
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Are you sure you want to proceed and finalize the customer
                    resolution without their findings?
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPendingSupportingModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Wait for Findings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPendingSupportingModal(false);
                    triggerOpenResolution();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0F766E] rounded-xl hover:bg-[#115E59] shadow-xs transition cursor-pointer"
                >
                  Yes, Submit Final Resolution
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
