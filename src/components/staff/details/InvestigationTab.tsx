"use client";

import {
  CornerDownRight,
  Lock,
  MessageSquare,
  Reply,
  Send,
  X,
} from "lucide-react";
import type React from "react";
import { useMemo, useRef, useState } from "react";
import type { StaffGrievanceItem, StaffInternalNote } from "@/types/staff";

interface InvestigationTabProps {
  grievance: StaffGrievanceItem;
  onAddNote: (
    grievanceId: string,
    note: string,
    parentId?: string,
    replyToAuthor?: string,
  ) => Promise<void>;
}

export function InvestigationTab({
  grievance,
  onAddNote,
}: InvestigationTabProps) {
  const [newNote, setNewNote] = useState("");
  const [isPostingNote, setIsPostingNote] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    author: string;
    noteSnippet: string;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleReplyClick = (targetNote: StaffInternalNote) => {
    const parentId = targetNote.parentId || targetNote.id;
    setReplyingTo({
      id: parentId,
      author: targetNote.author,
      noteSnippet:
        targetNote.note.length > 50
          ? `${targetNote.note.slice(0, 50)}...`
          : targetNote.note,
    });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handlePostNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || isPostingNote) return;

    const noteText = newNote.trim();
    const parentId = replyingTo?.id;
    const replyToAuthor = replyingTo?.author;

    setIsPostingNote(true);
    try {
      await onAddNote(grievance.id, noteText, parentId, replyToAuthor);
      setNewNote("");
      setReplyingTo(null);
    } finally {
      setIsPostingNote(false);
    }
  };

  const notes = grievance.internalNotes || [];

  // Group notes into top-level threads and nested replies
  const { topLevelNotes, replyMap } = useMemo(() => {
    const topLevel: StaffInternalNote[] = [];
    const replies: Record<string, StaffInternalNote[]> = {};

    // Sort chronologically (oldest to newest)
    const sorted = [...notes].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });

    const noteIdSet = new Set(sorted.map((n) => n.id));

    sorted.forEach((note) => {
      if (note.parentId && noteIdSet.has(note.parentId)) {
        if (!replies[note.parentId]) {
          replies[note.parentId] = [];
        }
        replies[note.parentId].push(note);
      } else {
        topLevel.push(note);
      }
    });

    return { topLevelNotes: topLevel, replyMap: replies };
  }, [notes]);

  const renderNoteCard = (
    noteItem: StaffInternalNote,
    isNestedReply = false,
  ) => {
    const isHead = noteItem.role.toLowerCase().includes("head");
    const isStaff = noteItem.role.toLowerCase().includes("staff");

    return (
      <div
        key={noteItem.id}
        className={`rounded-xl border p-3.5 text-xs space-y-1.5 shadow-2xs transition-colors ${
          isHead
            ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20"
            : "border-blue-200 bg-blue-50/40 dark:border-blue-900/60 dark:bg-blue-950/20"
        } ${isNestedReply ? "bg-white/80 dark:bg-slate-900/60" : ""}`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {isHead
                ? noteItem.author.startsWith("Department Head")
                  ? noteItem.author
                  : `Department Head — ${noteItem.author.replace(/^(Department Head|HOD)\s*[—–-]?\s*/i, "")}`
                : isStaff
                  ? noteItem.author.startsWith("Staff")
                    ? noteItem.author
                    : `Staff — ${noteItem.author.replace(/^Staff\s*[—–-]?\s*/i, "")}`
                  : noteItem.author}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                isHead
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              }`}
            >
              {isHead
                ? "Department Head"
                : isStaff
                  ? "Staff"
                  : noteItem.role || "Internal"}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {noteItem.timestamp}
          </span>
        </div>

        {noteItem.replyToAuthor && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 pt-0.5">
            <CornerDownRight className="h-3 w-3 text-slate-400 shrink-0" />
            <span>
              Replying to{" "}
              <strong className="font-medium text-slate-700 dark:text-slate-300">
                @{noteItem.replyToAuthor}
              </strong>
            </span>
          </div>
        )}

        <p className="font-normal text-slate-800 dark:text-slate-200 pt-1 leading-relaxed whitespace-pre-wrap">
          {noteItem.note}
        </p>

        {grievance.status !== "ASSIGNED" && (
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => handleReplyClick(noteItem)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F766E] hover:text-[#115E59] dark:text-teal-400 dark:hover:text-teal-300 transition cursor-pointer"
            >
              <Reply className="h-3 w-3" />
              <span>Reply</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Section */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-[#0F766E]" />
            Internal Discussion
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Private case communication between authorized grievance participants
            for investigation, coordination, and resolution.
          </p>
        </div>
        <span className="rounded-full bg-teal-50 dark:bg-slate-800 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-slate-700 px-2.5 py-0.5 text-xs font-semibold">
          {notes.length} {notes.length === 1 ? "entry" : "entries"}
        </span>
      </div>

      {/* 2. Chronological Threaded Discussion List */}
      <div className="space-y-3.5">
        {notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
            <MessageSquare className="h-8 w-8 mx-auto text-slate-400 opacity-50" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              No internal discussion yet.
            </p>
            <p className="text-[11px] text-slate-400">
              Use the composer below to begin an internal discussion with
              Department Head and assigned staff.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {topLevelNotes.map((topNote) => {
              const childReplies = replyMap[topNote.id] || [];

              return (
                <div key={topNote.id} className="space-y-2">
                  {renderNoteCard(topNote, false)}

                  {/* Nested Replies */}
                  {childReplies.length > 0 && (
                    <div className="ml-5 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-2 mt-2">
                      {childReplies.map((replyNote) =>
                        renderNoteCard(replyNote, true),
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Composer at Bottom */}
      {grievance.status === "ASSIGNED" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3.5 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
          <Lock className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            Investigation has not started yet. Please click{" "}
            <strong>&quot;Start Investigation&quot;</strong> in the bottom
            action bar to enable internal notes and case discussions.
          </span>
        </div>
      )}

      <form
        onSubmit={handlePostNoteSubmit}
        className="rounded-xl border border-teal-200 bg-[#F0FDFA] dark:bg-slate-900/60 dark:border-slate-700 p-3.5 space-y-2.5 shadow-2xs"
      >
        {replyingTo && (
          <div className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-teal-100/70 dark:bg-teal-900/40 border border-teal-200 dark:border-teal-800/60 rounded-lg text-teal-900 dark:text-teal-200">
            <span className="flex items-center gap-1.5 font-medium truncate">
              <CornerDownRight className="h-3.5 w-3.5 text-[#0F766E] shrink-0" />
              Replying to{" "}
              <strong className="font-semibold truncate max-w-[200px]">
                {replyingTo.author}
              </strong>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
                ({replyingTo.noteSnippet})
              </span>
            </span>
            <button
              type="button"
              onClick={handleCancelReply}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer ml-2 shrink-0 inline-flex items-center gap-0.5"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#115E59] dark:text-teal-400 flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-[#0F766E]" />
            {replyingTo ? "Post Reply to Discussion" : "Internal Discussion"}
          </span>
          <span className="text-[11px] text-[#0F766E] dark:text-teal-400">
            Visible only to authorized grievance participants
          </span>
        </div>

        <textarea
          ref={textareaRef}
          rows={3}
          required
          disabled={grievance.status === "ASSIGNED"}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={
            grievance.status === "ASSIGNED"
              ? "Investigation has not started. Click 'Start Investigation' below to add notes..."
              : "Add an internal note or reply..."
          }
          className={`w-full rounded-lg border border-teal-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-[#0F766E] ${
            grievance.status === "ASSIGNED"
              ? "opacity-60 bg-slate-50 dark:bg-slate-800/40 cursor-not-allowed"
              : ""
          }`}
        />

        <div className="flex items-center justify-between">
          {replyingTo ? (
            <button
              type="button"
              onClick={handleCancelReply}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
            >
              Cancel Reply
            </button>
          ) : (
            <div />
          )}
          <button
            type="submit"
            disabled={
              grievance.status === "ASSIGNED" ||
              !newNote.trim() ||
              isPostingNote
            }
            className={`inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] disabled:opacity-50 transition ${
              grievance.status === "ASSIGNED"
                ? "cursor-not-allowed"
                : "cursor-pointer"
            }`}
          >
            {grievance.status === "ASSIGNED" ? (
              <Lock className="h-3 w-3" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            <span>
              {grievance.status === "ASSIGNED"
                ? "Notes Locked (Start Investigation First)"
                : isPostingNote
                  ? replyingTo
                    ? "Posting Reply..."
                    : "Adding Note..."
                  : replyingTo
                    ? "Post Reply"
                    : "Add Internal Note"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
