"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TrackSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ticketId, setTicketId] = useState(searchParams.get("id") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketId.trim()) {
      router.push(`/end-user/track?id=${encodeURIComponent(ticketId.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex max-w-lg mx-auto items-center gap-3">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
          placeholder="Enter Grievance ID (e.g., GRS-2026-0001)"
          className="w-full rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-3 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition shadow-sm"
          required
        />
      </div>
      <Button
        type="submit"
        className="rounded-full bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 h-auto font-bold shadow-sm transition"
      >
        Track
      </Button>
    </form>
  );
}
