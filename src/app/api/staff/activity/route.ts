import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveStaffAuth } from "@/lib/staff/permissions";
import {
  formatAuditActionTitle,
  formatRelativeTime,
  isStaffRelevantAuditAction,
} from "@/lib/staff/utils";
import type { StaffAuditItem } from "@/types/staff";

export async function GET(req: NextRequest) {
  try {
    const authResult = await resolveStaffAuth(req);
    if ("error" in authResult) return authResult.error;
    const { staffId } = authResult;

    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search")?.toLowerCase().trim();
    const actionFilter = searchParams.get("action");

    // 1. Get all grievance IDs assigned to this staff member
    const assignments = await prisma.assignments.findMany({
      where: {
        staff_id: staffId,
      },
      select: {
        grievance_id: true,
      },
    });

    const assignedGrievanceIds = assignments.map((a) => a.grievance_id);

    // 2. Fetch audit logs strictly for assigned grievances or where this staff is the actor
    const logs = await prisma.audit_logs.findMany({
      where: {
        OR: [
          { grievance_id: { in: assignedGrievanceIds } },
          { user_id: staffId },
        ],
        action: {
          notIn: [
            "PAGE_NAVIGATION",
            "LOGIN_SUCCESS",
            "LOGIN_FAILED",
            "SESSION_CREATED",
          ],
        },
      },
      include: {
        grievances: {
          select: {
            grievance_number: true,
            title: true,
          },
        },
        users: {
          select: {
            first_name: true,
            last_name: true,
            roles: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 100,
    });

    // 3. Filter for genuine GRS staff-relevant actions only
    const filteredLogs = logs.filter((log) =>
      isStaffRelevantAuditAction(log.action),
    );

    const activities: StaffAuditItem[] = filteredLogs
      .map((log) => {
        const actorName = log.users
          ? `${log.users.first_name} ${log.users.last_name || ""}`.trim()
          : "System";

        const logVal = log.new_value as {
          details?: string;
          note?: string;
        } | null;

        const details =
          logVal?.details || logVal?.note || formatAuditActionTitle(log.action);

        return {
          id: log.audit_log_id.toString(),
          action: formatAuditActionTitle(log.action),
          details,
          actor: actorName,
          timestamp: log.created_at.toISOString(),
          relativeTime: formatRelativeTime(log.created_at),
          grievanceNumber: log.grievances?.grievance_number,
        };
      })
      .filter((item) => {
        if (actionFilter && item.action !== actionFilter) {
          return false;
        }
        if (searchQuery) {
          const matchAction = item.action.toLowerCase().includes(searchQuery);
          const matchDetails = item.details.toLowerCase().includes(searchQuery);
          const matchActor = item.actor.toLowerCase().includes(searchQuery);
          const matchGrievance = item.grievanceNumber
            ?.toLowerCase()
            .includes(searchQuery);
          return matchAction || matchDetails || matchActor || matchGrievance;
        }
        return true;
      });

    return NextResponse.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error("Error in /api/staff/activity:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load staff activity log" },
      { status: 500 },
    );
  }
}
