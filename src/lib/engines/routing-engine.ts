import type { Prisma } from "@prisma/client";
import { DEFAULT_ROUTING_CONFIG } from "@/lib/constants/routing";
import { DEFAULT_SLA_DURATIONS_MINUTES } from "@/lib/constants/sla";
import { prisma } from "@/lib/prisma";
import type { DepartmentDependencyNode } from "@/lib/validations/dependency-graph";

export interface MdiDepartmentOptions {
  involvementType: "PRIMARY" | "SUPPORTING" | "EQUAL";
  dependencyType?: "PARALLEL" | "SEQUENTIAL";
  executionOrder?: number;
  prerequisiteDepartmentIds?: (bigint | number | string)[];
  slaPercentAllocation?: number;
  allocatedDurationMinutes?: number | null;
  dueAt?: Date | null;
  status?: string;
  activatedAt?: Date | null;
  assignedAt?: Date | null;
}

/**
 * Builds the standard MDI data structure for grievance_departments records.
 */
export function buildDepartmentMdiData(
  departmentId: bigint,
  options: MdiDepartmentOptions,
) {
  const isSequential = options.dependencyType === "SEQUENTIAL";
  const hasPrereqs = (options.prerequisiteDepartmentIds?.length ?? 0) > 0;
  const isBlocked =
    options.status === "BLOCKED" || (isSequential && hasPrereqs);

  const activatedAt = isBlocked
    ? null
    : options.activatedAt !== undefined
      ? options.activatedAt
      : new Date();

  return {
    department_id: departmentId,
    involvement_type: options.involvementType,
    status: options.status ?? (isBlocked ? "BLOCKED" : "PENDING_ASSIGNMENT"),
    assigned_at: options.assignedAt ?? new Date(),
    allocated_duration_minutes: options.allocatedDurationMinutes ?? null,
    sla_percent_allocation:
      options.slaPercentAllocation ??
      DEFAULT_ROUTING_CONFIG.DEFAULT_SLA_PERCENT,
    due_at: isBlocked ? null : (options.dueAt ?? null),
    sla_status: "ON_TRACK",
    dependency_type: options.dependencyType ?? "PARALLEL",
    prerequisite_department_ids: options.prerequisiteDepartmentIds
      ? options.prerequisiteDepartmentIds.map((id) => Number(id))
      : [],
    execution_order:
      options.executionOrder ?? DEFAULT_ROUTING_CONFIG.DEFAULT_EXECUTION_ORDER,
    activated_at: activatedAt,
  };
}

/**
 * Calculates the allocated duration in minutes and percent allocation for a department.
 * Supports explicit durations, percentage-based allocations, and safe fallbacks.
 * Does not assume equal distribution or hardcoded percentages.
 */
export function calculateDepartmentSlaDuration(
  totalBudgetMinutes: number,
  config?: {
    allocated_duration_minutes?: number | null;
    allocatedDurationMinutes?: number | null;
    sla_percent_allocation?: number | null;
    slaPercentAllocation?: number | null;
  },
): {
  allocatedDurationMinutes: number;
  slaPercentAllocation: number;
} {
  const explicitDuration =
    config?.allocatedDurationMinutes ?? config?.allocated_duration_minutes;
  const explicitPercent =
    config?.slaPercentAllocation ?? config?.sla_percent_allocation;

  // 1. Explicit duration takes precedence if provided and positive
  if (
    explicitDuration !== undefined &&
    explicitDuration !== null &&
    Number.isFinite(Number(explicitDuration)) &&
    Number(explicitDuration) > 0
  ) {
    const mins = Math.round(Number(explicitDuration));
    const percent =
      totalBudgetMinutes > 0
        ? Math.min(Math.round((mins / totalBudgetMinutes) * 1000) / 10, 100.0)
        : 100.0;
    return {
      allocatedDurationMinutes: mins,
      slaPercentAllocation: explicitPercent ?? percent,
    };
  }

  // 2. Percentage-based allocation if provided and positive
  if (
    explicitPercent !== undefined &&
    explicitPercent !== null &&
    Number.isFinite(Number(explicitPercent)) &&
    Number(explicitPercent) > 0
  ) {
    const percent = Number(explicitPercent);
    const mins = Math.max(1, Math.round((totalBudgetMinutes * percent) / 100));
    return {
      allocatedDurationMinutes: mins,
      slaPercentAllocation: percent,
    };
  }

  // 3. Fallback: full overall budget duration
  return {
    allocatedDurationMinutes: totalBudgetMinutes,
    slaPercentAllocation: DEFAULT_ROUTING_CONFIG.DEFAULT_SLA_PERCENT,
  };
}

/**
 * Calculates a department's deadline capped strictly by the overall grievance deadline.
 * Department SLA clock starts strictly at activated_at.
 * Blocked departments return null.
 */
