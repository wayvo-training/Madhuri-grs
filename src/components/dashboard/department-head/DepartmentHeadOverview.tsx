"use client";

import { useCallback, useState } from "react";
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
    isRefreshing,
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
  const [escalationTargetStaffId, setEscalationTargetStaffId] = useState("");
  const [escalationTargetDept, setEscalationTargetDept] =
    useState("Finance & Accounts");
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

  // Modal Handlers
  const handleOpenAssignModal = useCallback(
    (item: GrievanceItem, _currentStaffId?: string) => {
      setAssignModalGrievance(item);
    },
    [],
  );

  const handleOpenEscalateModal = useCallback((item: GrievanceItem) => {
    setEscalationModalGrievance(item);
    setEscalationBottleneck("STAFF_CAPACITY");
    setEscalationInterventionType("REASSIGN");
    setEscalationTargetStaffId("");
    setEscalationNote("");
  }, []);

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
    await executeEscalationSubmit({
      grievance: escalationModalGrievance,
      bottleneck: escalationBottleneck,
      interventionType: escalationInterventionType,
      targetStaffId: escalationTargetStaffId,
      targetDept: escalationTargetDept,
      note: escalationNote,
    });
    setEscalationModalGrievance(null);
  };

  const handleResolutionFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionModalGrievance) return;
    await executeResolutionSubmit({
      grievance: resolutionModalGrievance,
      decision: resolutionDecision,
      feedback: resolutionFeedback,
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
        isRefreshing={isRefreshing}
        onDepartmentChange={(deptId) => {
          setSelectedDeptId(deptId);
          loadData(deptId);
        }}
        onRefresh={() => {
          loadData(selectedDeptId, true);
          showSuccess("Refreshed live queue from PostgreSQL database.", 3000);
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
          totalGrievanceCount={grievances.length}
          metrics={metrics}
          attentionRequiredList={attentionRequiredList}
          staffList={staffList}
          governanceAuditFeed={governanceAuditFeed}
          isRefreshing={isRefreshing}
          onRefresh={() => {
            loadData(selectedDeptId, true);
            showSuccess("Refreshed live queue from PostgreSQL database.", 3000);
          }}
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
        <ActivityView
          governanceAuditFeed={governanceAuditFeed}
          onBackToOverview={() => switchView("overview")}
        />
      )}

      {activeView === "sla" && (
        <SlaGovernanceView
          grievances={grievances}
          metrics={metrics}
          onInspect={handleInspectCase}
          onIntervene={handleOpenEscalateModal}
          onReviewResolution={handleOpenResolutionModal}
          onAssign={handleOpenAssignModal}
        />
      )}

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
          staffList={staffList}
          bottleneck={escalationBottleneck}
          interventionType={escalationInterventionType}
          targetStaffId={escalationTargetStaffId}
          targetDept={escalationTargetDept}
          note={escalationNote}
          onClose={() => setEscalationModalGrievance(null)}
          onSubmit={handleEscalationFormSubmit}
          onBottleneckChange={setEscalationBottleneck}
          onInterventionTypeChange={setEscalationInterventionType}
          onTargetStaffIdChange={setEscalationTargetStaffId}
          onTargetDeptChange={setEscalationTargetDept}
          onNoteChange={setEscalationNote}
        />
      )}

      {resolutionModalGrievance && (
        <DepartmentHeadResolutionModal
          grievance={resolutionModalGrievance}
          decision={resolutionDecision}
          feedback={resolutionFeedback}
          onClose={() => setResolutionModalGrievance(null)}
          onSubmit={handleResolutionFormSubmit}
          onDecisionChange={setResolutionDecision}
          onFeedbackChange={setResolutionFeedback}
        />
      )}

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
          onAddInternalNote={handleAddInternalNote}
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
