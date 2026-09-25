import React from "react";

export function SlaTab(props: any) {
  return (

        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="SLA Breached"
              value={
                grievances.filter((g) => g.slaStatus === "BREACHED").length
              }
              icon={AlertCircle}
              accentColor="slate"
              description="Exceeded maximum SLA duration"
            />
            <StatCard
              label="SLA At Risk"
              value={grievances.filter((g) => g.slaStatus === "AT_RISK").length}
              icon={Clock}
              accentColor="slate"
              description="Approaching deadline threshold"
            />
            <StatCard
              label="Active Escalations"
              value={escalatedCount}
              icon={Flame}
              accentColor="slate"
              description="Requires Department Head action"
            />
            <StatCard
              label="Reopened Tickets"
              value={reopenedCount}
              icon={RotateCcw}
              accentColor="slate"
              description="Submitters contesting resolution"
            />
          </div>

          {/* ========================================================================= */}
          {/* SLA & ESCALATIONS QUEUE                                                   */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Escalation & SLA Governance
                  </h3>
                  <p className="text-xs font-normal text-slate-500">
                    Review escalated grievances, execute corrective
                    interventions, and approve resolutions.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {
                  grievances.filter(
                    (g) =>
                      g.status === "ESCALATED" ||
                      g.hodIntervention ||
                      g.status === "UNDER_REVIEW",
                  ).length
                }{" "}
                Managed Cases
              </span>
            </div>

            {/* List of Grievances with Scrollbar */}
            <div className="max-h-[560px] overflow-y-scroll custom-scrollbar pr-2 space-y-3">
              {(() => {
                const escalatedList = grievances.filter((g) => {
                  return (
                    g.status === "ESCALATED" ||
                    g.hodIntervention ||
                    g.status === "UNDER_REVIEW" ||
                    g.slaStatus === "BREACHED"
                  );
                });

                if (escalatedList.length === 0) {
                  return (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-8 text-center text-slate-500 text-xs">
                      No active escalations requiring intervention.
                    </div>
                  );
                }

                return escalatedList.map((item) => {
                  const isEscalated = item.status === "ESCALATED";
                  const isUnderIntervention =
                    item.status === "IN_PROGRESS" && item.hodIntervention;
                  const isResolutionReady =
                    item.status === "UNDER_REVIEW" && item.submittedResolution;
                  const isCleared =
                    item.status === "CLOSED" &&
                    item.escalationStage === "ESCALATION_CLEARED";

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs hover:border-emerald-300 transition space-y-2.5"
                    >
                      {/* Ticket Header & Status Pill */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                            {item.ticketCode}
                          </span>
                          <PriorityBadge priority={item.priority} />

                          {/* Simplified Status: If resolution submitted, highlight resolution review; if escalated, show amber badge */}
                          {item.submittedResolution ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              <FileCheck className="h-3 w-3 text-emerald-600" />
                              Resolution Pending Review
                            </span>
                          ) : isEscalated ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              <Bell className="h-3 w-3 text-amber-600" />
                              Escalated to Head
                            </span>
                          ) : isUnderIntervention ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              <RefreshCw className="h-3 w-3 text-amber-600" />
                              Under Intervention
                            </span>
                          ) : isCleared ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Escalation Cleared
                            </span>
                          ) : (
                            <StatusBadge status={item.status} />
                          
  );
}