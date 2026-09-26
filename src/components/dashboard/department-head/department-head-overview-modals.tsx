"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Send,
  ShieldAlert,
  UserPlus,
  X,
} from "lucide-react";
import type { FormEvent } from "react";

import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import { formatEscalationNotice } from "@/lib/department-head/utils";
import type { GrievanceItem, StaffMember } from "@/types/department-head";

type EscalationBottleneck =
  | "STAFF_CAPACITY"
  | "CROSS_DEPT"
  | "MISSING_DOCS"
  | "COMPLEX_INVESTIGATION"
  | "ADMIN_DELAY";

type EscalationInterventionType =
  | "MONITOR"
  | "NOTIFY_STAFF"
  | "REASSIGN"
  | "CROSS_DEPT";

interface EscalationModalProps {
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
}: EscalationModalProps) {
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
                        ? "w-fit max-w-full self-start border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
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
                    "🔄 Reassign to Available Staff",
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
                        ? "w-fit max-w-full self-start border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
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

            {interventionType === "REASSIGN" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label
                  htmlFor="escalation-target-staff"
                  className="block text-xs font-semibold text-slate-900 mb-1"
                >
                  Select Target Staff Member{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  id="escalation-target-staff"
                  required
                  value={targetStaffId}
                  onChange={(e) => onTargetStaffIdChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="">
                    -- Choose an Available Staff Member --
                  </option>
                  {staffList.map((s) => (
                    <option
                      key={s.id}
                      value={s.id}
                      disabled={s.status === "ON_LEAVE"}
                    >
                      {s.name} ({s.designation}) &bull; {s.activeTickets}/
                      {s.maxCapacity} grievances{" "}
                      {s.status === "ON_LEAVE" ? "[ON LEAVE]" : "[AVAILABLE]"}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                disabled={interventionType === "REASSIGN" && !targetStaffId}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition disabled:opacity-50"
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

interface ResolutionModalProps {
  grievance: GrievanceItem;
  decision: "APPROVE" | "REJECT";
  feedback: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDecisionChange: (value: "APPROVE" | "REJECT") => void;
  onFeedbackChange: (value: string) => void;
}

export function DepartmentHeadResolutionModal({
  grievance,
  decision,
  feedback,
  onClose,
  onSubmit,
  onDecisionChange,
  onFeedbackChange,
}: ResolutionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Resolution Review & Clearance
            </h3>
            <p className="text-xs font-normal text-slate-500">
              Final sign-off for{" "}
              <span className="font-mono font-semibold text-[#064E3B]">
                {grievance.ticketCode}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-slate-800 space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-emerald-950">
              <span>
                Assigned Staff Findings:{" "}
                {grievance.submittedResolution?.staffName}
              </span>
              <span className="text-2.75 font-normal text-slate-500">
                {grievance.submittedResolution?.submittedAt}
              </span>
            </div>
            <p className="font-normal leading-relaxed">
              {grievance.submittedResolution?.note}
            </p>
          </div>

          <div>
            <div className="block text-xs font-semibold text-slate-800 mb-1.5">
              Department Head Final Decision
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onDecisionChange("APPROVE")}
                className={`rounded-xl border p-3 text-xs text-left transition ${
                  decision === "APPROVE"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-600"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700 font-normal"
                }`}
              >
                ✅ Approve & Clear Escalation
                <div className="text-2.5 font-normal text-slate-500 mt-0.5">
                  Clear escalation flag & mark grievance as CLOSED
                </div>
              </button>

              <button
                type="button"
                onClick={() => onDecisionChange("REJECT")}
                className={`rounded-xl border p-3 text-xs text-left transition ${
                  decision === "REJECT"
                    ? "border-slate-800 bg-slate-100 text-slate-900 font-semibold ring-1 ring-slate-800"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700 font-normal"
                }`}
              >
                🔄 Request Clarification
                <div className="text-2.5 font-normal text-slate-500 mt-0.5">
                  Return to assigned staff member for revision
                </div>
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="review-feedback"
              className="block text-xs font-semibold text-slate-800 mb-1.5"
            >
              {decision === "APPROVE"
                ? "Final Approval Remarks (Logged to Audit Trail)"
                : "Clarification Directives"}
            </label>
            <textarea
              id="review-feedback"
              rows={3}
              value={feedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              placeholder={
                decision === "APPROVE"
                  ? "e.g. Resolution verified and sanctioned. All compliance requirements fulfilled."
                  : "e.g. Please verify additional bank annexures before final submission."
              }
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-xs transition ${
                decision === "APPROVE"
                  ? "bg-[#064E3B] hover:bg-emerald-900"
                  : "bg-slate-800 hover:bg-slate-900"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                {decision === "APPROVE"
                  ? "Approve Resolution & Close Grievance"
                  : "Return to Staff with Feedback"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface LeaveReassignmentModalProps {
  staff: StaffMember;
  grievances: GrievanceItem[];
  targetStaffId: string;
  note: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTargetStaffIdChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onInspect: (item: GrievanceItem) => void;
  onMarkLeave: () => void;
  staffList: StaffMember[];
}

export function DepartmentHeadLeaveReassignmentModal({
  staff,
  grievances,
  targetStaffId,
  note,
  onClose,
  onSubmit,
  onTargetStaffIdChange,
  onNoteChange,
  onInspect,
  onMarkLeave,
  staffList,
}: LeaveReassignmentModalProps) {
  const activeTickets = grievances.filter(
    (g) => g.assignedStaffId === staff.id && g.status !== "CLOSED",
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/70 text-[#064E3B]">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Officer Has Active Grievances — Reassignment Recommended
              </h3>
              <p className="text-xs font-normal text-slate-500">
                <span className="font-semibold text-slate-700">
                  {staff.name}
                </span>{" "}
                ({staff.designation}) &bull;{" "}
                <span className="font-semibold text-slate-700">
                  {activeTickets.length} Active Case(s)
                </span>
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

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <AlertTriangle className="h-4 w-4 shrink-0 text-slate-600" />
              <span>SLA Protection Advisory</span>
            </div>
            <p className="font-normal text-slate-700 leading-relaxed">
              Marking this officer on leave will freeze their availability. To
              prevent active tickets from stalling or breaching resolution SLAs,
              it is recommended to bulk-transfer these grievances to another
              available officer.
            </p>
          </div>

          <div className="space-y-2">
            <div className="block text-xs font-semibold text-slate-800">
              Currently Assigned Active Grievances ({activeTickets.length})
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeTickets.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200 text-2.75">
                        {item.ticketCode}
                      </span>
                      <PriorityBadge priority={item.priority} />
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="font-medium text-slate-900 line-clamp-1">
                      {item.title}
                    </p>
                    <span className="text-2.75 text-slate-500">
                      {item.category} &rsaquo; {item.subcategory}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <span
                      className={`text-xs font-semibold ${
                        item.slaStatus === "BREACHED"
                          ? "text-amber-800 font-semibold"
                          : item.slaStatus === "AT_RISK"
                            ? "text-amber-700"
                            : "text-slate-600"
                      }`}
                    >
                      {item.slaTimeLeft}
                    </span>
                    <button
                      type="button"
                      onClick={() => onInspect(item)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-2.75 font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <AlertCircle className="h-3 w-3 text-slate-500" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label
              htmlFor="leave-reassign-target"
              className="block text-xs font-semibold text-slate-800 mb-1.5"
            >
              Transfer Active Cases To <span className="text-rose-500">*</span>
            </label>
            <select
              id="leave-reassign-target"
              value={targetStaffId}
              onChange={(e) => onTargetStaffIdChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-hidden"
            >
              <option value="">-- Choose Replacement Officer --</option>
              {staffList
                .filter(
                  (candidate) =>
                    candidate.id !== staff.id && candidate.status === "ACTIVE",
                )
                .map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name} ({candidate.designation}) &bull;{" "}
                    {candidate.activeTickets}/{candidate.maxCapacity} active
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="leave-reassign-note"
              className="block text-xs font-semibold text-slate-800 mb-1.5"
            >
              Reassignment Note
            </label>
            <textarea
              id="leave-reassign-note"
              rows={3}
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="e.g. Temporary leave reassignment to maintain SLA turnaround."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onMarkLeave}
              className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Keep Tickets & Mark On Leave
            </button>
            <button
              type="submit"
              disabled={!targetStaffId}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition disabled:opacity-50"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Bulk Reassign & Mark Leave</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
