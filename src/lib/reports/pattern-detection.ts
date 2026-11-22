import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type {
  CategoryFilterOptionItem,
  DuplicateClusterItem,
  FilterOptionItem,
  PatternDetectionData,
  PatternFilters,
  RecurringCategoryPatternItem,
  RecurringGrievanceSummaryItem,
  RecurringPatternsSummary,
  ReportMetadata,
} from "@/types/reports";

/**
 * Audit standard data limitation notice for duplicate clusters.
 * LLD 3.10.5 requires confirmed duplicate linkages (e.g. duplicate_of_id / root_issue_id)
 * which are not present in the current schema.
 */
export const DUPLICATE_CLUSTERING_LIMITATION_NOTICE =
  "Duplicate grievance clustering requires explicit duplicate-linkage tracking in the database (e.g., duplicate_of_id or root_issue_id), which is not present in the current schema. In accordance with GRS audit standards, duplicate clusters are reported as unavailable to prevent unverified heuristics.";

/**
 * Minimum pattern threshold defined in LLD Section 3.10.5:
 * Category clustering is triggered when MORE THAN 7 grievances occur within the 30-day window (i.e. >= 8).
 */
export const CATEGORY_PATTERN_THRESHOLD = 7;

/**
 * Insufficient data threshold: if fewer than 5 grievances exist in the 30-day window,
 * trend patterns cannot be reliably assessed.
 */
export const INSUFFICIENT_DATA_THRESHOLD = 5;

/**
 * Normalizes the 30-day calendar analysis window per LLD Section 3.10.5.
 */
export function normalizePatternAnalysisWindow(
  startDateStr?: string,
  endDateStr?: string,
): { startDate: Date; endDate: Date; label: string } {
  const now = new Date();

  let endDate: Date;
  if (endDateStr) {
    endDate = new Date(endDateStr);
    if (Number.isNaN(endDate.getTime())) {
      endDate = new Date();
    } else {
      if (endDateStr.length <= 10) {
        endDate.setHours(23, 59, 59, 999);
      }
    }
  } else {
    endDate = new Date();
  }

  let startDate: Date;
  if (startDateStr) {
    startDate = new Date(startDateStr);
    if (Number.isNaN(startDate.getTime())) {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
    } else {
      if (startDateStr.length <= 10) {
        startDate.setHours(0, 0, 0, 0);
      }
    }
  } else {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
  }

  if (startDate > endDate) {
    const temp = new Date(startDate);
    startDate = new Date(endDate);
    endDate = temp;
  }

  const startFormatted = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const endFormatted = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return {
    startDate,
    endDate,
    label: `${startFormatted} – ${endFormatted} (Last 30 Days)`,
  };
}

/**
 * Resolves authorized department scope based on user role:
 * - Admin: can view all departments or optionally filter to one.
 * - Department Head: strictly locked to user's assigned department; client parameter is ignored.
 */
export function resolvePatternDepartmentScope(
  user: AuthUser,
  requestedDepartmentId?: string,
): {
  authorizedDepartmentId: bigint | null;
  departmentName: string | null;
  isOrganizationWide: boolean;
} {
  const roleName = user.roles.role_name;

  if (roleName === "ADMIN") {
    if (requestedDepartmentId && requestedDepartmentId.trim() !== "") {
      try {
        return {
          authorizedDepartmentId: BigInt(requestedDepartmentId),
          departmentName: null,
          isOrganizationWide: false,
        };
      } catch {
        return {
          authorizedDepartmentId: null,
          departmentName: null,
          isOrganizationWide: true,
        };
      }
    }
    return {
      authorizedDepartmentId: null,
      departmentName: null,
      isOrganizationWide: true,
    };
  }

  if (roleName === "DEPARTMENT_HEAD") {
    if (!user.department_id) {
      throw new Error("Department Head has no assigned department.");
    }
    return {
      authorizedDepartmentId: BigInt(user.department_id),
      departmentName: user.departments?.department_name || null,
      isOrganizationWide: false,
    };
  }

  throw new Error(
    "User role is not authorized to access pattern detection reports.",
  );
}

/**
 * Evaluates category recurring patterns and summary metrics from grievance records.
 * Can be run in-memory for testing or called with database results.
 */