export function calculateDepartmentDeadline(
  activatedAt: Date | null,
  allocatedDurationMinutes: number,
  grievanceDueAt: Date | null,
): Date | null {
  if (!activatedAt) {
    return null;
  }

  const durationMs = allocatedDurationMinutes * 60 * 1000;
  const targetEnd = new Date(activatedAt.getTime() + durationMs);

  // Department deadline must never exceed overall grievance deadline.
  // Only an authorized Department Head intervention (EXTEND_SLA) can formally extend the deadline.
  if (grievanceDueAt && targetEnd > grievanceDueAt) {
    return grievanceDueAt;
  }

  return targetEnd;
}

export interface RoutingCalculationInput {
  categoryId?: bigint | number | string | null;
  subcategoryId?: bigint | number | string | null;
}

export interface RoutingCalculationResult {
  departmentId: bigint;
  departmentName?: string;
  involvementType: "PRIMARY" | "SUPPORTING" | "EQUAL";
  supportingDepartments: string[];
  supportingDepartmentIds: bigint[];
  dependencyType?: "PARALLEL" | "SEQUENTIAL";
  dependencies?: DepartmentDependencyNode[];
  routingRuleId: bigint;
  matchedRuleName: string;
  matchType: "EXACT_SUBCATEGORY" | "CATEGORY_FALLBACK";
}

/**
 * Resolves supporting department names and IDs from rule JSON metadata against active departments,
 * ensuring the primary department is excluded and duplicates are stripped.
 */
function resolveSupportingDepartments(
  rawSupporting: unknown,
  primaryDeptId: bigint,
  activeDepartments: { department_id: bigint; department_name: string }[],
): { names: string[]; ids: bigint[] } {
  if (!Array.isArray(rawSupporting)) {
    return { names: [], ids: [] };
  }

  const names: string[] = [];
  const ids: bigint[] = [];

  for (const item of rawSupporting) {
    if (!item) continue;
    const str = String(item).trim();
    const matched = activeDepartments.find(
      (d) =>
        d.department_name.toLowerCase() === str.toLowerCase() ||
        d.department_id.toString() === str,
    );

    if (
      matched &&
      matched.department_id !== primaryDeptId &&
      !ids.includes(matched.department_id)
    ) {
      ids.push(matched.department_id);
      names.push(matched.department_name);
    }
  }

  return { names, ids };
}

/**
 * Evaluates routing rules against a Category + Subcategory combination.
 *
 * Rules:
 * 1. Every grievance must have a Category and Subcategory selected.
 * 2. Subcategory must strictly belong to the selected Category.
 * 3. Exact match on (Category + Subcategory) takes precedence (ordered by rule_order ASC).
 * 4. Fallback match on Category (subcategory_id is null) is evaluated next.
 * 5. If no active rule matches -> Returns null (Grievance enters Manual Routing Queue).
 */
