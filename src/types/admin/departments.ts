export interface SerializedDepartment {
  department_id: string;
  department_name: string;
  description?: string | null;
  status?: string;
  user_count?: number;
  grievance_count: number;
}

export interface DepartmentHeadOption {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface DepartmentStats {
  total: number;
  active: number;
  inactive: number;
  totalGrievances: number;
}

export interface AdminDepartmentsProps {
  initialDepartments: SerializedDepartment[];
  departmentHeads?: DepartmentHeadOption[];
  totalGrievances: number;
  stats?: DepartmentStats;
}

export type DepartmentStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
