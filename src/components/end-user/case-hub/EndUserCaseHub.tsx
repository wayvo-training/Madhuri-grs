"use client";

import { cn } from "cn";
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  FolderOpen,
  Lock,
  MessageSquare,
  Paperclip,
  Search,
  Shield,
  ShieldCheck,
  User,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import { AdditionalInfoModal } from "@/components/end-user/additional-info-modal";
import { PrintSectionButton } from "@/components/end-user/print-button";
import {
  type EndUserResolutionData,
  ResolutionCard,
} from "@/components/end-user/resolution-card";
import { Button } from "@/components/ui/button";

export interface CaseAttachment {
  id: string;
  name: string;
  path: string;
  size?: string;
  type?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  sourceTag?: string;
}

export interface StatusHistoryItem {
  id: string;
  status: string;
  changedAt: string;
  changedBy?: string;
  roleName?: string;
}

export interface DepartmentItem {
  id: number;
  name: string;
  involvementType: string;
  status?: string;
  assignedStaffName?: string | null;
  completedAt?: string | null;
}

export interface SupportingFindingItem {
  id: string;
  department: string;
  submittedBy?: string;
  findings?: string;
  notes?: string;
  attachments?: Array<{
    id: string;
    name: string;
    size?: string;
    type?: string;
    path: string;
    downloadUrl?: string;
  }>;
  submittedAt: string;
}

export interface CaseHubGrievance {
  id: number;
  grievanceNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  categoryName: string;
  subcategoryName: string;
  departmentName: string;
  departments?: DepartmentItem[];
  supportingFindings?: SupportingFindingItem[];
  attachments: CaseAttachment[];
  staffAttachments?: CaseAttachment[];
  statusHistory: StatusHistoryItem[];
}

interface EndUserCaseHubProps {
  grievance: CaseHubGrievance;
  resolution: EndUserResolutionData | null;
  canProvideAdditionalInfo: boolean;
  submissionCheck: {
    allowed: boolean;
    reason?: string;
  };
  requestedDocs?: string[];
}

type TabType = "overview" | "resolution" | "tracking" | "documents";

