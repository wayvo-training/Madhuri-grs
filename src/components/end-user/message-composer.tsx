"use client";

import React, { useState } from "react";
import { UploadCloud, Paperclip, X, Send, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function MessageComposer({ grievanceId, userEmail }: { grievanceId: string, userEmail: string }) {
  const router = useRouter();
  const [responseText, setResponseText] = useState("");
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = React.useRef(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFilesToUpload((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFilesToUpload((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim() || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const attachmentPayloads = filesToUpload.map((f) => ({
        fileName: f.name,
        fileType: f.type || "application/octet-stream",
        fileSize: f.size,
        filePath: `/uploads/${f.name}`,
      }));

      const res = await fetch(`/api/grievances/${grievanceId}/respond-info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseMessage: responseText.trim(),
          attachments: attachmentPayloads,
          email: userEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit response");
      }

      // Show success toast
      toast.success("Response sent successfully", {
        description: "Your information has been sent to the processing team.",
      });

      // Clear form
      setResponseText("");
      setFilesToUpload([]);
      isSubmittingRef.current = false;
      setIsSubmitting(false);

      // Refresh data without full page reload
      router.refresh();
    } catch (err: any) {
      toast.error("Failed to send", {
        description: err.message || "An unexpected error occurred.",
      });
      setError(err.message || "Failed to submit response");
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Your Response</h3>
        <p className="text-xs text-slate-500 mb-4">Submit the required information or documents requested by staff.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="font-medium text-xs">{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <textarea
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          rows={4}
          placeholder="Type your response here..."
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Attachments</label>
        <div className="relative rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-900 p-4 transition">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex items-center gap-3 text-slate-500">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                Add Documents
              </span>
              <span className="text-xs text-slate-400">
                Support for PDF, PNG, JPG (Max 10MB)
              </span>
            </div>
          </div>
        </div>

        {filesToUpload.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filesToUpload.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{f.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-slate-400 hover:text-rose-500 p-1 transition cursor-pointer shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!responseText.trim() || isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
        >
          <Send className="h-4 w-4" />
          <span>{isSubmitting ? "Sending..." : "Send Response"}</span>
        </button>
      </div>
    </form>
  );
}
