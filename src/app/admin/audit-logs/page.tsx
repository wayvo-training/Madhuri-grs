import {
  AdminAuditTrail,
  type SerializedAuditLog,
} from "@/components/dashboard/admin/admin-audit";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function AdminAuditLogsPage() {
  await requirePageRole("ADMIN");

  const [totalCount, sessionCount, apiCount, errorCount, rawAuditLogs] =
    await Promise.all([
      prisma.audit_logs.count(),
      prisma.audit_logs.count({
        where: {
          OR: [
            { entity_type: { in: ["SESSION", "session"] } },
            { action: { contains: "LOGIN", mode: "insensitive" } },
            { action: { contains: "LOGOUT", mode: "insensitive" } },
          ],
        },
      }),
      prisma.audit_logs.count({
        where: {
          OR: [
            { entity_type: { in: ["API_CALL", "api_call"] } },
            { action: { contains: "API_REQUEST", mode: "insensitive" } },
          ],
        },
      }),
      prisma.audit_logs.count({
        where: {
          OR: [
            { entity_type: { in: ["ERROR", "error"] } },
            { action: { contains: "ERROR", mode: "insensitive" } },
            { action: { contains: "FAILED", mode: "insensitive" } },
          ],
        },
      }),
      prisma.audit_logs.findMany({
        take: 10,
        skip: 0,
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

  const serializedAuditLogs: SerializedAuditLog[] = rawAuditLogs.map((l) => {
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
          category?: string;
          method?: string;
          path?: string;
          statusCode?: number;
          durationMs?: number;
          success?: boolean;
          errorMessage?: string;
          fromPath?: string;
          toPath?: string;
          submittedBy?: string;
          submitted_by?: string;
          author?: string;
          staffName?: string;
          headName?: string;
          routed_by_email?: string;
          routed_by?: string;
          created_by?: string;
          updated_by?: string;
          deleted_by?: string;
          reset_by?: string;
          deactivatedBy?: string;
        }
      | null
      | undefined;

    const metaWho = payload?.who;
    const rawFallbackAuthor =
      metaWho?.name ||
      payload?.submittedBy ||
      payload?.submitted_by ||
      payload?.created_by ||
      payload?.updated_by ||
      payload?.deleted_by ||
      payload?.reset_by ||
      payload?.routed_by_email ||
      payload?.routed_by ||
      payload?.deactivatedBy ||
      payload?.author ||
      payload?.headName ||
      payload?.staffName;

    const fallbackAuthorStr =
      typeof rawFallbackAuthor === "string" ? rawFallbackAuthor : undefined;

    const fallbackEmail =
      metaWho?.email ||
      (fallbackAuthorStr?.includes("@") ? fallbackAuthorStr : undefined);

    const isFallbackAdmin =
      fallbackEmail?.toLowerCase().includes("admin") ||
      fallbackAuthorStr?.toLowerCase().includes("admin") ||
      l.action.startsWith("CREATE_") ||
      l.action.startsWith("UPDATE_") ||
      l.action.startsWith("DELETE_") ||
      l.action.startsWith("DEACTIVATE_") ||
      l.action.startsWith("ACTIVATE_") ||
      l.action.includes("ROUTING_EXCEPTION");

    const isSystemEvent =
      l.action.startsWith("SLA_") ||
      l.action.startsWith("AUTO_") ||
      l.action.includes("TIMER") ||
      l.action.startsWith("API_") ||
      l.entity_type === "API_CALL" ||
      l.entity_type === "ERROR";

    return {
      audit_log_id: l.audit_log_id.toString(),
      action: l.action,
      entity_type: l.entity_type,
      entity_id: l.entity_id ? l.entity_id.toString() : null,
      user_name:
        metaWho?.name ||
        (l.users
          ? `${l.users.first_name} ${l.users.last_name || ""}`.trim()
          : fallbackAuthorStr
            ? fallbackAuthorStr
            : isSystemEvent
              ? "System Automated"
              : "System"),
      user_email:
        fallbackEmail ||
        l.users?.email ||
        (isSystemEvent
          ? "system@enterprise.internal"
          : "governance@enterprise.internal"),
      employee_code: metaWho?.employee_code || l.users?.employee_code || null,
      role_name:
        metaWho?.role ||
        l.users?.roles?.role_name ||
        (l.users
          ? "USER"
          : fallbackAuthorStr
            ? isFallbackAdmin
              ? "ADMIN"
              : "STAFF"
            : isSystemEvent
              ? "SYSTEM"
              : "SYSTEM"),
      ip_address: l.ip_address || metaWho?.ip_address || "127.0.0.1",
      user_agent: metaWho?.user_agent || null,
      created_at: l.created_at.toISOString(),
      new_value: l.new_value,
      old_value: l.old_value,
    };
  });

  return (
    <AdminAuditTrail
      initialLogs={serializedAuditLogs}
      initialTotalCount={totalCount}
      stats={{
        total: totalCount,
        sessions: sessionCount,
        apis: apiCount,
        errors: errorCount,
      }}
    />
  );
}
