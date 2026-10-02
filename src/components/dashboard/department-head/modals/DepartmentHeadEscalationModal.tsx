"use client";

import { Send, ShieldAlert, X } from "lucide-react";
import type { FormEvent } from "react";
import { PriorityBadge } from "@/components/dashboard/badges";
import { formatEscalationNotice } from "@/lib/department-head/utils";
import type {
  EscalationBottleneck,
  EscalationInterventionType,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";

export interface DepartmentHeadEscalationModalProps {
  grievance: GrievanceItem;
  staffList: StaffMember[];
  bottleneck: EscalationBottleneck;
  interventionType: EscalationInterventionType;
  targetStaffId: string;
  targetDept: string;
  note: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBottleneckChange: (value: EscalationBottleneck) => void;
  onInterventionTypeChange: (value: EscalationInterventionType) => void;
  onTargetStaffIdChange: (value: string) => void;
  onTargetDeptChange: (value: string) => void;
  onNoteChange: (value: string) => void;
}

export function DepartmentHeadEscalationModal({
  grievance,
  staffList,
  bottleneck,
  interventionType,
  targetStaffId,
  targetDept,
  note,
  onClose,
  onSubmit,
  onBottleneckChange,
  onInterventionTypeChange,
  onTargetStaffIdChange,
  onTargetDeptChange,
  onNoteChange,
}: DepartmentHeadEscalationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                SLA Escalation Intervention
              </h3>
              <p className="text-xs font-normal text-slate-500">
                Ticket{" "}
                <span className="font-mono font-semibold text-amber-800">
                  {grievance.ticketCode}
                </span>{" "}
                &bull; {grievance.slaTimeLeft}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-950">
                  {grievance.title}
                </span>
                <PriorityBadge priority={grievance.priority} />
              </div>
              <p className="text-amber-950 font-normal">
                <strong>Breach Context:</strong>{" "}
                {formatEscalationNotice(grievance.escalationReason)}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-2.75 text-slate-600 border-t border-amber-200/60">
                <span>
                  Submitter: <strong>{grievance.submitterName}</strong>
                </span>
                <span>&bull;</span>
                <span>
                  Currently Assigned:{" "}
                  <strong>{grievance.assignedStaffName || "Unassigned"}</strong>
                </span>
                <span>&bull;</span>
                <span>
                  Category: <strong>{grievance.category}</strong>
                </span>
              </div>
            </div>

            <div>
              <div className="block text-xs font-semibold text-slate-900 mb-1.5">
                Identify Root Operational Bottleneck{" "}
                <span className="text-rose-500">*</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  [
                    "STAFF_CAPACITY",
                    "👥 Staff Capacity / Absence",
                    "Staff member overloaded or on approved leave",
                  ],
                  [
                    "CROSS_DEPT",
                    "🏢 Cross-Department Dependency",
                    "Awaiting response or approval from Finance/IT",
                  ],
                  [
                    "MISSING_DOCS",
                    "📁 Incomplete Documentation",
                    "Awaiting original bills or vouchers from submitter",
                  ],
                  [
                    "COMPLEX_INVESTIGATION",
                    "🔍 Complex Investigation Required",
                    "Requires audit panel or field verification",
                  ],
                ].map(([value, label, description]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      onBottleneckChange(value as EscalationBottleneck)
                    }
                    className={`rounded-xl border p-2.5 text-left text-xs transition ${
                      bottleneck === value
                        ? "w-fit max-w-full self-start border-[#0F766E] bg-[#F0FDFA] text-[#0F766E] font-semibold ring-1 ring-[#0F766E]"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {label}
                    <div className="text-2.75 font-normal text-slate-500 mt-0.5">
                      {description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="block text-xs font-semibold text-slate-900 mb-1.5">
                Choose Corrective Intervention Action{" "}
                <span className="text-rose-500">*</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  [
                    "MONITOR",
                    "👁️ Continue Monitoring",
                    "Acknowledge SLA risk and supervise without reassigning",
                  ],
                  [
                    "NOTIFY_STAFF",
                    "📢 Notify Assigned Staff",
                    "Send urgent priority nudge to assigned staff member",
                  ],
                  [
                    "CROSS_DEPT",
                    "🤝 Add Supporting Dept / Staff",
                    "Enlist supporting department to collaborate",
                  ],
                  [
                    "REASSIGN",
                    "🔄 Change Assignment",
                    "Transfer grievance to an active staff member with spare capacity",
                  ],
                ].map(([value, label, description]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      onInterventionTypeChange(
                        value as EscalationInterventionType,
                      )
                    }
                    className={`rounded-xl border p-2.5 text-left text-xs transition ${
                      interventionType === value
                        ? "w-fit max-w-full self-start border-[#0F766E] bg-[#F0FDFA] text-[#0F766E] font-semibold ring-1 ring-[#0F766E]"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {label}
                    <div className="text-2.75 font-normal text-slate-500 mt-0.5">
                      {description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* REASSIGN target staff selection removed - delegates to main assignment logic */}

            {interventionType === "CROSS_DEPT" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label
                  htmlFor="escalation-target-dept"
                  className="block text-xs font-semibold text-slate-900 mb-1"
                >
                  Select Collaborating Department{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  id="escalation-target-dept"
                  value={targetDept}
                  onChange={(e) => onTargetDeptChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="Medical Superintendent Services">
                    Medical Superintendent Services
                  </option>
                  <option value="General Administration">
                    General Administration
                  </option>
                  <option value="Human Resources & Legal">
                    Human Resources & Legal
                  </option>
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor="escalation-action-note"
                className="block text-xs font-semibold text-slate-900 mb-1.5"
              >
                Intervention Directive & Justification (Logged to Audit Trail){" "}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="escalation-action-note"
                required
                rows={3}
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Explain the operational bottleneck resolved and specific directives given to staff..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 bg-slate-50/90 shrink-0 gap-2">
            <span className="text-2.75 text-slate-500">
              Intervention is logged to the audit trail and dispatched to the
              assigned staff member.
            </span>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Confirm & Execute Intervention &rarr;</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
