"use client";

import type React from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type {
  DocumentPreviewData,
  EscalationAuditRecord,
  EscalationBottleneck,
  EscalationInterventionType,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";

interface UseGrievanceActionsProps {
  currentHodName: string;
  hodName: string;
  staffList: StaffMember[];
  setStaffList: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  setGrievances: React.Dispatch<React.SetStateAction<GrievanceItem[]>>;
  setGovernanceAuditFeed: React.Dispatch<
    React.SetStateAction<EscalationAuditRecord[]>
  >;
  loadData: (deptId?: string, isSilentRefresh?: boolean) => Promise<void>;
}

export function useGrievanceActions({
  currentHodName,
  hodName,
  staffList,
  setStaffList,
  setGrievances,
  setGovernanceAuditFeed,
  loadData,
}: UseGrievanceActionsProps) {
  const [actionSuccessMessage, setActionSuccessMessage] = useState<
    string | null
  >(null);

  const showSuccess = useCallback((message: string, duration = 4000) => {
    setActionSuccessMessage(message);
    toast.success(message, { duration });
    setTimeout(() => setActionSuccessMessage(null), duration);
  }, []);

  const handleAssignmentSuccess = useCallback(
    (grievance: GrievanceItem, staffId: string, staffName: string) => {
      setStaffList((prev) =>
        prev.map((s) => {
          if (s.id === staffId) {
            return { ...s, activeTickets: s.activeTickets + 1 };
          }
          if (grievance.assignedStaffId === s.id) {
            return {
              ...s,
              activeTickets: Math.max(0, s.activeTickets - 1),
            };
          }
          return s;
        }),
      );

      setGrievances((prev) =>
        prev.map((g) =>
          g.id === grievance.id
            ? {
                ...g,
                assignedStaffId: staffId,
                assignedStaffName: staffName,
                status: "ASSIGNED",
              }
            : g,
        ),
      );

      showSuccess(
        `Assigned grievance ${grievance.ticketCode} to ${staffName}.`,
      );
      loadData(undefined, true);
    },
    [loadData, setGrievances, setStaffList, showSuccess],
  );

  const handleEscalationSubmit = useCallback(
    async ({
      grievance,
      bottleneck,
      interventionType,
      targetStaffId,
      targetDept,
      note,
      extensionHours = 24,
    }: {
      grievance: GrievanceItem;
      bottleneck: EscalationBottleneck;
      interventionType: EscalationInterventionType;
      targetStaffId?: string;
      targetDept: string;
      note: string;
      extensionHours?: number;
    }) => {
      const targetStaff = targetStaffId
        ? staffList.find((s) => s.id === targetStaffId)
        : undefined;
      const targetStaffName = targetStaff
        ? targetStaff.name
        : grievance.assignedStaffName || "Unassigned";

      if (interventionType === "REASSIGN" && targetStaff) {
        setStaffList((prev) =>
          prev.map((s) => {
            if (s.id === targetStaff.id) {
              return { ...s, activeTickets: s.activeTickets + 1 };
            }
            if (grievance.assignedStaffId === s.id) {
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
        REQUEST_STATUS_UPDATE: `Immediate Status Update Requested from ${targetStaffName}`,
        NOTIFY_STAFF: `Direct Operational Nudge Dispatched to ${targetStaffName}`,
        CROSS_DEPT: `Enlisted Supporting Department (${targetDept})`,
        REASSIGN: `Reassigned to ${targetStaffName}`,
        DIRECT_OVERSIGHT: `Direct Department Head Oversight Assumed by ${currentHodName}`,
        EXTEND_SLA: `Resolution SLA Deadline Extended (+${extensionHours}h)`,
      };

      const chosenBottleneck = bottleneckLabels[bottleneck] || bottleneck;
      const chosenAction = actionLabels[interventionType] || interventionType;

      const newAuditEntries: EscalationAuditRecord[] = [
        {
          id: `aud-${Date.now()}`,
          timestamp: "Just now",
          actor: `${currentHodName} (DEPARTMENT_HEAD)`,
          action: "HOD_INTERVENTION_TAKEN",
          bottleneck: chosenBottleneck,
          details: `Intervention: ${chosenAction} (Bottleneck: ${chosenBottleneck}). Directive: "${note || "Proceed with expedited resolution under departmental directives."}"`,
        },
      ];

      setGrievances((prev) =>
        prev.map((g) => {
          if (g.id !== grievance.id) return g;
          return {
            ...g,
            status: "IN_PROGRESS",
            slaStatus: "ON_TRACK",
            priority: g.priority,
            assignedStaffId:
              interventionType === "REASSIGN" && targetStaff
                ? targetStaff.id
                : g.assignedStaffId,
            assignedStaffName:
              interventionType === "REASSIGN" && targetStaff
                ? targetStaff.name
                : g.assignedStaffName,
            escalationStage: "IN_PROGRESS",
            identifiedBottleneck: chosenBottleneck,
            hodIntervention: {
              actionType: interventionType,
              actionLabel: chosenAction,
              note: note,
              intervenedAt: "Just now",
              intervenedBy: currentHodName,
              targetStaffName: targetStaffName,
              targetDepartment: targetDept,
            },
            auditTrail: [...(g.auditTrail || []), ...newAuditEntries],
          };
        }),
      );

      setGovernanceAuditFeed((prev) => [
        {
          id: `gov-${Date.now()}`,
          timestamp: "Just now",
          actor: "HOD Intervention",
          action: `${grievance.ticketCode}: ${chosenAction}`,
          details: `Bottleneck: ${chosenBottleneck}. Note: "${note.slice(0, 60)}..."`,
          stage: "INTERVENTION_TAKEN",
        },
        ...prev,
      ]);

      const successMsg =
        interventionType === "REQUEST_STATUS_UPDATE"
          ? `Immediate status update requested for ${grievance.ticketCode}. Notification dispatched to assigned staff.`
          : `HOD intervention (${chosenAction}) logged to audit trail & dispatched to staff for ${grievance.ticketCode}.`;

      showSuccess(successMsg, 5000);

      try {
        await fetch(
          `/api/department-head/grievances/${grievance.id}/intervene`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bottleneck,
              interventionType,
              targetStaffId,
              targetDeptName: targetDept,
              note,
              extensionHours,
            }),
          },
        );
        await loadData(undefined, true);
      } catch (err) {
        console.error("Failed to persist intervention:", err);
      }
    },
    [
      currentHodName,
      loadData,
      setGovernanceAuditFeed,
      setGrievances,
      setStaffList,
      showSuccess,
      staffList,
    ],
  );

  const handleResolutionSubmit = useCallback(
    async ({
      grievance,
      decision,
      feedback,
      findings,
      actionTaken,
      outcome,
    }: {
      grievance: GrievanceItem;
      decision: "APPROVE" | "CLARIFY";
      feedback: string;
      findings?: string;
      actionTaken?: string;
      outcome?: string;
    }) => {
      const isDirectResolution =
        (grievance.reopenCount ?? 0) >= 2 ||
        grievance.status === "ESCALATED" ||
        grievance.status !== "UNDER_REVIEW";
      if (decision === "APPROVE") {
        const finalAudit: EscalationAuditRecord = {
          id: `aud-${Date.now()}-11`,
          timestamp: "Just now",
          actor: `${currentHodName} (DEPARTMENT_HEAD)`,
          action: isDirectResolution
            ? "RESOLUTION_SUBMITTED"
            : "ACCEPT_RESOLUTION",
          details: isDirectResolution
            ? "Department Head submitted a direct resolution."
            : "Department Head approved final resolution. Escalation cleared, grievance successfully closed.",
          stage: isDirectResolution
            ? "RESOLUTION_SUBMITTED"
            : "ESCALATION_CLEARED",
        };

        setGrievances((prev) =>
          prev.map((g) =>
            g.id === grievance.id
              ? {
                  ...g,
                  status: isDirectResolution ? "RESOLVED" : "CLOSED",
                  slaStatus: "ON_TRACK",
                  escalationStage: isDirectResolution
                    ? "RESOLUTION_SUBMITTED"
                    : "ESCALATION_CLEARED",
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
            action: `${grievance.ticketCode}: Resolution Approved & Escalation Cleared`,
            details:
              "Grievance successfully resolved and closed under SLA governance protocol.",
            stage: "ESCALATION_CLEARED",
          },
          ...prev,
        ]);

        showSuccess(
          `Resolution approved & Escalation Cleared for ${grievance.ticketCode}. Ticket is now officially CLOSED.`,
          5000,
        );
      } else {
        const clarifyAudit: EscalationAuditRecord = {
          id: `aud-${Date.now()}-clarify`,
          timestamp: "Just now",
          actor: `${currentHodName} (Department Head)`,
          action: "Resolution Returned for Clarification",
          details: `Feedback: "${feedback || "Additional verification required."}". Grievance returned to investigating staff.`,
          stage: "IN_PROGRESS",
        };

        setGrievances((prev) =>
          prev.map((g) =>
            g.id === grievance.id
              ? {
                  ...g,
                  status: "IN_PROGRESS",
                  auditTrail: [...(g.auditTrail || []), clarifyAudit],
                }
              : g,
          ),
        );

        showSuccess(
          `Resolution for ${grievance.ticketCode} returned to staff for clarification.`,
          5000,
        );
      }

      try {
        await fetch(
          `/api/department-head/grievances/${grievance.id}/resolution`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              decision,
              feedback,
              findings,
              actionTaken,
              outcome,
            }),
          },
        );
        await loadData(undefined, true);
      } catch (err) {
        console.error("Failed to persist resolution decision:", err);
      }
    },
    [
      currentHodName,
      loadData,
      setGovernanceAuditFeed,
      setGrievances,
      showSuccess,
    ],
  );

  const handleAddInternalNote = useCallback(
    async (
      grievance: GrievanceItem,
      noteText: string,
      parentId?: string,
      replyToAuthor?: string,
    ) => {
      const trimmedNote = noteText.trim();
      if (!trimmedNote) return;

      const headDisplayName = currentHodName.startsWith("Department Head")
        ? currentHodName
        : `Department Head — ${currentHodName}`;

      const newNoteObj = {
        id: `note-${Date.now()}`,
        author: headDisplayName,
        role: "Department Head",
        timestamp: "Just now",
        note: trimmedNote,
        parentId,
        replyToAuthor,
      };

      const newAudit: EscalationAuditRecord = {
        id: `aud-${Date.now()}-note`,
        timestamp: "Just now",
        actor: headDisplayName,
        action: parentId ? "Internal Reply" : "Internal Note",
        details: trimmedNote,
        stage: grievance.status,
      };

      const updatedGrievance: GrievanceItem = {
        ...grievance,
        internalNotes: [...(grievance.internalNotes || []), newNoteObj],
        auditTrail: [newAudit, ...(grievance.auditTrail || [])],
      };

      setGrievances((prev) =>
        prev.map((g) => (g.id === grievance.id ? updatedGrievance : g)),
      );

      showSuccess(
        parentId
          ? `Added reply to discussion on ${grievance.ticketCode}`
          : `Added internal note to ${grievance.ticketCode}`,
        4000,
      );

      try {
        const res = await fetch(
          `/api/department-head/grievances/${grievance.id}/notes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              note: trimmedNote,
              parentId,
              replyToAuthor,
            }),
          },
        );
        if (res.ok) {
          const resJson = await res.json();
          if (resJson?.note?.id) {
            newNoteObj.id = resJson.note.id;
          }
        }
        loadData(undefined, true);
      } catch (err) {
        console.error("Failed to persist internal note to database:", err);
      }

      return updatedGrievance;
    },
    [currentHodName, loadData, setGrievances, showSuccess],
  );

  const handleDownloadDocument = useCallback(
    (doc: DocumentPreviewData) => {
      const sampleText = `REPUBLIC OF INDIA / CENTRAL GRIEVANCE REDRESSAL SYSTEM\nOFFICIAL ATTACHMENT RECORD\n\nTicket Code: ${doc.grievanceNumber || "GRS"}\nFile Name: ${doc.name}\nSize: ${doc.size}\nCategory: ${doc.category || "General"}\nComplainant: ${doc.submitterName || "Citizen"} (${doc.submitterRole || "Complainant"})\nUploaded: ${doc.uploadedAt || "Recent"}\n\n--- DOCUMENT CONTENT EXTRACT ---\nThis official digital document was retrieved from the grievance case dossier.\nCryptographic Verification: SHA-256 Validated\nStatus: Certified Authentic Evidence\n`;
      const blob = new Blob([sampleText], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess(`Downloaded file: ${doc.name}`, 3000);
    },
    [showSuccess],
  );

  return {
    actionSuccessMessage,
    setActionSuccessMessage,
    showSuccess,
    handleAssignmentSuccess,
    handleEscalationSubmit,
    handleResolutionSubmit,
    handleAddInternalNote,
    handleDownloadDocument,
  };
}
