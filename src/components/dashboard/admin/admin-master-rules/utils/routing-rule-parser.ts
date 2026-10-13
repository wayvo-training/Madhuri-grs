import {
  type DepartmentDependencyNode,
  type DerivedOrderNode,
  validateRoutingPolicy,
} from "@/lib/validations/dependency-graph";
import type { SerializedRoutingRule } from "@/types/admin/master-rules";

export interface ParsedParticipatingDept {
  department_name: string;
  involvement_type: "PRIMARY" | "EQUAL" | "SUPPORT";
  prerequisites: string[];
  stage: number;
  execution_order: number;
  sla_percent_allocation?: number | null;
  allocated_duration_minutes?: number | null;
  is_starting_department: boolean;
}

export interface ParsedRoutingMDI {
  primaryDepartment: string;
  participatingDepartments: ParsedParticipatingDept[];
  executionMode: "PARALLEL" | "SEQUENTIAL";
  dependencySummary: string;
  isDependencyComplex: boolean;
  slaAllocationSummary: string;
  hasSlaAllocation: boolean;
  derivedOrder: DerivedOrderNode[];
  stages: { stageNumber: number; departments: ParsedParticipatingDept[] }[];
}

export function parseRoutingRuleMDI(
  rule: SerializedRoutingRule,
): ParsedRoutingMDI {
  // 1. Parse conditions
  let conditionsObj: {
    dependency_type?: string;
    dependencies?: DepartmentDependencyNode[];
    primary_sla_percent?: number | null;
    primary_duration_minutes?: number | null;
  } = {};

  if (rule.conditions) {
    if (typeof rule.conditions === "string") {
      try {
        conditionsObj = JSON.parse(rule.conditions);
      } catch {
        conditionsObj = {};
      }
    } else if (typeof rule.conditions === "object") {
      conditionsObj = rule.conditions as typeof conditionsObj;
    }
  }

  // 2. Execution Mode strictly from saved conditions
  const executionMode: "PARALLEL" | "SEQUENTIAL" =
    conditionsObj.dependency_type === "SEQUENTIAL" ? "SEQUENTIAL" : "PARALLEL";

  // 3. Lead Primary Department
  const primaryDepartment = rule.department_name || "Lead Department";

  // 4. Raw supporting departments
  const rawSupporting = Array.isArray(rule.supporting_departments)
    ? rule.supporting_departments
    : [];

  const rawDeps = Array.isArray(conditionsObj.dependencies)
    ? conditionsObj.dependencies
    : [];

  // Determine all unique participating department names
  const allDeptNamesSet = new Set<string>();
  if (primaryDepartment) {
    allDeptNamesSet.add(primaryDepartment);
  }
  for (const supp of rawSupporting) {
    if (supp?.trim()) allDeptNamesSet.add(supp.trim());
  }
  for (const dep of rawDeps) {
    if (dep.department_name?.trim())
      allDeptNamesSet.add(dep.department_name.trim());
  }

  // Supporting department names without primary
  const supportingDeptsList = Array.from(allDeptNamesSet).filter(
    (name) => name.toLowerCase() !== primaryDepartment.toLowerCase(),
  );

  const primaryDepNode = rawDeps.find(
    (d) =>
      d.department_name?.toLowerCase() === primaryDepartment.toLowerCase() ||
      d.involvement_type === "PRIMARY",
  );
  const resolvedPrimarySlaPercent =
    conditionsObj.primary_sla_percent ??
    primaryDepNode?.sla_percent_allocation ??
    undefined;
  const resolvedPrimaryDuration =
    conditionsObj.primary_duration_minutes ??
    primaryDepNode?.allocated_duration_minutes ??
    undefined;

  // 5. Run validateRoutingPolicy to get the exact canonical topological ordering and stages
  const validationResult = validateRoutingPolicy({
    primary_department_name: primaryDepartment,
    supporting_departments: supportingDeptsList,
    dependency_type: executionMode,
    dependencies: rawDeps,
    primary_sla_percent: resolvedPrimarySlaPercent ?? undefined,
    primary_duration_minutes: resolvedPrimaryDuration ?? undefined,
  });

  const derivedOrder: DerivedOrderNode[] = validationResult.derivedOrder || [];

  // Map derivedOrder into ParsedParticipatingDept
  const participatingDepartments: ParsedParticipatingDept[] = derivedOrder.map(
    (node) => {
      let involvement: "PRIMARY" | "EQUAL" | "SUPPORT" = "SUPPORT";
      const rawRole = (node.involvement_type || "").toUpperCase();
      if (rawRole === "PRIMARY") {
        involvement = "PRIMARY";
      } else if (rawRole === "EQUAL") {
        involvement = "EQUAL";
      } else if (
        node.department_name.toLowerCase() === primaryDepartment.toLowerCase()
      ) {
        involvement =
          rule.involvement_type?.toUpperCase() === "EQUAL"
            ? "EQUAL"
            : "PRIMARY";
      }

      const matchingRawDep = rawDeps.find(
        (d) =>
          d.department_name?.toLowerCase() ===
          node.department_name.toLowerCase(),
      );

      const slaPercent =
        node.sla_percent_allocation ??
        matchingRawDep?.sla_percent_allocation ??
        (node.department_name.toLowerCase() === primaryDepartment.toLowerCase()
          ? resolvedPrimarySlaPercent
          : null);

      const slaDuration =
        node.allocated_duration_minutes ??
        matchingRawDep?.allocated_duration_minutes ??
        (node.department_name.toLowerCase() === primaryDepartment.toLowerCase()
          ? resolvedPrimaryDuration
          : null);

      return {
        department_name: node.department_name,
        involvement_type: involvement,
        prerequisites: node.prerequisites || [],
        stage: node.stage || 1,
        execution_order: node.execution_order || 1,
        sla_percent_allocation: slaPercent,
        allocated_duration_minutes: slaDuration,
        is_starting_department: node.is_starting_department,
      };
    },
  );

  // Fallback if derivedOrder was empty (e.g., validation issue or empty rule)
  if (participatingDepartments.length === 0) {
    participatingDepartments.push({
      department_name: primaryDepartment,
      involvement_type:
        rule.involvement_type?.toUpperCase() === "EQUAL" ? "EQUAL" : "PRIMARY",
      prerequisites: [],
      stage: 1,
      execution_order: 1,
      sla_percent_allocation: null,
      allocated_duration_minutes: null,
      is_starting_department: true,
    });
    for (const supp of supportingDeptsList) {
      participatingDepartments.push({
        department_name: supp,
        involvement_type: "SUPPORT",
        prerequisites:
          executionMode === "SEQUENTIAL" ? [primaryDepartment] : [],
        stage: executionMode === "SEQUENTIAL" ? 2 : 1,
        execution_order: 2,
        sla_percent_allocation: null,
        allocated_duration_minutes: null,
        is_starting_department: executionMode !== "SEQUENTIAL",
      });
    }
  }

  // 6. Group by stages
  const stageMap = new Map<number, ParsedParticipatingDept[]>();
  for (const dept of participatingDepartments) {
    const s = dept.stage || 1;
    if (!stageMap.has(s)) {
      stageMap.set(s, []);
    }
    stageMap.get(s)?.push(dept);
  }

  const stages = Array.from(stageMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([stageNumber, departments]) => ({
      stageNumber,
      departments,
    }));

  // 7. Dependencies summary
  let dependencySummary = "Independent";
  let isDependencyComplex = false;

  if (executionMode === "PARALLEL") {
    const nodesWithPrereqs = participatingDepartments.filter(
      (d) => d.prerequisites && d.prerequisites.length > 0,
    );
    if (nodesWithPrereqs.length === 0) {
      dependencySummary = "Independent";
    } else {
      const parts = nodesWithPrereqs.map(
        (d) => `${d.prerequisites.join(" + ")} → ${d.department_name}`,
      );
      dependencySummary = parts.join(", ");
      if (parts.length > 2 || dependencySummary.length > 35) {
        isDependencyComplex = true;
      }
    }
  } else {
    // SEQUENTIAL
    const nodesWithPrereqs = participatingDepartments.filter(
      (d) => d.prerequisites && d.prerequisites.length > 0,
    );

    if (nodesWithPrereqs.length === 0) {
      if (participatingDepartments.length <= 1) {
        dependencySummary = "Independent";
      } else {
        // Linear sequence by stage
        const stageNames = stages.map((st) =>
          st.departments.map((d) => d.department_name).join(" + "),
        );
        dependencySummary = stageNames.join(" → ");
        if (stageNames.length > 2 || dependencySummary.length > 35) {
          isDependencyComplex = true;
        }
      }
    } else {
      const parts = nodesWithPrereqs.map(
        (d) => `${d.prerequisites.join(" + ")} → ${d.department_name}`,
      );
      dependencySummary = parts.join(", ");
      if (parts.length > 2 || dependencySummary.length > 35) {
        isDependencyComplex = true;
      }
    }
  }

  // 8. SLA Allocation summary
  // Distinguish percentage allocations from fixed-duration allocations
  const hasFixedDurations = participatingDepartments.some(
    (d) =>
      d.allocated_duration_minutes != null && d.allocated_duration_minutes > 0,
  );
  const hasPercentages = participatingDepartments.some(
    (d) => d.sla_percent_allocation != null && d.sla_percent_allocation > 0,
  );

  let slaAllocationSummary = "Not configured";
  let hasSlaAllocation = false;

  if (hasFixedDurations || hasPercentages) {
    hasSlaAllocation = true;
    slaAllocationSummary = participatingDepartments
      .map((d) => {
        const mins = d.allocated_duration_minutes;
        const pct =
          d.sla_percent_allocation ??
          (executionMode === "PARALLEL"
            ? d.involvement_type === "PRIMARY" || d.involvement_type === "EQUAL"
              ? 100
              : 50
            : undefined);
        if (mins != null && mins > 0 && pct != null && pct > 0) {
          const durationStr =
            mins >= 60
              ? `${mins % 60 === 0 ? mins / 60 : (mins / 60).toFixed(1)}h`
              : `${mins}m`;
          return `${d.department_name}: ${durationStr} (${pct}%)`;
        }
        if (mins != null && mins > 0) {
          const durationStr =
            mins >= 60
              ? `${mins % 60 === 0 ? mins / 60 : (mins / 60).toFixed(1)}h`
              : `${mins}m`;
          return `${d.department_name}: ${durationStr}`;
        }
        if (pct != null && pct > 0) {
          return `${d.department_name}: ${pct}%`;
        }
        return `${d.department_name}: 100%`;
      })
      .join(" · ");
  } else {
    // Default smart concurrent/sequential allocations for active routing rules
    hasSlaAllocation = true;
    if (executionMode === "PARALLEL") {
      if (participatingDepartments.length <= 1) {
        slaAllocationSummary = `${primaryDepartment}: 100% (Full SLA)`;
      } else {
        slaAllocationSummary = participatingDepartments
          .map((d) => {
            const isOwner =
              d.involvement_type === "PRIMARY" ||
              d.involvement_type === "EQUAL";
            return `${d.department_name}: ${isOwner ? "100%" : "50%"}`;
          })
          .join(" · ");
      }
    } else {
      if (participatingDepartments.length <= 1) {
        slaAllocationSummary = `${primaryDepartment}: 100% (Full SLA)`;
      } else {
        const equalShare = Math.round(100 / participatingDepartments.length);
        slaAllocationSummary = participatingDepartments
          .map((d) => `${d.department_name}: ${equalShare}%`)
          .join(" · ");
      }
    }
  }

  return {
    primaryDepartment,
    participatingDepartments,
    executionMode,
    dependencySummary,
    isDependencyComplex,
    slaAllocationSummary,
    hasSlaAllocation,
    derivedOrder,
    stages,
  };
}
