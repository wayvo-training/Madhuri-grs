"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  MessageSquare,
  Clock,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import type { CommunicationConversationSummary } from "@/lib/communication/service";

interface GrievanceCommunicationSidebarProps {
  conversations: CommunicationConversationSummary[];
  basePath: string;
}

type FilterTab = "ALL" | "ACTION_REQUIRED" | "RESPONSES" | "UPDATES";

export function GrievanceCommunicationSidebar({
  conversations,
  basePath,
}: GrievanceCommunicationSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");

  const counts = useMemo(() => {
    return {
      ALL: conversations.length,
      ACTION_REQUIRED: conversations.filter(
        (c) => c.filterCategory === "ACTION_REQUIRED",
      ).length,
      RESPONSES: conversations.filter((c) => c.filterCategory === "RESPONSES")
        .length,
      UPDATES: conversations.filter((c) => c.filterCategory === "UPDATES")
        .length,
    };
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // 1. Tab filter
      if (activeFilter !== "ALL" && c.filterCategory !== activeFilter) {
        return false;
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = c.grievanceNumber.toLowerCase().includes(q);
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchPreview = c.lastMessagePreview.toLowerCase().includes(q);
        const matchSender = c.sender.toLowerCase().includes(q);
        const matchState = c.communicationState.toLowerCase().includes(q);
        if (
          !matchNumber &&
          !matchTitle &&
          !matchPreview &&
          !matchSender &&
          !matchState
        ) {
          return false;
        }
      }

      return true;
    });
  }, [conversations, activeFilter, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none">
      {/* 1. Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Grievance Communication
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-[#0F766E] border border-teal-200">
              {conversations.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Communicate with the people involved in your grievances.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search grievances or messages..."
            className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter("ALL")}
            className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeFilter === "ALL"
                ? "bg-[#0F766E] text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70"
            }`}
          >
            All ({counts.ALL})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("ACTION_REQUIRED")}
            className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeFilter === "ACTION_REQUIRED"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70"
            }`}
          >
            Action Required
            {counts.ACTION_REQUIRED > 0 && (
              <span className="ml-1 px-1 rounded-full bg-amber-500/20 text-[10px]">
                {counts.ACTION_REQUIRED}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("RESPONSES")}
            className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeFilter === "RESPONSES"
                ? "bg-teal-700 text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70"
            }`}
          >
            Responses ({counts.RESPONSES})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("UPDATES")}
            className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeFilter === "UPDATES"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200/70"
            }`}
          >
            Updates ({counts.UPDATES})
          </button>
        </div>
      </div>

      {/* 2. Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <MessageSquare className="h-8 w-8 mx-auto opacity-40" />
            <p className="text-xs">No grievance communication found.</p>
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isActive = pathname === `${basePath}/${c.id}`;

            const isActionReq = c.filterCategory === "ACTION_REQUIRED";
            const isClosed = c.status === "CLOSED";

            return (
              <Link
                key={c.id}
                href={`${basePath}/${c.id}`}
                className={`block p-3.5 transition-colors border-l-4 ${
                  isActive
                    ? "bg-teal-50/60 dark:bg-teal-950/20 border-l-[#0F766E]"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-transparent"
                }`}
              >
                {/* Top Row: Grievance Number + Last Updated */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {c.isUnread && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                    )}
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {c.grievanceNumber}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0">
                    {c.lastUpdated}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mb-1.5">
                  {c.title}
                </h4>

                {/* State Tag */}
                <div className="mb-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      isClosed
                        ? "bg-slate-100 text-slate-600 border border-slate-200"
                        : isActionReq
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-teal-50 text-[#0F766E] border border-teal-200"
                    }`}
                  >
                    {c.communicationState}
                  </span>
                </div>

                {/* Preview */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
                  {c.lastMessagePreview}
                </p>

                {/* Footer: Sender & Attachment Indicator */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="truncate max-w-[180px]">
                    {c.sender}
                  </span>
                  {c.hasAttachments && (
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Paperclip className="h-3 w-3" />
                      Attached
                    </span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
