import {
  AdminAuditTrail,
  type SerializedAuditLog,
} from "@/components/dashboard/admin/admin-audit-trail";
import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function AdminAuditLogsPage() {
  const user = await requirePageRole("ADMIN");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  const [totalCount, sessionCount, apiCount, errorCount, rawAuditLogs] =
    await Promise.all([
      prisma.audit_logs.count(),
      prisma.audit_logs.count({
        where: {
          OR: [
            { entity_type: "SESSION" },
            { action: { contains: "LOGIN", mode: "insensitive" } },
            { action: { contains: "LOGOUT", mode: "insensitive" } },
          ],
        },
      }),
      prisma.audit_logs.count({
        where: {
          OR: [
            { entity_type: "API_CALL" },
            { action: { contains: "API_REQUEST", mode: "insensitive" } },
          ],
        },
      }),
      prisma.audit_logs.count({
        where: {
          OR: [
            { entity_type: "ERROR" },
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

  return (
    <DashboardShell
      userRole="ADMIN"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Enterprise Audit Trail & Observability Logs"
      subtitle="Comprehensive ledger of user sessions, API calls, errors, navigation, and administrative governance"
    >
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
    </DashboardShell>
  );
}
