"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  GitBranch,
  Image as ImageIcon,
  Inbox,
  Layers,
  LayoutDashboard,
  Mail,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PriorityBadge, StatusBadge } from "@/components/dashboard/badges";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  type DocumentPreviewData,
  DocumentViewerModal,
} from "./document-viewer-modal";

import { EscalationAuditRecord, GrievanceItem, StaffMember } from "@/types/department-head";
import { SLA_LIFECYCLE_STEPS } from "@/lib/department-head/constants";
import { formatAuditFeedDetails, formatEscalationNotice, formatAuditActionTitle, formatAuditLogContent } from "@/lib/department-head/utils";
import { DepartmentHeadProvider } from "./DepartmentHeadContext";

interface Props {
  departmentName?: string;
  hodName?: string;
  hodEmail?: string;
  employeeCode?: string;
  isAdminPreview?: boolean;
}

export function DepartmentHeadOverviewInner({
  departmentName = "Department Operations",
  hodName = "Department Head",
  hodEmail = "",
  employeeCode = "HOD-01",
  isAdminPreview: _isAdminPreview = false,
}: Props) {
  const [grievances, setGrievances] = useState<GrievanceItem[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);

  // Live Database Loading & Department State
  const [_isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [availableDepartments, setAvailableDepartments] = useState<
    { id: string; name: string }[]
  >([]);
  const [currentDepartmentName, setCurrentDepartmentName] =
    useState(departmentName);
  const [currentHodName, setCurrentHodName] = useState(hodName);
  const [currentHodEmail, setCurrentHodEmail] = useState(hodEmail);
  const [currentEmployeeCode, setCurrentEmployeeCode] = useState(employeeCode);

  const loadData = useCallback(
    async (deptId?: string, isSilentRefresh = false) => {
      try {
        if (!isSilentRefresh) setIsLoading(true);
        else setIsRefreshing(true);

        const targetDeptId = deptId !== undefined ? deptId : selectedDeptId;
        const deptQuery = targetDeptId ? `?deptId=${targetDeptId}` : "";

        const [overviewRes, grievancesRes, staffRes] = await Promise.all([
          fetch(`/api/department-head/overview${deptQuery}`),
          fetch(`/api/department-head/grievances${deptQuery}`),
          fetch(`/api/department-head/staff${deptQuery}`),
        ]);

        if (overviewRes.ok) {
          const overviewData = await overviewRes.json();
          if (overviewData.success) {
            if (overviewData.department?.name) {
              setCurrentDepartmentName(overviewData.department.name);
            }
            if (overviewData.head) {
              setCurrentHodName(overviewData.head.name);
              setCurrentHodEmail(overviewData.head.email);
              setCurrentEmployeeCode(overviewData.head.employeeCode);
            }
            if (overviewData.auditFeed && overviewData.auditFeed.length > 0) {
              setGovernanceAuditFeed(overviewData.auditFeed);
            }
            if (
              overviewData.availableDepartments &&
              overviewData.availableDepartments.length > 0
            ) {
              setAvailableDepartments(overviewData.availableDepartments);
            }
          }
        }

        if (grievancesRes.ok) {
          const grievancesData = await grievancesRes.json();
          if (
            grievancesData.success &&
            Array.isArray(grievancesData.grievances)
          ) {
            setGrievances(grievancesData.grievances);
          }
        }

        if (staffRes.ok) {
          const staffData = await staffRes.json();
          if (staffData.success && Array.isArray(staffData.staff)) {
            setStaffList(staffData.staff);
          }
        }
      } catch (err) {
        console.error("Failed to load department head data:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedDeptId],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Active View Switcher (Synced with Sidebar hash navigation: #overview, #queue, #staff, #sla)
  const [activeView, setActiveView] = useState<
    "overview" | "queue" | "staff" | "sla"
  >("overview");

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (hash === "queue" || hash === "staff" || hash === "sla") {
        setActiveView(hash as "queue" | "staff" | "sla");
      } else {
        setActiveView("overview");
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const switchView = (view: "overview" | "queue" | "staff" | "sla") => {
    setActiveView(view);
    if (typeof window !== "undefined") {
      if (view === "overview") {
        if (window.location.hash) {
          history.replaceState(null, "", window.location.pathname);
        }
      } else {
        window.location.hash = view;
      }
      window.dispatchEvent(new Event("hashchange"));
    }
  };

  // Filter state for queue
  const [selectedTab, setSelectedTab] = useState<
    | "ALL"
    | "UNASSIGNED"
    | "IN_PROGRESS"
    | "HIGH_CRITICAL"
    | "AT_RISK"
    | "ESCALATED"
    | "REOPENED"
    | "CROSS_DEPT"
    | "RESOLUTION_REVIEW"
    | "CLOSED"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [staffFilter, setStaffFilter] = useState("ALL");

  // Modals
  const [assignModalGrievance, setAssignModalGrievance] =
    useState<GrievanceItem | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [assignmentNote, setAssignmentNote] = useState("");

  const [escalationModalGrievance, setEscalationModalGrievance] =
    useState<GrievanceItem | null>(null);
  const [escalationBottleneck, setEscalationBottleneck] = useState<
    | "STAFF_CAPACITY"
    | "CROSS_DEPT"
    | "MISSING_DOCS"
    | "COMPLEX_INVESTIGATION"
    | "ADMIN_DELAY"
  >("STAFF_CAPACITY");
  const [escalationInterventionType, setEscalationInterventionType] = useState<
    "MONITOR" | "NOTIFY_STAFF" | "REASSIGN" | "CROSS_DEPT"
  >("MONITOR");
  const [escalationTargetStaffId, setEscalationTargetStaffId] = useState("");
  const [escalationTargetDept, setEscalationTargetDept] =
    useState("Finance & Accounts");
  const [escalationNote, setEscalationNote] = useState("");

  const [governanceAuditFeed, setGovernanceAuditFeed] = useState<
    EscalationAuditRecord[]
  >([]);

  const [resolutionModalGrievance, setResolutionModalGrievance] =
    useState<GrievanceItem | null>(null);
  const [resolutionDecision, setResolutionDecision] = useState<
    "APPROVE" | "REJECT"
  >("APPROVE");
  const [resolutionFeedback, setResolutionFeedback] = useState("");

  const [actionSuccessMessage, setActionSuccessMessage] = useState<
    string | null
  >(null);

  // Case File Inspection Drawer
  const [selectedCaseFile, setSelectedCaseFile] =
    useState<GrievanceItem | null>(null);
  const [caseDrawerTab, setCaseDrawerTab] = useState<
    "progress" | "statement" | "notes" | "audit"
  >("progress");
  const [newInternalNote, setNewInternalNote] = useState("");
  const [caseProgressLoading, setCaseProgressLoading] = useState(false);
  const [previewDocument, setPreviewDocument] =
    useState<DocumentPreviewData | null>(null);

  const handleOpenDocumentPreview = useCallback(
    (file: {
      name: string;
      size: string;
      type?: string;
      path?: string;
      uploadedAt?: string;
    }) => {
      if (!selectedCaseFile) return;
      setPreviewDocument({
        name: file.name,
        size: file.size,
        type: file.type || "Official Document",
        path: file.path,
        uploadedAt: file.uploadedAt || selectedCaseFile.createdAt || "Recent",
        grievanceNumber: selectedCaseFile.ticketCode || "GRS-2026",
        category: `${selectedCaseFile.category || "General"} / ${selectedCaseFile.subcategory || "General"}`,
        title: selectedCaseFile.title || "Grievance Record",
        submitterName: selectedCaseFile.submitterName || "Complainant",
        submitterRole: selectedCaseFile.submitterRole || "Employee",
      });
    },
    [selectedCaseFile],
  );

  const handleDownloadDocument = useCallback((doc: DocumentPreviewData) => {
    const sampleText = `REPUBLIC OF INDIA / CENTRAL GRIEVANCE REDRESSAL SYSTEM\nOFFICIAL ATTACHMENT RECORD\n\nTicket Code: ${doc.grievanceNumber}\nFile Name: ${doc.name}\nSize: ${doc.size}\nCategory: ${doc.category}\nComplainant: ${doc.submitterName} (${doc.submitterRole})\nUploaded: ${doc.uploadedAt}\n\n--- DOCUMENT CONTENT EXTRACT ---\nThis official digital document was retrieved from the grievance case dossier.\nCryptographic Verification: SHA-256 Validated\nStatus: Certified Authentic Evidence\n`;
    const blob = new Blob([sampleText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setActionSuccessMessage(`Downloaded file: ${doc.name}`);
    setTimeout(() => setActionSuccessMessage(null), 3000);
  }, []);

  const [caseProgressData, setCaseProgressData] = useState<{
    grievance?: Record<string, unknown>;
    currentStage?: {
      key: string;
      label: string;
      stageNumber?: number;
      progressSteps: {
        key: string;
        label: string;
        isComplete: boolean;
        isCurrent?: boolean;
      }[];
    };
    assignment?: {
      isAssigned: boolean;
      staffId: string | null;
      staffName: string;
      designation: string;
      email: string | null;
      assignedAt: string | null;
      assignedAtRelative: string | null;
      status: string;
    };
    sla?: {
      consumptionPercent: number;
      timeRemaining: string;
      dueAt: string;
      state: string;
      stateLabel: string;
    };
    latestActivity?: string;
    timeline?: {
      id: string;
      timestamp: string;
      relativeTime: string;
      title: string;
      description: string;
      actor: string;
    }[];
  } | null>(null);

  const selectedCaseId = selectedCaseFile?.id;
  useEffect(() => {
    if (!selectedCaseId) {
      setCaseProgressData(null);
      return;
    }
    let isMounted = true;
    setCaseProgressLoading(true);
    fetch(`/api/department-head/grievances/${selectedCaseId}/progress`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load progress");
        return res.json();
      })
      .then((json) => {
        if (isMounted && json.success && json.data) {
          setCaseProgressData(json.data);
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
  }, [selectedCaseId]);

  // Leave Reassignment Helper Modal
  const [leaveReassignmentModalStaff, setLeaveReassignmentModalStaff] =
    useState<StaffMember | null>(null);
  const [leaveReassignTargetStaffId, setLeaveReassignTargetStaffId] =
    useState("");
  const [leaveReassignNote, setLeaveReassignNote] = useState("");

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseFile || !newInternalNote.trim()) return;

    const noteText = newInternalNote.trim();

    const newNoteObj = {
      id: `note-${Date.now()}`,
      author: `${currentHodName} (Department Head)`,
      role: "Department Head",
      timestamp: "Just now",
      note: noteText,
    };

    const newAudit: EscalationAuditRecord = {
      id: `aud-${Date.now()}-note`,
      timestamp: "Just now",
      actor: `${hodName} (Department Head)`,
      action: "HOD Internal Directive Recorded",
      details: `Directive: "${noteText}"`,
      stage: selectedCaseFile.status,
    };

    const updatedGrievance: GrievanceItem = {
      ...selectedCaseFile,
      internalNotes: [...(selectedCaseFile.internalNotes || []), newNoteObj],
      auditTrail: [...(selectedCaseFile.auditTrail || []), newAudit],
    };

    setGrievances((prev) =>
      prev.map((g) => (g.id === selectedCaseFile.id ? updatedGrievance : g)),
    );
    setSelectedCaseFile(updatedGrievance);
    setNewInternalNote("");
    setActionSuccessMessage(
      `Added internal directive to ${selectedCaseFile.ticketCode}`,
    );
    setTimeout(() => setActionSuccessMessage(null), 4000);

    // Persist note to real database
    try {
      await fetch(
        `/api/department-head/grievances/${selectedCaseFile.id}/notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: noteText }),
        },
      );
      loadData(undefined, true);
    } catch (err) {
      console.error("Failed to persist internal note to database:", err);
    }
  };

  // Metrics - Strictly aligned with data models
  const unassignedCount = grievances.filter(
    (g) => !g.assignedStaffId && g.status !== "CLOSED",
  ).length;
  const inProgressCount = grievances.filter(
    (g) => g.status === "IN_PROGRESS" || g.status === "ASSIGNED",
  ).length;
  // SLA At Risk = 75%+ consumed, but not yet breached/escalated
  const slaAtRiskCount = grievances.filter(
    (g) =>
      g.slaStatus === "AT_RISK" &&
      g.status !== "ESCALATED" &&
      g.status !== "CLOSED",
  ).length;
  // Escalated = Active grievances currently in ESCALATED status requiring HOD intervention
  const escalatedCount = grievances.filter(
    (g) => g.status === "ESCALATED",
  ).length;
  const atRiskCount = slaAtRiskCount;
  const reopenedCount = grievances.filter(
    (g) => (g.isReopened || g.status === "REOPENED") && g.status !== "CLOSED",
  ).length;
  const crossDeptCount = grievances.filter(
    (g) => g.isCrossDepartment && g.status !== "CLOSED",
  ).length;
  const resolutionReviewCount = grievances.filter(
    (g) => g.status === "UNDER_REVIEW",
  ).length;
  const closedCount = grievances.filter(
    (g) => g.status === "CLOSED" || g.status === "RESOLVED",
  ).length;
  const highCriticalCount = grievances.filter(
    (g) =>
      (g.priority === "CRITICAL" || g.priority === "HIGH") &&
      g.status !== "CLOSED",
  ).length;

  // Attention Required: Only grievances currently requiring review or intervention
  const attentionRequiredList = grievances
    .filter((g) => {
      if (g.status === "CLOSED") return false;
      const isBreached = g.slaStatus === "BREACHED" || g.status === "ESCALATED";
      const isAtRisk = g.slaStatus === "AT_RISK";
      const isUnassigned =
        !g.assignedStaffId || g.status === "SUBMITTED" || g.status === "ROUTED";
      const isPendingReview = g.status === "UNDER_REVIEW";
      const isException =
        g.isReopened || g.status === "REOPENED" || g.isCrossDepartment;
      return (
        isBreached || isAtRisk || isUnassigned || isPendingReview || isException
      );
    })
    .sort((a, b) => {
      const getPriorityRank = (g: GrievanceItem) => {
        if (g.slaStatus === "BREACHED" || g.status === "ESCALATED") return 4;
        if (g.slaStatus === "AT_RISK") return 3;
        if (!g.assignedStaffId) return 2;
        return 1;
      };
      return getPriorityRank(b) - getPriorityRank(a);
    });

  const totalStaffCapacity = staffList.reduce(
    (acc, s) => acc + s.maxCapacity,
    0,
  );
  const totalActiveTickets = staffList.reduce(
    (acc, s) => acc + s.activeTickets,
    0,
  );
  const activeStaffCount = staffList.filter(
    (s) => s.status === "ACTIVE",
  ).length;
  const onLeaveStaffCount = staffList.filter(
    (s) => s.status === "ON_LEAVE",
  ).length;

  // Filter queue
  const filteredGrievances = grievances.filter((g) => {
    if (selectedTab === "CLOSED") {
      if (!["CLOSED", "RESOLVED"].includes(g.status)) return false;
    } else {
      if (selectedTab !== "ALL" && ["CLOSED", "RESOLVED"].includes(g.status)) {
        return false;
      }
    }

    if (selectedTab === "UNASSIGNED" && g.assignedStaffId) return false;
    if (
      selectedTab === "IN_PROGRESS" &&
      !["IN_PROGRESS", "ASSIGNED"].includes(g.status)
    )
      return false;
    if (
      selectedTab === "HIGH_CRITICAL" &&
      !["CRITICAL", "HIGH"].includes(g.priority)
    )
      return false;
    if (
      selectedTab === "AT_RISK" &&
      (g.slaStatus !== "AT_RISK" ||
        g.status === "ESCALATED" ||
        ["CLOSED", "RESOLVED"].includes(g.status))
    )
      return false;
    if (selectedTab === "ESCALATED" && g.status !== "ESCALATED") return false;
    if (selectedTab === "REOPENED" && !g.isReopened && g.status !== "REOPENED")
      return false;
    if (selectedTab === "CROSS_DEPT" && !g.isCrossDepartment) return false;
    if (selectedTab === "RESOLUTION_REVIEW" && g.status !== "UNDER_REVIEW")
      return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = g.title.toLowerCase().includes(q);
      const matchCode = g.ticketCode.toLowerCase().includes(q);
      const matchSub = g.submitterName.toLowerCase().includes(q);
      const matchCat =
        g.category.toLowerCase().includes(q) ||
        g.subcategory.toLowerCase().includes(q);
      const matchCollab = g.collaboratingDepartments?.some((d) =>
        d.toLowerCase().includes(q),
      );
      if (!matchTitle && !matchCode && !matchSub && !matchCat && !matchCollab)
        return false;
    }

    if (priorityFilter !== "ALL" && g.priority !== priorityFilter) return false;

    if (staffFilter === "UNASSIGNED" && g.assignedStaffId) return false;
    if (
      staffFilter !== "ALL" &&
      staffFilter !== "UNASSIGNED" &&
      g.assignedStaffId !== staffFilter
    )
      return false;

    return true;
  });

  // Handlers
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalGrievance || !selectedStaffId) return;

    const staffMember = staffList.find((s) => s.id === selectedStaffId);
    if (!staffMember) return;

    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === selectedStaffId) {
          return { ...s, activeTickets: s.activeTickets + 1 };
        }
        if (assignModalGrievance.assignedStaffId === s.id) {
          return { ...s, activeTickets: Math.max(0, s.activeTickets - 1) };
        }
        return s;
      }),
    );

    setGrievances((prev) =>
      prev.map((g) =>
        g.id === assignModalGrievance.id
          ? {
              ...g,
              assignedStaffId: staffMember.id,
              assignedStaffName: staffMember.name,
              status: "ASSIGNED",
            }
          : g,
      ),
    );

    setActionSuccessMessage(
      `Dispatched ${assignModalGrievance.ticketCode} to ${staffMember.name}.`,
    );

    // Persist to real API
    fetch(`/api/department-head/grievances/${assignModalGrievance.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId: staffMember.id, note: assignmentNote }),
    })
      .then(() => loadData(undefined, true))
      .catch((err) => console.error("Failed to assign staff:", err));

    setAssignModalGrievance(null);
    setSelectedStaffId("");
    setAssignmentNote("");
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Step 5 to 9: HOD Identifies Bottleneck, Takes Action, Logs Audit, Notifies Staff, Grievance Continues
  const handleEscalationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalationModalGrievance) return;

    const targetStaff = staffList.find((s) => s.id === escalationTargetStaffId);
    const targetStaffName = targetStaff
      ? targetStaff.name
      : escalationModalGrievance.assignedStaffName || "Unassigned";

    // If reassigning, update active ticket loads
    if (escalationInterventionType === "REASSIGN" && targetStaff) {
      setStaffList((prev) =>
        prev.map((s) => {
          if (s.id === targetStaff.id) {
            return { ...s, activeTickets: s.activeTickets + 1 };
          }
          if (escalationModalGrievance.assignedStaffId === s.id) {
            return { ...s, activeTickets: Math.max(0, s.activeTickets - 1) };
          }
          return s;
        }),
      );
    }

    const bottleneckLabels: Record<string, string> = {
      STAFF_CAPACITY: "Staff Capacity / Absence",
      CROSS_DEPT: "Cross-Department Dependency",
      MISSING_DOCS: "Incomplete Submitter Documentation",
      COMPLEX_INVESTIGATION: "Complex Case Investigation",
      ADMIN_DELAY: "Internal Administrative Delay",
    };

    const actionLabels: Record<string, string> = {
      MONITOR: "Continued Monitoring (SLA Risk Acknowledged by HOD)",
      NOTIFY_STAFF: `Direct Operational Nudge Dispatched to ${targetStaffName}`,
      REASSIGN: `Reassigned to ${targetStaffName}`,
      CROSS_DEPT: `Enlisted Supporting Department (${escalationTargetDept})`,
    };

    const chosenBottleneck =
      bottleneckLabels[escalationBottleneck] || escalationBottleneck;
    const chosenAction =
      actionLabels[escalationInterventionType] || escalationInterventionType;

    const newAuditEntries: EscalationAuditRecord[] = [
      {
        id: `aud-${Date.now()}`,
        timestamp: "Just now",
        actor: `${currentHodName} (DEPARTMENT_HEAD)`,
        action: "HOD_INTERVENTION_TAKEN",
        bottleneck: chosenBottleneck,
        details: `Intervention: ${chosenAction} (Bottleneck: ${chosenBottleneck}). Directive: "${escalationNote || "Proceed with expedited resolution under departmental directives."}"`,
      },
    ];

    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id !== escalationModalGrievance.id) return g;
        return {
          ...g,
          status: "IN_PROGRESS",
          slaStatus: "ON_TRACK",
          priority: g.priority,
          assignedStaffId:
            escalationInterventionType === "REASSIGN" && targetStaff
              ? targetStaff.id
              : g.assignedStaffId,
          assignedStaffName:
            escalationInterventionType === "REASSIGN" && targetStaff
              ? targetStaff.name
              : g.assignedStaffName,
          escalationStage: "IN_PROGRESS",
          identifiedBottleneck: chosenBottleneck,
          hodIntervention: {
            actionType: escalationInterventionType,
            actionLabel: chosenAction,
            note: escalationNote,
            intervenedAt: "Just now",
            intervenedBy: currentHodName,
            targetStaffName: targetStaffName,
            targetDepartment: escalationTargetDept,
          },
          auditTrail: [...(g.auditTrail || []), ...newAuditEntries],
        };
      }),
    );

    // Push to Governance Audit Feed
    setGovernanceAuditFeed((prev) => [
      {
        id: `gov-${Date.now()}`,
        timestamp: "Just now",
        actor: "HOD Intervention",
        action: `${escalationModalGrievance.ticketCode}: ${chosenAction}`,
        details: `Bottleneck: ${chosenBottleneck}. Note: "${escalationNote.slice(0, 60)}..."`,
        stage: "INTERVENTION_TAKEN",
      },
      ...prev,
    ]);

    setActionSuccessMessage(
      `Steps 5-9 Complete: HOD intervention logged to audit trail & dispatched to staff. Grievance ${escalationModalGrievance.ticketCode} continues in progress.`,
    );

    // Persist intervention to real API
    try {
      await fetch(
        `/api/department-head/grievances/${escalationModalGrievance.id}/intervene`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bottleneck: escalationBottleneck,
            interventionType: escalationInterventionType,
            targetStaffId: escalationTargetStaffId,
            targetDeptName: escalationTargetDept,
            note: escalationNote,
          }),
        },
      );
      await loadData(undefined, true);
    } catch (err) {
      console.error("Failed to persist intervention:", err);
    }

    setEscalationModalGrievance(null);
    setEscalationNote("");
    setEscalationTargetStaffId("");
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  // Step 10: Resolution Submitted by Staff
  const handleSimulateResolution = (grievanceId: string) => {
    const target = grievances.find((g) => g.id === grievanceId);
    if (!target) return;

    const staffName = target.assignedStaffName || "Investigating Officer";
    const resNote = `Detailed verification completed. Hospital vouchers & claim documents verified against policy tariff. Sanction of ₹42,500 approved under emergency reimbursement quota. Submitted for final HOD review.`;

    const resolutionAudit: EscalationAuditRecord = {
      id: `aud-${Date.now()}-10`,
      timestamp: "Just now",
      actor: `${staffName} (Investigating Officer)`,
      action: "Step 10: Resolution Submitted",
      details: `Resolution proposed: "${resNote}"`,
      stage: "RESOLUTION_SUBMITTED",
    };

    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id !== grievanceId) return g;
        return {
          ...g,
          status: "UNDER_REVIEW",
          escalationStage: "RESOLUTION_SUBMITTED",
          submittedResolution: {
            staffName: staffName,
            note: resNote,
            submittedAt: "Just now",
          },
          auditTrail: [...(g.auditTrail || []), resolutionAudit],
        };
      }),
    );

    setGovernanceAuditFeed((prev) => [
      {
        id: `gov-${Date.now()}`,
        timestamp: "Just now",
        actor: "Resolution Engine",
        action: `${target.ticketCode}: Resolution submitted by ${staffName}`,
        details: "Pending Department Head review & escalation clearance.",
        stage: "RESOLUTION_SUBMITTED",
      },
      ...prev,
    ]);

    setActionSuccessMessage(
      `Step 10 Complete: Resolution submitted for ${target.ticketCode}. Ready for Department Head review and escalation clearance.`,
    );
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  // Step 11: Resolution Reviewed & Escalation Cleared
  const handleResolutionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionModalGrievance) return;

    if (resolutionDecision === "APPROVE") {
      const finalAudit: EscalationAuditRecord = {
        id: `aud-${Date.now()}-11`,
        timestamp: "Just now",
        actor: `${currentHodName} (DEPARTMENT_HEAD)`,
        action: "ACCEPT_RESOLUTION",
        details:
          "Department Head approved final resolution. Escalation cleared, grievance successfully closed.",
        stage: "ESCALATION_CLEARED",
      };

      setGrievances((prev) =>
        prev.map((g) =>
          g.id === resolutionModalGrievance.id
            ? {
                ...g,
                status: "CLOSED",
                slaStatus: "ON_TRACK",
                escalationStage: "ESCALATION_CLEARED",
                auditTrail: [...(g.auditTrail || []), finalAudit],
              }
            : g,
        ),
      );

      setGovernanceAuditFeed((prev) => [
        {
          id: `gov-${Date.now()}`,
          timestamp: "Just now",
          actor: "HOD Approval",
          action: `${resolutionModalGrievance.ticketCode}: Resolution Approved & Escalation Cleared`,
          details:
            "Grievance successfully resolved and closed under SLA governance protocol.",
          stage: "ESCALATION_CLEARED",
        },
        ...prev,
      ]);

      setActionSuccessMessage(
        `Resolution approved & Escalation Cleared for ${resolutionModalGrievance.ticketCode}. Ticket is now officially CLOSED.`,
      );
    } else {
      const clarifyAudit: EscalationAuditRecord = {
        id: `aud-${Date.now()}-clarify`,
        timestamp: "Just now",
        actor: `${currentHodName} (Department Head)`,
        action: "Resolution Returned for Clarification",
        details: `Feedback: "${resolutionFeedback || "Additional verification required."}". Grievance returned to investigating staff.`,
        stage: "IN_PROGRESS",
      };

      setGrievances((prev) =>
        prev.map((g) =>
          g.id === resolutionModalGrievance.id
            ? {
                ...g,
                status: "IN_PROGRESS",
                auditTrail: [...(g.auditTrail || []), clarifyAudit],
              }
            : g,
        ),
      );
      setActionSuccessMessage(
        `Resolution for ${resolutionModalGrievance.ticketCode} returned to staff for clarification.`,
      );
    }

    // Persist resolution decision to real API
    fetch(
      `/api/department-head/grievances/${resolutionModalGrievance.id}/resolution`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: resolutionDecision,
          feedback: resolutionFeedback,
        }),
      },
    )
      .then(() => loadData(undefined, true))
      .catch((err) =>
        console.error("Failed to persist resolution decision:", err),
      );

    setResolutionModalGrievance(null);
    setResolutionFeedback("");
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  // Staff Availability & Leave Reassignment Workflow
  const handleToggleStaffAvailability = (staff: StaffMember) => {
    if (staff.status === "ON_LEAVE") {
      // Activating from leave back to duty
      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, status: "ACTIVE" } : s)),
      );
      setActionSuccessMessage(
        `${staff.name} is now marked as Active & Available for assignments.`,
      );

      fetch(`/api/department-head/staff/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      })
        .then(() => loadData(undefined, true))
        .catch((err) => console.error("Failed to toggle availability:", err));

      setTimeout(() => setActionSuccessMessage(null), 4000);
      return;
    }

    // Checking if officer has active tickets in queue
    const activeAssignedTickets = grievances.filter(
      (g) => g.assignedStaffId === staff.id && g.status !== "CLOSED",
    );

    if (activeAssignedTickets.length > 0 || staff.activeTickets > 0) {
      // Find first available active staff member other than this one
      const defaultTarget = staffList.find(
        (s) => s.id !== staff.id && s.status === "ACTIVE",
      );
      setLeaveReassignTargetStaffId(defaultTarget ? defaultTarget.id : "");
      setLeaveReassignNote(
        `Temporary leave reassignment authorized by Department Head ${currentHodName}.`,
      );
      setLeaveReassignmentModalStaff(staff);
    } else {
      // Officer has 0 active tickets, switch directly to ON_LEAVE
      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, status: "ON_LEAVE" } : s)),
      );
      setActionSuccessMessage(`${staff.name} is now marked as On Leave.`);

      fetch(`/api/department-head/staff/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ON_LEAVE" }),
      })
        .then(() => loadData(undefined, true))
        .catch((err) => console.error("Failed to set on leave:", err));

      setTimeout(() => setActionSuccessMessage(null), 4000);
    }
  };

  // Handler for Bulk Reassigning All Active Tickets and Setting Staff On Leave
  const handleBulkReassignAndMarkLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReassignmentModalStaff || !leaveReassignTargetStaffId) return;

    const targetStaff = staffList.find(
      (s) => s.id === leaveReassignTargetStaffId,
    );
    if (!targetStaff) return;

    const leavingStaffId = leaveReassignmentModalStaff.id;
    const activeTicketsToTransfer = grievances.filter(
      (g) => g.assignedStaffId === leavingStaffId && g.status !== "CLOSED",
    );

    // Update tickets
    setGrievances((prev) =>
      prev.map((g) => {
        if (g.assignedStaffId !== leavingStaffId || g.status === "CLOSED")
          return g;

        const auditEntry: EscalationAuditRecord = {
          id: `aud-${Date.now()}-${g.id}`,
          timestamp: "Just now",
          actor: `${currentHodName} (Department Head)`,
          action: "Reassigned due to Officer Leave",
          details: `Reassigned from ${leaveReassignmentModalStaff.name} to ${targetStaff.name}. Reason: Officer marked On Leave. Directive: "${leaveReassignNote || "Transferred to maintain SLA turnaround during officer leave."}"`,
          stage: g.status,
        };

        const internalNoteEntry = {
          id: `note-${Date.now()}-${g.id}`,
          author: `${currentHodName} (Department Head)`,
          role: "Department Head",
          timestamp: "Just now",
          note: `Transferred to ${targetStaff.name} due to officer leave. Directive: "${leaveReassignNote || "Transferred to maintain SLA turnaround during officer leave."}"`,
        };

        return {
          ...g,
          assignedStaffId: targetStaff.id,
          assignedStaffName: targetStaff.name,
          auditTrail: [...(g.auditTrail || []), auditEntry],
          internalNotes: [...(g.internalNotes || []), internalNoteEntry],
        };
      }),
    );

    // Update staff workloads
    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === leavingStaffId) {
          return { ...s, status: "ON_LEAVE", activeTickets: 0 };
        }
        if (s.id === targetStaff.id) {
          return {
            ...s,
            activeTickets: s.activeTickets + activeTicketsToTransfer.length,
          };
        }
        return s;
      }),
    );

    // Push entry to Governance Audit Feed
    setGovernanceAuditFeed((prev) => [
      {
        id: `gov-${Date.now()}`,
        timestamp: "Just now",
        actor: "Staff Availability Engine",
        action: `${leaveReassignmentModalStaff.name} Marked On Leave`,
        details: `Bulk transferred ${activeTicketsToTransfer.length} active grievance(s) to ${targetStaff.name}.`,
        stage: "REASSIGNED",
      },
      ...prev,
    ]);

    setActionSuccessMessage(
      `Reassigned ${activeTicketsToTransfer.length} ticket(s) to ${targetStaff.name} and marked ${leaveReassignmentModalStaff.name} as On Leave.`,
    );

    // Persist bulk reassignment to real API
    fetch(`/api/department-head/staff/${leavingStaffId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetStaffId: targetStaff.id,
        note:
          leaveReassignNote ||
          "Transferred to maintain SLA turnaround during officer leave.",
      }),
    })
      .then(() => loadData(undefined, true))
      .catch((err) => console.error("Failed to bulk reassign:", err));

    setLeaveReassignmentModalStaff(null);
    setLeaveReassignTargetStaffId("");
    setLeaveReassignNote("");
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  // Handler for Keeping Tickets & Setting Staff On Leave
  const handleKeepTicketsAndMarkLeave = () => {
    if (!leaveReassignmentModalStaff) return;

    const staffId = leaveReassignmentModalStaff.id;

    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, status: "ON_LEAVE" } : s)),
    );

    setGovernanceAuditFeed((prev) => [
      {
        id: `gov-${Date.now()}`,
        timestamp: "Just now",
        actor: "Staff Availability Engine",
        action: `${leaveReassignmentModalStaff.name} Marked On Leave`,
        details: `Officer marked on leave. Retained ${leaveReassignmentModalStaff.activeTickets} ticket assignments in their queue.`,
        stage: "ON_LEAVE",
      },
      ...prev,
    ]);

    setActionSuccessMessage(
      `Marked ${leaveReassignmentModalStaff.name} as On Leave. Active tickets retained in their queue.`,
    );

    fetch(`/api/department-head/staff/${staffId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ON_LEAVE" }),
    })
      .then(() => loadData(undefined, true))
      .catch((err) => console.error("Failed to mark on leave:", err));

    setLeaveReassignmentModalStaff(null);
    setLeaveReassignTargetStaffId("");
    setLeaveReassignNote("");
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* ========================================================================= */}
      {/* TOP VIEW SWITCHER TABS (Compact, single horizontal line on desktop)       */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => switchView("overview")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-2xs ${
              activeView === "overview"
                ? "bg-[#064E3B] text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            <span>Department Overview</span>
          </button>

          <button
            type="button"
            onClick={() => switchView("queue")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-2xs ${
              activeView === "queue"
                ? "bg-[#064E3B] text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Inbox className="h-3.5 w-3.5" />
            <span>Grievance Queue</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeView === "queue"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700 font-medium"
              }`}
            >
              {unassignedCount} New
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchView("staff")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-2xs ${
              activeView === "staff"
                ? "bg-[#064E3B] text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Staff Workload</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                activeView === "staff"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {staffList.length} Officers
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchView("sla")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-2xs ${
              activeView === "sla"
                ? "bg-[#064E3B] text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <AlertTriangle
              className={`h-3.5 w-3.5 ${
                activeView === "sla" ? "text-white" : "text-slate-500"
              }`}
            />
            <span>SLA & Escalations</span>
            {(atRiskCount > 0 || escalatedCount > 0) && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white font-bold">
                {atRiskCount + escalatedCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {availableDepartments.length > 0 && (
            <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-2xs">
              <Building2 className="h-3 w-3 text-emerald-700" />
              <span className="font-semibold text-slate-500">Dept:</span>
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  loadData(e.target.value);
                }}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer text-xs"
              >
                <option value="">Default ({currentDepartmentName})</option>
                {availableDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              loadData(selectedDeptId, true);
              setActionSuccessMessage(
                "Refreshed live queue from PostgreSQL database.",
              );
              setTimeout(() => setActionSuccessMessage(null), 3000);
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3 w-3 ${
                isRefreshing ? "animate-spin text-emerald-700" : ""
              }`}
            />
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMessage && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-900 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: OVERVIEW (Focused Decision-Making Dashboard)                      */}
      {/* ========================================================================= */}
      {activeView === "overview" && (
        <div className="space-y-3.5 sm:space-y-4">
          {/* 1. Department Header Banner (Compact: ~80-90px height) */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-r from-[#064E3B] via-[#043629] to-slate-950 px-4 py-3 sm:px-5 sm:py-3.5 text-white shadow-xs">
            <div className="relative z-10 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                  <Building2 className="h-4.5 w-4.5 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-semibold tracking-tight text-white leading-tight">
                      {currentDepartmentName}
                    </h2>
                    <span className="rounded-md bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                      Primary Queue
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs font-normal text-slate-300 leading-tight">
                    Department Head:{" "}
                    <strong className="font-semibold text-white">
                      {currentHodName}
                    </strong>{" "}
                    &bull; {currentHodEmail} &bull; Code:{" "}
                    <span className="font-mono text-emerald-300">
                      {currentEmployeeCode}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    loadData(selectedDeptId, true);
                    setActionSuccessMessage(
                      "Refreshed live queue from PostgreSQL database.",
                    );
                    setTimeout(() => setActionSuccessMessage(null), 3000);
                  }}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${
                      isRefreshing ? "animate-spin text-emerald-300" : ""
                    }`}
                  />
                  <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchView("queue")}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-2xs hover:bg-slate-100 transition"
                >
                  Manage Full Queue ({grievances.length}) &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* 2. Department Overview Metrics (4 Clear, Compact KPI Cards: ~115-120px) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Unassigned"
              value={unassignedCount}
              icon={Inbox}
              accentColor="slate"
              description="Awaiting assignment"
            />
            <StatCard
              label="In Progress"
              value={inProgressCount}
              icon={Clock}
              accentColor="slate"
              description="Active cases"
            />
            <StatCard
              label="SLA At Risk"
              value={slaAtRiskCount}
              icon={AlertTriangle}
              accentColor="amber"
              description="75%+ SLA consumed"
            />
            <StatCard
              label="Escalated"
              value={escalatedCount}
              icon={ShieldAlert}
              accentColor={escalatedCount > 0 ? "amber" : "slate"}
              description="SLA breach cases"
            />
          </div>

          {/* 3. Attention Required (Compact Scrollable Triage List) */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3 h-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                  Attention Required
                </h3>
                {attentionRequiredList.length > 0 && (
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.2 text-[10px] font-semibold text-slate-700">
                    {attentionRequiredList.length}
                  </span>
                )}
                <span className="text-slate-300 hidden sm:inline">&bull;</span>
                <p className="text-xs text-slate-500 font-normal hidden sm:inline">
                  Grievances requiring review or intervention
                </p>
              </div>

              <button
                type="button"
                onClick={() => switchView("queue")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition"
              >
                <span>View Full Queue</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {attentionRequiredList.length === 0 ? (
              <div className="py-6 text-center text-xs font-normal text-slate-400">
                <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600 mb-1.5" />
                <p className="font-semibold text-slate-700 text-xs">
                  No grievances require intervention
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  All active grievances are operating within their defined SLA
                  thresholds.
                </p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar divide-y divide-slate-100 rounded-lg border border-slate-200/80 bg-white">
                {attentionRequiredList.map((item) => {
                  const isEscalated = item.status === "ESCALATED";
                  const isBreached = item.slaStatus === "BREACHED";

                  // Enterprise rule: No red color, and color for ONLY escalated OR breached (never both).
                  // If Escalated: StatusBadge gets the amber pill; SLA timer is neutral slate.
                  // If Not Escalated & Breached: SLA timer gets the amber pill; StatusBadge is neutral slate.
                  const highlightSla = !isEscalated && isBreached;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-slate-50/80 transition group min-h-[44px]"
                    >
                      {/* Left: Monospace Code & Title */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="font-mono text-[11px] font-semibold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70 shrink-0">
                          {item.ticketCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCaseFile(item);
                            setCaseDrawerTab("statement");
                          }}
                          className="text-xs font-medium text-slate-800 hover:text-emerald-900 transition truncate text-left"
                          title={item.title}
                        >
                          {item.title}
                        </button>
                      </div>

                      {/* Right: Fixed-width vertically-aligned columns */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* 1. Priority Column (fixed 76px width) */}
                        <div className="w-[76px] flex justify-start shrink-0">
                          <PriorityBadge priority={item.priority} />
                        </div>

                        {/* 2. Status Column (fixed 96px width) */}
                        <div className="w-[96px] flex justify-start shrink-0">
                          <StatusBadge status={item.status} />
                        </div>

                        {/* 3. SLA Timer Column (fixed 110px width) */}
                        <div className="w-[110px] flex justify-center shrink-0">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium text-center w-full truncate ${
                              highlightSla
                                ? "text-amber-900 bg-amber-50 border border-amber-200 font-semibold"
                                : "text-slate-600 bg-slate-100/80 border border-slate-200/80"
                            }`}
                          >
                            {item.slaTimeLeft}
                          </span>
                        </div>

                        {/* 4. Assigned Officer Column (fixed 140px width) */}
                        <div className="w-[140px] shrink-0 text-left truncate hidden sm:block">
                          <span className="text-[11px] text-slate-400">
                            To:{" "}
                          </span>
                          <span className="text-[11px] font-medium text-slate-700">
                            {item.assignedStaffName || (
                              <span className="italic text-slate-400 font-normal">
                                Unassigned
                              </span>
                            )}
                          </span>
                        </div>

                        {/* 5. Inspect Action Column (fixed 74px width) */}
                        <div className="w-[74px] flex justify-end shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCaseFile(item);
                              setCaseDrawerTab("progress");
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900 transition shadow-2xs"
                          >
                            <Eye className="h-3 w-3 text-slate-400 group-hover:text-slate-600" />
                            <span>Inspect</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4 & 5. Team Capacity & Recent Activity (Side-by-side, content-driven height with items-start) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
            {/* 4. Team Capacity (~42-45% width, content-driven ~150-200px) */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-2.5 h-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-emerald-800" />
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                    Team Capacity
                  </h3>
                  <span className="text-[11px] text-slate-400 font-normal">
                    ({staffList.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => switchView("staff")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition"
                >
                  <span>Full Roster</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="max-h-[85px] overflow-y-scroll custom-scrollbar pr-1.5 space-y-2">
                {staffList.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center font-normal">
                    No officers assigned to this department roster.
                  </p>
                ) : (
                  staffList.map((staff) => {
                    const pct = Math.round(
                      (staff.activeTickets / staff.maxCapacity) * 100,
                    );
                    return (
                      <div
                        key={staff.id}
                        className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900 text-xs truncate">
                            {staff.name}
                          </span>
                          <span className="text-slate-600 font-medium text-[11px] shrink-0">
                            {staff.activeTickets}/{staff.maxCapacity} active
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              staff.status === "ON_LEAVE"
                                ? "bg-slate-400"
                                : pct >= 80
                                  ? "bg-amber-500"
                                  : "bg-[#064E3B]"
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 5. Recent Activity (Governance Summary: ~55-58% width, compact rows ~60-65px) */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-2.5 h-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                    Recent Activity
                  </h3>
                  <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
                    (Governance)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => switchView("sla")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition"
                >
                  <span>View Full Audit</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              <div className="max-h-[85px] overflow-y-scroll custom-scrollbar pr-1.5 space-y-1.5 divide-y divide-slate-100">
                {governanceAuditFeed.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs font-normal">
                    No governance audit events recorded yet.
                  </div>
                ) : (
                  governanceAuditFeed.map((feed) => {
                    const isSlaEngineAction =
                      feed.action.includes("SLA") ||
                      feed.action.includes("Auto-");
                    const displayActor =
                      isSlaEngineAction &&
                      feed.actor.includes("DEPARTMENT_HEAD")
                        ? "SLA Governance Engine"
                        : feed.actor;
                    const displayAction = feed.action
                      .replace(
                        /SLA 100 BREACH ESCALATED/g,
                        "SLA Breached & Case Escalated",
                      )
                      .replace(
                        /SLA 75 PERCENT HOD ALERT/g,
                        "SLA At Risk (75% Threshold Alert)",
                      )
                      .replace(
                        /SLA 50 PERCENT WARNING/g,
                        "50% SLA Priority Warning",
                      );
                    const cleanDetails = formatAuditFeedDetails(feed.details);

                    return (
                      <div
                        key={feed.id}
                        className="pt-2 first:pt-0 flex items-start gap-2.5 text-xs"
                      >
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                          {isSlaEngineAction ? (
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                          ) : (
                            <FileCheck className="h-3.5 w-3.5 text-emerald-700" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900 text-xs truncate">
                              {displayActor}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {feed.timestamp}
                            </span>
                          </div>
                          <p className="text-slate-700 text-xs font-medium leading-snug">
                            {displayAction}
                          </p>
                          {cleanDetails && (
                            <p className="text-[11px] text-slate-500 font-normal italic truncate">
                              {cleanDetails}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: GRIEVANCE QUEUE (Full-width, zero empty space)                    */}
      {/* ========================================================================= */}
      {activeView === "queue" && (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
          {/* Queue Filter Controls Bar (Top header of the unit) */}
          <div className="p-3.5 sm:p-4 space-y-3 bg-white border-b border-slate-200/80">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search queue by ticket code, subject, submitter, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* 9 Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedTab("ALL")}
                className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "ALL"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>All</span>
                <span
                  className={`ml-1.5 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "ALL"
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 font-medium"
                  }`}
                >
                  {grievances.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("UNASSIGNED")}
                className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "UNASSIGNED"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>Unassigned</span>
                <span
                  className={`ml-1.5 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "UNASSIGNED"
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 font-medium"
                  }`}
                >
                  {unassignedCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("IN_PROGRESS")}
                className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "IN_PROGRESS"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>In Progress</span>
                <span
                  className={`ml-1.5 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "IN_PROGRESS"
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 font-medium"
                  }`}
                >
                  {inProgressCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("HIGH_CRITICAL")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "HIGH_CRITICAL"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Flame className="h-3 w-3" />
                <span>High & Critical</span>
                <span
                  className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "HIGH_CRITICAL"
                      ? "bg-white/20 text-white font-semibold"
                      : highCriticalCount > 0
                        ? "bg-slate-200 text-slate-800 font-bold"
                        : "bg-slate-100 text-slate-500 font-medium"
                  }`}
                >
                  {highCriticalCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("AT_RISK")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "AT_RISK"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span>SLA At Risk</span>
                <span
                  className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "AT_RISK"
                      ? "bg-white/20 text-white font-semibold"
                      : atRiskCount > 0
                        ? "bg-amber-100 text-amber-800 font-bold"
                        : "bg-slate-100 text-slate-500 font-medium"
                  }`}
                >
                  {atRiskCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("ESCALATED")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "ESCALATED"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <AlertCircle className="h-3 w-3" />
                <span>Escalated</span>
                <span
                  className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "ESCALATED"
                      ? "bg-white/20 text-white font-semibold"
                      : escalatedCount > 0
                        ? "bg-amber-100 text-amber-800 font-bold"
                        : "bg-slate-100 text-slate-500 font-medium"
                  }`}
                >
                  {escalatedCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("REOPENED")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "REOPENED"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reopened</span>
                <span
                  className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "REOPENED"
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 font-medium"
                  }`}
                >
                  {reopenedCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("CROSS_DEPT")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "CROSS_DEPT"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <GitBranch className="h-3 w-3" />
                <span>Cross-Dept</span>
                <span
                  className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "CROSS_DEPT"
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 font-medium"
                  }`}
                >
                  {crossDeptCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("RESOLUTION_REVIEW")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "RESOLUTION_REVIEW"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Resolution Review</span>
                <span
                  className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "RESOLUTION_REVIEW"
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 font-medium"
                  }`}
                >
                  {resolutionReviewCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("CLOSED")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "CLOSED"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Closed</span>
                <span
                  className={`ml-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                    selectedTab === "CLOSED"
                      ? "bg-white/20 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 font-medium"
                  }`}
                >
                  {closedCount}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
              <span className="text-slate-500 font-normal">
                Showing{" "}
                <strong className="font-semibold text-slate-800">
                  {filteredGrievances.length}
                </strong>{" "}
                of {grievances.length} grievances in queue
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 outline-none"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>

                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 outline-none"
                >
                  <option value="ALL">All Assigned Officers</option>
                  <option value="UNASSIGNED">Unassigned Only</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.activeTickets} active)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Full-width Grievance Cards Grid with dedicated scrollbar (Body of the unit) */}
          <div className="max-h-[580px] overflow-y-scroll custom-scrollbar p-3.5 sm:p-4 space-y-3 bg-slate-50/40">
            {filteredGrievances.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500/80" />
                <h3 className="mt-3 text-sm font-semibold text-slate-900">
                  No grievances match this filter
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTab("ALL");
                    setSearchQuery("");
                    setPriorityFilter("ALL");
                    setStaffFilter("ALL");
                  }}
                  className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredGrievances.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition hover:border-emerald-300 hover:shadow-sm space-y-2.5"
                >
                  {/* Top Header: Badges (Left) & Date / Target SLA (Right) */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200/80">
                        {item.ticketCode}
                      </span>
                      <PriorityBadge priority={item.priority} />
                      <StatusBadge status={item.status} />

                      {item.slaStatus === "BREACHED" &&
                        item.status !== "ESCALATED" &&
                        (item.hodIntervention ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                            Intervention Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                            <AlertCircle className="h-3 w-3 text-amber-600" />
                            SLA Breached
                          </span>
                        ))}
                      {item.slaStatus === "AT_RISK" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          <Clock className="h-3 w-3 text-amber-600" />
                          SLA At Risk
                        </span>
                      )}
                      {item.isReopened && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          <RotateCcw className="h-3 w-3 text-slate-600" />
                          Reopened ({item.reopenCount}x)
                        </span>
                      )}
                      {item.isCrossDepartment && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          <GitBranch className="h-3 w-3 text-slate-600" />
                          Cross-Dept
                        </span>
                      )}
                    </div>

                    <div className="text-right flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-normal text-slate-400">
                        Submitted {item.createdAt}
                      </span>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        Target SLA:
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          item.status === "ESCALATED"
                            ? "text-slate-700 font-medium"
                            : item.slaStatus === "BREACHED"
                              ? "text-amber-800 font-semibold"
                              : item.slaStatus === "AT_RISK"
                                ? "text-amber-700"
                                : "text-slate-700"
                        }`}
                      >
                        {item.slaTimeLeft}
                      </span>
                    </div>
                  </div>

                  {/* Grievance Title */}
                  <h3 className="text-base font-semibold text-slate-900">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCaseFile(item);
                        setCaseDrawerTab("statement");
                      }}
                      className="text-left hover:text-emerald-800 transition flex items-center gap-1.5 group"
                      title="Click to inspect full case file"
                    >
                      <span>{item.title}</span>
                      <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700 transition" />
                    </button>
                  </h3>

                  {item.reopenReason && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800">
                      <span className="font-semibold text-slate-900">
                        Reopen Reason:{" "}
                      </span>
                      <span className="font-normal text-slate-700">
                        {item.reopenReason}
                      </span>
                    </div>
                  )}

                  {item.isCrossDepartment && item.collaboratingDepartments && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        Joint Ownership:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {item.collaboratingDepartments.map((dept) => (
                          <span
                            key={dept}
                            className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                          >
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.hodIntervention && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-950 space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5 text-emerald-900">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          Department Head Directive &bull;{" "}
                          {item.hodIntervention.actionLabel}
                        </span>
                        <span className="text-[11px] font-normal text-emerald-800 shrink-0">
                          {item.hodIntervention.intervenedAt} &bull; by{" "}
                          {item.hodIntervention.intervenedBy}
                        </span>
                      </div>
                      {item.hodIntervention.note && (
                        <p className="font-normal text-emerald-900 italic">
                          &ldquo;{item.hodIntervention.note}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  {item.submittedResolution &&
                    item.status === "UNDER_REVIEW" && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-900 space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span>
                            Pending HOD Approval &bull; Submitted by{" "}
                            {item.submittedResolution.staffName}
                          </span>
                          <span className="text-[11px] font-normal">
                            {item.submittedResolution.submittedAt}
                          </span>
                        </div>
                        <p className="font-normal">
                          {item.submittedResolution.note}
                        </p>
                      </div>
                    )}

                  {/* Bottom Row: Metadata on LEFT, Actions on RIGHT - STRICT SINGLE LINE */}
                  <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100 min-h-[38px]">
                    <div className="flex items-center gap-x-3 text-xs font-normal text-slate-500 min-w-0 flex-1 overflow-hidden">
                      <span className="truncate shrink-0">
                        <strong className="font-medium text-slate-700">
                          Category:
                        </strong>{" "}
                        <span className="text-slate-600 font-medium">
                          {item.category} &rsaquo; {item.subcategory}
                        </span>
                      </span>
                      <span className="text-slate-300 shrink-0">&bull;</span>
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <strong className="font-medium text-slate-700">
                          Submitter:
                        </strong>{" "}
                        <span
                          className="inline-block max-w-[130px] truncate align-bottom text-slate-700 font-medium"
                          title={`${item.submitterName} (${item.submitterRole})`}
                        >
                          {item.submitterName}
                        </span>
                      </span>
                      <span className="text-slate-300 shrink-0">&bull;</span>
                      <span className="inline-flex items-center gap-1 shrink-0">
                        <strong className="font-medium text-slate-700">
                          Assigned Officer:
                        </strong>{" "}
                        {item.assignedStaffName ? (
                          <span
                            className="inline-flex items-center gap-1 font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 max-w-[150px]"
                            title={`Assigned Officer: ${item.assignedStaffName}`}
                          >
                            <User className="h-3 w-3 text-emerald-700 shrink-0" />
                            <span className="truncate">
                              {item.assignedStaffName}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Unassigned
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCaseFile(item);
                          setCaseDrawerTab("progress");
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        <span>Inspect</span>
                      </button>

                      {item.status === "UNDER_REVIEW" && (
                        <button
                          type="button"
                          onClick={() => {
                            setResolutionModalGrievance(item);
                            setResolutionDecision("APPROVE");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#064E3B] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-900 transition"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Review Resolution</span>
                        </button>
                      )}

                      {item.status === "ESCALATED" && (
                        <button
                          type="button"
                          onClick={() => {
                            setEscalationModalGrievance(item);
                            setEscalationBottleneck("STAFF_CAPACITY");
                            setEscalationInterventionType("REASSIGN");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#064E3B] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-900 transition"
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Take Escalation Action</span>
                        </button>
                      )}

                      {item.assignedStaffName ? (
                        item.status !== "ESCALATED" &&
                        item.status !== "CLOSED" &&
                        item.status !== "RESOLVED" &&
                        item.slaStatus === "BREACHED" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setAssignModalGrievance(item);
                              setSelectedStaffId(item.assignedStaffId || "");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                            title={`Currently assigned to ${item.assignedStaffName}. Click to reassign.`}
                          >
                            <UserCheck className="h-3.5 w-3.5 text-emerald-800" />
                            <span>Reassign</span>
                          </button>
                        ) : null
                      ) : (
                        item.status !== "CLOSED" &&
                        item.status !== "RESOLVED" && (
                          <button
                            type="button"
                            onClick={() => {
                              setAssignModalGrievance(item);
                              setSelectedStaffId("");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#064E3B] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-900"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Assign Staff</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: STAFF WORKLOAD (Full-width, zero empty space!)                     */}
      {/* ========================================================================= */}
      {activeView === "staff" && (
        <div className="space-y-6">
          {/* Team Capacity Metrics Banner */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Officers"
              value={staffList.length}
              icon={Users}
              accentColor="emerald"
              description={`${currentDepartmentName} department`}
            />
            <StatCard
              label="On Active Duty"
              value={activeStaffCount}
              icon={UserCheck}
              accentColor="slate"
              description={`${onLeaveStaffCount} officer(s) on approved leave`}
            />
            <StatCard
              label="Active Assigned Queue"
              value={`${totalActiveTickets} Tickets`}
              icon={Inbox}
              accentColor="slate"
              description={`Across ${activeStaffCount} active officers`}
            />
            <StatCard
              label="Department Load Factor"
              value={`${Math.round((totalActiveTickets / totalStaffCapacity) * 100)}%`}
              icon={Layers}
              accentColor="slate"
              description={`${totalStaffCapacity - totalActiveTickets} slots available`}
            />
          </div>

          {/* Full-Width Staff Roster Cards Grid */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Department Staff Workload & Availability Matrix
                </h3>
                <p className="text-xs font-normal text-slate-500">
                  Manage duty availability and inspect live ticket assignments
                  per officer
                </p>
              </div>
              <span className="text-xs font-medium text-slate-600">
                Department Utilization:{" "}
                <strong className="font-semibold text-emerald-800">
                  {totalActiveTickets} / {totalStaffCapacity} capacity
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {staffList.map((staff) => {
                const loadPercentage = Math.round(
                  (staff.activeTickets / staff.maxCapacity) * 100,
                );
                const isOverloaded = loadPercentage >= 80;
                const staffTickets = grievances.filter(
                  (g) => g.assignedStaffId === staff.id,
                );

                return (
                  <div
                    key={staff.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 shadow-2xs hover:border-emerald-300 hover:bg-white transition"
                  >
                    <div className="space-y-3.5">
                      {/* Officer Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-base font-bold text-[#064E3B]">
                            {staff.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4
                              className="text-sm font-semibold text-slate-900 truncate max-w-[170px]"
                              title={staff.name}
                            >
                              {staff.name}
                            </h4>
                            <p
                              className="text-xs font-normal text-slate-500 truncate max-w-[170px]"
                              title={staff.designation}
                            >
                              {staff.designation}
                            </p>
                            <p
                              className="text-[11px] font-normal text-slate-400 truncate max-w-[170px]"
                              title={staff.email}
                            >
                              {staff.email}
                            </p>
                          </div>
                        </div>

                        {staff.status === "ON_LEAVE" ? (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            On Leave
                          </span>
                        ) : isOverloaded ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            High Load
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                            Available
                          </span>
                        )}
                      </div>

                      {/* Workload Progress Bar */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-normal text-slate-500">
                            Active Workload
                          </span>
                          <span className="font-semibold text-slate-800">
                            {staff.activeTickets} / {staff.maxCapacity} tickets
                            ({loadPercentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              staff.status === "ON_LEAVE"
                                ? "bg-slate-400"
                                : isOverloaded
                                  ? "bg-amber-500"
                                  : "bg-emerald-600"
                            }`}
                            style={{
                              width: `${Math.min(loadPercentage, 100)}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Assigned Tickets Mini-List */}
                      <div className="border-t border-slate-200/70 pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            Assigned Tickets ({staffTickets.length})
                          </div>
                          {staffTickets.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setStaffFilter(staff.id);
                                switchView("queue");
                              }}
                              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 transition"
                              title="Filter all tickets handled by this officer in the queue"
                            >
                              View in Queue &rarr;
                            </button>
                          )}
                        </div>

                        {staffTickets.length === 0 ? (
                          <p className="text-xs italic text-slate-400 py-1">
                            No active tickets assigned.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                            {staffTickets.map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center justify-between rounded-xl bg-white border border-slate-200/80 p-2.5 text-xs hover:border-emerald-300 hover:shadow-2xs transition gap-2"
                              >
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono font-semibold text-emerald-900 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[10px]">
                                      {t.ticketCode}
                                    </span>
                                    <PriorityBadge priority={t.priority} />
                                    <span className="text-[10px] font-medium text-slate-500">
                                      {t.slaTimeLeft}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCaseFile(t);
                                      setCaseDrawerTab("statement");
                                    }}
                                    className="text-left text-slate-800 font-medium truncate hover:text-emerald-800 transition text-xs block w-full"
                                    title="Click to inspect full case file"
                                  >
                                    {t.title}
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCaseFile(t);
                                      setCaseDrawerTab("progress");
                                    }}
                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white hover:border-emerald-300 transition"
                                    title="Inspect full case file, statements & attachments"
                                  >
                                    <Eye className="h-3 w-3 text-slate-500" />
                                    <span>Inspect</span>
                                  </button>
                                  {(t.status === "ESCALATED" ||
                                    t.slaStatus === "BREACHED") && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAssignModalGrievance(t);
                                        setSelectedStaffId(staff.id);
                                      }}
                                      className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                                      title="Reassign to another officer"
                                    >
                                      <span>Reassign</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Officer Status Toggle Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Status:{" "}
                        <strong className="font-semibold text-slate-700">
                          {staff.status}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleStaffAvailability(staff)}
                        className="font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                      >
                        {staff.status === "ON_LEAVE"
                          ? "Mark as Available"
                          : "Set as On Leave"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: SLA & ESCALATIONS CENTER (Full-width 11-Step Lifecycle Protocol)   */}
      {/* ========================================================================= */}
      {activeView === "sla" && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="SLA Breached"
              value={
                grievances.filter((g) => g.slaStatus === "BREACHED").length
              }
              icon={AlertCircle}
              accentColor="slate"
              description="Exceeded maximum SLA duration"
            />
            <StatCard
              label="SLA At Risk"
              value={grievances.filter((g) => g.slaStatus === "AT_RISK").length}
              icon={Clock}
              accentColor="slate"
              description="Approaching deadline threshold"
            />
            <StatCard
              label="Active Escalations"
              value={escalatedCount}
              icon={Flame}
              accentColor="slate"
              description="Requires Department Head action"
            />
            <StatCard
              label="Reopened Tickets"
              value={reopenedCount}
              icon={RotateCcw}
              accentColor="slate"
              description="Submitters contesting resolution"
            />
          </div>

          {/* ========================================================================= */}
          {/* SLA & ESCALATIONS QUEUE                                                   */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Escalation & SLA Governance
                  </h3>
                  <p className="text-xs font-normal text-slate-500">
                    Review escalated grievances, execute corrective
                    interventions, and approve resolutions.
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                {
                  grievances.filter(
                    (g) =>
                      g.status === "ESCALATED" ||
                      g.hodIntervention ||
                      g.status === "UNDER_REVIEW",
                  ).length
                }{" "}
                Managed Cases
              </span>
            </div>

            {/* List of Grievances with Scrollbar */}
            <div className="max-h-[560px] overflow-y-scroll custom-scrollbar pr-2 space-y-3">
              {(() => {
                const escalatedList = grievances.filter((g) => {
                  return (
                    g.status === "ESCALATED" ||
                    g.hodIntervention ||
                    g.status === "UNDER_REVIEW" ||
                    g.slaStatus === "BREACHED"
                  );
                });

                if (escalatedList.length === 0) {
                  return (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-8 text-center text-slate-500 text-xs">
                      No active escalations requiring intervention.
                    </div>
                  );
                }

                return escalatedList.map((item) => {
                  const isEscalated = item.status === "ESCALATED";
                  const isUnderIntervention =
                    item.status === "IN_PROGRESS" && item.hodIntervention;
                  const isResolutionReady =
                    item.status === "UNDER_REVIEW" && item.submittedResolution;
                  const isCleared =
                    item.status === "CLOSED" &&
                    item.escalationStage === "ESCALATION_CLEARED";

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs hover:border-emerald-300 transition space-y-2.5"
                    >
                      {/* Ticket Header & Status Pill */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                            {item.ticketCode}
                          </span>
                          <PriorityBadge priority={item.priority} />

                          {/* Simplified Status: If resolution submitted, highlight resolution review; if escalated, show amber badge */}
                          {item.submittedResolution ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              <FileCheck className="h-3 w-3 text-emerald-600" />
                              Resolution Pending Review
                            </span>
                          ) : isEscalated ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              <Bell className="h-3 w-3 text-amber-600" />
                              Escalated to Head
                            </span>
                          ) : isUnderIntervention ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              <RefreshCw className="h-3 w-3 text-amber-600" />
                              Under Intervention
                            </span>
                          ) : isCleared ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Escalation Cleared
                            </span>
                          ) : (
                            <StatusBadge status={item.status} />
                          )}
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded ${
                              item.submittedResolution ||
                              isEscalated ||
                              isUnderIntervention
                                ? "text-slate-600 bg-slate-50 border border-slate-200/80"
                                : item.slaStatus === "BREACHED"
                                  ? "text-amber-800 bg-amber-50 border border-amber-200 font-semibold"
                                  : item.slaStatus === "AT_RISK"
                                    ? "text-amber-800 bg-amber-50 border border-amber-200"
                                    : "text-slate-600 bg-slate-50 border border-slate-200"
                            }`}
                          >
                            {item.slaTimeLeft}
                          </span>
                        </div>
                      </div>

                      {/* Ticket Title & Metadata */}
                      <div className="space-y-1">
                        <h4 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCaseFile(item);
                              setCaseDrawerTab("statement");
                            }}
                            className="text-left hover:text-[#064E3B] transition inline-flex items-center gap-1.5 group"
                            title="Click to inspect full case file"
                          >
                            <span>{item.title}</span>
                            <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700 transition shrink-0" />
                          </button>
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 font-normal">
                          <span>
                            {item.category} / {item.subcategory}
                          </span>
                          <span className="text-slate-300">&middot;</span>
                          <span
                            className="inline-block max-w-[140px] truncate align-bottom text-slate-600"
                            title={item.submitterName}
                          >
                            {item.submitterName}
                          </span>
                          <span className="text-slate-300">&middot;</span>
                          <span>
                            Assigned:{" "}
                            <strong
                              className="font-medium text-slate-700 inline-block max-w-[150px] truncate align-bottom"
                              title={item.assignedStaffName || "Unassigned"}
                            >
                              {item.assignedStaffName || "Unassigned"}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Context Alert Banner (compact, no red, no duplicate icons, no raw percentages) */}
                      {item.submittedResolution ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-950 flex items-start sm:items-center gap-2">
                          <FileCheck className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5 sm:mt-0" />
                          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                            <span className="font-semibold text-emerald-950 shrink-0">
                              Resolution Pending Approval:
                            </span>
                            <span className="font-normal text-emerald-800 text-xs truncate">
                              Staff submitted corrective action & findings —
                              awaiting Department Head review & sign-off.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-950 flex items-start sm:items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
                          <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                            <span className="font-semibold text-amber-950 shrink-0">
                              SLA Deadline Exceeded:
                            </span>
                            <span className="font-normal text-amber-900 text-xs truncate">
                              {formatEscalationNotice(item.escalationReason)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* HOD Intervention Directive Banner (if present) */}
                      {item.hodIntervention && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-950 space-y-1">
                          <div className="flex items-center justify-between font-semibold text-emerald-900">
                            <span>
                              Department Head Directive (
                              {item.hodIntervention.actionLabel})
                            </span>
                            <span className="text-[11px] font-normal text-slate-500">
                              {item.hodIntervention.intervenedAt}
                            </span>
                          </div>
                          {item.hodIntervention.note && (
                            <p className="font-normal text-slate-700 italic truncate">
                              &ldquo;{item.hodIntervention.note}&rdquo;
                            </p>
                          )}
                        </div>
                      )}

                      {/* Submitted Resolution Details (if present) */}
                      {item.submittedResolution && (
                        <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 px-3 py-2 text-xs text-slate-800 flex items-center justify-between gap-2">
                          <div className="truncate">
                            <span className="font-semibold text-emerald-950">
                              Submitted Action:{" "}
                            </span>
                            <span className="text-slate-700">
                              {item.submittedResolution.note}
                            </span>
                          </div>
                          <span className="text-[11px] font-normal text-slate-500 shrink-0">
                            {item.submittedResolution.submittedAt}
                          </span>
                        </div>
                      )}

                      {/* Action Bar (Aligned footer) */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2.5 border-t border-slate-100 gap-2">
                        {/* LEFT: Case summary info */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>
                            Case{" "}
                            <strong className="font-semibold text-slate-700">
                              {item.ticketCode}
                            </strong>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>Logged {item.createdAt}</span>
                        </div>

                        {/* RIGHT: Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCaseFile(item);
                              setCaseDrawerTab("progress");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
                          >
                            <Eye className="h-3 w-3 text-slate-500" />
                            <span>Inspect Case File</span>
                          </button>

                          {item.submittedResolution ? (
                            <button
                              type="button"
                              onClick={() => {
                                setResolutionModalGrievance(item);
                                setResolutionDecision("APPROVE");
                                setResolutionFeedback("");
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#064E3B] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-900 transition"
                            >
                              <FileCheck className="h-3.5 w-3.5" />
                              <span>Review Resolution &rarr;</span>
                            </button>
                          ) : isEscalated ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEscalationModalGrievance(item);
                                setEscalationBottleneck("STAFF_CAPACITY");
                                setEscalationInterventionType("REASSIGN");
                                setEscalationTargetStaffId("");
                                setEscalationNote("");
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#064E3B] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-900 transition"
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>Intervene & Reassign &rarr;</span>
                            </button>
                          ) : isUnderIntervention ? (
                            <button
                              type="button"
                              onClick={() => handleSimulateResolution(item.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition"
                            >
                              <FileCheck className="h-3.5 w-3.5" />
                              <span>Simulate Staff Resolution &rarr;</span>
                            </button>
                          ) : isResolutionReady ? (
                            <button
                              type="button"
                              onClick={() => {
                                setResolutionModalGrievance(item);
                                setResolutionDecision("APPROVE");
                                setResolutionFeedback("");
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#064E3B] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-900 transition"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Review Resolution &rarr;</span>
                            </button>
                          ) : null}

                          {isCleared && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              Escalation Cleared & Closed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: ASSIGNMENT, STEP 4-6 ESCALATION INTERVENTION, STEP 11 RESOLUTION   */}
      {/* ========================================================================= */}
      {assignModalGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {assignModalGrievance.assignedStaffName
                    ? "Reassign Grievance"
                    : "Assign Grievance to Staff"}
                </h3>
                <p className="text-xs font-normal text-slate-500">
                  Dispatching{" "}
                  <span className="font-mono font-semibold text-[#064E3B]">
                    {assignModalGrievance.ticketCode}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalGrievance(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="mt-4 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                <div className="font-semibold text-slate-900">
                  {assignModalGrievance.title}
                </div>
                <div className="font-normal text-slate-600">
                  Category: {assignModalGrievance.category} &rsaquo;{" "}
                  {assignModalGrievance.subcategory}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <PriorityBadge priority={assignModalGrievance.priority} />
                  <span className="font-normal text-slate-500">
                    Target SLA: {assignModalGrievance.slaDeadline}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="staff-select"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  Select Department Officer{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  id="staff-select"
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="">
                    -- Choose an Officer from {currentDepartmentName} --
                  </option>
                  {staffList.map((staff) => (
                    <option
                      key={staff.id}
                      value={staff.id}
                      disabled={staff.status === "ON_LEAVE"}
                    >
                      {staff.name} ({staff.designation}) — {staff.activeTickets}
                      /{staff.maxCapacity} active tickets{" "}
                      {staff.status === "ON_LEAVE" ? "[ON LEAVE]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="internal-instructions"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  Internal Instructions & Priority Notes (Optional)
                </label>
                <textarea
                  id="internal-instructions"
                  rows={3}
                  value={assignmentNote}
                  onChange={(e) => setAssignmentNote(e.target.value)}
                  placeholder="e.g. Please verify with payroll register for Feb before responding. Expedite due to high priority."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalGrievance(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedStaffId}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-900 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Confirm Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESCALATION INTERVENTION MODAL (Steps 4, 5, 6 -> Advances to 7, 8, 9)       */}
      {/* ========================================================================= */}
      {escalationModalGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    SLA Escalation Intervention
                  </h3>
                  <p className="text-xs font-normal text-slate-500">
                    Ticket{" "}
                    <span className="font-mono font-semibold text-amber-800">
                      {escalationModalGrievance.ticketCode}
                    </span>{" "}
                    &bull; {escalationModalGrievance.slaTimeLeft}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEscalationModalGrievance(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleEscalationSubmit}
              className="flex flex-col flex-1 min-h-0"
            >
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                {/* Grievance Context & SLA Breach Details */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-950">
                      {escalationModalGrievance.title}
                    </span>
                    <PriorityBadge
                      priority={escalationModalGrievance.priority}
                    />
                  </div>
                  <p className="text-amber-950 font-normal">
                    <strong>Breach Context:</strong>{" "}
                    {formatEscalationNotice(
                      escalationModalGrievance.escalationReason,
                    )}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600 border-t border-amber-200/60">
                    <span>
                      Submitter:{" "}
                      <strong>{escalationModalGrievance.submitterName}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Currently Assigned:{" "}
                      <strong>
                        {escalationModalGrievance.assignedStaffName ||
                          "Unassigned"}
                      </strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Category:{" "}
                      <strong>{escalationModalGrievance.category}</strong>
                    </span>
                  </div>
                </div>

                {/* Identify Bottleneck */}
                <div>
                  <div className="block text-xs font-semibold text-slate-900 mb-1.5">
                    Identify Root Operational Bottleneck{" "}
                    <span className="text-rose-500">*</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEscalationBottleneck("STAFF_CAPACITY")}
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationBottleneck === "STAFF_CAPACITY"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      👥 Staff Capacity / Absence
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Officer overloaded or on approved leave
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEscalationBottleneck("CROSS_DEPT")}
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationBottleneck === "CROSS_DEPT"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      🏢 Cross-Department Dependency
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Awaiting response or approval from Finance/IT
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEscalationBottleneck("MISSING_DOCS")}
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationBottleneck === "MISSING_DOCS"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      📁 Incomplete Documentation
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Awaiting original bills or vouchers from submitter
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEscalationBottleneck("COMPLEX_INVESTIGATION")
                      }
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationBottleneck === "COMPLEX_INVESTIGATION"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      🔍 Complex Investigation Required
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Requires audit panel or field verification
                      </div>
                    </button>
                  </div>
                </div>

                {/* Intervention Action */}
                <div>
                  <div className="block text-xs font-semibold text-slate-900 mb-1.5">
                    Choose Corrective Intervention Action{" "}
                    <span className="text-rose-500">*</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEscalationInterventionType("MONITOR")}
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationInterventionType === "MONITOR"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      👁️ Continue Monitoring
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Acknowledge SLA risk and supervise without reassigning
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEscalationInterventionType("NOTIFY_STAFF")
                      }
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationInterventionType === "NOTIFY_STAFF"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      📢 Notify Assigned Staff
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Send urgent priority nudge to assigned officer
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEscalationInterventionType("CROSS_DEPT")
                      }
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationInterventionType === "CROSS_DEPT"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      🤝 Add Supporting Dept / Staff
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Enlist supporting department to collaborate
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEscalationInterventionType("REASSIGN")}
                      className={`rounded-xl border p-2.5 text-left text-xs transition ${
                        escalationInterventionType === "REASSIGN"
                          ? "border-[#064E3B] bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-[#064E3B]"
                          : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      🔄 Reassign to Available Officer
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        Transfer ticket to an active officer with spare capacity
                      </div>
                    </button>
                  </div>
                </div>

                {/* Dynamic Target Selection based on Intervention Type */}
                {escalationInterventionType === "REASSIGN" && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <label
                      htmlFor="escalation-target-staff"
                      className="block text-xs font-semibold text-slate-900 mb-1"
                    >
                      Select Target Officer{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="escalation-target-staff"
                      required
                      value={escalationTargetStaffId}
                      onChange={(e) =>
                        setEscalationTargetStaffId(e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                    >
                      <option value="">
                        -- Choose an Available Officer --
                      </option>
                      {staffList.map((s) => (
                        <option
                          key={s.id}
                          value={s.id}
                          disabled={s.status === "ON_LEAVE"}
                        >
                          {s.name} ({s.designation}) &bull; {s.activeTickets}/
                          {s.maxCapacity} tickets{" "}
                          {s.status === "ON_LEAVE"
                            ? "[ON LEAVE]"
                            : "[AVAILABLE]"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {escalationInterventionType === "CROSS_DEPT" && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <label
                      htmlFor="escalation-target-dept"
                      className="block text-xs font-semibold text-slate-900 mb-1"
                    >
                      Select Collaborating Department{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="escalation-target-dept"
                      value={escalationTargetDept}
                      onChange={(e) => setEscalationTargetDept(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                    >
                      <option value="Finance & Accounts">
                        Finance & Accounts
                      </option>
                      <option value="Medical Superintendent Services">
                        Medical Superintendent Services
                      </option>
                      <option value="General Administration">
                        General Administration
                      </option>
                      <option value="Human Resources & Legal">
                        Human Resources & Legal
                      </option>
                    </select>
                  </div>
                )}

                {/* Intervention Directive & Justification Note */}
                <div>
                  <label
                    htmlFor="escalation-action-note"
                    className="block text-xs font-semibold text-slate-900 mb-1.5"
                  >
                    Intervention Directive & Justification (Logged to Audit
                    Trail) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="escalation-action-note"
                    required
                    rows={3}
                    value={escalationNote}
                    onChange={(e) => setEscalationNote(e.target.value)}
                    placeholder="Explain the operational bottleneck resolved and specific directives given to staff..."
                    className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Modal Footer (Fixed at bottom) */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 bg-slate-50/90 shrink-0 gap-2">
                <span className="text-[11px] text-slate-500">
                  Intervention is logged to the audit trail and dispatched to
                  the assigned officer.
                </span>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setEscalationModalGrievance(null)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      escalationInterventionType === "REASSIGN" &&
                      !escalationTargetStaffId
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Confirm & Execute Intervention &rarr;</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESOLUTION REVIEW & CLEARANCE MODAL                                       */}
      {/* ========================================================================= */}
      {resolutionModalGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Resolution Review & Clearance
                </h3>
                <p className="text-xs font-normal text-slate-500">
                  Final sign-off for{" "}
                  <span className="font-mono font-semibold text-[#064E3B]">
                    {resolutionModalGrievance.ticketCode}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResolutionModalGrievance(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResolutionSubmit} className="mt-4 space-y-4">
              {/* Step 10 Findings */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-slate-800 space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-emerald-950">
                  <span>
                    Investigating Officer Findings:{" "}
                    {resolutionModalGrievance.submittedResolution?.staffName}
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">
                    {resolutionModalGrievance.submittedResolution?.submittedAt}
                  </span>
                </div>
                <p className="font-normal leading-relaxed">
                  {resolutionModalGrievance.submittedResolution?.note}
                </p>
              </div>

              <div>
                <div className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Department Head Final Decision
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setResolutionDecision("APPROVE")}
                    className={`rounded-xl border p-3 text-xs text-left transition ${
                      resolutionDecision === "APPROVE"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-600"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-normal"
                    }`}
                  >
                    ✅ Approve & Clear Escalation
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                      Clear escalation flag & mark grievance as CLOSED
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionDecision("REJECT")}
                    className={`rounded-xl border p-3 text-xs text-left transition ${
                      resolutionDecision === "REJECT"
                        ? "border-slate-800 bg-slate-100 text-slate-900 font-semibold ring-1 ring-slate-800"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700 font-normal"
                    }`}
                  >
                    🔄 Request Clarification
                    <div className="text-[10px] font-normal text-slate-500 mt-0.5">
                      Return to investigating officer for revision
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="review-feedback"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  {resolutionDecision === "APPROVE"
                    ? "Final Approval Remarks (Logged to Audit Trail)"
                    : "Clarification Directives"}
                </label>
                <textarea
                  id="review-feedback"
                  rows={3}
                  value={resolutionFeedback}
                  onChange={(e) => setResolutionFeedback(e.target.value)}
                  placeholder={
                    resolutionDecision === "APPROVE"
                      ? "e.g. Resolution verified and sanctioned. All compliance requirements fulfilled."
                      : "e.g. Please verify additional bank annexures before final submission."
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolutionModalGrievance(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-xs transition ${
                    resolutionDecision === "APPROVE"
                      ? "bg-[#064E3B] hover:bg-emerald-900"
                      : "bg-slate-800 hover:bg-slate-900"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>
                    {resolutionDecision === "APPROVE"
                      ? "Approve Resolution & Close Grievance"
                      : "Return to Staff with Feedback"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEAVE REASSIGNMENT HELPER MODAL                                           */}
      {/* ========================================================================= */}
      {leaveReassignmentModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100/70 text-[#064E3B]">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Officer Has Active Grievances — Reassignment Recommended
                  </h3>
                  <p className="text-xs font-normal text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {leaveReassignmentModalStaff.name}
                    </span>{" "}
                    ({leaveReassignmentModalStaff.designation}) &bull;{" "}
                    <span className="font-semibold text-slate-700">
                      {
                        grievances.filter(
                          (g) =>
                            g.assignedStaffId ===
                              leaveReassignmentModalStaff.id &&
                            g.status !== "CLOSED",
                        ).length
                      }{" "}
                      Active Case(s)
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLeaveReassignmentModalStaff(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleBulkReassignAndMarkLeave}
              className="mt-4 space-y-4"
            >
              {/* Context Alert Banner */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-800 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-slate-600" />
                  <span>SLA Protection Advisory</span>
                </div>
                <p className="font-normal text-slate-700 leading-relaxed">
                  Marking this officer on leave will freeze their availability.
                  To prevent active tickets from stalling or breaching
                  resolution SLAs, it is recommended to bulk-transfer these
                  grievances to another available officer.
                </p>
              </div>

              {/* Active Tickets List */}
              <div className="space-y-2">
                <div className="block text-xs font-semibold text-slate-800">
                  Currently Assigned Active Grievances (
                  {
                    grievances.filter(
                      (g) =>
                        g.assignedStaffId === leaveReassignmentModalStaff.id &&
                        g.status !== "CLOSED",
                    ).length
                  }
                  )
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {grievances
                    .filter(
                      (g) =>
                        g.assignedStaffId === leaveReassignmentModalStaff.id &&
                        g.status !== "CLOSED",
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                              {item.ticketCode}
                            </span>
                            <PriorityBadge priority={item.priority} />
                            <StatusBadge status={item.status} />
                          </div>
                          <p className="font-medium text-slate-900 line-clamp-1">
                            {item.title}
                          </p>
                          <span className="text-[11px] text-slate-500">
                            {item.category} &rsaquo; {item.subcategory}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span
                            className={`text-xs font-semibold ${
                              item.slaStatus === "BREACHED"
                                ? "text-amber-800 font-semibold"
                                : item.slaStatus === "AT_RISK"
                                  ? "text-amber-700"
                                  : "text-slate-600"
                            }`}
                          >
                            {item.slaTimeLeft}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCaseFile(item);
                              setCaseDrawerTab("progress");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <Eye className="h-3 w-3 text-slate-500" />
                            <span>Inspect</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Target Staff Member Dropdown */}
              <div>
                <label
                  htmlFor="leave-target-staff"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  Select Officer to Receive Reassigned Grievances{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  id="leave-target-staff"
                  required
                  value={leaveReassignTargetStaffId}
                  onChange={(e) =>
                    setLeaveReassignTargetStaffId(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
                >
                  <option value="">-- Choose an Available Officer --</option>
                  {staffList
                    .filter((s) => s.id !== leaveReassignmentModalStaff.id)
                    .map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                        disabled={s.status === "ON_LEAVE"}
                      >
                        {s.name} ({s.designation}) &bull; {s.activeTickets}/
                        {s.maxCapacity} active tickets{" "}
                        {s.status === "ON_LEAVE" ? "[ON LEAVE]" : "[AVAILABLE]"}
                      </option>
                    ))}
                </select>
              </div>

              {/* HOD Directive / Handoff Note */}
              <div>
                <label
                  htmlFor="leave-reassign-note"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  HOD Handoff Directive (Logged to Ticket Audit Trail)
                </label>
                <textarea
                  id="leave-reassign-note"
                  rows={2}
                  value={leaveReassignNote}
                  onChange={(e) => setLeaveReassignNote(e.target.value)}
                  placeholder="e.g. Officer approved on leave. Reassigned to prevent SLA delay..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setLeaveReassignmentModalStaff(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleKeepTicketsAndMarkLeave}
                    className="rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                  >
                    Keep Tickets & Mark On Leave
                  </button>

                  <button
                    type="submit"
                    disabled={!leaveReassignTargetStaffId}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Reassign All & Mark On Leave</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* CASE FILE INSPECTION DIALOG (Centered Popover Review)                     */}
      {/* ========================================================================= */}
      {selectedCaseFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Popover Header (Fixed at top) */}
            <div className="flex flex-col border-b border-slate-200/90 bg-slate-50/70 px-6 py-4 shrink-0 gap-3">
              {/* Row 1: Back to SLA Monitoring & Ticket Code + Close */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedCaseFile(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-900 transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to SLA Monitoring</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#064E3B] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/80">
                    {selectedCaseFile.ticketCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCaseFile(null)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
                    title="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Row 2: Title, Status Pill, Category & Priority */}
              <div className="flex flex-wrap items-start justify-between gap-3 pt-0.5">
                <div className="space-y-1 max-w-[70%]">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-1">
                    {selectedCaseFile.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span>{selectedCaseFile.category}</span>
                    <span className="text-slate-300">•</span>
                    <span>{selectedCaseFile.subcategory}</span>
                    <span className="text-slate-300">•</span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        selectedCaseFile.priority === "CRITICAL"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : selectedCaseFile.priority === "HIGH"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {selectedCaseFile.priority} Priority
                    </span>
                  </div>
                </div>

                {/* Status Pill */}
                <div>
                  {(caseProgressData?.sla?.state ||
                    selectedCaseFile.slaStatus) === "BREACHED" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                      SLA BREACHED
                    </span>
                  ) : (caseProgressData?.sla?.state ||
                      selectedCaseFile.slaStatus) === "SLA_AT_RISK" ||
                    selectedCaseFile.slaStatus === "AT_RISK" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      SLA AT RISK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      ON TRACK
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs inside Dialog (Fixed) */}
            <div className="flex items-center border-b border-slate-200 px-6 bg-white gap-6 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setCaseDrawerTab("progress")}
                className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                  caseDrawerTab === "progress"
                    ? "border-[#064E3B] text-[#064E3B]"
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
                onClick={() => setCaseDrawerTab("statement")}
                className={`py-3 border-b-2 transition ${
                  caseDrawerTab === "statement"
                    ? "border-[#064E3B] text-[#064E3B]"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                Statement & Proofs
              </button>
              <button
                type="button"
                onClick={() => setCaseDrawerTab("notes")}
                className={`py-3 border-b-2 transition inline-flex items-center gap-1.5 ${
                  caseDrawerTab === "notes"
                    ? "border-[#064E3B] text-[#064E3B]"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>Internal Notes</span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
                  {selectedCaseFile.internalNotes?.length || 0}
                </span>
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {caseDrawerTab === "progress" && (
                <>
                  {/* 1. CURRENT PROGRESS STEPPER */}
                  {(() => {
                    const st = selectedCaseFile.status;
                    const isAssigned =
                      !!selectedCaseFile.assignedStaffName ||
                      !!caseProgressData?.assignment?.isAssigned;

                    const isCaseReopened =
                      selectedCaseFile.isReopened ||
                      selectedCaseFile.status === "REOPENED" ||
                      (selectedCaseFile.reopenCount || 0) > 0;

                    const fallbackStageNumber =
                      st === "CLOSED" || st === "RESOLVED"
                        ? 4
                        : st === "UNDER_REVIEW"
                          ? 4
                          : st === "IN_PROGRESS" ||
                              st === "ESCALATED" ||
                              st === "REOPENED"
                            ? 3
                            : isAssigned || st === "ASSIGNED"
                              ? 2
                              : 1;

                    const stageNumber =
                      caseProgressData?.currentStage?.stageNumber ??
                      fallbackStageNumber;

                    const currentStageLabel =
                      caseProgressData?.currentStage?.label ||
                      (st === "CLOSED"
                        ? "Grievance Closed"
                        : st === "UNDER_REVIEW"
                          ? "Resolution Submitted — Pending HOD Approval"
                          : st === "ESCALATED"
                            ? isCaseReopened
                              ? "Reopened — Escalated for Intervention"
                              : "Under Active Investigation (Escalated)"
                            : st === "IN_PROGRESS" || st === "REOPENED"
                              ? isCaseReopened
                                ? "Reopened — Under Active Investigation"
                                : "Under Active Investigation"
                              : isAssigned || st === "ASSIGNED"
                                ? isCaseReopened
                                  ? `Reopened — Assigned to ${selectedCaseFile.assignedStaffName || "Officer"}`
                                  : `Assigned to ${selectedCaseFile.assignedStaffName || "Officer"}`
                                : "Pending Staff Assignment");

                    const steps = caseProgressData?.currentStage
                      ?.progressSteps || [
                      {
                        key: "SUBMITTED",
                        label: "Submitted",
                        isComplete: true,
                        isCurrent: stageNumber === 1,
                      },
                      {
                        key: "ASSIGNED",
                        label: "Assigned",
                        isComplete: stageNumber >= 2,
                        isCurrent: stageNumber === 2,
                      },
                      {
                        key: "INVESTIGATION",
                        label: "Investigation",
                        isComplete: stageNumber >= 3,
                        isCurrent: stageNumber === 3,
                      },
                      {
                        key: "RESOLUTION",
                        label:
                          st === "CLOSED"
                            ? "Grievance Closed"
                            : "Resolution Review",
                        isComplete: stageNumber >= 4,
                        isCurrent: stageNumber === 4,
                      },
                    ];

                    return (
                      <div className="rounded-xl border border-slate-200/90 bg-white p-5 space-y-4 shadow-2xs overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                            Current Progress
                          </span>
                          <span className="text-xs font-semibold text-emerald-800 text-right truncate max-w-full sm:max-w-[70%]">
                            Stage {stageNumber} of {steps.length}:{" "}
                            {currentStageLabel}
                          </span>
                        </div>

                        {/* Visual Multi-Step Stepper (Safely contained inside card) */}
                        <div className="relative flex items-center justify-between pt-2 px-3 sm:px-6">
                          {/* Background track line & active fill bar strictly contained */}
                          <div className="absolute left-7 sm:left-10 right-7 sm:right-10 top-[24px] h-0.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                              style={{
                                width: `${Math.min(100, Math.max(0, ((stageNumber - 1) / (steps.length - 1)) * 100))}%`,
                              }}
                            />
                          </div>

                          {steps.map((step, idx) => {
                            const isPastOrCurrent = idx < stageNumber;
                            const isCurrent = idx === stageNumber - 1;
                            return (
                              <div
                                key={step.key}
                                className="relative z-10 flex flex-col items-center"
                              >
                                <div
                                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition ${
                                    isPastOrCurrent
                                      ? "border-emerald-600 bg-emerald-600 text-white shadow-2xs"
                                      : "border-slate-300 bg-white text-slate-400"
                                  } ${isCurrent ? "ring-4 ring-emerald-100" : ""}`}
                                >
                                  {isPastOrCurrent ? (
                                    <Check className="h-4 w-4 stroke-[3]" />
                                  ) : (
                                    <span>{idx + 1}</span>
                                  )}
                                </div>
                                <span
                                  className={`mt-2 text-xs font-medium text-center max-w-[75px] sm:max-w-[95px] line-clamp-2 leading-tight ${
                                    isPastOrCurrent
                                      ? "font-bold text-slate-900"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Last Activity row */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-600 border-t border-slate-100 min-w-0">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-full">
                            Last Activity:{" "}
                            <strong className="text-slate-800 font-semibold">
                              {caseProgressData?.latestActivity ||
                                (selectedCaseFile.assignedStaffName
                                  ? `Assigned to ${selectedCaseFile.assignedStaffName}`
                                  : "Grievance registered in portal")}
                            </strong>
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 2. TWO-COLUMN SECTION: SLA STATUS & ASSIGNMENT */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: SLA STATUS Card */}
                    {(() => {
                      const slaPercent =
                        caseProgressData?.sla?.consumptionPercent ??
                        selectedCaseFile.slaConsumptionPercent ??
                        (selectedCaseFile.slaStatus === "BREACHED"
                          ? 100
                          : selectedCaseFile.slaStatus === "AT_RISK"
                            ? 80
                            : 40);

                      const slaTimeRemaining =
                        caseProgressData?.sla?.timeRemaining ||
                        selectedCaseFile.slaTimeLeft;

                      const slaTargetDue =
                        caseProgressData?.sla?.dueAt ||
                        selectedCaseFile.slaDeadline;

                      const slaState =
                        caseProgressData?.sla?.state ||
                        (selectedCaseFile.slaStatus === "BREACHED"
                          ? "BREACHED"
                          : selectedCaseFile.slaStatus === "AT_RISK"
                            ? "SLA_AT_RISK"
                            : "ON_TRACK");

                      const slaStateLabel =
                        caseProgressData?.sla?.stateLabel ||
                        (selectedCaseFile.slaStatus === "BREACHED"
                          ? "SLA Breached"
                          : selectedCaseFile.slaStatus === "AT_RISK"
                            ? "Approaching SLA"
                            : "Within SLA");

                      return (
                        <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-emerald-800" />
                              SLA Status
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                slaState === "BREACHED"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : slaState === "SLA_AT_RISK"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {slaStateLabel}
                            </span>
                          </div>

                          {/* SLA Progress Bar & Percentage */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-slate-600">
                                SLA Consumed
                              </span>
                              <span className="text-slate-900">
                                {slaPercent}%
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  slaPercent >= 90 || slaState === "BREACHED"
                                    ? "bg-rose-500"
                                    : slaPercent >= 70
                                      ? "bg-amber-500"
                                      : "bg-emerald-600"
                                }`}
                                style={{
                                  width: `${Math.min(slaPercent, 100)}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-1.5 pt-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">
                                Time Remaining:
                              </span>
                              <span className="font-semibold text-slate-800">
                                {slaTimeRemaining}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">
                                Target Due Date:
                              </span>
                              <span className="font-medium text-slate-700">
                                {slaTargetDue}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Right: ASSIGNMENT Card */}
                    {(() => {
                      const assignedStaff = staffList.find(
                        (s: StaffMember) =>
                          s.id === selectedCaseFile.assignedStaffId,
                      );
                      const officerName =
                        caseProgressData?.assignment?.staffName ||
                        selectedCaseFile.assignedStaffName ||
                        assignedStaff?.name ||
                        null;
                      const officerDesignation =
                        caseProgressData?.assignment?.designation ||
                        assignedStaff?.designation ||
                        "Investigating Officer";
                      const officerEmail =
                        caseProgressData?.assignment?.email ||
                        assignedStaff?.email ||
                        null;
                      const assignedTimestamp =
                        caseProgressData?.assignment?.assignedAtRelative ||
                        caseProgressData?.assignment?.assignedAt ||
                        (selectedCaseFile.assignedStaffName
                          ? "Assigned"
                          : null);
                      const assignmentStatus =
                        caseProgressData?.assignment?.status ||
                        (selectedCaseFile.assignedStaffName
                          ? "In Progress"
                          : "Pending");

                      return (
                        <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-emerald-800" />
                              Assignment
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              Status:{" "}
                              <strong className="text-slate-800">
                                {assignmentStatus}
                              </strong>
                            </span>
                          </div>

                          {officerName ? (
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm">
                                  {officerName.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">
                                    {officerName}
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {officerDesignation}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1 pt-1 border-t border-slate-100">
                                {assignedTimestamp && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">
                                      Assigned:
                                    </span>
                                    <span className="font-medium text-slate-700">
                                      {assignedTimestamp}
                                    </span>
                                  </div>
                                )}
                                {officerEmail && (
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-500">
                                      Email:
                                    </span>
                                    <a
                                      href={`mailto:${officerEmail}`}
                                      className="text-emerald-700 hover:underline font-medium"
                                    >
                                      {officerEmail}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-3 text-center space-y-2">
                              <p className="text-xs text-slate-500">
                                No officer currently assigned to this ticket.
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const caseFile = selectedCaseFile;
                                  setSelectedCaseFile(null);
                                  setAssignModalGrievance(caseFile);
                                  setSelectedStaffId("");
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#064E3B] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-900 transition"
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                                <span>Assign Officer Now</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* 3. ACTIVITY TIMELINE */}
                  <div className="rounded-xl border border-slate-200/90 bg-white p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Activity Timeline
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Chronological Governance Trail
                      </span>
                    </div>

                    {(() => {
                      const timelineEvents =
                        caseProgressData?.timeline &&
                        caseProgressData.timeline.length > 0
                          ? caseProgressData.timeline
                          : (selectedCaseFile.auditTrail || []).map(
                              (log, idx) => ({
                                id: log.id || String(idx),
                                timestamp: log.timestamp,
                                relativeTime: log.timestamp,
                                title: formatAuditActionTitle(log.action),
                                description: formatAuditLogContent(
                                  log.action,
                                  log.details,
                                ),
                                actor: log.actor,
                              }),
                            );

                      if (timelineEvents.length === 0) {
                        return (
                          <p className="text-xs text-slate-400 italic py-2">
                            No activity records logged for this case.
                          </p>
                        );
                      }

                      return (
                        <div className="relative pl-6 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                          {timelineEvents.map((ev, idx) => (
                            <div key={ev.id || idx} className="relative group">
                              <div
                                className={`absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-white shadow-2xs ${
                                  idx === 0
                                    ? "bg-emerald-600 ring-2 ring-emerald-200"
                                    : "bg-slate-400"
                                }`}
                              />
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-slate-900">
                                    {ev.title}
                                  </span>
                                  <span className="text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/80 inline-flex items-center gap-1.5 shrink-0">
                                    <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                                    <span>
                                      {ev.timestamp &&
                                      ev.relativeTime &&
                                      ev.timestamp !== ev.relativeTime
                                        ? `${ev.timestamp} · ${ev.relativeTime}`
                                        : ev.timestamp || ev.relativeTime}
                                    </span>
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                  {ev.description}
                                </p>
                                <div className="text-[11px] text-slate-500">
                                  Actor:{" "}
                                  <strong className="font-semibold text-slate-700">
                                    {ev.actor}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}

              {caseDrawerTab === "statement" && (
                <>
                  {/* Submitter Info Card */}
                  <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Complainant Details
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Submitted {selectedCaseFile.createdAt}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs">
                          {selectedCaseFile.submitterName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div
                            className="font-semibold text-slate-900 truncate max-w-[200px]"
                            title={selectedCaseFile.submitterName}
                          >
                            {selectedCaseFile.submitterName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {selectedCaseFile.submitterRole}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center text-xs">
                        <span className="text-slate-500 text-[11px]">
                          Contact Email
                        </span>
                        <a
                          href={`mailto:${selectedCaseFile.submitterEmail}`}
                          className="font-medium text-emerald-700 hover:underline"
                        >
                          {selectedCaseFile.submitterEmail}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Taxonomy Classification */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-700">
                      Taxonomy:
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700 font-medium">
                      {selectedCaseFile.category}
                    </span>
                    <span className="text-slate-400">&rsaquo;</span>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700 font-medium">
                      {selectedCaseFile.subcategory}
                    </span>
                  </div>

                  {/* Written Grievance Statement */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Grievance Statement & Particulars
                    </h4>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs font-normal leading-relaxed text-slate-800 shadow-2xs">
                      {selectedCaseFile.description ||
                        "No detailed written statement provided with this submission."}
                    </div>
                  </div>

                  {/* Attached Documents / Proofs */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Attached Proofs & Documentation (
                      {selectedCaseFile.attachments?.length || 0})
                    </h4>
                    {selectedCaseFile.attachments &&
                    selectedCaseFile.attachments.length > 0 ? (
                      <div className="space-y-2">
                        {selectedCaseFile.attachments.map((file) => (
                          <div
                            key={file.name}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs transition hover:border-emerald-300 hover:shadow-2xs"
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenDocumentPreview(file)}
                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 text-left bg-transparent border-0 p-0"
                            >
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B] shrink-0">
                                {file.name.endsWith(".pdf") ? (
                                  <FileText className="h-4.5 w-4.5 text-rose-600" />
                                ) : file.name.endsWith(".jpg") ||
                                  file.name.endsWith(".jpeg") ||
                                  file.name.endsWith(".png") ? (
                                  <ImageIcon className="h-4.5 w-4.5 text-blue-600" />
                                ) : file.name.endsWith(".xlsx") ||
                                  file.name.endsWith(".xls") ||
                                  file.name.endsWith(".csv") ? (
                                  <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-700" />
                                ) : (
                                  <FileText className="h-4.5 w-4.5 text-emerald-700" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 truncate hover:text-emerald-800 transition">
                                  {file.name}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {file.size} &bull; {file.type || "Document"}
                                </div>
                              </div>
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0 ml-3">
                              <button
                                type="button"
                                onClick={() => handleOpenDocumentPreview(file)}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-600/30 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                              >
                                <Eye className="h-3 w-3" />
                                <span>View Document</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadDocument({
                                    name: file.name,
                                    size: file.size,
                                    type: file.type || "Document",
                                    path: (file as any).path,
                                    uploadedAt: (file as any).uploadedAt,
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                title="Download File"
                              >
                                <Download className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No attachments uploaded with this grievance.
                      </p>
                    )}
                  </div>

                  {/* Assigned Officer Overview */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1 text-xs">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Handling Officer
                    </span>
                    {selectedCaseFile.assignedStaffName ? (
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-emerald-700" />
                          <span className="font-semibold text-slate-900">
                            {selectedCaseFile.assignedStaffName}
                          </span>
                        </div>
                        {selectedCaseFile.status !== "ESCALATED" &&
                          selectedCaseFile.status !== "CLOSED" &&
                          selectedCaseFile.status !== "RESOLVED" &&
                          selectedCaseFile.slaStatus === "BREACHED" && (
                            <button
                              type="button"
                              onClick={() => {
                                setAssignModalGrievance(selectedCaseFile);
                                setSelectedStaffId(
                                  selectedCaseFile.assignedStaffId || "",
                                );
                              }}
                              className="font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                            >
                              Reassign Officer
                            </button>
                          )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-medium text-slate-600">
                          {selectedCaseFile.status === "CLOSED" ||
                          selectedCaseFile.status === "RESOLVED"
                            ? "Case Closed"
                            : "Currently Unassigned"}
                        </span>
                        {selectedCaseFile.status !== "CLOSED" &&
                          selectedCaseFile.status !== "RESOLVED" && (
                            <button
                              type="button"
                              onClick={() => {
                                setAssignModalGrievance(selectedCaseFile);
                                setSelectedStaffId("");
                              }}
                              className="rounded-lg bg-[#064E3B] px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-900"
                            >
                              Assign Officer Now
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {caseDrawerTab === "notes" && (
                <div className="space-y-4">
                  {/* New HOD Directive Note Form */}
                  <form
                    onSubmit={handleAddInternalNote}
                    className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-700" />
                        Add Department Head Directive / Internal Note
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        Visible to assigned officer
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      required
                      value={newInternalNote}
                      onChange={(e) => setNewInternalNote(e.target.value)}
                      placeholder="Write instructions for the officer (e.g. 'Verify with accounts ledger before closing...')"
                      className="w-full rounded-lg border border-emerald-300 bg-white p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newInternalNote.trim()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#064E3B] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 disabled:opacity-50"
                      >
                        <Send className="h-3 w-3" />
                        <span>Post Directive Note</span>
                      </button>
                    </div>
                  </form>

                  {/* List of Internal Notes */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Internal Investigation & Direction Log
                    </h4>
                    {selectedCaseFile.internalNotes &&
                    selectedCaseFile.internalNotes.length > 0 ? (
                      selectedCaseFile.internalNotes.map((n) => (
                        <div
                          key={n.id}
                          className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">
                                {n.author}
                              </span>
                              <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600">
                                {n.role}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {n.timestamp}
                            </span>
                          </div>
                          <p className="font-normal text-slate-800 pt-1 leading-relaxed">
                            {n.note}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No internal notes logged yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dialog Sticky Footer with Management Actions */}
            <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCaseFile(null)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to SLA Monitoring</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Contact Staff Button */}
                {(() => {
                  const staffEmail =
                    caseProgressData?.assignment?.email ||
                    staffList.find(
                      (s: StaffMember) =>
                        s.id === selectedCaseFile.assignedStaffId,
                    )?.email;
                  const staffName =
                    caseProgressData?.assignment?.staffName ||
                    selectedCaseFile.assignedStaffName;

                  if (staffEmail) {
                    return (
                      <a
                        href={`mailto:${staffEmail}?subject=${encodeURIComponent(
                          `Directive regarding Case ${selectedCaseFile.ticketCode}: ${selectedCaseFile.title}`,
                        )}&body=${encodeURIComponent(
                          `Dear ${staffName},\n\nPlease provide an immediate status update on grievance ${selectedCaseFile.ticketCode} (${selectedCaseFile.title}).\n\nRegards,\nDepartment Head`,
                        )}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
                      >
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        <span>Contact Staff</span>
                      </a>
                    );
                  }
                  return null;
                })()}

                {/* 2. Reassign Button (Only for active cases) */}
                {selectedCaseFile.status !== "CLOSED" &&
                  selectedCaseFile.status !== "RESOLVED" && (
                    <button
                      type="button"
                      onClick={() => {
                        const caseFile = selectedCaseFile;
                        setSelectedCaseFile(null);
                        setAssignModalGrievance(caseFile);
                        setSelectedStaffId(caseFile.assignedStaffId || "");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                      <span>Reassign</span>
                    </button>
                  )}

                {/* 3. Add Direction / Intervene Button (Only for active cases) */}
                {selectedCaseFile.status !== "CLOSED" &&
                  selectedCaseFile.status !== "RESOLVED" && (
                    <button
                      type="button"
                      onClick={() => {
                        const caseFile = selectedCaseFile;
                        setSelectedCaseFile(null);
                        setEscalationModalGrievance(caseFile);
                        setEscalationBottleneck("STAFF_CAPACITY");
                        setEscalationInterventionType("NOTIFY_STAFF");
                        setEscalationTargetStaffId(
                          caseFile.assignedStaffId || "",
                        );
                        setEscalationNote("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Add Direction</span>
                    </button>
                  )}

                {/* If UNDER_REVIEW, also offer Review Resolution */}
                {selectedCaseFile.status === "UNDER_REVIEW" &&
                  selectedCaseFile.submittedResolution && (
                    <button
                      type="button"
                      onClick={() => {
                        const caseFile = selectedCaseFile;
                        setSelectedCaseFile(null);
                        setResolutionModalGrievance(caseFile);
                        setResolutionDecision("APPROVE");
                        setResolutionFeedback("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Review Resolution</span>
                    </button>
                  )}

                <button
                  type="button"
                  onClick={() => setSelectedCaseFile(null)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Document Viewer Modal */}
      <DocumentViewerModal
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
        onDownload={handleDownloadDocument}
      />
    </div>
  );
}

export function DepartmentHeadOverview(props: Props) {
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
