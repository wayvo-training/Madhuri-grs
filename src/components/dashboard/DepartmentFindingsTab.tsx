"use client";

import {
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileSearch,
  FileText,
  Lightbulb,
  ShieldCheck,
  User,
} from "lucide-react";
import type { SupportingDepartmentFinding } from "@/types/staff";

interface DepartmentFindingsTabProps {
  findings?: SupportingDepartmentFinding[];
  emptyMessage?: string;
}

export function DepartmentFindingsTab({
  findings = [],
  emptyMessage,
}: DepartmentFindingsTabProps) {
  const hasFindings = findings && findings.length > 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Banner Header */}
      <div className="rounded-xl border border-teal-200/80 bg-gradient-to-r from-teal-50/80 via-emerald-50/40 to-slate-50 dark:border-teal-800/80 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-teal-600/10 text-teal-800 border border-teal-200/60 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-800 shrink-0 p-2.5">
              <Building2 className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Supporting Department Findings
                </h4>
                <span className="inline-flex items-center rounded-full bg-teal-100/90 text-teal-900 px-2 py-0.5 text-[10px] font-bold border border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800">
                  {findings.length}{" "}
                  {findings.length === 1 ? "Report" : "Reports"}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Official investigation outcomes, inquiry records, and
                recommendations submitted by collaborating departments to assist
                the lead department in compiling the final resolution.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!hasFindings ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-slate-400">
            <FileSearch className="h-6 w-6 text-slate-400" />
          </div>
          <div className="max-w-md mx-auto">
            <h5 className="text-sm font-bold text-slate-800">
              No Department Findings Submitted Yet
            </h5>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {emptyMessage ||
                "When supporting or collaborating departments conclude their departmental inquiry and sign off on their findings, their formal report will appear here for review."}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>Awaiting participating department submissions</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {findings.map((item, index) => (
            <div
              key={item.id || `finding-${index}`}
              className="rounded-2xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden transition hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 px-5 py-3.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 text-xs font-bold text-teal-900 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                    <Building2 className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
                    <span>
                      {item.departmentName || "Supporting Department"}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="h-3 w-3 text-emerald-700 dark:text-emerald-400" />
                    <span>Findings Submitted & Signed Off</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.submittedBy}</span>
                  </div>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <div className="flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{item.timestamp}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                {/* Findings Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <ClipboardCheck className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                    <span>Departmental Findings & Observations</span>
                  </div>
                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-normal">
                    {item.findings || "No findings recorded."}
                  </div>
                </div>

                {/* Action Taken Section */}
                {item.actionTaken && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Action Taken / Inquiries Conducted</span>
                    </div>
                    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-normal">
                      {item.actionTaken}
                    </div>
                  </div>
                )}

                {/* Recommendations & Notes Section */}
                {item.notes && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                      <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span>Recommendations & Notes for Lead Department</span>
                    </div>
                    <div className="rounded-xl border border-amber-100/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 p-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-normal">
                      {item.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Stamp */}
              <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-5 py-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span>Official departmental inquiry sign-off</span>
                </span>
                <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                  Ready for Lead Resolution Compilation
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
