"use client";

import { Eye, FileSpreadsheet, FileText, Image as ImageIcon, Mail, Shield } from "lucide-react";
import type { StaffGrievanceItem } from "@/types/staff";

interface StatementTabProps {
  grievance: StaffGrievanceItem;
  inquiryUrl: string;
  hodEscalationUrl: string | null;
  hodName?: string;
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

export function StatementTab({
  grievance,
  inquiryUrl,
  hodEscalationUrl,
  hodName,
  onOpenDocumentPreview,
}: StatementTabProps) {
  return (
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
            <span className="text-slate-500 text-[11px]">Contact Email</span>
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

      {/* Departments Involved (Multi-department only) */}
      {grievance.departmentsInvolved && grievance.departmentsInvolved.length > 1 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Departments Involved
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {grievance.departmentsInvolved.map((dept) => (
              <div
                key={dept.id}
                className={`rounded-xl border p-4 shadow-2xs ${
                  dept.involvementType === "PRIMARY"
                    ? "border-teal-200 bg-teal-50/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="font-semibold text-slate-900 text-sm">
                    {dept.departmentName}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      dept.involvementType === "PRIMARY"
                        ? "bg-teal-100 text-teal-800"
                        : dept.involvementType === "EQUAL"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {dept.involvementType}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Assigned Staff:</span>
                    <span className="font-medium text-slate-900">
                      {dept.assignedStaff || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-medium text-slate-900">
                      {dept.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MY ASSIGNMENT (Multi-department only) */}
      {grievance.departmentsInvolved && grievance.departmentsInvolved.length > 1 && (
        <div className="space-y-2 mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            My Assignment
          </h4>
          {grievance.departmentsInvolved.filter((d) => d.isMyAssignment).map((myDept) => (
            <div
              key={`my-${myDept.id}`}
              className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs"
            >
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-900">{myDept.departmentName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Role:</span>
                  <span className="font-semibold text-slate-900 capitalize">{myDept.involvementType.toLowerCase()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Staff:</span>
                  <span className="font-semibold text-slate-900">{myDept.assignedStaff}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold text-slate-900">{myDept.status.replace(/_/g, " ")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
  );
}
