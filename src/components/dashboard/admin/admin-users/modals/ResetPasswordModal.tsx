"use client";

import { AlertTriangle, KeyRound, Loader2, X } from "lucide-react";
import type { SerializedUser } from "@/types/admin/users";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  user: SerializedUser | null;
  newPassword: string;
  onSetNewPassword: (val: string) => void;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  user,
  newPassword,
  onSetNewPassword,
}: ResetPasswordModalProps) {
  if (!isOpen || !user) return null;

  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Reset User Password
              </h3>
              <p className="text-xs text-slate-500">
                Assign a new password for this account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="mt-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
              {fullName}
            </span>
            <span className="font-mono text-[11px] text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              {user.employee_code}
            </span>
          </div>
          <span className="text-xs text-slate-500">{user.email}</span>
        </div>

        {/* Notice */}
        <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 p-3 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <span>
            Resetting this password will immediately invalidate all active
            sessions for this user, requiring them to re-authenticate with the
            new credentials.
          </span>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="reset-new-password"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              New Password <span className="text-rose-500">*</span>
            </label>
            <input
              id="reset-new-password"
              type="password"
              required
              minLength={6}
              placeholder="Enter new password (min 6 characters)"
              value={newPassword}
              onChange={(e) => onSetNewPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-[#0F766E] focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-[#0F766E] outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-medium text-white hover:bg-[#115E59] active:bg-[#0D655E] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <span>Confirm Reset</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
