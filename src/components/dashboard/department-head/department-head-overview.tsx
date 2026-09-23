"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Flame,
  GitBranch,
  Inbox,
  Layers,
  LayoutDashboard,
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

export interface EscalationAuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  bottleneck?: string;
  details: string;
  stage: string;
}

export interface GrievanceItem {
  id: string;
  ticketCode: string;
  title: string;
  category: string;
  subcategory: string;
  submitterName: string;
  submitterRole: string;
  submitterEmail: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status:
    | "SUBMITTED"
    | "ROUTED"
    | "ASSIGNED"
    | "IN_PROGRESS"
    | "UNDER_REVIEW"
    | "REOPENED"
    | "ESCALATED"
    | "CLOSED";
  slaStatus: "ON_TRACK" | "AT_RISK" | "BREACHED";
  slaDeadline: string;
  slaTimeLeft: string;
  slaConsumptionPercent?: number;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  createdAt: string;
  isReopened?: boolean;
  reopenCount?: number;
  reopenReason?: string;
  isCrossDepartment?: boolean;
  collaboratingDepartments?: string[];
  escalationReason?: string;
  escalationLevel?: number;
  // 11-Step SLA Escalation & Resolution Lifecycle
  escalationStage?:
    | "SLA_THRESHOLD_REACHED"
    | "GRIEVANCE_ESCALATED"
    | "HOD_NOTIFIED"
    | "UNDER_REVIEW"
    | "BOTTLENECK_IDENTIFIED"
    | "INTERVENTION_TAKEN"
    | "AUDIT_LOGGED"
    | "STAFF_NOTIFIED"
    | "IN_PROGRESS"
    | "RESOLUTION_SUBMITTED"
    | "ESCALATION_CLEARED";
  identifiedBottleneck?: string;
  hodIntervention?: {
    actionType:
      | "MONITOR"
      | "NOTIFY_STAFF"
      | "REASSIGN"
      | "CROSS_DEPT"
      | "EXPEDITE"
      | "OVERRIDE"
      | "SLA_EXTENSION";
    actionLabel: string;
    note: string;
    intervenedAt: string;
    intervenedBy: string;
    targetStaffName?: string;
    targetDepartment?: string;
    newDeadline?: string;
  } | null;
  submittedResolution?: {
    staffName: string;
    note: string;
    submittedAt: string;
  } | null;
  auditTrail?: EscalationAuditRecord[];
  description?: string;
  attachments?: { name: string; size: string; type: string }[];
  internalNotes?: {
    id: string;
    author: string;
    role: string;
    timestamp: string;
    note: string;
  }[];
}

export interface StaffMember {
  id: string;
  name: string;
  designation: string;
  email: string;
  activeTickets: number;
  maxCapacity: number;
  status: "ACTIVE" | "ON_LEAVE" | "BUSY";
}

export const SLA_LIFECYCLE_STEPS = [
  {
    step: 1,
    key: "SLA_THRESHOLD_REACHED",
    title: "SLA Threshold Reached",
    desc: "Warning or breach deadline reached",
    icon: Clock,
  },
  {
    step: 2,
    key: "GRIEVANCE_ESCALATED",
    title: "Grievance Escalated",
    desc: "Status moves to Escalated, severity flagged",
    icon: AlertTriangle,
  },
  {
    step: 3,
    key: "HOD_NOTIFIED",
    title: "Department Head Notified",
    desc: "Urgent alert banner dispatched to HOD portal",
    icon: Bell,
  },
  {
    step: 4,
    key: "UNDER_REVIEW",
    title: "Head Reviews Grievance",
    desc: "HOD inspects details, timeline & history",
    icon: Search,
  },
  {
    step: 5,
    key: "BOTTLENECK_IDENTIFIED",
    title: "Identifies Bottleneck",
    desc: "Pinpoints root stall: staff, cross-dept, or docs",
    icon: Layers,
  },
  {
    step: 6,
    key: "INTERVENTION_TAKEN",
    title: "Takes Intervention Action",
    desc: "Reassigns, cross-dept, expedites, or overrides",
    icon: ShieldAlert,
  },
  {
    step: 7,
    key: "AUDIT_LOGGED",
    title: "Action Logged in Audit Trail",
    desc: "Immutable timestamped governance entry",
    icon: FileText,
  },
  {
    step: 8,
    key: "STAFF_NOTIFIED",
    title: "Staff / Dept Notified",
    desc: "Operational directives dispatched to team",
    icon: Send,
  },
  {
    step: 9,
    key: "IN_PROGRESS",
    title: "Grievance Continues",
    desc: "Investigation resumes under active intervention",
    icon: RefreshCw,
  },
  {
    step: 10,
    key: "RESOLUTION_SUBMITTED",
    title: "Resolution Submitted",
    desc: "Investigating officer submits solution note",
    icon: FileCheck,
  },
  {
    step: 11,
    key: "ESCALATION_CLEARED",
    title: "Escalation Cleared",
    desc: "HOD reviews, approves & closes grievance",
    icon: CheckCircle2,
  },
];

function formatAuditFeedDetails(rawDetails?: string | null): string | null {
  if (!rawDetails) return null;
  const str = String(rawDetails).trim();
  if (!str.startsWith("{")) return str;

  try {
    const parsed = JSON.parse(str);
    if (parsed && typeof parsed === "object") {
      if (parsed.consumptionPercent !== undefined) {
        const pct = Math.round(Number(parsed.consumptionPercent));
        const escalatedTo = parsed.escalatedTo
          ? ` to ${parsed.escalatedTo}`
          : "";
        return `Critical SLA breach (${pct}% consumed). Auto-escalated${escalatedTo} for intervention.`;
      }
      if (parsed.note) return String(parsed.note);
      if (parsed.remarks) return String(parsed.remarks);
      if (parsed.reason) return String(parsed.reason);
      return Object.entries(parsed)
        .filter(
          ([k, v]) =>
            typeof v !== "object" &&
            v !== null &&
            v !== undefined &&
            k !== "threshold",
        )
        .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").toLowerCase()}: ${v}`)
        .join(" • ");
    }
  } catch {
    // ignore parse error
  }
  return str;
}