export function evaluateRecurringPatternsFromRecords(
  grievances: Array<{
    grievance_id: bigint | string | number;
    grievance_number: string;
    title: string;
    priority: string;
    status: string;
    created_at: Date | string;
    category_id: bigint | string | number;
    subcategory_id?: bigint | string | number | null;
    categories?: {
      category_id: bigint | string | number;
      category_name: string;
    } | null;
    subcategories?: {
      subcategory_id: bigint | string | number;
      subcategory_name: string;
    } | null;
    grievance_departments?: Array<{
      department_id: bigint | string | number;
      involvement_type: string;
      departments?: {
        department_id: bigint | string | number;
        department_name: string;
      } | null;
    }> | null;
    department_id?: bigint | string | number | null;
  }>,
  options: {
    analysisPeriod: { startDate: string; endDate: string; label: string };
    authorizedDepartmentId: bigint | null;
    departmentName: string | null;
  },
): {
  categoryPatterns: RecurringCategoryPatternItem[];
  duplicateClusters: DuplicateClusterItem[];
  summary: RecurringPatternsSummary;
  dataLimitationNotice: string;
} {
  const { analysisPeriod, authorizedDepartmentId, departmentName } = options;
  const totalGrievancesInWindow = grievances.length;

  interface GroupAccumulator {
    deptIdStr: string;
    deptNameStr: string;
    categoryIdStr: string;
    categoryNameStr: string;
    matchingCount: number;
    subcategoriesMap: Map<string, { subcategoryName: string; count: number }>;
    criticalHighPriorityCount: number;
    associatedGrievances: RecurringGrievanceSummaryItem[];
  }

  const groups = new Map<string, GroupAccumulator>();

  for (const g of grievances) {
    const categoryIdStr = (
      g.categories?.category_id ||
      g.category_id ||
      "0"
    ).toString();
    const categoryNameStr = g.categories?.category_name || "General";

    let deptIdStr: string;
    let deptNameStr: string;

    if (authorizedDepartmentId !== null) {
      deptIdStr = authorizedDepartmentId.toString();
      deptNameStr = departmentName || `Dept #${deptIdStr}`;
    } else {
      const gDepts = g.grievance_departments || [];
      const primaryGd =
        gDepts.find(
          (gd) => (gd.involvement_type || "").toUpperCase() === "PRIMARY",
        ) || gDepts[0];

      if (primaryGd) {
        deptIdStr = primaryGd.department_id.toString();
        deptNameStr =
          primaryGd.departments?.department_name || `Dept #${deptIdStr}`;
      } else if (g.department_id) {
        deptIdStr = g.department_id.toString();
        deptNameStr = `Dept #${deptIdStr}`;
      } else {
        deptIdStr = "unassigned";
        deptNameStr = "Unassigned";
      }
    }

    const groupKey = `${deptIdStr}__${categoryIdStr}`;

    let acc = groups.get(groupKey);
    if (!acc) {
      acc = {
        deptIdStr,
        deptNameStr,
        categoryIdStr,
        categoryNameStr,
        matchingCount: 0,
        subcategoriesMap: new Map(),
        criticalHighPriorityCount: 0,
        associatedGrievances: [],
      };
      groups.set(groupKey, acc);
    }

    acc.matchingCount += 1;

    const prio = (g.priority || "MEDIUM").toUpperCase();
    if (prio === "CRITICAL" || prio === "HIGH") {
      acc.criticalHighPriorityCount += 1;
    }

    const subId = (
      g.subcategories?.subcategory_id ||
      g.subcategory_id ||
      "none"
    ).toString();
    const subName = g.subcategories?.subcategory_name || "General";
    const existingSub = acc.subcategoriesMap.get(subId);
    if (existingSub) {
      existingSub.count += 1;
    } else {
      acc.subcategoriesMap.set(subId, { subcategoryName: subName, count: 1 });
    }

    const createdAtIso =
      g.created_at instanceof Date
        ? g.created_at.toISOString()
        : new Date(g.created_at).toISOString();

    acc.associatedGrievances.push({
      grievanceId: g.grievance_id.toString(),
      grievanceNumber: g.grievance_number,
      title: g.title,
      priority: prio,
      status: g.status,
      createdAt: createdAtIso,
      subcategoryName: subName,
    });
  }

  const categoryPatterns: RecurringCategoryPatternItem[] = [];

  for (const [_, acc] of groups) {
    // LLD Section 3.10.5 Rule: categoryCount > 7 (i.e. at least 8)
    if (acc.matchingCount > CATEGORY_PATTERN_THRESHOLD) {
      // Sort associated grievances by created_at descending
      acc.associatedGrievances.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // Severity classification
      const isCritical =
        acc.matchingCount >= 15 ||
        acc.criticalHighPriorityCount / acc.matchingCount >= 0.4;
      const severity: "HIGH" | "CRITICAL" = isCritical ? "CRITICAL" : "HIGH";

      const subcategoriesInvolved = Array.from(
        acc.subcategoriesMap.entries(),
      ).map(([subId, data]) => ({
        subcategoryId: subId,
        subcategoryName: data.subcategoryName,
        count: data.count,
      }));
      subcategoriesInvolved.sort((a, b) => b.count - a.count);

      categoryPatterns.push({
        patternId: `pattern-cat-${acc.deptIdStr}-${acc.categoryIdStr}`,
        patternType: "CATEGORY_CLUSTERING",
        departmentId: acc.deptIdStr,
        departmentName: acc.deptNameStr,
        categoryId: acc.categoryIdStr,
        categoryName: acc.categoryNameStr,
        matchingCount: acc.matchingCount,
        threshold: CATEGORY_PATTERN_THRESHOLD,
        analysisPeriod,
        severity,
        subcategoriesInvolved,
        associatedGrievances: acc.associatedGrievances,
      });
    }
  }

  // Sort patterns by matching volume descending
  categoryPatterns.sort((a, b) => b.matchingCount - a.matchingCount);

  // Calculate summary metrics
  const totalPatternsDetected = categoryPatterns.length;
  let totalAffectedGrievances = 0;
  const deptSet = new Set<string>();

  for (const p of categoryPatterns) {
    totalAffectedGrievances += p.matchingCount;
    deptSet.add(p.departmentId);
  }

  const isInsufficientData =
    totalGrievancesInWindow < INSUFFICIENT_DATA_THRESHOLD;

  const summary: RecurringPatternsSummary = {
    totalPatternsDetected,
    totalAffectedGrievances,
    departmentsWithPatternsCount: deptSet.size,
    isInsufficientData,
    totalGrievancesInWindow,
    minThreshold: CATEGORY_PATTERN_THRESHOLD,
  };

  return {
    categoryPatterns,
    duplicateClusters: [],
    summary,
    dataLimitationNotice: DUPLICATE_CLUSTERING_LIMITATION_NOTICE,
  };
}