export async function determineDepartmentRouting(
  input: RoutingCalculationInput,
): Promise<RoutingCalculationResult | null> {
  if (!input.categoryId || !input.subcategoryId) {
    // Missing category or subcategory -> Cannot auto-route, enters Manual Routing Queue
    return null;
  }

  const catId = BigInt(input.categoryId);
  const subcatId = BigInt(input.subcategoryId);

  // Validate that subcategory strictly belongs to the specified category
  const subcategory = await prisma.subcategories.findUnique({
    where: { subcategory_id: subcatId },
    select: { category_id: true, status: true },
  });

  if (subcategory?.status !== "ACTIVE" || subcategory?.category_id !== catId) {
    // Subcategory mismatch or inactive -> Route to Manual Routing Queue
    return null;
  }

  // Fetch active departments to resolve supporting department IDs
  const activeDepartments = await prisma.departments.findMany({
    where: { status: "ACTIVE" },
    select: { department_id: true, department_name: true },
  });
  const activeDeptIdSet = new Set(
    activeDepartments.map((d) => d.department_id.toString()),
  );

  // Fetch active routing rules ordered by rule_order ASC with department details
  const allActiveRules = await prisma.routing_rules.findMany({
    where: { status: "ACTIVE" },
    include: {
      departments: {
        select: { department_name: true },
      },
    },
    orderBy: { rule_order: "asc" },
  });

  // Only consider rules whose target primary department is currently active
  const activeRules = allActiveRules.filter(
    (r) => r.department_id && activeDeptIdSet.has(r.department_id.toString()),
  );

  // Step 1: Exact match on Category + Subcategory
  const exactMatch = activeRules.find(
    (r) => r.category_id === catId && r.subcategory_id === subcatId,
  );

  if (exactMatch) {
    const { names: suppNames, ids: suppIds } = resolveSupportingDepartments(
      exactMatch.supporting_departments,
      exactMatch.department_id,
      activeDepartments,
    );

    return {
      departmentId: exactMatch.department_id,
      departmentName: exactMatch.departments.department_name,
      involvementType:
        (exactMatch.involvement_type as "PRIMARY" | "SUPPORTING" | "EQUAL") ||
        "PRIMARY",
      supportingDepartments: suppNames,
      supportingDepartmentIds: suppIds,
      dependencyType:
        (
          exactMatch.conditions as {
            dependency_type?: "PARALLEL" | "SEQUENTIAL";
          }
        )?.dependency_type || "PARALLEL",
      dependencies:
        (
          exactMatch.conditions as {
            dependencies?: DepartmentDependencyNode[];
          }
        )?.dependencies || undefined,
      routingRuleId: exactMatch.routing_rule_id,
      matchedRuleName: exactMatch.rule_name,
      matchType: "EXACT_SUBCATEGORY",
    };
  }

  // Step 2: Fallback to Category only (rule has category_id matched and subcategory_id is null)
  const categoryMatch = activeRules.find(
    (r) => r.category_id === catId && r.subcategory_id === null,
  );

  if (categoryMatch) {
    const { names: suppNames, ids: suppIds } = resolveSupportingDepartments(
      categoryMatch.supporting_departments,
      categoryMatch.department_id,
      activeDepartments,
    );

    return {
      departmentId: categoryMatch.department_id,
      departmentName: categoryMatch.departments.department_name,
      involvementType:
        (categoryMatch.involvement_type as
          | "PRIMARY"
          | "SUPPORTING"
          | "EQUAL") || "PRIMARY",
      supportingDepartments: suppNames,
      supportingDepartmentIds: suppIds,
      dependencyType:
        (
          categoryMatch.conditions as {
            dependency_type?: "PARALLEL" | "SEQUENTIAL";
          }
        )?.dependency_type || "PARALLEL",
      dependencies:
        (
          categoryMatch.conditions as {
            dependencies?: DepartmentDependencyNode[];
          }
        )?.dependencies || undefined,
      routingRuleId: categoryMatch.routing_rule_id,
      matchedRuleName: categoryMatch.rule_name,
      matchType: "CATEGORY_FALLBACK",
    };
  }

  // Step 3: Global fallback rule (category_id is null and subcategory_id is null)
  const globalMatch = activeRules.find(
    (r) => r.category_id === null && r.subcategory_id === null,
  );

  if (globalMatch) {
    const { names: suppNames, ids: suppIds } = resolveSupportingDepartments(
      globalMatch.supporting_departments,
      globalMatch.department_id,
      activeDepartments,
    );

    return {
      departmentId: globalMatch.department_id,
      departmentName: globalMatch.departments.department_name,
      involvementType:
        (globalMatch.involvement_type as "PRIMARY" | "SUPPORTING" | "EQUAL") ||
        "PRIMARY",
      supportingDepartments: suppNames,
      supportingDepartmentIds: suppIds,
      dependencyType:
        (
          globalMatch.conditions as {
            dependency_type?: "PARALLEL" | "SEQUENTIAL";
          }
        )?.dependency_type || "PARALLEL",
      dependencies:
        (
          globalMatch.conditions as {
            dependencies?: DepartmentDependencyNode[];
          }
        )?.dependencies || undefined,
      routingRuleId: globalMatch.routing_rule_id,
      matchedRuleName: globalMatch.rule_name,
      matchType: "CATEGORY_FALLBACK",
    };
  }

  // Step 4: No active routing rule matched -> Returns null for Manual Routing Queue
  return null;
}

/**
 * Automatically populates grievance_departments in PostgreSQL with PRIMARY/EQUAL
 * entry and multiple SUPPORTING/EQUAL entries based on taxonomy rules, computing
 * departmental SLA allocations and sequential dependencies.
 */
