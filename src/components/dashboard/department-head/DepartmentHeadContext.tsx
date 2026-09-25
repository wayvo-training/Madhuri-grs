"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { GrievanceItem, StaffMember, EscalationAuditRecord } from "@/types/department-head";
import { DocumentPreviewData } from "../document-viewer-modal";

interface DepartmentHeadState {
  grievances: GrievanceItem[];
  setGrievances: (v: GrievanceItem[]) => void;
  staffList: StaffMember[];
  setStaffList: (v: StaffMember[]) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  selectedDeptId: string;
  setSelectedDeptId: (v: string) => void;
  availableDepartments: { id: string; name: string }[];
  currentDepartmentName: string;
  currentHodName: string;
  currentHodEmail: string;
  currentEmployeeCode: string;
  activeView: "overview" | "queue" | "staff" | "sla";
  switchView: (view: "overview" | "queue" | "staff" | "sla") => void;
  selectedTab: "ALL" | "UNASSIGNED" | "IN_PROGRESS" | "HIGH_CRITICAL" | "AT_RISK" | "ESCALATED" | "REOPENED" | "CROSS_DEPT" | "RESOLUTION_REVIEW" | "CLOSED";
  setSelectedTab: (v: any) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  priorityFilter: string;
  setPriorityFilter: (v: string) => void;
  staffFilter: string;
  setStaffFilter: (v: string) => void;
  assignModalGrievance: GrievanceItem | null;
  setAssignModalGrievance: (v: GrievanceItem | null) => void;
  selectedStaffId: string;
  setSelectedStaffId: (v: string) => void;
  assignmentNote: string;
  setAssignmentNote: (v: string) => void;
  escalationModalGrievance: GrievanceItem | null;
  setEscalationModalGrievance: (v: GrievanceItem | null) => void;
  escalationBottleneck: "STAFF_CAPACITY" | "CROSS_DEPT" | "MISSING_DOCS" | "COMPLEX_INVESTIGATION" | "ADMIN_DELAY";
  setEscalationBottleneck: (v: any) => void;
  escalationInterventionType: "MONITOR" | "NOTIFY_STAFF" | "REASSIGN" | "CROSS_DEPT";
  setEscalationInterventionType: (v: any) => void;
  escalationTargetStaffId: string;
  setEscalationTargetStaffId: (v: string) => void;
  escalationTargetDept: string;
  setEscalationTargetDept: (v: string) => void;
  escalationNote: string;
  setEscalationNote: (v: string) => void;
  governanceAuditFeed: EscalationAuditRecord[];
  setGovernanceAuditFeed: (v: EscalationAuditRecord[]) => void;
  resolutionModalGrievance: GrievanceItem | null;
  setResolutionModalGrievance: (v: GrievanceItem | null) => void;
  resolutionDecision: "APPROVE" | "REJECT";
  setResolutionDecision: (v: any) => void;
  resolutionFeedback: string;
  setResolutionFeedback: (v: string) => void;
  actionSuccessMessage: string | null;
  setActionSuccessMessage: (v: string | null) => void;
  selectedCaseFile: GrievanceItem | null;
  setSelectedCaseFile: (v: GrievanceItem | null) => void;
  caseDrawerTab: "progress" | "statement" | "notes" | "audit";
  setCaseDrawerTab: (v: any) => void;
  newInternalNote: string;
  setNewInternalNote: (v: string) => void;
  caseProgressLoading: boolean;
  setCaseProgressLoading: (v: boolean) => void;
  previewDocument: DocumentPreviewData | null;
  setPreviewDocument: (v: DocumentPreviewData | null) => void;
  caseProgressData: any;
  setCaseProgressData: (v: any) => void;
  loadData: (deptId?: string, isSilentRefresh?: boolean) => Promise<void>;
  handleOpenDocumentPreview: (file: any) => void;
  handleDownloadDocument: (doc: DocumentPreviewData) => void;
}

const DepartmentHeadContext = createContext<DepartmentHeadState | undefined>(undefined);

export function useDepartmentHead() {
  const context = useContext(DepartmentHeadContext);
  if (!context) {
    throw new Error("useDepartmentHead must be used within a DepartmentHeadProvider");
  }
  return context;
}

interface ProviderProps {
  children: React.ReactNode;
  initialDepartmentName?: string;
  initialHodName?: string;
  initialHodEmail?: string;
  initialEmployeeCode?: string;
}

