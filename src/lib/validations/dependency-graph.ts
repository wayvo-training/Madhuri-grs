export interface DepartmentDependencyNode {
  department_name: string;
  department_id?: string;
  execution_order: number;
  stage?: number;
  prerequisites: string[]; // Names or IDs of prerequisite departments
  involvement_type?: "PRIMARY" | "EQUAL" | "SUPPORT" | "SUPPORTING";
  sla_percent_allocation?: number | null;
  allocated_duration_minutes?: number | null;
}

export interface DerivedOrderNode {
  department_name: string;
  department_id?: string;
  execution_order: number;
  stage: number;
  prerequisites: string[];
  involvement_type?: "PRIMARY" | "EQUAL" | "SUPPORT" | "SUPPORTING";
  sla_percent_allocation?: number | null;
  allocated_duration_minutes?: number | null;
  is_starting_department: boolean;
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
  derivedOrder?: DerivedOrderNode[];
}

/**
 * Derives a deterministic execution order and execution stages from a directed dependency graph.
 *
 * Requirements:
 * 1. Kahn's algorithm for topological sorting. Insertion order does not determine execution order.
 * 2. Deterministic order if multiple valid topological orders exist:
 *    - Priority: Stage ascending -> Primary department first -> original input list order.
 * 3. Detects dependency cycles, self-dependencies, and invalid department references.
 * 4. Identifies independent starting departments (Stage 1, 0 prerequisites).
 * 5. Returns derived execution order (1, 2, 3...) and stage (1, 2, 3...).
 */
export function deriveTopologicalOrder(
  allDepartments: {
    name: string;
    id?: string;
    isPrimary: boolean;
    involvementType?: "PRIMARY" | "EQUAL" | "SUPPORT" | "SUPPORTING";
  }[],
  depMap: Map<string, DepartmentDependencyNode>,
): {
  valid: boolean;
  errors: string[];
  derivedOrder: DerivedOrderNode[];
} {
  const errors: string[] = [];
  const allNamesLower = new Set(
    allDepartments.map((d) => d.name.toLowerCase().trim()),
  );
  const allDeptsMap = new Map(
    allDepartments.map((d) => [d.name.toLowerCase().trim(), d]),
  );

  // 1. Build clean prerequisites map and validate references / self-dependencies
  const prereqMap = new Map<string, string[]>();

  for (const dept of allDepartments) {
    const lower = dept.name.toLowerCase().trim();
    const custom = depMap.get(lower);

    let rawPrereqs: string[] = [];
    if (custom && Array.isArray(custom.prerequisites)) {
      rawPrereqs = custom.prerequisites
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
    } else if (!dept.isPrimary) {
      // Backward compatibility fallback for legacy rules without explicit prerequisites array
      const primaryDept = allDepartments.find((d) => d.isPrimary);
      rawPrereqs = primaryDept ? [primaryDept.name] : [];
    }

    for (const prereq of rawPrereqs) {
      const pLower = prereq.toLowerCase();
      if (pLower === lower) {
        errors.push(
          `Department "${dept.name}" cannot have itself as a prerequisite.`,
        );
      } else if (!allNamesLower.has(pLower)) {
        errors.push(
          `Prerequisite "${prereq}" for department "${dept.name}" is not part of this routing policy.`,
        );
      }
    }

    // Deduplicate prerequisites (case-insensitive) and preserve canonical casing
    const seenP = new Set<string>();
    const cleanPrereqs: string[] = [];
    for (const p of rawPrereqs) {
      const pLower = p.toLowerCase();
      if (!seenP.has(pLower) && allNamesLower.has(pLower) && pLower !== lower) {
        seenP.add(pLower);
        const canonical = allDeptsMap.get(pLower)?.name || p;
        cleanPrereqs.push(canonical);
      }
    }

    prereqMap.set(lower, cleanPrereqs);
  }

  if (errors.length > 0) {
    return { valid: false, errors, derivedOrder: [] };
  }

  // 2. Build adjacency list and in-degrees
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const dept of allDepartments) {
    const lower = dept.name.toLowerCase().trim();
    inDegree.set(lower, prereqMap.get(lower)?.length || 0);
    adjList.set(lower, []);
  }

  for (const dept of allDepartments) {
    const dependentLower = dept.name.toLowerCase().trim();
    const prereqs = prereqMap.get(dependentLower) || [];
    for (const p of prereqs) {
      adjList.get(p.toLowerCase())?.push(dependentLower);
    }
  }

  // 3. Track execution stages
  const stageMap = new Map<string, number>();
  for (const dept of allDepartments) {
    const lower = dept.name.toLowerCase().trim();
    if ((inDegree.get(lower) ?? 0) === 0) {
      stageMap.set(lower, 1);
    }
  }

  // 4. Collect initial ready list (nodes with in-degree 0)
  const readyList: string[] = [];
  for (const dept of allDepartments) {
    const lower = dept.name.toLowerCase().trim();
    if ((inDegree.get(lower) ?? 0) === 0) {
      readyList.push(lower);
    }
  }

  const sortedOrderLower: string[] = [];

  // 5. Deterministic Kahn's algorithm
  while (readyList.length > 0) {
    // Deterministic comparator:
    // 1. Stage ascending
    // 2. Primary department first
    // 3. Original list order in allDepartments
    readyList.sort((a, b) => {
      const stageA = stageMap.get(a) ?? 1;
      const stageB = stageMap.get(b) ?? 1;
      if (stageA !== stageB) return stageA - stageB;

      const isPrimaryA = allDeptsMap.get(a)?.isPrimary ? 1 : 0;
      const isPrimaryB = allDeptsMap.get(b)?.isPrimary ? 1 : 0;
      if (isPrimaryA !== isPrimaryB) return isPrimaryB - isPrimaryA;

      const idxA = allDepartments.findIndex(
        (d) => d.name.toLowerCase().trim() === a,
      );
      const idxB = allDepartments.findIndex(
        (d) => d.name.toLowerCase().trim() === b,
      );
      return idxA - idxB;
    });

    const currentLower = readyList.shift();
    if (!currentLower) break;

    sortedOrderLower.push(currentLower);
    const currentStage = stageMap.get(currentLower) ?? 1;

    const neighbors = adjList.get(currentLower) || [];
    for (const nbrLower of neighbors) {
      const currentNbrStage = stageMap.get(nbrLower) ?? 1;
      stageMap.set(nbrLower, Math.max(currentNbrStage, currentStage + 1));

      const newDeg = (inDegree.get(nbrLower) ?? 1) - 1;
      inDegree.set(nbrLower, newDeg);
      if (newDeg === 0) {
        readyList.push(nbrLower);
      }
    }
  }

  // 6. Detect cycles or graphs without valid topological order
  if (sortedOrderLower.length < allDepartments.length) {
    const cyclicNodes = allDepartments
      .filter((d) => (inDegree.get(d.name.toLowerCase().trim()) ?? 0) > 0)
      .map((d) => d.name);

    errors.push(
      `Dependency cycle detected involving department(s): ${cyclicNodes.join(", ")}. Prerequisites must form a directed acyclic workflow without circular loops.`,
    );

    return { valid: false, errors, derivedOrder: [] };
  }

  // 7. Assemble final derived order
  const derivedOrder: DerivedOrderNode[] = sortedOrderLower.map(
    (lower, index) => {
      const deptInfo = allDeptsMap.get(lower)!;
      const custom = depMap.get(lower);
      const stage = stageMap.get(lower) ?? 1;
      const prereqs = prereqMap.get(lower) || [];

      return {
        department_name: deptInfo.name,
        department_id: deptInfo.id || custom?.department_id,
        execution_order: index + 1,
        stage,
        prerequisites: prereqs,
        involvement_type:
          custom?.involvement_type ||
          (deptInfo.isPrimary ? "PRIMARY" : "SUPPORT"),
        sla_percent_allocation: custom?.sla_percent_allocation,
        allocated_duration_minutes: custom?.allocated_duration_minutes,
        is_starting_department: prereqs.length === 0,
      };
    },
  );

  return { valid: true, errors: [], derivedOrder };
}