export async function populateGrievanceDepartments(
  grievanceId: bigint | number | string,
  routing: RoutingCalculationResult,
  tx?: Prisma.TransactionClient,
  options?: {
    dependencyType?: "PARALLEL" | "SEQUENTIAL";
    dependencies?: DepartmentDependencyNode[];
  },
): Promise<{
  primaryDeptId: bigint;
  supportingDeptIds: bigint[];
  activatedDeptIds: bigint[];
  blockedDeptIds: bigint[];
}> {
  const gId = BigInt(grievanceId);
  const primaryDeptId = routing.departmentId;
  const supportingDeptIds = routing.supportingDepartmentIds || [];
  const mainInvolvement = routing.involvementType || "PRIMARY";
  const partnerInvolvement =
    mainInvolvement === "EQUAL" ? "EQUAL" : "SUPPORTING";
  const dependencyType =
    options?.dependencyType || routing.dependencyType || "PARALLEL";
  const configuredDeps = options?.dependencies || routing.dependencies || [];

  const executeInTx = async (client: Prisma.TransactionClient) => {
    // 1. Fetch grievance details and dynamic SLA policy to calculate SLA durations
    const grievance = await client.grievances.findUnique({
      where: { grievance_id: gId },
      select: { created_at: true, due_at: true, priority: true },
    });

    const activePriority = grievance?.priority?.toUpperCase() || "MEDIUM";

    // Dynamically query active SLA policy configured by Admin in database
    const dynamicSlaPolicy = await client.sla_policies.findFirst({
      where: {
        priority_level: activePriority,
        status: "ACTIVE",
      },
      select: { target_duration_minutes: true },
    });

    let totalDurationMinutes: number =
      dynamicSlaPolicy?.target_duration_minutes ||
      DEFAULT_SLA_DURATIONS_MINUTES[activePriority] ||
      DEFAULT_ROUTING_CONFIG.FALLBACK_DURATION_MINUTES;

    if (grievance?.due_at && grievance?.created_at) {
      const diffMinutes = Math.round(
        (grievance.due_at.getTime() - grievance.created_at.getTime()) / 60000,
      );
      if (diffMinutes > 0) totalDurationMinutes = diffMinutes;
    }

    // Fetch active departments for name/id resolution
    const activeDepartments = await client.departments.findMany({
      where: { status: "ACTIVE" },
      select: { department_id: true, department_name: true },
    });

    // Constrain participating departments strictly to primary + valid supporting departments
    const participatingDeptIds = [
      primaryDeptId,
      ...supportingDeptIds.filter((id) => id !== primaryDeptId),
    ];
    const participatingDepts = activeDepartments.filter((d) =>
      participatingDeptIds.includes(d.department_id),
    );

    const primaryDepNode = configuredDeps.find(
      (n) =>
        (n.department_id &&
          n.department_id.toString() === primaryDeptId.toString()) ||
        (n.department_name &&
          n.department_name.toLowerCase() ===
            routing.departmentName?.toLowerCase()),
    );

    let primaryExecutionOrder = 1;
    const primaryPrereqDepartmentIds: bigint[] = [];
    let isPrimaryBlocked = false;

    if (dependencyType === "SEQUENTIAL" && primaryDepNode) {
      primaryExecutionOrder = primaryDepNode.execution_order ?? 1;
      const rawPrereqs = (primaryDepNode.prerequisites || [])
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (rawPrereqs.length > 0) {
        // Has configured prerequisites -> starts BLOCKED
        isPrimaryBlocked = true;
        for (const prereqStr of rawPrereqs) {
          const matchedDept = participatingDepts.find(
            (d) =>
              (d.department_id.toString() === prereqStr ||
                d.department_name.toLowerCase() === prereqStr.toLowerCase()) &&
              d.department_id !== primaryDeptId,
          );
          if (
            matchedDept &&
            !primaryPrereqDepartmentIds.includes(matchedDept.department_id)
          ) {
            primaryPrereqDepartmentIds.push(matchedDept.department_id);
          }
        }
      }
    }

    const primaryAlloc = calculateDepartmentSlaDuration(
      totalDurationMinutes,
      primaryDepNode,
    );

    // 2. Fetch all existing department records for this grievance
    const existingDeptRecords = await client.grievance_departments.findMany({
      where: { grievance_id: gId },
      include: {
        assignments: true,
        attachments: true,
      },
    });

    const existingRecordMap = new Map(
      existingDeptRecords.map((d) => [d.department_id.toString(), d]),
    );

    const existingPrimaryRecord = existingRecordMap.get(
      primaryDeptId.toString(),
    );

    // If there was an old PRIMARY row for a different department, demote or handle it first
    // to strictly avoid violating uq_grievance_single_primary.
    const oldPrimaryRecord = existingDeptRecords.find(
      (d) =>
        d.involvement_type === "PRIMARY" && d.department_id !== primaryDeptId,
    );

    if (oldPrimaryRecord) {
      const isDemotedToSupporting = supportingDeptIds.includes(
        oldPrimaryRecord.department_id,
      );

      if (isDemotedToSupporting) {
        // Demote previous primary to partner involvement so uq_grievance_single_primary is not violated
        await client.grievance_departments.update({
          where: {
            grievance_department_id: oldPrimaryRecord.grievance_department_id,
          },
          data: {
            involvement_type: partnerInvolvement,
          },
        });
      } else {
        // Old primary is no longer involved in the grievance
        const isUntouched =
          !oldPrimaryRecord.assignments &&
          oldPrimaryRecord.attachments.length === 0 &&
          (oldPrimaryRecord.status === "PENDING_ASSIGNMENT" ||
            oldPrimaryRecord.status === "BLOCKED");

        if (isUntouched) {
          await client.grievance_departments.delete({
            where: {
              grievance_department_id: oldPrimaryRecord.grievance_department_id,
            },
          });
        } else {
          await client.grievance_departments.update({
            where: {
              grievance_department_id: oldPrimaryRecord.grievance_department_id,
            },
            data: {
              status: "REMOVED",
              involvement_type: "SUPPORTING",
            },
          });
        }
      }
    }

    let primaryStatus = isPrimaryBlocked ? "BLOCKED" : "PENDING_ASSIGNMENT";
    let primaryActivatedAt: Date | null = isPrimaryBlocked ? null : new Date();
    let primaryDueAt: Date | null = isPrimaryBlocked
      ? null
      : calculateDepartmentDeadline(
          primaryActivatedAt,
          primaryAlloc.allocatedDurationMinutes,
          grievance?.due_at || null,
        ) ||
        grievance?.due_at ||
        new Date(Date.now() + totalDurationMinutes * 60 * 1000);

    if (existingPrimaryRecord) {
      // Preserve completed / resolved status, or active in-progress status if not blocked
      if (
        existingPrimaryRecord.status === "COMPLETED" ||
        existingPrimaryRecord.status === "RESOLVED"
      ) {
        primaryStatus = existingPrimaryRecord.status;
      } else if (
        (existingPrimaryRecord.status === "IN_PROGRESS" ||
          existingPrimaryRecord.status === "ASSIGNED") &&
        !isPrimaryBlocked
      ) {
        primaryStatus = existingPrimaryRecord.status;
      }

      // Preserve existing SLA timestamps if active and previously activated
      if (
        existingPrimaryRecord.activated_at &&
        !isPrimaryBlocked &&
        existingPrimaryRecord.status !== "REMOVED"
      ) {
        primaryActivatedAt = existingPrimaryRecord.activated_at;
        primaryDueAt = existingPrimaryRecord.due_at ?? primaryDueAt;
      }
    }

    const primaryMdiData = buildDepartmentMdiData(primaryDeptId, {
      involvementType: mainInvolvement,
      dependencyType,
      executionOrder: primaryExecutionOrder,
      prerequisiteDepartmentIds: primaryPrereqDepartmentIds,
      slaPercentAllocation: primaryAlloc.slaPercentAllocation,
      allocatedDurationMinutes: primaryAlloc.allocatedDurationMinutes,
      dueAt: primaryDueAt,
      status: primaryStatus,
      activatedAt: primaryActivatedAt,
      assignedAt: existingPrimaryRecord
        ? existingPrimaryRecord.assigned_at
        : undefined,
    });

    if (existingPrimaryRecord) {
      await client.grievance_departments.update({
        where: {
          grievance_department_id:
            existingPrimaryRecord.grievance_department_id,
        },
        data: primaryMdiData,
      });
    } else {
      await client.grievance_departments.create({
        data: {
          grievance_id: gId,
          ...primaryMdiData,
        },
      });
    }

    // 3. Preserve audit history: soft-remove removed supporting departments with history, delete empty placeholders
    for (const record of existingDeptRecords) {
      if (
        record.department_id !== primaryDeptId &&
        !supportingDeptIds.includes(record.department_id) &&
        record.department_id !== oldPrimaryRecord?.department_id
      ) {
        // Only completely untouched departments can be hard-deleted;
        // active or historical records must be soft-removed to protect the audit trail.
        const isUntouched =
          !record.assignments &&
          record.attachments.length === 0 &&
          (record.status === "PENDING_ASSIGNMENT" ||
            record.status === "BLOCKED");

        if (isUntouched) {
          await client.grievance_departments.delete({
            where: { grievance_department_id: record.grievance_department_id },
          });
        } else {
          await client.grievance_departments.update({
            where: { grievance_department_id: record.grievance_department_id },
            data: { status: "REMOVED" },
          });
        }
      }
    }

    // 4. Upsert fresh partner entries (SUPPORTING or EQUAL) with dependency awareness
    const activatedDeptIds: bigint[] = [];
    const blockedDeptIds: bigint[] = [];

    if (primaryStatus === "BLOCKED") {
      blockedDeptIds.push(primaryDeptId);
    } else {
      activatedDeptIds.push(primaryDeptId);
    }

    for (let i = 0; i < supportingDeptIds.length; i++) {
      const suppId = supportingDeptIds[i];
      if (suppId === primaryDeptId) continue;

      const suppDept = activeDepartments.find(
        (d) => d.department_id === suppId,
      );
      const depNode = configuredDeps.find(
        (n) =>
          (n.department_id &&
            n.department_id.toString() === suppId.toString()) ||
          (suppDept &&
            n.department_name.toLowerCase() ===
              suppDept.department_name.toLowerCase()),
      );

      let executionOrder = 1;
      let prereqDepartmentIds: bigint[] = [];
      let isBlocked = false;

      if (dependencyType === "SEQUENTIAL") {
        if (depNode) {
          executionOrder = depNode.execution_order || i + 2;
          const rawPrereqs = (depNode.prerequisites || [])
            .map((p) => p.trim())
            .filter((p) => p.length > 0);

          if (rawPrereqs.length > 0) {
            isBlocked = true;
            for (const prereqStr of rawPrereqs) {
              const matchedDept = participatingDepts.find(
                (d) =>
                  (d.department_id.toString() === prereqStr ||
                    d.department_name.toLowerCase() ===
                      prereqStr.toLowerCase()) &&
                  d.department_id !== suppId,
              );
              if (
                matchedDept &&
                !prereqDepartmentIds.includes(matchedDept.department_id)
              ) {
                prereqDepartmentIds.push(matchedDept.department_id);
              }
            }
          } else if (executionOrder > 1) {
            // SEQUENTIAL WORKFLOW: If execution_order > 1 and no explicit custom prereqs,
            // it must wait for the primary lead department
            isBlocked = true;
            prereqDepartmentIds = [primaryDeptId];
          }
        } else {
          // Default sequential: waits for primary department
          executionOrder = i + 2;
          prereqDepartmentIds = [primaryDeptId];
          isBlocked = true;
        }
      }

      const suppAlloc = calculateDepartmentSlaDuration(
        totalDurationMinutes,
        depNode,
      );

      const existingRecord = existingRecordMap.get(suppId.toString());

      let suppStatus = isBlocked ? "BLOCKED" : "PENDING_ASSIGNMENT";
      let suppActivatedAt: Date | null = isBlocked ? null : new Date();
      let suppDueAt: Date | null = isBlocked
        ? null
        : calculateDepartmentDeadline(
            suppActivatedAt,
            suppAlloc.allocatedDurationMinutes,
            grievance?.due_at || null,
          );

      if (existingRecord) {
        if (
          existingRecord.status === "COMPLETED" ||
          existingRecord.status === "RESOLVED"
        ) {
          suppStatus = existingRecord.status;
        } else if (
          (existingRecord.status === "IN_PROGRESS" ||
            existingRecord.status === "ASSIGNED") &&
          !isBlocked
        ) {
          suppStatus = existingRecord.status;
        }

        if (
          existingRecord.activated_at &&
          !isBlocked &&
          existingRecord.status !== "REMOVED"
        ) {
          suppActivatedAt = existingRecord.activated_at;
          suppDueAt = existingRecord.due_at ?? suppDueAt;
        }
      }

      const partnerInv = depNode?.involvement_type
        ? depNode.involvement_type === "EQUAL"
          ? ("EQUAL" as const)
          : ("SUPPORTING" as const)
        : partnerInvolvement;

      const suppMdiData = buildDepartmentMdiData(suppId, {
        involvementType: partnerInv,
        dependencyType,
        executionOrder,
        prerequisiteDepartmentIds: prereqDepartmentIds,
        slaPercentAllocation: suppAlloc.slaPercentAllocation,
        allocatedDurationMinutes: suppAlloc.allocatedDurationMinutes,
        dueAt: suppDueAt,
        status: suppStatus,
        activatedAt: suppActivatedAt,
        assignedAt: existingRecord ? existingRecord.assigned_at : undefined,
      });

      if (suppStatus === "BLOCKED") {
        blockedDeptIds.push(suppId);
      } else {
        activatedDeptIds.push(suppId);
      }

      if (existingRecord) {
        await client.grievance_departments.update({
          where: {
            grievance_department_id: existingRecord.grievance_department_id,
          },
          data: suppMdiData,
        });
      } else {
        await client.grievance_departments.create({
          data: {
            grievance_id: gId,
            ...suppMdiData,
          },
        });
      }
    }

    return {
      primaryDeptId,
      supportingDeptIds: supportingDeptIds.filter((id) => id !== primaryDeptId),
      activatedDeptIds,
      blockedDeptIds,
    };
  };

  if (tx) {
    return executeInTx(tx);
  }
  return prisma.$transaction(executeInTx);
}

