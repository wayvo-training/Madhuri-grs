"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Paperclip,
  Send,
  UploadCloud,
  X,
  Plus,
  RefreshCw,
  Search,
  Filter,
  FilePlus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react";
import type React from "react";
import { useState, useMemo, useEffect } from "react";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import { GrievanceList } from "./grievance-list";
import { Pagination } from "@/components/ui/pagination";
import { ActionMenu } from "@/components/ui/action-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  userEmail,
  userFullName,
}: EndUserPortalProps) {
  const router = useRouter();
  const [grievances, setGrievances] =
    useState<UserGrievanceItem[]>(initialGrievances);
  const [selectedGrievance, setSelectedGrievance] =
    useState<UserGrievanceItem | null>(null);
  const [isRespondingTo, setIsRespondingTo] =
    useState<UserGrievanceItem | null>(null);

  // Track Search State
  const [trackSearchId, setTrackSearchId] = useState("");

  // Response Form State
  const [responseText, setResponseText] = useState("");
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pagination for Recent Grievances
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const paginatedRecentGrievances = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return grievances.slice(start, start + pageSize);
  }, [grievances, currentPage, pageSize]);
  const totalPages = Math.ceil(grievances.length / pageSize) || 1;

  // Stats
  const totalCases = grievances.length;
  const waitingOnUserCases = grievances.filter((g) => g.status === "WAITING_ON_USER");
  const inProgressCases = grievances.filter((g) => g.status === "IN_PROGRESS" || g.status === "ASSIGNED");
  const closedCases = grievances.filter((g) => g.status === "CLOSED" || g.status === "RESOLVED");

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
      const attachmentPayloads = filesToUpload.map((f) => ({
        fileName: f.name,
        fileType: f.type || "application/octet-stream",
        fileSize: f.size,
        filePath: `/uploads/${f.name}`,
      }));

      const res = await fetch(`/api/grievances/${isRespondingTo.id}/respond-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseMessage: responseText.trim(),
          attachments: attachmentPayloads,
          email: userEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit response");
      }

      setSubmitSuccess(
        "Response and documents submitted successfully. The investigating staff has been notified and status has returned to In Progress."
      );

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
            : g
        )
      );

      setResponseText("");
      setFilesToUpload([]);
      setIsRespondingTo(null);
    } catch (err: unknown) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : "Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrack = () => {
    if (trackSearchId.trim()) {
      router.push(`/end-user/track?id=${trackSearchId.trim()}`);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 min-h-0">
      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Filed</span>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100">{totalCases}</div>
        </div>

        <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-500 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Action Required
            </span>
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-amber-900 dark:text-amber-100">{waitingOnUserCases.length}</div>
        </div>

        <div className="rounded-2xl border border-blue-200/80 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-500">In Progress</span>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-blue-900 dark:text-blue-100">{inProgressCases.length}</div>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-500">Resolved</span>
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-emerald-900 dark:text-emerald-100">{closedCases.length}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Track Grievance Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Track a Grievance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enter grievance number to view current status.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={trackSearchId}
              onChange={(e) => setTrackSearchId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTrack();
              }}
              placeholder="e.g. GRS-2026-0007"
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
            />
            <button 
              onClick={handleTrack}
              disabled={!trackSearchId.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-950 hover:bg-teal-900 dark:bg-teal-900 dark:hover:bg-teal-800 px-4 py-2 text-sm font-bold text-white shadow-sm transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" 
              title="Track grievance"
            >
              <Search className="w-4 h-4" />
              <span>Track</span>
            </button>
          </div>
        </div>

        {/* Raise New Grievance Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 shrink-0">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Need to raise a new grievance?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Submit a new grievance regarding any workplace issue.
              </p>
            </div>
          </div>
          <Link href="/end-user/submit" className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition">
            <Plus className="w-4 h-4" />
            <span>File New Grievance</span>
          </Link>
        </div>
      </div>

      {/* Global Success Feedback Banner */}
      {submitSuccess && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-100 animate-in fade-in shadow-2xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitSuccess(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-200 font-semibold cursor-pointer ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action Required Cards */}
      {waitingOnUserCases.length > 0 && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 p-5 space-y-4 shadow-xs animate-in zoom-in-95">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 shrink-0 shadow-2xs">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-950 dark:text-amber-50">
                Action Required on {waitingOnUserCases.length} Grievance(s)
              </h3>
              <p className="text-sm text-amber-900/90 dark:text-amber-200/80 mt-1">
                The investigating staff has requested additional details or documents to proceed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {waitingOnUserCases.map((item: UserGrievanceItem) => (
              <div
                key={item.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-amber-200 dark:border-amber-700/50 bg-white/90 dark:bg-slate-900/60 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal-700 dark:text-teal-400 text-sm">
                      {item.grievanceNumber}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                      {item.title}
                    </span>
                  </div>
                  {item.latestInquiry && (
                    <div className="text-xs text-slate-600 dark:text-slate-400 bg-amber-50/50 dark:bg-amber-900/30 p-2.5 rounded-lg border border-amber-100 dark:border-amber-800 mt-2">
                      <strong className="text-amber-900 dark:text-amber-300">Staff Note:</strong> {item.latestInquiry.message || item.latestInquiry.subject}
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition cursor-pointer shrink-0"
                >
                  <Send className="h-4 w-4" />
                  <span>Respond Now</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Grievances Area */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Recent Grievances
            </h3>
            <p className="mt-0.5 text-xs font-normal text-slate-500 dark:text-slate-400">
              Your latest submitted grievances
            </p>
          </div>
          <Link
            href="/end-user/grievances"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 dark:text-emerald-500 dark:hover:text-emerald-400"
          >
            <span>View Full Table</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 overflow-y-auto custom-scrollbar flex-1 relative min-h-0">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md shadow-sm z-10 after:absolute after:inset-x-0 after:bottom-0 after:border-b after:border-slate-200 dark:after:border-slate-700">
              <tr>
                <th className="py-2.5 pl-4 pr-2 font-semibold text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider">Grievance ID</th>
                <th className="px-2 py-2.5 font-semibold text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider">Title</th>
                <th className="px-2 py-2.5 font-semibold text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider">Category</th>
                <th className="px-2 py-2.5 font-semibold text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider">Priority</th>
                <th className="px-2 py-2.5 font-semibold text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider">Status</th>
                <th className="px-2 py-2.5 font-semibold text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider">Submitted</th>
                <th className="py-2.5 px-4 text-right font-semibold text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {grievances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No grievances registered yet.
                  </td>
                </tr>
              ) : (
                paginatedRecentGrievances.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2.5 pl-4 pr-2 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {g.grievanceNumber}
                    </td>
                    <td className="py-2.5 px-2 max-w-[200px]">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 text-sm">
                        {g.title}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400 text-sm truncate max-w-[140px]">
                      {g.category}
                    </td>
                    <td className="py-2.5 px-2">
                      <PriorityBadge priority={g.priority} />
                    </td>
                    <td className="py-2.5 px-2">
                      <StatusBadge status={g.status} />
                    </td>
                    <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                      {new Date(g.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <ActionMenu
                        items={[
                          {
                            label: "View Details",
                            icon: <Eye className="h-4 w-4" />,
                            onClick: () => router.push(`/end-user/grievances/${g.id}`)
                          }
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {grievances.length > 0 && (
          <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 shrink-0">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={grievances.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20]}
              itemLabel="grievances"
            />
          </div>
        )}
      </div>

      {/* Modals are kept below */}
      {/* Response Modal */}
      {isRespondingTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Respond to Staff Inquiry &mdash; {isRespondingTo.grievanceNumber}
              </h2>
              <button
                type="button"
                onClick={() => setIsRespondingTo(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitResponse} className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
              {submitError && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span className="font-medium text-xs">{submitError}</span>
                </div>
              )}

              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
                <div className="flex items-center gap-2 text-blue-900 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-bold text-xs uppercase tracking-wider">Staff Request</span>
                </div>
                <p className="text-sm text-blue-950">
                  {isRespondingTo.latestInquiry?.message || isRespondingTo.latestInquiry?.subject}
                </p>
                {isRespondingTo.latestInquiry?.requestedDocs && isRespondingTo.latestInquiry.requestedDocs.length > 0 && (
                  <div className="mt-3 p-3 bg-white/60 rounded-lg border border-blue-100">
                    <span className="block text-xs font-bold text-blue-900 mb-1">Requested Proof / Documents:</span>
                    <ul className="list-disc pl-5 text-xs text-blue-800 space-y-1">
                      {isRespondingTo.latestInquiry.requestedDocs.map((doc, i) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Your Response Statement</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  placeholder="Type your response or statement here..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Attach Documents</label>
                <div className="relative rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-600 bg-slate-50 dark:bg-slate-800/50 p-6 transition">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center gap-2 text-slate-500 text-center">
                    <UploadCloud className="h-8 w-8 text-teal-600 dark:text-teal-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                      Click or drag &amp; drop files here
                    </span>
                    <span className="text-xs text-slate-400">
                      Supports PDF, PNG, JPG, XLSX (Max 10MB)
                    </span>
                  </div>
                </div>

                {filesToUpload.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Files Selected:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filesToUpload.map((f, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{f.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="text-slate-400 hover:text-rose-500 p-1 transition cursor-pointer shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRespondingTo(null)}
                  className="px-5 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!responseText.trim() || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50 transition cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? "Submitting..." : "Submit Response"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Details Viewer Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-900">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Grievance Details
              </h2>
              <button
                type="button"
                onClick={() => setSelectedGrievance(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-teal-700 dark:text-teal-400">{selectedGrievance.grievanceNumber}</span>
                  <StatusBadge status={selectedGrievance.status} />
                  <PriorityBadge priority={selectedGrievance.priority} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {selectedGrievance.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Filed: {new Date(selectedGrievance.createdAt).toLocaleDateString()}</span>
                  <span>&bull;</span>
                  <span>Category: <strong>{selectedGrievance.category} / {selectedGrievance.subcategory}</strong></span>
                </div>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <p className="whitespace-pre-wrap leading-relaxed">{selectedGrievance.description}</p>
              </div>

              {selectedGrievance.attachments && selectedGrievance.attachments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Attached Evidence</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedGrievance.attachments.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                        <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg text-teal-600 dark:text-teal-400">
                          <Paperclip className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-500">{file.size}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedGrievance(null)}
                className="px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
