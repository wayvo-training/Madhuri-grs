"use client";

import * as React from "react";
import type { ChartConfig } from "@/components/ui/chart";
import { DashboardPieChartCard } from "@/components/ui/dashboard-pie-chart";
import { SLA_COLORS, STATUS_COLORS } from "@/lib/constants/chart-colors";
import type { StaffGrievanceItem, StaffQueueTab } from "@/types/staff";

interface StaffPieChartsProps {
  grievances: StaffGrievanceItem[];
  layout?: "horizontal" | "vertical";
  onFilterQueue?: (tab: StaffQueueTab) => void;
}

export function StaffPieCharts({
  grievances,
  layout = "horizontal",
  onFilterQueue,
}: StaffPieChartsProps) {
  const statusDataRaw = React.useMemo(() => {
    let inProgress = 0;
    let pendingApproval = 0;
    let awaitingInfo = 0;
    let escalated = 0;
    let resolved = 0;
    let closed = 0;
    let reopened = 0;

    grievances.forEach((g) => {
      const s = (g.status || "").toUpperCase();

      if (
        s === "CLOSED" ||
        (g.overallStatus && g.overallStatus.toUpperCase() === "CLOSED")
      ) {
        closed++;
      } else if (
        s === "RESOLVED" ||
        (g.overallStatus && g.overallStatus.toUpperCase() === "RESOLVED") ||
        s === "COMPLETED" ||
        g.isMyDepartmentCompleted
      ) {
        resolved++;
      } else if (
        s === "REOPENED" ||
        s === "REWORK" ||
        (g.reopenCount || 0) > 0
      ) {
        reopened++;
      } else if (s === "ESCALATED") {
        escalated++;
      } else if (
        s === "UNDER_REVIEW" ||
        s === "REOPEN_REVIEW" ||
        s === "RESOLUTION_PENDING_APPROVAL"
      ) {
        pendingApproval++;
      } else if (
        s === "AWAITING_INFORMATION" ||
        s === "WAITING_ON_USER" ||
        s === "PENDING_INFO"
      ) {
        awaitingInfo++;
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
        name: "Pending Approval",
        value: pendingApproval,
        fill: STATUS_COLORS.UNDER_REVIEW || "#8B5CF6",
        description: "Awaiting approval",
      },
      {
        name: "Awaiting Info",
        value: awaitingInfo,
        fill: STATUS_COLORS.AWAITING_INFO || "#D97706",
        description: "Waiting on user",
      },
      {
        name: "Escalated",
        value: escalated,
        fill: STATUS_COLORS.ESCALATED || "#B45309",
        description: "SLA escalation",
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

  const totalGrievances = React.useMemo(
    () => statusDataRaw.reduce((acc, curr) => acc + curr.value, 0),
    [statusDataRaw],
  );

  const slaDataRaw = React.useMemo(() => {
    let onTrack = 0;
    let atRisk = 0;
    let breached = 0;

    grievances.forEach((g) => {
      if (
        g.status === "CLOSED" ||
        g.status === "RESOLVED" ||
        g.status === "COMPLETED" ||
        g.isMyDepartmentCompleted
      ) {
        return;
      }

      if (g.slaStatus === "BREACHED") {
        breached++;
      } else if (g.slaStatus === "AT_RISK") {
        atRisk++;
      } else {
        onTrack++;
      }
    });

    return [
      {
        name: "On Track",
        value: onTrack,
        fill: SLA_COLORS.ON_TRACK,
        description: "Within SLA",
      },
      {
        name: "At Risk",
        value: atRisk,
        fill: SLA_COLORS.AT_RISK,
        description: "Deadline approaching",
      },
      {
        name: "Breached",
        value: breached,
        fill: SLA_COLORS.BREACHED,
        description: "SLA exceeded",
      },
    ];
  }, [grievances]);

  const totalActiveSla = React.useMemo(
    () => slaDataRaw.reduce((acc, curr) => acc + curr.value, 0),
    [slaDataRaw],
  );

  const statusConfig = {
    inProgress: { label: "In Progress", color: STATUS_COLORS.IN_PROGRESS },
    pendingApproval: {
      label: "Pending Approval",
      color: STATUS_COLORS.UNDER_REVIEW || "#8B5CF6",
    },
    awaitingInfo: {
      label: "Awaiting Info",
      color: STATUS_COLORS.AWAITING_INFO || "#D97706",
    },
    escalated: {
      label: "Escalated",
      color: STATUS_COLORS.ESCALATED || "#B45309",
    },
    resolved: { label: "Resolved", color: STATUS_COLORS.RESOLVED },
    closed: { label: "Closed", color: STATUS_COLORS.CLOSED },
    reopened: { label: "Reopened", color: STATUS_COLORS.REOPENED },
  } satisfies ChartConfig;

  const slaConfig = {
    onTrack: { label: "On Track", color: SLA_COLORS.ON_TRACK },
    atRisk: { label: "At Risk", color: SLA_COLORS.AT_RISK },
    breached: { label: "Breached", color: SLA_COLORS.BREACHED },
  } satisfies ChartConfig;

  const handleStatusItemClick = (item: { name: string }) => {
    if (!onFilterQueue) return;
    if (item.name === "In Progress") {
      onFilterQueue("in_progress");
    } else if (
      item.name === "Pending Approval" ||
      item.name === "Under Review"
    ) {
      onFilterQueue("under_review");
    } else if (item.name === "Awaiting Info") {
      onFilterQueue("awaiting_info");
    } else if (item.name === "Escalated") {
      onFilterQueue("escalated");
    } else if (item.name === "Resolved") {
      onFilterQueue("resolved");
    } else if (item.name === "Closed") {
      onFilterQueue("closed");
    } else if (item.name === "Reopened") {
      onFilterQueue("reopened");
    }
  };

  const handleSlaItemClick = (item: { name: string }) => {
    if (!onFilterQueue) return;
    if (item.name === "On Track") {
      onFilterQueue("on_track");
    } else if (item.name === "At Risk") {
      onFilterQueue("at_risk");
    } else if (item.name === "Breached") {
      onFilterQueue("breached");
    }
  };

  return (
    <div
      className={`grid grid-cols-1 ${layout === "horizontal" ? "lg:grid-cols-2" : ""} gap-4 sm:gap-6`}
    >
      <DashboardPieChartCard
        title="My Grievance Status"
        description="My grievances by current status"
        data={statusDataRaw}
        config={statusConfig}
        centerValue={totalGrievances}
        centerLabelTop="TOTAL"
        centerLabelBottom="GRIEVANCES"
        onItemClick={onFilterQueue ? handleStatusItemClick : undefined}
      />
      <DashboardPieChartCard
        title="My SLA Overview"
        description="My active grievances by SLA status"
        data={slaDataRaw}
        config={slaConfig}
        centerValue={totalActiveSla}
        centerLabelTop="ACTIVE"
        centerLabelBottom="GRIEVANCES"
        onItemClick={onFilterQueue ? handleSlaItemClick : undefined}
      />
    </div>
  );
}
