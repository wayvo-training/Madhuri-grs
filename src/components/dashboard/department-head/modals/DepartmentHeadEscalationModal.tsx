"use client";

import {
  AlertCircle,
  CalendarPlus,
  Clock,
  FileText,
  Send,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
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

const BOTTLENECK_OPTIONS: {
  value: EscalationBottleneck;
  title: string;
  description: string;
}[] = [
  {
    value: "STAFF_CAPACITY",
    title: "Staff Capacity / Absence",
    description:
      "Assigned Staff is overloaded, unavailable, or on approved leave.",
  },
  {
    value: "CROSS_DEPT",
    title: "Cross-Department Dependency",
    description:
      "Progress is waiting on another involved department or dependency.",
  },
  {
    value: "MISSING_DOCS",
    title: "Incomplete Information / Documentation",
    description:
      "Required information or supporting documents are unavailable or insufficient.",
  },
  {
    value: "COMPLEX_INVESTIGATION",
    title: "Complex Investigation Required",
    description:
      "The grievance requires additional investigation, verification, or specialized review.",
  },
  {
    value: "OTHER_CONSTRAINT",
    title: "Other Operational Constraint",
    description: "Another operational issue is preventing timely resolution.",
  },
];

const INTERVENTION_OPTIONS: {
  value: EscalationInterventionType;
  title: string;
  purpose: string;
  icon: typeof ShieldAlert;
}[] = [
  {
    value: "MONITOR",
    title: "Continue Monitoring",
    purpose:
      "Continue oversight while the assigned Staff proceeds with the current plan.",
    icon: ShieldCheck,
  },
  {
    value: "REQUEST_STATUS_UPDATE",
    title: "Request Immediate Status Update",
    purpose:
      "Require the assigned Staff to provide current progress, completed actions, and next steps.",
    icon: Clock,
  },
  {
    value: "CROSS_DEPT",
    title: "Add Supporting Staff / Department",
    purpose:
      "Add additional resources to increase investigation or processing capacity.",
    icon: Users,
  },
  {
    value: "REASSIGN",
    title: "Change Assignment",
    purpose:
      "Open Smart Assignment to reallocate case to an optimal Staff member.",
    icon: UserCheck,
  },
  {
    value: "NOTIFY_STAFF",
    title: "Add Direction",
    purpose:
      "Provide specific operational direction to the assigned Staff for the next action.",
    icon: AlertCircle,
  },
  {
    value: "ASSUME_RESOLUTION_AUTHORITY",
    title: "Assume Resolution Authority",
    purpose:
      "Department Head takes responsibility for reviewing the case and submitting the final resolution.",
    icon: ShieldAlert,
  },
  {
    value: "REQUEST_ADDITIONAL_INFO",
    title: "Request Additional Information",
    purpose:
      "Request missing information or supporting documentation required to continue processing.",
    icon: FileText,
  },
  {
    value: "EXTEND_SLA",
    title: "Extend SLA with Justification",
    purpose:
      "Extend the resolution deadline only when formally permitted by the configured SLA policy.",
    icon: CalendarPlus,
  },
];

const EXTENSION_PRESETS = [
  { label: "+6 Hours", hours: 6 },
  { label: "+12 Hours", hours: 12 },
  { label: "+24 Hours (1 Day)", hours: 24 },
  { label: "+48 Hours (2 Days)", hours: 48 },
  { label: "+72 Hours (3 Days)", hours: 72 },
  { label: "+120 Hours (5 Days)", hours: 120 },
];

export function DepartmentHeadEscalationModal({
  grievance,
  bottleneck,
  interventionType,
  targetDept,
  targetStaffId = "",
  bottleneckExplanation = "",
  note,
  extensionHours = 24,
  availableDepartments = [],
  staffList = [],
  currentDepartmentName,
  onClose,
  onSubmit,
  onBottleneckChange,
  onInterventionTypeChange,
  onTargetDeptChange,
  onTargetStaffIdChange,
  onBottleneckExplanationChange,
  onNoteChange,
  onExtensionHoursChange,
  onNavigateToSmartAssignment,
}: DepartmentHeadEscalationModalProps) {
  const eligibleDepartments = availableDepartments.filter(
    (d) =>
      d.name !== currentDepartmentName &&
      !grievance.collaboratingDepartments?.includes(d.name),
  );

  const parsedDue = grievance.slaDeadline
    ? new Date(grievance.slaDeadline)
    : null;
  const currentDueDate =
    parsedDue && !Number.isNaN(parsedDue.getTime()) ? parsedDue : new Date();
  const baseTime =
    currentDueDate.getTime() > Date.now()
      ? currentDueDate.getTime()
      : Date.now();
  const projectedDueDate = new Date(baseTime + extensionHours * 3600 * 1000);

  const getPlaceholderText = () => {
    switch (interventionType) {
      case "ASSUME_RESOLUTION_AUTHORITY":
      case "DIRECT_OVERSIGHT":
        return "State justification for assuming resolution authority and executive directives for the case file...";
      case "EXTEND_SLA":
        return "Specify clear regulatory/investigative justification for granting this SLA extension (e.g. Awaiting external forensic analysis, pending employee document verification)...";
      case "REQUEST_STATUS_UPDATE":
        return "Specify what specific status or investigation report is required from the assigned officer within 4 hours...";
      case "CROSS_DEPT":
        return "Detail the specific inter-departmental collaboration needed from the supporting department...";
      case "NOTIFY_STAFF":
        return "Provide specific operational direction to the assigned Staff for the next action...";
      case "REQUEST_ADDITIONAL_INFO":
        return "List the specific missing documents or information required from the submitter or department...";
      case "MONITOR":
        return "Note supervisory observations and planned follow-up checkpoints...";
      case "REASSIGN":
      default:
        return "Explain the operational bottleneck resolved and specific directives given to staff...";
    }
  };

  if (grievance.status === "CLOSED" || grievance.status === "RESOLVED") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
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

        <form onSubmit={onSubmit} className="flex flex-col flex-1 min-h-0">
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

            {/* Root Operational Bottleneck */}
            <div>
              <div className="block text-xs font-semibold text-slate-900 mb-1.5">
                Identify Root Operational Bottleneck{" "}
                <span className="text-rose-500">*</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BOTTLENECK_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onBottleneckChange(opt.value)}
                    className={`rounded-xl border p-2.5 text-left text-xs transition cursor-pointer ${
                      bottleneck === opt.value
                        ? "border-[#0F766E] bg-[#F0FDFA] text-[#0F766E] font-semibold ring-1 ring-[#0F766E]"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="font-semibold">{opt.title}</div>
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5 leading-snug">
                      {opt.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* Other Operational Constraint Explanation */}
              {bottleneck === "OTHER_CONSTRAINT" && (
                <div className="mt-2.5">
                  <label
                    htmlFor="escalation-bottleneck-explanation"
                    className="block text-xs font-semibold text-slate-900 mb-1"
                  >
                    Explain Operational Constraint{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="escalation-bottleneck-explanation"
                    type="text"
                    required
                    value={bottleneckExplanation}
                    onChange={(e) =>
                      onBottleneckExplanationChange?.(e.target.value)
                    }
                    placeholder="Describe the specific operational constraint preventing timely resolution..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#0F766E] focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Choose Corrective Intervention Action */}
            <div>
              <div className="block text-xs font-semibold text-slate-900 mb-1.5">
                Choose Corrective Intervention Action{" "}
                <span className="text-rose-500">*</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {INTERVENTION_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = interventionType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        if (
                          opt.value === "REASSIGN" &&
                          onNavigateToSmartAssignment
                        ) {
                          onNavigateToSmartAssignment(grievance);
                          return;
                        }
                        onInterventionTypeChange(opt.value);
                      }}
                      className={`flex flex-col rounded-xl border p-3 text-left transition cursor-pointer ${
                        isSelected
                          ? "border-[#0F766E] bg-[#F0FDFA] text-[#0F766E] shadow-2xs ring-1 ring-[#0F766E]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${isSelected ? "text-[#0F766E]" : "text-slate-500"}`}
                          />
                          <span>{opt.title}</span>
                        </div>
                        {opt.value === "REASSIGN" && (
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md border border-teal-200">
                            Smart &rarr;
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-normal text-slate-500 mt-1 leading-snug">
                        {opt.purpose}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Specific Sub-Panels */}

            {/* 1. EXTEND SLA Sub-Panel */}
            {interventionType === "EXTEND_SLA" && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-teal-950 flex items-center gap-1.5">
                    <CalendarPlus className="h-4 w-4 text-teal-700" />
                    Select Extension Duration
                  </span>
                  <span className="text-[11px] font-medium text-teal-800">
                    SLA Reset & Extension
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EXTENSION_PRESETS.map((preset) => (
                    <button
                      key={preset.hours}
                      type="button"
                      onClick={() => onExtensionHoursChange?.(preset.hours)}
                      className={`rounded-lg border px-2.5 py-2 text-center text-xs transition cursor-pointer ${
                        extensionHours === preset.hours
                          ? "border-[#0F766E] bg-[#0F766E] text-white font-semibold shadow-xs"
                          : "border-teal-200 bg-white hover:bg-teal-100/50 text-teal-900 font-medium"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="rounded-lg border border-teal-200/80 bg-white p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Current Resolution Due:</span>
                    <span className="font-medium text-slate-800">
                      {currentDueDate.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-teal-950 font-semibold border-t border-slate-100 pt-1">
                    <span>Projected Extended Deadline:</span>
                    <span className="text-[#0F766E]">
                      {projectedDueDate.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 pt-1 leading-snug">
                    * Approving will extend the deadline by{" "}
                    <strong>+{extensionHours}h</strong>, recalculate SLA
                    consumption back under safe threshold, and clear automated
                    breach flags.
                  </p>
                </div>
              </div>
            )}

            {/* 2. ASSUME RESOLUTION AUTHORITY Sub-Panel */}
            {(interventionType === "ASSUME_RESOLUTION_AUTHORITY" ||
              interventionType === "DIRECT_OVERSIGHT") && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs text-teal-950 flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-teal-700 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-teal-950">
                    Assume Resolution Authority
                  </div>
                  <div className="text-teal-800 text-[11px] mt-0.5 leading-snug">
                    Department Head takes responsibility for reviewing the case
                    and submitting the final resolution. The assigned Staff will
                    be notified that resolution authority has been assumed. All
                    existing Staff investigation findings, evidence, notes, and
                    activity will be preserved. The{" "}
                    <strong>Submit Resolution</strong> action will become active
                    for you after confirming this intervention.
                  </div>
                </div>
              </div>
            )}

            {/* 3. REQUEST STATUS UPDATE Sub-Panel */}
            {interventionType === "REQUEST_STATUS_UPDATE" && (
              <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-950 flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-sky-950">
                    Immediate Progress Requirement
                  </div>
                  <div className="text-sky-800 text-[11px] mt-0.5 leading-snug">
                    An urgent operational prompt will be dispatched to{" "}
                    <strong>
                      {grievance.assignedStaffName || "assigned staff"}
                    </strong>{" "}
                    mandating an immediate investigation update and next planned
                    steps within 4 hours.
                  </div>
                </div>
              </div>
            )}

            {/* 4. REASSIGN Sub-Panel */}
            {interventionType === "REASSIGN" && (
              <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <UserCheck className="h-4 w-4 text-teal-700 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-xs text-teal-950">
                      Smart Staff Assignment
                    </div>
                    <p className="text-[11px] text-teal-800 mt-0.5 leading-snug">
                      Reassign this case to an optimal staff officer using
                      intelligent workload, category specialization, and
                      performance matching.
                    </p>
                  </div>
                </div>
                {onNavigateToSmartAssignment && (
                  <button
                    type="button"
                    onClick={() => onNavigateToSmartAssignment(grievance)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition cursor-pointer"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Open Smart Assignment &rarr;</span>
                  </button>
                )}
              </div>
            )}

            {/* 5. CROSS DEPT Sub-Panel */}
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
                  required
                  value={targetDept}
                  onChange={(e) => onTargetDeptChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#0F766E] focus:outline-hidden"
                >
                  <option value="">
                    -- Select a Collaborating Department --
                  </option>
                  {eligibleDepartments.length === 0 ? (
                    <option value="" disabled>
                      No other active departments available
                    </option>
                  ) : (
                    eligibleDepartments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {/* 6. ADD DIRECTION Sub-Panel */}
            {interventionType === "NOTIFY_STAFF" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-900 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-[#0F766E] mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900">
                    Add Operational Direction
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5 leading-snug">
                    Provide specific operational direction and instructions to{" "}
                    <strong>
                      {grievance.assignedStaffName || "assigned staff"}
                    </strong>{" "}
                    for the next investigative steps.
                  </div>
                </div>
              </div>
            )}

            {/* 7. REQUEST ADDITIONAL INFO Sub-Panel */}
            {interventionType === "REQUEST_ADDITIONAL_INFO" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-950 flex items-start gap-2.5">
                <FileText className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-amber-950">
                    Request Additional Information
                  </div>
                  <div className="text-amber-800 text-[11px] mt-0.5 leading-snug">
                    Request missing information or supporting documentation
                    required to continue processing and investigation.
                  </div>
                </div>
              </div>
            )}

            {/* 8. MONITOR Sub-Panel */}
            {interventionType === "MONITOR" && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-900 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900">
                    Continue Supervisory Monitoring
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5 leading-snug">
                    Maintain oversight while assigned Staff proceeds with the
                    current investigation plan.
                  </div>
                </div>
              </div>
            )}

            {/* Directive Textarea */}
            <div>
              <label
                htmlFor="escalation-action-note"
                className="block text-xs font-semibold text-slate-900 mb-1.5"
              >
                Intervention Directive &amp; Justification (Logged to Audit
                Trail) <span className="text-rose-500">*</span>
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
                type="submit"
                disabled={
                  (interventionType === "CROSS_DEPT" && !targetDept) ||
                  (interventionType === "REASSIGN" &&
                    staffList.length > 0 &&
                    !targetStaffId) ||
                  (bottleneck === "OTHER_CONSTRAINT" &&
                    !bottleneckExplanation?.trim()) ||
                  !note.trim()
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Confirm &amp; Execute Intervention &rarr;</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
