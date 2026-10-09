"use client";

import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import * as React from "react";
import { ChartConfig } from "@/components/ui/chart";
import { DashboardPieChartCard } from "@/components/ui/dashboard-pie-chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SLA_COLORS, STATUS_COLORS } from "@/lib/constants/chart-colors";
import type { StaffGrievanceItem } from "@/types/staff";

export type ChartFilter = "Active" | "Completed" | "All Time";

export function StaffPieCharts({
  grievances,
  layout = "horizontal",
}: {
  grievances: StaffGrievanceItem[];
  layout?: "horizontal" | "vertical";
}) {
  const [statusFilter, setStatusFilter] = React.useState<ChartFilter>("Active");
  const [slaFilter, setSlaFilter] = React.useState<ChartFilter>("Active");

  const statusDataRaw = React.useMemo(() => {
    let inProgress = 0;
    let underReview = 0;
    let reopened = 0;
    let closed = 0;

    const filteredGrievances = grievances.filter((g) => {
      if (statusFilter === "Active")
        return g.status !== "CLOSED" && g.status !== "RESOLVED";
      if (statusFilter === "Completed")
        return g.status === "CLOSED" || g.status === "RESOLVED";
      return true; // all
    });

    filteredGrievances.forEach((g) => {
      if (g.status === "CLOSED" || g.status === "RESOLVED") closed++;
      else if (g.status === "REOPENED" || g.reopenCount > 0) reopened++;
      else if (g.status === "UNDER_REVIEW" || g.status === "REOPEN_REVIEW")
        underReview++;
      else inProgress++;
    });

    const data = [];
    if (statusFilter === "Active" || statusFilter === "All Time") {
      data.push({
        name: "In Progress",
        value: inProgress,
        fill: STATUS_COLORS.IN_PROGRESS,
        description: "Investigation active",
      });
      data.push({
        name: "Under Review",
        value: underReview,
        fill: STATUS_COLORS.UNDER_REVIEW,
        description: "Awaiting review",
      });
      data.push({
        name: "Reopened",
        value: reopened,
        fill: STATUS_COLORS.REOPENED,
        description: "Needs attention",
      });
    }
    if (statusFilter === "Completed" || statusFilter === "All Time") {
      data.push({
        name: "Closed",
        value: closed,
        fill: STATUS_COLORS.CLOSED,
        description: "Resolved and closed",
      });
    }

    return data;
  }, [grievances, statusFilter]);

  const totalActiveStatus = React.useMemo(
    () => statusDataRaw.reduce((acc, curr) => acc + curr.value, 0),
    [statusDataRaw],
  );

  const slaDataRaw = React.useMemo(() => {
    let onTrack = 0;
    let atRisk = 0;
    let breached = 0;

    const filteredGrievances = grievances.filter((g) => {
      if (slaFilter === "Active")
        return g.status !== "CLOSED" && g.status !== "RESOLVED";
      if (slaFilter === "Completed")
        return g.status === "CLOSED" || g.status === "RESOLVED";
      return true;
    });

    filteredGrievances.forEach((g) => {
      if (g.slaStatus === "BREACHED") breached++;
      else if (g.slaStatus === "AT_RISK") atRisk++;
      else onTrack++;
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
  }, [grievances, slaFilter]);

  const totalActiveSla = React.useMemo(
    () => slaDataRaw.reduce((acc, curr) => acc + curr.value, 0),
    [slaDataRaw],
  );

  const statusConfig = {
    inProgress: { label: "In Progress", color: STATUS_COLORS.IN_PROGRESS },
    underReview: { label: "Under Review", color: STATUS_COLORS.UNDER_REVIEW },
    closed: { label: "Closed", color: STATUS_COLORS.CLOSED },
    reopened: { label: "Reopened", color: STATUS_COLORS.REOPENED },
  };

  const slaConfig = {
    onTrack: { label: "On Track", color: SLA_COLORS.ON_TRACK },
    atRisk: { label: "At Risk", color: SLA_COLORS.AT_RISK },
    breached: { label: "Breached", color: SLA_COLORS.BREACHED },
  };

  const statusSubtitle =
    statusFilter === "Active"
      ? "My active grievances by current status"
      : statusFilter === "Completed"
        ? "My completed grievances by current status"
        : "My grievances across all statuses";

  const slaSubtitle =
    slaFilter === "Active"
      ? "My active grievances by SLA status"
      : slaFilter === "Completed"
        ? "My completed grievances by SLA status"
        : "My grievances across all SLA statuses";

  const getCenterLabel = (filter: ChartFilter) => {
    switch (filter) {
      case "Active":
        return "ACTIVE";
      case "Completed":
        return "COMPLETED";
      case "All Time":
        return "TOTAL";
    }
  };

  return (
    <div
      className={`grid grid-cols-1 ${layout === "horizontal" ? "lg:grid-cols-2" : ""} gap-4 sm:gap-6`}
    >
      <DashboardPieChartCard
        title="My Grievance Status"
        description={statusSubtitle}
        data={statusDataRaw}
        config={statusConfig}
        centerValue={totalActiveStatus}
        centerLabelTop={getCenterLabel(statusFilter)}
        centerLabelBottom="GRIEVANCES"
        extraHeaderElement={
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              if (val) setStatusFilter(val as ChartFilter);
            }}
          >
            <SelectTrigger className="h-8 w-[110px] shrink-0 text-xs font-semibold bg-white border-slate-200 shadow-xs focus:ring-2 focus:ring-blue-100 transition">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="All Time">All Time</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <DashboardPieChartCard
        title="My SLA Overview"
        description={slaSubtitle}
        data={slaDataRaw}
        config={slaConfig}
        centerValue={totalActiveSla}
        centerLabelTop={getCenterLabel(slaFilter)}
        centerLabelBottom="GRIEVANCES"
        extraHeaderElement={
          <Select
            value={slaFilter}
            onValueChange={(val) => {
              if (val) setSlaFilter(val as ChartFilter);
            }}
          >
            <SelectTrigger className="h-8 w-[110px] shrink-0 text-xs font-semibold bg-white border-slate-200 shadow-xs focus:ring-2 focus:ring-blue-100 transition">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="All Time">All Time</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
