"use client";

import type React from "react";
import { useCallback } from "react";
import { updateStaffStatusAction } from "@/actions";
import type { StaffMember } from "@/types/department-head";

interface UseStaffActionsProps {
  setStaffList: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  showSuccess: (message: string, duration?: number) => void;
  loadData: (deptId?: string, isSilentRefresh?: boolean) => Promise<void>;
}

export function useStaffActions({
  setStaffList,
  showSuccess,
  loadData,
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

        updateStaffStatusAction(staff.id, "ACTIVE")
          .then(() => loadData(undefined, true))
          .catch((err: unknown) =>
            console.error("Failed to toggle availability:", err),
          );
        return;
      }

      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, status: "ON_LEAVE" } : s)),
      );
      showSuccess(`${staff.name} is now marked as On Leave.`);

      updateStaffStatusAction(staff.id, "ON_LEAVE")
        .then(() => loadData(undefined, true))
        .catch((err: unknown) => console.error("Failed to set on leave:", err));
    },
    [loadData, setStaffList, showSuccess],
  );

  return {
    handleToggleStaffAvailability,
  };
}
