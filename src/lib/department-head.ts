import { NextResponse } from "next/server";
import type { AuthUser } from "@/lib/auth";
import { DEFAULT_SLA_DURATIONS_MINUTES } from "@/lib/constants/sla";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export interface DepartmentHeadAuthSuccess {
  user: AuthUser;
  departmentId: bigint;
  department: {
    department_id: bigint;
    department_name: string;
    description: string | null;
  };
  isAdmin: boolean;
}

export type DepartmentHeadAuthResult =
  | DepartmentHeadAuthSuccess
  | { error: NextResponse };

/**
 * Validates Department Head (or Admin preview) authentication and resolves target department.
 */
export async function resolveDepartmentHeadAuth(
  request: Request,
): Promise<DepartmentHeadAuthResult> {
  const auth = await authorizeApi({ role: ["DEPARTMENT_HEAD", "ADMIN"] });
  if ("error" in auth) {
    return { error: auth.error };
  }

  const { user } = auth;
  const isAdmin = user.roles.role_name === "ADMIN";

  let deptId: bigint | null = user.department_id
    ? BigInt(user.department_id)
    : null;

  if (isAdmin) {
    const { searchParams } = new URL(request.url);
    const queryDept = searchParams.get("deptId");
    if (queryDept) {
      try {
        deptId = BigInt(queryDept);
      } catch {
        // Invalid deptId provided, fall back
      }
    }
  }

  // If no department is set on user (or admin without query param), pick first available department
  let dept = deptId
    ? await prisma.departments.findUnique({
        where: { department_id: deptId },
        select: {
          department_id: true,
          department_name: true,
          description: true,
        },
      })
    : null;

  if (!dept) {
    // Default to first department in database
    dept = await prisma.departments.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { department_id: "asc" },
      select: {
        department_id: true,
        department_name: true,
        description: true,
      },
    });
  }

  if (!dept) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: "No active department found in system",
        },
        { status: 404 },
      ),
    };
  }

  return {
    user,
    departmentId: dept.department_id,
    department: dept,
    isAdmin,
  };
}

/**
 * Calculates human-friendly SLA time remaining or breach duration.
 */
export function formatSlaTimeLeft(
  dueAt: Date | null,
  slaStatus: string | null,
  priority?: string,
  createdAt?: Date | null,
  isPaused: boolean = false,
  pausedAt?: Date | null,
): string {
  let effectiveDue = dueAt;
  if (!effectiveDue && createdAt && priority) {
    const mins =
      DEFAULT_SLA_DURATIONS_MINUTES[priority.toUpperCase()] ||
      DEFAULT_SLA_DURATIONS_MINUTES.MEDIUM;
    effectiveDue = new Date(new Date(createdAt).getTime() + mins * 60 * 1000);
  }

  if (!effectiveDue) return "Within SLA";
  const now = new Date();
  const effectiveNow = isPaused ? (pausedAt ? new Date(pausedAt) : now) : now;
  const diffMs = effectiveDue.getTime() - effectiveNow.getTime();

  if (!isPaused && (diffMs <= 0 || slaStatus === "BREACHED")) {
    const elapsedMinutes = Math.abs(Math.floor(diffMs / (1000 * 60)));
    const hours = Math.floor(elapsedMinutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `Breached ${days}d ago`;
    if (hours > 0) return `Breached ${hours}h ago`;
    return `Breached ${elapsedMinutes}m ago`;
  }

  const remainingMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  const remainingHours = Math.floor(remainingMinutes / 60);
  const remainingDays = Math.floor(remainingHours / 24);

  let formatted = "";
  if (remainingDays > 0) {
    const remHours = remainingHours % 24;
    formatted =
      remHours > 0
        ? `${remainingDays}d ${remHours}h left`
        : `${remainingDays}d left`;
  } else if (remainingHours > 0) {
    const remMins = remainingMinutes % 60;
    formatted = `${remainingHours}h ${remMins}m left`;
  } else {
    formatted = `${remainingMinutes}m left`;
  }

  return isPaused ? `${formatted} (Paused)` : formatted;
}

/**
 * Formats a Date to a human readable string (e.g., "18 Sep 2026, 05:43 PM")
 */
export function formatFriendlyDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Relative time helper (e.g., "12m ago", "2h ago", "1d ago")
 */
export function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return "Recently";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