export interface DepartmentResolutionAuthority {
  canResolve: boolean;
  canSubmitFindings: boolean;
  isFinalSequentialDept: boolean;
  reason?: string;
}

/**
 * Determines whether a department is authorized to submit the final customer resolution,
 * or if it should submit department findings to advance the multi-department workflow.
 *
 * Rules:
 * 1. Single department case -> Can submit final resolution.
 * 2. Primary / Equal Co-Lead -> Can submit final resolution once all supporting departments are COMPLETED / RESOLVED.
 * 3. In sequential workflow: The FINAL sequential department (all preceding prerequisites are COMPLETED/RESOLVED,
 *    and no downstream departments exist) has full authority to submit the final customer resolution.
 * 4. Any active department that has downstream departments or is supporting and not final -> Submits department findings.
 */
export function canDepartmentSubmitFinalResolution(
  departmentId: bigint | number | string,
  allDepts: Array<{
    department_id: bigint | number | string;
    involvement_type: string;
    dependency_type?: string | null;
    execution_order: number;
    status: string;
    prerequisite_department_ids?: unknown;
  }>,
): DepartmentResolutionAuthority {
  const deptIdStr = departmentId.toString();
  const currentDept = allDepts.find(
    (d) => d.department_id.toString() === deptIdStr,
  );
  if (!currentDept) {
    return {
      canResolve: false,
      canSubmitFindings: false,
      isFinalSequentialDept: false,
      reason: "Department not found on grievance",
    };
  }

  const activeDepts = allDepts.filter((d) => d.status !== "REMOVED");

  // Single active department on grievance
  if (activeDepts.length <= 1) {
    return {
      canResolve: true,
      canSubmitFindings: false,
      isFinalSequentialDept: true,
    };
  }

  const isPrimaryOrEqual =
    currentDept.involvement_type === "PRIMARY" ||
    currentDept.involvement_type === "EQUAL";

  // Incomplete supporting departments
  const pendingSupporting = activeDepts.filter(
    (d) =>
      d.involvement_type === "SUPPORTING" &&
      d.status !== "COMPLETED" &&
      d.status !== "RESOLVED",
  );

  // If Primary/Equal and all supporting departments have finished
  if (isPrimaryOrEqual && pendingSupporting.length === 0) {
    return {
      canResolve: true,
      canSubmitFindings: false,
      isFinalSequentialDept: true,
    };
  }

  // Check sequential workflow execution order
  const hasSequential = activeDepts.some(
    (d) => d.dependency_type === "SEQUENTIAL",
  );

  if (hasSequential) {
    // Check if any preceding departments in execution order are not completed
    const precedingIncomplete = activeDepts.filter(
      (d) =>
        d.department_id.toString() !== deptIdStr &&
        d.execution_order < currentDept.execution_order &&
        d.status !== "COMPLETED" &&
        d.status !== "RESOLVED",
    );

    // Check if there are downstream departments with higher execution order
    const downstreamDepts = activeDepts.filter(
      (d) =>
        d.department_id.toString() !== deptIdStr &&
        d.execution_order > currentDept.execution_order,
    );

    // If this is the final sequential department in the workflow chain
    // (no preceding incomplete and no downstream departments waiting)
    if (precedingIncomplete.length === 0 && downstreamDepts.length === 0) {
      return {
        canResolve: true,
        canSubmitFindings: false,
        isFinalSequentialDept: true,
      };
    }
  }

  // If not authorized for final resolution yet:
  // Can it submit findings? Yes, if not blocked and not already completed!
  const isCurrentDeptCompleted =
    currentDept.status === "COMPLETED" || currentDept.status === "RESOLVED";
  const isCurrentDeptBlocked = currentDept.status === "BLOCKED";

  const canSubmitFindings = !isCurrentDeptCompleted && !isCurrentDeptBlocked;

  let reason = "Awaiting upstream stages.";
  if (isPrimaryOrEqual && pendingSupporting.length > 0) {
    reason = `Awaiting findings from supporting department(s): ${pendingSupporting
      .map((d) => d.department_id.toString())
      .join(", ")}`;
  } else if (!isPrimaryOrEqual) {
    reason =
      "As a supportive department, findings must be submitted to advance the workflow.";
  }

  return {
    canResolve: false,
    canSubmitFindings,
    isFinalSequentialDept: false,
    reason,
  };
}

