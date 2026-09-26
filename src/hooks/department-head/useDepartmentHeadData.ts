"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  EscalationAuditRecord,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";

interface UseDepartmentHeadDataProps {
  initialDepartmentName?: string;
  initialHodName?: string;
  initialHodEmail?: string;
  initialEmployeeCode?: string;
}

export function useDepartmentHeadData({
  initialDepartmentName = "Department Operations",
  initialHodName = "Department Head",
  initialHodEmail = "",
  initialEmployeeCode = "HOD-01",
}: UseDepartmentHeadDataProps = {}) {
  const [grievances, setGrievances] = useState<GrievanceItem[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [governanceAuditFeed, setGovernanceAuditFeed] = useState<
    EscalationAuditRecord[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [availableDepartments, setAvailableDepartments] = useState<
    { id: string; name: string }[]
  >([]);

  const [currentDepartmentName, setCurrentDepartmentName] = useState(
    initialDepartmentName,
  );
  const [currentHodName, setCurrentHodName] = useState(initialHodName);
  const [currentHodEmail, setCurrentHodEmail] = useState(initialHodEmail);
  const [currentEmployeeCode, setCurrentEmployeeCode] =
    useState(initialEmployeeCode);

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

  return {
    grievances,
    setGrievances,
    staffList,
    setStaffList,
    governanceAuditFeed,
    setGovernanceAuditFeed,
    isLoading,
    isRefreshing,
    selectedDeptId,
    setSelectedDeptId,
    availableDepartments,
    currentDepartmentName,
    currentHodName,
    currentHodEmail,
    currentEmployeeCode,
    loadData,
  };
}
