export interface SerializedRolePermission {
  permission_id: string;
  permission_code: string;
  permission_name: string;
}

export interface SerializedRole {
  role_id: string;
  role_name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  user_count: number;
  permissions: SerializedRolePermission[];
}

export interface SerializedPermission {
  permission_id: string;
  permission_code: string;
  permission_name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface AdminRolesManagerProps {
  initialRoles: SerializedRole[];
  availablePermissions: SerializedPermission[];
}

export type RoleStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
export type PermStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
export type RoleManagerTab = "roles" | "permissions";
