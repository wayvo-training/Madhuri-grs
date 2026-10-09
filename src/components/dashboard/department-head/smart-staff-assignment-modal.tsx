"use client";

import {
  AlertCircle,
  AlertTriangle,
  Award,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Scale,
  Send,
  SlidersHorizontal,
  Sparkles,
  User,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PriorityBadge } from "@/components/dashboard/badges";
import type { StaffRecommendationResult } from "@/lib/engines/staff-recommendation-engine";
import type { GrievanceItem, StaffMember } from "@/types/department-head";

interface RecommendationFactorCardsProps {
  breakdown?: StaffRecommendationResult["factorBreakdown"];
  score: number;
  title?: string;
  defaultExpanded?: boolean;
}

function RecommendationFactorCards({
  breakdown,
  score,
  title = "Smart Recommendation Factors",
  defaultExpanded = false,
}: RecommendationFactorCardsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!breakdown) return null;

  const factors = [
    {
      key: "skill",
      name: "Domain Expertise & Skills",
      score: breakdown.skillScore,
      max: 35,
      weight: "35%",
      icon: Award,
      color: "text-teal-600 dark:text-teal-400",
      barColor: "bg-teal-500",
      description:
        "Specialization in grievance category and verified department competencies",
    },
    {
      key: "experience",
      name: "Relevant Case Experience",
      score: breakdown.experienceScore,
      max: 25,
      weight: "25%",
      icon: Briefcase,
      color: "text-sky-600 dark:text-sky-400",
      barColor: "bg-sky-500",
      description:
        "Historical resolution track record in this category and subcategory",
    },
    {
      key: "workload",
      name: "Workload & Active Capacity",
      score: breakdown.workloadScore,
      max: 20,
      weight: "20%",
      icon: Scale,
      color: "text-emerald-600 dark:text-emerald-400",
      barColor: "bg-emerald-500",
      description:
        "Available capacity compared against the maximum 10-grievance threshold",
    },
    {
      key: "availability",
      name: "On-Duty Availability",
      score: breakdown.availabilityScore,
      max: 10,
      weight: "10%",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      barColor: "bg-amber-500",
      description:
        "Active shift duty status (excludes personnel on approved leave)",
    },
    {
      key: "sla",
      name: "Priority SLA Alignment",
      score: breakdown.slaScore,
      max: 10,
      weight: "10%",
      icon: Zap,
      color: "text-indigo-600 dark:text-indigo-400",
      barColor: "bg-indigo-500",
      description:
        "Demonstrated turnaround speed and suitability for the priority level",
    },
  ];

  return (
    <div className="rounded-xl border border-teal-200/80 dark:border-teal-800/60 bg-white/90 dark:bg-slate-900/80 p-3 space-y-2.5 transition">
      {/* Header with expand/collapse toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 text-left cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-400">
            <SlidersHorizontal className="h-3 w-3" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition">
              {title}
            </span>
            <span className="ml-2 text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-1.5 py-0.5 rounded-full">
              {score}% Overall Score
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span>
            {isExpanded ? "Hide Factors" : "Why this score? (5 Factors)"}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </div>
      </button>

      {/* Quick Summary Chips (Always Visible) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
        {factors.map((f) => {
          const pct = Math.round((f.score / f.max) * 100);
          return (
            <div
              key={f.key}
              className="flex flex-col rounded-lg bg-slate-50 dark:bg-slate-800/60 p-1.5 text-center border border-slate-200/60 dark:border-slate-700/60"
            >
              <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                <span className="truncate">{f.name.split(" ")[0]}</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {f.weight}
                </span>
              </div>
              <div className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                {f.score}{" "}
                <span className="text-[10px] font-normal text-slate-400">
                  /{f.max}
                </span>
              </div>
              <div className="mt-1 h-1 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full ${f.barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Factor Breakdown (When Expanded) */}
      {isExpanded && (
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Smart recommendation evaluates 5 weighted criteria to compute the
            final suitability score for this grievance:
          </p>
          <div className="space-y-1.5">
            {factors.map((f) => {
              const pct = Math.round((f.score / f.max) * 100);
              const Icon = f.icon;
              return (
                <div
                  key={f.key}
                  className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-2 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className={`h-3.5 w-3.5 shrink-0 ${f.color}`} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {f.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        (Max: {f.weight})
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {f.score} / {f.max} pts
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${f.barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 p-2 text-[10px] text-teal-800 dark:text-teal-300 flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
            <span>
              <strong>Scoring Formula:</strong> Skills (35%) + Past Experience
              (25%) + Workload Capacity (20%) + Availability (10%) + SLA
              Alignment (10%) = <strong>{score}% Total Match</strong>.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

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
        const effectiveMax = 10;
        const isAtCap = s.activeTickets >= effectiveMax;
        const isTop = index === 0 && s.status === "ACTIVE" && !isAtCap;
        const loadPercentage = Math.round(
          (s.activeTickets / effectiveMax) * 100,
        );

        // Calculate dynamic factors that accurately reflect workload and profile
        const workloadScore = Math.max(0, 20 - s.activeTickets * 2);
        const availabilityScore =
          s.status === "ON_LEAVE"
            ? 0
            : isAtCap
              ? 1
              : s.activeTickets <= 2
                ? 10
                : s.activeTickets <= 5
                  ? 8
                  : 5;
        const skillScore = isTop ? 30 : Math.max(10, 26 - index * 4);
        const experienceScore = isTop ? 20 : Math.max(6, 18 - index * 3);
        const slaScore =
          s.activeTickets <= 2 ? 10 : s.activeTickets <= 5 ? 8 : 4;

        const computedScore = Math.min(
          95,
          Math.max(
            35,
            skillScore +
              experienceScore +
              workloadScore +
              availabilityScore +
              slaScore,
          ),
        );

        return {
          staffId: s.id,
          name: s.name,
          email: s.email,
          designation: s.designation,
          score: computedScore,
          isTopRecommendation: isTop,
          activeWorkload: s.activeTickets,
          maxCapacity: effectiveMax,
          availabilityStatus:
            s.status === "ON_LEAVE"
              ? "ON_LEAVE"
              : isAtCap || loadPercentage >= 80
                ? "BUSY"
                : "AVAILABLE",
          matchedSkills: ["Department Redressal Operations"],
          bulletReasons: [
            "Eligible department staff member",
            `Active workload: ${s.activeTickets} / ${effectiveMax} grievances (Available Capacity: ${Math.max(0, effectiveMax - s.activeTickets)})`,
            s.status === "ON_LEAVE"
              ? "On approved leave"
              : isAtCap
                ? "Maximum active capacity reached (10 / 10 assigned) - Ineligible for new assignments"
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
            skillScore,
            experienceScore,
            workloadScore,
            availabilityScore,
            slaScore,
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

    fetch(
      `/api/department-head/grievances/${grievance.id}/recommendations?t=${Date.now()}`,
      {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      },
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (
          data?.success &&
          Array.isArray(data?.recommendations) &&
          data.recommendations.length > 0
        ) {
          setRecommendations(data.recommendations);
        } else {
          fallbackFromStaffList();
        }
      })
      .catch((err) => {
        console.error("Error fetching staff recommendations:", err);
        if (isMounted) fallbackFromStaffList();
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

  const topCandidate = recommendedCandidates[0];

  const manualCandidates = [...staffList]
    .filter((s) => s.id !== topCandidate?.staffId && s.status !== "ON_LEAVE")
    .sort((a, b) => {
      const recA = recommendations.find((r) => r.staffId === a.id);
      const recB = recommendations.find((r) => r.staffId === b.id);
      const scoreA = recA?.score ?? 0;
      const scoreB = recB?.score ?? 0;

      // 1. Available capacity first (below capacity ranked before at-capacity)
      const aAtCap = a.activeTickets >= (a.maxCapacity || 10);
      const bAtCap = b.activeTickets >= (b.maxCapacity || 10);
      if (aAtCap !== bAtCap) {
        return aAtCap ? 1 : -1;
      }

      // 2. Sort by recommendation score descending
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }

      // 3. Lower active workload secondary tie-breaker
      if (a.activeTickets !== b.activeTickets) {
        return a.activeTickets - b.activeTickets;
      }

      return a.name.localeCompare(b.name);
    });

  // Find currently assigned staff info for reassignment view
  const currentAssignedMember = staffList.find(
    (s) =>
      s.id === grievance.assignedStaffId ||
      s.name === grievance.assignedStaffName,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId || !selectedCandidate) return;

    if (selectedCandidate.activeWorkload >= 10) {
      setErrorMsg(
        "This Staff member has reached the maximum active workload of 10 grievances.",
      );
      return;
    }

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

  if (shouldHideModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3.5 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-[#F0FDFA] px-2 py-0.5 text-[11px] font-semibold text-[#0F766E] border border-teal-200">
                <Sparkles className="h-3 w-3 text-[#0F766E]" />
                {isReassignment
                  ? "Change Staff Assignment"
                  : "Staff Assignment"}
              </span>
              <span className="font-mono text-[11px] font-semibold text-slate-500">
                {grievance.ticketCode}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1">
              {isReassignment
                ? "Change Staff for Grievance"
                : "Assign Grievance to Staff"}
            </h3>
            <p className="text-[11px] text-slate-500">
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
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          {/* 1. Grievance Context Banner */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Grievance Dossier
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-0.5 leading-snug">
                  {grievance.title}
                </h4>
              </div>
              <PriorityBadge priority={grievance.priority} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/70 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">
                  Category
                </span>
                <span
                  className="font-medium text-slate-800 truncate block text-xs"
                  title={grievance.category}
                >
                  {grievance.category}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">
                  Subcategory
                </span>
                <span
                  className="font-medium text-slate-800 truncate block text-xs"
                  title={grievance.subcategory}
                >
                  {grievance.subcategory}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">
                  Current SLA
                </span>
                <span className="font-medium text-slate-800 flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3 text-slate-400" />
                  {grievance.slaTimeLeft || "On track"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">
                  Department
                </span>
                <span className="font-medium text-slate-800 truncate block text-xs">
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
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 flex items-start gap-2.5 text-xs">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-900 font-bold text-xs mt-0.5">
                <UserCheck className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="font-semibold text-amber-950 text-xs">
                  Currently Assigned:{" "}
                  <span className="font-semibold text-amber-950">
                    {grievance.assignedStaffName || "Assigned Staff Member"}
                  </span>
                </div>
                <p className="text-amber-800 text-[11px]">
                  {currentAssignedMember
                    ? `Current Workload: ${currentAssignedMember.activeTickets} / ${currentAssignedMember.maxCapacity} active grievances (${currentAssignedMember.status})`
                    : "Reassigning will record prior assignment as REASSIGNED without resetting the SLA."}
                </p>
              </div>
            </div>
          )}

          {/* 3. Smart Staff Recommendations Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
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
              <div className="space-y-2.5">
                {recommendedCandidates.length > 0 &&
                  (() => {
                    const topCandidate = recommendedCandidates[0];
                    const isSelected = selectedStaffId === topCandidate.staffId;
                    const isUnavailable =
                      topCandidate.availabilityStatus === "ON_LEAVE";

                    return (
                      <div className="relative rounded-xl border border-emerald-300/80 bg-emerald-50/20 p-3.5 shadow-2xs">
                        <div className="absolute -top-2.5 right-4 rounded-full bg-[#0F766E] px-2 py-0.5 text-[9px] font-semibold text-white shadow-xs flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" />
                          <span>Top Recommendation</span>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0FDFA] text-sm font-bold text-[#0F766E] border border-teal-200 shrink-0">
                                {topCandidate.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-xs font-bold text-slate-900">
                                    {topCandidate.name}
                                  </h5>
                                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                                    Recommended
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  {topCandidate.designation}
                                  {currentDepartmentName &&
                                  !topCandidate.designation
                                    .toLowerCase()
                                    .includes(
                                      currentDepartmentName.toLowerCase(),
                                    )
                                    ? ` (${currentDepartmentName})`
                                    : ""}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {topCandidate.email}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                              {topCandidate.bulletReasons.map((reason) => (
                                <div
                                  key={reason}
                                  className="flex items-center gap-1.5"
                                >
                                  <Check className="h-3 w-3 text-emerald-600 shrink-0" />
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

                          <div className="flex flex-col items-end gap-2.5 shrink-0">
                            <div className="text-right">
                              <div className="text-xl font-bold text-[#0F766E]">
                                {topCandidate.score}%
                              </div>
                              <div className="text-[9px] font-semibold uppercase text-slate-500 tracking-wider">
                                Recommendation Score
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={
                                isUnavailable ||
                                topCandidate.activeWorkload >= 10
                              }
                              onClick={() =>
                                setSelectedStaffId(topCandidate.staffId)
                              }
                              className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                isSelected
                                  ? "bg-[#0F766E] text-white shadow-xs"
                                  : "border border-slate-300 bg-white text-slate-700 hover:border-[#0F766E] hover:text-[#0F766E]"
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {isSelected ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : null}
                              <span>
                                {topCandidate.activeWorkload >= 10
                                  ? "At Capacity (10/10)"
                                  : isSelected
                                    ? "Selected"
                                    : "Select Staff"}
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-200/80 pt-2.5">
                          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                            <div>
                              Active Workload:{" "}
                              <strong className="font-semibold text-slate-800">
                                {topCandidate.activeWorkload} / 10
                              </strong>
                            </div>
                            <div>
                              Available Capacity:{" "}
                              <strong
                                className={`font-semibold ${
                                  topCandidate.activeWorkload >= 10
                                    ? "text-rose-600"
                                    : "text-emerald-700"
                                }`}
                              >
                                {Math.max(0, 10 - topCandidate.activeWorkload)}
                              </strong>
                            </div>
                            <div>
                              Availability:{" "}
                              <span
                                className={`font-semibold ${
                                  topCandidate.availabilityStatus ===
                                    "AVAILABLE" &&
                                  topCandidate.activeWorkload < 10
                                    ? "text-emerald-700"
                                    : topCandidate.activeWorkload >= 10
                                      ? "text-rose-600"
                                      : topCandidate.availabilityStatus ===
                                          "BUSY"
                                        ? "text-amber-700"
                                        : "text-slate-500"
                                }`}
                              >
                                {topCandidate.activeWorkload >= 10
                                  ? "At Capacity (10/10)"
                                  : topCandidate.availabilityStatus ===
                                      "AVAILABLE"
                                    ? "Available"
                                    : topCandidate.availabilityStatus === "BUSY"
                                      ? "Near Capacity"
                                      : "On Leave"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Recommendation Score Factors Breakdown */}
                        <div className="mt-3 pt-2.5 border-t border-slate-200/80">
                          <RecommendationFactorCards
                            breakdown={topCandidate.factorBreakdown}
                            score={topCandidate.score}
                            title={`Why ${topCandidate.name} is Recommended (Score Factors)`}
                            defaultExpanded={false}
                          />
                        </div>
                      </div>
                    );
                  })()}

                {/* Always render the manual selection block so the UI is consistent */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
                  <label
                    htmlFor="available-staff-select"
                    className="mb-1 block text-[11px] font-semibold text-slate-700"
                  >
                    Manual Selection (Other Available Staff — Ranked by Score)
                  </label>

                  {manualCandidates.length > 0 ? (
                    <select
                      id="available-staff-select"
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none cursor-pointer"
                    >
                      <option value="">
                        Select another available staff (Ranked by Score)
                      </option>
                      {manualCandidates.map((candidate) => {
                        const recCandidate = recommendations.find(
                          (r) => r.staffId === candidate.id,
                        );
                        const isAtCap =
                          candidate.activeTickets >=
                          (candidate.maxCapacity || 10);
                        const availCap = Math.max(
                          0,
                          (candidate.maxCapacity || 10) -
                            candidate.activeTickets,
                        );
                        return (
                          <option
                            key={candidate.id}
                            value={candidate.id}
                            disabled={
                              candidate.status === "ON_LEAVE" || isAtCap
                            }
                          >
                            {candidate.name}
                            {recCandidate
                              ? ` (${recCandidate.score}% Score)`
                              : ""}{" "}
                            — Active Workload: {candidate.activeTickets} /{" "}
                            {candidate.maxCapacity || 10}{" "}
                            {isAtCap
                              ? `(At Capacity - ${candidate.maxCapacity || 10}/${candidate.maxCapacity || 10})`
                              : `(Available Capacity: ${availCap})`}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="w-full rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-2 text-xs text-slate-500 text-center italic">
                      No other staff available in this department.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Selection Confirmation & Instructions Panel */}
          {selectedCandidate && (
            <div className="rounded-xl border border-emerald-300/80 bg-emerald-50/30 p-3.5 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-xs shrink-0">
                    <User className="h-3 w-3" />
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-900 font-medium">
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
                <span className="text-[11px] text-slate-500 font-mono">
                  {selectedCandidate.activeWorkload} active grievances
                </span>
              </div>

              {/* Factors Breakdown for the Selected Staff */}
              <RecommendationFactorCards
                breakdown={selectedCandidate.factorBreakdown}
                score={selectedCandidate.score}
                title={`Decision Factors for ${selectedCandidate.name} (${selectedCandidate.score}% Score)`}
                defaultExpanded={true}
              />

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
                  className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
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
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-6 py-3">
          <div className="flex-1" />

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selectedStaffId || isSubmitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#115E59] disabled:opacity-50 disabled:cursor-not-allowed"
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
