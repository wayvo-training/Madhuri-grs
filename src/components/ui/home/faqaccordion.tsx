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
      className="border-t border-slate-200/80 bg-white py-12 sm:py-16"
    >
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-12">
          {/* Left */}
          <div className="space-y-2">
            <span className="inline-flex rounded-full border border-[#A5F3FC] bg-[#ECFEFF] px-3 py-1 text-xs font-semibold text-[#0E7490] shadow-2xs">
              FAQ
            </span>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Questions, answered.
            </h2>

            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              Quick answers on submission, tracking, and resolution procedures.
            </p>
          </div>

          {/* Right */}
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div
                  key={faq.question}
                  className="transition-colors hover:bg-slate-50/40"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="group flex w-full items-center justify-between gap-4 px-5 py-3.5 sm:px-6 sm:py-4 text-left cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm sm:text-[15px] font-semibold text-slate-800 group-hover:text-[#0E7490] transition-colors leading-snug">
                      {faq.question}
                    </span>

                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-transform duration-200 ${
                        isOpen
                          ? "rotate-180 border-[#A5F3FC] bg-[#ECFEFF] text-[#0E7490]"
                          : "border-slate-200 bg-slate-50 text-slate-400 group-hover:border-[#A5F3FC] group-hover:text-[#0E7490]"
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 sm:px-6 sm:pb-4.5 text-xs sm:text-[13.5px] leading-relaxed text-slate-600 border-t border-slate-100/90 pt-2.5 animate-in fade-in duration-150">
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
