import React from "react";

export function CaseFileInspectionDialog(props: any) {
  return (
    <>
      {/* CASE FILE INSPECTION DIALOG (Centered Popover Review)                     */}
      {/* ========================================================================= */}
      {selectedCaseFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Popover Header (Fixed at top) */}
            <div className="flex flex-col border-b border-slate-200/90 bg-slate-50/70 px-6 py-4 shrink-0 gap-3">
              {/* Row 1: Back to SLA Monitoring & Ticket Code + Close */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedCaseFile(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-900 transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to SLA Monitoring</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#064E3B] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/80">
                    {selectedCaseFile.ticketCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCaseFile(null)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
                    title="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Row 2: Title, Status Pill, Category & Priority */}
              <div className="flex flex-wrap items-start justify-between gap-3 pt-0.5">
                <div className="space-y-1 max-w-[70%]">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-1">
                    {selectedCaseFile.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span>{selectedCaseFile.category}</span>
                    <span className="text-slate-300">•</span>
                    <span>{selectedCaseFile.subcategory}</span>
                    <span className="text-slate-300">•</span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        selectedCaseFile.priority === "CRITICAL"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : selectedCaseFile.priority === "HIGH"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {selectedCaseFile.priority} Priority
                    </span>
                  </div>
                </div>

                {/* Status Pill */}
                <div>
                  {(caseProgressData?.sla?.state ||
                    selectedCaseFile.slaStatus) === "BREACHED" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                      SLA BREACHED
                    </span>
                  ) : (caseProgressData?.sla?.state ||
                      selectedCaseFile.slaStatus) === "SLA_AT_RISK" ||
                    selectedCaseFile.slaStatus === "AT_RISK" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      SLA AT RISK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      ON TRACK
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs inside Dialog (Fixed) */}
            <div className="flex items-center border-b border-slate-200 px-6 bg-white gap-6 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setCaseDrawerTab("progress")}
                className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                  caseDrawerTab === "progress"
                    ? "border-[#064E3B] text-[#064E3B]"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>Progress & SLA</span>
                {caseProgressLoading && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setCaseDrawerTab("statement")}
                className={`py-3 border-b-2 transition ${
                  caseDrawerTab === "statement"
                    ? "border-[#064E3B] text-[#064E3B]"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                Statement & Proofs
              </button>
              <button
                type="button"
                onClick={() => setCaseDrawerTab("notes")}
                className={`py-3 border-b-2 transition inline-flex items-center gap-1.5 ${
                  caseDrawerTab === "notes"
                    ? "border-[#064E3B] text-[#064E3B]"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>Internal Notes</span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
                  {selectedCaseFile.internalNotes?.length || 0}
                </span>
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {caseDrawerTab === "progress" && (
                <>
                  {/* 1. CURRENT PROGRESS STEPPER */}
                  {(() => {
                    const st = selectedCaseFile.status;
                    const isAssigned =
                      !!selectedCaseFile.assignedStaffName ||
                      !!caseProgressData?.assignment?.isAssigned;

                    const isCaseReopened =
                      selectedCaseFile.isReopened ||
                      selectedCaseFile.status === "REOPENED" ||
                      (selectedCaseFile.reopenCount || 0) > 0;

                    const fallbackStageNumber =
                      st === "CLOSED" || st === "RESOLVED"
                        ? 4
                        : st === "UNDER_REVIEW"
                          ? 4
                          : st === "IN_PROGRESS" ||
                              st === "ESCALATED" ||
                              st === "REOPENED"
                            ? 3
                            : isAssigned || st === "ASSIGNED"
                              ? 2
                              : 1;

                    const stageNumber =
                      caseProgressData?.currentStage?.stageNumber ??
                      fallbackStageNumber;

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
                                  ? `Reopened — Assigned to ${selectedCaseFile.assignedStaffName || "Officer"}`
                                  : `Assigned to ${selectedCaseFile.assignedStaffName || "Officer"}`
                                : "Pending Staff Assignment");

                    const steps = caseProgressData?.currentStage
                      ?.progressSteps || [
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
                        label:
                          st === "CLOSED"
                            ? "Grievance Closed"
                            : "Resolution Review",
                        isComplete: stageNumber >= 4,
                        isCurrent: stageNumber === 4,
                      },
                    ];

                    return (
                      <div className="rounded-xl border border-slate-200/90 bg-white p-5 space-y-4 shadow-2xs overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                            Current Progress
                          </span>
                          <span className="text-xs font-semibold text-emerald-800 text-right truncate max-w-full sm:max-w-[70%]">
                            Stage {stageNumber} of {steps.length}:{" "}
                            {currentStageLabel}
                          </span>
                        </div>

                        {/* Visual Multi-Step Stepper (Safely contained inside card) */}
                        <div className="relative flex items-center justify-between pt-2 px-3 sm:px-6">
                          {/* Background track line & active fill bar strictly contained */}
                          <div className="absolute left-7 sm:left-10 right-7 sm:right-10 top-[24px] h-0.5 bg-slate-200 rounded-full overflow-hidden">
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
                                className="relative z-10 flex flex-col items-center"
                              >
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                                    isPastOrCurrent
                                      ? "border-emerald-600 bg-emerald-600 text-white shadow-2xs"
                                      : "border-slate-300 bg-white text-slate-400"
                                  } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
                                >
                                  {isPastOrCurrent ? (
                                    <Check className="h-4 w-4 stroke-[3]" />
                                  ) : (
                                    <span>{idx + 1}</span>
                                  )}
                                </div>
                                <span
                                  className={`mt-2 text-xs font-medium text-center max-w-[75px] sm:max-w-[95px] line-clamp-2 leading-tight ${
                                    isPastOrCurrent
                                      ? "font-bold text-slate-900"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {step.label}
                                </span>
                              </div>
    </>
  );
}