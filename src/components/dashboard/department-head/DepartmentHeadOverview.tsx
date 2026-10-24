"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ProposeKnowledgeModal } from "@/components/knowledge/ProposeKnowledgeModal";
import { ResolutionForm } from "@/components/staff/resolution-form";
import {
  useDepartmentHeadNavigation,
  useGrievanceActions,
  useQueueFilters,
  useStaffActions,
} from "@/hooks/department-head";
import { hasHeadResolutionAuthority } from "@/lib/department-head/filters";
import type {
  CaseDrawerTab,
  DepartmentHeadOverviewProps,
  DocumentPreviewData,
  EscalationBottleneck,
  EscalationInterventionType,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";
import type { StaffGrievanceItem } from "@/types/staff";
import { DepartmentHeadViewSwitcher } from "./components";
import { DepartmentHeadProvider } from "./DepartmentHeadContext";
import {
  CaseFileInspectionModal,
  DepartmentHeadEscalationModal,
  DepartmentHeadResolutionModal,
  DocumentViewerModal,
  SmartStaffAssignmentModal,
} from "./modals";
import {
  ActivityView,
  KnowledgeView,
  OverviewView,
  QueueView,
  StaffView,
} from "./views";

export function DepartmentHeadOverviewInner({
  initialData,
  departmentName = "Department Operations",
  hodName = "Department Head",
  hodEmail = "",
  employeeCode = "HOD-01",
  isAdminPreview: _isAdminPreview = false,
  initialView = "overview",
  initialStatusFilter,
  initialPriorityFilter,
  initialStaffFilter,
  initialTab,
}: DepartmentHeadOverviewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Data management via server component initialData
  const [grievances, setGrievances] = useState<GrievanceItem[]>(
    initialData?.grievances || [],
  );
  const [staffList, setStaffList] = useState<StaffMember[]>(
    initialData?.staffList || [],
  );
  const [governanceAuditFeed, setGovernanceAuditFeed] = useState(
    initialData?.governanceAuditFeed || [],
  );
  const [availableDepartments, setAvailableDepartments] = useState(
    initialData?.availableDepartments || [],
  );
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    initialData?.selectedDeptId || "",
  );

  const [currentDepartmentName, setCurrentDepartmentName] =
    useState(departmentName);
  const [currentHodName, setCurrentHodName] = useState(hodName);
  const [currentHodEmail, setCurrentHodEmail] = useState(hodEmail);
  const [currentEmployeeCode, setCurrentEmployeeCode] = useState(employeeCode);
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize state when server component passes fresh initialData (e.g. after router.refresh() or router.push())
  useEffect(() => {
    if (initialData) {
      if (initialData.grievances) setGrievances(initialData.grievances);
      if (initialData.staffList) setStaffList(initialData.staffList);
      if (initialData.governanceAuditFeed)
        setGovernanceAuditFeed(initialData.governanceAuditFeed);
      if (initialData.availableDepartments)
        setAvailableDepartments(initialData.availableDepartments);
      if (initialData.selectedDeptId)
        setSelectedDeptId(initialData.selectedDeptId);
    }
    if (departmentName) setCurrentDepartmentName(departmentName);
    if (hodName) setCurrentHodName(hodName);
    if (hodEmail) setCurrentHodEmail(hodEmail);
    if (employeeCode) setCurrentEmployeeCode(employeeCode);
  }, [initialData, departmentName, hodName, hodEmail, employeeCode]);

  const loadData = useCallback(
    async (deptId?: string, isSilentRefresh = false) => {
      const targetDeptId = deptId !== undefined ? deptId : selectedDeptId;
      if (targetDeptId && targetDeptId !== selectedDeptId) {
        setSelectedDeptId(targetDeptId);
        const params = new URLSearchParams(searchParams.toString());
        params.set("deptId", targetDeptId);
        router.push(`${pathname}?${params.toString()}`);
      } else {
        if (!isSilentRefresh) {
          setIsLoading(true);
        }
        router.refresh();
        setIsLoading(false);
      }
    },
    [selectedDeptId, searchParams, pathname, router],
  );

  // Navigation
  const { activeView, switchView } = useDepartmentHeadNavigation(initialView);

  // Queue Filters & Metrics
  const {
    selectedTab,
    setSelectedTab,
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter,
    staffFilter,
    setStaffFilter,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    resetFilters,
    metrics,
    attentionRequiredList,
    filteredGrievances,
  } = useQueueFilters({
    grievances,
    staffList,
    initialStatusFilter,
    initialPriorityFilter,
    initialStaffFilter,
    initialTab,
  });

  // Operational Grievance Actions
  const {
    actionSuccessMessage,
    setActionSuccessMessage,
    showSuccess,
    handleAssignmentSuccess,
    handleEscalationSubmit: executeEscalationSubmit,
    handleResolutionSubmit: executeResolutionSubmit,
    handleAddInternalNote,
    handleAddCollaborationNote,
    handleDownloadDocument,
  } = useGrievanceActions({
    currentHodName,
    hodName,
    staffList,
    setStaffList,
    setGrievances,
    setGovernanceAuditFeed,
    loadData,
  });

  // Staff Availability Actions
  const { handleToggleStaffAvailability } = useStaffActions({
    setStaffList,
    showSuccess,
    loadData,
  });

  // Modals state
  const [assignModalGrievance, setAssignModalGrievance] =
    useState<GrievanceItem | null>(null);

  const [escalationModalGrievance, setEscalationModalGrievance] =
    useState<GrievanceItem | null>(null);
  const [escalationBottleneck, setEscalationBottleneck] =
    useState<EscalationBottleneck>("STAFF_CAPACITY");
  const [escalationBottleneckExplanation, setEscalationBottleneckExplanation] =
    useState("");
  const [escalationInterventionType, setEscalationInterventionType] =
    useState<EscalationInterventionType>("ASSUME_RESOLUTION_AUTHORITY");
  const [escalationTargetStaffId, setEscalationTargetStaffId] = useState("");
  const [escalationTargetDept, setEscalationTargetDept] = useState("");
  const [escalationNote, setEscalationNote] = useState("");
  const [escalationExtensionHours, setEscalationExtensionHours] =
    useState<number>(24);

  const [resolutionModalGrievance, setResolutionModalGrievance] =
    useState<GrievanceItem | null>(null);
  const [resolutionDecision, setResolutionDecision] = useState<
    "APPROVE" | "CLARIFY"
  >("APPROVE");
  const [resolutionFeedback, setResolutionFeedback] = useState("");

  const [selectedCaseFile, setSelectedCaseFile] =
    useState<GrievanceItem | null>(null);
  const [caseDrawerTab, setCaseDrawerTab] = useState<CaseDrawerTab>("progress");

  const [previewDocument, setPreviewDocument] =
    useState<DocumentPreviewData | null>(null);

  const [proposeKbGrievance, setProposeKbGrievance] =
    useState<GrievanceItem | null>(null);

  // Modal Handlers
  const handleOpenProposeKbModal = useCallback((item: GrievanceItem) => {
    setProposeKbGrievance(item);
  }, []);

  const handleOpenAssignModal = useCallback(
    (item: GrievanceItem, _currentStaffId?: string) => {
      if (
        item.status === "CLOSED" ||
        item.status === "RESOLVED" ||
        item.status === "COMPLETED" ||
        item.status === "UNDER_REVIEW" ||
        item.myDepartmentStatus === "COMPLETED"
      ) {
        toast.error(
          `Cannot assign or change assignment for a ${item.status.toLowerCase().replace(/_/g, " ")} grievance.`,
        );
        return;
      }
      if (item.isBlocked || item.myDepartmentStatus === "BLOCKED") {
        toast.error(
          "Cannot assign staff: This department is currently BLOCKED waiting for prerequisite departments to complete.",
        );
        return;
      }
      setAssignModalGrievance(item);
    },
    [],
  );

  const handleOpenEscalateModal = useCallback(
    (item: GrievanceItem) => {
      if (item.status === "CLOSED" || item.status === "RESOLVED") {
        toast.error(
          `Cannot intervene on a ${item.status.toLowerCase()} grievance.`,
        );
        return;
      }
      if (
        item.isBlocked ||
        item.myDepartmentStatus === "BLOCKED" ||
        item.status === "BLOCKED"
      ) {
        toast.error(
          "Cannot intervene: This department is currently BLOCKED waiting for prerequisite departments to complete.",
        );
        return;
      }
      setEscalationModalGrievance(item);
      setEscalationBottleneck("STAFF_CAPACITY");
      setEscalationBottleneckExplanation("");
      setEscalationInterventionType("ASSUME_RESOLUTION_AUTHORITY");
      setEscalationTargetStaffId("");
      const defaultDept =
        availableDepartments.find(
          (d) =>
            d.name !== currentDepartmentName &&
            !item.collaboratingDepartments?.includes(d.name),
        )?.name || "";
      setEscalationTargetDept(defaultDept);
      setEscalationNote("");
      setEscalationExtensionHours(24);
    },
    [availableDepartments, currentDepartmentName],
  );

  const handleOpenResolutionModal = useCallback((item: GrievanceItem) => {
    setResolutionModalGrievance(item);
    setResolutionDecision("APPROVE");
    setResolutionFeedback("");
  }, []);

  const handleInspectCase = useCallback(
    (item: GrievanceItem, tab: CaseDrawerTab = "progress") => {
      setSelectedCaseFile(item);
      setCaseDrawerTab(tab);
    },
    [],
  );

  const handleEscalationFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalationModalGrievance) return;

    if (escalationInterventionType === "REASSIGN" && !escalationTargetStaffId) {
      const g = escalationModalGrievance;
      setEscalationModalGrievance(null);
      handleOpenAssignModal(g);
      return;
    }

    await executeEscalationSubmit({
      grievance: escalationModalGrievance,
      bottleneck: escalationBottleneck,
      bottleneckExplanation: escalationBottleneckExplanation,
      interventionType: escalationInterventionType,
      targetStaffId: escalationTargetStaffId,
      targetDept: escalationTargetDept,
      note: escalationNote,
      extensionHours: escalationExtensionHours,
    });
    setEscalationModalGrievance(null);
  };

  const handleResolutionFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionModalGrievance) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const findings = formData.get("findings") as string | null;
    const actionTaken = formData.get("actionTaken") as string | null;

    await executeResolutionSubmit({
      grievance: resolutionModalGrievance,
      decision: resolutionDecision,
      feedback: resolutionFeedback,
      findings: findings || undefined,
      actionTaken: actionTaken || undefined,
    });
    setResolutionModalGrievance(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 gap-2.5 sm:gap-3">
      {/* Top View Navigation & Global Controls */}
      <DepartmentHeadViewSwitcher
        activeView={activeView}
        switchView={switchView}
        unassignedCount={metrics.unassignedCount}
        staffCount={staffList.length}
        atRiskCount={metrics.atRiskCount}
        escalatedCount={metrics.escalatedCount}
        availableDepartments={availableDepartments}
        selectedDeptId={selectedDeptId}
        currentDepartmentName={currentDepartmentName}
        onDepartmentChange={(deptId) => {
          setSelectedDeptId(deptId);
          loadData(deptId);
        }}
        actionSuccessMessage={actionSuccessMessage}
        onClearSuccessMessage={() => setActionSuccessMessage(null)}
      />

      {/* Main Feature Views */}
      {activeView === "overview" && (
        <OverviewView
          currentDepartmentName={currentDepartmentName}
          currentHodName={currentHodName}
          currentHodEmail={currentHodEmail}
          currentEmployeeCode={currentEmployeeCode}
          metrics={metrics}
          attentionRequiredList={attentionRequiredList}
          grievances={grievances}
          staffList={staffList}
          governanceAuditFeed={governanceAuditFeed}
          isLoading={isLoading}
          onViewQueue={() => switchView("queue")}
          onViewStaff={() => switchView("staff")}
          onViewActivity={() => switchView("activity")}
          onInspectGrievance={handleInspectCase}
          onFilterQueue={(filterType, value) => {
            resetFilters();
            if (filterType === "status") {
              setStatusFilter(value);
              switchView("queue", { status: value });
            } else if (filterType === "priority") {
              setPriorityFilter(value);
              switchView("queue", { priority: value });
            }
          }}
        />
      )}

      {activeView === "queue" && (
        <QueueView
          grievances={grievances}
          filteredGrievances={filteredGrievances}
          staffList={staffList}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          staffFilter={staffFilter}
          setStaffFilter={setStaffFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          availableDepartments={availableDepartments}
          selectedDeptId={selectedDeptId}
          isLoading={isLoading}
          onDepartmentChange={(deptId) => {
            setSelectedDeptId(deptId);
            loadData(deptId);
          }}
          resetFilters={resetFilters}
          metrics={metrics}
          onInspect={handleInspectCase}
          onAssign={handleOpenAssignModal}
          onIntervene={handleOpenEscalateModal}
          onReviewResolution={handleOpenResolutionModal}
          onProposeKb={handleOpenProposeKbModal}
        />
      )}

      {activeView === "staff" && (
        <StaffView
          staffList={staffList}
          grievances={grievances}
          currentDepartmentName={currentDepartmentName}
          metrics={metrics}
          isLoading={isLoading}
          onToggleAvailability={handleToggleStaffAvailability}
          onInspect={handleInspectCase}
          onReassign={(item, staffId) => handleOpenAssignModal(item, staffId)}
          onFilterStaffInQueue={(staffId) => {
            resetFilters();
            setStaffFilter(staffId);
            switchView("queue", { staff: staffId });
          }}
        />
      )}

      {activeView === "activity" && (
        <ActivityView
          governanceAuditFeed={governanceAuditFeed}
          isLoading={isLoading}
        />
      )}

      {activeView === "sla" && (
        <QueueView
          grievances={grievances}
          filteredGrievances={filteredGrievances}
          staffList={staffList}
          selectedTab="ESCALATED"
          setSelectedTab={setSelectedTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          staffFilter={staffFilter}
          setStaffFilter={setStaffFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          availableDepartments={availableDepartments}
          selectedDeptId={selectedDeptId}
          isLoading={isLoading}
          onDepartmentChange={(deptId) => {
            setSelectedDeptId(deptId);
            loadData(deptId);
          }}
          resetFilters={resetFilters}
          metrics={metrics}
          onInspect={handleInspectCase}
          onAssign={handleOpenAssignModal}
          onIntervene={handleOpenEscalateModal}
          onReviewResolution={handleOpenResolutionModal}
          onProposeKb={handleOpenProposeKbModal}
        />
      )}

      {activeView === "knowledge" && <KnowledgeView />}

      {/* Modals & Dialogs */}
      {assignModalGrievance && (
        <SmartStaffAssignmentModal
          grievance={assignModalGrievance}
          currentDepartmentName={currentDepartmentName}
          staffList={staffList}
          onClose={() => setAssignModalGrievance(null)}
          onAssignmentSuccess={(staffId, staffName) => {
            handleAssignmentSuccess(assignModalGrievance, staffId, staffName);
            setSelectedCaseFile((prev) =>
              prev && prev.id === assignModalGrievance.id
                ? {
                    ...prev,
                    assignedStaffId: staffId,
                    assignedStaffName: staffName,
                    status: "ASSIGNED",
                  }
                : prev,
            );
            setAssignModalGrievance(null);
          }}
        />
      )}

      {escalationModalGrievance && (
        <DepartmentHeadEscalationModal
          grievance={escalationModalGrievance}
          bottleneck={escalationBottleneck}
          bottleneckExplanation={escalationBottleneckExplanation}
          interventionType={escalationInterventionType}
          targetDept={escalationTargetDept}
          targetStaffId={escalationTargetStaffId}
          note={escalationNote}
          availableDepartments={availableDepartments}
          staffList={staffList}
          currentDepartmentName={currentDepartmentName}
          onClose={() => setEscalationModalGrievance(null)}
          onSubmit={handleEscalationFormSubmit}
          onBottleneckChange={setEscalationBottleneck}
          onBottleneckExplanationChange={setEscalationBottleneckExplanation}
          onInterventionTypeChange={setEscalationInterventionType}
          onTargetDeptChange={setEscalationTargetDept}
          onTargetStaffIdChange={setEscalationTargetStaffId}
          onNoteChange={setEscalationNote}
          extensionHours={escalationExtensionHours}
          onExtensionHoursChange={setEscalationExtensionHours}
          onNavigateToSmartAssignment={(item) => {
            setEscalationModalGrievance(null);
            handleOpenAssignModal(item);
          }}
        />
      )}

      {resolutionModalGrievance &&
        (hasHeadResolutionAuthority(resolutionModalGrievance) ||
        (resolutionModalGrievance.reopenCount ?? 0) >= 2 ||
        resolutionModalGrievance.status !== "UNDER_REVIEW" ? (
          <ResolutionForm
            isOpen={!!resolutionModalGrievance}
            onClose={() => setResolutionModalGrievance(null)}
            grievance={
              {
                id: resolutionModalGrievance.id,
                grievanceNumber: resolutionModalGrievance.ticketCode,
                category: resolutionModalGrievance.category,
                title: resolutionModalGrievance.title,
                status: resolutionModalGrievance.status,
                priority: resolutionModalGrievance.priority,
                reopenCount: resolutionModalGrievance.reopenCount,
                isPrimaryOwner: resolutionModalGrievance.isPrimaryDepartment,
                myInvolvementType: resolutionModalGrievance.myInvolvementType,
              } as StaffGrievanceItem
            }
            onSubmit={async (_id, data) => {
              await executeResolutionSubmit({
                grievance: resolutionModalGrievance,
                decision: "APPROVE",
                feedback: data.problemSummary,
                findings: data.findings,
                actionTaken: data.actionTaken,
                outcome: data.outcome,
                evidence: data.evidence || undefined,
              });
              setResolutionModalGrievance(null);
            }}
          />
        ) : (
          <DepartmentHeadResolutionModal
            grievance={resolutionModalGrievance}
            decision={resolutionDecision}
            feedback={resolutionFeedback}
            onClose={() => setResolutionModalGrievance(null)}
            onSubmit={handleResolutionFormSubmit}
            onDecisionChange={setResolutionDecision}
            onFeedbackChange={setResolutionFeedback}
          />
        ))}

      {selectedCaseFile && (
        <CaseFileInspectionModal
          grievance={selectedCaseFile}
          staffList={staffList}
          currentHodName={currentHodName}
          hodName={hodName}
          currentHodEmail={currentHodEmail}
          hodEmail={hodEmail}
          initialTab={caseDrawerTab}
          onClose={() => setSelectedCaseFile(null)}
          onOpenDocumentPreview={setPreviewDocument}
          onDownloadDocument={handleDownloadDocument}
          onAssignClick={(item) => {
            setSelectedCaseFile(null);
            handleOpenAssignModal(item);
          }}
          onEscalateClick={(item) => {
            setSelectedCaseFile(null);
            handleOpenEscalateModal(item);
          }}
          onReviewResolutionClick={(item) => {
            setSelectedCaseFile(null);
            handleOpenResolutionModal(item);
          }}
          onProposeKbClick={(item) => {
            handleOpenProposeKbModal(item);
          }}
          onAddInternalNote={handleAddInternalNote}
          onAddCollaborationNote={handleAddCollaborationNote}
        />
      )}

      {proposeKbGrievance && (
        <ProposeKnowledgeModal
          isOpen={Boolean(proposeKbGrievance)}
          onClose={() => setProposeKbGrievance(null)}
          onSuccess={() => {
            const proposedId = proposeKbGrievance.id;
            setGrievances((prev) =>
              prev.map((g) =>
                g.id === proposedId ? { ...g, hasProposedKb: true } : g,
              ),
            );
            if (selectedCaseFile && selectedCaseFile.id === proposedId) {
              setSelectedCaseFile((prev) =>
                prev ? { ...prev, hasProposedKb: true } : null,
              );
            }
            loadData(selectedDeptId);
          }}
          grievance={proposeKbGrievance}
        />
      )}

      <DocumentViewerModal
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
        onDownload={handleDownloadDocument}
      />
    </div>
  );
}

export function DepartmentHeadOverview(props: DepartmentHeadOverviewProps) {
  return (
    <DepartmentHeadProvider
      initialDepartmentName={props.departmentName}
      initialHodName={props.hodName}
      initialHodEmail={props.hodEmail}
      initialEmployeeCode={props.employeeCode}
    >
      <DepartmentHeadOverviewInner {...props} />
    </DepartmentHeadProvider>
  );
}
