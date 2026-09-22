"use client";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  GitBranch,
  Plus,
  UserCheck,
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
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-[1400px] px-10 pb-12 pt-14">
        {/* Hero Content */}
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-black shadow-sm">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            Grievance Resolution System
          </div>

          <h1 className="text-5xl font-bold tracking-[-0.035em] text-black lg:text-6xl">
            {headline}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-black">
            {subtext}
          </p>

          <div className="mt-7 flex justify-center">
            <Link
              href={ctaHref}
              className="group inline-flex items-center rounded-xl bg-[#064E3B] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-900"
            >
              {ctaText}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Product Preview */}
        <div className="relative mx-auto mt-11 max-w-6xl">
          {/* Forest & Emerald backdrop glow */}
          <div className="absolute inset-x-6 top-8 h-[425px] rounded-[38px] bg-gradient-to-tr from-[#064E3B] via-emerald-800 to-emerald-600 opacity-95" />

          {/* Browser window */}
          <div className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_25px_60px_-25px_rgba(15,23,42,0.3)]">
            {/* Browser Header */}
            <div className="flex h-11 items-center border-b border-slate-200 bg-slate-50 px-5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              </div>

              <div className="mx-auto flex h-6 w-72 items-center justify-center rounded-md border border-slate-200 bg-white text-[10px] text-black">
                grs.enterprise / my-grievances
              </div>

              <div className="w-12" />
            </div>

            {/* Application */}
            <div className="grid min-h-[385px] grid-cols-[190px_1fr]">
              {/* User Sidebar */}
              <aside className="border-r border-slate-200 bg-slate-50/80 p-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#064E3B] text-sm font-bold text-white shadow-xs">
                    G
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">GRS</p>
                    <p className="text-[9px] font-medium text-slate-500">
                      Resolution System
                    </p>
                  </div>
                </div>

                <div className="mt-8 space-y-1.5">
                  <UserSidebarItem icon={FileText} label="Dashboard" active />

                  <UserSidebarItem icon={FileText} label="My Grievances" />

                  <UserSidebarItem icon={Plus} label="Raise a Grievance" />
                </div>

                {/* User */}
                <div className="mt-16 border-t border-slate-200 pt-4">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    Signed in as
                  </p>

                  <p className="mt-1 text-xs font-bold text-slate-900">
                    End User
                  </p>
                </div>
              </aside>

              {/* Main User Dashboard */}
              <main className="bg-white p-7">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-black">
                      My Grievances
                    </p>

                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-black">
                      Track your grievances
                    </h2>

                    <p className="mt-1 text-xs text-black">
                      View the current status and progress of your submitted
                      grievances.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center rounded-lg bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-900"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Raise Grievance
                  </button>
                </div>

                {/* Grievance Card */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-bold text-black">
                          GRS-2026-00124
                        </h3>

                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
                          In Progress
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-black">
                        Compensation & Benefits
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-black">
                        Progress
                      </p>

                      <p className="mt-1 text-sm font-bold text-black">68%</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[68%] rounded-full bg-emerald-600" />
                  </div>

                  {/* Timeline */}
                  <div className="mt-7 grid grid-cols-4">
                    <UserTimelineItem
                      icon={CheckCircle2}
                      label="Submitted"
                      completed
                    />

                    <UserTimelineItem
                      icon={GitBranch}
                      label="Routed"
                      completed
                    />

                    <UserTimelineItem
                      icon={UserCheck}
                      label="Assigned"
                      completed
                    />

                    <UserTimelineItem icon={Clock3} label="Resolution" active />
                  </div>
                </div>

                {/* Status Information */}
                <div className="mt-5 grid grid-cols-3 gap-4">
                  <UserInfoCard title="Current Status" value="In Progress" />

                  <UserInfoCard
                    title="Category"
                    value="Compensation & Benefits"
                  />

                  <UserInfoCard title="Resolution" value="In Progress" />
                </div>
              </main>
            </div>
          </div>

          {/* Workflow label */}
          <div className="relative mt-3 flex justify-center">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-black shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Structured grievance workflow
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* User Sidebar Item */
function UserSidebarItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[11px] font-medium transition ${
        active
          ? "bg-[#064E3B] text-white shadow-xs"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

/* Timeline */
function UserTimelineItem({
  icon: Icon,
  label,
  completed = false,
  active = false,
}: {
  icon: React.ElementType;
  label: string;
  completed?: boolean;
  active?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="flex justify-center">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            completed
              ? "bg-emerald-50 text-emerald-700"
              : active
                ? "bg-emerald-100/80 text-[#064E3B]"
                : "bg-slate-100 text-slate-400"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p
        className={`mt-2 text-[10px] font-semibold ${
          completed || active ? "text-black" : "text-slate-400"
        }`}
      >
        {label}
      </p>
    </div>
  );
}

/* Information Card */
function UserInfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] uppercase tracking-wider text-black">{title}</p>

      <p className="mt-1 text-xs font-semibold text-black">{value}</p>
    </div>
  );
}
