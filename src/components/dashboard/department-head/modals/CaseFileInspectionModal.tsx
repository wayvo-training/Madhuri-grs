"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  Send,
  User,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { requiresHeadResolutionReview } from "@/lib/department-head/filters";
import {
  formatAuditActionTitle,
  formatAuditLogContent,
} from "@/lib/department-head/utils";
import type {
  CaseDrawerTab,
  CaseProgressData,
  DocumentPreviewData,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";

function buildGmailComposeUrl({
  to,
  authuser,
  subject,
  body,
}: {
  to: string;
  authuser?: string;
  subject?: string;
  body?: string;
}): string {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to,
  });
  if (subject) params.set("su", subject);
  if (body) params.set("body", body);
  if (authuser) params.set("authuser", authuser);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export interface CaseFileInspectionModalProps {
  grievance: GrievanceItem;
  staffList: StaffMember[];
  currentHodName: string;
  hodName: string;
  currentHodEmail?: string;
  hodEmail?: string;
  initialTab?: CaseDrawerTab;
  onClose: () => void;
  onOpenDocumentPreview: (doc: DocumentPreviewData) => void;
  onDownloadDocument: (doc: DocumentPreviewData) => void;
  onAssignClick: (item: GrievanceItem) => void;
  onEscalateClick: (item: GrievanceItem) => void;
  onReviewResolutionClick: (item: GrievanceItem) => void;
  onAddInternalNote: (
    grievance: GrievanceItem,
    note: string,
  ) => Promise<GrievanceItem | undefined>;
}

