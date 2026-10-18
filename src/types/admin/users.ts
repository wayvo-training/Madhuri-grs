export interface SerializedUser {
  user_id: string;
  employee_code: string;
  first_name: string;
  last_name: string | null;
  email: string;
  role_id: string;
  role_name: string;
  department_id: string | null;
  department_name: string | null;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  created_at: string;
  assigned_grievances_count: number;
  filed_grievances_count: number;
}

export interface UserRoleOption {
  role_id: string;
  role_name: string;
  description: string | null;
  status?: string;
}

export interface UserDepartmentOption {
  department_id: string;
  department_name: string;
  status?: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  admins: number;
  departmentHeads: number;
  staff: number;
  endUsers: number;
}

export interface AdminUsersProps {
  initialUsers: SerializedUser[];
  availableRoles: UserRoleOption[];
  availableDepartments: UserDepartmentOption[];
  stats: UserStats;
}

export type UserStatusFilter = "ALL" | "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type UserRoleFilter =
  | "ALL"
  | "ADMIN"
  | "DEPARTMENT_HEAD"
  | "STAFF"
  | "END_USER"
  | string;
