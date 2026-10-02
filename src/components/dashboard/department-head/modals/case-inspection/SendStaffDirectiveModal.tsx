"use client";

import { ExternalLink, Mail, MessageSquare, Send, User, X } from "lucide-react";
import { useState } from "react";
import { buildGmailComposeUrl } from "@/lib/email";
import type { GrievanceItem } from "@/types/department-head";

interface SendStaffDirectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffName: string;
  staffEmail: string;
  headSenderName: string;
  headSenderEmail?: string;
  grievance: GrievanceItem;
  onPostDirective: (note: string) => Promise<boolean>;
}

export function SendStaffDirectiveModal({
  isOpen,
  onClose,
  staffName,
  staffEmail,
  headSenderName,
  headSenderEmail,
  grievance,
  onPostDirective,
}: SendStaffDirectiveModalProps) {
  const defaultDirective = `Please provide an immediate status update on grievance ${grievance.ticketCode} (${grievance.title}).

Category: ${grievance.category} / ${grievance.subcategory}
Priority: ${grievance.priority}

Regards,
${headSenderName}${headSenderEmail ? ` <${headSenderEmail}>` : ""}
Department Head`;

  const [directiveText, setDirectiveText] = useState(defaultDirective);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const handlePostInApp = async () => {
    if (!directiveText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const fullNote = `[DIRECTIVE TO ${staffName.toUpperCase()}]: ${directiveText.trim()}`;
      const ok = await onPostDirective(fullNote);
      if (ok) {
        setSuccessMsg(true);
        setTimeout(() => {
          setSuccessMsg(false);
          onClose();
        }, 1200);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const gmailUrl = buildGmailComposeUrl({
    to: staffEmail,
    authuser: headSenderEmail || undefined,
    subject: `Directive regarding Case ${grievance.ticketCode}: ${grievance.title}`,
    body: directiveText,
  });

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Issue Officer Directive
              </h3>
              <p className="text-xs text-slate-500">
                Official instruction for Case {grievance.ticketCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Recipient Details */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-700" />
            <span className="text-slate-600 font-medium">
              Assigned Officer:
            </span>
            <strong className="text-slate-900 font-semibold">
              {staffName}
            </strong>
          </div>
          <span className="font-mono text-slate-500 text-[11px]">
            {staffEmail}
          </span>
        </div>

        {/* Directive Text Area */}
        <div className="space-y-1.5">
          <label
            htmlFor="officer-directive-input"
            className="text-xs font-semibold text-slate-700 flex items-center gap-1.5"
          >
            <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
            <span>Directive Message</span>
          </label>
          <textarea
            id="officer-directive-input"
            rows={6}
            value={directiveText}
            onChange={(e) => setDirectiveText(e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 leading-relaxed font-sans"
            placeholder="Type directive for the officer..."
          />
        </div>

        {successMsg && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-center text-xs font-semibold text-emerald-800">
            ✓ Directive successfully recorded into case timeline & audit log!
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-2 border-t border-slate-100">
          <a
            href={gmailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            title="Open in Gmail Web App"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            <span>Open Draft in Gmail</span>
          </a>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePostInApp}
              disabled={isSubmitting || !directiveText.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {isSubmitting ? "Posting..." : "Post Directive to Case"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