/**
 * Validates multi-department routing policy rules:
 * 1. Exactly one primary lead department is specified.
 * 2. No duplicate supporting departments.
 * 3. Primary department cannot also be a supporting department.
 * 4. Valid prerequisites (all prerequisites must be participating departments, no self-dependencies).
 * 5. Dependency-driven sequential execution order derived via topological sorting (Kahn's algorithm).
 * 6. Departments with no prerequisites activate first (Stage 1); unmet prerequisites remain BLOCKED.
 * 7. Circular dependency rejection.
 * 8. Valid SLA allocations (percentages between 1-100, sum <= 100%, positive durations).
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

  // If there are fatal primary department errors, return early
  if (errors.length > 0 && !primaryName && !primaryId) {
    return { valid: false, errors };
  }

  const isSequential = input.dependency_type === "SEQUENTIAL";
  const rawDeps = input.dependencies || [];
  const depMap = new Map<string, DepartmentDependencyNode>();

  for (const dep of rawDeps) {
    if (!dep.department_name) continue;
    depMap.set(dep.department_name.toLowerCase().trim(), dep);
  }

  const primaryCustom = primaryName
    ? depMap.get(primaryName.toLowerCase())
    : undefined;
  const effectivePrimarySlaPercent =
    input.primary_sla_percent ?? primaryCustom?.sla_percent_allocation;
  const effectivePrimaryDuration =
    input.primary_duration_minutes ?? primaryCustom?.allocated_duration_minutes;

  // Ensure depMap has the primary department's SLA allocation
  if (primaryName) {
    const existing = depMap.get(primaryName.toLowerCase());
    depMap.set(primaryName.toLowerCase(), {
      department_name: primaryName,
      department_id: primaryId ? primaryId.toString() : existing?.department_id,
      execution_order: existing?.execution_order ?? 1,
      prerequisites: existing?.prerequisites ?? [],
      involvement_type: existing?.involvement_type || "PRIMARY",
      sla_percent_allocation: effectivePrimarySlaPercent ?? null,
      allocated_duration_minutes: effectivePrimaryDuration ?? null,
    });
  }

  const normalizedDeps: DepartmentDependencyNode[] = [];
  let derivedOrder: DerivedOrderNode[] = [];

  if (!isSequential) {
    // PARALLEL workflow: primary department executes at Step 1, Stage 1
    if (primaryName) {
      normalizedDeps.push({
        department_name: primaryName,
        department_id: primaryId
          ? primaryId.toString()
          : primaryCustom?.department_id,
        execution_order: 1,
        stage: 1,
        prerequisites: [],
        involvement_type: primaryCustom?.involvement_type || "PRIMARY",
        sla_percent_allocation: effectivePrimarySlaPercent ?? null,
        allocated_duration_minutes: effectivePrimaryDuration ?? null,
      });
    }

    // All supporting departments execute concurrently at Step 1, Stage 1
    for (const suppName of normalizedSupporting) {
      const custom = depMap.get(suppName.toLowerCase());
      normalizedDeps.push({
        department_name: suppName,
        department_id: custom?.department_id,
        execution_order: 1,
        stage: 1,
        prerequisites: [],
        involvement_type: custom?.involvement_type || "SUPPORT",
        sla_percent_allocation: custom?.sla_percent_allocation ?? null,
        allocated_duration_minutes: custom?.allocated_duration_minutes ?? null,
      });
    }

    derivedOrder = normalizedDeps.map((d) => ({
      ...d,
      stage: 1,
      is_starting_department: true,
    }));
  } else {
    // SEQUENTIAL workflow: derive execution order and stages from topological sort
    const allDepartments: {
      name: string;
      id?: string;
      isPrimary: boolean;
      involvementType?: "PRIMARY" | "EQUAL" | "SUPPORT" | "SUPPORTING";
    }[] = [
      ...(primaryName
        ? [
            {
              name: primaryName,
              id: primaryId ? primaryId.toString() : undefined,
              isPrimary: true,
              involvementType: "PRIMARY" as const,
            },
          ]
        : []),
      ...normalizedSupporting.map((name) => {
        const custom = depMap.get(name.toLowerCase());
        return {
          name,
          id: custom?.department_id,
          isPrimary: false,
          involvementType: custom?.involvement_type || "SUPPORT",
        };
      }),
    ];

    const topoResult = deriveTopologicalOrder(allDepartments, depMap);
    if (!topoResult.valid) {
      errors.push(...topoResult.errors);
      return { valid: false, errors, derivedOrder: [] };
    }

    derivedOrder = topoResult.derivedOrder;
    const derivedMap = new Map(
      derivedOrder.map((node) => [
        node.department_name.toLowerCase().trim(),
        node,
      ]),
    );

    // Primary department in normalizedDependencies
    if (primaryName) {
      const derivedPrimary = derivedMap.get(primaryName.toLowerCase());
      normalizedDeps.push({
        department_name: primaryName,
        department_id: primaryId
          ? primaryId.toString()
          : primaryCustom?.department_id,
        execution_order: derivedPrimary?.execution_order ?? 1,
        stage: derivedPrimary?.stage ?? 1,
        prerequisites: derivedPrimary?.prerequisites ?? [],
        involvement_type: primaryCustom?.involvement_type || "PRIMARY",
        sla_percent_allocation: effectivePrimarySlaPercent ?? null,
        allocated_duration_minutes: effectivePrimaryDuration ?? null,
      });
    }

    // Map derived execution orders & stages back into normalizedDependencies for supporting departments
    for (const suppName of normalizedSupporting) {
      const derived = derivedMap.get(suppName.toLowerCase());
      const custom = depMap.get(suppName.toLowerCase());

      normalizedDeps.push({
        department_name: suppName,
        department_id: custom?.department_id,
        execution_order: derived?.execution_order ?? 2,
        stage: derived?.stage ?? 2,
        prerequisites:
          derived?.prerequisites ?? (primaryName ? [primaryName] : []),
        involvement_type: custom?.involvement_type || "SUPPORT",
        sla_percent_allocation: custom?.sla_percent_allocation ?? null,
        allocated_duration_minutes: custom?.allocated_duration_minutes ?? null,
      });
    }
  }

  // Validate SLA allocations: reject negative values, invalid ranges, and totals exceeding 100%
  let totalConfiguredPercent = 0;
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
    derivedOrder,
  };
}
