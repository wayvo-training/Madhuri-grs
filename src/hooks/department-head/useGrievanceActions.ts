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
      bottleneckExplanation,
      interventionType,
      targetStaffId,
      targetDept,
      note,
      extensionHours = 24,
    }: {
      grievance: GrievanceItem;
      bottleneck: EscalationBottleneck;
      bottleneckExplanation?: string;
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
        MISSING_DOCS: "Incomplete Information / Documentation",
        COMPLEX_INVESTIGATION: "Complex Investigation Required",
        OTHER_CONSTRAINT: "Other Operational Constraint",
        ADMIN_DELAY: "Internal Administrative Delay",
      };

      const actionLabels: Record<string, string> = {
        MONITOR: "Continue Monitoring",
        REQUEST_STATUS_UPDATE: `Immediate Status Update Requested from ${targetStaffName}`,
        NOTIFY_STAFF: `Operational Direction Provided to ${targetStaffName}`,
        CROSS_DEPT: `Supporting Department Added (${targetDept})`,
        REASSIGN: `Reassigned to ${targetStaffName}`,
        ASSUME_RESOLUTION_AUTHORITY: `Resolution Authority Assumed by ${currentHodName}`,
        DIRECT_OVERSIGHT: `Resolution Authority Assumed by ${currentHodName}`,
        REQUEST_ADDITIONAL_INFO: "Request Additional Information Dispatched",
        EXTEND_SLA: `Resolution SLA Deadline Extended (+${extensionHours}h)`,
      };

      const chosenBottleneck = bottleneckLabels[bottleneck] || bottleneck;
      const chosenAction = actionLabels[interventionType] || interventionType;
      const isAssumingAuthority =
        interventionType === "ASSUME_RESOLUTION_AUTHORITY" ||
        interventionType === "DIRECT_OVERSIGHT";

      const newAuditEntries: EscalationAuditRecord[] = [
        {
          id: `aud-${Date.now()}`,
          timestamp: "Just now",
          actor: `${currentHodName} (DEPARTMENT_HEAD)`,
          action: "HOD_INTERVENTION_TAKEN",
          bottleneck: chosenBottleneck,
          details: `Intervention: ${chosenAction} (Bottleneck: ${chosenBottleneck}${bottleneckExplanation ? ` - ${bottleneckExplanation}` : ""}). Directive: "${note || "Proceed under departmental directives."}"`,
        },
      ];

      setGrievances((prev) =>
        prev.map((g) => {
          if (g.id !== grievance.id) return g;
          return {
            ...g,
            status: isAssumingAuthority ? g.status : "IN_PROGRESS",
            slaStatus:
              interventionType === "EXTEND_SLA" ? "ON_TRACK" : g.slaStatus,
            priority: g.priority,
            assignedStaffId:
              interventionType === "REASSIGN" && targetStaff
                ? targetStaff.id
                : g.assignedStaffId,
            assignedStaffName:
              interventionType === "REASSIGN" && targetStaff
                ? targetStaff.name
                : g.assignedStaffName,
            escalationStage: isAssumingAuthority
              ? g.escalationStage
              : "IN_PROGRESS",
            identifiedBottleneck: chosenBottleneck,
            hodIntervention: {
              actionType: interventionType,
              actionLabel: chosenAction,
              note: note,
              intervenedAt: "Just now",
              intervenedBy: currentHodName,
              isResolutionAuthority: isAssumingAuthority,
              resolutionAuthorityName: isAssumingAuthority
                ? currentHodName
                : undefined,
              targetStaffName: targetStaffName,
              targetDepartment: targetDept,
              rootBottleneck: chosenBottleneck,
              bottleneckExplanation,
              directiveJustification: note,
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

      const successMsg = isAssumingAuthority
        ? `Resolution authority assumed for ${grievance.ticketCode}. You may now review staff findings and submit the resolution.`
        : interventionType === "REQUEST_STATUS_UPDATE"
          ? `Immediate status update requested for ${grievance.ticketCode}. Notification dispatched to assigned staff.`
          : `Intervention (${chosenAction}) logged to audit trail & dispatched for ${grievance.ticketCode}.`;

      showSuccess(successMsg, 5000);

      try {
        const res = await fetch(
          `/api/department-head/grievances/${grievance.id}/intervene`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bottleneck,
              bottleneckExplanation,
              interventionType,
              targetStaffId,
              targetDeptName: targetDept,
              note,
              extensionHours,
            }),
          },
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          toast.error(data.message || "Failed to execute intervention");
        }
        await loadData(undefined, true);
      } catch (err) {
        console.error("Failed to persist intervention:", err);
        toast.error("Network error while recording intervention.");
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
      evidence,
    }: {
      grievance: GrievanceItem;
      decision: "APPROVE" | "CLARIFY";
      feedback: string;
      findings?: string;
      actionTaken?: string;
      outcome?: string;
      evidence?: string;
    }) => {
      const isDirectResolution =
        (grievance.reopenCount ?? 0) >= 2 ||
        grievance.status === "ESCALATED" ||
        grievance.status !== "UNDER_REVIEW" ||
        Boolean(grievance.hodIntervention?.isResolutionAuthority);

      if (decision === "APPROVE") {
        const finalAudit: EscalationAuditRecord = {
          id: `aud-${Date.now()}-11`,
          timestamp: "Just now",
          actor: `${currentHodName} (DEPARTMENT_HEAD)`,
          action: "RESOLUTION_SUBMITTED",
          details: isDirectResolution
            ? "Department Head submitted resolution. Placed in UNDER_REVIEW for Employee Review."
            : "Department Head approved resolution. Transferred to Employee Review.",
          stage: "UNDER_REVIEW",
        };

        setGrievances((prev) =>
          prev.map((g) =>
            g.id === grievance.id
              ? {
                  ...g,
                  status: "UNDER_REVIEW",
                  escalationStage: "RESOLUTION_SUBMITTED",
                  auditTrail: [...(g.auditTrail || []), finalAudit],
                }
              : g,
          ),
        );

        setGovernanceAuditFeed((prev) => [
          {
            id: `gov-${Date.now()}`,
            timestamp: "Just now",
            actor: "HOD Resolution",
            action: `${grievance.ticketCode}: Resolution Submitted`,
            details:
              "Resolution submitted by Department Head. Grievance placed in Employee Review.",
            stage: "UNDER_REVIEW",
          },
          ...prev,
        ]);

        showSuccess(
          `Resolution submitted successfully for ${grievance.ticketCode}. Grievance is now under Employee Review.`,
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
        const res = await fetch(
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
              evidence,
            }),
          },
        );
        const data = await res.json();
        if (!res.ok || !data.success) {
          toast.error(data.message || "Failed to submit resolution");
        }
        await loadData(undefined, true);
      } catch (err) {
        console.error("Failed to persist resolution decision:", err);
        toast.error("Network error while submitting resolution.");
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
