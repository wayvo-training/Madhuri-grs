"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ProposeKnowledgeModal } from "@/components/knowledge/ProposeKnowledgeModal";
import { ResolutionForm } from "@/components/staff/resolution-form";
import {
  useDepartmentHeadData,
  useDepartmentHeadNavigation,
  useGrievanceActions,
  useQueueFilters,
  useStaffActions,
} from "@/hooks/department-head";
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
  DepartmentHeadLeaveReassignmentModal,
  DepartmentHeadResolutionModal,
  DocumentViewerModal,
  SmartStaffAssignmentModal,
} from "./modals";
import {
  ActivityView,
  KnowledgeView,
  OverviewView,
  QueueView,
  SlaGovernanceView,
  StaffView,
} from "./views";

export function DepartmentHeadOverviewInner({
  departmentName = "Department Operations",
  hodName = "Department Head",
  hodEmail = "",
  employeeCode = "HOD-01",
  isAdminPreview: _isAdminPreview = false,
}: DepartmentHeadOverviewProps) {
  // Data management
  const {
    grievances,
    setGrievances,
    staffList,
    setStaffList,
    governanceAuditFeed,
    setGovernanceAuditFeed,
    selectedDeptId,
    setSelectedDeptId,
    availableDepartments,
    currentDepartmentName,
    currentHodName,
    currentHodEmail,
    currentEmployeeCode,
    loadData,
  } = useDepartmentHeadData({
    initialDepartmentName: departmentName,
    initialHodName: hodName,
    initialHodEmail: hodEmail,
    initialEmployeeCode: employeeCode,
  });

  // Navigation
  const { activeView, switchView } = useDepartmentHeadNavigation();

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
  } = useQueueFilters({ grievances, staffList });

  // Operational Grievance Actions
  const {
    actionSuccessMessage,
    setActionSuccessMessage,
    showSuccess,
    handleAssignmentSuccess,
    handleEscalationSubmit: executeEscalationSubmit,
    handleResolutionSubmit: executeResolutionSubmit,
    handleAddInternalNote,
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

  // Leave Reassignment Modal State
  const [leaveReassignmentModalStaff, setLeaveReassignmentModalStaff] =
    useState<StaffMember | null>(null);
  const [leaveReassignTargetStaffId, setLeaveReassignTargetStaffId] =
    useState("");
  const [leaveReassignNote, setLeaveReassignNote] = useState("");

  const openLeaveReassignmentModal = useCallback(
    (staff: StaffMember) => {
      const defaultTarget = staffList.find(
        (s: StaffMember) => s.id !== staff.id && s.status === "ACTIVE",
      );
      setLeaveReassignTargetStaffId(defaultTarget ? defaultTarget.id : "");
      setLeaveReassignNote(
        `Temporary leave reassignment authorized by Department Head ${currentHodName}.`,
      );
      setLeaveReassignmentModalStaff(staff);
    },
    [currentHodName, staffList],
  );

  // Staff Availability Actions
  const {
    handleToggleStaffAvailability,
    handleBulkReassignAndMarkLeave: executeBulkReassign,
    handleKeepTicketsAndMarkLeave: executeKeepTickets,
  } = useStaffActions({
    currentHodName,
    staffList,
    grievances,
    setStaffList,
    setGrievances,
    setGovernanceAuditFeed,
    showSuccess,
    loadData,
    openLeaveReassignmentModal,
  });

  // Modals state
  const [assignModalGrievance, setAssignModalGrievance] =
    useState<GrievanceItem | null>(null);

  const [escalationModalGrievance, setEscalationModalGrievance] =
    useState<GrievanceItem | null>(null);
  const [escalationBottleneck, setEscalationBottleneck] =
    useState<EscalationBottleneck>("STAFF_CAPACITY");
  const [escalationInterventionType, setEscalationInterventionType] =
    useState<EscalationInterventionType>("REASSIGN");
  const [escalationTargetDept, setEscalationTargetDept] = useState("");
  const [escalationNote, setEscalationNote] = useState("");

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
      setAssignModalGrievance(item);
    },
    [],
  );

  const handleOpenEscalateModal = useCallback(
    (item: GrievanceItem) => {
      setEscalationModalGrievance(item);
      setEscalationBottleneck("STAFF_CAPACITY");
      setEscalationInterventionType("REASSIGN");
      const defaultDept =
        availableDepartments.find(
          (d) =>
            d.name !== currentDepartmentName &&
            !item.collaboratingDepartments?.includes(d.name),
        )?.name || "";
      setEscalationTargetDept(defaultDept);
      setEscalationNote("");
    },
    [availableDepartments, currentDepartmentName],
  );

  const handleOpenResolutionModal = useCallback((item: GrievanceItem) => {
    if (item.isPrimaryDepartment === false) {
      toast.error(
        "Supporting Department contributor: Only the Primary Lead department officer can submit the final customer resolution.",
      );
      return;
    }
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

    if (escalationInterventionType === "REASSIGN") {
      const g = escalationModalGrievance;
      setEscalationModalGrievance(null);
      handleOpenAssignModal(g);
      return;
    }

    await executeEscalationSubmit({
      grievance: escalationModalGrievance,
      bottleneck: escalationBottleneck,
      interventionType: escalationInterventionType,
      targetDept: escalationTargetDept,
      note: escalationNote,
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

  const handleBulkReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReassignmentModalStaff || !leaveReassignTargetStaffId) return;
    await executeBulkReassign({
      leavingStaff: leaveReassignmentModalStaff,
      targetStaffId: leaveReassignTargetStaffId,
      note: leaveReassignNote,
    });
    setLeaveReassignmentModalStaff(null);
  };

  const handleKeepTicketsSubmit = async () => {
    if (!leaveReassignmentModalStaff) return;
    await executeKeepTickets(leaveReassignmentModalStaff);
    setLeaveReassignmentModalStaff(null);
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
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
          onViewQueue={() => switchView("queue")}
          onViewStaff={() => switchView("staff")}
          onViewActivity={() => switchView("activity")}
          onInspectGrievance={handleInspectCase}
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
          onToggleAvailability={handleToggleStaffAvailability}
          onInspect={handleInspectCase}
          onReassign={(item, staffId) => handleOpenAssignModal(item, staffId)}
          onFilterStaffInQueue={(staffId) => {
            setStaffFilter(staffId);
            switchView("queue");
          }}
        />
      )}

      {activeView === "activity" && (
        <ActivityView governanceAuditFeed={governanceAuditFeed} />
      )}

      {activeView === "sla" && (
        <SlaGovernanceView
          grievances={grievances}
          metrics={metrics}
          onInspect={handleInspectCase}
          onIntervene={handleOpenEscalateModal}
          onReviewResolution={handleOpenResolutionModal}
          onAssign={handleOpenAssignModal}
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
            setAssignModalGrievance(null);
          }}
        />
      )}

      {escalationModalGrievance && (
        <DepartmentHeadEscalationModal
          grievance={escalationModalGrievance}
          bottleneck={escalationBottleneck}
          interventionType={escalationInterventionType}
          targetDept={escalationTargetDept}
          note={escalationNote}
          availableDepartments={availableDepartments}
          currentDepartmentName={currentDepartmentName}
          onClose={() => setEscalationModalGrievance(null)}
          onSubmit={handleEscalationFormSubmit}
          onBottleneckChange={setEscalationBottleneck}
          onInterventionTypeChange={setEscalationInterventionType}
          onTargetDeptChange={setEscalationTargetDept}
          onNoteChange={setEscalationNote}
        />
      )}

      {resolutionModalGrievance &&
        ((resolutionModalGrievance.reopenCount ?? 0) >= 2 ||
        resolutionModalGrievance.status === "ESCALATED" ||
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

      {leaveReassignmentModalStaff && (
        <DepartmentHeadLeaveReassignmentModal
          staff={leaveReassignmentModalStaff}
          grievances={grievances}
          targetStaffId={leaveReassignTargetStaffId}
          note={leaveReassignNote}
          onClose={() => setLeaveReassignmentModalStaff(null)}
          onSubmit={handleBulkReassignSubmit}
          onTargetStaffIdChange={setLeaveReassignTargetStaffId}
          onNoteChange={setLeaveReassignNote}
          onInspect={handleInspectCase}
          onMarkLeave={handleKeepTicketsSubmit}
          staffList={staffList}
        />
      )}

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
