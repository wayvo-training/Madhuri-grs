"use client";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileCheck2,
  Play,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/dashboard/badges";
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

interface GrievanceDetailsProps {
  grievance: StaffGrievanceItem;
  staffName: string;
  staffEmail: string;
  isOpen?: boolean;
  initialTab?: "statement" | "investigation" | "resolution" | "activity";
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
    "statement" | "investigation" | "resolution" | "collaboration" | "activity"
  >(initialTab);
  const [isStarting, setIsStarting] = useState(false);
  const [autoOpenRequestModal, setAutoOpenRequestModal] = useState(false);
  const [isProposeKbOpen, setIsProposeKbOpen] = useState(false);
  const [hasProposedKb, setHasProposedKb] = useState(
    Boolean(grievance.hasProposedKb),
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  const isCompleted =
    grievance.status === "CLOSED" ||
    grievance.status === "UNDER_REVIEW" ||
    grievance.status === "RESOLVED";
  const isWaitingOnUser = grievance.status === "WAITING_ON_USER";
  const isInProgress = grievance.status === "IN_PROGRESS";

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
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
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
            <div className="space-y-1 max-w-[70%]">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-[-0.02em] line-clamp-1">
                {grievance.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                <span>{grievance.category}</span>
                <span className="text-slate-300">&bull;</span>
                <span>{grievance.subcategory}</span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-slate-900 font-semibold">
                  {grievance.priority === "CRITICAL"
                    ? "Critical"
                    : grievance.priority === "HIGH"
                      ? "High"
                      : grievance.priority === "MEDIUM"
                        ? "Medium"
                        : "Low"}
                </span>
                <StatusBadge status={grievance.status} />
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
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-white gap-6 text-sm font-semibold shrink-0">
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
            <span>Investigation</span>
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
          {grievance.departmentsInvolved &&
            grievance.departmentsInvolved.length > 1 && (
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
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
            <CollaborationTab grievance={grievance} onAddNote={onAddNote} />
          )}

          {activeTab === "investigation" && (
            <InvestigationTab grievance={grievance} onAddNote={onAddNote} />
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
              ({grievance.slaTimeLeft})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {grievance.status === "ASSIGNED" && (
              <button
                type="button"
                onClick={handleStart}
                disabled={isStarting}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 text-emerald-700" />
                <span>
                  {isStarting ? "Initiating..." : "Start Investigation"}
                </span>
              </button>
            )}

            {!isCompleted && (
              <>
                {grievance.isPrimaryOwner !== false ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenResolutionForm) {
                        onOpenResolutionForm(grievance);
                      } else {
                        onOpenResolveModal?.();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition cursor-pointer"
                  >
                    <FileCheck2 className="h-3.5 w-3.5" />
                    <span>Submit Final Resolution</span>
                  </button>
                ) : grievance.isMyDepartmentCompleted ||
                  grievance.myDepartmentStatus === "COMPLETED" ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Department Findings Submitted · Awaiting Lead Dept
                      Resolution
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 border border-amber-200">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                      Supporting Dept · Lead Dept Submits Final Resolution
                    </span>
                  </div>
                )}
              </>
            )}

            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Case Resolved & Closed
              </span>
            )}

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
      </div>
    </div>
  );
}
