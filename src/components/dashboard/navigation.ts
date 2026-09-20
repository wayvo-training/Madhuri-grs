import {
  Building2,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  Sliders,
  Users,
} from "lucide-react";
import type { ElementType } from "react";
import type { PermissionCode } from "@/lib/permissions";

export interface NavItem {
  title: string;
  href: string;
  icon: ElementType;
  badge?: string;
  requiredPermission?: PermissionCode;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export type UserRole = "ADMIN" | "DEPARTMENT_HEAD" | "STAFF" | "END_USER";

/**
 * Role-based navigation matrix adhering strictly to GRS domain specifications.
 */
export const ROLE_NAVIGATION: Record<UserRole, NavGroup[]> = {
  ADMIN: [
    {
      label: "System Oversight",
      items: [
        {
          title: "Executive Overview",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Grievances & Exceptions",
          href: "/admin/grievances",
          icon: FileText,
        },
      ],
    },
    {
      label: "Master Configuration",
      items: [
        {
          title: "Departments",
          href: "/admin/departments",
          icon: Building2,
          requiredPermission: "MANAGE_RULES",
        },
        {
          title: "Master Rules & SLA",
          href: "/admin/rules",
          icon: Sliders,
          requiredPermission: "MANAGE_RULES",
        },
      ],
    },
    {
      label: "Administration",
      items: [
        {
          title: "User Directory",
          href: "/admin/users",
          icon: Users,
          requiredPermission: "MANAGE_USERS",
        },
        {
          title: "Roles & Permissions",
          href: "/admin/roles",
          icon: ShieldCheck,
          requiredPermission: "MANAGE_USERS",
        },
        {
          title: "Audit Trail",
          href: "/admin/audit-logs",
          icon: ShieldCheck,
          requiredPermission: "VIEW_REPORTS",
        },
      ],
    },
  ],

  DEPARTMENT_HEAD: [
    {
      label: "Department Operations",
      items: [
        {
          title: "Department Overview",
          href: "/department-head/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
  ],

  STAFF: [
    {
      label: "Staff Workspace",
      items: [
        {
          title: "Staff Overview",
          href: "/staff/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
  ],

  END_USER: [
    {
      label: "Grievance Portal",
      items: [
        {
          title: "Portal Overview",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
  ],
};
