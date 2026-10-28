"use client";

import { Check, Loader2, Lock, Share2, Shield, Unlock, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface EligibleDepartment {
  departmentId: string;
  departmentName: string;
  involvementType: string;
  status: string;
  isGranted: boolean;
}

interface ManageAttachmentAccessModalProps {
  attachmentId: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
  onAccessChanged?: () => void;
}

export function ManageAttachmentAccessModal({
  attachmentId,
  fileName,
  isOpen,
  onClose,
  onAccessChanged,
}: ManageAttachmentAccessModalProps) {
  const [loading, setLoading] = useState(true);
  const [actionLoadingDeptId, setActionLoadingDeptId] = useState<string | null>(
    null,
  );
  const [departments, setDepartments] = useState<EligibleDepartment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchAccessData = useCallback(async () => {
    if (!attachmentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/attachments/${attachmentId}/access`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Failed to load access details",
        );
      }
      setDepartments(data.eligibleDepartments || []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load access details",
      );
    } finally {
      setLoading(false);
    }
  }, [attachmentId]);

  useEffect(() => {
    if (isOpen) {
      fetchAccessData();
      setSuccessMessage(null);
    }
  }, [isOpen, fetchAccessData]);

  const handleToggleAccess = async (dept: EligibleDepartment) => {
    setActionLoadingDeptId(dept.departmentId);
    setError(null);
    setSuccessMessage(null);

    const isCurrentlyGranted = dept.isGranted;
    const method = isCurrentlyGranted ? "DELETE" : "POST";

    try {
      const res = await fetch(`/api/attachments/${attachmentId}/access`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId: dept.departmentId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Failed to update access",
        );
      }

      setDepartments((prev) =>
        prev.map((d) =>
          d.departmentId === dept.departmentId
            ? { ...d, isGranted: !isCurrentlyGranted }
            : d,
        ),
      );

      setSuccessMessage(
        isCurrentlyGranted
          ? `Access revoked from ${dept.departmentName}.`
          : `Access successfully granted to ${dept.departmentName}.`,
      );

      if (onAccessChanged) {
        onAccessChanged();
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update document access",
      );
    } finally {
      setActionLoadingDeptId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200/60 dark:border-teal-800/40 shrink-0">
              <Share2 className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                Document Sharing & Access Control
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Manage visibility for supporting departments
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* File Card */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Attachment File
              </span>
              <p
                className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5"
                title={fileName}
              >
                {fileName}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0">
              <Shield className="h-3 w-3" />
              Primary Protected
            </span>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Department List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5">
              Supporting Departments on this Case
            </h4>

            {loading ? (
              <div className="flex items-center justify-center p-6 text-slate-400 text-xs gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                <span>Checking access permissions...</span>
              </div>
            ) : departments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-5 text-center text-xs text-slate-500">
                <Lock className="h-5 w-5 mx-auto mb-1.5 text-slate-400" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No Supporting Departments
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  This grievance is handled solely by your department. No other
                  departments require document access.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {departments.map((dept) => {
                  const isProcessing =
                    actionLoadingDeptId === dept.departmentId;

                  return (
                    <div
                      key={dept.departmentId}
                      className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 transition shadow-2xs hover:border-slate-300"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {dept.departmentName}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Supporting
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                          {dept.isGranted ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <Unlock className="h-3 w-3" />
                              Access Granted (Visible)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 font-medium">
                              <Lock className="h-3 w-3" />
                              Restricted (Hidden from {dept.departmentName})
                            </span>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleToggleAccess(dept)}
                        variant={dept.isGranted ? "outline" : "default"}
                        className={
                          dept.isGranted
                            ? "h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50"
                            : "h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold"
                        }
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : dept.isGranted ? (
                          "Revoke Access"
                        ) : (
                          "Grant Access"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] text-slate-500">
          <span>Changes are logged to the official security audit trail.</span>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
