"use client";

import { MessageSquare, Send } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { StaffGrievanceItem } from "@/types/staff";

interface InvestigationTabProps {
  grievance: StaffGrievanceItem;
  onAddNote: (grievanceId: string, note: string) => Promise<void>;
}

export function InvestigationTab({
  grievance,
  onAddNote,
}: InvestigationTabProps) {
  const [newNote, setNewNote] = useState("");
  const [isPostingNote, setIsPostingNote] = useState(false);

  const handlePostNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || isPostingNote) return;
    setIsPostingNote(true);
    try {
      await onAddNote(grievance.id, newNote.trim());
      setNewNote("");
    } finally {
      setIsPostingNote(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Note Form */}
      <form
        onSubmit={handlePostNoteSubmit}
        className="rounded-xl border border-teal-200 bg-[#F0FDFA] p-3.5 space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#115E59] flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-[#0F766E]" />
            Investigation Notes / Internal Communication
          </span>
          <span className="text-[11px] text-[#0F766E]">
            Visible to Department Head
          </span>
        </div>
        <textarea
          rows={3}
          required
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Record investigation findings or note for Department Head (e.g. 'I reviewed the submitted performance records. The previous evaluation contains a conflicting rating, so additional clarification may be required.')"
          className="w-full rounded-lg border border-teal-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0F766E]"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newNote.trim() || isPostingNote}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] disabled:opacity-50 transition cursor-pointer"
          >
            <Send className="h-3 w-3" />
            <span>{isPostingNote ? "Logging..." : "Log Note"}</span>
          </button>
        </div>
      </form>

      {/* Two-Way Internal Case Notes */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Internal Case Communication ({grievance.internalNotes?.length || 0})
        </h4>
        {grievance.internalNotes && grievance.internalNotes.length > 0 ? (
          <div className="space-y-2.5">
            {grievance.internalNotes.map((n) => {
              const isHead = n.role.toLowerCase().includes("head");
              return (
                <div
                  key={n.id}
                  className={`rounded-xl border p-3.5 text-xs space-y-1.5 shadow-2xs ${
                    isHead
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-blue-200 bg-blue-50/40"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {isHead
                          ? n.author.startsWith("Department Head")
                            ? n.author
                            : `Department Head — ${n.author.replace(/^(Department Head|HOD)\s*[—–-]?\s*/i, "")}`
                          : n.author.startsWith("Staff")
                            ? n.author
                            : `Staff — ${n.author.replace(/^Staff\s*[—–-]?\s*/i, "")}`}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          isHead
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {isHead ? "Internal Note" : "Investigation Note"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {n.timestamp}
                    </span>
                  </div>
                  <p className="font-normal text-slate-800 pt-1 leading-relaxed whitespace-pre-wrap">
                    {n.note}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            No internal case communication logged yet.
          </p>
        )}
      </div>
    </div>
  );
}