/**
 * Core Pattern Detection Service conforming to LLD Section 3.10.1 & 3.10.5.
 */
export async function generatePatternDetectionReport(
  filters: PatternFilters,
  user: AuthUser,
): Promise<PatternDetectionData> {
  // 1. Verify VIEW_REPORTS permission
  if (!hasPermission(user, "VIEW_REPORTS")) {
    throw new Error("Forbidden: VIEW_REPORTS permission required.");
  }

  // 2. Resolve Role-Based Department Scope
  const { authorizedDepartmentId, departmentName, isOrganizationWide } =
    resolvePatternDepartmentScope(user, filters.departmentId);

  // 3. Resolve 30-Day Calendar Analysis Window
  const {
    startDate,
    endDate,
    label: periodLabel,
  } = normalizePatternAnalysisWindow(filters.startDate, filters.endDate);

  // 4. Build Grievances Filter Criteria
  const where: Prisma.grievancesWhereInput = {
    created_at: {
      gte: startDate,
      lte: endDate,
    },
  };

  // Enforce department scoping:
  // - Admin scoped: filters to requested department
  // - Department Head: strictly scoped to authorizedDepartmentId
  if (authorizedDepartmentId !== null) {
    where.grievance_departments = {
      some: {
        department_id: authorizedDepartmentId,
      },
    };
  }

  // Optional category filter
  if (filters.categoryId && filters.categoryId.trim() !== "") {
    try {
      where.category_id = BigInt(filters.categoryId);
    } catch {
      // ignore invalid categoryId
    }
  }

  // Optional priority filter
  if (filters.priority && filters.priority.trim() !== "") {
    where.priority = filters.priority.toUpperCase();
  }

  // 5. Query Grievance Records in Analysis Window
  const grievances = await prisma.grievances.findMany({
    where,
    select: {
      grievance_id: true,
      grievance_number: true,
      title: true,
      priority: true,
      status: true,
      created_at: true,
      category_id: true,
      subcategory_id: true,
      categories: {
        select: {
          category_id: true,
          category_name: true,
        },
      },
      subcategories: {
        select: {
          subcategory_id: true,
          subcategory_name: true,
        },
      },
      grievance_departments: {
        select: {
          department_id: true,
          involvement_type: true,
          departments: {
            select: {
              department_id: true,
              department_name: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // 6. Resolve Resolved Department Name for metadata if filtered
  let resolvedDeptName = departmentName;
  if (!resolvedDeptName && authorizedDepartmentId !== null) {
    const deptRecord = await prisma.departments.findUnique({
      where: { department_id: authorizedDepartmentId },
      select: { department_name: true },
    });
    resolvedDeptName = deptRecord?.department_name || null;
  }

  const analysisPeriod = {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    label: periodLabel,
  };

  // 7. Evaluate Recurring Patterns
  const evaluated = evaluateRecurringPatternsFromRecords(grievances, {
    analysisPeriod,
    authorizedDepartmentId,
    departmentName: resolvedDeptName,
  });

  // 8. Construct Metadata
  const metadata: ReportMetadata = {
    reportingPeriod: analysisPeriod,
    generatedAt: new Date().toISOString(),
    generatedBy: {
      userId: user.user_id.toString(),
      name: `${user.first_name} ${user.last_name || ""}`.trim(),
      role: user.roles.role_name,
    },
    scope: {
      departmentId: authorizedDepartmentId
        ? authorizedDepartmentId.toString()
        : null,
      departmentName: resolvedDeptName,
      isOrganizationWide,
    },
  };

  return {
    metadata,
    summary: evaluated.summary,
    categoryPatterns: evaluated.categoryPatterns,
    duplicateClusters: evaluated.duplicateClusters,
    dataLimitationNotice: evaluated.dataLimitationNotice,
  };
}

/**
 * Retrieves dropdown filter options for Trend & Recurring Pattern Analysis.
 */
export async function getPatternFilterOptions(user: AuthUser): Promise<{
  departments: FilterOptionItem[];
  categories: CategoryFilterOptionItem[];
  priorities: string[];
}> {
  const isDeptHead = user.roles.role_name === "DEPARTMENT_HEAD";
  const userDeptId = user.department_id ? BigInt(user.department_id) : null;

  // Query departments (Admin: all active; Department Head: only user's department)
  const departmentsQuery = await prisma.departments.findMany({
    where: {
      status: "ACTIVE",
      ...(isDeptHead && userDeptId ? { department_id: userDeptId } : {}),
    },
    select: {
      department_id: true,
      department_name: true,
    },
    orderBy: {
      department_name: "asc",
    },
  });

  const departments: FilterOptionItem[] = departmentsQuery.map((d) => ({
    id: d.department_id.toString(),
    name: d.department_name,
  }));

  // Query categories with subcategories
  const categoriesQuery = await prisma.categories.findMany({
    where: {
      status: "ACTIVE",
    },
    select: {
      category_id: true,
      category_name: true,
      subcategories: {
        where: {
          status: "ACTIVE",
        },
        select: {
          subcategory_id: true,
          subcategory_name: true,
        },
        orderBy: {
          subcategory_name: "asc",
        },
      },
    },
    orderBy: {
      category_name: "asc",
    },
  });

  const categories: CategoryFilterOptionItem[] = categoriesQuery.map((c) => ({
    id: c.category_id.toString(),
    name: c.category_name,
    subcategories: c.subcategories.map((s) => ({
      id: s.subcategory_id.toString(),
      name: s.subcategory_name,
    })),
  }));

  const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  return {
    departments,
    categories,
    priorities,
  };
}
