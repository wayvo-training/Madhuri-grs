"use client";

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  ShieldAlert,
  Tag,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface TrackingStage {
  stage: number;
  label: string;
  date: string | null;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface TrackedGrievance {
  number: string;
  title: string;
  status: string;
  slaStatus: string;
  priority: string;
  category: string;
  subcategory: string;
  primaryDepartment: string;
  submittedAt: string;
  dueAt: string;
  resolvedAt: string | null;
  currentStage: number;
  stages: TrackingStage[];
}

export default function GrievanceTracker() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackedGrievance | null>(null);

  const handleTrack = async (ticketNumber?: string) => {
    const numToSearch = ticketNumber || query;
    if (!numToSearch.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/grievances/track?number=${encodeURIComponent(numToSearch.trim())}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Grievance reference not found.");
        setResult(null);
      } else {
        setResult(data.grievance);
        setQuery(data.grievance.number);
      }
    } catch {
      setError("Unable to reach the tracking server. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "RESOLVED":
      case "CLOSED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "ESCALATED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "IN_PROGRESS":
      case "UNDER_INVESTIGATION":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ASSIGNED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <section
      id="track"
      className="relative border-t border-slate-200 bg-slate-50/60 py-12"
    >
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            LIVE STATUS TRACKER
          </span>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Track Grievance Resolution Progress
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Enter your grievance reference code to inspect the live handling
            stage, assigned department, and resolution timeline.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mx-auto mt-6 max-w-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack();
            }}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
          >
            <div className="flex flex-1 items-center gap-3 pl-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter reference number (e.g. GRS-2026-0001)..."
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#064E3B] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  Track Status
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick sample pills */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-600">Try sample:</span>
            {["GRS-2026-0001", "GRS-2026-0004", "GRS-2026-0005"].map(
              (sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setQuery(sample);
                    handleTrack(sample);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-[11px] text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-800 transition-colors"
                >
                  {sample}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-rose-700">
              <XCircle className="h-5 w-5" />
              <p className="text-xs font-semibold">{error}</p>
            </div>
            <p className="mt-1 text-[11px] text-rose-600">
              Need assistance?{" "}
              <Link
                href="/login"
                className="underline font-semibold hover:text-rose-800"
              >
                Log in to your account
              </Link>{" "}
              to browse all your submitted grievances.
            </p>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Ticket Header */}
            <div className="border-b border-slate-100 bg-slate-50/80 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {result.number}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${getStatusBadge(
                        result.status,
                      )}`}
                    >
                      {result.status.replace("_", " ")}
                    </span>
                    {result.status === "ESCALATED" && (
                      <span className="flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                        <ShieldAlert className="h-3 w-3" />
                        Escalated
                      </span>
                    )}
                  </div>

                  <h3 className="mt-1.5 text-base font-bold text-slate-950">
                    {result.title}
                  </h3>
                </div>

                {/* Primary Department & Category */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium">
                    <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                    {result.primaryDepartment}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium">
                    <Tag className="h-3.5 w-3.5 text-slate-500" />
                    {result.category}
                  </span>
                </div>
              </div>
            </div>

            {/* 4-Stage Stepper */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {result.stages.map((stage, _idx) => {
                  const isDone = stage.isCompleted;
                  const isCurrent = stage.isCurrent;

                  return (
                    <div
                      key={stage.stage}
                      className="relative flex flex-col items-center text-center"
                    >
                      {/* Step Circle */}
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                          isDone
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                            : isCurrent
                              ? "border-[#064E3B] bg-emerald-50 text-[#064E3B] ring-4 ring-emerald-100"
                              : "border-slate-200 bg-slate-50 text-slate-400"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isCurrent ? (
                          <Clock className="h-5 w-5 animate-pulse" />
                        ) : (
                          <span className="text-xs font-bold">
                            {stage.stage}
                          </span>
                        )}
                      </div>

                      <p
                        className={`mt-3 text-xs font-bold ${
                          isDone || isCurrent
                            ? "text-slate-900"
                            : "text-slate-400"
                        }`}
                      >
                        {stage.label}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-500">
                        {stage.date
                          ? new Date(stage.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : isCurrent
                            ? "In progress"
                            : "Upcoming"}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Resolution details footer */}
              <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-700" />
                  <span>
                    Submitted on{" "}
                    <strong>
                      {new Date(result.submittedAt).toLocaleDateString()}
                    </strong>
                    {result.dueAt &&
                      ` • Target SLA: ${new Date(result.dueAt).toLocaleDateString()}`}
                  </span>
                </div>

                <Link
                  href="/login"
                  className="font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1"
                >
                  Log in for case notes & updates
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
