import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Sliders,
  User,
  Users,
  MessageSquare,
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
        {
          title: "Messages",
          href: "/admin/messages",
          icon: MessageSquare,
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
        {
          title: "Grievance Queue",
          href: "/department-head/dashboard#queue",
          icon: FileText,
        },
        {
          title: "Messages",
          href: "/department-head/messages",
          icon: MessageSquare,
        },
      ],
    },
    {
      label: "Team & Performance",
      items: [
        {
          title: "Staff Workload",
          href: "/department-head/dashboard#staff",
          icon: Users,
        },
        {
          title: "SLA & Escalations",
          href: "/department-head/dashboard#sla",
          icon: AlertTriangle,
        },
        {
          title: "Activity",
          href: "/department-head/dashboard#activity",
          icon: Activity,
        },
      ],
    },
  ],

  STAFF: [
    {
      label: "Work",
      items: [
        {
          title: "Dashboard",
          href: "/staff/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "My Grievances",
          href: "/staff/dashboard#queue",
          icon: FileText,
        },
        {
          title: "Messages",
          href: "/staff/messages",
          icon: MessageSquare,
        },
      ],
    },
    {
      label: "Processing",
      items: [
        {
          title: "Activity",
          href: "/staff/dashboard#activity",
          icon: Activity,
        },
      ],
    },
    {
      label: "Other",
      items: [
        {
          title: "Profile",
          href: "/staff/dashboard#profile",
          icon: User,
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
          href: "/end-user/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "My Grievances",
          href: "/end-user/grievances",
          icon: FileText,
        },
        {
          title: "Track Grievance",
          href: "/end-user/track",
          icon: Search,
        }
      ],
    },
    {
      label: "Account",
      items: [
        {
          title: "Messages",
          href: "/end-user/messages",
          icon: MessageSquare,
        }
      ]
    }
  ],
};