/**
 * Unblocks any sequential departments for a grievance once their prerequisite departments have completed.
 * Uses AND semantics: all prerequisites must be completed or resolved.
 * Caps department due_at to the overall grievance deadline.
 */
export async function activateNextSequentialDepartments(
  grievanceId: bigint | number | string,
  tx?: Prisma.TransactionClient,
): Promise<bigint[]> {
  const gId = BigInt(grievanceId);
  const client = tx || prisma;

  const allDepts = await client.grievance_departments.findMany({
    where: { grievance_id: gId },
    include: {
      departments: { select: { department_name: true } },
      grievances: {
        select: {
          due_at: true,
          created_at: true,
          priority: true,
          grievance_number: true,
        },
      },
    },
  });

  const completedOrRemovedDeptIds = new Set(
    allDepts
      .filter(
        (d) =>
          d.status === "COMPLETED" ||
          d.status === "RESOLVED" ||
          d.status === "REMOVED",
      )
      .map((d) => d.department_id.toString()),
  );

  const blockedDepts = allDepts.filter(
    (d) => d.status === "BLOCKED" && d.dependency_type === "SEQUENTIAL",
  );

  const activatedDeptIds: bigint[] = [];

  for (const blocked of blockedDepts) {
    const rawPrereqs = blocked.prerequisite_department_ids;
    const prereqIds = Array.isArray(rawPrereqs)
      ? (rawPrereqs as (number | string | bigint)[]).map((id) => String(id))
      : [];

    // AND semantics: all prerequisites must be completed (or removed from case).
    // If no explicit prerequisite IDs are configured, fall back to checking that all active departments
    // with a lower execution order have completed to prevent sequential deadlocks.
    const allPrereqsCompleted =
      prereqIds.length > 0
        ? prereqIds.every(
            (id) =>
              completedOrRemovedDeptIds.has(id) ||
              !allDepts.some((d) => d.department_id.toString() === id),
          )
        : allDepts
            .filter(
              (d) =>
                d.execution_order < blocked.execution_order &&
                d.department_id !== blocked.department_id &&
                d.status !== "REMOVED",
            )
            .every((d) => d.status === "COMPLETED" || d.status === "RESOLVED");

    if (allPrereqsCompleted) {
      const now = new Date();
      const activePriority =
        blocked.grievances?.priority?.toUpperCase() || "MEDIUM";
      const grievanceNumber =
        blocked.grievances?.grievance_number || `GRS-${gId.toString()}`;

      // Dynamically query active SLA policy configured by Admin in database
      const dynamicSlaPolicy = await client.sla_policies.findFirst({
        where: {
          priority_level: activePriority,
          status: "ACTIVE",
        },
        select: { target_duration_minutes: true },
      });

      let totalBudgetMinutes =
        dynamicSlaPolicy?.target_duration_minutes ||
        DEFAULT_SLA_DURATIONS_MINUTES[activePriority] ||
        DEFAULT_ROUTING_CONFIG.FALLBACK_DURATION_MINUTES;

      if (blocked.grievances?.due_at && blocked.grievances?.created_at) {
        const diff = Math.round(
          (blocked.grievances.due_at.getTime() -
            blocked.grievances.created_at.getTime()) /
            60000,
        );
        if (diff > 0) totalBudgetMinutes = diff;
      }

      const slaCalc = calculateDepartmentSlaDuration(totalBudgetMinutes, {
        allocated_duration_minutes: blocked.allocated_duration_minutes,
        sla_percent_allocation: blocked.sla_percent_allocation
          ? Number(blocked.sla_percent_allocation)
          : null,
      });

      const newDueAt = calculateDepartmentDeadline(
        now,
        slaCalc.allocatedDurationMinutes,
        blocked.grievances?.due_at || null,
      );

      await client.grievance_departments.update({
        where: {
          grievance_department_id: blocked.grievance_department_id,
        },
        data: {
          status: "PENDING_ASSIGNMENT",
          activated_at: now,
          due_at: newDueAt,
        },
      });

      activatedDeptIds.push(blocked.department_id);

      // Dispatch activation notifications asynchronously to prevent holding or expiring the transaction
      try {
        const deptHeads = await client.users.findMany({
          where: {
            department_id: blocked.department_id,
            roles: { role_name: "DEPARTMENT_HEAD" },
            status: "ACTIVE",
          },
          select: { user_id: true },
        });

        const activeAssignment = await client.assignments.findFirst({
          where: {
            grievance_department_id: blocked.grievance_department_id,
            assignment_status: "ASSIGNED",
          },
          select: { staff_id: true },
        });

        const deptName = blocked.departments.department_name;

        const notifDispatch = async () => {
          try {
            const { NotificationService } = await import(
              "@/lib/services/notification.service"
            );
            for (const head of deptHeads) {
              await NotificationService.send({
                userId: head.user_id,
                grievanceId: gId,
                type: "ASSIGNMENT",
                title: `[${activePriority}] Department Stage Activated: ${deptName}`,
                message: `[${activePriority} Priority] Prerequisite departments have completed for case ${grievanceNumber}. Grievance is now active for ${deptName}.`,
              });
            }

            if (activeAssignment?.staff_id) {
              await NotificationService.send({
                userId: activeAssignment.staff_id,
                grievanceId: gId,
                type: "ASSIGNMENT",
                title: `[${activePriority}] Stage Activated: ${deptName}`,
                message: `[${activePriority} Priority] Prerequisite departments have completed for case ${grievanceNumber}. Grievance is now active for your department (${deptName}). You may begin investigation.`,
              });
            }
          } catch (err) {
            console.error(
              "Non-fatal: Failed to send activation notification:",
              err,
            );
          }
        };

        if (tx) {
          setImmediate(notifDispatch);
        } else {
          await notifDispatch();
        }
      } catch (err) {
        console.error(
          "Non-fatal: Failed to prepare activation notification:",
          err,
        );
      }
    }
  }

  return activatedDeptIds;
}

