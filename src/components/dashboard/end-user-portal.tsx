"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Send,
  UploadCloud,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";

export interface UserGrievanceItem {
  id: string;
  grievanceNumber: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  priority: string;
  status: string;
  createdAt: string;
  dueAt: string | null;
  attachments?: Array<{
    id: string;
    name: string;
    size: string;
    type: string;
    path?: string;
  }>;
  latestInquiry?: {
    subject?: string;
    message?: string;
    channels?: string[];
    requestedDocs?: string[];
    author?: string;
    timestamp?: string;
  } | null;
}

interface EndUserPortalProps {
  initialGrievances: UserGrievanceItem[];
  userFullName: string;
  userEmail: string;
}

export function EndUserPortal({
  initialGrievances,
  userFullName,
  userEmail,
}: EndUserPortalProps) {
  const [grievances, setGrievances] =
    useState<UserGrievanceItem[]>(initialGrievances);
  const [selectedGrievance, setSelectedGrievance] =
    useState<UserGrievanceItem | null>(null);
  const [isRespondingTo, setIsRespondingTo] =
    useState<UserGrievanceItem | null>(null);

  // Response Form State
  const [responseText, setResponseText] = useState("");
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Stats
  const totalCases = grievances.length;
  const waitingOnUserCases = grievances.filter(
    (g) => g.status === "WAITING_ON_USER",
  );
  const inProgressCases = grievances.filter(
    (g) => g.status === "IN_PROGRESS" || g.status === "ASSIGNED",
  );
  const closedCases = grievances.filter(
    (g) => g.status === "CLOSED" || g.status === "RESOLVED",
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFilesToUpload((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFilesToUpload((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRespondingTo || !responseText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // Prepare attachments payload
      const attachmentPayloads = filesToUpload.map((f) => ({
        fileName: f.name,
        fileType: f.type || "application/octet-stream",
        fileSize: f.size,
        filePath: `/uploads/${f.name}`,
      }));

      const res = await fetch(
        `/api/grievances/${isRespondingTo.id}/respond-info`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responseMessage: responseText.trim(),
            attachments: attachmentPayloads,
            email: userEmail,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit response");
      }

      setSubmitSuccess(
        "Response and documents submitted successfully. The investigating staff has been notified and status has returned to In Progress.",
      );

      // Update local state
      setGrievances((prev) =>
        prev.map((g) =>
          g.id === isRespondingTo.id
            ? {
                ...g,
                status: "IN_PROGRESS",
                attachments: [
                  ...(g.attachments || []),
                  ...attachmentPayloads.map((att, idx) => ({
                    id: `temp-${Date.now()}-${idx}`,
                    name: att.fileName,
                    size: `${Math.round(att.fileSize / 1024)} KB`,
                    type: att.fileType,
                    path: att.filePath,
                  })),
                ],
              }
            : g,
        ),
      );

      setResponseText("");
      setFilesToUpload([]);
      setIsRespondingTo(null);
    } catch (err: unknown) {
      console.error(err);
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit response",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Filed
          </span>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {totalCases}
          </div>
          <span className="text-[11px] text-slate-500">Registered by you</span>
        </div>

        <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Waiting on You
          </span>
          <div className="mt-1 text-2xl font-bold text-amber-950">
            {waitingOnUserCases.length}
          </div>
          <span className="text-[11px] text-amber-800">
            Requires your input
          </span>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
            In Investigation
          </span>
          <div className="mt-1 text-2xl font-bold text-blue-950">
            {inProgressCases.length}
          </div>
          <span className="text-[11px] text-blue-800">Active review</span>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900">
            Resolved / Closed
          </span>
          <div className="mt-1 text-2xl font-bold text-emerald-950">
            {closedCases.length}
          </div>
          <span className="text-[11px] text-emerald-800">Completed cases</span>
        </div>
      </div>

      {/* Global Success Feedback Banner */}
      {submitSuccess && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 flex items-center justify-between text-xs text-emerald-900 animate-in fade-in shadow-2xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950 font-semibold cursor-pointer ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* High-Priority Action Card if any grievance is WAITING_ON_USER */}
      {waitingOnUserCases.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 space-y-3 shadow-xs animate-in zoom-in-95">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-200 text-amber-900 shrink-0 mt-0.5 shadow-2xs">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>
                    Action Required on {waitingOnUserCases.length} Grievance(s)
                  </span>
                  <span className="rounded-full bg-amber-200 border border-amber-300 px-2 py-0.2 text-[10px] font-bold text-amber-900">
                    Awaiting Complainant
                  </span>
                </h3>
                <p className="text-xs text-amber-900/90 mt-0.5">
                  The investigating staff has requested additional statement
                  details or documents. Active investigation will resume as soon
                  as you submit your response.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-amber-200/80 rounded-xl border border-amber-200 bg-white/90">
            {waitingOnUserCases.map((item) => (
              <div
                key={item.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#0F766E]">
                      {item.grievanceNumber}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {item.title}
                    </span>
                  </div>
                  {item.latestInquiry && (
                    <div className="text-[11px] text-slate-600 bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                      <strong>Staff Request:</strong>{" "}
                      {item.latestInquiry.message || item.latestInquiry.subject}
                      {item.latestInquiry.requestedDocs &&
                        item.latestInquiry.requestedDocs.length > 0 && (
                          <div className="text-[10px] text-amber-900 font-medium mt-0.5">
                            Requested Documents:{" "}
                            {item.latestInquiry.requestedDocs.join(", ")}
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsRespondingTo(item);
                    setSubmitSuccess(null);
                    setSubmitError(null);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#115E59] transition cursor-pointer shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Respond &amp; Send Documents</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grievances Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden space-y-0">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              My Submitted Grievances ({grievances.length})
            </h3>
            <p className="text-xs text-slate-500">
              Track real-time progress, view staff inquiry notes, and upload
              requested proof.
            </p>
          </div>
        </div>

        {grievances.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <FileText className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="font-medium text-slate-700">
              No grievances recorded under your account.
            </p>
            <p>
              Once you register a workplace grievance, it will appear here with
              live resolution tracking.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Grievance Code &amp; Title</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {grievances.map((item) => {
                  const isWaiting = item.status === "WAITING_ON_USER";
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isWaiting ? "bg-amber-50/30" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 max-w-[280px]">
                        <span className="font-mono text-xs font-bold text-[#0F766E] block">
                          {item.grievanceNumber}
                        </span>
                        <span className="font-semibold text-slate-900 line-clamp-1 mt-0.5">
                          {item.title}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 truncate max-w-[140px]">
                        {item.category}
                      </td>

                      <td className="py-3.5 px-3">
                        <PriorityBadge priority={item.priority} />
                      </td>

                      <td className="py-3.5 px-3">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {isWaiting ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsRespondingTo(item);
                                setSubmitSuccess(null);
                                setSubmitError(null);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#115E59] rounded-lg transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Send className="h-3 w-3" />
                              <span>Respond &amp; Send Docs</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedGrievance(item)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                            >
                              View Details
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Response & Document Submission Modal */}
      {isRespondingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/90 bg-slate-50/70 px-6 py-4 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#0F766E] bg-[#F0FDFA] px-2 py-0.5 rounded border border-teal-200">
                    {isRespondingTo.grievanceNumber}
                  </span>
                  <span className="text-xs font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200">
                    Action Required
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Respond to Information Request &amp; Submit Documents
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRespondingTo(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleSubmitResponse}
              className="flex-1 overflow-y-auto p-6 space-y-4 text-xs"
            >
              {submitError && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Inquiry details from staff */}
              {isRespondingTo.latestInquiry && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                    <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-700" />
                      Staff Inquiry Particulars
                    </span>
                    <span className="text-[11px] text-amber-800 font-medium">
                      Status: Waiting on User
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900 text-xs">
                    {isRespondingTo.latestInquiry.subject}
                  </p>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {isRespondingTo.latestInquiry.message}
                  </p>
                  {isRespondingTo.latestInquiry.requestedDocs &&
                    isRespondingTo.latestInquiry.requestedDocs.length > 0 && (
                      <div className="pt-2 border-t border-amber-200/60">
                        <span className="font-semibold text-amber-950">
                          Requested Documents:
                        </span>
                        <ul className="list-disc list-inside mt-1 text-slate-700 space-y-0.5">
                          {isRespondingTo.latestInquiry.requestedDocs.map(
                            (doc) => (
                              <li key={doc}>{doc}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              )}

              {/* Response Textarea */}
              <div className="space-y-1.5">
                <label
                  htmlFor="clarification-statement"
                  className="font-bold text-slate-900 text-xs"
                >
                  Your Clarification &amp; Statement:{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="clarification-statement"
                  rows={4}
                  required
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Provide detailed clarification, context, timeline details, or notes regarding the requested proofs..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0F766E] leading-relaxed"
                />
              </div>

              {/* File Uploader */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 text-xs">
                  Attach Documents / Proofs:
                </div>
                <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-4 text-center hover:bg-slate-50 transition cursor-pointer">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center gap-1.5 text-slate-500">
                    <UploadCloud className="h-6 w-6 text-[#0F766E]" />
                    <span className="font-semibold text-slate-700 text-xs">
                      Click to browse or drag &amp; drop files here
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Supports PDF, PNG, JPG, XLSX, CSV, DOCX (Max 10MB per
                      file)
                    </span>
                  </div>
                </div>

                {/* List of files selected */}
                {filesToUpload.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="font-semibold text-slate-700 text-[11px]">
                      Selected Files ({filesToUpload.length}):
                    </span>
                    <div className="space-y-1">
                      {filesToUpload.map((f, idx) => (
                        <div
                          key={`${f.name}-${f.size}-${f.lastModified}`}
                          className="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-white"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip className="h-3.5 w-3.5 text-[#0F766E] shrink-0" />
                            <span className="font-medium text-slate-800 truncate">
                              {f.name}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              ({Math.round(f.size / 1024)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Note */}
              <div className="rounded-lg bg-[#F0FDFA] border border-teal-200 p-3 text-[11px] text-[#0F766E] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0F766E] shrink-0" />
                <span>
                  Submitting this response will instantly transition the status
                  back to <strong>In Progress</strong> and notify the assigned
                  investigating staff.
                </span>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRespondingTo(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!responseText.trim() || isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] disabled:opacity-50 transition cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {isSubmitting
                      ? "Submitting Response..."
                      : "Submit Response to Staff"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Details Viewer Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200/90 bg-slate-50/70 px-6 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#0F766E] bg-[#F0FDFA] px-2.5 py-1 rounded border border-teal-200">
                  {selectedGrievance.grievanceNumber}
                </span>
                <StatusBadge status={selectedGrievance.status} />
              </div>
              <button
                type="button"
                onClick={() => setSelectedGrievance(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  {selectedGrievance.title}
                </h3>
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span>{selectedGrievance.category}</span>
                  <span>&bull;</span>
                  <span>{selectedGrievance.subcategory}</span>
                  <span>&bull;</span>
                  <PriorityBadge priority={selectedGrievance.priority} />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-1.5">
                <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                  Original Grievance Particulars:
                </span>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedGrievance.description}
                </p>
              </div>

              {selectedGrievance.attachments &&
                selectedGrievance.attachments.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                      Uploaded Proofs ({selectedGrievance.attachments.length}):
                    </span>
                    <div className="space-y-1.5">
                      {selectedGrievance.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileText className="h-4 w-4 text-emerald-700" />
                            <span className="font-semibold text-slate-800">
                              {att.name}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              ({att.size})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedGrievance(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
