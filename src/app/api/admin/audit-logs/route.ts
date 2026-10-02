import { NextResponse } from "next/server";
import { getPaginationParams, paginatedJsonResponse } from "@/lib/pagination";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(request, 10);

    const search = searchParams.get("search")?.trim();
    const category = searchParams.get("category")?.trim().toUpperCase();

    // Build dynamic Prisma where conditions
    const conditions: Record<string, unknown>[] = [];

    // Category filtering
    if (category && category !== "ALL") {
      if (category === "SESSION") {
        conditions.push({
          OR: [
            { entity_type: "SESSION" },
            { action: { contains: "LOGIN", mode: "insensitive" } },
            { action: { contains: "LOGOUT", mode: "insensitive" } },
          ],
        });
      } else if (category === "API") {
        conditions.push({
          OR: [
            { entity_type: "API_CALL" },
            { action: { contains: "API_REQUEST", mode: "insensitive" } },
          ],
        });
      } else if (category === "NAVIGATION") {
        conditions.push({
          OR: [
            { entity_type: "NAVIGATION" },
            { action: { contains: "NAVIGATION", mode: "insensitive" } },
          ],
        });
      } else if (category === "ERROR") {
        conditions.push({
          OR: [
            { entity_type: "ERROR" },
            { action: { contains: "ERROR", mode: "insensitive" } },
            { action: { contains: "FAILED", mode: "insensitive" } },
          ],
        });
      } else if (category === "CONFIG") {
        conditions.push({
          entity_type: {
            notIn: ["SESSION", "API_CALL", "NAVIGATION"],
          },
        });
      }
    }

    // Search filtering
    if (search) {
      conditions.push({
        OR: [
          { action: { contains: search, mode: "insensitive" } },
          { entity_type: { contains: search, mode: "insensitive" } },
          { ip_address: { contains: search, mode: "insensitive" } },
          {
            users: {
              OR: [
                { first_name: { contains: search, mode: "insensitive" } },
                { last_name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { employee_code: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const [total, rawAuditLogs] = await Promise.all([
      prisma.audit_logs.count({ where }),
      prisma.audit_logs.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          users: {
            select: {
              user_id: true,
              employee_code: true,
              first_name: true,
              last_name: true,
              email: true,
              roles: {
                select: {
                  role_name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const logs = rawAuditLogs.map((l) => {
      const payload = l.new_value as
        | {
            who?: {
              name?: string;
              email?: string;
              employee_code?: string;
              role?: string;
              ip_address?: string;
              user_agent?: string;
            };
          }
        | null
        | undefined;

      const metaWho = payload?.who;

      return {
        audit_log_id: l.audit_log_id.toString(),
        action: l.action,
        entity_type: l.entity_type,
        entity_id: l.entity_id ? l.entity_id.toString() : null,
        user_name:
          metaWho?.name ||
          (l.users
            ? `${l.users.first_name} ${l.users.last_name || ""}`.trim()
            : "System Automated"),
        user_email:
          metaWho?.email || l.users?.email || "system@enterprise.internal",
        employee_code: metaWho?.employee_code || l.users?.employee_code || null,
        role_name:
          metaWho?.role ||
          l.users?.roles?.role_name ||
          (l.users ? "USER" : "SYSTEM"),
        ip_address: l.ip_address || metaWho?.ip_address || "127.0.0.1",
        user_agent: metaWho?.user_agent || null,
        created_at: l.created_at.toISOString(),
        new_value: l.new_value,
        old_value: l.old_value,
      };
    });

    return paginatedJsonResponse("logs", logs, total, page, limit);
  } catch (error) {
    console.error("Failed to fetch paginated audit logs:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error fetching audit logs" },
      { status: 500 },
    );
  }
}
