"use client";

import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileQuestion,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  Shield,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
  PriorityBadge,
  SlaBadge,
  StatusBadge,
} from "@/components/dashboard/badges";
import {
  buildGmailComposeUrl,
  buildStaffComplainantInquiryEmail,
  buildStaffHodEscalationEmail,
} from "@/lib/email";
import type { StaffGrievanceItem } from "@/types/staff";

interface GrievanceDetailsProps {
  grievance: StaffGrievanceItem;
  staffName: string;
  staffEmail: string;
  isOpen?: boolean;
  initialTab?: "statement" | "investigation" | "resolution";
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
  onAddNote: (grievanceId: string, note: string) => Promise<void>;
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
    "statement" | "investigation" | "resolution"
  >(initialTab);
  const [newNote, setNewNote] = useState("");
  const [isPostingNote, setIsPostingNote] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Additional Information Request State
  const [isRequestInfoOpen, setIsRequestInfoOpen] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<
    ("IN_APP" | "EMAIL")[]
  >(["IN_APP", "EMAIL"]);
  const [inquirySubject, setInquirySubject] = useState(
    `Additional documentation required for ${grievance.grievanceNumber}`,
  );
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [customDocInput, setCustomDocInput] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [isResuming, setIsResuming] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  const isCompleted =
    grievance.status === "CLOSED" || grievance.status === "UNDER_REVIEW";
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