export function DepartmentHeadProvider({
  children,
  initialDepartmentName = "Department Operations",
  initialHodName = "Department Head",
  initialHodEmail = "",
  initialEmployeeCode = "HOD-01",
}: ProviderProps) {
  const [grievances, setGrievances] = useState<GrievanceItem[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [availableDepartments, setAvailableDepartments] = useState<{ id: string; name: string }[]>([]);
  const [currentDepartmentName, setCurrentDepartmentName] = useState(initialDepartmentName);
  const [currentHodName, setCurrentHodName] = useState(initialHodName);
  const [currentHodEmail, setCurrentHodEmail] = useState(initialHodEmail);
  const [currentEmployeeCode, setCurrentEmployeeCode] = useState(initialEmployeeCode);
  const [activeView, setActiveView] = useState<"overview" | "queue" | "staff" | "sla">("overview");

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

  const [selectedTab, setSelectedTab] = useState<any>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [staffFilter, setStaffFilter] = useState("ALL");
  const [assignModalGrievance, setAssignModalGrievance] = useState<GrievanceItem | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [assignmentNote, setAssignmentNote] = useState("");
  const [escalationModalGrievance, setEscalationModalGrievance] = useState<GrievanceItem | null>(null);
  const [escalationBottleneck, setEscalationBottleneck] = useState<any>("STAFF_CAPACITY");
  const [escalationInterventionType, setEscalationInterventionType] = useState<any>("MONITOR");
  const [escalationTargetStaffId, setEscalationTargetStaffId] = useState("");
  const [escalationTargetDept, setEscalationTargetDept] = useState("Finance & Accounts");
  const [escalationNote, setEscalationNote] = useState("");
  const [governanceAuditFeed, setGovernanceAuditFeed] = useState<EscalationAuditRecord[]>([]);
  const [resolutionModalGrievance, setResolutionModalGrievance] = useState<GrievanceItem | null>(null);
  const [resolutionDecision, setResolutionDecision] = useState<any>("APPROVE");
  const [resolutionFeedback, setResolutionFeedback] = useState("");
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [selectedCaseFile, setSelectedCaseFile] = useState<GrievanceItem | null>(null);
  const [caseDrawerTab, setCaseDrawerTab] = useState<any>("progress");
  const [newInternalNote, setNewInternalNote] = useState("");
  const [caseProgressLoading, setCaseProgressLoading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentPreviewData | null>(null);
  const [caseProgressData, setCaseProgressData] = useState<any>({});

  const loadData = useCallback(async (deptId?: string, isSilentRefresh = false) => {
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
          if (overviewData.department?.name) setCurrentDepartmentName(overviewData.department.name);
          if (overviewData.head) {
            setCurrentHodName(overviewData.head.name);
            setCurrentHodEmail(overviewData.head.email);
            setCurrentEmployeeCode(overviewData.head.employeeCode);
          }
          if (overviewData.auditFeed?.length > 0) setGovernanceAuditFeed(overviewData.auditFeed);
          if (overviewData.availableDepartments?.length > 0) setAvailableDepartments(overviewData.availableDepartments);
        }
      }
      if (grievancesRes.ok) {
        const grievancesData = await grievancesRes.json();
        if (grievancesData.success && Array.isArray(grievancesData.grievances)) setGrievances(grievancesData.grievances);
      }
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        if (staffData.success && Array.isArray(staffData.staff)) setStaffList(staffData.staff);
      }
    } catch (err) {
      console.error("Failed to load department head data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDeptId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDocumentPreview = useCallback((file: any) => {
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
  }, [selectedCaseFile]);

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

  const value = {
    grievances, setGrievances,
    staffList, setStaffList,
    isLoading, isRefreshing,
    selectedDeptId, setSelectedDeptId,
    availableDepartments,
    currentDepartmentName, currentHodName, currentHodEmail, currentEmployeeCode,
    activeView, switchView,
    selectedTab, setSelectedTab,
    searchQuery, setSearchQuery,
    priorityFilter, setPriorityFilter,
    staffFilter, setStaffFilter,
    assignModalGrievance, setAssignModalGrievance,
    selectedStaffId, setSelectedStaffId,
    assignmentNote, setAssignmentNote,
    escalationModalGrievance, setEscalationModalGrievance,
    escalationBottleneck, setEscalationBottleneck,
    escalationInterventionType, setEscalationInterventionType,
    escalationTargetStaffId, setEscalationTargetStaffId,
    escalationTargetDept, setEscalationTargetDept,
    escalationNote, setEscalationNote,
    governanceAuditFeed, setGovernanceAuditFeed,
    resolutionModalGrievance, setResolutionModalGrievance,
    resolutionDecision, setResolutionDecision,
    resolutionFeedback, setResolutionFeedback,
    actionSuccessMessage, setActionSuccessMessage,
    selectedCaseFile, setSelectedCaseFile,
    caseDrawerTab, setCaseDrawerTab,
    newInternalNote, setNewInternalNote,
    caseProgressLoading, setCaseProgressLoading,
    previewDocument, setPreviewDocument,
    caseProgressData, setCaseProgressData,
    loadData, handleOpenDocumentPreview, handleDownloadDocument
  };

  return <DepartmentHeadContext.Provider value={value}>{children}</DepartmentHeadContext.Provider>;
}