interface Props {
  departmentName?: string;
  hodName?: string;
  hodEmail?: string;
  employeeCode?: string;
  isAdminPreview?: boolean;
}

export function DepartmentHeadOverview({
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
    | "MONITOR"
    | "NOTIFY_STAFF"
    | "REASSIGN"
    | "CROSS_DEPT"
    | "EXPEDITE"
    | "OVERRIDE"
    | "SLA_EXTENSION"
  >("MONITOR");
  const [escalationTargetStaffId, setEscalationTargetStaffId] = useState("");
  const [escalationTargetDept, setEscalationTargetDept] =
    useState("Finance & Accounts");
  const [escalationNote, setEscalationNote] = useState("");
  const [escalationAuditExpandedId, setEscalationAuditExpandedId] = useState<
    string | null
  >(null);

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
    "statement" | "notes" | "audit"
  >("statement");
  const [newInternalNote, setNewInternalNote] = useState("");

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

  // Metrics
  const unassignedCount = grievances.filter((g) => !g.assignedStaffId).length;
  const inProgressCount = grievances.filter(
    (g) => g.status === "IN_PROGRESS" || g.status === "ASSIGNED",
  ).length;
  const atRiskCount = grievances.filter(
    (g) => g.slaStatus === "AT_RISK" || g.slaStatus === "BREACHED",
  ).length;
  const escalatedCount = grievances.filter(
    (g) => g.status === "ESCALATED",
  ).length;
  const reopenedCount = grievances.filter(
    (g) => g.isReopened || g.status === "REOPENED",
  ).length;
  const crossDeptCount = grievances.filter((g) => g.isCrossDepartment).length;
  const resolutionReviewCount = grievances.filter(
    (g) => g.status === "UNDER_REVIEW",
  ).length;
  const highCriticalCount = grievances.filter(
    (g) => g.priority === "CRITICAL" || g.priority === "HIGH",
  ).length;

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
      g.slaStatus !== "AT_RISK" &&
      g.slaStatus !== "BREACHED"
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
  const handleEscalationSubmit = (e: React.FormEvent) => {
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
      MONITOR: "Continued Monitoring (75% SLA Risk Acknowledged by HOD)",
      NOTIFY_STAFF: `Direct Operational Nudge Dispatched to ${targetStaffName}`,
      REASSIGN: `Reassigned to ${targetStaffName}`,
      CROSS_DEPT: `Enlisted Supporting Department (${escalationTargetDept})`,
      EXPEDITE: "Expedited Priority (Fast-Track Override)",
      OVERRIDE: "Executive Directive / Direct HOD Guidance",
      SLA_EXTENSION: "Authorized Formal 48h SLA Extension",
    };

    const chosenBottleneck =
      bottleneckLabels[escalationBottleneck] || escalationBottleneck;
    const chosenAction =
      actionLabels[escalationInterventionType] || escalationInterventionType;

    const newAuditEntries: EscalationAuditRecord[] = [
      {
        id: `aud-${Date.now()}-5`,
        timestamp: "Just now",
        actor: `${currentHodName} (Department Head)`,
        action: "Step 5: Bottleneck Identified",
        bottleneck: chosenBottleneck,
        details: `Identified primary bottleneck stalling resolution: ${chosenBottleneck}.`,
        stage: "BOTTLENECK_IDENTIFIED",
      },
      {
        id: `aud-${Date.now()}-6`,
        timestamp: "Just now",
        actor: `${currentHodName} (Department Head)`,
        action: "Step 6: Intervention Action Taken",
        details: `Action: ${chosenAction}. Directive: "${escalationNote || "Proceed with expedited priority."}"`,
        stage: "INTERVENTION_TAKEN",
      },
      {
        id: `aud-${Date.now()}-7`,
        timestamp: "Just now",
        actor: "Governance Audit Engine",
        action: "Step 7: Action Logged in Audit Trail",
        details: `Immutable audit entry recorded for Department Head intervention under SLA protocol.`,
        stage: "AUDIT_LOGGED",
      },
      {
        id: `aud-${Date.now()}-8`,
        timestamp: "Just now",
        actor: "Notification Service",
        action: "Step 8: Staff / Supporting Dept Notified",
        details: `Operational directives dispatched to ${
          escalationInterventionType === "REASSIGN"
            ? targetStaffName
            : escalationInterventionType === "CROSS_DEPT"
              ? escalationTargetDept
              : targetStaffName
        }.`,
        stage: "STAFF_NOTIFIED",
      },
      {
        id: `aud-${Date.now()}-9`,
        timestamp: "Just now",
        actor: "Workflow Engine",
        action: "Step 9: Grievance Continues",
        details: `Status resumed as IN_PROGRESS under active intervention safeguards.`,
        stage: "IN_PROGRESS",
      },
    ];

    setGrievances((prev) =>
      prev.map((g) => {
        if (g.id !== escalationModalGrievance.id) return g;
        return {
          ...g,
          status: "IN_PROGRESS",
          slaStatus:
            escalationInterventionType === "EXPEDITE" ? "AT_RISK" : "ON_TRACK",
          priority:
            escalationInterventionType === "EXPEDITE" ? "CRITICAL" : g.priority,
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
    fetch(
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
    )
      .then(() => loadData(undefined, true))
      .catch((err) => console.error("Failed to persist intervention:", err));

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
        actor: `${currentHodName} (Department Head)`,
        action: "Step 11: Escalation Cleared & Grievance Closed",
        details: `Department Head approved final resolution. Escalation cleared, SLA compliance archived, grievance marked CLOSED.`,
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
        `Step 11 Complete: Resolution approved & Escalation Cleared for ${resolutionModalGrievance.ticketCode}. Ticket is now officially CLOSED.`,
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
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* TOP VIEW SWITCHER TABS (Eliminates empty gaps & syncs with sidebar)        */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => switchView("overview")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition shadow-2xs ${
              activeView === "overview"
                ? "bg-[#064E3B] text-white shadow-sm shadow-emerald-950/20"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Department Overview</span>
          </button>

          <button
            type="button"
            onClick={() => switchView("queue")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition shadow-2xs ${
              activeView === "queue"
                ? "bg-[#064E3B] text-white shadow-sm shadow-emerald-950/20"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Inbox className="h-4 w-4" />
            <span>Grievance Queue</span>
            <span
              className={`rounded-full px-2 py-0.2 text-[10px] ${
                activeView === "queue"
                  ? "bg-white/20 text-white"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {unassignedCount} New
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchView("staff")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition shadow-2xs ${
              activeView === "staff"
                ? "bg-[#064E3B] text-white shadow-sm shadow-emerald-950/20"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Staff Workload</span>
            <span
              className={`rounded-full px-2 py-0.2 text-[10px] ${
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
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition shadow-2xs ${
              activeView === "sla"
                ? "bg-[#064E3B] text-white shadow-sm shadow-emerald-950/20"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>SLA & Escalations</span>
            {(atRiskCount > 0 || escalatedCount > 0) && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] text-white font-bold">
                {atRiskCount + escalatedCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableDepartments.length > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
              <Building2 className="h-3.5 w-3.5 text-emerald-700" />
              <span className="font-semibold text-slate-500">Dept:</span>
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  loadData(e.target.value);
                }}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
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
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isRefreshing ? "animate-spin text-emerald-700" : ""
              }`}
            />
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: OVERVIEW (Balanced 2-column layout with zero empty gaps)          */}
      {/* ========================================================================= */}
      {activeView === "overview" && (
        <div className="space-y-6">
          {/* Department Header Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-[#064E3B] via-[#043629] to-slate-950 p-6 text-white shadow-md">
            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                  <Building2 className="h-6 w-6 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                      {currentDepartmentName}
                    </h2>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
                      Primary Queue
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-normal text-slate-300">
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => switchView("queue")}
                  className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-slate-100 transition"
                >
                  Manage Full Queue ({grievances.length}) &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* 4 Primary KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Requires Triage"
              value={unassignedCount}
              icon={Inbox}
              accentColor="amber"
              description="Awaiting staff dispatch"
              trend={{
                value: `${unassignedCount} Unassigned`,
                isPositive: unassignedCount === 0,
              }}
            />
            <StatCard
              label="Active In-Progress"
              value={inProgressCount}
              icon={Clock}
              accentColor="blue"
              description="Investigating or under action"
              trend={{
                value: `${activeStaffCount} Officers Active`,
                isPositive: true,
              }}
            />
            <StatCard
              label="SLA At Risk / Breached"
              value={atRiskCount}
              icon={AlertTriangle}
              accentColor="rose"
              description={`${escalatedCount} escalated tickets`}
              trend={{
                value: `${escalatedCount} Escalated`,
                isPositive: false,
              }}
            />
            <StatCard
              label="Exceptions & Reviews"
              value={reopenedCount + crossDeptCount + resolutionReviewCount}
              icon={RotateCcw}
              accentColor="purple"
              description={`${reopenedCount} reopened, ${crossDeptCount} cross-dept`}
              trend={{
                value: `${resolutionReviewCount} Pending Review`,
                isPositive: true,
              }}
            />
          </div>

          {/* Active Escalation Alert Banner (Step 3: Department Head Notified) */}
          {escalatedCount > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-rose-300 bg-gradient-to-r from-rose-50 via-rose-100/60 to-amber-50 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                      Immediate Head Action Required
                    </span>
                    <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      {escalatedCount} Escalated
                    </span>
                  </div>
                  <p className="text-xs font-normal text-rose-950 mt-0.5">
                    Critical SLA threshold breached on{" "}
                    <strong>
                      {grievances.find((g) => g.status === "ESCALATED")
                        ?.ticketCode || "department grievance"}
                    </strong>
                    . Automated escalation requires your direct bottleneck
                    review and intervention.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => switchView("sla")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-800 transition"
                >
                  <span>Review Escalation & Intervene</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Balanced Overview Grid matching Admin Dashboard reference layout */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left 2 Columns: Priority Triage & Department Grievances Stream */}
            <div className="space-y-6 lg:col-span-2">
              {/* Card 1: Priority Triage & Urgent Queue */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Priority Triage & Urgent Queue
                    </h3>
                    <p className="text-xs font-normal text-slate-500">
                      Unassigned and high-priority tickets requiring immediate
                      attention
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchView("queue")}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    View All ({grievances.length}) &rarr;
                  </button>
                </div>

                <div className="mt-3.5 space-y-3">
                  {(() => {
                    const urgentList = grievances.filter(
                      (g) =>
                        !g.assignedStaffId ||
                        g.priority === "CRITICAL" ||
                        g.status === "ESCALATED",
                    );

                    if (urgentList.length === 0) {
                      return (
                        <div className="py-8 text-center text-sm font-normal text-slate-400">
                          <Inbox className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-700 text-xs">
                            No grievances require triage
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            All incoming grievances are currently assigned or
                            being processed.
                          </p>
                        </div>
                      );
                    }

                    return urgentList.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2 hover:border-emerald-300 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                              {item.ticketCode}
                            </span>
                            <PriorityBadge priority={item.priority} />
                            <StatusBadge status={item.status} />
                          </div>
                          <span className="text-xs font-semibold text-rose-600">
                            {item.slaTimeLeft}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCaseFile(item);
                              setCaseDrawerTab("statement");
                            }}
                            className="text-left hover:text-emerald-800 transition flex items-center gap-1.5 group truncate"
                            title="Click to inspect full case file"
                          >
                            <span>{item.title}</span>
                            <Eye className="h-3 w-3 text-slate-400 group-hover:text-emerald-700 transition" />
                          </button>
                        </h4>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <span>Submitter: {item.submitterName}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCaseFile(item);
                                setCaseDrawerTab("statement");
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs text-[11px]"
                            >
                              <Eye className="h-3 w-3 text-slate-500" />
                              <span>Inspect</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAssignModalGrievance(item);
                                setSelectedStaffId(item.assignedStaffId || "");
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#064E3B] px-2.5 py-1 font-semibold text-white hover:bg-emerald-900 transition text-[11px]"
                            >
                              <UserPlus className="h-3 w-3" />
                              <span>
                                {item.assignedStaffName ? "Reassign" : "Assign"}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Card 2: Recent Department Grievances Table (Matches Admin Reference Page) */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Recent Grievances Stream
                    </h3>
                    <p className="text-xs font-normal text-slate-500">
                      Active cases, officer assignments & resolution status
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchView("queue")}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    <span>View All Tickets</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-2.5 pl-3 pr-2">Ticket</th>
                        <th className="px-3 py-2.5">Category</th>
                        <th className="px-3 py-2.5">Assigned Officer</th>
                        <th className="px-3 py-2.5">Priority</th>
                        <th className="py-2.5 pl-2 pr-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-normal">
                      {grievances.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-6 text-center text-slate-400 font-normal"
                          >
                            No grievances registered in this department queue
                            yet.
                          </td>
                        </tr>
                      ) : (
                        grievances.slice(0, 5).map((g) => (
                          <tr
                            key={g.id}
                            className="hover:bg-slate-50/60 transition cursor-pointer"
                            onClick={() => {
                              setSelectedCaseFile(g);
                              setCaseDrawerTab("statement");
                            }}
                          >
                            <td className="whitespace-nowrap py-3 pl-3 pr-2 font-mono font-medium text-slate-900">
                              {g.ticketCode}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 font-normal text-slate-800">
                              {g.category}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                              {g.assignedStaffName || (
                                <span className="italic text-amber-600 font-normal">
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3">
                              <PriorityBadge priority={g.priority} />
                            </td>
                            <td className="whitespace-nowrap py-3 pl-2 pr-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {g.slaConsumptionPercent !== undefined && (
                                  <span
                                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                      g.slaConsumptionPercent >= 100
                                        ? "bg-rose-100 text-rose-800"
                                        : g.slaConsumptionPercent >= 75
                                          ? "bg-amber-100 text-amber-800"
                                          : g.slaConsumptionPercent >= 50
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-emerald-100 text-emerald-800"
                                    }`}
                                    title={`${g.slaConsumptionPercent}% SLA consumed`}
                                  >
                                    {g.slaConsumptionPercent}% SLA
                                  </span>
                                )}
                                <StatusBadge status={g.status} />
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Staff Capacity + Governance Engine Audit (1 Col on lg) */}
            <div className="space-y-6 lg:col-span-1">
              {/* Staff Snapshot */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-800" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Team Capacity ({staffList.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchView("staff")}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    Full Roster &rarr;
                  </button>
                </div>

                <div className="mt-3.5 space-y-2.5">
                  {staffList.slice(0, 4).map((staff) => {
                    const pct = Math.round(
                      (staff.activeTickets / staff.maxCapacity) * 100,
                    );
                    return (
                      <div
                        key={staff.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900">
                            {staff.name}
                          </span>
                          <span className="text-slate-600 font-medium">
                            {staff.activeTickets}/{staff.maxCapacity} tickets
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              staff.status === "ON_LEAVE"
                                ? "bg-slate-400"
                                : pct >= 80
                                  ? "bg-amber-500"
                                  : "bg-emerald-600"
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Automated Governance Feed */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Governance Engine Audit
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Live Stream
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  {governanceAuditFeed.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 font-normal">
                      No governance audit events recorded yet.
                    </div>
                  ) : (
                    governanceAuditFeed.slice(0, 4).map((feed) => {
                      const isSlaEngineAction =
                        feed.action.includes("SLA") ||
                        feed.action.includes("Auto-");
                      const displayActor =
                        isSlaEngineAction &&
                        feed.actor.includes("DEPARTMENT_HEAD")
                          ? "SLA Governance Engine (Automated)"
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
                          className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 space-y-1 hover:border-emerald-200 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">
                              {displayActor}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {feed.timestamp}
                            </span>
                          </div>
                          <p className="text-slate-700 font-normal">
                            {displayAction}
                          </p>
                          {cleanDetails && (
                            <p className="text-[11px] text-slate-500 font-normal italic">
                              {cleanDetails}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 text-right">
                  <button
                    type="button"
                    onClick={() => switchView("queue")}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    View Full Audit &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: GRIEVANCE QUEUE (Full-width, zero empty space)                    */}
      {/* ========================================================================= */}
      {activeView === "queue" && (
        <div className="space-y-4">
          {/* Queue Filter Controls Bar */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3.5">
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
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                All ({grievances.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("UNASSIGNED")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "UNASSIGNED"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Unassigned ({unassignedCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("IN_PROGRESS")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "IN_PROGRESS"
                    ? "bg-[#064E3B] text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                In Progress ({inProgressCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("HIGH_CRITICAL")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "HIGH_CRITICAL"
                    ? "bg-rose-700 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Flame className="h-3 w-3" />
                <span>High & Critical ({highCriticalCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("AT_RISK")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "AT_RISK"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                SLA Alerts ({atRiskCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("ESCALATED")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "ESCALATED"
                    ? "bg-rose-900 text-white shadow-xs"
                    : "text-rose-700 bg-rose-50 hover:bg-rose-100"
                }`}
              >
                <AlertCircle className="h-3 w-3" />
                <span>Escalated ({escalatedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("REOPENED")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "REOPENED"
                    ? "bg-purple-700 text-white shadow-xs"
                    : "text-purple-700 bg-purple-50 hover:bg-purple-100"
                }`}
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reopened ({reopenedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("CROSS_DEPT")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "CROSS_DEPT"
                    ? "bg-sky-700 text-white shadow-xs"
                    : "text-sky-700 bg-sky-50 hover:bg-sky-100"
                }`}
              >
                <GitBranch className="h-3 w-3" />
                <span>Cross-Dept ({crossDeptCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("RESOLUTION_REVIEW")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTab === "RESOLUTION_REVIEW"
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                }`}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Resolution Review ({resolutionReviewCount})</span>
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

          {/* Full-width Grievance Cards Grid */}
          <div className="space-y-3">
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
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs transition hover:border-emerald-300 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200/80">
                          {item.ticketCode}
                        </span>
                        <PriorityBadge priority={item.priority} />
                        <StatusBadge status={item.status} />

                        {item.slaStatus === "BREACHED" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                            <AlertCircle className="h-3 w-3 text-rose-600" />
                            SLA Breached
                          </span>
                        )}
                        {item.slaStatus === "AT_RISK" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            <Clock className="h-3 w-3 text-amber-600" />
                            SLA At Risk
                          </span>
                        )}
                        {item.isReopened && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-purple-300 bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                            <RotateCcw className="h-3 w-3 text-purple-600" />
                            Reopened ({item.reopenCount}x)
                          </span>
                        )}
                        {item.isCrossDepartment && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                            <GitBranch className="h-3 w-3 text-sky-600" />
                            Cross-Dept
                          </span>
                        )}
                      </div>

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
                        <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-2.5 text-xs text-purple-900">
                          <span className="font-semibold">Reopen Reason: </span>
                          <span className="font-normal">
                            {item.reopenReason}
                          </span>
                        </div>
                      )}

                      {item.isCrossDepartment &&
                        item.collaboratingDepartments && (
                          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-2 text-xs text-sky-900 flex items-center gap-2">
                            <span className="font-semibold">
                              Joint Ownership:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {item.collaboratingDepartments.map((dept) => (
                                <span
                                  key={dept}
                                  className="rounded bg-white border border-sky-200 px-2 py-0.5 text-[11px] font-medium text-sky-800"
                                >
                                  {dept}
                                </span>
                              ))}
                            </div>
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

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-normal text-slate-500">
                        <span>
                          <strong className="font-medium text-slate-700">
                            Category:
                          </strong>{" "}
                          {item.category} &rsaquo; {item.subcategory}
                        </span>
                        <span>&bull;</span>
                        <span>
                          <strong className="font-medium text-slate-700">
                            Submitter:
                          </strong>{" "}
                          {item.submitterName} ({item.submitterRole})
                        </span>
                        <span>&bull;</span>
                        <span>
                          <strong className="font-medium text-slate-700">
                            Assigned Officer:
                          </strong>{" "}
                          {item.assignedStaffName ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                              <User className="h-3 w-3 text-emerald-700" />
                              {item.assignedStaffName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                              Unassigned
                            </span>
                          )}
                        </span>
                        <span>&bull;</span>
                        <span>Submitted {item.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2.5 shrink-0 border-t border-slate-100 pt-2.5 sm:border-none sm:pt-0">
                      <div className="text-left sm:text-right">
                        <div className="text-[11px] font-normal text-slate-500">
                          Target SLA
                        </div>
                        <div
                          className={`text-xs font-semibold ${item.slaStatus === "BREACHED" ? "text-rose-600" : item.slaStatus === "AT_RISK" ? "text-amber-600" : "text-slate-700"}`}
                        >
                          {item.slaTimeLeft}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCaseFile(item);
                            setCaseDrawerTab("statement");
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
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-800 transition"
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
                            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-rose-700 transition"
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>Take Escalation Action</span>
                          </button>
                        )}

                        {item.assignedStaffName ? (
                          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                            <UserCheck className="h-3.5 w-3.5 text-emerald-800" />
                            <span className="font-medium">
                              {item.assignedStaffName}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAssignModalGrievance(item);
                                setSelectedStaffId(item.assignedStaffId || "");
                              }}
                              className="ml-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
                            >
                              Reassign
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAssignModalGrievance(item);
                              setSelectedStaffId("");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-700"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Assign Staff</span>
                          </button>
                        )}
                      </div>
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
              accentColor="blue"
              description={`${onLeaveStaffCount} officer(s) on approved leave`}
            />
            <StatCard
              label="Active Assigned Queue"
              value={`${totalActiveTickets} Tickets`}
              icon={Inbox}
              accentColor="amber"
              description={`Across ${activeStaffCount} active officers`}
            />
            <StatCard
              label="Department Load Factor"
              value={`${Math.round((totalActiveTickets / totalStaffCapacity) * 100)}%`}
              icon={Layers}
              accentColor="purple"
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
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-base font-bold text-[#064E3B]">
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900">
                              {staff.name}
                            </h4>
                            <p className="text-xs font-normal text-slate-500">
                              {staff.designation}
                            </p>
                            <p className="text-[11px] font-normal text-slate-400 truncate max-w-[180px]">
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
                                      setCaseDrawerTab("statement");
                                    }}
                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-white hover:border-emerald-300 transition"
                                    title="Inspect full case file, statements & attachments"
                                  >
                                    <Eye className="h-3 w-3 text-slate-500" />
                                    <span>Inspect</span>
                                  </button>
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
              accentColor="rose"
              description="Exceeded maximum SLA duration"
            />
            <StatCard
              label="SLA At Risk"
              value={grievances.filter((g) => g.slaStatus === "AT_RISK").length}
              icon={Clock}
              accentColor="amber"
              description="Approaching deadline threshold"
            />
            <StatCard
              label="Active Escalations"
              value={escalatedCount}
              icon={Flame}
              accentColor="rose"
              description="Requires Department Head action"
            />
            <StatCard
              label="Reopened Tickets"
              value={reopenedCount}
              icon={RotateCcw}
              accentColor="purple"
              description="Submitters contesting resolution"
            />
          </div>

          {/* ========================================================================= */}
          {/* SLA & ESCALATIONS QUEUE                                                   */}
          {/* ========================================================================= */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600" />
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
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
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

            {/* List of Grievances */}
            <div className="space-y-4">
              {grievances
                .filter((g) => {
                  return (
                    g.status === "ESCALATED" ||
                    g.hodIntervention ||
                    g.status === "UNDER_REVIEW" ||
                    g.slaStatus === "BREACHED"
                  );
                })
                .map((item) => {
                  const isAuditExpanded = escalationAuditExpandedId === item.id;
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
                      className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-5 shadow-xs hover:border-emerald-300 transition space-y-4"
                    >
                      {/* Ticket Header & Status Pill */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/70 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300">
                            {item.ticketCode}
                          </span>
                          <PriorityBadge priority={item.priority} />
                          <StatusBadge status={item.status} />

                          {/* Current Operational Status Indicator */}
                          {isEscalated && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                              <Bell className="h-3.5 w-3.5 text-rose-600" />
                              Escalated to Head
                            </span>
                          )}
                          {isUnderIntervention && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
                              Under Intervention
                            </span>
                          )}
                          {isResolutionReady && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                              <FileCheck className="h-3.5 w-3.5 text-sky-600" />
                              Resolution Pending Review
                            </span>
                          )}
                          {isCleared && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              Escalation Cleared
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-semibold text-rose-600">
                            {item.slaTimeLeft}
                          </span>
                        </div>
                      </div>

                      {/* Ticket Title & Metadata */}
                      <div className="space-y-1">
                        <h4 className="text-base font-semibold text-slate-900">
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
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-normal text-slate-500">
                          <span>
                            <strong className="font-medium text-slate-700">
                              Category:
                            </strong>{" "}
                            {item.category} &rsaquo; {item.subcategory}
                          </span>
                          <span>&bull;</span>
                          <span>
                            <strong className="font-medium text-slate-700">
                              Submitter:
                            </strong>{" "}
                            {item.submitterName} ({item.submitterRole})
                          </span>
                          <span>&bull;</span>
                          <span>
                            <strong className="font-medium text-slate-700">
                              Assigned Officer:
                            </strong>{" "}
                            {item.assignedStaffName || "Unassigned"}
                          </span>
                        </div>
                      </div>

                      {/* Escalation Reason */}
                      <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-950 space-y-1">
                        <div className="font-semibold text-rose-900">
                          Escalation Context:
                        </div>
                        <p className="font-normal">
                          {item.escalationReason ||
                            "Resolution duration breached SLA threshold without closure."}
                        </p>
                      </div>

                      {/* HOD Intervention Details */}
                      {item.hodIntervention && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 space-y-1.5">
                          <div className="flex items-center justify-between font-semibold text-emerald-900">
                            <span>Department Head Intervention Directive</span>
                            <span className="text-[11px] font-normal">
                              {item.hodIntervention.intervenedAt}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-semibold text-slate-700">
                                Identified Bottleneck:{" "}
                              </span>
                              <span className="font-normal text-slate-900">
                                {item.identifiedBottleneck}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">
                                Intervention Action:{" "}
                              </span>
                              <span className="font-normal text-slate-900">
                                {item.hodIntervention.actionLabel}
                              </span>
                            </div>
                          </div>
                          {item.hodIntervention.note && (
                            <p className="font-normal text-slate-700 pt-1">
                              <strong>HOD Directive:</strong> &ldquo;
                              {item.hodIntervention.note}&rdquo;
                            </p>
                          )}
                        </div>
                      )}

                      {/* Submitted Resolution */}
                      {item.submittedResolution && (
                        <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-xs text-sky-950 space-y-1.5">
                          <div className="flex items-center justify-between font-semibold text-sky-900">
                            <span>Resolution Submitted for Head Approval</span>
                            <span className="text-[11px] font-normal">
                              {item.submittedResolution.submittedAt}
                            </span>
                          </div>
                          <p className="font-normal text-slate-800">
                            {item.submittedResolution.note}
                          </p>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-200/70 gap-2">
                        {/* Audit Trail Toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            setEscalationAuditExpandedId(
                              isAuditExpanded ? null : item.id,
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>
                            {isAuditExpanded
                              ? "Hide Audit Trail"
                              : `View Full Audit Trail (${item.auditTrail?.length || 0} events)`}
                          </span>
                        </button>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCaseFile(item);
                              setCaseDrawerTab("statement");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>Inspect Case File</span>
                          </button>
                          {isEscalated && (
                            <button
                              type="button"
                              onClick={() => {
                                setEscalationModalGrievance(item);
                                setEscalationBottleneck("STAFF_CAPACITY");
                                setEscalationInterventionType("REASSIGN");
                                setEscalationTargetStaffId("");
                                setEscalationNote("");
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-800 transition"
                            >
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>Intervene & Reassign &rarr;</span>
                            </button>
                          )}

                          {isUnderIntervention && (
                            <button
                              type="button"
                              onClick={() => handleSimulateResolution(item.id)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-sky-800 transition"
                            >
                              <FileCheck className="h-3.5 w-3.5" />
                              <span>Simulate Staff Resolution &rarr;</span>
                            </button>
                          )}

                          {isResolutionReady && (
                            <button
                              type="button"
                              onClick={() => {
                                setResolutionModalGrievance(item);
                                setResolutionDecision("APPROVE");
                                setResolutionFeedback("");
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>
                                Review Resolution & Clear Escalation &rarr;
                              </span>
                            </button>
                          )}

                          {isCleared && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-300">
                              <Check className="h-4 w-4 text-emerald-600" />
                              Escalation Cleared & Closed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expandable Audit Trail Drawer */}
                      {isAuditExpanded && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                              Immutable Governance Audit Trail &bull;{" "}
                              {item.ticketCode}
                            </h5>
                            <span className="text-[10px] text-slate-400">
                              Chronological Lifecycle Log
                            </span>
                          </div>

                          <div className="space-y-2">
                            {item.auditTrail && item.auditTrail.length > 0 ? (
                              item.auditTrail.map((log, idx) => (
                                <div
                                  key={log.id || idx}
                                  className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-xs"
                                >
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-[#064E3B]">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 space-y-0.5">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-slate-900">
                                        {log.action}
                                      </span>
                                      <span className="text-[10px] text-slate-400">
                                        {log.timestamp}
                                      </span>
                                    </div>
                                    <p className="text-slate-600 font-normal">
                                      {log.details}
                                    </p>
                                    <div className="text-[10px] text-slate-500">
                                      <span>
                                        Actor:{" "}
                                        <strong className="font-medium text-slate-700">
                                          {log.actor}
                                        </strong>
                                      </span>
                                      {log.bottleneck && (
                                        <span>
                                          {" "}
                                          &bull; Bottleneck:{" "}
                                          <strong>{log.bottleneck}</strong>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic">
                                No audit records logged yet.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: ASSIGNMENT, STEP 4-6 ESCALATION INTERVENTION, STEP 11 RESOLUTION   */}
      {/* ========================================================================= */}
      {assignModalGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    SLA Escalation Intervention & Governance Directives
                  </h3>
                  <p className="text-xs font-normal text-slate-500">
                    Ticket{" "}
                    <span className="font-mono font-semibold text-rose-700">
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

            <form onSubmit={handleEscalationSubmit} className="mt-4 space-y-4">
              {/* Grievance Context & SLA Breach Details */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-900">
                    {escalationModalGrievance.title}
                  </span>
                  <PriorityBadge priority={escalationModalGrievance.priority} />
                </div>
                <p className="text-rose-950 font-normal">
                  <strong>Breach Context:</strong>{" "}
                  {escalationModalGrievance.escalationReason ||
                    "Exceeded SLA resolution deadline without update."}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-600 border-t border-rose-200/60">
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
                        ? "border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-600"
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
                        ? "border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-600"
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
                        ? "border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-600"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    📁 Incomplete Documentation
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                      Awaiting original bills or vouchers from citizen
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEscalationBottleneck("COMPLEX_INVESTIGATION")
                    }
                    className={`rounded-xl border p-2.5 text-left text-xs transition ${
                      escalationBottleneck === "COMPLEX_INVESTIGATION"
                        ? "border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-600"
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
                        ? "border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-600"
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
                        ? "border-amber-600 bg-amber-50 text-amber-950 font-semibold ring-1 ring-amber-600"
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
                    onClick={() => setEscalationInterventionType("CROSS_DEPT")}
                    className={`rounded-xl border p-2.5 text-left text-xs transition ${
                      escalationInterventionType === "CROSS_DEPT"
                        ? "border-rose-700 bg-rose-50 text-rose-950 font-semibold ring-1 ring-rose-600"
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
                        ? "border-rose-700 bg-rose-50 text-rose-950 font-semibold ring-1 ring-rose-600"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    🔄 Reassign to Available Officer
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                      Transfer ticket to an active officer with spare capacity
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEscalationInterventionType("EXPEDITE")}
                    className={`rounded-xl border p-2.5 text-left text-xs transition ${
                      escalationInterventionType === "EXPEDITE"
                        ? "border-rose-700 bg-rose-50 text-rose-950 font-semibold ring-1 ring-rose-600"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    🚀 Expedite Priority (Fast-Track)
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                      Bump to CRITICAL with 24-hr expedited SLA deadline
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEscalationInterventionType("OVERRIDE")}
                    className={`rounded-xl border p-2.5 text-left text-xs transition ${
                      escalationInterventionType === "OVERRIDE"
                        ? "border-rose-700 bg-rose-50 text-rose-950 font-semibold ring-1 ring-rose-600"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    🛡️ Executive Override / Guidance
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                      Issue mandatory operational directive to officer
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEscalationInterventionType("SLA_EXTENSION")
                    }
                    className={`rounded-xl border p-2.5 text-left text-xs transition col-span-1 sm:col-span-2 ${
                      escalationInterventionType === "SLA_EXTENSION"
                        ? "border-rose-700 bg-rose-50 text-rose-950 font-semibold ring-1 ring-rose-600"
                        : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    ⏱️ Authorize Formal 48h SLA Extension
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                      Grant approved extension with recorded justification
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
                    onChange={(e) => setEscalationTargetStaffId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="">-- Choose an Available Officer --</option>
                    {staffList.map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                        disabled={s.status === "ON_LEAVE"}
                      >
                        {s.name} ({s.designation}) &bull; {s.activeTickets}/
                        {s.maxCapacity} tickets{" "}
                        {s.status === "ON_LEAVE" ? "[ON LEAVE]" : "[AVAILABLE]"}
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

              {/* Action Directive & Justification Note (Steps 7 & 8) */}
              <div>
                <label
                  htmlFor="escalation-action-note"
                  className="block text-xs font-semibold text-slate-900 mb-1.5"
                >
                  Action Directive & Justification (Logged to Audit Trail){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="escalation-action-note"
                  required
                  rows={3}
                  value={escalationNote}
                  onChange={(e) => setEscalationNote(e.target.value)}
                  placeholder="Explain the operational bottleneck resolved and specific directives given to staff..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:border-rose-600 focus:outline-hidden"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">
                  Directive is logged to the audit trail and dispatched to the
                  assigned officer.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEscalationModalGrievance(null)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      escalationInterventionType === "REASSIGN" &&
                      !escalationTargetStaffId
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-800 transition disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Confirm & Execute Directive &rarr;</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
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
                        ? "border-amber-600 bg-amber-50 text-amber-900 font-semibold ring-1 ring-amber-600"
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
                      : "bg-amber-600 hover:bg-amber-700"
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
          <div className="w-full max-w-2xl rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
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
                    <span className="font-semibold text-amber-700">
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
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
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
                          <span className="text-xs font-semibold text-rose-600">
                            {item.slaTimeLeft}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCaseFile(item);
                              setCaseDrawerTab("statement");
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
                    className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
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
      {/* CASE FILE INSPECTION DRAWER (Slide-over Full Review)                      */}
      {/* ========================================================================= */}
      {selectedCaseFile && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 bg-slate-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#064E3B] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    {selectedCaseFile.ticketCode}
                  </span>
                  <PriorityBadge priority={selectedCaseFile.priority} />
                  <StatusBadge status={selectedCaseFile.status} />
                </div>
                <h3 className="text-base font-semibold text-slate-900 leading-snug line-clamp-1">
                  {selectedCaseFile.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseFile(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                title="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* SLA Bar Indicator */}
            <div
              className={`px-6 py-2 text-xs flex items-center justify-between border-b ${
                selectedCaseFile.slaStatus === "BREACHED"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : selectedCaseFile.slaStatus === "AT_RISK"
                    ? "bg-amber-50 border-amber-200 text-amber-800"
                    : "bg-slate-100/70 border-slate-200 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  SLA Target: <strong>{selectedCaseFile.slaDeadline}</strong>
                </span>
              </div>
              <span className="font-semibold">
                {selectedCaseFile.slaTimeLeft}
              </span>
            </div>

            {/* Navigation Tabs inside Drawer */}
            <div className="flex items-center border-b border-slate-200 px-6 bg-white gap-6 text-xs font-semibold">
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
              <button
                type="button"
                onClick={() => setCaseDrawerTab("audit")}
                className={`py-3 border-b-2 transition inline-flex items-center gap-1.5 ${
                  caseDrawerTab === "audit"
                    ? "border-[#064E3B] text-[#064E3B]"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <span>Audit Trail</span>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
                  {selectedCaseFile.auditTrail?.length || 0}
                </span>
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
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
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs">
                          {selectedCaseFile.submitterName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
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
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs transition hover:border-emerald-300"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B]">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">
                                  {file.name}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {file.size} &bull; {file.type}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActionSuccessMessage(
                                  `Downloaded attachment: ${file.name}`,
                                );
                                setTimeout(
                                  () => setActionSuccessMessage(null),
                                  3000,
                                );
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              <Download className="h-3 w-3" />
                              <span>View / Download</span>
                            </button>
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
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-medium text-amber-700">
                          Currently Unassigned
                        </span>
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

              {caseDrawerTab === "audit" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Chronological Audit Trail & Governance Log
                  </h4>
                  {selectedCaseFile.auditTrail &&
                  selectedCaseFile.auditTrail.length > 0 ? (
                    <div className="space-y-2.5">
                      {selectedCaseFile.auditTrail.map((log, idx) => (
                        <div
                          key={log.id || idx}
                          className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs"
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-[#064E3B]">
                            {idx + 1}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">
                                {log.action}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {log.timestamp}
                              </span>
                            </div>
                            <p className="text-slate-600 font-normal leading-relaxed">
                              {log.details}
                            </p>
                            <div className="text-[10px] text-slate-500">
                              <span>
                                Actor:{" "}
                                <strong className="font-medium text-slate-700">
                                  {log.actor}
                                </strong>
                              </span>
                              {log.bottleneck && (
                                <span>
                                  {" "}
                                  &bull; Bottleneck:{" "}
                                  <strong>{log.bottleneck}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      No audit records recorded yet.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Sticky Footer with Quick Actions */}
            <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-normal text-slate-500">
                Status:{" "}
                <strong className="text-slate-800">
                  {selectedCaseFile.status}
                </strong>
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {!selectedCaseFile.assignedStaffId && (
                  <button
                    type="button"
                    onClick={() => {
                      setAssignModalGrievance(selectedCaseFile);
                      setSelectedStaffId("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Assign Officer &rarr;</span>
                  </button>
                )}

                {selectedCaseFile.status === "ESCALATED" && (
                  <button
                    type="button"
                    onClick={() => {
                      setEscalationModalGrievance(selectedCaseFile);
                      setEscalationBottleneck("STAFF_CAPACITY");
                      setEscalationInterventionType("REASSIGN");
                      setEscalationTargetStaffId("");
                      setEscalationNote("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-800 transition"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Intervene & Reassign &rarr;</span>
                  </button>
                )}

                {selectedCaseFile.status === "UNDER_REVIEW" &&
                  selectedCaseFile.submittedResolution && (
                    <button
                      type="button"
                      onClick={() => {
                        setResolutionModalGrievance(selectedCaseFile);
                        setResolutionDecision("APPROVE");
                        setResolutionFeedback("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 transition"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Review Resolution &rarr;</span>
                    </button>
                  )}

                <button
                  type="button"
                  onClick={() => setSelectedCaseFile(null)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Close File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
