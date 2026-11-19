import {
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { AcceptResolutionButton } from "@/components/end-user/accept-resolution-button";
import { PrintSectionButton } from "@/components/end-user/print-button";
import { ReopenButton } from "@/components/end-user/reopen-button";
import { Button } from "@/components/ui/button";

export interface ResolutionAttachment {
  id: string;
  name: string;
  path: string;
  size?: string;
  type?: string;
}

export interface EndUserResolutionData {
  id: string;
  outcome: string;
  actionTaken: string;
  findings: string;
  problemSummary?: string;
  submittedAt: string;
  attachments?: ResolutionAttachment[];
}

interface ResolutionCardProps {
  resolution: EndUserResolutionData;
  status: string;
  grievanceId: string;
  grievanceNumber?: string;
  closedAt?: string | null;
  closureReason?: string | null;
  reopenCount?: number;
  rejectionCount?: number;
  allowActions?: boolean;
  showDownloadButton?: boolean;
}

export function ResolutionCard({
  resolution,
  status,
  grievanceId,
  grievanceNumber,
  closedAt,
  closureReason,
  reopenCount = 0,
  rejectionCount = 0,
  allowActions = true,
  showDownloadButton = true,
}: ResolutionCardProps) {
  const isResolved = status === "RESOLVED" || status === "UNDER_REVIEW";
  const isClosed = status === "CLOSED";

  const isPermanentlyClosed =
    closureReason === "REWORK_REJECTED_FINAL" ||
    closureReason === "REOPEN_REJECTED_FINAL" ||
    rejectionCount >= 3;

  const isWithinReopenWindow = (() => {
    if (!isClosed || isPermanentlyClosed) return false;
    const refDate = closedAt
      ? new Date(closedAt)
      : resolution.submittedAt
        ? new Date(resolution.submittedAt)
        : new Date();
    const msSinceClosed = Date.now() - refDate.getTime();
    const daysSinceClosed = msSinceClosed / (1000 * 60 * 60 * 24);
    return daysSinceClosed <= 14;
  })();

  const canReopenClosedCase =
    isClosed && isWithinReopenWindow && reopenCount < 3 && !isPermanentlyClosed;

  const formattedDate = resolution.submittedAt
    ? new Date(resolution.submittedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      id="official-resolution-card"
      className="rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 p-6 md:p-8 shadow-sm space-y-6"
    >
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 dark:border-emerald-900/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Official Department Resolution
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                {isClosed
                  ? "Accepted & Concluded"
                  : status === "REWORK"
                    ? "Under Revision (Rework Requested)"
                    : "Resolution Proposed"}
              </span>
            </div>
            {formattedDate && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Submitted on {formattedDate}
              </p>
            )}
          </div>
        </div>

        {showDownloadButton && (
          <div className="print:hidden shrink-0">
            <PrintSectionButton
              targetId="official-resolution-card"
              documentTitle={`Official Resolution - ${grievanceNumber || "GRS"}`}
              reportHeaderTitle="Official Department Resolution Report"
              label="Download Resolution PDF"
            />
          </div>
        )}
      </div>

      {/* Outcome / Final Decision Callout */}
      <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/30 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
            Resolution Outcome & Decision
          </h4>
        </div>
        <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200 pl-6">
          {resolution.outcome}
        </p>
      </div>

      {/* Action Taken & Findings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Action Taken */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Action Taken
          </h4>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {resolution.actionTaken}
          </p>
        </div>

        {/* Investigation Findings */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-5 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Investigation Findings & Summary
          </h4>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {resolution.findings ||
              resolution.problemSummary ||
              "Investigation completed according to departmental standards."}
          </p>
        </div>
      </div>

      {/* Resolution Attachments / Proofs (if any) */}
      {resolution.attachments && resolution.attachments.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Official Resolution Documents ({resolution.attachments.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resolution.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:shadow-xs transition"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {att.name}
                    </p>
                    {att.size && (
                      <p className="text-[11px] text-slate-500">{att.size}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={att.path}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 rounded-lg cursor-pointer"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </Link>
                  <a
                    href={`${att.path}${att.path.includes("?") ? "&" : "?"}download=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 rounded-lg cursor-pointer"
                      title="Download Document"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Prompt and Buttons */}
      {allowActions && isResolved && (
        <div className="pt-4 border-t border-emerald-100 dark:border-emerald-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Employee Decision Required:
            </span>{" "}
            Review the proposed resolution above. If you are satisfied, click{" "}
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              Accept Resolution
            </span>{" "}
            to conclude the case. If not satisfied, click{" "}
            <span className="font-semibold text-rose-700 dark:text-rose-400">
              Request Rework (Not Satisfied)
            </span>{" "}
            to return it for re-investigation.
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
            <AcceptResolutionButton grievanceId={grievanceId} />
            <ReopenButton
              grievanceId={grievanceId}
              variant="rework"
              label="Request Rework (Not Satisfied)"
            />
          </div>
        </div>
      )}

      {/* Rework In Progress Banner */}
      {status === "REWORK" && (
        <div className="pt-4 border-t border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/60 dark:bg-amber-950/20 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-4 md:px-8 rounded-b-2xl">
          <div className="flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
            <RotateCcw className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <span className="font-bold">Rework Requested by You:</span>{" "}
              <span>
                You requested rework on this proposed resolution. The department
                has been returned this case to re-examine findings and address
                your feedback. A revised resolution will be submitted after
                mandatory Department Head review.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Closed Confirmation Banner & 7-Day Reopen Option */}
      {isClosed && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
            <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5 sm:mt-0" />
            <div>
              <span>
                This resolution has been accepted and the grievance is formally
                closed.
              </span>
              {canReopenClosedCase && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  If you are not satisfied or issues persist, you can reopen
                  this grievance within 14 days of closure (Attempt{" "}
                  {reopenCount} of 3 used).
                </p>
              )}
              {!canReopenClosedCase && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isPermanentlyClosed
                    ? "This grievance has been permanently closed following 3 review rejections by the Department Head. No further rework or reopening is permitted."
                    : reopenCount >= 3
                      ? "Maximum limit of 3 rework and reopening attempts reached."
                      : "The 14-day post-closure reopening window has elapsed."}
                </p>
              )}
            </div>
          </div>
          {canReopenClosedCase && (
            <div className="shrink-0 w-full sm:w-auto flex justify-end">
              <ReopenButton
                grievanceId={grievanceId}
                variant="reopen"
                label="Reopen Grievance"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
