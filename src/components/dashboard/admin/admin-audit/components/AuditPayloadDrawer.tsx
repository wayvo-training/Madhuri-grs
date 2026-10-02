"use client";

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
  if (!expandedLogId) return null;

  const activeLog = logs.find((l) => l.audit_log_id === expandedLogId);

  return (
    <div className="border-t border-slate-200/80 bg-slate-900 p-5 font-mono text-xs text-emerald-400">
      <div className="flex items-center justify-between pb-3 text-slate-400 border-b border-slate-800">
        <span className="font-semibold text-slate-200">
          Audit Event Payload (ID: #{expandedLogId})
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white transition"
        >
          ✕ Close
        </button>
      </div>
      <pre className="mt-3 max-h-60 overflow-y-auto rounded bg-slate-950 p-3 text-xs">
        {JSON.stringify(activeLog?.new_value, null, 2)}
      </pre>
    </div>
  );
}
