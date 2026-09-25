import React from "react";

export function EscalationModal(props: any) {
  return (
    <>
      {/* ESCALATION INTERVENTION MODAL (Steps 4, 5, 6 -> Advances to 7, 8, 9)       */}
      {/* ========================================================================= */}
      {escalationModalGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
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
                      {escalationModalGrievance.ticketCode}
                    </span>{" "}
                    &bull; {escalationModalGrievance.slaTimeLeft}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEscalationModalGrievance(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleEscalationSubmit}
              className="flex flex-col flex-1 min-h-0"
            >
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                {/* Grievance Context & SLA Breach Details */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-950">
                      {escalationModalGrievance.title}
                    </span>
                    <PriorityBadge
                      priority={escalationModalGrievance.priority}
                    />
                  </div>
                  <p className="text-amber-950 font-normal">
                    <strong>Breach Context:</strong>{" "}
                    {formatEscalationNotice(
                      escalationModalGrievance.escalationReason,
                    )}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600 border-t border-amber-200/60">
                    <span>
                      Submitter:{" "}
                      <strong>{escalationModalGrievance.submitterName}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Currently Assigned:{" "}
                      <strong>
                        {escalationModalGrievance.assignedStaffName ||
                          "Unassigned"}
                      </strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Category:{" "}
                      <strong>{escalationModalGrievance.category}</strong>
                    </span>
                  </div>
                </div>

                {/* Identify Bottleneck */}
                <div>
                  <div className="block text-xs font-semibold text-slate-900 mb-1.5">
                    Identify Root Operational Bottleneck{" "}
                    <span className="text-rose-500">*</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEscalationBottleneck("STAFF_CAPACITY")}
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationBottleneck === "STAFF_CAPACITY"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      👥 Staff Capacity / Absence
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Officer overloaded or on approved leave
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEscalationBottleneck("CROSS_DEPT")}
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationBottleneck === "CROSS_DEPT"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      🏢 Cross-Department Dependency
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Awaiting response or approval from Finance/IT
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEscalationBottleneck("MISSING_DOCS")}
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationBottleneck === "MISSING_DOCS"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      📁 Incomplete Documentation
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Awaiting original bills or vouchers from submitter
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEscalationBottleneck("COMPLEX_INVESTIGATION")
                      }
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationBottleneck === "COMPLEX_INVESTIGATION"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      🔍 Complex Investigation Required
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Requires audit panel or field verification
                      </div>
                    </button>
                  </div>
                </div>

                {/* Intervention Action */}
                <div>
                  <div className="block text-xs font-semibold text-slate-900 mb-1.5">
                    Choose Corrective Intervention Action{" "}
                    <span className="text-rose-500">*</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEscalationInterventionType("MONITOR")}
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationInterventionType === "MONITOR"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      👁️ Continue Monitoring
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Acknowledge SLA risk and supervise without reassigning
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEscalationInterventionType("NOTIFY_STAFF")
                      }
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationInterventionType === "NOTIFY_STAFF"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      📢 Notify Assigned Staff
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Send urgent priority nudge to assigned officer
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEscalationInterventionType("CROSS_DEPT")
                      }
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationInterventionType === "CROSS_DEPT"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      🤝 Add Supporting Dept / Staff
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Enlist supporting department to collaborate
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEscalationInterventionType("REASSIGN")}
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationInterventionType === "REASSIGN"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      🔄 Reassign to Available Officer
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Transfer ticket to an active officer with spare capacity
                      </div>
                    </button>
                  </div>
                </div>

                {/* Dynamic Target Selection based on Intervention Type */}
                {escalationInterventionType === "REASSIGN" && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <label
                      htmlFor="escalation-target-staff"
                      className="block text-xs font-semibold text-slate-900 mb-1"
                    >
                      Select Target Officer{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="escalation-target-staff"
                      required
                      value={escalationTargetStaffId}
                      onChange={(e) =>
                        setEscalationTargetStaffId(e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                    >
                      <option value="">
                        -- Choose an Available Officer --
                      </option>
                      {staffList.map((s) => (
                        <option
                          key={s.id}
                          value={s.id}
                          disabled={s.status === "ON_LEAVE"}
                        >
                          {s.name} ({s.designation}) &bull; {s.activeTickets}/
                          {s.maxCapacity} tickets{" "}
                          {s.status === "ON_LEAVE"
                            ? "[ON LEAVE]"
                            : "[AVAILABLE]"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {escalationInterventionType === "CROSS_DEPT" && (
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
                      value={escalationTargetDept}
                      onChange={(e) => setEscalationTargetDept(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                    >
                      <option value="Finance & Accounts">
                        Finance & Accounts
                      </option>
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

                {/* Intervention Directive & Justification Note */}
                <div>
                  <label
                    htmlFor="escalation-action-note"
                    className="block text-xs font-semibold text-slate-900 mb-1.5"
                  >
                    Intervention Directive & Justification (Logged to Audit
                    Trail) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="escalation-action-note"
                    required
                    rows={3}
                    value={escalationNote}
                    onChange={(e) => setEscalationNote(e.target.value)}
                    placeholder="Explain the operational bottleneck resolved and specific directives given to staff..."
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Modal Footer (Fixed at bottom) */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 bg-slate-50/90 shrink-0 gap-2">
                <span className="text-[11px] text-slate-500">
                  Intervention is logged to the audit trail and dispatched to
                  the assigned officer.
                </span>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setEscalationModalGrievance(null)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      escalationInterventionType === "REASSIGN" &&
                      !escalationTargetStaffId
                    }
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
      )}

      {/* ========================================================================= */}
    </>
  );
}