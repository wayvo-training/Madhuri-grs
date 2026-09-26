"use client";

import {
  AlertCircle,
  AlertTriangle,
  Award,
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PriorityBadge } from "@/components/dashboard/badges";
import type { StaffRecommendationResult } from "@/lib/engines/staff-recommendation-engine";
import type { GrievanceItem, StaffMember } from "@/types/department-head";

interface SmartStaffAssignmentModalProps {
  grievance: GrievanceItem;
  currentDepartmentName: string;
  staffList: StaffMember[];
  onClose: () => void;
  onAssignmentSuccess: (
    staffId: string,
    staffName: string,
    note?: string,
    score?: number,
    reasons?: unknown,
  ) => void;
}

export function SmartStaffAssignmentModal({
  grievance,
  currentDepartmentName,
  staffList,
  onClose,
  onAssignmentSuccess,
}: SmartStaffAssignmentModalProps) {
  const shouldHideModal =
    grievance.status === "CLOSED" || grievance.status === "RESOLVED";

  const isReassignment = Boolean(
    grievance.assignedStaffId || grievance.assignedStaffName,
  );

  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<
    StaffRecommendationResult[]
  >([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [assignmentNote, setAssignmentNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch recommendations from API
  const fallbackFromStaffList = useCallback(() => {
    const fallbackList: StaffRecommendationResult[] = staffList.map(
      (s, index) => {
        const isTop = index === 0 && s.status === "ACTIVE";
        const loadPercentage = Math.round(
          (s.activeTickets / s.maxCapacity) * 100,
        );
        return {
          staffId: s.id,
          name: s.name,
          email: s.email,
          designation: s.designation,
          score: isTop ? 88 : Math.max(50, 80 - index * 6),
          isTopRecommendation: isTop,
          activeWorkload: s.activeTickets,
          maxCapacity: s.maxCapacity,
          availabilityStatus:
            s.status === "ON_LEAVE"
              ? "ON_LEAVE"
              : loadPercentage >= 80
                ? "BUSY"
                : "AVAILABLE",
          matchedSkills: ["Department Redressal Operations"],
          bulletReasons: [
            "Eligible department staff member",
            `Active workload: ${s.activeTickets} / ${s.maxCapacity} grievances`,
            s.status === "ON_LEAVE"
              ? "On approved leave"
              : "Available for assignment",
          ],
          rawReasons: {
            matched_skills: ["Department Redressal Operations"],
            experience_match: true,
            workload:
              s.activeTickets <= 2
                ? "LOW"
                : s.activeTickets <= 5
                  ? "MEDIUM"
                  : "HIGH",
            availability: s.status === "ON_LEAVE" ? "BUSY" : "AVAILABLE",
            sla_risk: "LOW",
          },
          factorBreakdown: {
            skillScore: 25,
            experienceScore: 18,
            workloadScore: 15,
            availabilityScore: 8,
            slaScore: 8,
          },
        };
      },
    );
    setRecommendations(fallbackList);
  }, [staffList]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);

    fetch(`/api/department-head/grievances/${grievance.id}/recommendations`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load staff recommendations");
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.recommendations)) {
          setRecommendations(data.recommendations);
        } else {
          fallbackFromStaffList();
        }
      })
      .catch((err) => {
        console.warn(
          "Could not load smart recommendations, using staff list:",
          err,
        );
        if (isMounted) {
          fallbackFromStaffList();
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fallbackFromStaffList, grievance.id]);

  if (shouldHideModal) {
    return null;
  }

  const selectedCandidate = recommendations.find(
    (r) => r.staffId === selectedStaffId,
  );

  const recommendedCandidates = [...recommendations]
    .filter((candidate) => candidate.availabilityStatus !== "ON_LEAVE")
    .sort((a, b) => b.score - a.score);

  const availableCandidates = [...recommendedCandidates].filter(
    (candidate) =>
      !candidate.isTopRecommendation &&
      candidate.availabilityStatus !== "ON_LEAVE",
  );

  // Find currently assigned staff info for reassignment view
  const currentAssignedMember = staffList.find(
    (s) =>
      s.id === grievance.assignedStaffId ||
      s.name === grievance.assignedStaffName,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !selectedCandidate) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/department-head/grievances/${grievance.id}/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staffId: selectedStaffId,
            note: assignmentNote.trim() || undefined,
            recommendationScore: selectedCandidate.score,
            recommendationReasons: selectedCandidate.rawReasons,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.message || "Failed to complete grievance assignment",
        );
      }

      onAssignmentSuccess(
        selectedCandidate.staffId,
        selectedCandidate.name,
        assignmentNote.trim() || undefined,
        selectedCandidate.score,
        selectedCandidate.rawReasons,
      );
    } catch (err) {
      console.error("Assignment error:", err);
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to assign grievance",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-[#064E3B] border border-emerald-200">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                {isReassignment
                  ? "Change Staff Assignment"
                  : "Staff Assignment"}
              </span>
              <span className="font-mono text-xs font-semibold text-slate-500">
                {grievance.ticketCode}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              {isReassignment
                ? "Change Staff for Grievance"
                : "Assign Grievance to Staff"}
            </h3>
            <p className="text-xs text-slate-500">
              Department Head decision support &bull; Review smart
              recommendations and confirm assignment
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {/* 1. Grievance Context Banner */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Grievance Dossier
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                  {grievance.title}
                </h4>
              </div>
              <PriorityBadge priority={grievance.priority} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/70 text-xs">
              <div>
                <span className="text-slate-400 block text-2.75">Category</span>
                <span
                  className="font-medium text-slate-800 truncate block"
                  title={grievance.category}
                >
                  {grievance.category}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-2.75">
                  Subcategory
                </span>
                <span
                  className="font-medium text-slate-800 truncate block"
                  title={grievance.subcategory}
                >
                  {grievance.subcategory}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-2.75">
                  Current SLA
                </span>
                <span className="font-medium text-slate-800 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-slate-400" />
                  {grievance.slaTimeLeft || "On track"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-2.75">
                  Department
                </span>
                <span className="font-medium text-slate-800 truncate block">
                  {currentDepartmentName}
                </span>
              </div>
            </div>

            {grievance.isCrossDepartment &&
              grievance.collaboratingDepartments && (
                <div className="pt-2 border-t border-slate-200/70 text-xs text-slate-600 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Supporting Departments:{" "}
                    {grievance.collaboratingDepartments.join(", ")}
                  </span>
                </div>
              )}
          </div>

          {/* 2. If Reassigning: Show Current Staff Context */}
          {isReassignment && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3.5 flex items-start gap-3 text-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-900 font-bold text-xs mt-0.5">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="font-semibold text-amber-950">
                  Currently Assigned:{" "}
                  <span className="underline decoration-amber-300">
                    {grievance.assignedStaffName || "Assigned Staff Member"}
                  </span>
                </div>
                <p className="text-amber-800">
                  {currentAssignedMember
                    ? `Current Workload: ${currentAssignedMember.activeTickets} / ${currentAssignedMember.maxCapacity} active grievances (${currentAssignedMember.status})`
                    : "Reassigning will record prior assignment as REASSIGNED without resetting the SLA."}
                </p>
              </div>
            </div>
          )}

          {/* 3. Smart Staff Recommendations Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Smart Staff Recommendations</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  The Department Head can assign the recommended staff or choose
                  any available staff manually before confirming.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2.5 py-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-xl border border-slate-200 bg-slate-50/60 animate-pulse"
                  />
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="font-medium text-slate-700">
                  No active staff found in this department.
                </p>
                <p className="mt-1">
                  Ensure department staff are marked ACTIVE in user management.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recommendedCandidates.length > 0 &&
                  (() => {
                    const topCandidate = recommendedCandidates[0];
                    const isSelected = selectedStaffId === topCandidate.staffId;
                    const isUnavailable =
                      topCandidate.availabilityStatus === "ON_LEAVE";

                    return (
                      <div className="relative rounded-xl border border-emerald-300/80 bg-emerald-50/20 p-4 shadow-xs">
                        <div className="absolute -top-2.5 right-4 rounded-full bg-[#064E3B] px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-xs flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" />
                          <span>Top Recommendation</span>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-[#064E3B]">
                                {topCandidate.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-base font-semibold text-slate-900">
                                    {topCandidate.name}
                                  </h5>
                                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                    Recommended
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                  {topCandidate.designation} (
                                  {currentDepartmentName})
                                </p>
                                <p className="text-xs text-slate-500">
                                  {topCandidate.email}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                              {topCandidate.bulletReasons.map((reason) => (
                                <div
                                  key={reason}
                                  className="flex items-center gap-2"
                                >
                                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  <span>
                                    {reason === "Strong category/skill match"
                                      ? "Strong category/skill match"
                                      : reason ===
                                          "Relevant experience and domain knowledge"
                                        ? "Relevant experience"
                                        : reason === "Available for assignment"
                                          ? "Available on duty"
                                          : reason === "Low workload capacity"
                                            ? "Low workload"
                                            : reason === "SLA aligned"
                                              ? "SLA suitable"
                                              : reason}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3 shrink-0">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-[#064E3B]">
                                {topCandidate.score}%
                              </div>
                              <div className="text-[10px] font-semibold uppercase text-slate-500 tracking-[0.12em]">
                                Recommendation Score
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isUnavailable}
                              onClick={() =>
                                setSelectedStaffId(topCandidate.staffId)
                              }
                              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                                isSelected
                                  ? "bg-[#064E3B] text-white shadow-xs"
                                  : "border border-slate-300 bg-white text-slate-700 hover:border-emerald-600 hover:text-emerald-900"
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {isSelected ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : null}
                              <span>
                                {isSelected ? "Selected" : "Select Staff"}
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 pt-3">
                          <div className="flex items-center gap-4 text-xs text-slate-600">
                            <div>
                              Active Workload:{" "}
                              <strong className="font-semibold text-slate-800">
                                {topCandidate.activeWorkload} /{" "}
                                {topCandidate.maxCapacity}
                              </strong>
                            </div>
                            <div>
                              Availability:{" "}
                              <span
                                className={`font-semibold ${
                                  topCandidate.availabilityStatus ===
                                  "AVAILABLE"
                                    ? "text-emerald-700"
                                    : topCandidate.availabilityStatus === "BUSY"
                                      ? "text-amber-700"
                                      : "text-slate-500"
                                }`}
                              >
                                {topCandidate.availabilityStatus === "AVAILABLE"
                                  ? "Available"
                                  : topCandidate.availabilityStatus === "BUSY"
                                    ? "Near Capacity"
                                    : "On Leave"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {availableCandidates.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
                    <label
                      htmlFor="available-staff-select"
                      className="mb-1.5 block text-[11px] font-semibold text-slate-700"
                    >
                      Available Staff
                    </label>
                    <select
                      id="available-staff-select"
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="">Select another available staff</option>
                      {availableCandidates.map((candidate) => (
                        <option
                          key={candidate.staffId}
                          value={candidate.staffId}
                          disabled={candidate.availabilityStatus === "ON_LEAVE"}
                        >
                          {candidate.name} — {candidate.activeWorkload} case
                          {candidate.activeWorkload === 1 ? "" : "s"} assigned
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Selection Confirmation & Instructions Panel */}
          {selectedCandidate && (
            <div className="rounded-xl border border-emerald-300/80 bg-emerald-50/30 p-4 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="text-xs text-emerald-900 font-medium">
                      {isReassignment
                        ? "Selected for Change:"
                        : "Selected for Assignment:"}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900">
                      {selectedCandidate.name} ({selectedCandidate.designation})
                      &bull; Recommendation Score: {selectedCandidate.score}%
                    </h5>
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {selectedCandidate.activeWorkload} active grievances
                </span>
              </div>

              <div>
                <label
                  htmlFor="assignment-instructions"
                  className="block text-xs font-semibold text-slate-800 mb-1"
                >
                  Internal Instructions & Priority Directives (Optional)
                </label>
                <textarea
                  id="assignment-instructions"
                  rows={2}
                  value={assignmentNote}
                  onChange={(e) => setAssignmentNote(e.target.value)}
                  placeholder="e.g. Expedite review of payroll ledger. Contact complainant by tomorrow afternoon."
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1.5 text-2.75 text-slate-500">
                <AlertCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  The Department Head makes the final decision. Submitting will
                  record assignment in the official audit trail.
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">
          <div className="flex-1" />

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selectedStaffId || isSubmitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Recording Assignment...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>
                    {isReassignment
                      ? "Confirm Assignment Change"
                      : "Confirm Staff Assignment"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
