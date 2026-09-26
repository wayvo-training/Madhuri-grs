export interface SerializedAuditLog {
  audit_log_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_name: string;
  user_email: string;
  employee_code?: string | null;
  role_name?: string | null;
  ip_address: string;
  user_agent?: string | null;
  created_at: string;
  new_value: unknown;
  old_value?: unknown;
}

export interface AuditStats {
  total: number;
  sessions: number;
  apis: number;
  errors: number;
}

export interface AdminAuditTrailProps {
  initialLogs: SerializedAuditLog[];
  initialTotalCount?: number;
  stats?: AuditStats;
}

export type TabCategory =
  | "ALL"
  | "SESSION"
  | "API"
  | "NAVIGATION"
  | "ERROR"
  | "CONFIG";

export interface CategoryTabItem {
  id: TabCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}
