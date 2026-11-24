"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Shield,
  UserCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  CaseNotesSkeleton,
  CaseProgressSlaSkeleton,
  CaseTimelineSkeleton,
} from "@/components/common/skeletons";
import { DepartmentFindingsTab } from "@/components/dashboard/DepartmentFindingsTab";
import type {
  CaseDrawerTab,
  CaseProgressData,
  DocumentPreviewData,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";
import {
  CaseActivityTab,
  CaseCollaborationTab,
  CaseInspectionFooter,
  CaseInspectionHeader,
  CaseNotesTab,
  CaseProgressTab,
  CaseStatementTab,
} from "./case-inspection";
import { ReviewGracePeriodModal } from "./ReviewGracePeriodModal";

export interface CaseFileInspectionModalProps {
  grievance: GrievanceItem;
  staffList: StaffMember[];
  currentHodName: string;
  hodName: string;
  currentHodEmail?: string;
  hodEmail?: string;
  initialTab?: CaseDrawerTab;
  onClose: () => void;
  onOpenDocumentPreview: (doc: DocumentPreviewData) => void;
  onDownloadDocument: (doc: DocumentPreviewData) => void;
  onAssignClick: (item: GrievanceItem) => void;
  onDirectInterveneClick?: (item: GrievanceItem) => void;
  onDeclineRequestClick?: (item: GrievanceItem) => void;
  onEscalateClick?: (item: GrievanceItem) => void;
  onReviewResolutionClick: (item: GrievanceItem) => void;
  onProposeKbClick?: (item: GrievanceItem) => void;
  onAddInternalNote: (
    grievance: GrievanceItem,
    note: string,
    parentId?: string,
    replyToAuthor?: string,
  ) => Promise<GrievanceItem | undefined>;
  onAddCollaborationNote?: (
    grievance: GrievanceItem,
    note: string,
    parentId?: string,
    replyToAuthor?: string,
  ) => Promise<GrievanceItem | undefined>;
}

export function CaseFileInspectionModal({
  grievance,
  staffList,
  currentHodName,
  hodName,
  currentHodEmail,
  hodEmail,
  initialTab = "progress",
  onClose,
  onOpenDocumentPreview,
  onDownloadDocument,
  onAssignClick,
  onDirectInterveneClick,
  onDeclineRequestClick,
  onEscalateClick,
  onReviewResolutionClick,
  onProposeKbClick,
  onAddInternalNote,
  onAddCollaborationNote,
}: CaseFileInspectionModalProps) {
  const [activeTab, setActiveTab] = useState<CaseDrawerTab>(initialTab);
  const [currentGrievance, setCurrentGrievance] =
    useState<GrievanceItem>(grievance);
  const [caseProgressLoading, setCaseProgressLoading] = useState(false);
  const [caseProgressData, setCaseProgressData] =
    useState<CaseProgressData | null>(null);
  const [isBannerReworkAccepted, setIsBannerReworkAccepted] = useState(false);

  useEffect(() => {
    setCurrentGrievance(grievance);
  }, [grievance]);

  useEffect(() => {
    let isMounted = true;
    setCaseProgressLoading(true);
    fetch(`/api/department-head/grievances/${currentGrievance.id}/progress`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load progress");
        return res.json();
      })
      .then((json) => {
        if (isMounted && json.success && json.data) {
          setCaseProgressData(json.data);
          setCurrentGrievance((prev) => ({
            ...prev,
            ...(json.data.grievance?.status
              ? {
                  status: json.data.grievance.status,
                  overallStatus: json.data.grievance.status,
                }
              : {}),
            ...(json.data.grievance?.overallStatus
              ? { overallStatus: json.data.grievance.overallStatus }
              : {}),
            ...(json.data.hodIntervention
              ? { hodIntervention: json.data.hodIntervention }
              : {}),
            ...(json.data.canSubmitFinalResolution !== undefined
              ? { canSubmitFinalResolution: json.data.canSubmitFinalResolution }
              : {}),
            ...(json.data.hasPendingSupportingDepartments !== undefined
              ? {
                  hasPendingSupportingDepartments:
                    json.data.hasPendingSupportingDepartments,
                }
              : {}),
            ...(json.data.pendingSupportingDepartmentNames
              ? {
                  pendingSupportingDepartmentNames:
                    json.data.pendingSupportingDepartmentNames,
                }
              : {}),
            ...(json.data.isPrimaryDepartment !== undefined
              ? { isPrimaryDepartment: json.data.isPrimaryDepartment }
              : {}),
            ...(json.data.myInvolvementType !== undefined
              ? { myInvolvementType: json.data.myInvolvementType }
              : {}),
            ...(json.data.departmentsInvolved
              ? { departmentsInvolved: json.data.departmentsInvolved }
              : {}),
            ...(json.data.grievance?.attachments
              ? { attachments: json.data.grievance.attachments }
              : {}),
            ...(json.data.internalNotes || json.data.grievance?.internalNotes
              ? {
                  internalNotes:
                    json.data.internalNotes ||
                    json.data.grievance?.internalNotes,
                }
              : {}),
            ...(json.data.collaborationNotes
              ? {
                  collaborationNotes: json.data.collaborationNotes,
                }
              : {}),
            ...(json.data.isBlocked !== undefined
              ? { isBlocked: json.data.isBlocked }
              : {}),
            ...(json.data.blockedReason
              ? { blockedReason: json.data.blockedReason }
              : {}),
            ...(json.data.prerequisiteDepartments
              ? { prerequisiteDepartments: json.data.prerequisiteDepartments }
              : {}),
            ...(json.data.grievance?.submittedResolution
              ? { submittedResolution: json.data.grievance.submittedResolution }
              : {}),
            ...(json.data.grievance?.hasProposedKb !== undefined
              ? { hasProposedKb: json.data.grievance.hasProposedKb }
              : {}),
            ...(json.data.supportingFindings
              ? { supportingFindings: json.data.supportingFindings }
              : {}),
            ...(json.data.grievance?.isAssignedToHead !== undefined
              ? { isAssignedToHead: json.data.grievance.isAssignedToHead }
              : json.data.assignment?.isAssignedToHead !== undefined
                ? { isAssignedToHead: json.data.assignment.isAssignedToHead }
                : {}),
            ...(json.data.assignment?.staffName
              ? { assignedStaffName: json.data.assignment.staffName }
              : {}),
            ...(json.data.assignment?.staffId
              ? { assignedStaffId: json.data.assignment.staffId }
              : {}),
            ...(json.data.latestExtension !== undefined
              ? {
                  latestExtension: json.data.latestExtension,
                  hasPendingExtension:
                    json.data.latestExtension?.status === "PENDING",
                }
              : {}),
          }));
        }
      })
      .catch((err) => {
        console.warn("Live case progress fetch error:", err);
      })
      .finally(() => {
        if (isMounted) setCaseProgressLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [currentGrievance.id]);

  const [isGracePeriodModalOpen, setIsGracePeriodModalOpen] = useState(false);

  const handleGracePeriodReviewed = async (newDueAt?: string) => {
    try {
      const pRes = await fetch(
        `/api/department-head/grievances/${currentGrievance.id}/progress`,
      );
      if (pRes.ok) {
        const pData = (await pRes.json()) as {
          success?: boolean;
          data?: CaseProgressData;
        };
        if (pData.success && pData.data) {
          setCaseProgressData(pData.data);
          setCurrentGrievance((prev) => ({
            ...prev,
            latestExtension: pData.data?.latestExtension,
            hasPendingExtension: false,
            slaDeadline: newDueAt || pData.data?.sla?.dueAt || prev.slaDeadline,
            slaTimeLeft: pData.data?.sla?.timeRemaining || prev.slaTimeLeft,
          }));
        }
      }
    } catch (err) {
      console.warn(
        "Failed to refresh case progress after grace period review:",
        err,
      );
    }
  };

  const handleDocumentClick = useCallback(
    (file: {
      id?: string;
      name: string;
      size: string;
      type: string;
      path?: string;
      downloadUrl?: string;
      uploadedAt?: string;
    }) => {
      onOpenDocumentPreview({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type || "Document",
        path: file.path,
        downloadUrl: file.downloadUrl,
        uploadedAt: file.uploadedAt || currentGrievance.createdAt || "Recent",
        grievanceNumber: currentGrievance.ticketCode || "GRS-2026",
        category: `${currentGrievance.category || "General"} / ${currentGrievance.subcategory || "General"}`,
        title: currentGrievance.title || "Grievance Record",
        submitterName: currentGrievance.submitterName || "Complainant",
        submitterRole: currentGrievance.submitterRole || "Employee",
      });
    },
    [currentGrievance, onOpenDocumentPreview],
  );

  const slaState =
    caseProgressData?.sla?.state ||
    (currentGrievance.slaStatus === "BREACHED"
      ? "BREACHED"
      : currentGrievance.slaStatus === "AT_RISK"
        ? "SLA_AT_RISK"
        : "ON_TRACK");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      {/* Dark Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-col w-full max-w-5xl max-h-[92vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <CaseInspectionHeader
          ticketCode={currentGrievance.ticketCode}
          title={currentGrievance.title}
          category={currentGrievance.category}
          subcategory={currentGrievance.subcategory}
          priority={currentGrievance.priority}
          slaState={slaState}
          status={currentGrievance.status}
          hodIntervention={
            caseProgressData?.hodIntervention !== undefined
              ? caseProgressData.hodIntervention
              : currentGrievance.hodIntervention
          }
          departmentsInvolved={
            currentGrievance.departmentsInvolved ||
            caseProgressData?.departmentsInvolved
          }
          onClose={onClose}
        />

        {/* Staff Grace Period Request Banner */}
        {(() => {
          const ext =
            currentGrievance.latestExtension?.status === "PENDING"
              ? currentGrievance.latestExtension
              : caseProgressData?.latestExtension?.status === "PENDING"
                ? caseProgressData.latestExtension
                : null;
          if (!ext) return null;

          return (
            <div className="mx-6 mt-3 rounded-xl border border-teal-300 bg-teal-50/90 p-3.5 text-xs shadow-2xs animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-1.5 bg-teal-100 rounded-lg text-teal-800 shrink-0 mt-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">
                        Staff Grace Period Request Awaiting Your Action
                      </h4>
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-teal-200/80 text-teal-900 border border-teal-300">
                        +{Math.round(ext.requestedMinutes / 60)}h Requested
                      </span>
                    </div>
                    <p className="text-xs text-teal-900 mt-1 leading-relaxed">
                      Staff member{" "}
                      <strong>
                        {ext.requestedByName ||
                          currentGrievance.assignedStaffName ||
                          "Assigned Staff"}
                      </strong>{" "}
                      requested an extension:
                    </p>
                    <p className="text-xs italic text-teal-950 mt-1 bg-white/80 px-3 py-1.5 rounded-lg border border-teal-200 font-serif">
                      &ldquo;{ext.reason}&rdquo;
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setIsGracePeriodModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 transition cursor-pointer shadow-2xs"
                  >
                    <span>Review Details</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGracePeriodModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#115E59] transition cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>
                      Review & Decide (+{Math.round(ext.requestedMinutes / 60)}
                      h)
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {currentGrievance.isAssignedStaffInactive && (
          <div className="mx-6 mt-3 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 text-rose-900 min-w-0">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <div>
                <strong className="font-semibold">
                  Staff Member Deactivated:
                </strong>{" "}
                The assigned staff member (
                <span className="font-medium underline">
                  {currentGrievance.assignedStaffName || "Staff Member"}
                </span>
                ) was deactivated by Admin. Please reassign this case to an
                active staff member to avoid SLA breach.
              </div>
            </div>
            {onAssignClick && (
              <button
                type="button"
                onClick={() => onAssignClick(currentGrievance)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700 transition shrink-0 cursor-pointer shadow-xs"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Change Assignment</span>
              </button>
            )}
          </div>
        )}

        {(currentGrievance.status === "REWORK" ||
          currentGrievance.status === "REOPENED") &&
          (currentGrievance.isPrimaryDepartment ?? true) && (
            <div className="mx-6 mt-3 rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800 shrink-0 mt-0.5">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      {isBannerReworkAccepted
                        ? `${currentGrievance.status === "REOPENED" ? "Reopening" : "Rework"} Request Accepted · Select Action`
                        : `Employee ${currentGrievance.status === "REOPENED" ? "Reopening" : "Rework"} Request Awaiting Your Action`}
                    </h4>
                    <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                      {isBannerReworkAccepted
                        ? `You accepted the ${currentGrievance.status === "REOPENED" ? "reopening" : "rework"} request. Choose to assign an eligible grievance staff for investigation, or assume direct authority to resolve personally.`
                        : `The employee requested to ${currentGrievance.status === "REOPENED" ? "reopen this closed grievance" : "rework this grievance"}. Please Accept the request to proceed with grievance staff assignment or direct intervention, or Decline the request.`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!isBannerReworkAccepted ? (
                    <>
                      {onDeclineRequestClick && (
                        <button
                          type="button"
                          onClick={() =>
                            onDeclineRequestClick(currentGrievance)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition cursor-pointer shadow-2xs"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                          <span>Decline Request</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsBannerReworkAccepted(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#115E59] transition cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Accept Request</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {onAssignClick && (
                        <button
                          type="button"
                          onClick={() => onAssignClick(currentGrievance)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 transition cursor-pointer shadow-2xs"
                        >
                          <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                          <span>Assign Staff</span>
                        </button>
                      )}
                      {onDirectInterveneClick && (
                        <button
                          type="button"
                          onClick={() =>
                            onDirectInterveneClick(currentGrievance)
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#115E59] transition cursor-pointer shadow-xs"
                        >
                          <Shield className="h-3.5 w-3.5" />
                          <span>Assume Authority</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsBannerReworkAccepted(false)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <span>Back</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-white gap-6 text-sm font-semibold shrink-0 overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("progress")}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "progress"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Progress & SLA</span>
            {caseProgressLoading && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("statement")}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === "statement"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Statement & Proofs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`py-3 border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === "notes"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Internal Discussion</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-2.5 text-slate-600">
              {currentGrievance.internalNotes?.length || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activity")}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === "activity"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Activity
          </button>
          {((currentGrievance.departmentsInvolved &&
            currentGrievance.departmentsInvolved.length > 1) ||
            (caseProgressData?.departmentsInvolved &&
              caseProgressData.departmentsInvolved.length > 1) ||
            currentGrievance.isCrossDepartment ||
            (currentGrievance.collaboratingDepartments &&
              currentGrievance.collaboratingDepartments.length > 1)) && (
            <button
              type="button"
              onClick={() => setActiveTab("collaboration")}
              className={`py-3 border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === "collaboration"
                  ? "border-[#0F766E] text-[#0F766E]"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>Collaboration</span>
              <span className="rounded-full bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.2 text-[10px] font-bold">
                {currentGrievance.collaborationNotes?.length ??
                  caseProgressData?.collaborationNotes?.length ??
                  0}
              </span>
            </button>
          )}
          {((currentGrievance.departmentsInvolved &&
            currentGrievance.departmentsInvolved.length > 1) ||
            (caseProgressData?.departmentsInvolved &&
              (caseProgressData.departmentsInvolved as unknown[]).length > 1) ||
            currentGrievance.isCrossDepartment ||
            (currentGrievance.collaboratingDepartments &&
              currentGrievance.collaboratingDepartments.length > 1) ||
            (currentGrievance.supportingFindings &&
              currentGrievance.supportingFindings.length > 0)) && (
            <button
              type="button"
              onClick={() => setActiveTab("findings")}
              className={`py-3 border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === "findings"
                  ? "border-[#0F766E] text-[#0F766E]"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>Department Findings</span>
              <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-bold">
                {currentGrievance.supportingFindings?.length || 0}
              </span>
            </button>
          )}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {activeTab === "progress" &&
            (caseProgressLoading && !caseProgressData ? (
              <CaseProgressSlaSkeleton />
            ) : (
              <CaseProgressTab
                currentGrievance={currentGrievance}
                caseProgressData={caseProgressData}
                staffList={staffList}
                currentHodEmail={currentHodEmail}
                hodEmail={hodEmail}
                onAssignClick={onAssignClick}
              />
            ))}

          {activeTab === "statement" && (
            <CaseStatementTab
              currentGrievance={currentGrievance}
              currentHodEmail={currentHodEmail}
              hodEmail={hodEmail}
              onDocumentClick={handleDocumentClick}
              onDownloadDocument={onDownloadDocument}
              onAssignClick={onAssignClick}
            />
          )}

          {activeTab === "notes" &&
            (caseProgressLoading && !currentGrievance.internalNotes?.length ? (
              <CaseNotesSkeleton count={3} />
            ) : (
              <CaseNotesTab
                currentGrievance={currentGrievance}
                onAddInternalNote={onAddInternalNote}
                onGrievanceUpdated={setCurrentGrievance}
              />
            ))}

          {activeTab === "activity" &&
            (caseProgressLoading && !caseProgressData ? (
              <CaseTimelineSkeleton stepsCount={4} />
            ) : (
              <CaseActivityTab
                currentGrievance={currentGrievance}
                caseProgressData={caseProgressData}
              />
            ))}

          {activeTab === "collaboration" &&
            (caseProgressLoading && !caseProgressData ? (
              <CaseNotesSkeleton count={2} />
            ) : (
              <CaseCollaborationTab
                currentGrievance={{
                  ...currentGrievance,
                  departmentsInvolved:
                    currentGrievance.departmentsInvolved ||
                    caseProgressData?.departmentsInvolved,
                }}
                onAddCollaborationNote={
                  onAddCollaborationNote || onAddInternalNote
                }
                onGrievanceUpdated={setCurrentGrievance}
              />
            ))}

          {activeTab === "findings" && (
            <DepartmentFindingsTab
              findings={currentGrievance.supportingFindings || []}
            />
          )}
        </div>

        {/* Sticky Footer */}
        <CaseInspectionFooter
          currentGrievance={currentGrievance}
          caseProgressData={caseProgressData}
          staffList={staffList}
          currentHodName={currentHodName}
          hodName={hodName}
          currentHodEmail={currentHodEmail}
          hodEmail={hodEmail}
          onClose={onClose}
          onAssignClick={onAssignClick}
          onDirectInterveneClick={onDirectInterveneClick}
          onDeclineRequestClick={onDeclineRequestClick}
          onEscalateClick={onEscalateClick}
          onReviewResolutionClick={onReviewResolutionClick}
          onProposeKbClick={onProposeKbClick}
          onAddInternalNote={onAddInternalNote}
          onReviewGracePeriodClick={() => setIsGracePeriodModalOpen(true)}
        />
      </div>

      {/* Review Grace Period Modal */}
      <ReviewGracePeriodModal
        isOpen={isGracePeriodModalOpen}
        onClose={() => setIsGracePeriodModalOpen(false)}
        grievance={currentGrievance}
        caseProgressData={caseProgressData}
        onSuccess={handleGracePeriodReviewed}
      />
    </div>
  );
}