  const handlePostNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || isPostingNote) return;
    setIsPostingNote(true);
    try {
      await onAddNote(grievance.id, newNote.trim());
      setNewNote("");
    } finally {
      setIsPostingNote(false);
    }
  };

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await onStartInvestigation(grievance.id);
    } finally {
      setIsStarting(false);
    }
  };

  const handleRequestInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryMessage.trim() || isSendingRequest || !onRequestAdditionalInfo)
      return;
    setIsSendingRequest(true);
    setRequestSuccess(null);

    const docsToSend = [...selectedDocs];
    if (customDocInput.trim()) {
      docsToSend.push(customDocInput.trim());
    }

    try {
      await onRequestAdditionalInfo(grievance.id, {
        channels: selectedChannels,
        subject: inquirySubject.trim(),
        message: inquiryMessage.trim(),
        requestedDocs: docsToSend,
      });
      setRequestSuccess(
        `Request dispatched via ${selectedChannels.join(" & ")}. Status set to Waiting on User.`,
      );
      setIsRequestInfoOpen(false);
      setInquiryMessage("");
      setSelectedDocs([]);
      setCustomDocInput("");
    } catch (err: unknown) {
      console.error("Failed to request additional info:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to request additional information",
      );
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleResume = async () => {
    if (isResuming || !onResumeInvestigation) return;
    setIsResuming(true);
    try {
      await onResumeInvestigation(grievance.id);
    } catch (err: unknown) {
      console.error("Failed to resume investigation:", err);
      alert(
        err instanceof Error ? err.message : "Failed to resume investigation",
      );
    } finally {
      setIsResuming(false);
    }
  };

  const toggleChannel = (channel: "IN_APP" | "EMAIL") => {
    if (selectedChannels.includes(channel)) {
      if (selectedChannels.length > 1) {
        setSelectedChannels(selectedChannels.filter((c) => c !== channel));
      }
    } else {
      setSelectedChannels([...selectedChannels, channel]);
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
              <span className="font-mono text-xs font-bold text-[#0F766E] bg-[#F0FDFA] px-2.5 py-1 rounded-md border border-teal-200/80">
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
                <PriorityBadge priority={grievance.priority} />
                <StatusBadge status={grievance.status} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {grievance.reopenCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-800">
                  <RotateCcw className="h-3 w-3" />
                  <span>Reopened ({grievance.reopenCount})</span>
                </span>
              )}
              <SlaBadge status={grievance.slaStatus} />
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
            <span>Investigation Trail</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
              {grievance.auditTrail?.length || 0}
            </span>
          </button>
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
            <>
              {/* Complainant Profile */}
              <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Complainant Profile
                  </span>
                  <span className="text-2.75 text-slate-400">
                    Registered Submitter
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                      {grievance.submitterName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">
                        {grievance.submitterName}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {grievance.submitterRole}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center">
                    <span className="text-slate-500 text-[11px]">
                      Contact Email
                    </span>
                    <a
                      href={inquiryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-emerald-700 hover:underline inline-flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      <span>{grievance.submitterEmail}</span>
                    </a>
                    {hodEscalationUrl && (
                      <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Department Head:</span>
                        <a
                          href={hodEscalationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-700 hover:underline inline-flex items-center gap-1"
                        >
                          <Shield className="h-3 w-3" />
                          <span>Consult Supervisor ({hodName || "HOD"})</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Written Grievance Statement */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Grievance Statement & Particulars
                </h4>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs font-normal leading-relaxed text-slate-800 shadow-2xs">
                  {grievance.description || "No written statement provided."}
                </div>
              </div>

              {/* Attached Documents / Proofs */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Attached Proofs & Documentation (
                  {grievance.attachments?.length || 0})
                </h4>
                {grievance.attachments && grievance.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {grievance.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs transition hover:border-emerald-300 hover:shadow-2xs"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onOpenDocumentPreview?.({
                              name: file.name,
                              size: file.size,
                              type: file.type || "Document",
                              path: file.path,
                              uploadedAt: file.uploadedAt,
                              grievanceNumber: grievance.grievanceNumber,
                              category: `${grievance.category} / ${grievance.subcategory}`,
                              title: grievance.title,
                              submitterName: grievance.submitterName,
                              submitterRole: grievance.submitterRole,
                            })
                          }
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 text-left bg-transparent border-0 p-0"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0F766E] border border-teal-200/60 shrink-0">
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
                            <div className="text-[11px] text-slate-400">
                              {file.size} &bull; {file.type || "Document"}
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onOpenDocumentPreview?.({
                              name: file.name,
                              size: file.size,
                              type: file.type || "Document",
                              path: file.path,
                              uploadedAt: file.uploadedAt,
                              grievanceNumber: grievance.grievanceNumber,
                              category: `${grievance.category} / ${grievance.subcategory}`,
                              title: grievance.title,
                              submitterName: grievance.submitterName,
                              submitterRole: grievance.submitterRole,
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-600/30 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs cursor-pointer ml-3 shrink-0"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Proof</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No attachments uploaded with this grievance.
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === "investigation" && (
            <div className="space-y-4">
              {/* Success Alert Banner */}
              {requestSuccess && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{requestSuccess}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRequestSuccess(null)}
                    className="text-emerald-700 hover:text-emerald-950 font-semibold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Status: WAITING ON USER Banner */}
              {isWaitingOnUser && (
                <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                        <Clock className="h-4 w-4 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                            Waiting on Complainant Response
                          </h4>
                          <span className="rounded-md bg-amber-200/80 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                            WAITING_ON_USER
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Additional information or documents requested from{" "}
                          <strong>{grievance.submitterName}</strong>.
                          Investigation is paused.
                        </p>
                      </div>
                    </div>

                    {onResumeInvestigation && (
                      <button
                        type="button"
                        onClick={handleResume}
                        disabled={isResuming}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs cursor-pointer transition disabled:opacity-50 shrink-0"
                      >
                        <Play className="h-3 w-3" />
                        <span>
                          {isResuming ? "Resuming..." : "Resume Manually"}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="rounded-lg bg-white/90 border border-amber-200 p-3 text-xs text-slate-700 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      <span>Two-Way Inquiry Active:</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      The complainant has been notified via In-App Notification
                      and Email. Once {grievance.submitterName} submits their
                      response or uploads the requested documents, the status
                      will automatically update to <strong>In Progress</strong>{" "}
                      and you will receive a notification.
                    </p>
                  </div>
                </div>
              )}

              {/* IN_PROGRESS: Request Additional Information from Complainant Card */}
              {isInProgress && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                        <FileQuestion className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-blue-950">
                          Need Additional Information or Documents from
                          Complainant?
                        </h4>
                        <p className="text-[11px] text-blue-800 mt-0.5">
                          Request clarification or documents via In-App
                          Notification and Email. Sets status to{" "}
                          <strong>Waiting on User</strong>.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRequestInfoOpen(!isRequestInfoOpen)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-2xs transition cursor-pointer shrink-0"
                    >
                      <Send className="h-3 w-3" />
                      <span>
                        {isRequestInfoOpen
                          ? "Close Request Form"
                          : "Request Additional Info"}
                      </span>
                    </button>
                  </div>

                  {/* Interactive Request Additional Info Form */}
                  {isRequestInfoOpen && (
                    <form
                      onSubmit={handleRequestInfoSubmit}
                      className="pt-3 border-t border-blue-200/80 space-y-3 bg-white p-4 rounded-xl border border-slate-200"
                    >
                      {/* Notification Channels Selection */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                          <span>Select Notification Channels:</span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            (Mail and In-App Notifications)
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 pt-1">
                          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedChannels.includes("IN_APP")}
                              onChange={() => toggleChannel("IN_APP")}
                              className="rounded border-slate-300 text-[#0F766E] focus:ring-teal-600 h-4 w-4 cursor-pointer"
                            />
                            <span className="flex items-center gap-1.5">
                              <Bell className="h-3.5 w-3.5 text-[#0F766E]" />
                              <strong>In-App Notification</strong> (Complainant
                              Portal)
                            </span>
                          </label>

                          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedChannels.includes("EMAIL")}
                              onChange={() => toggleChannel("EMAIL")}
                              className="rounded border-slate-300 text-[#0F766E] focus:ring-teal-600 h-4 w-4 cursor-pointer"
                            />
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-emerald-600" />
                              <strong>Official Email / Mail</strong> (
                              {grievance.submitterEmail})
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Request Subject */}
                      <div className="space-y-1">
                        <label
                          htmlFor="inquiry-subject"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Inquiry Subject / Topic:
                        </label>
                        <input
                          id="inquiry-subject"
                          type="text"
                          required
                          value={inquirySubject}
                          onChange={(e) => setInquirySubject(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-[#0F766E] focus:outline-hidden"
                          placeholder="e.g. Additional documentation required: Performance evaluation records"
                        />
                      </div>

                      {/* Message / Information Needed */}
                      <div className="space-y-1">
                        <label
                          htmlFor="inquiry-message"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Specific Questions &amp; Clarification Needed:
                        </label>
                        <textarea
                          id="inquiry-message"
                          rows={3}
                          required
                          value={inquiryMessage}
                          onChange={(e) => setInquiryMessage(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0F766E] focus:outline-hidden leading-relaxed"
                          placeholder="Describe the exact information or clarification needed from the complainant..."
                        />
                      </div>

                      {/* Required Documents Checklist */}
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-700">
                          Specify Documents to Request:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {[
                            "Appraisal / Scorecard Sheet",
                            "Salary Slip / Remuneration Sheet",
                            "Written Email / Chat Proofs",
                            "Medical Certificate / Official Proof",
                            "Company Policy / Contract Copy",
                          ].map((doc) => (
                            <label
                              key={doc}
                              className="inline-flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 cursor-pointer transition"
                            >
                              <input
                                type="checkbox"
                                checked={selectedDocs.includes(doc)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDocs([...selectedDocs, doc]);
                                  } else {
                                    setSelectedDocs(
                                      selectedDocs.filter((d) => d !== doc),
                                    );
                                  }
                                }}
                                className="rounded border-slate-300 text-blue-600 h-3.5 w-3.5 cursor-pointer"
                              />
                              <span className="text-[11px] text-slate-700 font-medium">
                                {doc}
                              </span>
                            </label>
                          ))}
                        </div>

                        {/* Custom Doc Add */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={customDocInput}
                            onChange={(e) => setCustomDocInput(e.target.value)}
                            placeholder="Add other required document name..."
                            className="flex-1 rounded-lg border border-slate-300 p-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      {/* Action Submission */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-slate-100 gap-2">
                        <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            Grievance status will change from{" "}
                            <strong>In Progress</strong> to{" "}
                            <strong>Waiting on User</strong>.
                          </span>
                        </span>
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setIsRequestInfoOpen(false)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={
                              isSendingRequest || !inquiryMessage.trim()
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition shadow-2xs disabled:opacity-50 cursor-pointer"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>
                              {isSendingRequest
                                ? "Dispatching Request..."
                                : "Send Request & Set Waiting on User"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Add Note Form */}
              <form
                onSubmit={handlePostNoteSubmit}
                className="rounded-xl border border-teal-200 bg-[#F0FDFA] p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#115E59] flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-[#0F766E]" />
                    Investigation Notes / Internal Communication
                  </span>
                  <span className="text-[11px] text-[#0F766E]">
                    Visible to Department Head
                  </span>
                </div>
                <textarea
                  rows={3}
                  required
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record investigation findings or note for Department Head (e.g. 'I reviewed the submitted performance records. The previous evaluation contains a conflicting rating, so additional clarification may be required.')"
                  className="w-full rounded-lg border border-teal-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0F766E]"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newNote.trim() || isPostingNote}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] disabled:opacity-50 transition cursor-pointer"
                  >
                    <Send className="h-3 w-3" />
                    <span>{isPostingNote ? "Logging..." : "Log Note"}</span>
                  </button>
                </div>
              </form>

              {/* Two-Way Internal Case Notes */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Internal Case Communication (
                  {grievance.internalNotes?.length || 0})
                </h4>
                {grievance.internalNotes &&
                grievance.internalNotes.length > 0 ? (
                  <div className="space-y-2.5">
                    {grievance.internalNotes.map((n) => {
                      const isHead = n.role.toLowerCase().includes("head");
                      return (
                        <div
                          key={n.id}
                          className={`rounded-xl border p-3.5 text-xs space-y-1.5 shadow-2xs ${
                            isHead
                              ? "border-emerald-200 bg-emerald-50/40"
                              : "border-blue-200 bg-blue-50/40"
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">
                                {isHead
                                  ? n.author.startsWith("Department Head")
                                    ? n.author
                                    : `Department Head — ${n.author.replace(/^(Department Head|HOD)\s*[—–-]?\s*/i, "")}`
                                  : n.author.startsWith("Staff")
                                    ? n.author
                                    : `Staff — ${n.author.replace(/^Staff\s*[—–-]?\s*/i, "")}`}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                  isHead
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : "bg-blue-100 text-blue-800 border border-blue-200"
                                }`}
                              >
                                {isHead
                                  ? "Internal Note"
                                  : "Investigation Note"}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {n.timestamp}
                            </span>
                          </div>
                          <p className="font-normal text-slate-800 pt-1 leading-relaxed whitespace-pre-wrap">
                            {n.note}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No internal case communication logged yet.
                  </p>
                )}
              </div>

              {/* Activity Timeline */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Chronological Investigation & Governance Trail
                </h4>
                {grievance.auditTrail && grievance.auditTrail.length > 0 ? (
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.75 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {grievance.auditTrail.map((ev, idx) => (
                      <div key={ev.id || idx} className="relative group">
                        <div
                          className={`absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white shadow-2xs ${
                            idx === 0
                              ? "bg-emerald-600 ring-2 ring-emerald-100"
                              : "bg-slate-400"
                          }`}
                        />
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
                          <span className="text-xs font-semibold text-slate-900 leading-tight">
                            {ev.action}
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                            {ev.relativeTime || ev.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {ev.details}
                        </p>
                        {ev.actor && (
                          <span className="inline-block mt-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            By: {ev.actor}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    No activity logs recorded yet.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "resolution" && grievance.submittedResolution && (
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
                        grievance.submittedResolution.reviewStatus ===
                        "ACCEPTED"
                          ? "bg-emerald-100 text-emerald-900"
                          : grievance.submittedResolution.reviewStatus ===
                              "REJECTED"
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
                <span className="font-semibold text-slate-700">
                  Problem Summary:
                </span>
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
                <span className="font-semibold text-slate-700">
                  Final Outcome:
                </span>
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
                <span>Submit Resolution</span>
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
      </div>
    </div>
  );
}