/**
 * End-to-end automated routing helper: evaluates taxonomy rules and populates
 * PRIMARY and SUPPORTING grievance_departments records.
 */
export async function autoRouteGrievance(
  grievanceId: bigint | number | string,
  input: RoutingCalculationInput,
  tx?: Prisma.TransactionClient,
): Promise<RoutingCalculationResult | null> {
  const routing = await determineDepartmentRouting(input);
  if (!routing) {
    try {
      const { NotificationService } = await import(
        "@/lib/services/notification.service"
      );
      const client = tx || prisma;
      const gId = BigInt(grievanceId);
      const grievance = await client.grievances.findUnique({
        where: { grievance_id: gId },
        select: { grievance_id: true, grievance_number: true, title: true },
      });

      if (grievance) {
        const admins = await client.users.findMany({
          where: {
            roles: { role_name: { in: ["ADMIN", "SUPER_ADMIN"] } },
            status: "ACTIVE",
          },
          select: { user_id: true },
        });

        for (const admin of admins) {
          await NotificationService.send({
            userId: admin.user_id,
            grievanceId: grievance.grievance_id,
            type: "ROUTING_EXCEPTION",
            channel: "IN_APP",
            title: `Manual Routing Required: ${grievance.grievance_number}`,
            message: `Grievance ${grievance.grievance_number} (${grievance.title}) matched no automated routing rule and requires manual department assignment.`,
          });
        }
      }
    } catch (err) {
      console.error(
        "Non-fatal: Failed to send manual routing notification to admins:",
        err,
      );
    }
    return null;
  }

  await populateGrievanceDepartments(grievanceId, routing, tx);
  return routing;
}
