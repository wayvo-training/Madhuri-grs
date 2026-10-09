import {
  Activity,
  AlertCircle,
  Compass,
  LogIn,
  Server,
  ShieldCheck,
} from "lucide-react";
import type { CategoryTabItem } from "@/types/admin/audit";

export const CATEGORY_TABS: CategoryTabItem[] = [
  { id: "ALL", label: "All Activity", icon: Activity },
  { id: "SESSION", label: "Sessions", icon: LogIn },
  { id: "API", label: "API Calls & Requests", icon: Server },
  { id: "NAVIGATION", label: "Navigation", icon: Compass },
  { id: "ERROR", label: "Errors & Failures", icon: AlertCircle },
  { id: "CONFIG", label: "Governance & Config", icon: ShieldCheck },
];

export const ROLE_BADGE_STYLES: Record<string, string> = {
  ADMIN: "bg-slate-100 text-slate-900 border-slate-300 font-semibold",
  DEPARTMENT_HEAD: "bg-slate-100 text-slate-800 border-slate-200 font-medium",
  STAFF: "bg-slate-50 text-slate-700 border-slate-200",
  END_USER: "bg-slate-50 text-slate-600 border-slate-200",
  SYSTEM: "bg-slate-100 text-slate-700 border-slate-200",
};
