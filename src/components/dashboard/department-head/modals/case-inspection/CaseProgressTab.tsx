"use client";

import { ArrowDownUp, Check, Clock, User, UserPlus } from "lucide-react";
import { useState } from "react";
import {
  formatAuditActionTitle,
  formatAuditLogContent,
} from "@/lib/department-head/utils";
import { buildGmailComposeUrl } from "@/lib/email";
import type {
  CaseProgressData,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";

interface CaseProgressTabProps {
  currentGrievance: GrievanceItem;
  caseProgressData: CaseProgressData | null;
  staffList: StaffMember[];
  currentHodEmail?: string;
  hodEmail?: string;
  onAssignClick: (item: GrievanceItem) => void;
}

export function CaseProgressTab({
  currentGrievance,
  caseProgressData,
  staffList,
  currentHodEmail,
  hodEmail,
  onAssignClick,
}: CaseProgressTabProps) {
  const [timelineSort, setTimelineSort] = useState<"desc" | "asc">("desc");

  const st = currentGrievance.status;
  const isAssigned =
    !!currentGrievance.assignedStaffName ||
    !!caseProgressData?.assignment?.isAssigned;

  const isCaseReopened =
    currentGrievance.isReopened ||
    currentGrievance.status === "REOPENED" ||
    (currentGrievance.reopenCount || 0) > 0;

  const fallbackStageNumber =
    st === "CLOSED" || st === "RESOLVED"
      ? 4
      : st === "UNDER_REVIEW"
        ? 4
        : st === "IN_PROGRESS" || st === "ESCALATED" || st === "REOPENED"
          ? 3
          : isAssigned || st === "ASSIGNED"
            ? 2
            : 1;

  const stageNumber =
    caseProgressData?.currentStage?.stageNumber ?? fallbackStageNumber;

  const currentStageLabel =
    caseProgressData?.currentStage?.label ||
    (st === "CLOSED"
      ? "Grievance Closed"
      : st === "UNDER_REVIEW"
        ? "Resolution Submitted — Pending HOD Approval"
        : st === "ESCALATED"
          ? isCaseReopened
            ? "Reopened — Escalated for Intervention"
            : "Under Active Investigation (Escalated)"
          : st === "IN_PROGRESS" || st === "REOPENED"
            ? isCaseReopened
              ? "Reopened — Under Active Investigation"
              : "Under Active Investigation"
            : isAssigned || st === "ASSIGNED"
              ? isCaseReopened
                ? `Reopened — Assigned to ${currentGrievance.assignedStaffName || "Officer"}`
                : `Assigned to ${currentGrievance.assignedStaffName || "Officer"}`
              : "Pending Staff Assignment");

  const steps = caseProgressData?.currentStage?.progressSteps || [
    {
      key: "SUBMITTED",
      label: "Submitted",
      isComplete: true,
      isCurrent: stageNumber === 1,
    },
    {
      key: "ASSIGNED",
      label: "Assigned",
      isComplete: stageNumber >= 2,
      isCurrent: stageNumber === 2,
    },
    {
      key: "INVESTIGATION",
      label: "Investigation",
      isComplete: stageNumber >= 3,
      isCurrent: stageNumber === 3,
    },
    {
      key: "RESOLUTION",
      label: st === "CLOSED" ? "Grievance Closed" : "Resolution",
      isComplete: stageNumber >= 4,
      isCurrent: stageNumber === 4,
    },
  ];

  const slaPercent =
    caseProgressData?.sla?.consumptionPercent ??
    currentGrievance.slaConsumptionPercent ??
    (currentGrievance.slaStatus === "BREACHED"
      ? 100
      : currentGrievance.slaStatus === "AT_RISK"
        ? 80
        : 40);

  const slaTimeRemaining =
    caseProgressData?.sla?.timeRemaining || currentGrievance.slaTimeLeft;

  const slaTargetDue =
    caseProgressData?.sla?.dueAt || currentGrievance.slaDeadline;

  const slaState =
    caseProgressData?.sla?.state ||
    (currentGrievance.slaStatus === "BREACHED"
      ? "BREACHED"
      : currentGrievance.slaStatus === "AT_RISK"
        ? "SLA_AT_RISK"
        : "ON_TRACK");

  const slaStateLabel =
    caseProgressData?.sla?.stateLabel ||
    (currentGrievance.slaStatus === "BREACHED"
      ? "SLA Breached"
      : currentGrievance.slaStatus === "AT_RISK"
        ? "Approaching SLA"
        : "Within SLA");

  const assignedStaff = staffList.find(
    (s: StaffMember) => s.id === currentGrievance.assignedStaffId,
  );
  const officerName =
    caseProgressData?.assignment?.staffName ||
    currentGrievance.assignedStaffName ||
    assignedStaff?.name ||
    null;
  const officerDesignation =
    caseProgressData?.assignment?.designation ||
    assignedStaff?.designation ||
    "Investigating Officer";
  const officerEmail =
    caseProgressData?.assignment?.email || assignedStaff?.email || null;
  const assignedTimestamp =
    caseProgressData?.assignment?.assignedAtRelative ||
    caseProgressData?.assignment?.assignedAt ||
    (currentGrievance.assignedStaffName ? "Assigned" : null);
  const assignmentStatus =
    caseProgressData?.assignment?.status ||
    (currentGrievance.assignedStaffName ? "In Progress" : "Pending");

  const timelineEvents = [
    ...(caseProgressData?.timeline && caseProgressData.timeline.length > 0
      ? caseProgressData.timeline
      : (currentGrievance.auditTrail || []).map((log, idx) => ({
          id: log.id || String(idx),
          timestamp: log.timestamp,
          relativeTime: log.timestamp,
          title: formatAuditActionTitle(log.action),
          description: formatAuditLogContent(log.action, log.details),
          actor: log.actor,
        }))),
  ];

  if (timelineSort === "desc") {
    timelineEvents.reverse();
  }

  return (
    <>
      {/* Current Progress Stepper */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 space-y-2 shadow-2xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
            Current Progress
          </span>
          <span className="text-xs font-semibold text-emerald-800 text-right truncate max-w-full sm:max-w-[70%]">
            Stage {stageNumber} of {steps.length}: {currentStageLabel}
          </span>
        </div>

        <div className="relative flex items-start justify-between pt-2 pb-10 px-3 sm:px-6">
          <div className="absolute left-[26px] sm:left-[38px] right-[26px] sm:right-[38px] top-5.5 h-0.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, ((stageNumber - 1) / (steps.length - 1)) * 100))}%`,
              }}
            />
          </div>

          {steps.map((step, idx) => {
            const isPastOrCurrent = idx < stageNumber;
            const isCurrent = idx === stageNumber - 1;
            return (
              <div
                key={step.key}
                className="relative z-10 flex flex-col items-center w-7"
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold transition ${
                    isPastOrCurrent
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-2xs"
                      : "border-slate-300 bg-white text-slate-400"
                  } ${isCurrent ? "ring-3 ring-emerald-100" : ""}`}
                >
                  {isPastOrCurrent ? (
                    <Check className="h-3.5 w-3.5 stroke-3" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <div className="absolute top-full mt-1.5 w-[90px] sm:w-[110px] left-1/2 -translate-x-1/2 flex justify-center">
                  <span
                    className={`text-[11px] sm:text-xs text-center line-clamp-2 leading-tight ${
                      isPastOrCurrent
                        ? "font-semibold text-slate-900"
                        : "font-medium text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs text-slate-500 border-t border-slate-100 min-w-0">
          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-full">
            Last Activity:{" "}
            <strong className="text-slate-800 font-semibold">
              {caseProgressData?.latestActivity ||
                (currentGrievance.assignedStaffName
                  ? `Assigned to ${currentGrievance.assignedStaffName}`
                  : "Grievance registered in portal")}
            </strong>
          </span>
        </div>
      </div>

      {/* Two-Column SLA & Assignment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: SLA Status */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-800" />
              SLA Status
            </span>
            <span className="text-xs font-bold text-slate-900 uppercase">
              {slaStateLabel}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">SLA Consumed</span>
              <span className="text-slate-900 font-semibold">
                {slaPercent}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  slaPercent >= 90 || slaState === "BREACHED"
                    ? "bg-rose-500"
                    : slaPercent >= 70
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                }`}
                style={{
                  width: `${Math.min(slaPercent, 100)}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Time Remaining:</span>
              <span className="font-semibold text-slate-800">
                {slaTimeRemaining}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Target Due Date:</span>
              <span className="font-medium text-slate-700">{slaTargetDue}</span>
            </div>
          </div>
        </div>

        {/* Right: Assignment */}
        {caseProgressData?.departmentsInvolved &&
        caseProgressData.departmentsInvolved.length > 1 ? (
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 space-y-2 shadow-2xs col-span-1 max-h-56 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-emerald-800" />
                Departments Involved
              </span>
            </div>
            <div className="space-y-3">
              {caseProgressData.departmentsInvolved.map((dept) => (
                <div key={dept.id} className="text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{dept.departmentName}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase ${
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
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Staff:</span>
                    <span className="font-medium text-slate-700">
                      {dept.assignedStaff || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Status:</span>
                    <span className="font-medium text-slate-700">
                      {dept.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-emerald-800" />
                Assignment
              </span>
              <span className="text-xs text-slate-500">
                Status:{" "}
                <strong className="font-semibold text-slate-800">
                  {assignmentStatus}
                </strong>
              </span>
            </div>

            {officerName ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    {officerName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 text-xs truncate">
                      {officerName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {officerDesignation}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-100">
                  {assignedTimestamp && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Assigned:</span>
                      <span className="font-medium text-slate-700">
                        {assignedTimestamp}
                      </span>
                    </div>
                  )}
                  {officerEmail && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Email:</span>
                      {officerEmail.trim().toLowerCase() ===
                      (currentHodEmail || hodEmail || "")
                        .trim()
                        .toLowerCase() ? (
                        <span
                          className="text-amber-800 font-medium truncate max-w-[65%]"
                          title="This case is currently recorded under your account."
                        >
                          {officerEmail} (You — HOD)
                        </span>
                      ) : (
                        <a
                          href={buildGmailComposeUrl({
                            to: officerEmail,
                            authuser: currentHodEmail || hodEmail || undefined,
                            subject: `Regarding Case ${currentGrievance.ticketCode}: ${currentGrievance.title}`,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline font-medium truncate max-w-[65%]"
                          title={`Email officer via Gmail from ${currentHodEmail || hodEmail || "Department Head"}`}
                        >
                          {officerEmail}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-3 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  No officer currently assigned to this ticket.
                </p>
                <button
                  type="button"
                  onClick={() => onAssignClick(currentGrievance)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#115E59] transition cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Assign Officer Now</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
