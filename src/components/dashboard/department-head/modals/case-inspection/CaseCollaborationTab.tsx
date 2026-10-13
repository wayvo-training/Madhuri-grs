"use client";

import { CheckCircle2, Clock, MessageSquare, Send, Users } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { GrievanceItem } from "@/types/department-head";

interface CaseCollaborationTabProps {
  currentGrievance: GrievanceItem;
  onAddCollaborationNote: (
    grievance: GrievanceItem,
    note: string,
    parentId?: string,
    replyToAuthor?: string,
  ) => Promise<GrievanceItem | undefined>;
  onGrievanceUpdated: (updated: GrievanceItem) => void;
}

export function CaseCollaborationTab({
  currentGrievance,
  onAddCollaborationNote,
  onGrievanceUpdated,
}: CaseCollaborationTabProps) {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const grievanceRef = useRef(currentGrievance);
  grievanceRef.current = currentGrievance;

  // Sync latest notes from server on mount
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/department-head/grievances/${currentGrievance.id}/notes`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((json) => {
        if (isMounted && json?.success) {
          onGrievanceUpdated({
            ...grievanceRef.current,
            collaborationNotes: json.collaborationNotes || [],
            internalNotes:
              json.internalNotes || grievanceRef.current.internalNotes || [],
          });
        }
      })
      .catch((err) => {
        console.warn("Failed to refresh collaborative notes:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [currentGrievance.id, onGrievanceUpdated]);

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || isSubmitting) return;
    const noteText = newNote.trim();
    setNewNote("");
    setIsSubmitting(true);
    try {
      const updated = await onAddCollaborationNote(currentGrievance, noteText);
      if (updated) {
        onGrievanceUpdated(updated);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const departments = currentGrievance.departmentsInvolved || [];
  const notes = currentGrievance.collaborationNotes || [];

  return (
    <div className="space-y-6 text-xs animate-in fade-in duration-150">
      {/* Departments Involved Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
            <Users className="h-4 w-4 text-[#0F766E]" />
            Department Progress &amp; Assignments ({departments.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Multi-Department Shared Responsibility
          </span>
        </div>

        {departments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center text-slate-400">
            No collaborating departments configured.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {departments.map((dept) => {
              const isCompleted =
                dept.status === "COMPLETED" ||
                dept.status === "RESOLVED" ||
                dept.status === "CLOSED";
              return (
                <div
                  key={dept.id}
                  className={`rounded-xl border p-3.5 space-y-2 shadow-2xs ${
                    dept.involvementType === "PRIMARY"
                      ? "border-teal-200 bg-teal-50/60 dark:border-teal-800/80 dark:bg-slate-900/90"
                      : dept.involvementType === "EQUAL"
                        ? "border-blue-200 bg-blue-50/60 dark:border-blue-800/80 dark:bg-slate-900/90"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {dept.departmentName}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                        dept.involvementType === "PRIMARY"
                          ? "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
                          : dept.involvementType === "EQUAL"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {dept.involvementType}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Staff Assigned:
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {dept.assignedStaff || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Progress Status:
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-slate-800 dark:text-slate-100">
                        {isCompleted ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Clock className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                        )}
                        {dept.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cross-Department Communication Thread */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
            <MessageSquare className="h-4 w-4 text-[#0F766E]" />
            Cross-Department Collaboration Notes
          </span>
          <span className="text-[11px] text-slate-500">
            Visible to all involved HODs &amp; assigned officers
          </span>
        </div>

        {/* Note Composer */}
        <form
          onSubmit={handleNoteSubmit}
          className="rounded-xl border border-teal-200 bg-[#F0FDFA] dark:border-teal-800/80 dark:bg-slate-900/90 p-3.5 space-y-2.5 shadow-2xs"
        >
          <label
            htmlFor="collab-note-input"
            className="text-[11px] font-semibold text-[#115E59] dark:text-teal-300 block"
          >
            Send Directive / Joint Case Note
          </label>
          <textarea
            id="collab-note-input"
            rows={2}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Share instructions, joint findings, or handoff updates with collaborating departments..."
            className="w-full rounded-lg border border-teal-200 bg-white p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#0F766E] focus:ring-1 focus:ring-[#0F766E] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-500"
          />
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Notifies assigned staff and partner HODs immediately.
            </span>
            <button
              type="submit"
              disabled={!newNote.trim() || isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#115E59] disabled:opacity-50 transition cursor-pointer shadow-2xs"
            >
              <Send className="h-3 w-3" />
              <span>{isSubmitting ? "Sending..." : "Post Directive"}</span>
            </button>
          </div>
        </form>

        {/* Notes Timeline */}
        <div className="space-y-2.5 pt-1">
          {notes.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 p-4 text-center text-slate-400">
              No collaborative notes posted yet. Post the first message above.
            </div>
          ) : (
            notes.map((n) => {
              return (
                <div
                  key={n.id}
                  className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/90 p-3.5 space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {n.author}
                      </span>
                      <span className="rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 text-[9px] font-bold">
                        {n.role}
                      </span>
                    </div>
                    <span className="text-slate-400 text-[10px]">
                      {n.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {n.note}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
