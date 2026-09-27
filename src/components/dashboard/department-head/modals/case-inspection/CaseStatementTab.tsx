"use client";

import {
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  UserCheck,
} from "lucide-react";
import { buildGmailComposeUrl } from "@/lib/email";
import type {
  DocumentPreviewData,
  GrievanceItem,
} from "@/types/department-head";

interface CaseStatementTabProps {
  currentGrievance: GrievanceItem;
  currentHodEmail?: string;
  hodEmail?: string;
  onDocumentClick: (file: {
    name: string;
    size: string;
    type: string;
    path?: string;
    uploadedAt?: string;
  }) => void;
  onDownloadDocument: (doc: DocumentPreviewData) => void;
  onAssignClick: (item: GrievanceItem) => void;
}

export function CaseStatementTab({
  currentGrievance,
  currentHodEmail,
  hodEmail,
  onDocumentClick,
  onDownloadDocument,
  onAssignClick,
}: CaseStatementTabProps) {
  return (
    <>
      {/* Complainant Profile */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Complainant Profile
          </span>
          <span className="text-2.75 text-slate-400">
            Registered Citizen / Employee
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
            <span className="text-slate-500 text-xs">Contact Email</span>
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
                  onClick={() => onDocumentClick(file)}
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
                    <div className="text-2.75 text-slate-400">
                      {file.size} &bull; {file.type || "Document"}
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <button
                    type="button"
                    onClick={() => onDocumentClick(file)}
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
                  className="rounded-lg bg-[#0F766E] px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-[#115E59]"
                >
                  Assign Officer Now
                </button>
              )}
          </div>
        )}
      </div>
    </>
  );
}
