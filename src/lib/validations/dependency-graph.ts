export interface DepartmentDependencyNode {
  department_name: string;
  department_id?: string;
  execution_order: number;
  prerequisites: string[]; // Names or IDs of prerequisite departments
  sla_percent_allocation?: number | null;
  allocated_duration_minutes?: number | null;
}

export interface RoutingPolicyValidationInput {
  primary_department_name?: string | null;
  primary_department_id?: string | bigint | number | null;
  supporting_departments: string[];
  dependency_type?: "PARALLEL" | "SEQUENTIAL" | string;
  dependencies?: DepartmentDependencyNode[];
  primary_sla_percent?: number;
  primary_duration_minutes?: number;
}

export interface RoutingPolicyValidationResult {
  valid: boolean;
  errors: string[];
  normalizedDependencies?: DepartmentDependencyNode[];
}

/**
 * Validates multi-department routing policy rules:
 * 1. Exactly one primary lead department is specified.
 * 2. No duplicate supporting departments.
 * 3. Primary department cannot also be a supporting department.
 * 4. Valid prerequisites (all prerequisites must be participating departments, no self-dependencies, primary has no prerequisites).
 * 5. No dependency cycles (DAG validation via topological sorting / Kahn's algorithm).
 * 6. Valid execution order (positive integers, execution order strictly respects prerequisite dependencies).
 */
