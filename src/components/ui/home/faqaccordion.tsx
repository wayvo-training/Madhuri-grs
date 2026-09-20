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
      "The system can recommend suitable staff based on configured assignment factors such as required skills, relevant experience, workload, availability, priority, and SLA risk. The Department Head makes the final assignment.",
  },
  {
    question: "How does SLA monitoring work?",
    answer:
      "Each grievance follows its configured SLA. The system monitors the SLA throughout processing and can send configured reminders and escalations as defined by the organization.",
  },
  {
    question: "Can more than one department work on the same grievance?",
    answer:
      "Yes. A grievance can involve multiple departments. Departments can work on their respective activities while remaining associated with the same grievance.",
  },
  {
    question: "Can I reject a proposed resolution?",
    answer:
      "Yes. If you are not satisfied with the proposed resolution, you can reject it by providing a reason. The system then follows the configured reopen policy.",
  },
  {
    question: "Can a grievance be reopened more than once?",
    answer:
      "Reopening is controlled by the organization's configured reopen policy. Once the permitted reopen count is reached, the grievance can be sent for Department Head review according to the configured process.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          {/* Left */}
          <div className="lg:pr-8">
            <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              FAQ
            </span>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-black sm:text-4xl">
              Questions, answered clearly.
            </h2>

            <p className="mt-4 max-w-md text-base leading-7 text-black">
              Learn how grievances move through the system and how the different
              stages work.
            </p>
          </div>

          {/* Right */}
          <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div key={faq.question}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors hover:bg-slate-50"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold text-black">
                      {faq.question}
                    </span>

                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`grid transition-all duration-200 ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 pr-14 text-sm leading-6 text-black">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
