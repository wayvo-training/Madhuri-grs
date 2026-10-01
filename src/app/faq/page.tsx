"use client";

import { ArrowRight, ChevronDown, HelpCircle, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/ui/home/footer";
import Navbar from "@/components/ui/home/navbar";

interface FaqItem {
  category: "General" | "SLA & Governance" | "Departments & Review";
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    category: "General",
    question: "What is the Grievance Resolution System (GRS)?",
    answer:
      "GRS is an institutional platform for submitting, routing, tracking, and resolving workplace grievances through a structured, auditable, and transparent workflow.",
  },
  {
    category: "General",
    question: "How do I submit and track my grievance?",
    answer:
      "Once you log in, fill out the grievance form with details and attachments. You will receive a unique tracking reference (e.g. GRS-2026-0001) that allows you to inspect real-time progress directly from the home page.",
  },
  {
    category: "Departments & Review",
    question: "What happens after I submit a grievance?",
    answer:
      "The grievance is automatically validated and classified by the taxonomy engine. Its priority is computed using organizational rules, and it is routed to the appropriate Primary and Secondary handling departments.",
  },
  {
    category: "Departments & Review",
    question: "How is my grievance assigned to an investigator?",
    answer:
      "The system computes an investigator match based on required skill tags, relevant department experience, current caseload balance (maximum 5 active cases), and leave schedules. The Department Head confirms the final assignment.",
  },
  {
    category: "SLA & Governance",
    question: "How does SLA monitoring and escalation work?",
    answer:
      "Every grievance is bound to a strict SLA. At 50% elapsed time, the assigned investigator receives an advisory reminder. At 75% elapsed time, the Department Head is alerted to At Risk status while the investigator is retained. If 100% of the SLA window expires without resolution, the grievance automatically breaches and escalates to the Department Head review queue.",
  },
  {
    category: "Departments & Review",
    question: "Can more than one department work on the same grievance?",
    answer:
      "Yes. A grievance can involve multiple departments simultaneously. A Primary Department leads resolution, while Secondary Departments complete parallel sub-investigations and internal reviews.",
  },
  {
    category: "Departments & Review",
    question: "Can I reject a proposed resolution?",
    answer:
      "Yes. If you are not satisfied with the proposed resolution, you can reject it by providing detailed feedback. The grievance then transitions back for further investigation under the organization's reopen policy.",
  },
  {
    category: "SLA & Governance",
    question: "Can a grievance be reopened more than once?",
    answer:
      "Reopening is controlled by the configured organizational reopen threshold. Once the permitted reopen count is exhausted, the grievance is elevated for executive Department Head review to ensure fairness and finality.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = [
    "All",
    "General",
    "SLA & Governance",
    "Departments & Review",
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans antialiased">
      <Navbar />

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-slate-50/70 border-b border-slate-200/80 pt-10 pb-8 sm:pt-12 sm:pb-9">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A5F3FC] bg-teal-light px-3.5 py-1 text-xs font-semibold text-teal-primary shadow-2xs">
              <HelpCircle className="h-3.5 w-3.5 text-teal-primary" />
              HELP CENTER
            </span>

            <h1 className="mt-3.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
              Frequently Asked Questions
            </h1>

            <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-slate-600">
              Clear answers on grievance submission, investigator allocation,
              and SLA escalation rules.
            </p>

            {/* Search Bar & Category Filter */}
            <div className="mx-auto mt-5 max-w-lg">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions or keywords..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-900 shadow-2xs transition-all placeholder:text-slate-400 focus:border-teal-primary focus:outline-none focus:ring-2 focus:ring-teal-primary/20"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    activeCategory === cat
                      ? "bg-teal-primary text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-teal-light/50 hover:border-[#A5F3FC] hover:text-teal-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Accordion List */}
        <section className="py-7 sm:py-10">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            {filteredFaqs.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
                <p className="text-xs sm:text-sm font-semibold">
                  No questions match your search.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All");
                  }}
                  className="mt-2 text-xs sm:text-sm font-semibold text-teal-primary hover:text-teal-deep underline cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                {filteredFaqs.map((faq, index) => {
                  const isOpen = openIndex === index;

                  return (
                    <div
                      key={faq.question}
                      className="px-5 py-3.5 sm:px-6 sm:py-4 transition-colors hover:bg-slate-50/40"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenIndex(isOpen ? null : index)}
                        className="group flex w-full items-center justify-between gap-4 text-left cursor-pointer"
                      >
                        <div className="pr-2 space-y-1">
                          <h3 className="text-sm sm:text-[15px] font-semibold text-slate-800 group-hover:text-teal-primary transition-colors leading-snug">
                            {faq.question}
                          </h3>
                        </div>

                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-transform duration-200 ${
                            isOpen
                              ? "rotate-180 border-[#A5F3FC] bg-teal-light text-teal-primary"
                              : "border-slate-200 bg-slate-50 text-slate-400 group-hover:border-[#A5F3FC] group-hover:text-teal-primary"
                          }`}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="mt-2.5 pr-4 text-xs sm:text-[13.5px] leading-relaxed text-slate-600 border-t border-slate-100/90 pt-2.5 animate-in fade-in duration-150">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Compact Bottom Helper Strip */}
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-[#A5F3FC] bg-teal-light/60 px-4 py-3 text-xs text-slate-600">
              <span className="font-medium text-slate-700">
                Need specific case assistance?
              </span>
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="font-semibold text-teal-primary hover:text-teal-deep inline-flex items-center gap-1"
                >
                  Log in to portal
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <span className="text-slate-300">•</span>
                <Link
                  href="/"
                  className="font-medium text-slate-600 hover:text-slate-900"
                >
                  Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
