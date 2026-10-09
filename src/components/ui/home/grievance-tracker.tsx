"use client";

import { ArrowRight, Loader2, Lock, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GrievanceTracker() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = (ticketNumber?: string) => {
    const numToSearch = (ticketNumber || query).trim();
    if (!numToSearch) return;

    setLoading(true);
    const redirectPath = `/end-user/track?id=${encodeURIComponent(numToSearch)}`;
    router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  };

  return (
    <section
      id="track"
      className="relative border-t border-slate-200 bg-slate-50/60 py-14"
    >
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-[#ECFEFF] px-3 py-1 text-xs font-semibold text-[#0E7490]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0891B2]" />
            LIVE STATUS TRACKER
          </span>

          <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Track Grievance Resolution Progress
          </h2>

          <p className="mt-2 text-sm sm:text-base leading-relaxed text-slate-600 max-w-xl mx-auto">
            Enter your grievance reference code to inspect the live handling
            stage, assigned department, and resolution timeline.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mx-auto mt-6 max-w-2xl">
          <search aria-label="Grievance tracking search">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition-all focus-within:border-[#0E7490] focus-within:ring-2 focus-within:ring-cyan-500/20">
              <div className="flex flex-1 items-center gap-3 pl-3">
                <Search
                  className="h-5 w-5 text-slate-400 shrink-0"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter reference number (e.g. GRS-2026-0001)..."
                  aria-label="Enter reference number"
                  className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => handleTrack()}
                disabled={loading || !query.trim()}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0F766E] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#115E59] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Track
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </search>

          {/* Confidentiality / Login Note */}
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5 text-teal-600 shrink-0" />
            <span>
              Secure tracking: Entering your ID takes you to sign in to protect
              grievance privacy.
            </span>
          </div>

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
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-mono text-2.75 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-800 transition-colors cursor-pointer"
                >
                  {sample}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
