"use client";

import { Check, Clock, FileText, FolderOpen, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type DetailTab = "overview" | "resolution" | "tracking" | "documents";

interface GrievanceDetails4TabSkeletonProps {
  initialTab?: DetailTab;
}

export function GrievanceDetails4TabSkeleton({
  initialTab,
}: GrievanceDetails4TabSkeletonProps) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as DetailTab | null;

  const validTab: DetailTab = useMemo(() => {
    if (
      urlTab &&
      ["overview", "resolution", "tracking", "documents"].includes(urlTab)
    ) {
      return urlTab;
    }
    if (initialTab) return initialTab;
    return "overview";
  }, [urlTab, initialTab]);

  const [activeTab, setActiveTab] = useState<DetailTab>(validTab);

  useEffect(() => {
    if (
      urlTab &&
      ["overview", "resolution", "tracking", "documents"].includes(urlTab)
    ) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tab: DetailTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", url.toString());
    }
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      {/* 1. TOP HEADER & BREADCRUMBS CARD */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 min-w-0 flex-1">
            {/* Back button */}
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3.5 w-3.5 rounded" />
              <Skeleton className="h-3.5 w-28" />
            </div>

            {/* Grievance Number & Badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Skeleton className="h-7 w-48 sm:w-60 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            {/* Category / Subcategory / Department breadcrumb */}
            <div className="flex items-center gap-2 pt-0.5">
              <Skeleton className="h-3.5 w-24" />
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <Skeleton className="h-3.5 w-28" />
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <Skeleton className="h-3.5 w-36" />
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>

        {/* 2. CASE HUB 4 NAVIGATION TABS (Interactive) */}
        <div className="flex items-center gap-3 sm:gap-6 border-t border-slate-100 dark:border-slate-800 mt-4 pt-1.5 overflow-x-auto text-xs sm:text-sm font-semibold">
          {/* Tab 1: Overview */}
          <button
            type="button"
            onClick={() => handleTabChange("overview")}
            className={`py-2.5 border-b-2 transition inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "border-[#0F766E] text-[#0F766E] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Overview</span>
          </button>

          {/* Tab 2: Resolution */}
          <button
            type="button"
            onClick={() => handleTabChange("resolution")}
            className={`py-2.5 border-b-2 transition inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "resolution"
                ? "border-[#0F766E] text-[#0F766E] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Resolution</span>
            <span className="rounded-full bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
              Review
            </span>
          </button>

          {/* Tab 3: Tracking */}
          <button
            type="button"
            onClick={() => handleTabChange("tracking")}
            className={`py-2.5 border-b-2 transition inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "tracking"
                ? "border-[#0F766E] text-[#0F766E] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Tracking</span>
          </button>

          {/* Tab 4: Documents */}
          <button
            type="button"
            onClick={() => handleTabChange("documents")}
            className={`py-2.5 border-b-2 transition inline-flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === "documents"
                ? "border-[#0F766E] text-[#0F766E] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            <span>Documents</span>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[11px] text-slate-600 dark:text-slate-300 font-bold">
              4
            </span>
          </button>
        </div>
      </div>

      {/* 3. DEDICATED SKELETON CONTENT FOR EACH TAB */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* TAB 1: OVERVIEW SKELETON */}
        {activeTab === "overview" && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
            {/* Top Info Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-28" />
            </div>

            {/* Grid of Key Particulars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((gridId) => (
                <div
                  key={`detail-particular-${gridId}`}
                  className="rounded-xl border border-slate-100 dark:border-slate-800/80 p-3.5 space-y-2 bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ))}
            </div>

            {/* Grievance Statement */}
            <div className="rounded-xl border border-slate-100 dark:border-slate-800/80 p-4 space-y-3 bg-slate-50/30 dark:bg-slate-800/20">
              <Skeleton className="h-4 w-36" />
              <div className="space-y-2 pt-1">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-11/12" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
            </div>

            {/* Involved Departments */}
            <div className="space-y-2.5 pt-1">
              <Skeleton className="h-4 w-40" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2].map((deptId) => (
                  <div
                    key={`detail-dept-${deptId}`}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-36" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RESOLUTION SKELETON */}
        {activeTab === "resolution" && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
            {/* Resolution Banner */}
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>

            {/* Investigation Findings Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <Skeleton className="h-4 w-48" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-5/6" />
                <Skeleton className="h-3.5 w-4/6" />
              </div>
            </div>

            {/* Corrective Action Taken Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <Skeleton className="h-4 w-52" />
              <div className="space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-3/4" />
              </div>
            </div>

            {/* Citizen Decision Review Actions */}
            <div className="rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50/40 dark:bg-teal-950/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-60" />
              </div>
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-9 w-28 rounded-xl" />
                <Skeleton className="h-9 w-32 rounded-xl" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TRACKING SKELETON */}
        {activeTab === "tracking" && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-72" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            {/* Vertical Stepper Timeline Skeleton */}
            <div className="space-y-0 pt-2 max-w-2xl">
              {[
                { title: "Grievance Submitted", completed: true },
                { title: "Department Routing", completed: true },
                { title: "Investigating Officer Assigned", completed: true },
                { title: "Investigation in Progress", current: true },
                { title: "Resolution & Closure", future: true },
              ].map((step, idx, arr) => (
                <div key={step.title} className="flex items-stretch gap-4">
                  {/* Stepper Bullet & Vertical Line */}
                  <div className="flex flex-col items-center shrink-0 w-6">
                    <div className="flex items-center justify-center shrink-0">
                      {step.completed ? (
                        <div className="h-6 w-6 rounded-full bg-emerald-600/70 text-white flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        </div>
                      ) : step.current ? (
                        <div className="h-6 w-6 rounded-full bg-teal-600 ring-4 ring-teal-100 dark:ring-teal-950 text-white flex items-center justify-center animate-pulse">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                        </div>
                      )}
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-800 my-1 min-h-9" />
                    )}
                  </div>

                  {/* Step Description & Date */}
                  <div className="min-w-0 flex-1 flex items-start justify-between gap-4 pb-6">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                    <Skeleton className="h-3.5 w-24 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DOCUMENTS SKELETON */}
        {activeTab === "documents" && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
            {/* Category Filter Pills Bar */}
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-36 rounded-lg" />
              <Skeleton className="h-8 w-44 rounded-lg" />
            </div>

            {/* Section 1: Documents Shared by You (End User) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2].map((docId) => (
                  <div
                    key={`eu-doc-skel-${docId}`}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                      <div className="space-y-1.5 min-w-0">
                        <Skeleton className="h-3.5 w-36" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Skeleton className="h-8 w-14 rounded-lg" />
                      <Skeleton className="h-8 w-14 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Documents Shared by Investigation Staff */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2].map((docId) => (
                  <div
                    key={`staff-doc-skel-${docId}`}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                      <div className="space-y-1.5 min-w-0">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Skeleton className="h-8 w-14 rounded-lg" />
                      <Skeleton className="h-8 w-14 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
