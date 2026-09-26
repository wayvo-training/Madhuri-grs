import { AlertTriangle } from "lucide-react";

export interface ConfirmRuleDeleteModalProps {
  open: boolean;
  onClose: () => void;
  ruleName: string;
  onConfirm: () => void;
}

export function ConfirmRuleDeleteModal({
  open,
  onClose,
  ruleName,
  onConfirm,
}: ConfirmRuleDeleteModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-4 ring-rose-50/50">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Confirm Rule Deletion
            </h3>
            <p className="text-xs text-slate-500">
              This action requires explicit administrative confirmation.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-700 leading-relaxed">
          Are you sure you want to delete{" "}
          <strong className="text-slate-900">&lsquo;{ruleName}&rsquo;</strong>?
          This will deactivate the rule and remove it from live triage
          evaluation. Historical audit records will be preserved.
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition cursor-pointer"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Yes, Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
