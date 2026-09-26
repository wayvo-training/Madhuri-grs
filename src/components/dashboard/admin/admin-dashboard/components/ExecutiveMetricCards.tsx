import { AlertTriangle, Clock, FileText, ShieldCheck } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";

export interface ExecutiveMetricCardsProps {
  totalGrievances: number;
  activeGrievances: number;
  atRiskSlaCount: number;
  escalatedCount: number;
  resolutionRate: string;
  closedCount: number;
}

export function ExecutiveMetricCards({
  totalGrievances,
  activeGrievances,
  atRiskSlaCount,
  escalatedCount,
  resolutionRate,
  closedCount,
}: ExecutiveMetricCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Raised"
        value={totalGrievances}
        icon={FileText}
        accentColor="slate"
        description="All-time registered grievances"
      />

      <StatCard
        label="Active Workload"
        value={activeGrievances}
        icon={Clock}
        accentColor="slate"
        description="Currently in progress or triage"
      />

      <StatCard
        label="SLA At Risk / Breached"
        value={atRiskSlaCount}
        icon={AlertTriangle}
        accentColor={atRiskSlaCount > 0 ? "amber" : "slate"}
        description={`${escalatedCount} escalated ticket(s)`}
      />

      <StatCard
        label="Resolution Rate"
        value={`${resolutionRate}%`}
        icon={ShieldCheck}
        accentColor="emerald"
        description={`${closedCount} resolved & closed`}
      />
    </div>
  );
}
