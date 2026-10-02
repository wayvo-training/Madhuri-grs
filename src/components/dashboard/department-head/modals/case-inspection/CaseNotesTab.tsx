"use client";

import { MessageSquare, Send } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
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
  const grievanceRef = useRef(currentGrievance);
  grievanceRef.current = currentGrievance;

  // Sync latest notes from server on tab open/grievance change
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/department-head/grievances/${currentGrievance.id}/notes`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((json) => {
        if (isMounted && json?.success && Array.isArray(json.notes)) {
          onGrievanceUpdated({
            ...grievanceRef.current,
            internalNotes: json.notes,
          });
        }
      })
      .catch((err) => {
        console.warn("Failed to refresh internal notes:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [currentGrievance.id, onGrievanceUpdated]);

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

  const notes = currentGrievance.internalNotes || [];

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleNoteSubmit}
        className="rounded-xl border border-teal-200 bg-[#F0FDFA] p-3.5 space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#115E59] flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-[#0F766E]" />
            Internal Case Note
          </span>
          <span className="text-[11px] text-[#0F766E]">
            Visible to assigned Staff
          </span>
        </div>
        <textarea
          rows={3}
          required
          value={newInternalNote}
          onChange={(e) => setNewInternalNote(e.target.value)}
          placeholder="Enter note for assigned Staff (e.g. 'Please verify the employee\'s previous performance evaluation records before preparing the final resolution.')"
          className="w-full rounded-lg border border-teal-200 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0F766E]"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!newInternalNote.trim() || isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] disabled:opacity-50 transition cursor-pointer"
          >
            <Send className="h-3 w-3" />
            <span>{isSubmitting ? "Adding Note..." : "Add Internal Note"}</span>
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Internal Investigation &amp; Case Communication History (
          {notes.length})
        </h4>
        {notes.length > 0 ? (
          <div className="space-y-2.5">
            {notes.map((n) => {
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
            No internal case notes logged yet.
          </p>
        )}
      </div>
    </div>
  );
}
