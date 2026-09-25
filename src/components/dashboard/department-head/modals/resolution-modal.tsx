import React from "react";

export function ResolutionModal(props: any) {
  return (
    <>
      {/* RESOLUTION REVIEW & CLEARANCE MODAL                                       */}
      {/* ========================================================================= */}
      {resolutionModalGrievance && (
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
                    {resolutionModalGrievance.ticketCode}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResolutionModalGrievance(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResolutionSubmit} className="mt-4 space-y-4">
              {/* Step 10 Findings */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-slate-800 space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-emerald-950">
                  <span>
                    Investigating Officer Findings:{" "}
                    {resolutionModalGrievance.submittedResolution?.staffName}
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">
                    {resolutionModalGrievance.submittedResolution?.submittedAt}
                  </span>
                </div>
                <p className="font-normal leading-relaxed">
                  {resolutionModalGrievance.submittedResolution?.note}
                </p>
              </div>

              <div>
                <div className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Department Head Final Decision
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setResolutionDecision("APPROVE")}
                    className={`rounded-xl border p-3 text-xs text-left transition ${
                      resolutionDecision === "APPROVE"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-600"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-normal"
                    }`}
                  >
                    ✅ Approve & Clear Escalation
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                      Clear escalation flag & mark grievance as CLOSED
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionDecision("REJECT")}
                    className={`rounded-xl border p-3 text-xs text-left transition ${
                      resolutionDecision === "REJECT"
                        ? "border-slate-800 bg-slate-100 text-slate-900 font-semibold ring-1 ring-slate-800"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-normal"
                    }`}
                  >
                    🔄 Request Clarification
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                      Return to investigating officer for revision
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="review-feedback"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  {resolutionDecision === "APPROVE"
                    ? "Final Approval Remarks (Logged to Audit Trail)"
                    : "Clarification Directives"}
                </label>
                <textarea
                  id="review-feedback"
                  rows={3}
                  value={resolutionFeedback}
                  onChange={(e) => setResolutionFeedback(e.target.value)}
                  placeholder={
                    resolutionDecision === "APPROVE"
                      ? "e.g. Resolution verified and sanctioned. All compliance requirements fulfilled."
                      : "e.g. Please verify additional bank annexures before final submission."
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolutionModalGrievance(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-xs transition ${
                    resolutionDecision === "APPROVE"
                      ? "bg-[#064E3B] hover:bg-emerald-900"
                      : "bg-slate-800 hover:bg-slate-900"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    {resolutionDecision === "APPROVE"
                      ? "Approve Resolution & Close Grievance"
                      : "Return to Staff with Feedback"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
    </>
  );
}