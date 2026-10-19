"use client";

import * as React from "react";
import type { ChartConfig } from "@/components/ui/chart";
import { DashboardPieChartCard } from "@/components/ui/dashboard-pie-chart";
import { PRIORITY_COLORS, STATUS_COLORS } from "@/lib/constants/chart-colors";
import type { GrievanceItem } from "@/types/department-head";

export function GrievancePieCharts({
  grievances,
  onFilterQueue,
}: {
  grievances: GrievanceItem[];
  onFilterQueue?: (filterType: "status" | "priority", value: string) => void;
}) {
  const statusDataRaw = React.useMemo(() => {
    let unassigned = 0;
    let inProgress = 0;
    let underReview = 0;
    let reopened = 0;

    grievances.forEach((g) => {
      if (g.status === "CLOSED" || g.status === "RESOLVED") return;
      if (g.status === "REOPENED") reopened++;
      else if (g.status === "UNDER_REVIEW") underReview++;
      else if (
        !g.assignedStaffId ||
        g.status === "SUBMITTED" ||
        g.status === "ROUTED" ||
        g.status === "PENDING_ASSIGNMENT" ||
        g.myDepartmentStatus === "PENDING_ASSIGNMENT"
      )
        unassigned++;
      else inProgress++;
    });

    return [
      {
        name: "In Progress",
        value: inProgress,
        fill: STATUS_COLORS.IN_PROGRESS,
        description: "Investigation active",
      },
      {
        name: "Under Review",
        value: underReview,
        fill: STATUS_COLORS.UNDER_REVIEW,
        description: "Awaiting review",
      },
      {
        name: "Unassigned",
        value: unassigned,
        fill: STATUS_COLORS.UNASSIGNED,
        description: "Needs assignment",
      },
      {
        name: "Reopened",
        value: reopened,
        fill: STATUS_COLORS.REOPENED,
        description: "Needs attention",
      },
    ];
  }, [grievances]);

  const totalActive = React.useMemo(
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
    underReview: { label: "Under Review", color: STATUS_COLORS.UNDER_REVIEW },
    unassigned: { label: "Unassigned", color: STATUS_COLORS.UNASSIGNED },
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
      "Under Review": "UNDER_REVIEW",
      Unassigned: "UNASSIGNED",
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
        description="Active grievances by current status"
        data={statusDataRaw}
        config={statusConfig}
        centerValue={totalActive}
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
        onItemClick={onFilterQueue ? handlePriorityItemClick : undefined}
      />
    </div>
  );
}
