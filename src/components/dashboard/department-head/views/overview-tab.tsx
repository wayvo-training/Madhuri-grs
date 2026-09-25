import React from "react";

export function OverviewTab(props: any) {
  return (

        <div className="space-y-3.5 sm:space-y-4">
          {/* 1. Department Header Banner (Compact: ~80-90px height) */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-r from-[#064E3B] via-[#043629] to-slate-950 px-4 py-3 sm:px-5 sm:py-3.5 text-white shadow-xs">
            <div className="relative z-10 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                  <Building2 className="h-4.5 w-4.5 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white leading-tight">
                      {currentDepartmentName}
                    </h2>
                    <span className="rounded-md bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                      Primary Queue
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-normal text-slate-300 leading-tight">
                    Department Head:{" "}
                    <strong className="font-semibold text-white">
                      {currentHodName}
                    </strong>{" "}
                    &bull; {currentHodEmail} &bull; Code:{" "}
                    <span className="font-mono text-emerald-300">
                      {currentEmployeeCode}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    loadData(selectedDeptId, true);
                    setActionSuccessMessage(
                      "Refreshed live queue from PostgreSQL database.",
                    );
                    setTimeout(() => setActionSuccessMessage(null), 3000);
                  }}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${
                      isRefreshing ? "animate-spin text-emerald-300" : ""
                    }`}
                  />
                  <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchView("queue"
  );
}