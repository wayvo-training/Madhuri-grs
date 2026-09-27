"use client";

import {
  ExternalLink,
  HelpCircle,
  Mail,
  MessageSquare,
  Send,
  Shield,
  User,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import {
  buildGmailComposeUrl,
  buildStaffComplainantInquiryEmail,
  buildStaffHodEscalationEmail,
} from "@/lib/email";

export interface AssignedCaseEmailItem {
  id: string;
  ticketCode: string;
  title: string;
  category: string;
  priority: string;
  submitterName: string;
  submitterEmail: string;
}

export interface StaffEmailHubProps {
  staffName: string;
  staffEmail: string;
  departmentName: string;
  hodName?: string | null;
  hodEmail?: string | null;
  assignedCases: AssignedCaseEmailItem[];
}

export function StaffEmailHub({
  staffName,
  staffEmail,
  departmentName,
  hodName,
  hodEmail,
  assignedCases,
}: StaffEmailHubProps) {
  const [selectedCase, setSelectedCase] =
    useState<AssignedCaseEmailItem | null>(assignedCases[0] || null);

  const directGmailUrl = `https://mail.google.com/mail/?authuser=${encodeURIComponent(
    staffEmail,
  )}`;

  const hodComposeUrl = hodEmail
    ? buildGmailComposeUrl(
        buildStaffHodEscalationEmail({
          hodEmail,
          hodName: hodName || "Department Head",
          staffName,
          staffEmail,
          grievance: {
            ticketCode: selectedCase?.ticketCode || "GENERAL",
            title: selectedCase?.title || "Department Matters",
            priority: selectedCase?.priority || "Normal",
          },
        }),
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner: Official Mailbox Info */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Staff Communications & Mail Desk
                </h3>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  Official Account Active
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Staff Email:{" "}
                <strong className="font-semibold text-slate-800">
                  {staffEmail}
                </strong>{" "}
                &bull; {departmentName}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={directGmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open Official Gmail</span>
            </a>
            {hodComposeUrl && (
              <a
                href={hodComposeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                title={`Contact Department Head (${hodName || "HOD"})`}
              >
                <Shield className="h-3.5 w-3.5 text-emerald-700" />
                <span>Email HOD ({hodName || "Head"})</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Active Cases Direct Contact vs Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Active Assigned Cases Complainant Contact */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Direct Citizen Inquiry Desk
              </h4>
              <p className="text-xs text-slate-500">
                Send official pre-formatted inquiries to citizens regarding
                their assigned grievances
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {assignedCases.length} Active{" "}
              {assignedCases.length === 1 ? "Case" : "Cases"}
            </span>
          </div>

          {assignedCases.length > 0 ? (
            <div className="space-y-3">
              {assignedCases.map((c) => {
                const isSelected = selectedCase?.id === c.id;
                const inquiryUrl = buildGmailComposeUrl(
                  buildStaffComplainantInquiryEmail({
                    complainantEmail: c.submitterEmail,
                    complainantName: c.submitterName,
                    staffName,
                    staffEmail,
                    staffDesignation: "Investigating Officer",
                    grievance: {
                      ticketCode: c.ticketCode,
                      title: c.title,
                      category: c.category,
                      priority: c.priority,
                    },
                  }),
                );

                return (
                  <div
                    key={c.id}
                    className={`rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/30 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded">
                            {c.ticketCode}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 line-clamp-1">
                            {c.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <User className="h-3 w-3 text-slate-400" />
                            {c.submitterName}
                          </span>
                          <span>&bull;</span>
                          <span className="text-slate-600 font-mono text-[11px]">
                            {c.submitterEmail}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedCase(c)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                            isSelected
                              ? "bg-[#0F766E] text-white"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          Select
                        </button>
                        <a
                          href={inquiryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#115E59] transition cursor-pointer"
                          title={`Send official inquiry to ${c.submitterName} via Gmail`}
                        >
                          <Send className="h-3 w-3" />
                          <span>Email Citizen</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center space-y-2">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <UserCheck className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">
                No active grievance assignments currently queued
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When the Department Head assigns investigation tickets to you,
                they will appear here with one-click direct communication
                options.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Protocols & Quick Guidance */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <MessageSquare className="h-4 w-4 text-emerald-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Staff Email Guidelines
              </h4>
            </div>
            <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700">&bull;</span>
                <span>
                  Always keep the <strong>Grievance Ticket ID</strong> in your
                  email subject line so responses can be mapped back to the case
                  record.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700">&bull;</span>
                <span>
                  Send messages exclusively from your official organization
                  account (<strong>{staffEmail}</strong>).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-emerald-700">&bull;</span>
                <span>
                  All critical findings and complainant replies should be
                  summarized in the investigation report before submitting for
                  resolution.
                </span>
              </li>
            </ul>
          </div>

          {hodName && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-amber-700" />
                <h5 className="text-xs font-bold text-amber-900">
                  Need Department Guidance?
                </h5>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                If a case requires policy clearance or inter-department
                coordination, contact Department Head <strong>{hodName}</strong>{" "}
                ({hodEmail || "Email on file"}).
              </p>
              {hodComposeUrl && (
                <a
                  href={hodComposeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 hover:text-amber-950 underline"
                >
                  <span>Launch Guidance Request Draft &rarr;</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
