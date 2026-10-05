"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function StaffMessageComposer({ grievanceId }: { grievanceId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = React.useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/staff/grievances/${grievanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_ADDITIONAL_INFO",
          channels: ["IN_APP", "EMAIL"],
          subject: "Request for Additional Information",
          message: message.trim(),
          requestedDocs: [], // Explicitly send empty array since we removed the input
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to request info");
      }

      toast.success("Request Sent", {
        description: "The end user has been notified.",
      });

      setMessage("");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to send request", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message to request additional info..."
          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[50px] resize-none overflow-hidden h-[50px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />

        <Button
          type="submit"
          disabled={!message.trim() || isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-[50px] px-6 shadow-sm shrink-0 flex items-center justify-center transition-all"
        >
          {isSubmitting ? (
            <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
}
