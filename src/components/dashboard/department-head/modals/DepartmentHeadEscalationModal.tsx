"use client";

import { AlertCircle, Check, ShieldAlert, Users, X } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { PriorityBadge } from "@/components/dashboard/badges";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatEscalationNotice } from "@/lib/department-head/utils";
import type {
  EscalationBottleneck,
  EscalationInterventionType,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";

export interface DepartmentHeadEscalationModalProps {
  grievance: GrievanceItem;
  bottleneck: EscalationBottleneck;
  interventionType: EscalationInterventionType;
  targetDept: string;
  targetStaffId?: string;
  bottleneckExplanation?: string;
  note: string;
  extensionHours?: number;
  availableDepartments?: { id: string; name: string }[];
  staffList?: StaffMember[];
  currentDepartmentName?: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBottleneckChange: (value: EscalationBottleneck) => void;
  onInterventionTypeChange: (value: EscalationInterventionType) => void;
  onTargetDeptChange: (value: string) => void;
  onTargetStaffIdChange?: (value: string) => void;
  onBottleneckExplanationChange?: (value: string) => void;
  onNoteChange: (value: string) => void;
  onExtensionHoursChange?: (hours: number) => void;
  onNavigateToSmartAssignment?: (grievance: GrievanceItem) => void;
}

export function DepartmentHeadEscalationModal({
  grievance,
  interventionType,
  targetStaffId = "",
  note,
  staffList = [],
  onClose,
  onSubmit,
  onInterventionTypeChange,
  onTargetStaffIdChange,
  onNoteChange,
}: DepartmentHeadEscalationModalProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Filter staff list to only include active other staff members (exclude currently assigned staff)
  const eligibleStaffList = staffList.filter(
    (s) =>
      s.status === "ACTIVE" &&
      s.name !== grievance.assignedStaffName &&
      s.id !== grievance.assignedStaffId,
  );

  const selectedStaffMember = eligibleStaffList.find(
    (s) => s.id === targetStaffId,
  );

  const isCoAssign = interventionType === "CO_ASSIGN";

  // Active intervention must be one of the two approved choices
  const activeChoice: "ASSUME_RESOLUTION_AUTHORITY" | "CO_ASSIGN" = isCoAssign
    ? "CO_ASSIGN"
    : "ASSUME_RESOLUTION_AUTHORITY";

  const handleSelectChoice = (
    choice: "ASSUME_RESOLUTION_AUTHORITY" | "CO_ASSIGN",
  ) => {
    onInterventionTypeChange(choice);
    if (choice === "ASSUME_RESOLUTION_AUTHORITY" && onTargetStaffIdChange) {
      onTargetStaffIdChange("");
    }
  };

  const getPlaceholderText = () => {
    if (activeChoice === "CO_ASSIGN") {
      return "Provide specific instructions and work-sharing directives for how both staff members will coordinate to complete the investigation...";
    }
    return "State justification for assuming direct authority to complete the investigation and submit department resolution...";
  };

  const isFormValid = Boolean(
    note.trim() &&
      (activeChoice === "ASSUME_RESOLUTION_AUTHORITY" ||
        (activeChoice === "CO_ASSIGN" && targetStaffId)),
  );

  if (grievance.status === "CLOSED" || grievance.status === "RESOLVED") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-col w-full max-w-2xl max-h-[92vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Department Head SLA Intervention
              </h3>
              <p className="text-xs font-normal text-slate-500">
                Grievance{" "}
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
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
            {/* Grievance Header Banner */}
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
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600 border-t border-amber-200/60">
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

            {/* Approved Intervention Options */}
            <div>
              <div className="block text-xs font-semibold text-slate-900 mb-1.5">
                Select Escalation Intervention Option{" "}
                <span className="text-rose-500">*</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Assume Resolution Authority */}
                <button
                  type="button"
                  onClick={() =>
                    handleSelectChoice("ASSUME_RESOLUTION_AUTHORITY")
                  }
                  className={`flex flex-col rounded-xl border p-3.5 text-left transition cursor-pointer ${
                    activeChoice === "ASSUME_RESOLUTION_AUTHORITY"
                      ? "border-[#0F766E] bg-[#F0FDFA] text-[#0F766E] shadow-2xs ring-2 ring-[#0F766E]/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                      <ShieldAlert
                        className={`h-4 w-4 shrink-0 ${activeChoice === "ASSUME_RESOLUTION_AUTHORITY" ? "text-[#0F766E]" : "text-slate-500"}`}
                      />
                      <span>Assume Direct Authority</span>
                    </div>
                    <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      Take Authority
                    </span>
                  </div>
                  <p className="text-[11px] font-normal text-slate-600 mt-1 leading-snug">
                    Department Head assumes direct authority to complete the
                    investigation and submit department findings or final
                    resolution directly.
                  </p>
                </button>

                {/* Option 2: Co-Assign Secondary Staff */}
                <button
                  type="button"
                  onClick={() => handleSelectChoice("CO_ASSIGN")}
                  className={`flex flex-col rounded-xl border p-3.5 text-left transition cursor-pointer ${
                    activeChoice === "CO_ASSIGN"
                      ? "border-[#0F766E] bg-[#F0FDFA] text-[#0F766E] shadow-2xs ring-2 ring-[#0F766E]/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                      <Users
                        className={`h-4 w-4 shrink-0 ${activeChoice === "CO_ASSIGN" ? "text-[#0F766E]" : "text-slate-500"}`}
                      />
                      <span>Assign Staff to Assist</span>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      2 People Working
                    </span>
                  </div>
                  <p className="text-[11px] font-normal text-slate-600 mt-1 leading-snug">
                    Assign another staff member from your department to assist
                    and work together on the same grievance to expedite
                    resolution.
                  </p>
                </button>
              </div>
            </div>

            {/* Secondary Staff Selection Panel (When Co-Assign is Selected) */}
            {activeChoice === "CO_ASSIGN" && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-blue-700 mt-0.5 shrink-0" />
                  <div>
                    <label
                      htmlFor="co-assign-staff-select"
                      className="block text-xs font-semibold text-blue-950"
                    >
                      Select Department Staff Member to Co-Assign{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      Choose a second officer from your department who will
                      collaborate alongside{" "}
                      <strong>
                        {grievance.assignedStaffName || "current staff"}
                      </strong>
                      .
                    </p>
                  </div>
                </div>

                <Select
                  value={targetStaffId}
                  onValueChange={(val) => {
                    if (val && val !== "NONE" && onTargetStaffIdChange) {
                      onTargetStaffIdChange(val);
                    }
                  }}
                >
                  <SelectTrigger
                    id="co-assign-staff-select"
                    className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-700 focus:outline-hidden"
                  >
                    <SelectValue placeholder="-- Select a staff member to assist --">
                      {selectedStaffMember
                        ? `${selectedStaffMember.name} (${selectedStaffMember.activeTickets || 0} active tickets)`
                        : "-- Select a staff member to assist --"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="z-60 bg-white border border-slate-200 shadow-xl max-h-56">
                    {eligibleStaffList.length === 0 ? (
                      <SelectItem value="NONE" disabled className="text-xs">
                        No other available staff in your department
                      </SelectItem>
                    ) : (
                      eligibleStaffList.map((staff) => (
                        <SelectItem
                          key={staff.id}
                          value={staff.id}
                          className="text-xs cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full gap-4">
                            <span className="font-medium text-slate-900">
                              {staff.name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {staff.activeTickets || 0} active tickets
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Directive Textarea */}
            <div>
              <label
                htmlFor="escalation-action-note"
                className="block text-xs font-semibold text-slate-900 mb-1.5"
              >
                Directive &amp; Operational Instructions (Logged to Audit Trail){" "}
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="escalation-action-note"
                required
                rows={3}
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder={getPlaceholderText()}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:border-[#0F766E] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 bg-slate-50/90 shrink-0 gap-2">
            <span className="text-[11px] text-slate-500">
              Intervention will be recorded in the immutable audit trail and
              resolve pending escalation.
            </span>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isFormValid) return;
                  setShowConfirmModal(true);
                }}
                disabled={!isFormValid}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition disabled:opacity-50 cursor-pointer"
              >
                <span>Execute Intervention &rarr;</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Intervention Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-left space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Executive Intervention
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {activeChoice === "CO_ASSIGN"
                    ? `Assign ${selectedStaffMember?.name || "secondary staff"} to assist ${grievance.assignedStaffName || "assigned staff"} on ${grievance.ticketCode}? Both staff members will collaborate on this case.`
                    : `Assume direct resolution authority on ${grievance.ticketCode}? You will be granted authority to submit findings/resolution directly.`}
                </p>
              </div>
            </div>

            {/* Quick summary recap */}
            <div className="rounded-xl bg-slate-50 p-3.5 text-xs space-y-2 border border-slate-100">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-medium text-slate-500">Action:</span>
                <span className="font-semibold text-slate-900">
                  {activeChoice === "CO_ASSIGN"
                    ? "Assign Secondary Staff to Assist"
                    : "Assume Authority to Submit Resolution"}
                </span>
              </div>
              {activeChoice === "CO_ASSIGN" && selectedStaffMember && (
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-medium text-slate-500">
                    Co-Assigned Officer:
                  </span>
                  <span className="font-semibold text-blue-700">
                    {selectedStaffMember.name}
                  </span>
                </div>
              )}
              <div>
                <span className="font-medium text-slate-500 block mb-0.5">
                  Directive Note:
                </span>
                <p className="text-slate-800 line-clamp-2 italic font-normal bg-white p-2 rounded-lg border border-slate-200/60">
                  {note}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              This intervention will be recorded in the immutable audit trail
              and resolve the pending escalation alert.
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
                <span>Yes, Execute Intervention</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
