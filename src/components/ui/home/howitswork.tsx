"use client";

import {
  ArrowRight,
  CheckCircle2,
  FileText,
  GitBranch,
  UserCheck,
} from "lucide-react";
import { useState } from "react";

const steps = [
  {
    number: "01",
    title: "Submit Grievance",
    description:
      "Provide the details of your workplace concern through a structured grievance form.",
    icon: FileText,
  },
  {
    number: "02",
    title: "Review & Route",
    description:
      "The grievance is reviewed, prioritized, and routed to the appropriate department.",
    icon: GitBranch,
  },
  {
    number: "03",
    title: "Staff Resolution",
    description:
      "An assigned staff member investigates the grievance and works toward a resolution.",
    icon: UserCheck,
  },
  {
    number: "04",
    title: "Review & Close",
    description:
      "Review the proposed resolution and confirm whether the grievance can be closed.",
    icon: CheckCircle2,
  },
];

export default function HowItsWork() {
  const [activeStep, setActiveStep] = useState(0);

  const ActiveIcon = steps[activeStep].icon;

  return (
    <section
      id="how-it-works"
      className="border-t border-slate-200 bg-slate-50 py-20"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            HOW IT WORKS
          </span>

          <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            A clear path from concern to resolution.
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600">
            GRS provides a structured process so every grievance can move
            through the right stages with clear ownership and visibility.
          </p>
        </div>

        {/* Step Navigation */}
        <div className="mt-14 grid gap-3 md:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === index;

            return (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`group relative rounded-2xl border p-5 text-left transition-all ${
                  isActive
                    ? "border-blue-200 bg-white shadow-md shadow-blue-100/60"
                    : "border-slate-200 bg-white/70 hover:border-blue-100 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <span
                    className={`text-xs font-bold ${
                      isActive ? "text-blue-600" : "text-slate-400"
                    }`}
                  >
                    {step.number}
                  </span>
                </div>

                <h3 className="mt-5 text-sm font-bold text-slate-900">
                  {step.title}
                </h3>

                <div
                  className={`mt-3 h-0.5 rounded-full transition-all ${
                    isActive ? "w-10 bg-blue-600" : "w-6 bg-slate-200"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Active Step Detail */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid items-center gap-10 p-8 md:grid-cols-2 md:p-10">
            {/* Left */}
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                  <ActiveIcon className="h-6 w-6 text-blue-600" />
                </div>

                <span className="text-sm font-semibold text-blue-600">
                  Step {activeStep + 1} of {steps.length}
                </span>
              </div>

              <h3 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
                {steps[activeStep].title}
              </h3>

              <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
                {steps[activeStep].description}
              </p>

              {/* Navigation */}
              <div className="mt-7 flex items-center gap-3">
                <button
                  type="button"
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep((prev) => prev - 1)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={activeStep === steps.length - 1}
                  onClick={() => setActiveStep((prev) => prev + 1)}
                  className="flex items-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Right - Process Visual */}
            <div className="rounded-2xl bg-slate-50 p-6">
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const completed = index < activeStep;
                  const current = index === activeStep;

                  return (
                    <div key={step.number} className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                            completed
                              ? "border-teal-500 bg-teal-50 text-teal-600"
                              : current
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-200 bg-white text-slate-400"
                          }`}
                        >
                          {completed ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>

                        {index < steps.length - 1 && (
                          <div
                            className={`my-1 h-5 w-px ${
                              index < activeStep
                                ? "bg-teal-400"
                                : "bg-slate-200"
                            }`}
                          />
                        )}
                      </div>

                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            current || completed
                              ? "text-slate-900"
                              : "text-slate-400"
                          }`}
                        >
                          {step.title}
                        </p>

                        <p className="text-xs text-slate-500">
                          {completed
                            ? "Completed"
                            : current
                              ? "Current stage"
                              : "Upcoming"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
