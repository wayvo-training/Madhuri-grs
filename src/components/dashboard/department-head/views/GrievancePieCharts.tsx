"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { DashboardPieChartCard } from "@/components/ui/dashboard-pie-chart";
import { STATUS_COLORS, PRIORITY_COLORS } from "@/lib/constants/chart-colors";
import type { GrievanceItem } from "@/types/department-head";
import { ChartConfig } from "@/components/ui/chart";

export function GrievancePieCharts({ grievances }: { grievances: GrievanceItem[] }) {
  const statusDataRaw = React.useMemo(() => {
    let unassigned = 0;
    let assigned = 0;
    let inProgress = 0;
    let reopened = 0;

    grievances.forEach((g) => {
      if (g.status === "CLOSED" || g.status === "RESOLVED") return;
      if (g.status === "REOPENED") reopened++;
      else if (!g.assignedStaffId || g.status === "SUBMITTED" || g.status === "ROUTED") unassigned++;
      else if (g.status === "ASSIGNED") assigned++;
      else inProgress++;
    });

    return [
      { name: "In Progress", value: inProgress, fill: STATUS_COLORS.IN_PROGRESS, description: "Investigation active" },
      { name: "Assigned", value: assigned, fill: STATUS_COLORS.ASSIGNED, description: "Staff assigned" },
      { name: "Unassigned", value: unassigned, fill: STATUS_COLORS.UNASSIGNED, description: "Needs assignment" },
      { name: "Reopened", value: reopened, fill: STATUS_COLORS.REOPENED, description: "Needs attention" },
    ];
  }, [grievances]);

  const totalActive = React.useMemo(() => statusDataRaw.reduce((acc, curr) => acc + curr.value, 0), [statusDataRaw]);

  const priorityDataRaw = React.useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    grievances.forEach((g) => {
      if (g.status === "CLOSED" || g.status === "RESOLVED") return;
      if (g.priority === "CRITICAL") critical++;
      else if (g.priority === "HIGH") high++;
      else if (g.priority === "MEDIUM") medium++;
      else low++;
    });

    return [
      { name: "Critical", value: critical, fill: PRIORITY_COLORS.CRITICAL, description: "Immediate attention" },
      { name: "High", value: high, fill: PRIORITY_COLORS.HIGH, description: "Early resolution" },
      { name: "Medium", value: medium, fill: PRIORITY_COLORS.MEDIUM, description: "Normal handling" },
      { name: "Low", value: low, fill: PRIORITY_COLORS.LOW, description: "Lower urgency" },
    ];
  }, [grievances]);

  const totalPriority = React.useMemo(() => priorityDataRaw.reduce((acc, curr) => acc + curr.value, 0), [priorityDataRaw]);

  const statusConfig = {
    inProgress: { label: "In Progress", color: STATUS_COLORS.IN_PROGRESS },
    assigned: { label: "Assigned", color: STATUS_COLORS.ASSIGNED },
    unassigned: { label: "Unassigned", color: STATUS_COLORS.UNASSIGNED },
  } satisfies ChartConfig;

  const priorityConfig = {
    critical: { label: "Critical", color: PRIORITY_COLORS.CRITICAL },
    high: { label: "High", color: PRIORITY_COLORS.HIGH },
    medium: { label: "Medium", color: PRIORITY_COLORS.MEDIUM },
    low: { label: "Low", color: PRIORITY_COLORS.LOW },
  } satisfies ChartConfig;



  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <DashboardPieChartCard
        title="Grievance Status Breakdown"
        description="Active grievances by current status"
        data={statusDataRaw}
        config={statusConfig}
        centerValue={totalActive}
      />
      <DashboardPieChartCard
        title="Priority Distribution"
        description="Active grievances by priority level"
        data={priorityDataRaw}
        config={priorityConfig}
        centerValue={totalPriority}
      />
    </div>
  );
}
