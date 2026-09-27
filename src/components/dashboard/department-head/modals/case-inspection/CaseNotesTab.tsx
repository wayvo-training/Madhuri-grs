"use client";

import { MessageSquare, Send } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { GrievanceItem } from "@/types/department-head";

interface CaseNotesTabProps {
  currentGrievance: GrievanceItem;
  onAddInternalNote: (
    grievance: GrievanceItem,
    note: string,
  ) => Promise<GrievanceItem | undefined>;
  onGrievanceUpdated: (updated: GrievanceItem) => void;
}

export function CaseNotesTab({
  currentGrievance,
  onAddInternalNote,
  onGrievanceUpdated,
}: CaseNotesTabProps) {
  const [newInternalNote, setNewInternalNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInternalNote.trim() || isSubmitting) return;
    const noteText = newInternalNote.trim();
    setNewInternalNote("");
    setIsSubmitting(true);
    try {
      const updated = await onAddInternalNote(currentGrievance, noteText);
      if (updated) {
        onGrievanceUpdated(updated);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleNoteSubmit}
        className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />
            Add Department Head Directive / Internal Note
          </span>
          <span className="text-2.5 text-emerald-700">
            Visible to assigned officer
          </span>
        </div>
        <textarea
          rows={3}
          required
          value={newInternalNote}
          onChange={(e) => setNewInternalNote(e.target.value)}
          placeholder="Write instructions for the officer (e.g. 'Verify with accounts ledger before closing...')"
          className="w-full rounded-lg border border-emerald-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newInternalNote.trim() || isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#064E3B] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 disabled:opacity-50 transition cursor-pointer"
          >
            <Send className="h-3 w-3" />
            <span>
              {isSubmitting ? "Posting Note..." : "Post Directive Note"}
            </span>
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Internal Investigation & Direction Log
        </h4>
        {currentGrievance.internalNotes &&
        currentGrievance.internalNotes.length > 0 ? (
          currentGrievance.internalNotes.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs space-y-1 shadow-2xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900">
                    {n.author}
                  </span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.2 text-2.5 font-medium text-slate-600">
                    {n.role}
                  </span>
                </div>
                <span className="text-2.5 text-slate-400">{n.timestamp}</span>
              </div>
              <p className="font-normal text-slate-800 pt-1 leading-relaxed">
                {n.note}
              </p>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 italic">
            No internal notes logged yet.
          </p>
        )}
      </div>
    </div>
  );
}
