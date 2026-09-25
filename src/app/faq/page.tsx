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
        {/* Compact Header Section */}
        <section className="bg-slate-50/70 border-b border-slate-200/80 pt-8 pb-6 sm:pt-10 sm:pb-7">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-800">
              <HelpCircle className="h-3.5 w-3.5 text-emerald-700" />
              HELP CENTER
            </span>

            <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Frequently Asked Questions
            </h1>

            <p className="mx-auto mt-1.5 max-w-lg text-xs leading-5 text-slate-500 sm:text-sm">
              Clear answers on submission, investigator allocation, and SLA
              escalation rules.
            </p>

            {/* Compact Search Bar & Category Filter */}
            <div className="mx-auto mt-4 max-w-md">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions or keywords..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3.5 text-xs text-slate-900 shadow-2xs transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                    activeCategory === cat
                      ? "bg-[#064E3B] text-white shadow-2xs"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Compact FAQ Accordion List */}
        <section className="py-6 sm:py-8">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            {filteredFaqs.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                <p className="text-xs font-semibold">
                  No questions match your search.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All");
                  }}
                  className="mt-1.5 text-xs font-semibold text-emerald-800 underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-xs">
                {filteredFaqs.map((faq, index) => {
                  const isOpen = openIndex === index;

                  return (
                    <div
                      key={faq.question}
                      className="px-4 py-3 sm:px-5 sm:py-3.5 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenIndex(isOpen ? null : index)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <div className="pr-2">
                          <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-2.25 font-semibold text-slate-600 uppercase tracking-wider mb-1">
                            {faq.category}
                          </span>
                          <h3 className="text-sm font-semibold text-slate-900">
                            {faq.question}
                          </h3>
                        </div>

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
                        <div className="mt-2 pr-6 text-xs leading-5 text-slate-600 border-t border-slate-50 pt-2 animate-in fade-in duration-150">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Compact Bottom Helper Strip */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-xs text-slate-600">
              <span className="font-medium text-slate-700">
                Need specific case assistance?
              </span>
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1"
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
