"use client";

import type React from "react";
import { useCallback } from "react";
import type {
  EscalationAuditRecord,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";

interface UseStaffActionsProps {
  currentHodName: string;
  staffList: StaffMember[];
  grievances: GrievanceItem[];
  setStaffList: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  setGrievances: React.Dispatch<React.SetStateAction<GrievanceItem[]>>;
  setGovernanceAuditFeed: React.Dispatch<
    React.SetStateAction<EscalationAuditRecord[]>
  >;
  showSuccess: (message: string, duration?: number) => void;
  loadData: (deptId?: string, isSilentRefresh?: boolean) => Promise<void>;
  openLeaveReassignmentModal: (staff: StaffMember) => void;
}

export function useStaffActions({
  currentHodName,
  staffList,
  grievances,
  setStaffList,
  setGrievances,
  setGovernanceAuditFeed,
  showSuccess,
  loadData,
  openLeaveReassignmentModal,
}: UseStaffActionsProps) {
  const handleToggleStaffAvailability = useCallback(
    (staff: StaffMember) => {
      if (staff.status === "ON_LEAVE") {
        setStaffList((prev) =>
          prev.map((s) => (s.id === staff.id ? { ...s, status: "ACTIVE" } : s)),
        );
        showSuccess(
          `${staff.name} is now marked as Active & Available for assignments.`,
        );

        fetch(`/api/department-head/staff/${staff.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ACTIVE" }),
        })
          .then(() => loadData(undefined, true))
          .catch((err) => console.error("Failed to toggle availability:", err));
        return;
      }

      const activeAssignedTickets = grievances.filter(
        (g) => g.assignedStaffId === staff.id && g.status !== "CLOSED",
      );

      if (activeAssignedTickets.length > 0 || staff.activeTickets > 0) {
        openLeaveReassignmentModal(staff);
      } else {
        setStaffList((prev) =>
          prev.map((s) =>
            s.id === staff.id ? { ...s, status: "ON_LEAVE" } : s,
          ),
        );
        showSuccess(`${staff.name} is now marked as On Leave.`);

        fetch(`/api/department-head/staff/${staff.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ON_LEAVE" }),
        })
          .then(() => loadData(undefined, true))
          .catch((err) => console.error("Failed to set on leave:", err));
      }
    },
    [
      grievances,
      loadData,
      openLeaveReassignmentModal,
      setStaffList,
      showSuccess,
    ],
  );

  const handleBulkReassignAndMarkLeave = useCallback(
    async ({
      leavingStaff,
      targetStaffId,
      note,
    }: {
      leavingStaff: StaffMember;
      targetStaffId: string;
      note: string;
    }) => {
      const targetStaff = staffList.find((s) => s.id === targetStaffId);
      if (!targetStaff) return;

      const leavingStaffId = leavingStaff.id;
      const activeTicketsToTransfer = grievances.filter(
        (g) => g.assignedStaffId === leavingStaffId && g.status !== "CLOSED",
      );

      setGrievances((prev) =>
        prev.map((g) => {
          if (g.assignedStaffId !== leavingStaffId || g.status === "CLOSED") {
            return g;
          }

          const auditEntry: EscalationAuditRecord = {
            id: `aud-${Date.now()}-${g.id}`,
            timestamp: "Just now",
            actor: `${currentHodName} (Department Head)`,
            action: "Reassigned due to Staff Leave",
            details: `Reassigned from ${leavingStaff.name} to ${targetStaff.name}. Reason: Staff marked On Leave. Directive: "${note || "Transferred to maintain SLA turnaround during staff leave."}"`,
            stage: g.status,
          };

          const internalNoteEntry = {
            id: `note-${Date.now()}-${g.id}`,
            author: `${currentHodName} (Department Head)`,
            role: "Department Head",
            timestamp: "Just now",
            note: `Transferred to ${targetStaff.name} due to staff leave. Directive: "${note || "Transferred to maintain SLA turnaround during staff leave."}"`,
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

      setGovernanceAuditFeed((prev) => [
        {
          id: `gov-${Date.now()}`,
          timestamp: "Just now",
          actor: "Staff Availability Engine",
          action: `${leavingStaff.name} Marked On Leave`,
          details: `Bulk transferred ${activeTicketsToTransfer.length} active grievance(s) to ${targetStaff.name}.`,
          stage: "REASSIGNED",
        },
        ...prev,
      ]);

      showSuccess(
        `Reassigned ${activeTicketsToTransfer.length} ticket(s) to ${targetStaff.name} and marked ${leavingStaff.name} as On Leave.`,
        5000,
      );

      try {
        await fetch(`/api/department-head/staff/${leavingStaffId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetStaffId: targetStaff.id,
            note:
              note ||
              "Transferred to maintain SLA turnaround during staff leave.",
          }),
        });
        await loadData(undefined, true);
      } catch (err) {
        console.error("Failed to bulk reassign:", err);
      }
    },
    [
      currentHodName,
      grievances,
      loadData,
      setGovernanceAuditFeed,
      setGrievances,
      setStaffList,
      showSuccess,
      staffList,
    ],
  );

  const handleKeepTicketsAndMarkLeave = useCallback(
    async (leavingStaff: StaffMember) => {
      const staffId = leavingStaff.id;

      setStaffList((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, status: "ON_LEAVE" } : s)),
      );

      setGovernanceAuditFeed((prev) => [
        {
          id: `gov-${Date.now()}`,
          timestamp: "Just now",
          actor: "Staff Availability Engine",
          action: `${leavingStaff.name} Marked On Leave`,
          details: `Staff member marked on leave. Retained ${leavingStaff.activeTickets} ticket assignments in their queue.`,
          stage: "ON_LEAVE",
        },
        ...prev,
      ]);

      showSuccess(
        `Marked ${leavingStaff.name} as On Leave. Active tickets retained in their queue.`,
        5000,
      );

      try {
        await fetch(`/api/department-head/staff/${staffId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ON_LEAVE" }),
        });
        await loadData(undefined, true);
      } catch (err) {
        console.error("Failed to mark on leave:", err);
      }
    },
    [loadData, setGovernanceAuditFeed, setStaffList, showSuccess],
  );

  return {
    handleToggleStaffAvailability,
    handleBulkReassignAndMarkLeave,
    handleKeepTicketsAndMarkLeave,
  };
}
