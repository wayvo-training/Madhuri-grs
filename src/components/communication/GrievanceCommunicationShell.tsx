"use client";

import { usePathname } from "next/navigation";
import type React from "react";
import type { CommunicationConversationSummary } from "@/lib/communication/service";
import { GrievanceCommunicationSidebar } from "./GrievanceCommunicationSidebar";

interface GrievanceCommunicationShellProps {
  conversations: CommunicationConversationSummary[];
  basePath: string;
  children: React.ReactNode;
}

export function GrievanceCommunicationShell({
  conversations,
  basePath,
  children,
}: GrievanceCommunicationShellProps) {
  const pathname = usePathname();
  const isConversationOpen = pathname !== basePath;

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[600px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-xs">
      <div
        className={`w-full md:w-[360px] lg:w-[380px] shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col ${
          isConversationOpen ? "hidden md:flex" : "flex"
        }`}
      >
        <GrievanceCommunicationSidebar
          conversations={conversations}
          basePath={basePath}
        />
      </div>
      <div
        className={`flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-950 overflow-hidden relative ${
          !isConversationOpen ? "hidden md:flex" : "flex"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
