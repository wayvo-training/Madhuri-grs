"use client";

import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock,
  FileQuestion,
  Mail,
  MessageSquare,
  Play,
  Send,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { StaffGrievanceItem } from "@/types/staff";

interface InvestigationTabProps {
  grievance: StaffGrievanceItem;
  isWaitingOnUser: boolean;
  isInProgress: boolean;
  onResumeInvestigation?: (grievanceId: string) => Promise<void>;
  onRequestAdditionalInfo?: (
    grievanceId: string,
    payload: {
      channels: ("IN_APP" | "EMAIL")[];
      subject: string;
      message: string;
      requestedDocs: string[];
    },
  ) => Promise<void>;
  onAddNote: (grievanceId: string, note: string) => Promise<void>;
}

export function InvestigationTab({
  grievance,
  isWaitingOnUser,
  isInProgress,
  onResumeInvestigation,
  onRequestAdditionalInfo,
  onAddNote,
}: InvestigationTabProps) {
  const [newNote, setNewNote] = useState("");
  const [isPostingNote, setIsPostingNote] = useState(false);

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
                  <strong>{grievance.submitterName}</strong>. Investigation is
                  paused.
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
                <span>{isResuming ? "Resuming..." : "Resume Manually"}</span>
              </button>
            )}
          </div>

          <div className="rounded-lg bg-white/90 border border-amber-200 p-3 text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              <span>Two-Way Inquiry Active:</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              The complainant has been notified via In-App Notification and
              Email. Once {grievance.submitterName} submits their response or
              uploads the requested documents, the status will automatically
              update to <strong>In Progress</strong> and you will receive a
              notification.
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
                  Need Additional Information or Documents from Complainant?
                </h4>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Request clarification or documents via In-App Notification and
                  Email. Sets status to <strong>Waiting on User</strong>.
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
                      <strong>In-App Notification</strong> (Complainant Portal)
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
                    disabled={isSendingRequest || !inquiryMessage.trim()}
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
          Internal Case Communication ({grievance.internalNotes?.length || 0})
        </h4>
        {grievance.internalNotes && grievance.internalNotes.length > 0 ? (
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
                        {isHead ? "Internal Note" : "Investigation Note"}
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
  );
}
