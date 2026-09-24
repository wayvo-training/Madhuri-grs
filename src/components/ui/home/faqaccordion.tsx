"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "What is the Grievance Resolution System?",
    answer:
      "GRS is an internal platform for submitting, processing, tracking, and resolving workplace grievances through a structured workflow.",
  },
  {
    question: "What happens after I submit a grievance?",
    answer:
      "The grievance is validated and classified, priority is determined using configured rules, and it is routed to the appropriate department for processing.",
  },
  {
    question: "How is my grievance assigned to a staff member?",
    answer:
      "The system recommends suitable staff based on skills, experience, caseload balance, availability, priority, and SLA risk. The Department Head confirms the assignment.",
  },
  {
    question: "How does SLA monitoring work?",
    answer:
      "Each grievance follows its configured SLA with 50% staff reminders, 75% HOD risk warnings, and 100% automated escalation upon breach.",
  },
  {
    question: "Can more than one department work on the same grievance?",
    answer:
      "Yes. A grievance can involve multiple departments with primary and secondary involvement roles.",
  },
  {
    question: "Can I reject a proposed resolution?",
    answer:
      "Yes. If you are not satisfied, you can reject the resolution with feedback to initiate review under the reopen policy.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="border-t border-slate-200/80 bg-white py-6 sm:py-8"
    >
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:gap-10">
          {/* Left */}
          <div>
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              FAQ
            </span>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Questions, answered.
            </h2>

            <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:text-sm">
              Quick answers on submission, tracking, and resolution procedures.
            </p>
          </div>

          {/* Right */}
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-xs">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div key={faq.question}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-5 sm:py-3.5 text-left transition-colors hover:bg-slate-50/50"
                    aria-expanded={isOpen}
                  >
                    <span className="text-xs sm:text-sm font-semibold text-slate-900">
                      {faq.question}
                    </span>

                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-transform duration-200 ${
                        isOpen
                          ? "rotate-180 border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 text-slate-400"
                      }`}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-3 sm:px-5 sm:pb-3.5 text-xs leading-5 text-slate-600 animate-in fade-in duration-150">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
