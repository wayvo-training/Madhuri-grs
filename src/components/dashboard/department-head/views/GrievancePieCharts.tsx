"use client";

import * as React from "react";
import type { ChartConfig } from "@/components/ui/chart";
import { DashboardPieChartCard } from "@/components/ui/dashboard-pie-chart";
import { PRIORITY_COLORS, STATUS_COLORS } from "@/lib/constants/chart-colors";
import {
  canHeadSubmitResolution,
  isResolutionSubmittedByHead,
} from "@/lib/department-head/filters";
import type { GrievanceItem } from "@/types/department-head";

export function GrievancePieCharts({
  grievances,
  isLoading = false,
  onFilterQueue,
}: {
  grievances: GrievanceItem[];
  isLoading?: boolean;
  onFilterQueue?: (filterType: "status" | "priority", value: string) => void;
}) {
  const statusDataRaw = React.useMemo(() => {
    let unassigned = 0;
    let assigned = 0;
    let inProgress = 0;
    let blocked = 0;
    let pendingApproval = 0;
    let awaitingInfo = 0;
    let resolved = 0;
    let closed = 0;
    let reopened = 0;

    grievances.forEach((g) => {
      const s = (g.status || "").toUpperCase();
      const myDeptStatus = (g.myDepartmentStatus || "").toUpperCase();
      const overallStatus = (g.overallStatus || "").toUpperCase();
      const isBlocked =
        Boolean(g.isBlocked) ||
        s === "BLOCKED" ||
        myDeptStatus === "BLOCKED" ||
        g.assignedStaffName === "Blocked";

      if (s === "CLOSED" || overallStatus === "CLOSED") {
        closed++;
      } else if (s === "RESOLVED" || s === "COMPLETED") {
        resolved++;
      } else if (s === "REOPENED" || s === "REWORK") {
        reopened++;
      } else if (s === "RESOLUTION_PENDING_APPROVAL" || s === "UNDER_REVIEW") {
        pendingApproval++;
      } else if (
        s === "AWAITING_INFORMATION" ||
        s === "WAITING_ON_USER" ||
        s === "PENDING_INFO"
      ) {
        awaitingInfo++;
      } else if (isBlocked) {
        blocked++;
      } else if (
        !isBlocked &&
        (!g.assignedStaffId ||
          s === "SUBMITTED" ||
          s === "ROUTED" ||
          s === "PENDING_ASSIGNMENT" ||
          s === "AWAITING_ASSIGNMENT" ||
          myDeptStatus === "PENDING_ASSIGNMENT" ||
          g.assignedStaffName === "Unassigned")
      ) {
        unassigned++;
      } else if (
        !isBlocked &&
        (s === "ASSIGNED" || myDeptStatus === "ASSIGNED")
      ) {
        assigned++;
      } else {
        inProgress++;
      }
    });

    return [
      {
        name: "In Progress",
        value: inProgress,
        fill: STATUS_COLORS.IN_PROGRESS,
        description: "Investigation active",
      },
      {
        name: "Assigned",
        value: assigned,
        fill: STATUS_COLORS.ASSIGNED,
        description: "Assigned to staff",
      },
      {
        name: "Pending Approval",
        value: pendingApproval,
        fill: STATUS_COLORS.UNDER_REVIEW || "#8B5CF6",
        description: "Awaiting approval",
      },
      {
        name: "Unassigned",
        value: unassigned,
        fill: STATUS_COLORS.UNASSIGNED,
        description: "Needs assignment",
      },
      {
        name: "Blocked",
        value: blocked,
        fill: STATUS_COLORS.BLOCKED || "#F59E0B",
        description: "Waiting for prerequisite",
      },
      {
        name: "Awaiting Info",
        value: awaitingInfo,
        fill: STATUS_COLORS.AWAITING_INFO || "#D97706",
        description: "Waiting on user",
      },
      {
        name: "Resolved",
        value: resolved,
        fill: STATUS_COLORS.RESOLVED,
        description: "Resolution proposed",
      },
      {
        name: "Closed",
        value: closed,
        fill: STATUS_COLORS.CLOSED,
        description: "Case completed",
      },
      {
        name: "Reopened",
        value: reopened,
        fill: STATUS_COLORS.REOPENED,
        description: "Needs attention",
      },
    ];
  }, [grievances]);

  const totalStatus = React.useMemo(
    () => statusDataRaw.reduce((acc, curr) => acc + curr.value, 0),
    [statusDataRaw],
  );

  const priorityDataRaw = React.useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    grievances.forEach((g) => {
      if (g.priority === "CRITICAL") critical++;
      else if (g.priority === "HIGH") high++;
      else if (g.priority === "MEDIUM") medium++;
      else if (g.priority === "LOW") low++;
    });

    return [
      {
        name: "Critical",
        value: critical,
        fill: PRIORITY_COLORS.CRITICAL,
        description: "Immediate attention",
      },
      {
        name: "High",
        value: high,
        fill: PRIORITY_COLORS.HIGH,
        description: "Early resolution",
      },
      {
        name: "Medium",
        value: medium,
        fill: PRIORITY_COLORS.MEDIUM,
        description: "Normal handling",
      },
      {
        name: "Low",
        value: low,
        fill: PRIORITY_COLORS.LOW,
        description: "Lower urgency",
      },
    ];
  }, [grievances]);

  const totalPriority = React.useMemo(
    () => priorityDataRaw.reduce((acc, curr) => acc + curr.value, 0),
    [priorityDataRaw],
  );

  const statusConfig = {
    inProgress: { label: "In Progress", color: STATUS_COLORS.IN_PROGRESS },
    assigned: { label: "Assigned", color: STATUS_COLORS.ASSIGNED },
    pendingApproval: {
      label: "Pending Approval",
      color: STATUS_COLORS.UNDER_REVIEW || "#8B5CF6",
    },
    unassigned: { label: "Unassigned", color: STATUS_COLORS.UNASSIGNED },
    blocked: { label: "Blocked", color: STATUS_COLORS.BLOCKED || "#F59E0B" },
    awaitingInfo: {
      label: "Awaiting Info",
      color: STATUS_COLORS.AWAITING_INFO || "#D97706",
    },
    resolved: { label: "Resolved", color: STATUS_COLORS.RESOLVED },
    closed: { label: "Closed", color: STATUS_COLORS.CLOSED },
    reopened: { label: "Reopened", color: STATUS_COLORS.REOPENED },
  } satisfies ChartConfig;

  const priorityConfig = {
    critical: { label: "Critical", color: PRIORITY_COLORS.CRITICAL },
    high: { label: "High", color: PRIORITY_COLORS.HIGH },
    medium: { label: "Medium", color: PRIORITY_COLORS.MEDIUM },
    low: { label: "Low", color: PRIORITY_COLORS.LOW },
  } satisfies ChartConfig;

  const handleStatusItemClick = (item: { name: string }) => {
    const statusMap: Record<string, string> = {
      "In Progress": "IN_PROGRESS",
      Assigned: "ASSIGNED",
      "Pending Approval": "RESOLUTION_PENDING_APPROVAL",
      "Resolution Pending Approval": "RESOLUTION_PENDING_APPROVAL",
      "Under Review": "RESOLUTION_PENDING_APPROVAL",
      Unassigned: "UNASSIGNED",
      Blocked: "BLOCKED",
      "Awaiting Info": "AWAITING_INFORMATION",
      Resolved: "RESOLVED",
      Closed: "CLOSED",
      Reopened: "REOPENED",
    };
    const targetStatus = statusMap[item.name];
    if (targetStatus && onFilterQueue) {
      onFilterQueue("status", targetStatus);
    }
  };

  const handlePriorityItemClick = (item: { name: string }) => {
    const priorityMap: Record<string, string> = {
      Critical: "CRITICAL",
      High: "HIGH",
      Medium: "MEDIUM",
      Low: "LOW",
    };
    const targetPriority = priorityMap[item.name];
    if (targetPriority && onFilterQueue) {
      onFilterQueue("priority", targetPriority);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <DashboardPieChartCard
        title="Grievance Status Breakdown"
        description="Grievances by current status"
        data={statusDataRaw}
        config={statusConfig}
        centerValue={totalStatus}
        centerLabelTop="TOTAL"
        centerLabelBottom="GRIEVANCES"
        isLoading={isLoading}
        onItemClick={onFilterQueue ? handleStatusItemClick : undefined}
      />
      <DashboardPieChartCard
        title="Priority Distribution"
        description="Grievances by priority level"
        data={priorityDataRaw}
        config={priorityConfig}
        centerValue={totalPriority}
        centerLabelTop="TOTAL"
        centerLabelBottom="GRIEVANCES"
        isLoading={isLoading}
        onItemClick={onFilterQueue ? handlePriorityItemClick : undefined}
      />
    </div>
  );
}
