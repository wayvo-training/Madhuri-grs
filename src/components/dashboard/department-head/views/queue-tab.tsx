import React from "react";

export function QueueTab(props: any) {
  return (

        <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
          {/* Queue Filter Controls Bar (Top header of the unit) */}
          <div className="p-3.5 sm:p-4 space-y-3 bg-white border-b border-slate-200/80">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search queue by ticket code, subject, submitter, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* 9 Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedTab("ALL")}
                className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "ALL"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>All</span>
                <span
                  className={`ml-1.5 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "ALL"
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 font-medium"
                  }`}
                >
                  {grievances.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("UNASSIGNED")}
                className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "UNASSIGNED"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>Unassigned</span>
                <span
                  className={`ml-1.5 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "UNASSIGNED"
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 font-medium"
                  }`}
                >
                  {unassignedCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("IN_PROGRESS")}
                className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "IN_PROGRESS"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>In Progress</span>
                <span
                  className={`ml-1.5 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "IN_PROGRESS"
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 font-medium"
                  }`}
                >
                  {inProgressCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("HIGH_CRITICAL")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "HIGH_CRITICAL"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Flame className="h-3 w-3" />
                <span>High & Critical</span>
                <span
                  className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "HIGH_CRITICAL"
                      ? "bg-white/20 text-white font-semibold"
                      : highCriticalCount > 0
                        ? "bg-slate-200 text-slate-800 font-bold"
                        : "bg-slate-100 text-slate-500 font-medium"
                  }`}
                >
                  {highCriticalCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("AT_RISK")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "AT_RISK"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>SLA At Risk</span>
                <span
                  className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "AT_RISK"
                      ? "bg-white/20 text-white font-semibold"
                      : atRiskCount > 0
                        ? "bg-amber-100 text-amber-800 font-bold"
                        : "bg-slate-100 text-slate-500 font-medium"
                  }`}
                >
                  {atRiskCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("ESCALATED")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "ESCALATED"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <AlertCircle className="h-3 w-3" />
                <span>Escalated</span>
                <span
                  className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "ESCALATED"
                      ? "bg-white/20 text-white font-semibold"
                      : escalatedCount > 0
                        ? "bg-amber-100 text-amber-800 font-bold"
                        : "bg-slate-100 text-slate-500 font-medium"
                  }`}
                >
                  {escalatedCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("REOPENED")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "REOPENED"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reopened</span>
                <span
                  className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "REOPENED"
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 font-medium"
                  }`}
                >
                  {reopenedCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("CROSS_DEPT")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "CROSS_DEPT"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <GitBranch className="h-3 w-3" />
                <span>Cross-Dept</span>
                <span
                  className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "CROSS_DEPT"
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 font-medium"
                  }`}
                >
                  {crossDeptCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("RESOLUTION_REVIEW")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "RESOLUTION_REVIEW"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Resolution Review</span>
                <span
                  className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "RESOLUTION_REVIEW"
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 font-medium"
                  }`}
                >
                  {resolutionReviewCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("CLOSED")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "CLOSED"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Closed</span>
                <span
                  className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "CLOSED"
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 font-medium"
                  }`}
                >
                  {closedCount}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
              <span className="text-slate-500 font-normal">
                Showing{" "}
                <strong className="font-semibold text-slate-800">
                  {filteredGrievances.length}
                </strong>{" "}
                of {grievances.length} grievances in queue
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 outline-none"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>

                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 outline-none"
                >
                  <option value="ALL">All Assigned Officers</option>
                  <option value="UNASSIGNED">Unassigned Only</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.activeTickets} active)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Full-width Grievance Cards Grid with dedicated scrollbar (Body of the unit) */}
          <div className="max-h-[580px] overflow-y-scroll custom-scrollbar p-3.5 sm:p-4 space-y-3 bg-slate-50/40">
            {filteredGrievances.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500/80" />
                <h3 className="mt-3 text-sm font-semibold text-slate-900">
                  No grievances match this filter
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTab("ALL");
                    setSearchQuery("");
                    setPriorityFilter("ALL");
                    setStaffFilter("ALL");
                  }}
                  className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredGrievances.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition hover:border-emerald-300 hover:shadow-sm space-y-2.5"
                >
                  {/* Top Header: Badges (Left) & Date / Target SLA (Right) */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200/80">
                        {item.ticketCode}
                      </span>
                      <PriorityBadge priority={item.priority} />
                      <StatusBadge status={item.status} />

                      {item.slaStatus === "BREACHED" &&
                        item.status !== "ESCALATED" &&
                        (item.hodIntervention ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                            Intervention Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                            <AlertCircle className="h-3 w-3 text-amber-600" />
                            SLA Breached
                          </span>
                        ))}
                      {item.slaStatus === "AT_RISK" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          <Clock className="h-3 w-3 text-amber-600" />
                          SLA At Risk
                        </span>
                      )}
                      {item.isReopened && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          <RotateCcw className="h-3 w-3 text-slate-600" />
                          Reopened ({item.reopenCount}x)
                        </span>
                      )}
                      {item.isCrossDepartment && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          <GitBranch className="h-3 w-3 text-slate-600" />
                          Cross-Dept
                        </span>
                      )}
                    </div>

                    <div className="text-right flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-normal text-slate-400">
                        Submitted {item.createdAt}
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        Target SLA:
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          item.status === "ESCALATED"
                            ? "text-slate-700 font-medium"
                            : item.slaStatus === "BREACHED"
                              ? "text-amber-800 font-semibold"
                              : item.slaStatus === "AT_RISK"
                                ? "text-amber-700"
                                : "text-slate-700"
                        }`}
                      >
                        {item.slaTimeLeft}
                      </span>
                    </div>
                  </div>

                  {/* Grievance Title */}
                  <h3 className="text-base font-semibold text-slate-900">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCaseFile(item);
                        setCaseDrawerTab("statement");
                      }}
                      className="text-left hover:text-emerald-800 transition flex items-center gap-1.5 group"
                      title="Click to inspect full case file"
                    >
                      <span>{item.title}</span>
                      <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700 transition" />
                    </button>
                  </h3>

                  {item.reopenReason && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800">
                      <span className="font-semibold text-slate-900">
                        Reopen Reason:{" "}
                      </span>
                      <span className="font-normal text-slate-700">
                        {item.reopenReason}
                      </span>
                    </div>
                  )}

                  {item.isCrossDepartment && item.collaboratingDepartments && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        Joint Ownership:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.collaboratingDepartments.map((dept) => (
                          <span
                            key={dept}
                            className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.hodIntervention && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5 text-emerald-900">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          Department Head Directive &bull;{" "}
                          {item.hodIntervention.actionLabel}
                        </span>
                        <span className="text-[11px] font-normal text-emerald-800 shrink-0">
                          {item.hodIntervention.intervenedAt} &bull; by{" "}
                          {item.hodIntervention.intervenedBy}
                        </span>
                      </div>
                      {item.hodIntervention.note && (
                        <p className="font-normal text-emerald-900 italic">
                          &ldquo;{item.hodIntervention.note}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  {item.submittedResolution &&
                    item.status === "UNDER_REVIEW" && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-900 space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span>
                            Pending HOD Approval &bull; Submitted by{" "}
                            {item.submittedResolution.staffName}
                          </span>
                          <span className="text-[11px] font-normal">
                            {item.submittedResolution.submittedAt}
                          </span>
                        </div>
                        <p className="font-normal">
                          {item.submittedResolution.note}
                        </p>
                      </div>
                    )}

                  {/* Bottom Row: Metadata on LEFT, Actions on RIGHT - STRICT SINGLE LINE */}
                  <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100 min-h-[38px]">
                    <div className="flex items-center gap-x-3 text-xs font-normal text-slate-500 min-w-0 flex-1 overflow-hidden">
                      <span className="truncate shrink-0">
                        <strong className="font-medium text-slate-700">
                          Category:
                        </strong>{" "}
                        <span className="text-slate-600 font-medium">
                          {item.category} &rsaquo; {item.subcategory}
                        </span>
                      </span>
                      <span className="text-slate-300 shrink-0">&bull;</span>
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <strong className="font-medium text-slate-700">
                          Submitter:
                        </strong>{" "}
                        <span
                          className="inline-block max-w-[130px] truncate align-bottom text-slate-700 font-medium"
                          title={`${item.submitterName} (${item.submitterRole})`}
                        >
                          {item.submitterName}
                        </span>
                      </span>
                      <span className="text-slate-300 shrink-0">&bull;</span>
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <strong className="font-medium text-slate-700">
                          Assigned Officer:
                        </strong>{" "}
                        {item.assignedStaffName ? (
                          <span
                            className="inline-flex items-center gap-1 font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 max-w-[150px]"
                            title={`Assigned Officer: ${item.assignedStaffName}`}
                          >
                            <User className="h-3 w-3 text-emerald-700 shrink-0" />
                            <span className="truncate">
                              {item.assignedStaffName}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Unassigned
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCaseFile(item);
                          setCaseDrawerTab("progress");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        <span>Inspect</span>
                      </button>

                      {item.status === "UNDER_REVIEW" && (
                        <button
                          type="button"
                          onClick={() => {
                            setResolutionModalGrievance(item);
                            setResolutionDecision("APPROVE");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#064E3B] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-900 transition"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Review Resolution</span>
                        </button>
                      )}

                      {item.status === "ESCALATED" && (
                        <button
                          type="button"
                          onClick={() => {
                            setEscalationModalGrievance(item);
                            setEscalationBottleneck("STAFF_CAPACITY");
                            setEscalationInterventionType("REASSIGN");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#064E3B] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-900 transition"
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Take Escalation Action</span>
                        </button>
                      )}

                      {item.assignedStaffName ? (
                        item.status !== "ESCALATED" &&
                        item.status !== "CLOSED" &&
                        item.status !== "RESOLVED" &&
                        item.slaStatus === "BREACHED" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAssignModalGrievance(item);
                              setSelectedStaffId(item.assignedStaffId || "");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                            title={`Currently assigned to ${item.assignedStaffName}. Click to reassign.`}
                          >
                            <UserCheck className="h-3.5 w-3.5 text-emerald-800" />
                            <span>Reassign</span>
                          </button>
                        ) : null
                      ) : (
                        item.status !== "CLOSED" &&
                        item.status !== "RESOLVED" && (
                          <button
                            type="button"
                            onClick={() => {
                              setAssignModalGrievance(item);
                              setSelectedStaffId("");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#064E3B] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-900"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Assign Staff</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      
  );
}