export const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "#2563EB",
  ASSIGNED: "#0D9488",
  UNDER_REVIEW: "#7C3AED",
  REOPENED: "#E11D48",
  UNASSIGNED: "#9333EA",
  BLOCKED: "#F59E0B",
  CLOSED: "#64748B",
  RESOLVED: "#059669",
  AWAITING_INFO: "#D97706",
  ESCALATED: "#B45309",
};

export const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "#E11D48",
  HIGH: "#D97706",
  MEDIUM: "#2563EB",
  LOW: "#059669",
};

export const SLA_COLORS: Record<string, string> = {
  ON_TRACK: "#059669",
  AT_RISK: "#D97706",
  BREACHED: "#E11D48",
};
