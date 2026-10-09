"use client";

import { AlertCircle, AlertTriangle, Check, UserPlus, X } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import type { GrievanceItem, StaffMember } from "@/types/department-head";

export interface DepartmentHeadLeaveReassignmentModalProps {
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
}: DepartmentHeadLeaveReassignmentModalProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const activeTickets = grievances.filter(
    (g) => g.assignedStaffId === staff.id && g.status !== "CLOSED",
  );
  const targetStaff = staffList.find((s) => s.id === targetStaffId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0FDFA] text-[#0F766E]">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Staff Has Active Grievances — Reassignment Recommended
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

        <form ref={formRef} onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <AlertTriangle className="h-4 w-4 shrink-0 text-slate-600" />
              <span>SLA Protection Advisory</span>
            </div>
            <p className="font-normal text-slate-700 leading-relaxed">
              Marking this staff member on leave will freeze their availability.
              To prevent active grievances from stalling or breaching resolution
              SLAs, it is recommended to bulk-transfer these grievances to
              another available staff member.
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
                      <span className="font-mono font-semibold text-emerald-800 text-2.75">
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
              <option value="">-- Choose Replacement Staff --</option>
              {staffList
                .filter(
                  (candidate) =>
                    candidate.id !== staff.id && candidate.status === "ACTIVE",
                )
                .map((candidate) => {
                  const capacity = candidate.maxCapacity || 10;
                  const available = Math.max(
                    0,
                    capacity - candidate.activeTickets,
                  );
                  const cannotAcceptAll =
                    candidate.activeTickets + staff.activeTickets > capacity;
                  return (
                    <option
                      key={candidate.id}
                      value={candidate.id}
                      disabled={cannotAcceptAll}
                    >
                      {candidate.name} ({candidate.designation}) &bull; Active
                      Workload: {candidate.activeTickets} / {capacity}{" "}
                      (Available Capacity: {available})
                      {cannotAcceptAll ? " [EXCEEDS 10 LIMIT]" : ""}
                    </option>
                  );
                })}
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
              type="button"
              disabled={!targetStaffId}
              onClick={() => {
                if (!targetStaffId) return;
                setShowConfirmModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition disabled:opacity-50 cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Bulk Reassign &amp; Mark Leave</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && targetStaff && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-left space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Bulk Reassignment &amp; Leave
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to reassign all{" "}
                  <strong>{activeTickets.length} active grievance(s)</strong>{" "}
                  from <strong>{staff.name}</strong> to{" "}
                  <strong>{targetStaff.name}</strong>?
                </p>
              </div>
            </div>

            {/* Quick summary recap */}
            <div className="rounded-xl bg-slate-50 p-3.5 text-xs space-y-2 border border-slate-100">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium text-slate-500">
                  Staff Taking Leave:
                </span>
                <span className="font-semibold text-slate-800">
                  {staff.name} ({staff.designation})
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium text-slate-500">
                  Cases to Transfer:
                </span>
                <span className="font-semibold text-amber-800">
                  {activeTickets.length} active grievance(s)
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 border-t border-slate-200/60 pt-1.5">
                <span className="font-medium text-slate-500">
                  New Assignee:
                </span>
                <span className="font-bold text-[#0F766E]">
                  {targetStaff.name} ({targetStaff.designation})
                </span>
              </div>
              {note.trim() && (
                <div className="pt-1">
                  <span className="font-medium text-slate-500 block mb-0.5">
                    Reassignment Note:
                  </span>
                  <p className="text-slate-800 line-clamp-2 italic font-normal bg-white p-2 rounded-lg border border-slate-200/60">
                    {note.trim()}
                  </p>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              This action will update all active case ownerships, log entries in
              the audit trail, and mark {staff.name} as On Leave.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Review Again
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  if (formRef.current) {
                    formRef.current.requestSubmit();
                  } else {
                    onSubmit({
                      preventDefault: () => {},
                    } as FormEvent<HTMLFormElement>);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Yes, Execute Reassignment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
