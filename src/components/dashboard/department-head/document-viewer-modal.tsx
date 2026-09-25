"use client";

import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Printer,
  ShieldCheck,
  X,
} from "lucide-react";

export interface DocumentPreviewData {
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
}

interface DocumentViewerModalProps {
  document: DocumentPreviewData | null;
  onClose: () => void;
  onDownload: (doc: DocumentPreviewData) => void;
}

export function DocumentViewerModal({
  document,
  onClose,
  onDownload,
}: DocumentViewerModalProps) {
  if (!document) return null;

  const fn = document.name.toLowerCase();
  const isImage =
    fn.endsWith(".jpg") || fn.endsWith(".jpeg") || fn.endsWith(".png");
  const isExcel =
    fn.endsWith(".xlsx") || fn.endsWith(".xls") || fn.endsWith(".csv");

  const isSalary =
    fn.includes("salary") ||
    fn.includes("pay") ||
    fn.includes("deduction") ||
    fn.includes("voucher") ||
    fn.includes("form16");

  const isCommunication =
    fn.includes("communication") ||
    fn.includes("slack") ||
    fn.includes("email") ||
    fn.includes("thread");

  const isSafety =
    fn.includes("safety") ||
    fn.includes("hazard") ||
    fn.includes("inspection") ||
    fn.includes("repair");

  const isLeave =
    fn.includes("leave") || fn.includes("hrms") || fn.includes("attendance");

  const isAppraisal =
    fn.includes("appraisal") ||
    fn.includes("evaluation") ||
    fn.includes("kpi") ||
    fn.includes("scorecard");

  const isInvestigation =
    fn.includes("investigation") ||
    fn.includes("inquiry") ||
    fn.includes("finding") ||
    fn.includes("warning") ||
    fn.includes("resolution");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[92vh] bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[#064E3B]">
              {isImage ? (
                <ImageIcon className="h-5 w-5 text-blue-600" />
              ) : isExcel ? (
                <FileSpreadsheet className="h-5 w-5 text-emerald-700" />
              ) : (
                <FileText className="h-5 w-5 text-rose-600" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className="font-bold text-sm text-slate-900 truncate"
                  title={document.name}
                >
                  {document.name}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  Verified Evidence
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {document.size} &bull; {document.type || "Official Record"}{" "}
                &bull; Case:{" "}
                <strong className="text-slate-700">
                  {document.grievanceNumber}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onDownload(document)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
              title="Download File"
            >
              <Download className="h-3.5 w-3.5 text-slate-600" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
              title="Print Document"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              aria-label="Close Preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-200/80">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg border border-slate-300/80 p-6 sm:p-10 space-y-6 text-slate-800 font-sans">
            {/* Document Header Letterhead */}
            <div className="border-b-2 border-emerald-900 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">
                    Republic Grievance Redressal System &bull; Official Dossier
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                    CONFIDENTIAL EVIDENCE RECORD
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Filed under Ticket:{" "}
                    <strong className="text-slate-900">
                      {document.grievanceNumber}
                    </strong>{" "}
                    &bull; Category: {document.category || "General Grievance"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    AUTHENTICATED
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Uploaded: {document.uploadedAt || "24 Sep 2026"}
                  </div>
                </div>
              </div>

              {/* Submitter & Case particulars metadata box */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Complainant:</span>
                  <strong className="text-slate-800 truncate block">
                    {document.submitterName || "Complainant"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Designation:</span>
                  <strong className="text-slate-800 block">
                    {document.submitterRole || "Employee"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Document File:</span>
                  <strong className="text-slate-800 truncate block">
                    {document.name}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Security Hash:</span>
                  <span className="font-mono text-[10px] text-emerald-700 block truncate">
                    SHA256:7b92f...a41c
                  </span>
                </div>
              </div>
            </div>

            {/* Document Specific Preview Rendering */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-700">
              {/* 1. SALARY & PAYROLL STATEMENTS */}
              {isSalary && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                      Payroll Ledger & Salary Reconciliation Extract
                    </h4>
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Discrepancy Under Review
                    </span>
                  </div>

                  <p>
                    This document extract provides verified payroll calculation
                    lines for the affected pay cycle. Discrepancies noted in
                    allowances and unauthorized deduction columns are flagged
                    for Department Head review.
                  </p>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">Component / Description</th>
                          <th className="p-2.5 text-right">Scheduled (₹)</th>
                          <th className="p-2.5 text-right">Disbursed (₹)</th>
                          <th className="p-2.5 text-right">Variance (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        <tr>
                          <td className="p-2.5 font-sans font-medium text-slate-900">
                            Basic Pay
                          </td>
                          <td className="p-2.5 text-right">58,000.00</td>
                          <td className="p-2.5 text-right">58,000.00</td>
                          <td className="p-2.5 text-right text-slate-400">
                            0.00
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-sans font-medium text-slate-900">
                            House Rent Allowance (HRA)
                          </td>
                          <td className="p-2.5 text-right">23,200.00</td>
                          <td className="p-2.5 text-right">23,200.00</td>
                          <td className="p-2.5 text-right text-slate-400">
                            0.00
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-sans font-medium text-slate-900">
                            Special & Shift Allowances
                          </td>
                          <td className="p-2.5 text-right">18,500.00</td>
                          <td className="p-2.5 text-right">18,500.00</td>
                          <td className="p-2.5 text-right text-slate-400">
                            0.00
                          </td>
                        </tr>
                        <tr className="bg-rose-50/60 font-medium">
                          <td className="p-2.5 font-sans text-rose-900 font-semibold">
                            Recovery & Unadjusted Deduction
                          </td>
                          <td className="p-2.5 text-right text-slate-500">
                            0.00
                          </td>
                          <td className="p-2.5 text-right text-rose-700 font-bold">
                            -12,450.00
                          </td>
                          <td className="p-2.5 text-right text-rose-700 font-bold">
                            -12,450.00
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-sans font-medium text-slate-900">
                            Provident Fund (Employee EPF)
                          </td>
                          <td className="p-2.5 text-right">-6,960.00</td>
                          <td className="p-2.5 text-right">-6,960.00</td>
                          <td className="p-2.5 text-right text-slate-400">
                            0.00
                          </td>
                        </tr>
                        <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                          <td className="p-2.5 font-sans text-slate-900">
                            Net Credit Payable
                          </td>
                          <td className="p-2.5 text-right">92,740.00</td>
                          <td className="p-2.5 text-right text-rose-800">
                            80,290.00
                          </td>
                          <td className="p-2.5 text-right text-rose-800">
                            -12,450.00
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-900 space-y-1">
                    <strong className="font-semibold block text-xs">
                      Payroll Auditor Remarks:
                    </strong>
                    <p className="text-[11px] leading-relaxed">
                      Deduction code{" "}
                      <code className="bg-white/80 px-1 py-0.5 rounded font-mono">
                        DED_REC_049
                      </code>{" "}
                      was automatically triggered without corresponding absence
                      or tax adjustment approval. Recommended for immediate
                      payroll adjustment voucher credit in the upcoming pay
                      cycle.
                    </p>
                  </div>
                </div>
              )}

              {/* 2. COMMUNICATION & SLACK / EMAIL RECORDS */}
              {isCommunication && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                      Transcribed Electronic Communications Trail
                    </h4>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      IT Archive Extract
                    </span>
                  </div>

                  <p>
                    The following electronic communications were archived and
                    submitted as factual evidence in support of case inquiry:
                  </p>

                  <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 font-sans">
                    <div className="rounded-lg bg-white p-3 border border-slate-200/80 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 pb-1">
                        <strong className="text-slate-800">
                          Reporting Supervisor
                        </strong>
                        <span>
                          18 Sep 2026, 09:42 AM &bull; Channel: #operations-core
                        </span>
                      </div>
                      <p className="text-slate-700 text-xs pt-1">
                        "Ensure this deliverable is completed by midnight.
                        Excuses regarding shift allocations will not be
                        entertained and will reflect adversely on annual
                        evaluations."
                      </p>
                    </div>

                    <div className="rounded-lg bg-emerald-50/70 p-3 border border-emerald-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-emerald-800 border-b border-emerald-200/60 pb-1">
                        <strong className="text-emerald-950">
                          Complainant
                        </strong>
                        <span>18 Sep 2026, 10:15 AM &bull; Direct Message</span>
                      </div>
                      <p className="text-slate-800 text-xs pt-1">
                        "I have already completed my designated 9-hour roster
                        and communicated earlier regarding medical appointments.
                        Requesting re-allocation according to policy
                        guidelines."
                      </p>
                    </div>

                    <div className="rounded-lg bg-rose-50/70 p-3 border border-rose-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-rose-800 border-b border-rose-200/60 pb-1">
                        <strong className="text-rose-950">
                          Reporting Supervisor (Flagged Message)
                        </strong>
                        <span>18 Sep 2026, 10:24 AM &bull; Direct Message</span>
                      </div>
                      <p className="text-slate-800 text-xs pt-1">
                        "Your non-compliance is being noted on HR records. Do
                        not escalate or contest this decision further in team
                        meetings."
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-100 p-3 text-[11px] text-slate-600 border border-slate-200">
                    <strong className="font-semibold text-slate-800">
                      Investigating Officer Certification:
                    </strong>{" "}
                    Log timestamp integrity has been cryptographically confirmed
                    against the organization workspace audit log.
                  </div>
                </div>
              )}

              {/* 3. WORKPLACE SAFETY & SITE INSPECTIONS */}
              {isSafety && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                      Workplace Safety Compliance & Site Inspection Assessment
                    </h4>
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      High Priority Hazard
                    </span>
                  </div>

                  {isImage ? (
                    <div className="space-y-3">
                      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-900 p-6 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
                        <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center text-amber-400">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold text-white text-sm">
                            SITE EVIDENCE PHOTO: {document.name}
                          </div>
                          <p className="text-xs text-slate-400 max-w-md">
                            High-resolution photographic observation captured
                            on-site during initial compliance inspection.
                          </p>
                          <div className="text-[11px] font-mono text-emerald-400 pt-2">
                            GPS / EXIF: Building B, Bay 4 Floor Junction &bull;
                            2026-09-19 14:35:10 IST
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 italic text-center">
                        Evidence photo verified by Safety Officer. Shows exposed
                        conduits and ungrounded wiring conduit near employee
                        walkway.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p>
                        A certified on-site inspection was executed following
                        the registered safety alert. Findings and containment
                        actions:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
                          <span className="text-[11px] text-slate-400 uppercase font-semibold">
                            Location / Area
                          </span>
                          <p className="font-bold text-slate-900 text-xs">
                            Facilities Wing East, Floor 2 Emergency Corridor
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
                          <span className="text-[11px] text-slate-400 uppercase font-semibold">
                            Risk Rating
                          </span>
                          <p className="font-bold text-rose-700 text-xs">
                            Level 2 (Imminent Slip & Electrical Hazard)
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                        <h5 className="font-semibold text-slate-900 text-xs">
                          Corrective Actions Executed:
                        </h5>
                        <ul className="list-disc list-inside space-y-1 text-slate-600 text-xs">
                          <li>
                            Hazard perimeter barricaded with caution signage
                            within 45 minutes of report.
                          </li>
                          <li>
                            Contractor Work Order #WO-1049 dispatched for
                            emergency conduit re-insulation.
                          </li>
                          <li>
                            Final clearance inspection conducted and signed off
                            by Facilities Engineering Lead.
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. LEAVE & HRMS RECORDS */}
              {isLeave && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                      HRMS Electronic Leave & Attendance Docket
                    </h4>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      System Audit Log
                    </span>
                  </div>

                  <p>
                    Summary of leave transaction history and automated workflow
                    routing timeline:
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                        Leave Type
                      </span>
                      <strong className="text-slate-800 text-xs">
                        Privilege Leave (PL)
                      </strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                        Duration
                      </span>
                      <strong className="text-slate-800 text-xs">
                        3 Days (14–16 Sep)
                      </strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                        Available Balance
                      </span>
                      <strong className="text-emerald-700 text-xs">
                        14.5 Days Remaining
                      </strong>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                    <h5 className="font-semibold text-slate-900 text-xs">
                      Workflow Routing Audit:
                    </h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>1. Employee Submission</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          10 Sep 2026, 11:20 AM &bull; Status: Auto-Validated
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-rose-700 font-medium">
                        <span>2. Manager Approval Step</span>
                        <span className="font-mono text-[11px]">
                          Pending &bull; Exceeded 48h SLA Window
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>3. HR Notification & Credit</span>
                        <span className="font-mono text-[11px]">
                          Queued upon Stage 2 clearance
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. APPRAISAL & PERFORMANCE */}
              {isAppraisal && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                      Annual Appraisal & KPI Evaluation Review Docket
                    </h4>
                    <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Evaluation Contest
                    </span>
                  </div>

                  <p>
                    Official record of performance cycle scores and contested
                    ratings under grievance appeal:
                  </p>

                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">
                            Key Performance Indicator (KPI)
                          </th>
                          <th className="p-2.5 text-center">Self</th>
                          <th className="p-2.5 text-center">Manager</th>
                          <th className="p-2.5">HR Review Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        <tr>
                          <td className="p-2.5 font-medium text-slate-900">
                            Project Delivery & Milestones
                          </td>
                          <td className="p-2.5 text-center font-bold text-emerald-700">
                            4.5 / 5.0
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-700">
                            4.2 / 5.0
                          </td>
                          <td className="p-2.5 text-slate-600">
                            On-time delivery confirmed.
                          </td>
                        </tr>
                        <tr className="bg-rose-50/50">
                          <td className="p-2.5 font-medium text-slate-900">
                            Cross-Team Collaboration
                          </td>
                          <td className="p-2.5 text-center font-bold text-emerald-700">
                            4.0 / 5.0
                          </td>
                          <td className="p-2.5 text-center font-bold text-rose-700">
                            2.0 / 5.0
                          </td>
                          <td className="p-2.5 text-rose-800 font-medium">
                            Contested &bull; Lack of documented feedback.
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-slate-900">
                            Technical Competence & Innovation
                          </td>
                          <td className="p-2.5 text-center font-bold text-emerald-700">
                            4.5 / 5.0
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-700">
                            4.0 / 5.0
                          </td>
                          <td className="p-2.5 text-slate-600">
                            Exceeds benchmarks.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-slate-600 text-xs">
                    Complainant requests independent panel review regarding the
                    collaboration category rating discrepancy in accordance with
                    Section 8.3 of Employee Handbook.
                  </p>
                </div>
              )}

              {/* 6. INVESTIGATION & FINDINGS */}
              {isInvestigation && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                      Formal Inquiry Committee Findings & Determination
                    </h4>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Officer Report
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs mb-1">
                        1. Inquiries & Witness Interviews:
                      </h5>
                      <p className="text-slate-600">
                        Inquiry meetings were convened with all involved
                        parties. Corroborating statements were obtained and
                        logged under case file records.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-900 text-xs mb-1">
                        2. Findings of Fact:
                      </h5>
                      <p className="text-slate-600">
                        The inquiry established procedural deviation and
                        confirmed that established escalation and workplace
                        conduct protocols were not strictly adhered to.
                      </p>
                    </div>

                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-emerald-950 space-y-1">
                      <h5 className="font-bold text-xs">
                        3. Resolution Recommendation:
                      </h5>
                      <p className="text-[11px] leading-relaxed">
                        Formal advisory issued to concerned parties. Remedial
                        adjustment instructions submitted to Department Head for
                        final sign-off and closure.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. FALLBACK / GENERAL STATEMENT */}
              {!isSalary &&
                !isCommunication &&
                !isSafety &&
                !isLeave &&
                !isAppraisal &&
                !isInvestigation && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                        Official Complainant Statement of Grievance
                      </h4>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Written Particulars
                      </span>
                    </div>

                    <div className="space-y-3 text-xs leading-relaxed text-slate-700">
                      <p>
                        <strong>Statement Subject:</strong>{" "}
                        {document.title || "Grievance Particulars"}
                      </p>
                      <p>
                        I hereby declare that the particulars furnished in this
                        grievance submission are true to the best of my
                        knowledge and belief. The circumstances cited have
                        impeded fair workplace operations and necessitated
                        formal administrative review.
                      </p>
                      <p>
                        I request the Department Head and the designated inquiry
                        officer to examine the matter objectively, enforce
                        compliance with standard operational procedures, and
                        grant fair redressal.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        Signature of Complainant:{" "}
                        <strong className="text-slate-800">
                          {document.submitterName || "Digitally Signed"}
                        </strong>
                      </span>
                      <span>Date: {document.uploadedAt || "24 Sep 2026"}</span>
                    </div>
                  </div>
                )}
            </div>

            {/* Document Footer Authentication */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>
                  Digitally Sealed & Certified &bull; Enterprise Grievance
                  Redressal System
                </span>
              </div>
              <div>Page 1 of 1 &bull; End of Official Record</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