export function EndUserCaseHub({
  grievance,
  resolution,
  canProvideAdditionalInfo,
  submissionCheck,
  requestedDocs = [],
}: EndUserCaseHubProps) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as TabType | null;

  // Determine initial tab: always default to overview unless urlTab is explicitly provided
  const defaultTab: TabType = useMemo(() => {
    if (
      urlTab &&
      ["overview", "resolution", "tracking", "documents"].includes(urlTab)
    ) {
      return urlTab;
    }
    return "overview";
  }, [urlTab]);

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  // Keep activeTab in sync whenever URL tab parameter changes
  useEffect(() => {
    if (
      urlTab &&
      ["overview", "resolution", "tracking", "documents"].includes(urlTab)
    ) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const [docCategoryFilter, setDocCategoryFilter] = useState<
    "all" | "end-user" | "staff"
  >("all");

  const isResolvedOrClosed =
    Boolean(resolution) ||
    grievance.status === "RESOLVED" ||
    grievance.status === "UNDER_REVIEW" ||
    grievance.status === "CLOSED";
  const needsCitizenReview =
    grievance.status === "RESOLVED" || grievance.status === "UNDER_REVIEW";

  // Build timeline nodes for the Tracking tab
  const timelineNodes = useMemo(() => {
    interface StageNode {
      id: string;
      title: string;
      description: string;
      date?: string;
      isCompleted: boolean;
      isCurrent: boolean;
      isFuture: boolean;
      icon: typeof Check;
    }

    interface TimelineStageItem {
      id: string;
      title: string;
      defaultDesc: string;
      icon: typeof Check;
      customDate?: string;
      isCustomCompleted?: boolean;
    }

    const assignedWithStaff = (grievance.departments || []).filter((d) =>
      Boolean(d.assignedStaffName),
    );
    const assignedDesc =
      assignedWithStaff.length > 0
        ? assignedWithStaff
            .map((d) => `${d.name}: Assigned to ${d.assignedStaffName}`)
            .join(" • ")
        : "Assigned for detailed investigation";

    const baseStages: TimelineStageItem[] = [
      {
        id: "SUBMITTED",
        title: "Grievance Submitted",
        defaultDesc: "Submitted by Complainant",
        icon: CheckCircle2,
      },
      {
        id: "ROUTED",
        title: "Routed to Department",
        defaultDesc:
          grievance.departments && grievance.departments.length > 1
            ? `Assigned to ${grievance.departments.map((d) => `${d.name}${d.involvementType === "PRIMARY" ? " (Lead)" : " (Collaborator)"}`).join(", ")}`
            : `Assigned to ${grievance.departmentName || "Department"}`,
        icon: Building2,
      },
      {
        id: "ASSIGNED",
        title: "Assigned to Staff",
        defaultDesc: assignedDesc,
        icon: UserCheck,
      },
      {
        id: "IN_PROGRESS",
        title: "Investigation In Progress",
        defaultDesc: "Evidence analysis and departmental verification underway",
        icon: Search,
      },
    ];

    // Departmental findings submitted by supporting departments (e.g. HR submitted to Finance)
    const supportingFindingStages: TimelineStageItem[] = (
      grievance.supportingFindings || []
    ).map((f) => ({
      id: `FINDINGS_${f.department.replace(/\s+/g, "_").toUpperCase()}_${f.id}`,
      title: `${f.department} Findings Submitted`,
      defaultDesc: `${f.department} completed investigation and submitted findings to ${grievance.departmentName || "Lead Department"}${f.submittedBy ? ` (by ${f.submittedBy})` : ""}`,
      icon: FileCheck,
      customDate: f.submittedAt,
      isCustomCompleted: true,
    }));

    const endStages: TimelineStageItem[] = [
      {
        id: "RESOLUTION",
        title:
          grievance.departments && grievance.departments.length > 1
            ? "Final Consolidated Resolution"
            : "Resolution Submitted",
        defaultDesc:
          grievance.departments && grievance.departments.length > 1
            ? `${grievance.departmentName || "Lead Department"} compiled departmental findings and filed resolution`
            : "Department filed findings and action outcome",
        icon: FileCheck,
      },
      {
        id: "UNDER_REVIEW",
        title: "Citizen Review",
        defaultDesc:
          grievance.status === "CLOSED" || grievance.status === "RESOLVED"
            ? "Resolution reviewed and accepted"
            : "Pending your decision or feedback",
        icon: Eye,
      },
      {
        id: "CLOSED",
        title: "Case Closed",
        defaultDesc: "Resolution accepted and archived",
        icon: ShieldCheck,
      },
    ];

    const stageMap: TimelineStageItem[] = [
      ...baseStages,
      ...supportingFindingStages,
      ...endStages,
    ];

    // Find chronological dates from history
    const historyDates: Record<string, string> = {
      SUBMITTED: grievance.createdAt,
    };

    grievance.statusHistory.forEach((h) => {
      const s = h.status.toUpperCase();
      if (s === "ROUTED") historyDates.ROUTED = h.changedAt;
      if (s === "ASSIGNED") historyDates.ASSIGNED = h.changedAt;
      if (s === "IN_PROGRESS" || s === "ESCALATED")
        historyDates.IN_PROGRESS = h.changedAt;
      if (s === "UNDER_REVIEW" || s === "RESOLVED") {
        historyDates.RESOLUTION = historyDates.RESOLUTION || h.changedAt;
        historyDates.UNDER_REVIEW = h.changedAt;
      }
      if (s === "CLOSED") historyDates.CLOSED = h.changedAt;
    });

    if (resolution?.submittedAt) {
      historyDates.RESOLUTION = resolution.submittedAt;
      if (!historyDates.UNDER_REVIEW) {
        historyDates.UNDER_REVIEW = resolution.submittedAt;
      }
    }

    // Intelligent fallbacks for completed stages if intermediate status events weren't logged
    if (
      !historyDates.ROUTED &&
      grievance.departmentName &&
      grievance.status !== "SUBMITTED"
    ) {
      historyDates.ROUTED = historyDates.ASSIGNED || grievance.createdAt;
    }
    if (
      !historyDates.ASSIGNED &&
      [
        "IN_PROGRESS",
        "ESCALATED",
        "UNDER_REVIEW",
        "RESOLVED",
        "CLOSED",
      ].includes(grievance.status)
    ) {
      historyDates.ASSIGNED =
        historyDates.IN_PROGRESS || historyDates.ROUTED || grievance.createdAt;
    }
    if (
      !historyDates.IN_PROGRESS &&
      ["UNDER_REVIEW", "RESOLVED", "CLOSED"].includes(grievance.status)
    ) {
      historyDates.IN_PROGRESS =
        historyDates.RESOLUTION || historyDates.ASSIGNED || grievance.createdAt;
    }
    if (
      !historyDates.RESOLUTION &&
      ["UNDER_REVIEW", "RESOLVED", "CLOSED"].includes(grievance.status)
    ) {
      historyDates.RESOLUTION =
        resolution?.submittedAt ||
        historyDates.UNDER_REVIEW ||
        historyDates.CLOSED ||
        historyDates.IN_PROGRESS ||
        grievance.createdAt;
    }
    if (
      !historyDates.UNDER_REVIEW &&
      ["UNDER_REVIEW", "RESOLVED", "CLOSED"].includes(grievance.status)
    ) {
      historyDates.UNDER_REVIEW =
        historyDates.RESOLUTION ||
        historyDates.CLOSED ||
        historyDates.IN_PROGRESS ||
        grievance.createdAt;
    }
    if (!historyDates.CLOSED && grievance.status === "CLOSED") {
      historyDates.CLOSED =
        grievance.statusHistory[grievance.statusHistory.length - 1]
          ?.changedAt || grievance.createdAt;
    }

    const isCaseClosed = grievance.status === "CLOSED";

    // Find the index of the current active stage dynamically
    const currentStageIndex = stageMap.findIndex((s) => {
      if (isCaseClosed) return s.id === "CLOSED";
      if (
        grievance.status === "RESOLVED" ||
        grievance.status === "UNDER_REVIEW"
      ) {
        return s.id === "UNDER_REVIEW";
      }
      if (
        grievance.status === "IN_PROGRESS" ||
        grievance.status === "ESCALATED"
      ) {
        return s.id === "IN_PROGRESS";
      }
      if (grievance.status === "ASSIGNED") return s.id === "ASSIGNED";
      if (grievance.status === "ROUTED") return s.id === "ROUTED";
      return s.id === "SUBMITTED";
    });

    const activeIdx = currentStageIndex >= 0 ? currentStageIndex : 0;

    return stageMap.map((stage, idx): StageNode => {
      if (isCaseClosed) {
        return {
          id: stage.id,
          title: stage.title,
          description: stage.defaultDesc,
          date: stage.customDate || historyDates[stage.id],
          isCompleted: true,
          isCurrent: false,
          isFuture: false,
          icon: stage.icon,
        };
      }

      if (stage.isCustomCompleted) {
        return {
          id: stage.id,
          title: stage.title,
          description: stage.defaultDesc,
          date: stage.customDate,
          isCompleted: true,
          isCurrent: false,
          isFuture: false,
          icon: stage.icon,
        };
      }

      const isCompleted = idx < activeIdx;
      const isCurrent = idx === activeIdx;
      const isFuture = idx > activeIdx;

      return {
        id: stage.id,
        title: stage.title,
        description: stage.defaultDesc,
        date: stage.customDate || historyDates[stage.id],
        isCompleted,
        isCurrent,
        isFuture,
        icon: stage.icon,
      };
    });
  }, [grievance, resolution?.submittedAt]);

  // Separate documents into End User Documents and Investigation Staff Documents
  const endUserDocuments = useMemo(() => {
    return (grievance.attachments || []).map((att) => ({
      ...att,
      sourceTag: att.sourceTag || "End User Submission",
    }));
  }, [grievance.attachments]);

  const staffDocuments = useMemo(() => {
    const list = [...(grievance.staffAttachments || [])];
    const seenIds = new Set(list.map((d) => d.id));
    if (resolution?.attachments) {
      resolution.attachments.forEach((att) => {
        if (!seenIds.has(att.id)) {
          seenIds.add(att.id);
          list.push({
            id: att.id,
            name: att.name,
            path: att.path,
            size: att.size,
            type: att.type,
            sourceTag: "Official Resolution Evidence",
            uploadedBy: "Resolution Officer",
          });
        }
      });
    }
    return list;
  }, [grievance.staffAttachments, resolution]);

  const totalDocumentsCount = endUserDocuments.length + staffDocuments.length;

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      {/* 1. TOP HEADER & BREADCRUMBS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-2xs shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <Link
              href="/end-user/grievances"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0F766E] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Grievances</span>
            </Link>

            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Grievance #{grievance.grievanceNumber}
              </h2>
              <StatusBadge status={grievance.status} />
              <PriorityBadge priority={grievance.priority} />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{grievance.categoryName || "General"}</span>
              <span className="mx-1.5 text-slate-300 dark:text-slate-700">
                &bull;
              </span>
              <span>{grievance.subcategoryName || "General"}</span>
              <span className="mx-1.5 text-slate-300 dark:text-slate-700">
                &bull;
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                {grievance.departments && grievance.departments.length > 1
                  ? grievance.departments.map((d) => d.name).join(" • ")
                  : grievance.departmentName || "Assigned Department"}
              </span>
            </p>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <Link href={`/end-user/messages/${grievance.id}`}>
              <Button
                variant="outline"
                className="flex items-center gap-2 rounded-xl text-xs sm:text-sm font-semibold h-9 px-3.5 border-teal-200 text-[#0F766E] hover:bg-teal-50 dark:border-teal-900/60 dark:text-teal-400 dark:hover:bg-teal-950/40 transition"
              >
                <MessageSquare className="h-4 w-4 text-[#0F766E] dark:text-teal-400" />
                <span>Messages</span>
              </Button>
            </Link>

            {activeTab === "overview" && (
              <PrintSectionButton
                targetId="overview-tab-content"
                documentTitle={`Grievance Details - ${grievance.grievanceNumber}`}
                reportHeaderTitle="Grievance Statement & Particulars Report"
                label="Download PDF"
              />
            )}
            {activeTab === "resolution" && isResolvedOrClosed && (
              <PrintSectionButton
                targetId="official-resolution-card"
                documentTitle={`Official Resolution - ${grievance.grievanceNumber}`}
                reportHeaderTitle="Official Department Resolution Report"
                label="Download PDF"
              />
            )}
          </div>
        </div>

        {/* 2. CASE HUB NAVIGATION TABS */}
        <div className="flex items-center gap-2 sm:gap-6 border-t border-slate-100 dark:border-slate-800 mt-3 pt-1.5 overflow-x-auto custom-scrollbar text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => handleTabChange("overview")}
            className={`py-2.5 border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "overview"
                ? "border-[#0F766E] text-[#0F766E] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("resolution")}
            className={`py-2.5 border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "resolution"
                ? "border-[#0F766E] text-[#0F766E] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Resolution</span>
            {needsCitizenReview && (
              <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                Decision Required
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("tracking")}
            className={`py-2.5 border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "tracking"
                ? "border-[#0F766E] text-[#0F766E] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Tracking</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("documents")}
            className={`py-2.5 border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "documents"
                ? "border-[#0F766E] text-[#0F766E] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            <span>Documents</span>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[11px] text-slate-600 dark:text-slate-300 font-bold">
              {totalDocumentsCount}
            </span>
          </button>
        </div>
      </div>

      {/* 3. TAB CONTENT PANELS */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div
            id="overview-tab-content"
            className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-5 animate-in fade-in duration-150"
          >
            {resolution && needsCitizenReview && (
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg text-emerald-700 dark:text-emerald-300 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      Official Department Resolution Available
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                      The responsible department has filed findings and
                      resolution for your grievance. You can review the outcome,
                      accept it, or reopen if unsatisfied.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("resolution")}
                  className="shrink-0 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-center"
                >
                  <span>Review Resolution</span>
                  <span>&rarr;</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Grievance Statement & Particulars
              </h3>
              <span className="text-xs text-slate-400">
                Submitted on{" "}
                {new Date(grievance.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-800/20 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Grievance Title
                  </div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {grievance.title}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Classification
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {grievance.categoryName} • {grievance.subcategoryName}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Responsible Department
                    {grievance.departments && grievance.departments.length > 1
                      ? "s"
                      : ""}
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {grievance.departments &&
                    grievance.departments.length > 1 ? (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {grievance.departments.map((d) => (
                          <span
                            key={d.id}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold"
                          >
                            <span>{d.name}</span>
                            {d.involvementType === "PRIMARY" ? (
                              <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                                Lead
                              </span>
                            ) : (
                              <span className="text-[10px] text-teal-600/80 dark:text-teal-400 font-medium">
                                ({d.involvementType.toLowerCase()})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      grievance.departmentName || "Under Department Routing"
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Current Status
                  </div>
                  <div>
                    <StatusBadge status={grievance.status} />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
                <div className="text-xs font-medium text-slate-500 mb-2">
                  Detailed Statement & Description
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  {grievance.description}
                </div>
              </div>

              {/* Collaborative Department Findings Section */}
              {grievance.supportingFindings &&
                grievance.supportingFindings.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Collaborative Department Findings & Input
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {grievance.supportingFindings.map((f) => (
                        <div
                          key={f.id}
                          className="p-3.5 rounded-xl border border-teal-200/80 dark:border-teal-800/60 bg-teal-50/30 dark:bg-teal-950/20 text-xs space-y-2"
                        >
                          <div className="flex items-center justify-between pb-1.5 border-b border-teal-100 dark:border-teal-900/40">
                            <span className="font-bold text-teal-900 dark:text-teal-200">
                              {f.department} Findings
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Submitted to{" "}
                              {grievance.departmentName || "Lead Department"}{" "}
                              {new Date(f.submittedAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {f.findings || f.notes}
                          </p>
                          {f.attachments && f.attachments.length > 0 && (
                            <div className="pt-2 border-t border-teal-100/70 dark:border-teal-900/30 space-y-1.5">
                              <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-1">
                                <Paperclip className="h-3 w-3" />
                                Supportive Documents ({f.attachments.length})
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {f.attachments.map((att, aIdx) => (
                                  <div
                                    key={att.id || `f-att-${aIdx}`}
                                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900/60 border border-teal-200/60 dark:border-teal-900/40 text-xs shadow-2xs"
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <FileText className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                                      <div className="min-w-0">
                                        <p
                                          className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-35"
                                          title={att.name}
                                        >
                                          {att.name}
                                        </p>
                                        {att.size && (
                                          <p className="text-[10px] text-slate-400">
                                            {att.size}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {att.downloadUrl ? (
                                        <>
                                          <a
                                            href={att.downloadUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                                            title="View Document"
                                          >
                                            <Eye className="h-2.5 w-2.5" />
                                            View
                                          </a>
                                          <a
                                            href={att.downloadUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={att.name}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                            title="Download Document"
                                          >
                                            <Download className="h-2.5 w-2.5" />
                                            Save
                                          </a>
                                        </>
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {f.submittedBy && (
                            <div className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                              Investigated by: {f.submittedBy}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Quick Document Strip */}
            {grievance.attachments.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                    Initial Attached Proofs ({grievance.attachments.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab("documents")}
                    className="text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
                  >
                    View all in Documents tab &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {grievance.attachments.slice(0, 4).map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {att.name}
                        </span>
                      </div>
                      <Link
                        href={att.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[#0F766E] hover:underline shrink-0"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RESOLUTION */}
        {activeTab === "resolution" && (
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-6 animate-in fade-in duration-150">
            {resolution ? (
              <ResolutionCard
                resolution={resolution}
                status={grievance.status}
                grievanceId={grievance.id.toString()}
                grievanceNumber={grievance.grievanceNumber}
                showDownloadButton={true}
              />
            ) : grievance.status === "CLOSED" ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-8 text-center space-y-3 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Case Concluded Directly
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  This grievance has been formally closed and concluded. No
                  separate investigative resolution document was filed for this
                  case (e.g. resolved directly by administration or procedural
                  closure).
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("tracking")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
                  >
                    <span>
                      View lifecycle milestones in Tracking tab &rarr;
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-8 text-center space-y-3 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-[#0F766E] mx-auto">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Official Resolution Pending
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your grievance is currently under active investigation by{" "}
                  <strong>
                    {grievance.departmentName || "the assigned department"}
                  </strong>
                  . Once the department head submits and approves the formal
                  resolution, it will appear right here for your review and
                  final acceptance.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("tracking")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F766E] hover:underline cursor-pointer"
                  >
                    <span>Check live progress in Tracking tab &rarr;</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TRACKING */}
        {activeTab === "tracking" && (
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Case Lifecycle & Investigation Milestones
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological trail of departmental handling from submission
                  to resolution.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">
                  Current:
                </span>
                <StatusBadge status={grievance.status} />
              </div>
            </div>

            {/* Vertical Stepper List */}
            <div className="space-y-0 pt-1">
              {timelineNodes.map((node, index) => {
                const IconComponent = node.icon;
                const isLast = index === timelineNodes.length - 1;

                return (
                  <div key={node.id} className="flex items-stretch gap-4">
                    {/* Stepper Column (Bullet + Vertical Centered Line) */}
                    <div className="flex flex-col items-center shrink-0 w-6">
                      {/* Stepper Bullet */}
                      <div className="flex items-center justify-center shrink-0">
                        {node.isCompleted ? (
                          <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                          </div>
                        ) : node.isCurrent ? (
                          <div className="h-6 w-6 rounded-full bg-teal-600 ring-4 ring-teal-100 dark:ring-teal-950 text-white flex items-center justify-center shadow-xs animate-pulse">
                            <IconComponent className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-300 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                          </div>
                        )}
                      </div>

                      {/* Line to next node - perfectly centered */}
                      {!isLast && (
                        <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-800 my-1" />
                      )}
                    </div>

                    {/* Step Content */}
                    <div
                      className={cn(
                        "min-w-0 flex-1 flex items-start justify-between gap-4",
                        !isLast && "pb-7",
                      )}
                    >
                      <div className="min-w-0">
                        <div
                          className={`text-sm font-bold leading-tight ${
                            node.isCurrent
                              ? "text-[#0F766E] dark:text-teal-400 font-extrabold"
                              : node.isCompleted
                                ? "text-slate-800 dark:text-slate-200"
                                : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {node.title}
                        </div>
                        <p
                          className={`text-xs mt-0.5 ${
                            node.isCurrent
                              ? "text-slate-700 dark:text-slate-300 font-medium"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {node.description}
                        </p>
                      </div>

                      {/* Date / Timestamp */}
                      <div className="text-right shrink-0">
                        {node.date ? (
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {new Date(node.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            <span className="block text-[11px] font-normal text-slate-400">
                              {new Date(node.date).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ) : node.isCompleted ? (
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            Completed
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-7 animate-in fade-in duration-150">
            {/* Header with Category Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Case Documents & Verification Proofs
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Separated repository of documents submitted by you and records
                  shared by the investigation staff.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setDocCategoryFilter("all")}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                    docCategoryFilter === "all"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
                  )}
                >
                  All ({totalDocumentsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setDocCategoryFilter("end-user")}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1",
                    docCategoryFilter === "end-user"
                      ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
                  )}
                >
                  <User className="h-3 w-3" />
                  <span>Shared by You ({endUserDocuments.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDocCategoryFilter("staff")}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1",
                    docCategoryFilter === "staff"
                      ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
                  )}
                >
                  <Shield className="h-3 w-3" />
                  <span>Investigation Staff ({staffDocuments.length})</span>
                </button>
              </div>
            </div>

            {/* SECTION 1: DOCUMENTS SHARED BY END USER */}
            {(docCategoryFilter === "all" ||
              docCategoryFilter === "end-user") && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-[#0F766E] dark:text-teal-400">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        Documents Shared by You (End User / Complainant)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Initial grievance statement proofs and additional
                        supportive documents uploaded by you.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 text-[#0F766E] dark:text-teal-300 border border-teal-200/50 dark:border-teal-800">
                    {endUserDocuments.length} file
                    {endUserDocuments.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {endUserDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1.5">
                    {endUserDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-300 dark:hover:border-teal-700 transition gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-teal-50 text-[#0F766E] dark:bg-teal-950/40 dark:text-teal-400 shrink-0">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                                {doc.name}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {doc.sourceTag || "Complainant Proof"}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span>{doc.size || "Document File"}</span>
                              <span>&bull;</span>
                              <span>{doc.type || "Official Record"}</span>
                              {doc.uploadedAt && (
                                <>
                                  <span>&bull;</span>
                                  <span>
                                    Uploaded on{" "}
                                    {new Date(
                                      doc.uploadedAt,
                                    ).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <Link
                            href={doc.path}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-semibold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              <span>View</span>
                            </Button>
                          </Link>

                          <Link
                            href={`${doc.path}?download=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-semibold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
                              <span>Download</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500">
                      No initial or additional documents have been uploaded by
                      you for this grievance.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: DOCUMENTS SHARED BY INVESTIGATION STAFF */}
            {(docCategoryFilter === "all" || docCategoryFilter === "staff") && (
              <div className="space-y-3.5 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        Documents Shared by Investigation Staff
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Official inquiry findings, departmental evidence, and
                        formal resolution documentation shared with you.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800">
                    {staffDocuments.length} file
                    {staffDocuments.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {staffDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1.5">
                    {staffDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 hover:border-emerald-300 transition gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 shrink-0">
                            <FileCheck className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                {doc.name}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-300">
                                {doc.sourceTag || "Investigation Evidence"}
                              </span>
                              {doc.uploadedBy && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  by {doc.uploadedBy}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span>{doc.size || "Document File"}</span>
                              <span>&bull;</span>
                              <span>{doc.type || "Official Record"}</span>
                              {doc.uploadedAt && (
                                <>
                                  <span>&bull;</span>
                                  <span>
                                    Shared on{" "}
                                    {new Date(
                                      doc.uploadedAt,
                                    ).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <Link
                            href={doc.path}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-semibold rounded-xl border-emerald-200 hover:bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              <span>View</span>
                            </Button>
                          </Link>

                          <Link
                            href={`${doc.path}?download=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              type="button"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-semibold rounded-xl border-emerald-200 hover:bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Download className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                              <span>Download</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500">
                      No investigation or resolution documents have been shared
                      by the staff team yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Additional Clarification Upload Section */}
            {canProvideAdditionalInfo && (
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3">
                  Upload Additional Supportive Documents
                </h4>
                {submissionCheck.allowed ? (
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        Staff has requested supportive clarification or
                        documentation
                      </h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Upload relevant bills, receipts, or medical proofs
                        directly to the case file.
                      </p>
                    </div>
                    <div className="shrink-0">
                      <AdditionalInfoModal
                        grievanceId={grievance.id.toString()}
                        requestedDocs={requestedDocs}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3 text-xs text-slate-500">
                    <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>
                      {submissionCheck.reason ||
                        "Document upload is locked until staff or department head requests additional evidence."}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
