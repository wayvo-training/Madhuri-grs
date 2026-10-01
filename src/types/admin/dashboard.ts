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
  routingExceptionsCount: number;
  departments: DashboardDepartmentSummary[];
  recentGrievances: DashboardRecentGrievance[];
  pieCharts: {
    statusData: {
      name: string;
      value: number;
      fill: string;
      description: string;
    }[];
    priorityData: {
      name: string;
      value: number;
      fill: string;
      description: string;
    }[];
    slaData: {
      name: string;
      value: number;
      fill: string;
      description: string;
    }[];
    totalActive: number;
    totalPriority: number;
    totalSla: number;
  };
}
