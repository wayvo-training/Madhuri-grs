"use client";

import {
  ArrowRight,
  Clock,
  GitBranch,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

interface HeroSectionProps {
  headline: string;
  subtext: string;
  ctaText: string;
  ctaHref: string;
}

export default function HeroSection({
  headline,
  subtext,
  ctaText,
  ctaHref,
}: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-white pt-10 pb-6 sm:pt-14 sm:pb-8">
      {/* Subtle background ambient blur */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl">
        <div className="aspect-[1155/478] w-[72.1875rem] bg-gradient-to-tr from-emerald-100 via-teal-50 to-slate-50 opacity-60" />
      </div>

      <div className="mx-auto max-w-5xl px-6 text-center lg:px-8">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-800 shadow-xs backdrop-blur-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Enterprise Grievance Resolution & SLA Governance
        </div>

        {/* Headline */}
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
          {headline}
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          {subtext}
        </p>

        {/* Action Buttons */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={ctaHref}
            className="group inline-flex items-center gap-2 rounded-xl bg-[#064E3B] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-950/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-900"
          >
            {ctaText}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          <a
            href="#track"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/40 hover:text-emerald-900"
          >
            <Search className="h-4 w-4 text-emerald-700" />
            Track Existing Grievance
          </a>
        </div>
      </div>
    </section>
  );
}
