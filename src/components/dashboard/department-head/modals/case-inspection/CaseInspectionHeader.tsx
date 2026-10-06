"use client";

import { ArrowLeft, CheckCircle2, X } from "lucide-react";

export interface HodInterventionInfo {
  actionType?: string;
  actionLabel?: string;
  note?: string;
  intervenedAt?: string;
  intervenedBy?: string;
  targetStaffName?: string;
  targetDepartment?: string;
  newDeadline?: string;
  isResolutionAuthority?: boolean;
}

export interface DepartmentInvolvementInfo {
  id: string;
  departmentName: string;
  involvementType: string;
  status: string;
  assignedStaff?: string | null;
}

interface CaseInspectionHeaderProps {
  ticketCode: string;
  title: string;
  category: string;
  subcategory: string;
  priority: string;
  slaState: "BREACHED" | "SLA_AT_RISK" | "AT_RISK" | "ON_TRACK" | string;
  status?: string;
  hodIntervention?: HodInterventionInfo | null;
  departmentsInvolved?: DepartmentInvolvementInfo[];
  onClose: () => void;
}

export function CaseInspectionHeader({
  ticketCode,
  title,
  category,
  subcategory,
  priority,
  slaState,
  status,
  hodIntervention,
  departmentsInvolved,
  onClose,
}: CaseInspectionHeaderProps) {
  const isClosedOrResolved = status === "CLOSED" || status === "RESOLVED";
  const isBreached = slaState === "BREACHED";
  const isAtRisk = slaState === "SLA_AT_RISK" || slaState === "AT_RISK";
  const isResolutionAuthorityAssumed =
    !isClosedOrResolved &&
    Boolean(
      hodIntervention?.isResolutionAuthority ||
        hodIntervention?.actionType === "ASSUME_RESOLUTION_AUTHORITY" ||
        hodIntervention?.actionType === "DIRECT_OVERSIGHT",
    );

  return (
    <div className="flex flex-col border-b border-slate-200/90 bg-slate-50/70 px-6 py-4 shrink-0 gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0F766E] transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to SLA Monitoring</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#0F766E]">
            {ticketCode}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
            title="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 pt-0.5">
        <div className="space-y-1 max-w-[70%]">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight tracking-[-0.02em] line-clamp-1">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span>{category}</span>
            <span className="text-slate-300">•</span>
            <span>{subcategory}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-900 font-semibold">
              {priority} Priority
            </span>
          </div>
          {departmentsInvolved && departmentsInvolved.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Collaborating:
              </span>
              {departmentsInvolved.map((dept) => (
                <span
                  key={dept.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    dept.involvementType === "PRIMARY"
                      ? "bg-teal-100 text-teal-800 border border-teal-200"
                      : dept.involvementType === "EQUAL"
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  <span>{dept.departmentName}</span>
                  <span className="text-[9px] opacity-75 font-normal">
                    ({dept.involvementType})
                  </span>
                </span>
              ))}
            </div>
          )}
          {hodIntervention && !isClosedOrResolved && (
            <div className="pt-2">
              {isResolutionAuthorityAssumed ? (
                <div className="inline-flex flex-col gap-1 rounded-xl bg-teal-50 border border-teal-300/80 px-3.5 py-2.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-950">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-[#0F766E] text-white">
                      Head Intervention Active
                    </span>
                    <span>Resolution Authority Assumed</span>
                  </div>
                  <p className="text-[11px] font-medium text-teal-900 leading-snug">
                    Department Head is now responsible for reviewing the
                    investigation and submitting the final resolution.
                  </p>
                  {hodIntervention.note && (
                    <p className="text-[11px] text-teal-800 italic border-t border-teal-200/60 pt-1 mt-0.5">
                      Directive: &ldquo;{hodIntervention.note}&rdquo;
                    </p>
                  )}
                </div>
              ) : (
                <div className="inline-flex flex-col gap-0.5 rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>
                      Current Head Intervention &ndash;{" "}
                      {hodIntervention.actionLabel}
                    </span>
                  </div>
                  {(hodIntervention.note ||
                    hodIntervention.actionType === "MONITOR") && (
                    <span className="text-[11px] font-medium text-emerald-700 pl-5.5">
                      {hodIntervention.note || "SLA Risk Acknowledged by HOD"}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          {isClosedOrResolved ? (
            <span className="text-sm font-bold text-slate-700 uppercase">
              {status}
            </span>
          ) : isBreached ? (
            <span className="text-sm font-bold text-slate-900 uppercase">
              SLA BREACHED
            </span>
          ) : isAtRisk ? (
            <span className="text-sm font-bold text-slate-900 uppercase">
              SLA AT RISK
            </span>
          ) : (
            <span className="text-sm font-bold text-slate-900 uppercase">
              ON TRACK
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
