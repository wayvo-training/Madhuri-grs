"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { SerializedAuditLog } from "@/types/admin/audit";

interface AuditPayloadDrawerProps {
  expandedLogId: string | null;
  logs: SerializedAuditLog[];
  onClose: () => void;
}

export function AuditPayloadDrawer({
  expandedLogId,
  logs,
  onClose,
}: AuditPayloadDrawerProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "new" | "old">(
    "side-by-side",
  );
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!expandedLogId) return null;

  const activeLog = logs.find((l) => l.audit_log_id === expandedLogId);
  const hasOld =
    activeLog?.old_value !== undefined && activeLog?.old_value !== null;
  const hasNew =
    activeLog?.new_value !== undefined && activeLog?.new_value !== null;

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-900 p-5 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200">
            Audit Event Payload (ID: #{expandedLogId})
          </span>
          <span className="text-[11px] text-slate-400">
            Action:{" "}
            <span className="text-emerald-400 font-bold">
              {activeLog?.action}
            </span>
          </span>
          <span className="text-[11px] text-slate-400">
            Entity:{" "}
            <span className="text-teal-400">{activeLog?.entity_type}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasOld && hasNew && (
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode("side-by-side")}
                className={`px-2.5 py-1 rounded transition ${
                  viewMode === "side-by-side"
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Side-by-Side
              </button>
              <button
                type="button"
                onClick={() => setViewMode("old")}
                className={`px-2.5 py-1 rounded transition ${
                  viewMode === "old"
                    ? "bg-amber-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Previous (Old)
              </button>
              <button
                type="button"
                onClick={() => setViewMode("new")}
                className={`px-2.5 py-1 rounded transition ${
                  viewMode === "new"
                    ? "bg-emerald-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Updated (New)
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Payload Display Area */}
      <div className="mt-3">
        {hasOld && hasNew && viewMode === "side-by-side" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Previous State */}
            <div className="flex flex-col rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800 text-[11px]">
                <span className="font-semibold text-amber-400">
                  Previous State (old_value)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(activeLog?.old_value, null, 2),
                      "old",
                    )
                  }
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition"
                  title="Copy previous value"
                >
                  {copiedSection === "old" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedSection === "old" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className="max-h-72 overflow-y-auto p-3 text-xs text-amber-300/90 leading-relaxed custom-scrollbar">
                {JSON.stringify(activeLog?.old_value, null, 2)}
              </pre>
            </div>

            {/* Updated State */}
            <div className="flex flex-col rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800 text-[11px]">
                <span className="font-semibold text-emerald-400">
                  Updated State (new_value)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(activeLog?.new_value, null, 2),
                      "new",
                    )
                  }
                  className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition"
                  title="Copy new value"
                >
                  {copiedSection === "new" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedSection === "new" ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className="max-h-72 overflow-y-auto p-3 text-xs text-emerald-400 leading-relaxed custom-scrollbar">
                {JSON.stringify(activeLog?.new_value, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex flex-col rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800 text-[11px]">
              <span
                className={`font-semibold ${
                  viewMode === "old" || (!hasNew && hasOld)
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {viewMode === "old" || (!hasNew && hasOld)
                  ? "Previous State Snapshot (old_value)"
                  : "Updated State Snapshot (new_value)"}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    JSON.stringify(
                      viewMode === "old" || (!hasNew && hasOld)
                        ? activeLog?.old_value
                        : activeLog?.new_value,
                      null,
                      2,
                    ),
                    "single",
                  )
                }
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition"
                title="Copy payload"
              >
                {copiedSection === "single" ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span>{copiedSection === "single" ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <pre
              className={`max-h-80 overflow-y-auto p-3 text-xs leading-relaxed custom-scrollbar ${
                viewMode === "old" || (!hasNew && hasOld)
                  ? "text-amber-300/90"
                  : "text-emerald-400"
              }`}
            >
              {JSON.stringify(
                viewMode === "old" || (!hasNew && hasOld)
                  ? activeLog?.old_value
                  : activeLog?.new_value,
                null,
                2,
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