export function CaseFileInspectionModal({
  grievance,
  staffList,
  currentHodName,
  hodName,
  currentHodEmail,
  hodEmail,
  initialTab = "progress",
  onClose,
  onOpenDocumentPreview,
  onDownloadDocument,
  onAssignClick,
  onEscalateClick,
  onReviewResolutionClick,
  onAddInternalNote,
}: CaseFileInspectionModalProps) {
  const [activeTab, setActiveTab] = useState<CaseDrawerTab>(initialTab);
  const [currentGrievance, setCurrentGrievance] =
    useState<GrievanceItem>(grievance);
  const [caseProgressLoading, setCaseProgressLoading] = useState(false);
  const [caseProgressData, setCaseProgressData] =
    useState<CaseProgressData | null>(null);
  const [newInternalNote, setNewInternalNote] = useState("");

  useEffect(() => {
    setCurrentGrievance(grievance);
  }, [grievance]);

  useEffect(() => {
    let isMounted = true;
    setCaseProgressLoading(true);
    fetch(`/api/department-head/grievances/${currentGrievance.id}/progress`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load progress");
        return res.json();
      })
      .then((json) => {
        if (isMounted && json.success && json.data) {
          setCaseProgressData(json.data);
        }
      })
      .catch((err) => {
        console.warn("Live case progress fetch error:", err);
      })
      .finally(() => {
        if (isMounted) setCaseProgressLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [currentGrievance.id]);

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInternalNote.trim()) return;
    const noteText = newInternalNote.trim();
    setNewInternalNote("");
    const updated = await onAddInternalNote(currentGrievance, noteText);
    if (updated) {
      setCurrentGrievance(updated);
    }
  };

  const handleDocumentClick = useCallback(
    (file: {
      name: string;
      size: string;
      type: string;
      path?: string;
      uploadedAt?: string;
    }) => {
      onOpenDocumentPreview({
        name: file.name,
        size: file.size,
        type: file.type || "Document",
        path: file.path,
        uploadedAt: file.uploadedAt || currentGrievance.createdAt || "Recent",
        grievanceNumber: currentGrievance.ticketCode || "GRS-2026",
        category: `${currentGrievance.category || "General"} / ${currentGrievance.subcategory || "General"}`,
        title: currentGrievance.title || "Grievance Record",
        submitterName: currentGrievance.submitterName || "Complainant",
        submitterRole: currentGrievance.submitterRole || "Employee",
      });
    },
    [currentGrievance, onOpenDocumentPreview],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Popover Header */}
        <div className="flex flex-col border-b border-slate-200/90 bg-slate-50/70 px-6 py-4 shrink-0 gap-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-900 transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to SLA Monitoring</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#064E3B] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/80">
                {currentGrievance.ticketCode}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
                title="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3 pt-0.5">
            <div className="space-y-1 max-w-[70%]">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-[-0.02em] line-clamp-1">
                {currentGrievance.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <span>{currentGrievance.category}</span>
                <span className="text-slate-300">•</span>
                <span>{currentGrievance.subcategory}</span>
                <span className="text-slate-300">•</span>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-2.75 font-semibold ${
                    currentGrievance.priority === "CRITICAL"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : currentGrievance.priority === "HIGH"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  {currentGrievance.priority} Priority
                </span>
              </div>
            </div>

            <div>
              {(caseProgressData?.sla?.state || currentGrievance.slaStatus) ===
              "BREACHED" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  SLA BREACHED
                </span>
              ) : (caseProgressData?.sla?.state ||
                  currentGrievance.slaStatus) === "SLA_AT_RISK" ||
                currentGrievance.slaStatus === "AT_RISK" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  SLA AT RISK
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  ON TRACK
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-white gap-6 text-sm font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("progress")}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "progress"
                ? "border-[#064E3B] text-[#064E3B]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Progress & SLA</span>
            {caseProgressLoading && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("statement")}
            className={`py-3 border-b-2 transition ${
              activeTab === "statement"
                ? "border-[#064E3B] text-[#064E3B]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Statement & Proofs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`py-3 border-b-2 transition inline-flex items-center gap-1.5 ${
              activeTab === "notes"
                ? "border-[#064E3B] text-[#064E3B]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Internal Notes</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-2.5 text-slate-600">
              {currentGrievance.internalNotes?.length || 0}
            </span>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === "progress" && (
            <>
              {/* Current Progress Stepper */}
              {(() => {
                const st = currentGrievance.status;
                const isAssigned =
                  !!currentGrievance.assignedStaffName ||
                  !!caseProgressData?.assignment?.isAssigned;

                const isCaseReopened =
                  currentGrievance.isReopened ||
                  currentGrievance.status === "REOPENED" ||
                  (currentGrievance.reopenCount || 0) > 0;

                const fallbackStageNumber =
                  st === "CLOSED" || st === "RESOLVED"
                    ? 4
                    : st === "UNDER_REVIEW"
                      ? 4
                      : st === "IN_PROGRESS" ||
                          st === "ESCALATED" ||
                          st === "REOPENED"
                        ? 3
                        : isAssigned || st === "ASSIGNED"
                          ? 2
                          : 1;

                const stageNumber =
                  caseProgressData?.currentStage?.stageNumber ??
                  fallbackStageNumber;

                const currentStageLabel =
                  caseProgressData?.currentStage?.label ||
                  (st === "CLOSED"
                    ? "Grievance Closed"
                    : st === "UNDER_REVIEW"
                      ? "Resolution Submitted — Pending HOD Approval"
                      : st === "ESCALATED"
                        ? isCaseReopened
                          ? "Reopened — Escalated for Intervention"
                          : "Under Active Investigation (Escalated)"
                        : st === "IN_PROGRESS" || st === "REOPENED"
                          ? isCaseReopened
                            ? "Reopened — Under Active Investigation"
                            : "Under Active Investigation"
                          : isAssigned || st === "ASSIGNED"
                            ? isCaseReopened
                              ? `Reopened — Assigned to ${currentGrievance.assignedStaffName || "Officer"}`
                              : `Assigned to ${currentGrievance.assignedStaffName || "Officer"}`
                            : "Pending Staff Assignment");

                const steps = caseProgressData?.currentStage?.progressSteps || [
                  {
                    key: "SUBMITTED",
                    label: "Submitted",
                    isComplete: true,
                    isCurrent: stageNumber === 1,
                  },
                  {
                    key: "ASSIGNED",
                    label: "Assigned",
                    isComplete: stageNumber >= 2,
                    isCurrent: stageNumber === 2,
                  },
                  {
                    key: "INVESTIGATION",
                    label: "Investigation",
                    isComplete: stageNumber >= 3,
                    isCurrent: stageNumber === 3,
                  },
                  {
                    key: "RESOLUTION",
                    label:
                      st === "CLOSED"
                        ? "Grievance Closed"
                        : "Resolution Review",
                    isComplete: stageNumber >= 4,
                    isCurrent: stageNumber === 4,
                  },
                ];

                return (
                  <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 space-y-3.5 shadow-2xs overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                        Current Progress
                      </span>
                      <span className="text-xs font-semibold text-emerald-800 text-right truncate max-w-full sm:max-w-[70%]">
                        Stage {stageNumber} of {steps.length}:{" "}
                        {currentStageLabel}
                      </span>
                    </div>

                    <div className="relative flex items-center justify-between pt-2 px-3 sm:px-6">
                      <div className="absolute left-7 sm:left-10 right-7 sm:right-10 top-5 h-0.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(0, ((stageNumber - 1) / (steps.length - 1)) * 100))}%`,
                          }}
                        />
                      </div>

                      {steps.map((step, idx) => {
                        const isPastOrCurrent = idx < stageNumber;
                        const isCurrent = idx === stageNumber - 1;
                        return (
                          <div
                            key={step.key}
                            className="relative z-10 flex flex-col items-center"
                          >
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold transition ${
                                isPastOrCurrent
                                  ? "border-emerald-600 bg-emerald-600 text-white shadow-2xs"
                                  : "border-slate-300 bg-white text-slate-400"
                              } ${isCurrent ? "ring-3 ring-emerald-100" : ""}`}
                            >
                              {isPastOrCurrent ? (
                                <Check className="h-3.5 w-3.5 stroke-3" />
                              ) : (
                                <span>{idx + 1}</span>
                              )}
                            </div>
                            <span
                              className={`mt-1.5 text-xs text-center max-w-18.75 sm:max-w-23.75 line-clamp-2 leading-tight ${
                                isPastOrCurrent
                                  ? "font-semibold text-slate-900"
                                  : "font-medium text-slate-400"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs text-slate-500 border-t border-slate-100 min-w-0">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-full">
                        Last Activity:{" "}
                        <strong className="text-slate-800 font-semibold">
                          {caseProgressData?.latestActivity ||
                            (currentGrievance.assignedStaffName
                              ? `Assigned to ${currentGrievance.assignedStaffName}`
                              : "Grievance registered in portal")}
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Two-Column SLA & Assignment Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: SLA Status */}
                {(() => {
                  const slaPercent =
                    caseProgressData?.sla?.consumptionPercent ??
                    currentGrievance.slaConsumptionPercent ??
                    (currentGrievance.slaStatus === "BREACHED"
                      ? 100
                      : currentGrievance.slaStatus === "AT_RISK"
                        ? 80
                        : 40);

                  const slaTimeRemaining =
                    caseProgressData?.sla?.timeRemaining ||
                    currentGrievance.slaTimeLeft;

                  const slaTargetDue =
                    caseProgressData?.sla?.dueAt ||
                    currentGrievance.slaDeadline;

                  const slaState =
                    caseProgressData?.sla?.state ||
                    (currentGrievance.slaStatus === "BREACHED"
                      ? "BREACHED"
                      : currentGrievance.slaStatus === "AT_RISK"
                        ? "SLA_AT_RISK"
                        : "ON_TRACK");

                  const slaStateLabel =
                    caseProgressData?.sla?.stateLabel ||
                    (currentGrievance.slaStatus === "BREACHED"
                      ? "SLA Breached"
                      : currentGrievance.slaStatus === "AT_RISK"
                        ? "Approaching SLA"
                        : "Within SLA");

                  return (
                    <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-emerald-800" />
                          SLA Status
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            slaState === "BREACHED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : slaState === "SLA_AT_RISK"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {slaStateLabel}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">
                            SLA Consumed
                          </span>
                          <span className="text-slate-900 font-semibold">
                            {slaPercent}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              slaPercent >= 90 || slaState === "BREACHED"
                                ? "bg-rose-500"
                                : slaPercent >= 70
                                  ? "bg-amber-500"
                                  : "bg-emerald-600"
                            }`}
                            style={{
                              width: `${Math.min(slaPercent, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">
                            Time Remaining:
                          </span>
                          <span className="font-semibold text-slate-800">
                            {slaTimeRemaining}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">
                            Target Due Date:
                          </span>
                          <span className="font-medium text-slate-700">
                            {slaTargetDue}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Right: Assignment */}
                {(() => {
                  const assignedStaff = staffList.find(
                    (s: StaffMember) =>
                      s.id === currentGrievance.assignedStaffId,
                  );
                  const officerName =
                    caseProgressData?.assignment?.staffName ||
                    currentGrievance.assignedStaffName ||
                    assignedStaff?.name ||
                    null;
                  const officerDesignation =
                    caseProgressData?.assignment?.designation ||
                    assignedStaff?.designation ||
                    "Investigating Officer";
                  const officerEmail =
                    caseProgressData?.assignment?.email ||
                    assignedStaff?.email ||
                    null;
                  const assignedTimestamp =
                    caseProgressData?.assignment?.assignedAtRelative ||
                    caseProgressData?.assignment?.assignedAt ||
                    (currentGrievance.assignedStaffName ? "Assigned" : null);
                  const assignmentStatus =
                    caseProgressData?.assignment?.status ||
                    (currentGrievance.assignedStaffName
                      ? "In Progress"
                      : "Pending");

                  return (
                    <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-emerald-800" />
                          Assignment
                        </span>
                        <span className="text-xs text-slate-500">
                          Status:{" "}
                          <strong className="font-semibold text-slate-800">
                            {assignmentStatus}
                          </strong>
                        </span>
                      </div>

                      {officerName ? (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                              {officerName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 text-xs truncate">
                                {officerName}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {officerDesignation}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 pt-1 border-t border-slate-100">
                            {assignedTimestamp && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                  Assigned:
                                </span>
                                <span className="font-medium text-slate-700">
                                  {assignedTimestamp}
                                </span>
                              </div>
                            )}
                            {officerEmail && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Email:</span>
                                <a
                                  href={buildGmailComposeUrl({
                                    to: officerEmail,
                                    authuser:
                                      currentHodEmail || hodEmail || undefined,
                                    subject: `Regarding Case ${currentGrievance.ticketCode}: ${currentGrievance.title}`,
                                  })}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-700 hover:underline font-medium truncate max-w-[65%]"
                                  title={`Email officer via Gmail from ${currentHodEmail || hodEmail || "Department Head"}`}
                                >
                                  {officerEmail}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-3 text-center space-y-2">
                          <p className="text-xs text-slate-500">
                            No officer currently assigned to this ticket.
                          </p>
                          <button
                            type="button"
                            onClick={() => onAssignClick(currentGrievance)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#064E3B] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-900 transition"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Assign Officer Now</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Activity Timeline */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Activity Timeline
                  </span>
                  <span className="text-xs text-slate-400">
                    Chronological Governance Trail
                  </span>
                </div>

                {(() => {
                  const timelineEvents =
                    caseProgressData?.timeline &&
                    caseProgressData.timeline.length > 0
                      ? caseProgressData.timeline
                      : (currentGrievance.auditTrail || []).map((log, idx) => ({
                          id: log.id || String(idx),
                          timestamp: log.timestamp,
                          relativeTime: log.timestamp,
                          title: formatAuditActionTitle(log.action),
                          description: formatAuditLogContent(
                            log.action,
                            log.details,
                          ),
                          actor: log.actor,
                        }));

                  if (timelineEvents.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 italic py-2">
                        No activity records logged for this case.
                      </p>
                    );
                  }

                  return (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.75 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {timelineEvents.map((ev, idx) => (
                        <div key={ev.id || idx} className="relative group">
                          <div
                            className={`absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white shadow-2xs ${
                              idx === 0
                                ? "bg-emerald-600 ring-2 ring-emerald-200"
                                : "bg-slate-400"
                            }`}
                          />
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="text-xs font-semibold text-slate-900">
                                {ev.title}
                              </span>
                              <span className="text-[11px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/80 inline-flex items-center gap-1.5 shrink-0">
                                <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>
                                  {ev.timestamp &&
                                  ev.relativeTime &&
                                  ev.timestamp !== ev.relativeTime
                                    ? `${ev.timestamp} · ${ev.relativeTime}`
                                    : ev.timestamp || ev.relativeTime}
                                </span>
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed font-normal">
                              {ev.description}
                            </p>
                            <div className="text-[11px] text-slate-500">
                              Actor:{" "}
                              <strong className="font-semibold text-slate-700">
                                {ev.actor}
                              </strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </>
          )}

          {activeTab === "statement" && (
            <>
              {/* Submitter Info Card */}
              <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Complainant Details
                  </span>
                  <span className="text-xs text-slate-400">
                    Submitted {currentGrievance.createdAt}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs">
                      {currentGrievance.submitterName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div
                        className="font-semibold text-slate-900 truncate max-w-50"
                        title={currentGrievance.submitterName}
                      >
                        {currentGrievance.submitterName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {currentGrievance.submitterRole}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center text-xs">
                    <span className="text-slate-500 text-xs">
                      Contact Email
                    </span>
                    <a
                      href={buildGmailComposeUrl({
                        to: currentGrievance.submitterEmail,
                        authuser: currentHodEmail || hodEmail || undefined,
                        subject: `Regarding your grievance ${currentGrievance.ticketCode}: ${currentGrievance.title}`,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-emerald-700 hover:underline"
                      title={`Email complainant via Gmail from ${currentHodEmail || hodEmail || "Department Head"}`}
                    >
                      {currentGrievance.submitterEmail}
                    </a>
                  </div>
                </div>
              </div>

              {/* Taxonomy Classification */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700">Taxonomy:</span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700 font-medium">
                  {currentGrievance.category}
                </span>
                <span className="text-slate-400">&rsaquo;</span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700 font-medium">
                  {currentGrievance.subcategory}
                </span>
              </div>

              {/* Written Grievance Statement */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Grievance Statement & Particulars
                </h4>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs font-normal leading-relaxed text-slate-800 shadow-2xs">
                  {currentGrievance.description ||
                    "No detailed written statement provided with this submission."}
                </div>
              </div>

              {/* Attached Documents / Proofs */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Attached Proofs & Documentation (
                  {currentGrievance.attachments?.length || 0})
                </h4>
                {currentGrievance.attachments &&
                currentGrievance.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {currentGrievance.attachments.map((file) => (
                      <div
                        key={file.name}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs transition hover:border-emerald-300 hover:shadow-2xs"
                      >
                        <button
                          type="button"
                          onClick={() => handleDocumentClick(file)}
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 text-left bg-transparent border-0 p-0"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B] shrink-0">
                            {file.name.endsWith(".pdf") ? (
                              <FileText className="h-4.5 w-4.5 text-rose-600" />
                            ) : file.name.endsWith(".jpg") ||
                              file.name.endsWith(".jpeg") ||
                              file.name.endsWith(".png") ? (
                              <ImageIcon className="h-4.5 w-4.5 text-blue-600" />
                            ) : file.name.endsWith(".xlsx") ||
                              file.name.endsWith(".xls") ||
                              file.name.endsWith(".csv") ? (
                              <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-700" />
                            ) : (
                              <FileText className="h-4.5 w-4.5 text-emerald-700" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate hover:text-emerald-800 transition">
                              {file.name}
                            </div>
                            <div className="text-2.75 text-slate-400">
                              {file.size} &bull; {file.type || "Document"}
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                          <button
                            type="button"
                            onClick={() => handleDocumentClick(file)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-600/30 bg-emerald-50 px-2.5 py-1.5 text-2.75 font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View Document</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onDownloadDocument({
                                name: file.name,
                                size: file.size,
                                type: file.type || "Document",
                                path: file.path,
                                uploadedAt: file.uploadedAt,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-2.75 font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Download File"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No attachments uploaded with this grievance.
                  </p>
                )}
              </div>

              {/* Handling Officer Overview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1 text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Handling Officer
                </span>
                {currentGrievance.assignedStaffName ? (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-emerald-700" />
                      <span className="font-semibold text-slate-900">
                        {currentGrievance.assignedStaffName}
                      </span>
                    </div>
                    {currentGrievance.status !== "ESCALATED" &&
                      currentGrievance.status !== "CLOSED" &&
                      currentGrievance.status !== "RESOLVED" &&
                      currentGrievance.slaStatus === "BREACHED" && (
                        <button
                          type="button"
                          onClick={() => onAssignClick(currentGrievance)}
                          className="font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                        >
                          Change Assignment
                        </button>
                      )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-medium text-slate-600">
                      {currentGrievance.status === "CLOSED" ||
                      currentGrievance.status === "RESOLVED"
                        ? "Case Closed"
                        : "Currently Unassigned"}
                    </span>
                    {currentGrievance.status !== "CLOSED" &&
                      currentGrievance.status !== "RESOLVED" && (
                        <button
                          type="button"
                          onClick={() => onAssignClick(currentGrievance)}
                          className="rounded-lg bg-[#064E3B] px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-900"
                        >
                          Assign Officer Now
                        </button>
                      )}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              <form
                onSubmit={handleNoteSubmit}
                className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />
                    Add Department Head Directive / Internal Note
                  </span>
                  <span className="text-2.5 text-emerald-700">
                    Visible to assigned officer
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={newInternalNote}
                  onChange={(e) => setNewInternalNote(e.target.value)}
                  placeholder="Write instructions for the officer (e.g. 'Verify with accounts ledger before closing...')"
                  className="w-full rounded-lg border border-emerald-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newInternalNote.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#064E3B] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" />
                    <span>Post Directive Note</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Internal Investigation & Direction Log
                </h4>
                {currentGrievance.internalNotes &&
                currentGrievance.internalNotes.length > 0 ? (
                  currentGrievance.internalNotes.map((n) => (
                    <div
                      key={n.id}
                      className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">
                            {n.author}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-2.5 font-medium text-slate-600">
                            {n.role}
                          </span>
                        </div>
                        <span className="text-2.5 text-slate-400">
                          {n.timestamp}
                        </span>
                      </div>
                      <p className="font-normal text-slate-800 pt-1 leading-relaxed">
                        {n.note}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No internal notes logged yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dialog Sticky Footer */}
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
            {(() => {
              const staffEmail =
                caseProgressData?.assignment?.email ||
                staffList.find(
                  (s: StaffMember) => s.id === currentGrievance.assignedStaffId,
                )?.email;
              const staffName =
                caseProgressData?.assignment?.staffName ||
                currentGrievance.assignedStaffName ||
                "Staff Member";

              if (staffEmail) {
                const headSenderName =
                  currentHodName || hodName || "Department Head";
                const headSenderEmail = currentHodEmail || hodEmail || "";

                const emailSubject = `Directive regarding Case ${currentGrievance.ticketCode}: ${currentGrievance.title}`;
                const emailBody = `Dear ${staffName},\n\nPlease provide an immediate status update on grievance ${currentGrievance.ticketCode} (${currentGrievance.title}).\n\nCategory: ${currentGrievance.category} / ${currentGrievance.subcategory}\nPriority: ${currentGrievance.priority}\n\nRegards,\n${headSenderName}${headSenderEmail ? ` <${headSenderEmail}>` : ""}\nDepartment Head`;

                const gmailUrl = buildGmailComposeUrl({
                  to: staffEmail,
                  authuser: headSenderEmail || undefined,
                  subject: emailSubject,
                  body: emailBody,
                });

                return (
                  <a
                    href={gmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                    title={`Send directive via Gmail from ${headSenderEmail || headSenderName}`}
                  >
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    <span>Contact Staff</span>
                  </a>
                );
              }
              return null;
            })()}

            {currentGrievance.status !== "CLOSED" &&
              currentGrievance.status !== "RESOLVED" && (
                <button
                  type="button"
                  onClick={() => onAssignClick(currentGrievance)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                  <span>Change Assignment</span>
                </button>
              )}

            {currentGrievance.status !== "CLOSED" &&
              currentGrievance.status !== "RESOLVED" && (
                <button
                  type="button"
                  onClick={() => onEscalateClick(currentGrievance)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Add Direction</span>
                </button>
              )}

            {requiresHeadResolutionReview(currentGrievance) &&
              currentGrievance.submittedResolution && (
                <button
                  type="button"
                  onClick={() => onReviewResolutionClick(currentGrievance)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Review Resolution</span>
                </button>
              )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
