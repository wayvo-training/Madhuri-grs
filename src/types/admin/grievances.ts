export interface SupportingDepartment {
  department_id: string;
  department_name: string;
}

export interface SerializedGrievance {
  grievance_id: string;
  grievance_number: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  sla_status: string | null;
  due_at: string | null;
  created_at: string;
  category_name: string;
  subcategory_name: string;
  submitted_by_name: string;
  submitted_by_email: string;
  department_name: string | null;
  supporting_departments?: SupportingDepartment[];
  reopen_count: number;
  manual_review_count: number;
}

export interface TabCounts {
  all: number;
  exceptions: number;
  active: number;
  slaRisk: number;
  closed: number;
}

export type TableTab = "ALL" | "EXCEPTIONS" | "ACTIVE" | "SLA_RISK" | "CLOSED";

export interface DepartmentOption {
  department_id: string;
  department_name: string;
  grievance_count?: number;
}

export interface AdminGrievanceTableProps {
  initialGrievances: SerializedGrievance[];
  initialTotalCount?: number;
  initialCounts?: TabCounts;
  departments: DepartmentOption[];
}
