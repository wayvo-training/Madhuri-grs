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
    let underReview = 0;
    let reopened = 0;

    grievances.forEach((g) => {
      if (
        g.status === "CLOSED" ||
        g.status === "RESOLVED" ||
        g.status === "COMPLETED" ||
        g.isMyDepartmentCompleted
      ) {
        return;
      }

      if (g.status === "REOPENED" || g.reopenCount > 0) {
        reopened++;
      } else if (g.status === "UNDER_REVIEW" || g.status === "REOPEN_REVIEW") {
        underReview++;
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
        name: "Under Review",
        value: underReview,
        fill: STATUS_COLORS.UNDER_REVIEW,
        description: "Awaiting review",
      },
      {
        name: "Reopened",
        value: reopened,
        fill: STATUS_COLORS.REOPENED,
        description: "Needs attention",
      },
    ];
  }, [grievances]);

  const totalActiveStatus = React.useMemo(
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
    underReview: { label: "Under Review", color: STATUS_COLORS.UNDER_REVIEW },
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
    } else if (item.name === "Under Review") {
      onFilterQueue("under_review");
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
        description="My active grievances by current status"
        data={statusDataRaw}
        config={statusConfig}
        centerValue={totalActiveStatus}
        centerLabelTop="ACTIVE"
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
