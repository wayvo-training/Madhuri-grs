"use client";

import {
  BookOpen,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Paperclip,
} from "lucide-react";
import { useState } from "react";
import { ProposeKnowledgeModal } from "@/components/knowledge/ProposeKnowledgeModal";
import { canStaffProposeKnowledge } from "@/lib/staff/utils";
import { triggerFileDownload } from "@/lib/utils/download";
import type { StaffGrievanceItem } from "@/types/staff";

interface ResolutionTabProps {
  grievance: StaffGrievanceItem;
  onOpenDocumentPreview?: (doc: {
    id?: string;
    downloadUrl?: string;
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

export function ResolutionTab({
  grievance,
  onOpenDocumentPreview,
}: ResolutionTabProps) {
  const [isProposeKbOpen, setIsProposeKbOpen] = useState(false);
  const [hasProposedKb, setHasProposedKb] = useState(
    Boolean(grievance.hasProposedKb),
  );

  if (!grievance.submittedResolution) {
    return null;
  }

  const resolutionAttachments = grievance.submittedResolution.attachments || [];

  return (
    <div className="space-y-4 text-xs">
      <div className="rounded-xl border border-emerald-200 dark:border-teal-800/80 bg-emerald-50/50 dark:bg-slate-900/90 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-emerald-900 dark:text-teal-300 flex items-center gap-1.5">
            <FileCheck2 className="h-4 w-4 text-emerald-700 dark:text-teal-400" />
            Submitted Resolution Record
          </span>
          <div className="flex items-center gap-2">
            {grievance.submittedResolution.reviewStatus && (
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                  grievance.submittedResolution.reviewStatus === "ACCEPTED"
                    ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800"
                    : grievance.submittedResolution.reviewStatus === "REJECTED"
                      ? "bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300 dark:border dark:border-rose-800"
                      : "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800"
                }`}
              >
                {grievance.submittedResolution.reviewStatus}
              </span>
            )}
            {!hasProposedKb && canStaffProposeKnowledge(grievance) && (
              <button
                type="button"
                onClick={() => setIsProposeKbOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-[#F0FDFA] px-2.5 py-1 text-[11px] font-bold text-[#0F766E] hover:bg-teal-100 transition cursor-pointer shadow-2xs"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Propose as Knowledge Article</span>
              </button>
            )}
          </div>
        </div>
        {grievance.submittedResolution.rejectionReason && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-rose-800 text-xs">
            <strong>Employee Rejection / Rework Feedback:</strong>{" "}
            {grievance.submittedResolution.rejectionReason}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <span className="font-semibold text-slate-700">Problem Summary:</span>
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
        <span className="font-semibold text-slate-700">Final Outcome:</span>
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

      {/* Staff Supportive Documents Section */}
      {resolutionAttachments.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5 text-emerald-700" />
            Staff Supportive Resolution Documents (
            {resolutionAttachments.length}):
          </span>
          <div className="space-y-2">
            {resolutionAttachments.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-emerald-50/20 p-3 text-xs transition hover:border-emerald-300 hover:shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() =>
                    onOpenDocumentPreview?.({
                      id: file.id,
                      name: file.name,
                      size: file.size,
                      type: file.type || "Supportive Document",
                      path: file.path,
                      downloadUrl: file.downloadUrl,
                      uploadedAt: file.uploadedAt,
                      grievanceNumber: grievance.grievanceNumber,
                      category: `${grievance.category} / ${grievance.subcategory}`,
                      title: grievance.title,
                      submitterName: "Staff Member",
                      submitterRole: "Assigned Staff",
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
                      {file.size} &bull; {file.type || "Supportive Document"}
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenDocumentPreview?.({
                        id: file.id,
                        name: file.name,
                        size: file.size,
                        type: file.type || "Supportive Document",
                        path: file.path,
                        downloadUrl: file.downloadUrl,
                        uploadedAt: file.uploadedAt,
                        grievanceNumber: grievance.grievanceNumber,
                        category: `${grievance.category} / ${grievance.subcategory}`,
                        title: grievance.title,
                        submitterName: "Staff Member",
                        submitterRole: "Assigned Staff",
                      })
                    }
                    className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 font-semibold px-2.5 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const dlUrl =
                        file.downloadUrl ||
                        (file.id
                          ? `/api/attachments/${file.id}/download?download=true`
                          : "") ||
                        file.path;
                      if (dlUrl) {
                        triggerFileDownload(dlUrl, file.name);
                      }
                    }}
                    className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                    title="Download document"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ProposeKnowledgeModal
        isOpen={isProposeKbOpen}
        onClose={() => setIsProposeKbOpen(false)}
        onSuccess={() => setHasProposedKb(true)}
        grievance={grievance}
      />
    </div>
  );
}
