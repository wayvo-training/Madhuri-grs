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

  const rawAuditLogs = await prisma.audit_logs.findMany({
    take: 100,
    orderBy: { created_at: "desc" },
    include: {
      users: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
  });

  const serializedAuditLogs: SerializedAuditLog[] = rawAuditLogs.map((l) => ({
    audit_log_id: l.audit_log_id.toString(),
    action: l.action,
    entity_type: l.entity_type,
    entity_id: l.entity_id ? l.entity_id.toString() : null,
    user_name: l.users
      ? `${l.users.first_name} ${l.users.last_name || ""}`.trim()
      : "System Automated",
    user_email: l.users?.email || "system@enterprise.internal",
    created_at: l.created_at.toISOString(),
    new_value: l.new_value,
  }));

  return (
    <DashboardShell
      userRole="ADMIN"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Enterprise Audit Trail & Governance Logs"
      subtitle="Immutable record of administrative configurations, policy alterations & security events"
    >
      <AdminAuditTrail initialLogs={serializedAuditLogs} />
    </DashboardShell>
  );
}
