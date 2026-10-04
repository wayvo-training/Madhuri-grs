"use client";

import { FileText, Loader2, Paperclip, Send, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface GrievanceCommunicationComposerProps {
  grievanceId: string;
}

interface AttachedFileItem {
  id: string;
  file: File;
}

export function GrievanceCommunicationComposer({
  grievanceId,
}: GrievanceCommunicationComposerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<AttachedFileItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: AttachedFileItem[] = Array.from(e.target.files).map(
        (file) => ({
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 9)}`,
          file,
        }),
      );
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      e.target.value = "";
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const attachmentsPayload = selectedFiles.map(({ file }) => ({
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        filePath: `/uploads/${file.name}`,
      }));

      const res = await fetch(`/api/grievances/${grievanceId}/communicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          attachments: attachmentsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send communication");
      }

      toast.success("Message Sent", {
        description:
          "Your communication has been posted to the grievance thread.",
      });

      setMessage("");
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch (err) {
      console.error("Communication error:", err);
      toast.error("Failed to send message", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs">
      {/* File chips if attached */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedFiles.map(({ id, file }) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-[#0F766E] border border-teal-200 text-xs font-medium"
            >
              <FileText className="h-3 w-3" />
              <span className="truncate max-w-[200px]">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(id)}
                className="text-slate-400 hover:text-slate-600 ml-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Input & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="flex-1 min-h-[56px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] transition resize-none"
        />

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <Paperclip className="h-3.5 w-3.5 text-slate-500" />
            <span>Attach</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!message.trim() || isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
