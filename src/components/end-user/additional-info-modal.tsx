"use client";

import {
  AlertCircle,
  Paperclip,
  Plus,
  Send,
  UploadCloud,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function AdditionalInfoModal({ grievanceId }: { grievanceId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const closeModal = () => {
    if (!isSubmitting) {
      setIsOpen(false);
      setMessage("");
      setFilesToUpload([]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && filesToUpload.length === 0) || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const attachmentPayloads = filesToUpload.map((f) => ({
        fileName: f.name,
        fileType: f.type || "application/octet-stream",
        fileSize: f.size,
        filePath: `/uploads/${f.name}`, // In a real app, you would upload to S3 here
      }));

      const res = await fetch(
        `/api/end-user/grievances/${grievanceId}/additional-information`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message.trim(),
            attachments: attachmentPayloads,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit information");
      }

      toast.success("Additional Information Submitted", {
        description:
          "Your information and documents have been sent to the grievance processing team.",
      });

      closeModal();
      router.refresh();
    } catch (err: any) {
      toast.error("Failed to send", {
        description: err.message || "An unexpected error occurred.",
      });
      setError(err.message || "Failed to submit information");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-5 py-2.5 text-sm font-bold shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>Provide Additional Information</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Provide Additional Information
              </h3>
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                Provide additional clarification or documents related to this
                grievance. This will be shared with the grievance processing
                team.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span className="font-medium text-xs">{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Message / Clarification
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Type your additional information..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Supporting Documents (Optional)
                  </label>
                  <div className="relative rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-slate-50/50 dark:bg-slate-900/50 p-4 transition">
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
                          + Add Documents
                        </span>
                        <span className="text-xs text-slate-400">
                          Support for PDF, PNG, JPG (Max 10MB)
                        </span>
                      </div>
                    </div>
                  </div>

                  {filesToUpload.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="grid grid-cols-1 gap-2">
                        {filesToUpload.map((f, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-xs"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <div className="flex flex-col overflow-hidden">
                                <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                                  {f.name}
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                  {Math.round(f.size / 1024)} KB
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="text-slate-400 hover:text-rose-500 p-1.5 transition cursor-pointer shrink-0"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      (!message.trim() && filesToUpload.length === 0) ||
                      isSubmitting
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" /> Send Information
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
