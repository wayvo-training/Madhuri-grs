"use client";

import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import type {
  DepartmentOption,
  SerializedGrievance,
  SupportingDepartment,
} from "@/types/admin/grievances";

export interface AdminGrievanceModalProps {
  grievance: SerializedGrievance;
  departments: DepartmentOption[];
  onClose: () => void;
  onRouteSuccess: (
    grievanceId: string,
    assignedDept:
      | { department_id: string; department_name: string }
      | undefined,
    assignedSupporting: SupportingDepartment[],
  ) => void;
}

export function AdminGrievanceModal({
  grievance,
  departments,
  onClose,
  onRouteSuccess,
}: AdminGrievanceModalProps) {
  const [targetDeptId, setTargetDeptId] = useState<string>("");
  const [selectedSupportingDeptIds, setSelectedSupportingDeptIds] = useState<
    string[]
  >(
    grievance.supporting_departments
      ? grievance.supporting_departments.map((sd) => sd.department_id)
      : [],
  );

  const [isRouting, setIsRouting] = useState(false);
  const [routingFeedback, setRoutingFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleManualRoute = async () => {
    if (!targetDeptId) return;

    try {
      setIsRouting(true);
      setRoutingFeedback(null);

      const res = await fetch(
        `/api/admin/grievances/${grievance.grievance_id}/route`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            department_id: targetDeptId,
            supporting_department_ids: selectedSupportingDeptIds,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        setRoutingFeedback({
          type: "error",
          text: data.message || "Failed to route grievance.",
        });
        setIsRouting(false);
        return;
      }

      const assignedDept = departments.find(
        (d) => d.department_id === targetDeptId,
      );
      const assignedSupporting = departments.filter((d) =>
        selectedSupportingDeptIds.includes(d.department_id),
      );

      setRoutingFeedback({
        type: "success",
        text: data.message || "Grievance routed successfully.",
      });

      const updatedSupporting = assignedSupporting.map((s) => ({
        department_id: s.department_id,
        department_name: s.department_name,
      }));

      // Notify parent to update state and refetch
      onRouteSuccess(grievance.grievance_id, assignedDept, updatedSupporting);

      setIsRouting(false);
    } catch (err) {
      console.error(err);
      setRoutingFeedback({
        type: "error",
        text: "An unexpected error occurred during manual routing.",
      });
      setIsRouting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-emerald-800">
                {grievance.grievance_number}
              </span>
              <PriorityBadge priority={grievance.priority} />
              <StatusBadge status={grievance.status} />
            </div>
            <h3 className="mt-2 text-lg font-bold text-slate-900">
              {grievance.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-700">Description</p>
            <p className="mt-1 rounded-xl bg-slate-50 p-3.5 leading-relaxed text-slate-800">
              {grievance.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 p-4">
            <div>
              <p className="text-slate-400">Primary Department</p>
              <p className="mt-0.5 font-semibold text-slate-800">
                {grievance.department_name || "Pending Manual Routing"}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Supporting Departments</p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {grievance.supporting_departments &&
                grievance.supporting_departments.length > 0 ? (
                  grievance.supporting_departments.map((sd) => (
                    <span
                      key={sd.department_id}
                      className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700"
                    >
                      {sd.department_name}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic font-normal">
                    None configured
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-slate-400">Category & Subcategory</p>
              <p className="mt-0.5 font-semibold text-slate-800">
                {grievance.category_name} &bull; {grievance.subcategory_name}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Submitted By</p>
              <p className="mt-0.5 font-semibold text-slate-800">
                {grievance.submitted_by_name} ({grievance.submitted_by_email})
              </p>
            </div>
            <div>
              <p className="text-slate-400">Submission Date</p>
              <p className="mt-0.5 font-semibold text-slate-800">
                {new Date(grievance.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {grievance.reopen_count > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
              <p className="font-semibold">
                Reopen Count: {grievance.reopen_count}
              </p>
              <p className="mt-0.5 text-xs">
                This grievance was reopened following previous resolution
                rejection.
              </p>
            </div>
          )}

          {/* Manual Routing Exception Action for Admin */}
          {(grievance.status === "SUBMITTED" || !grievance.department_name) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Manual Routing Exception Workflow</span>
              </div>
              <p className="mt-1 text-xs text-amber-700">
                This grievance requires manual department allocation because
                automated routing rules did not match. Assign 1 Primary
                Department and optionally designate Supporting Departments.
              </p>

              <div className="mt-3.5 space-y-3">
                <div>
                  <label
                    htmlFor="manual-routing-primary-dept"
                    className="block text-xs font-semibold uppercase tracking-wider text-amber-900/80 mb-1"
                  >
                    Primary Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="manual-routing-primary-dept"
                    value={targetDeptId}
                    onChange={(e) => {
                      const newPrimaryId = e.target.value;
                      setTargetDeptId(newPrimaryId);
                      setSelectedSupportingDeptIds((prev) =>
                        prev.filter((id) => id !== newPrimaryId),
                      );
                    }}
                    className="h-9 w-full rounded-xl border border-amber-300 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-amber-600 focus:ring-1 focus:ring-amber-600/20"
                  >
                    <option value="">-- Select Primary Department --</option>
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="block text-xs font-semibold uppercase tracking-wider text-amber-900/80">
                      Supporting Departments (Optional)
                    </p>
                    {selectedSupportingDeptIds.length > 0 && (
                      <span className="text-xs text-amber-800 font-medium">
                        {selectedSupportingDeptIds.length} selected
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-amber-200/80 bg-white/80 min-h-10.5 items-center">
                    {departments
                      .filter((d) => d.department_id !== targetDeptId)
                      .map((d) => {
                        const isSelected = selectedSupportingDeptIds.includes(
                          d.department_id,
                        );
                        return (
                          <button
                            key={d.department_id}
                            type="button"
                            onClick={() => {
                              setSelectedSupportingDeptIds((prev) =>
                                isSelected
                                  ? prev.filter((id) => id !== d.department_id)
                                  : [...prev, d.department_id],
                              );
                            }}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                              isSelected
                                ? "bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-2xs"
                                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span>{isSelected ? "✓" : "+"}</span>
                            <span>{d.department_name}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleManualRoute}
                    disabled={!targetDeptId || isRouting}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-700 disabled:opacity-50"
                  >
                    {isRouting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Routing Ticket...</span>
                      </>
                    ) : (
                      <>
                        <Building2 className="h-3.5 w-3.5" />
                        <span>Confirm & Route Ticket</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {routingFeedback && (
                <div
                  className={`mt-3 flex items-center gap-2 rounded-lg p-2.5 text-xs font-medium ${
                    routingFeedback.type === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  {routingFeedback.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  <span>{routingFeedback.text}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
