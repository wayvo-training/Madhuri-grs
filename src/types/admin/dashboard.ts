export interface DashboardDepartmentSummary {
  department_id: string;
  department_name: string;
  status: string;
  user_count: number;
  grievance_count: number;
}

export interface DashboardRecentGrievance {
  grievance_id: string;
  grievance_number: string;
  title: string;
  priority: string;
  status: string;
  created_at: string;
  submitter_name: string;
  department_name: string | null;
  category_name?: string | null;
}

export interface AdminDashboardProps {
  totalGrievances: number;
  activeGrievances: number;
  escalatedCount: number;
  closedCount: number;
  atRiskSlaCount: number;
  routingExceptionsCount: number;
  resolutionRate: string;
  departments: DashboardDepartmentSummary[];
  recentGrievances: DashboardRecentGrievance[];
}
