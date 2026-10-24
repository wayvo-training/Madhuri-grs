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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [dependencyType, setDependencyType] = useState<
    "PARALLEL" | "SEQUENTIAL"
  >("PARALLEL");

  const [isEditingRouting, setIsEditingRouting] = useState(false);
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
            dependency_type: dependencyType,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-emerald-800 dark:text-emerald-400">
                {grievance.grievance_number}
              </span>
              <PriorityBadge priority={grievance.priority} />
              <StatusBadge status={grievance.status} />
            </div>
            <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">
              {grievance.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Description
            </p>
            <p className="mt-1 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-transparent dark:border-slate-700/50 p-3.5 leading-relaxed text-slate-800 dark:text-slate-200">
              {grievance.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 dark:border-slate-800 dark:bg-slate-800/30 p-4">
            <div>
              <p className="text-slate-400 dark:text-slate-400">
                {grievance.involvement_type === "EQUAL"
                  ? "Department (Joint Co-Lead)"
                  : "Primary Department"}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {grievance.department_name || "Pending Manual Routing"}
                </p>
                {grievance.involvement_type === "EQUAL" && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700/60">
                    EQUAL
                  </span>
                )}
                {grievance.department_name && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingRouting((prev) => !prev);
                      if (!targetDeptId && grievance.department_name) {
                        const found = departments.find(
                          (d) =>
                            d.department_name === grievance.department_name,
                        );
                        if (found) setTargetDeptId(found.department_id);
                      }
                    }}
                    className="ml-auto inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-0.5 text-2xs font-semibold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                  >
                    {isEditingRouting
                      ? "Cancel"
                      : "⚙️ Modify Routing / Workflow"}
                  </button>
                )}
              </div>
              {grievance.department_head_name && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="text-slate-400 font-medium">
                    Head of Department (HOD):
                  </span>{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {grievance.department_head_name}
                  </span>
                  {grievance.department_head_email && (
                    <span className="text-slate-400 ml-1">
                      ({grievance.department_head_email})
                    </span>
                  )}
                </p>
              )}
            </div>
            <div>
              <p className="text-slate-400">
                {grievance.involvement_type === "EQUAL"
                  ? "Collaborating Co-Leads / Supportive"
                  : "Supportive Departments"}
              </p>
              <div className="mt-0.5 flex flex-wrap gap-1.5">
                {grievance.supporting_departments &&
                grievance.supporting_departments.length > 0 ? (
                  grievance.supporting_departments.map((sd) => {
                    const isCoLead =
                      sd.department_name.includes("Joint Co-Lead");
                    return (
                      <span
                        key={sd.department_id}
                        className={`inline-flex flex-col rounded-md border px-2 py-1 text-xs font-medium ${
                          isCoLead
                            ? "border-teal-200 dark:border-teal-700/60 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold"
                            : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span>{sd.department_name}</span>
                        {sd.head_name && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            HOD: {sd.head_name}
                          </span>
                        )}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-slate-400 italic font-normal">
                    None configured
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-slate-400">Category & Subcategory</p>
              <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                {grievance.category_name} &bull; {grievance.subcategory_name}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Submitted By</p>
              <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                {grievance.submitted_by_name} ({grievance.submitted_by_email})
              </p>
            </div>
            <div>
              <p className="text-slate-400">Submission Date</p>
              <p className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
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

          {/* Manual Routing / Re-routing Action for Admin */}
          {(!grievance.department_name || isEditingRouting) && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="flex items-center justify-between font-bold text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    {!grievance.department_name
                      ? "Manual Routing Exception Workflow"
                      : "Modify Department Routing & Workflow Mode"}
                  </span>
                </div>
                {isEditingRouting && (
                  <button
                    type="button"
                    onClick={() => setIsEditingRouting(false)}
                    className="text-xs text-amber-700 hover:text-amber-900 underline font-normal cursor-pointer"
                  >
                    Close
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-amber-700">
                {!grievance.department_name
                  ? "This grievance requires manual department allocation because automated routing rules did not match. Assign 1 Primary Department and optionally designate Supportive Departments."
                  : "Update the primary department assignment, add/remove supportive departments, or adjust the collaboration workflow mode."}
              </p>

              <div className="mt-3.5 space-y-3">
                <div>
                  <label
                    htmlFor="manual-routing-primary-dept"
                    className="block text-xs font-semibold uppercase tracking-wider text-amber-900/80 mb-1"
                  >
                    Primary Department <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    value={targetDeptId}
                    onValueChange={(newPrimaryId) => {
                      if (newPrimaryId) {
                        setTargetDeptId(newPrimaryId);
                        setSelectedSupportingDeptIds((prev) =>
                          prev.filter((id) => id !== newPrimaryId),
                        );
                      }
                    }}
                  >
                    <SelectTrigger
                      id="manual-routing-primary-dept"
                      className="h-9.5 w-full rounded-xl border border-amber-300 bg-white px-3 text-xs font-medium text-slate-800 outline-none transition focus:border-amber-600 focus:ring-1 focus:ring-amber-600/20 cursor-pointer"
                    >
                      <SelectValue placeholder="-- Select Primary Department --">
                        {targetDeptId
                          ? departments.find(
                              (d) => d.department_id === targetDeptId,
                            )?.department_name || targetDeptId
                          : "-- Select Primary Department --"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-60 bg-white border border-slate-200 shadow-xl max-h-56">
                      {departments.map((d) => (
                        <SelectItem
                          key={d.department_id}
                          value={d.department_id}
                          className="text-xs cursor-pointer py-1.5"
                        >
                          {d.department_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="block text-xs font-semibold uppercase tracking-wider text-amber-900/80">
                      Supportive Departments (Optional)
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

                {selectedSupportingDeptIds.length > 0 && (
                  <div>
                    <p className="block text-xs font-semibold uppercase tracking-wider text-amber-900/80 mb-1.5">
                      Collaboration Workflow Mode
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDependencyType("PARALLEL")}
                        className={`flex flex-col p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          dependencyType === "PARALLEL"
                            ? "bg-amber-100/90 border-amber-400 text-amber-950 font-semibold shadow-2xs"
                            : "bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xs font-bold flex items-center gap-1">
                          ⚡ Concurrent (Parallel)
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal mt-0.5">
                          All departments collaborate simultaneously.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDependencyType("SEQUENTIAL")}
                        className={`flex flex-col p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          dependencyType === "SEQUENTIAL"
                            ? "bg-amber-100/90 border-amber-400 text-amber-950 font-semibold shadow-2xs"
                            : "bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xs font-bold flex items-center gap-1">
                          ⏳ Sequential (Step-by-Step)
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal mt-0.5">
                          Supportive departments activate after primary
                          completes.
                        </span>
                      </button>
                    </div>
                  </div>
                )}

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

        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
