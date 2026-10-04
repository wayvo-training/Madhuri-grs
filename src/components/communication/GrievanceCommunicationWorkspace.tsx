"use client";

import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  MessageSquare,
  Paperclip,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { GrievanceCommunicationThreadData } from "@/lib/communication/service";
import { GrievanceCommunicationComposer } from "./GrievanceCommunicationComposer";

interface GrievanceCommunicationWorkspaceProps {
  data: GrievanceCommunicationThreadData;
}

export function GrievanceCommunicationWorkspace({
  data,
}: GrievanceCommunicationWorkspaceProps) {
  const [isParticipantsExpanded, setIsParticipantsExpanded] = useState(false);

  const isClosed = data.isClosed || data.status === "CLOSED";

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden relative select-text">
      {/* 1. RIGHT PANEL HEADER */}
      <div className="flex-none p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shadow-2xs space-y-2">
        {data.basePath && (
          <Link
            href={data.basePath}
            className="md:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0F766E] transition mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Conversations</span>
          </Link>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Grievance Identity */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                {data.grievanceNumber}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                {data.title}
              </h2>
            </div>

            {/* Hierarchy & Status */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span>{data.categoryName}</span>
              <span>•</span>
              <span>{data.subcategoryName}</span>
              <span>•</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isClosed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : data.status === "RESOLVED"
                      ? "bg-teal-50 text-teal-700 border-teal-200"
                      : data.status === "WAITING_ON_USER"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                Status: {data.status}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={data.actionUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/80 text-[#0F766E] text-xs font-semibold shadow-2xs transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{data.actionLabel}</span>
            </Link>
          </div>
        </div>

        {/* Participants Strip with Expansion Toggle */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5 min-w-0">
            <Users className="h-3.5 w-3.5 text-[#0F766E] shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 shrink-0">
              Participants:
            </span>
            <span className="truncate text-slate-600 dark:text-slate-400">
              {data.participantsSummary || "Authorized Grievance Participants"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsParticipantsExpanded(!isParticipantsExpanded)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F766E] hover:text-[#115E59] transition cursor-pointer shrink-0"
          >
            <span>{isParticipantsExpanded ? "Hide" : "Details"}</span>
            {isParticipantsExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* Expandable Compact Participants Panel */}
        {isParticipantsExpanded && (
          <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>Grievance Participants ({data.participants.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {data.participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-full bg-teal-100 text-[#0F766E] flex items-center justify-center font-bold text-[10px] shrink-0">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {p.role}
                      {p.departmentName ? ` — ${p.departmentName}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. CHRONOLOGICAL COMMUNICATION AREA */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/40 dark:bg-slate-950/40 space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#0F766E]" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              Grievance Communication
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {data.timeline.length} milestone
            {data.timeline.length !== 1 ? "s" : ""}
          </span>
        </div>

        {data.timeline.length === 0 ? (
          <div className="text-center p-8 text-slate-400 space-y-2">
            <MessageSquare className="h-8 w-8 mx-auto opacity-40" />
            <p className="text-xs">No communication recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.timeline.map((msg) => {
              const isStaff = msg.isStaffOrHead;
              const formattedTime = new Date(msg.timestamp).toLocaleTimeString(
                "en-IN",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );
              const formattedDate = new Date(msg.timestamp).toLocaleDateString(
                "en-IN",
                {
                  day: "numeric",
                  month: "short",
                },
              );

              if (msg.type === "SUBMISSION" || msg.role === "System") {
                return (
                  <div key={msg.id} className="flex justify-center my-2 w-full">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        System Event:
                      </span>
                      <span>{msg.message}</span>
                      <span className="text-[10px] text-slate-400">
                        • {formattedDate}, {formattedTime}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isStaff ? "items-start" : "items-start"
                  }`}
                >
                  {/* Author, Role, Department & Timestamp Header */}
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {msg.author}
                    </span>
                    <span>•</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {msg.role}
                      {msg.department ? ` · ${msg.department}` : ""}
                    </span>
                    <span>•</span>
                    <span className="text-[11px] text-slate-400">
                      {formattedDate}, {formattedTime}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[95%] sm:max-w-[85%] rounded-2xl p-4 shadow-2xs border ${
                      msg.type === "RESOLUTION" || msg.type === "REVIEW"
                        ? "bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800/60 text-slate-900 dark:text-slate-100"
                        : msg.type === "REQUEST"
                          ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/60 text-slate-900 dark:text-slate-100"
                          : "bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-xs sm:text-[13px] leading-relaxed">
                      {msg.message}
                    </p>

                    {/* Attachments */}
                    {msg.attachments.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          Attachments ({msg.attachments.length}):
                        </span>
                        <ul className="flex flex-wrap gap-1.5 pt-0.5">
                          {msg.attachments.map((att) => (
                            <li
                              key={`${msg.id}-${att.path || att.name}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium"
                            >
                              <Paperclip className="h-3 w-3 text-slate-400" />
                              <span className="truncate max-w-[220px]">
                                {att.name}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. MESSAGE COMPOSER OR CLOSURE NOTE */}
      {data.canSend ? (
        <GrievanceCommunicationComposer grievanceId={data.grievanceId} />
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 p-3.5 text-center shadow-2xs">
          <div className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>
              {data.closureNote ||
                "Historical communication remains available for reference."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