export function validateRoutingPolicy(
  input: RoutingPolicyValidationInput,
): RoutingPolicyValidationResult {
  const errors: string[] = [];

  // 1. Ensure exactly one primary department
  const primaryName = input.primary_department_name?.trim() || "";
  const primaryId = input.primary_department_id?.toString().trim() || "";

  if (!primaryName && !primaryId) {
    errors.push(
      "A primary lead department is strictly required. Exactly one primary department must be designated.",
    );
  }

  // 2. Validate supporting departments (no duplicates, cannot include primary)
  const rawSupporting = input.supporting_departments || [];
  const seenSupporting = new Set<string>();
  const duplicateSupporting = new Set<string>();
  const normalizedSupporting: string[] = [];

  for (const supp of rawSupporting) {
    const trimmed = (supp || "").trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();

    if (
      (primaryName && lower === primaryName.toLowerCase()) ||
      (primaryId && trimmed === primaryId)
    ) {
      errors.push(
        `Primary lead department "${primaryName || primaryId}" cannot also be listed as a supporting department.`,
      );
    }

    if (seenSupporting.has(lower)) {
      duplicateSupporting.add(trimmed);
    } else {
      seenSupporting.add(lower);
      normalizedSupporting.push(trimmed);
    }
  }

  if (duplicateSupporting.size > 0) {
    errors.push(
      `Duplicate supporting department(s) detected: ${Array.from(duplicateSupporting).join(", ")}. Each supporting department must be unique.`,
    );
  }

  // If there are fatal primary/supporting department errors, return early
  if (errors.length > 0 && !primaryName && !primaryId) {
    return { valid: false, errors };
  }

  const isSequential = input.dependency_type === "SEQUENTIAL";
  const allParticipatingNames = new Set<string>();
  if (primaryName) allParticipatingNames.add(primaryName.toLowerCase());
  for (const supp of normalizedSupporting) {
    allParticipatingNames.add(supp.toLowerCase());
  }

  const rawDeps = input.dependencies || [];
  const depMap = new Map<string, DepartmentDependencyNode>();

  for (const dep of rawDeps) {
    if (!dep.department_name) continue;
    depMap.set(dep.department_name.toLowerCase(), dep);
  }

  const normalizedDeps: DepartmentDependencyNode[] = [];
  const orderMap = new Map<string, number>();

  if (!isSequential) {
    for (const suppName of normalizedSupporting) {
      const custom = depMap.get(suppName.toLowerCase());
      normalizedDeps.push({
        department_name: suppName,
        department_id: custom?.department_id,
        execution_order: 1,
        prerequisites: [],
        sla_percent_allocation: custom?.sla_percent_allocation,
        allocated_duration_minutes: custom?.allocated_duration_minutes,
      });
    }
  } else {
    // 3. For Sequential workflows, validate prerequisites and execution order
    // Primary department is always execution order 1 with 0 prerequisites
    if (primaryName) {
      orderMap.set(primaryName.toLowerCase(), 1);
    }

    for (let i = 0; i < normalizedSupporting.length; i++) {
      const suppName = normalizedSupporting[i];
      const suppLower = suppName.toLowerCase();
      const custom = depMap.get(suppLower);

      const execOrder =
        custom &&
        Number.isInteger(custom.execution_order) &&
        custom.execution_order > 0
          ? custom.execution_order
          : i + 2; // Default to step 2, 3, etc.

      const prereqs =
        custom &&
        Array.isArray(custom.prerequisites) &&
        custom.prerequisites.length > 0
          ? custom.prerequisites.map((p) => p.trim()).filter(Boolean)
          : primaryName
            ? [primaryName]
            : [];

      orderMap.set(suppLower, execOrder);
      normalizedDeps.push({
        department_name: suppName,
        department_id: custom?.department_id,
        execution_order: execOrder,
        prerequisites: prereqs,
        sla_percent_allocation: custom?.sla_percent_allocation,
        allocated_duration_minutes: custom?.allocated_duration_minutes,
      });
    }

    // 4. Validate Prerequisites existence & self-dependency
    for (const node of normalizedDeps) {
      const nodeLower = node.department_name.toLowerCase();

      for (const prereq of node.prerequisites) {
        const prereqLower = prereq.toLowerCase();

        // Self-dependency check
        if (prereqLower === nodeLower) {
          errors.push(
            `Department "${node.department_name}" cannot have itself as a prerequisite.`,
          );
          continue;
        }

        // Check if prerequisite is part of participating departments
        if (!allParticipatingNames.has(prereqLower)) {
          errors.push(
            `Prerequisite "${prereq}" for department "${node.department_name}" is not part of this routing policy.`,
          );
        }
      }
    }

    // 5. Dependency Cycle Detection (Kahn's Algorithm / Topological Sort)
    // Construct graph: all participating departments
    const allNodesList = primaryName
      ? [primaryName, ...normalizedSupporting]
      : normalizedSupporting;

    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    for (const name of allNodesList) {
      const lower = name.toLowerCase();
      inDegree.set(lower, 0);
      adjList.set(lower, []);
    }

    // Build edges: prereq -> dependent
    for (const node of normalizedDeps) {
      const dependentLower = node.department_name.toLowerCase();
      for (const prereq of node.prerequisites) {
        const prereqLower = prereq.toLowerCase();
        if (adjList.has(prereqLower)) {
          adjList.get(prereqLower)?.push(dependentLower);
          inDegree.set(dependentLower, (inDegree.get(dependentLower) ?? 0) + 1);
        }
      }
    }

    // Enqueue nodes with in-degree 0
    const queue: string[] = [];
    for (const [nameLower, deg] of inDegree.entries()) {
      if (deg === 0) {
        queue.push(nameLower);
      }
    }

    let visitedCount = 0;
    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      visitedCount++;

      const neighbors = adjList.get(current) || [];
      for (const nbr of neighbors) {
        const newDeg = (inDegree.get(nbr) ?? 1) - 1;
        inDegree.set(nbr, newDeg);
        if (newDeg === 0) {
          queue.push(nbr);
        }
      }
    }

    if (visitedCount < allNodesList.length) {
      const cyclicNodes = Array.from(inDegree.entries())
        .filter(([, deg]) => deg > 0)
        .map(([lower]) => {
          const found = allNodesList.find((n) => n.toLowerCase() === lower);
          return found || lower;
        });

      errors.push(
        `Dependency cycle detected involving department(s): ${cyclicNodes.join(", ")}. Prerequisites must form a directed acyclic workflow without circular loops.`,
      );
    }

    // 6. Validate Execution Order against Prerequisites
    for (const node of normalizedDeps) {
      const nodeOrder = orderMap.get(node.department_name.toLowerCase()) ?? 1;

      for (const prereq of node.prerequisites) {
        const prereqOrder = orderMap.get(prereq.toLowerCase()) ?? 1;
        if (nodeOrder <= prereqOrder) {
          errors.push(
            `Invalid execution order: "${node.department_name}" (Step ${nodeOrder}) must have a higher execution order than its prerequisite "${prereq}" (Step ${prereqOrder}).`,
          );
        }
      }
    }
  }

  // 7. Validate SLA allocations: reject negative values, invalid ranges, and totals exceeding 100%
  let totalConfiguredPercent = input.primary_sla_percent ?? 0;
  if (
    input.primary_sla_percent !== undefined &&
    input.primary_sla_percent !== null
  ) {
    if (
      !Number.isFinite(input.primary_sla_percent) ||
      input.primary_sla_percent <= 0 ||
      input.primary_sla_percent > 100
    ) {
      errors.push(
        `Invalid primary SLA percentage "${input.primary_sla_percent}". Must be a number between 1 and 100 (cannot be negative or zero).`,
      );
    }
  }

  for (const node of normalizedDeps) {
    if (
      node.sla_percent_allocation !== undefined &&
      node.sla_percent_allocation !== null
    ) {
      if (
        !Number.isFinite(node.sla_percent_allocation) ||
        node.sla_percent_allocation <= 0 ||
        node.sla_percent_allocation > 100
      ) {
        errors.push(
          `Invalid SLA percentage for department "${node.department_name}": must be a number between 1 and 100 (cannot be negative or zero).`,
        );
      } else {
        totalConfiguredPercent += node.sla_percent_allocation;
      }
    }

    if (
      node.allocated_duration_minutes !== undefined &&
      node.allocated_duration_minutes !== null
    ) {
      if (
        !Number.isFinite(node.allocated_duration_minutes) ||
        node.allocated_duration_minutes <= 0
      ) {
        errors.push(
          `Invalid allocated duration for department "${node.department_name}": must be a positive integer in minutes (cannot be negative or zero).`,
        );
      }
    }
  }

  if (totalConfiguredPercent > 100.0) {
    errors.push(
      `Total SLA percentage allocation across participating departments cannot exceed 100% (received: ${totalConfiguredPercent}%).`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    normalizedDependencies: normalizedDeps,
  };
}
