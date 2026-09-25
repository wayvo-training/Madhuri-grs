import React from "react";

export function LeaveReassignmentModal(props: any) {
  return (
    <>
      {/* LEAVE REASSIGNMENT HELPER MODAL                                           */}
      {/* ========================================================================= */}
      {leaveReassignmentModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
            {/* Modal Header */}
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
                      {leaveReassignmentModalStaff.name}
                    </span>{" "}
                    ({leaveReassignmentModalStaff.designation}) &bull;{" "}
                    <span className="font-semibold text-slate-700">
                      {
                        grievances.filter(
                          (g) =>
                            g.assignedStaffId ===
                              leaveReassignmentModalStaff.id &&
                            g.status !== "CLOSED",
                        ).length
                      }{" "}
                      Active Case(s)
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLeaveReassignmentModalStaff(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleBulkReassignAndMarkLeave}
              className="mt-4 space-y-4"
            >
              {/* Context Alert Banner */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-slate-600" />
                  <span>SLA Protection Advisory</span>
                </div>
                <p className="font-normal text-slate-700 leading-relaxed">
                  Marking this officer on leave will freeze their availability.
                  To prevent active tickets from stalling or breaching
                  resolution SLAs, it is recommended to bulk-transfer these
                  grievances to another available officer.
                </p>
              </div>

              {/* Active Tickets List */}
              <div className="space-y-2">
                <div className="block text-xs font-semibold text-slate-800">
                  Currently Assigned Active Grievances (
                  {
                    grievances.filter(
                      (g) =>
                        g.assignedStaffId === leaveReassignmentModalStaff.id &&
                        g.status !== "CLOSED",
                    ).length
                  }
                  )
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {grievances
                    .filter(
                      (g) =>
                        g.assignedStaffId === leaveReassignmentModalStaff.id &&
                        g.status !== "CLOSED",
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                              {item.ticketCode}
                            </span>
                            <PriorityBadge priority={item.priority} />
                            <StatusBadge status={item.status} />
                          </div>
                          <p className="font-medium text-slate-900 line-clamp-1">
                            {item.title}
                          </p>
                          <span className="text-[11px] text-slate-500">
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
                            onClick={() => {
                              setSelectedCaseFile(item);
                              setCaseDrawerTab("progress");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <Eye className="h-3 w-3 text-slate-500" />
                            <span>Inspect</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Target Staff Member Dropdown */}
              <div>
                <label
                  htmlFor="leave-target-staff"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  Select Officer to Receive Reassigned Grievances{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  id="leave-target-staff"
                  required
                  value={leaveReassignTargetStaffId}
                  onChange={(e) =>
                    setLeaveReassignTargetStaffId(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="">-- Choose an Available Officer --</option>
                  {staffList
                    .filter((s) => s.id !== leaveReassignmentModalStaff.id)
                    .map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                        disabled={s.status === "ON_LEAVE"}
                      >
                        {s.name} ({s.designation}) &bull; {s.activeTickets}/
                        {s.maxCapacity} active tickets{" "}
                        {s.status === "ON_LEAVE" ? "[ON LEAVE]" : "[AVAILABLE]"}
                      </option>
                    ))}
                </select>
              </div>

              {/* HOD Directive / Handoff Note */}
              <div>
                <label
                  htmlFor="leave-reassign-note"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  HOD Handoff Directive (Logged to Ticket Audit Trail)
                </label>
                <textarea
                  id="leave-reassign-note"
                  rows={2}
                  value={leaveReassignNote}
                  onChange={(e) => setLeaveReassignNote(e.target.value)}
                  placeholder="e.g. Officer approved on leave. Reassigned to prevent SLA delay..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLeaveReassignmentModalStaff(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleKeepTicketsAndMarkLeave}
                    className="rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Keep Tickets & Mark On Leave
                  </button>

                  <button
                    type="submit"
                    disabled={!leaveReassignTargetStaffId}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Reassign All & Mark On Leave</span>
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