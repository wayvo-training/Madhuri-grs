import {
  AdminMasterRules,
  type SerializedPriorityRule,
  type SerializedReopenPolicy,
  type SerializedRoutingRule,
  type SerializedSlaPolicy,
} from "@/components/dashboard/admin/admin-master-rules";
import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function AdminRulesPage() {
  const user = await requirePageRole("ADMIN");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();

  const [
    rawPriorityRules,
    rawRoutingRules,
    rawSlaPolicies,
    rawReopenPolicies,
    rawCategories,
    departments,
  ] = await Promise.all([
    prisma.priority_rules.findMany({ orderBy: { rule_order: "asc" } }),
    prisma.routing_rules.findMany({
      include: {
        departments: true,
        categories: true,
        subcategories: true,
      },
      orderBy: { rule_order: "asc" },
    }),
    prisma.sla_policies.findMany({
      orderBy: { target_duration_minutes: "asc" },
    }),
    prisma.reopen_policies.findMany({ orderBy: { created_at: "desc" } }),
    prisma.categories.findMany({
      where: { status: "ACTIVE" },
      include: {
        subcategories: {
          where: { status: "ACTIVE" },
          select: { subcategory_id: true, subcategory_name: true },
          orderBy: { subcategory_name: "asc" },
        },
      },
      orderBy: { category_name: "asc" },
    }),
    prisma.departments.findMany({
      where: { status: "ACTIVE" },
      select: {
        department_id: true,
        department_name: true,
      },
      orderBy: { department_name: "asc" },
    }),
  ]);

  const serializedDepartments = departments.map((d) => ({
    department_id: d.department_id.toString(),
    department_name: d.department_name,
  }));

  const serializedPriorityRules: SerializedPriorityRule[] =
    rawPriorityRules.map((r) => ({
      priority_rule_id: r.priority_rule_id.toString(),
      rule_name: r.rule_name,
      priority_level: r.priority_level,
      rule_order: r.rule_order,
      is_default: r.is_default,
      status: r.status,
      conditions: r.conditions,
    }));

  const serializedRoutingRules: SerializedRoutingRule[] = rawRoutingRules.map(
    (r) => ({
      routing_rule_id: r.routing_rule_id.toString(),
      rule_name: r.rule_name,
      category_name: r.categories?.category_name || null,
      subcategory_name: r.subcategories?.subcategory_name || null,
      department_name: r.departments.department_name,
      involvement_type: r.involvement_type,
      rule_order: r.rule_order,
      status: r.status,
      conditions: r.conditions,
    }),
  );

  const serializedSlaPolicies: SerializedSlaPolicy[] = rawSlaPolicies.map(
    (s) => ({
      sla_policy_id: s.sla_policy_id.toString(),
      policy_name: s.policy_name,
      priority_level: s.priority_level,
      sla_type: s.sla_type,
      target_duration_minutes: s.target_duration_minutes,
      warning_threshold_percent: s.warning_threshold_percent.toString(),
      escalation_threshold_percent: s.escalation_threshold_percent.toString(),
      target_role: s.target_role,
      status: s.status,
    }),
  );

  const serializedReopenPolicies: SerializedReopenPolicy[] =
    rawReopenPolicies.map((p) => ({
      reopen_policy_id: p.reopen_policy_id.toString(),
      policy_name: p.policy_name,
      reopen_window_hours: p.reopen_window_hours,
      max_reopen_count: p.max_reopen_count,
      max_manual_review_count: p.max_manual_review_count,
      status: p.status,
    }));

  const serializedCategories = rawCategories.map((c) => ({
    category_id: c.category_id.toString(),
    category_name: c.category_name,
    subcategories: c.subcategories.map((s) => ({
      subcategory_id: s.subcategory_id.toString(),
      subcategory_name: s.subcategory_name,
    })),
  }));

  return (
    <DashboardShell
      userRole="ADMIN"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Master Governance & Rules Engine"
      subtitle="Automated priority calculation, department routing, SLA compliance & simulation"
    >
      <AdminMasterRules
        priorityRules={serializedPriorityRules}
        routingRules={serializedRoutingRules}
        slaPolicies={serializedSlaPolicies}
        reopenPolicies={serializedReopenPolicies}
        departments={serializedDepartments}
        categories={serializedCategories}
      />
    </DashboardShell>
  );
}
