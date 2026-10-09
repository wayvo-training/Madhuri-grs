"use client";

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  FileText,
  FolderOpen,
  Lock,
  MessageSquare,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
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
}

export interface StatusHistoryItem {
  id: string;
  status: string;
  changedAt: string;
  changedBy?: string;
  roleName?: string;
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
  attachments: CaseAttachment[];
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
}

type TabType = "overview" | "resolution" | "tracking" | "documents";

export function EndUserCaseHub({
  grievance,
  resolution,
  canProvideAdditionalInfo,
  submissionCheck,
}: EndUserCaseHubProps) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as TabType | null;

  // Determine initial tab: if query param exists use that; otherwise if resolved/closed default to resolution
  const defaultTab: TabType = useMemo(() => {
    if (
      urlTab &&
      ["overview", "resolution", "tracking", "documents"].includes(urlTab)
    ) {
      return urlTab;
    }
    if (
      grievance.status === "RESOLVED" ||
      grievance.status === "UNDER_REVIEW"
    ) {
      return "resolution";
    }
    return "overview";
  }, [urlTab, grievance.status]);

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  const isResolvedOrClosed =
    grievance.status === "RESOLVED" || grievance.status === "CLOSED";
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

    const stageMap = [
      {
        id: "SUBMITTED",
        title: "Grievance Submitted",
        defaultDesc: "Submitted by Complainant",
        icon: CheckCircle2,
      },
      {
        id: "ROUTED",
        title: "Routed to Department",
        defaultDesc: `Assigned to ${grievance.departmentName || "Department"}`,
        icon: Building2,
      },
      {
        id: "ASSIGNED",
        title: "Assigned to Staff",
        defaultDesc: "Assigned for detailed investigation",
        icon: UserCheck,
      },
      {
        id: "IN_PROGRESS",
        title: "Investigation In Progress",
        defaultDesc: "Evidence analysis and verification underway",
        icon: Search,
      },
      {
        id: "RESOLUTION",
        title: "Resolution Submitted",
        defaultDesc: "Department filed findings and action outcome",
        icon: FileCheck,
      },
      {
        id: "UNDER_REVIEW",
        title: "Citizen Review",
        defaultDesc: "Pending your decision or feedback",
        icon: Eye,
      },
      {
        id: "CLOSED",
        title: "Case Closed",
        defaultDesc: "Resolution accepted and archived",
        icon: ShieldCheck,
      },
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
      if (s === "RESOLVED") {
        historyDates.RESOLUTION = h.changedAt;
        historyDates.UNDER_REVIEW = h.changedAt;
      }
      if (s === "CLOSED") historyDates.CLOSED = h.changedAt;
    });

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
    if (!historyDates.CLOSED && grievance.status === "CLOSED") {
      historyDates.CLOSED =
        grievance.statusHistory[grievance.statusHistory.length - 1]
          ?.changedAt || grievance.createdAt;
    }

    // Map current status to stage index
    const statusToIndex: Record<string, number> = {
      SUBMITTED: 0,
      ROUTED: 1,
      ASSIGNED: 2,
      IN_PROGRESS: 3,
      ESCALATED: 3,
      UNDER_REVIEW: 4,
      RESOLVED: 5,
      CLOSED: 6,
    };

    const currentIndex = statusToIndex[grievance.status] ?? 0;

    return stageMap.map((stage, idx): StageNode => {
      const isCompleted =
        idx < currentIndex ||
        (idx === currentIndex && grievance.status === "CLOSED");
      const isCurrent = idx === currentIndex && grievance.status !== "CLOSED";
      const isFuture = idx > currentIndex;

      return {
        id: stage.id,
        title: stage.title,
        description: stage.defaultDesc,
        date: historyDates[stage.id],
        isCompleted,
        isCurrent,
        isFuture,
        icon: stage.icon,
      };
    });
  }, [grievance]);

  // Combine citizen attachments and resolution attachments for the Documents tab
  const allDocuments = useMemo(() => {
    const docs = [
      ...grievance.attachments.map((att) => ({
        ...att,
        source: "Complainant Initial Proof",
      })),
    ];
    if (resolution?.attachments) {
      resolution.attachments.forEach((att) => {
        docs.push({
          id: att.id,
          name: att.name,
          path: att.path,
          size: att.size,
          type: att.type,
          source: "Official Department Resolution Evidence",
        });
      });
    }
    return docs;
  }, [grievance.attachments, resolution]);

  return (
    <div className="w-full h-full flex flex-col gap-5">
      {/* 1. TOP HEADER & BREADCRUMBS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <Link
              href="/end-user/dashboard"
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
                {grievance.departmentName || "Assigned Department"}
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
        <div className="flex items-center gap-2 sm:gap-6 border-t border-slate-100 dark:border-slate-800 mt-4 pt-2 overflow-x-auto custom-scrollbar text-xs sm:text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
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
            onClick={() => setActiveTab("resolution")}
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
            onClick={() => setActiveTab("tracking")}
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
            onClick={() => setActiveTab("documents")}
            className={`py-2.5 border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "documents"
                ? "border-[#0F766E] text-[#0F766E] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <FolderOpen className="h-4 w-4" />
            <span>Documents</span>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[11px] text-slate-600 dark:text-slate-300 font-bold">
              {allDocuments.length}
            </span>
          </button>
        </div>
      </div>

      {/* 3. TAB CONTENT PANELS */}
      <div className="flex-1 min-h-0">
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div
            id="overview-tab-content"
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-6 animate-in fade-in duration-150"
          >
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
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {grievance.departmentName || "Under Department Routing"}
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
                      <a
                        href={att.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[#0F766E] hover:underline shrink-0"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RESOLUTION */}
        {activeTab === "resolution" && (
          <div className="space-y-6 animate-in fade-in duration-150">
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
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

            {/* Vertical Stepper List (Representation 3) */}
            <div className="relative pl-6 space-y-8 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {timelineNodes.map((node) => {
                const IconComponent = node.icon;

                return (
                  <div
                    key={node.id}
                    className="relative flex items-start justify-between gap-4"
                  >
                    {/* Stepper Bullet */}
                    <div className="absolute -left-[27px] top-0 flex items-center justify-center">
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

                    {/* Step Content */}
                    <div className="min-w-0 flex-1 pl-2">
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
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Case Documents & Verification Proofs
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  All citizen attached proof documentation and official
                  department resolution evidence.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {allDocuments.length} document
                {allDocuments.length !== 1 ? "s" : ""}
              </span>
            </div>

            {allDocuments.length > 0 ? (
              <div className="space-y-3">
                {allDocuments.map((doc) => {
                  const isResolutionEvidence =
                    doc.source === "Official Department Resolution Evidence";

                  return (
                    <div
                      key={doc.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition gap-4 ${
                        isResolutionEvidence
                          ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 ${
                            isResolutionEvidence
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                              : "bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400"
                          }`}
                        >
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                              {doc.name}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isResolutionEvidence
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-300"
                                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}
                            >
                              {doc.source}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 mt-0.5 block">
                            {doc.size || "Document File"} &bull;{" "}
                            {doc.type || "Official Record"}
                          </span>
                        </div>
                      </div>

                      <a
                        href={doc.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                      >
                        <Button
                          variant="outline"
                          className="h-8 px-3.5 text-xs font-semibold rounded-xl border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1.5" />
                          <span>View Proof</span>
                        </Button>
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500">
                  No documents or proofs filed for this grievance.
                </p>
              </div>
            )}

            {/* Additional Clarification Upload Section */}
            {canProvideAdditionalInfo && (
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
                <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3">
                  Upload Additional Supporting Documents
                </h4>
                {submissionCheck.allowed ? (
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                        Staff has requested supporting clarification or
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
