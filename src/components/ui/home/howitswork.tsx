"use client";

import { CheckCircle2, Clock, FileText, GitBranch } from "lucide-react";

const stages = [
  {
    step: "01",
    title: "Submit Concern",
    desc: "Submit your workplace concern via a structured, confidential form with relevant documents.",
    icon: FileText,
  },
  {
    step: "02",
    title: "Route & Assign",
    desc: "Taxonomy engine automatically classifies and routes the case to the responsible department head.",
    icon: GitBranch,
  },
  {
    step: "03",
    title: "Investigate",
    desc: "An assigned investigator conducts inquiries with active SLA time-tracking and progress updates.",
    icon: Clock,
  },
  {
    step: "04",
    title: "Resolve & Close",
    desc: "Formal resolution is recorded with clear outcomes, evidence, and submitter confirmation.",
    icon: CheckCircle2,
  },
];

export default function HowItsWork() {
  return (
    <section
      id="how-it-works"
      className="border-t border-slate-200/80 bg-white py-12 sm:py-16"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            RESOLUTION JOURNEY
          </span>

          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            How a grievance moves to resolution
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            A transparent, time-governed process from initial intake to final
            resolution.
          </p>
        </div>

        {/* Cardless Horizontal Transition Pipeline */}
        <div className="mt-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-4 relative">
            {stages.map((stage, idx) => {
              const Icon = stage.icon;

              return (
                <div
                  key={stage.step}
                  className="group relative flex flex-col items-center text-center"
                >
                  {/* Step Connector Line (Desktop Only) */}
                  {idx < stages.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-[calc(50%+28px)] right-[calc(-50%+28px)] h-0.5 bg-gradient-to-r from-emerald-200 to-slate-200 z-0" />
                  )}

                  {/* Icon Node */}
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-emerald-100 bg-emerald-50 text-[#064E3B] shadow-xs transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-500 group-hover:bg-[#064E3B] group-hover:text-white">
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />

                    {/* Small number badge */}
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-4 text-sm font-bold text-slate-950 transition-colors group-hover:text-emerald-800">
                    {stage.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-1.5 max-w-xs text-xs leading-5 text-slate-500">
                    {stage.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
