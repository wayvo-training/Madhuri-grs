import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  normalizeDateRange,
  resolveDepartmentScope,
} from "@/lib/reports/operational-reports";
import type {
  DataQualityExceptionsSummary,
  DepartmentProcessingTimeItem,
  PendingCaseAgeBucket,
  PendingCaseItem,
  PendingCasesSummary,
  PriorityTatItem,
  ReportMetadata,
  ResolutionAnalyticsApiResponse,
  ResolutionAnalyticsData,
  ResolutionAnalyticsFilterOptions,
  ResolutionAnalyticsFilters,
  ResolutionOverviewSummary,
  ResolutionStageItem,
  ResolutionTrendItem,
  ReworkAndReopenSummary,
  SlaCycleComplianceItem,
  SlaResolutionComplianceSummary,
} from "@/types/reports";

/**
 * Calculates arithmetic mean of a number array, rounded to 1 decimal place.
 */
export function calculateAverage(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / values.length).toFixed(1));
}

/**
 * Calculates statistical median of a number array, rounded to 1 decimal place.
 */
export function calculateMedian(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return Number(sorted[mid].toFixed(1));
  }
  return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
}

export type GrievanceWithResolutionRelations = Prisma.grievancesGetPayload<{
  include: {
    categories: true;
    subcategories: true;
    grievance_departments: {
      include: {
        departments: true;
      };
    };
    resolutions: {
      include: {
        resolution_reviews: true;
      };
    };
    sla_tracking: true;
  };
}>;

/**
 * Generates Resolution Analytics (TAT) data according to LLD Section 3.10.3.
 */
export async function generateResolutionAnalytics(
  filters: ResolutionAnalyticsFilters,
  currentUser: AuthUser,
): Promise<ResolutionAnalyticsApiResponse> {
  // 1. RBAC Verification
  if (!hasPermission(currentUser, "VIEW_REPORTS")) {
    return {
      success: false,
      message: "Forbidden: You lack permission to view reports.",
      data: null as unknown as ResolutionAnalyticsData,
      filterOptions: { departments: [], categories: [], priorities: [] },
    };
  }

  // 2. Resolve Dates and Scope
  const {
    startDate,
    endDate,
    label: periodLabel,
  } = normalizeDateRange(filters.startDate, filters.endDate);

  const scope = resolveDepartmentScope(currentUser, filters.departmentId);

  // 3. Fetch all active departments & categories for filters and metadata
  const [allDepartments, allCategories] = await Promise.all([
    prisma.departments.findMany({
      orderBy: { department_name: "asc" },
      select: { department_id: true, department_name: true },
    }),
    prisma.categories.findMany({
      orderBy: { category_name: "asc" },
      include: {
        subcategories: {
          orderBy: { subcategory_name: "asc" },
          select: { subcategory_id: true, subcategory_name: true },
        },
      },
    }),
  ]);

  let scopedDepartmentName: string | null = null;
  if (scope.authorizedDepartmentId) {
    const matchedDept = allDepartments.find(
      (d) => d.department_id === scope.authorizedDepartmentId,
    );
    scopedDepartmentName = matchedDept?.department_name || null;
  }

  // 4. Construct Where Clause
  const whereConditions: Prisma.grievancesWhereInput = {};

  if (scope.authorizedDepartmentId) {
    whereConditions.grievance_departments = {
      some: {
        department_id: scope.authorizedDepartmentId,
      },
    };
  }

  if (filters.categoryId) {
    try {
      whereConditions.category_id = BigInt(filters.categoryId);
    } catch {
      // ignore
    }
  }

  if (filters.subcategoryId) {
    try {
      whereConditions.subcategory_id = BigInt(filters.subcategoryId);
    } catch {
      // ignore
    }
  }

  if (filters.priority && filters.priority.toUpperCase() !== "ALL") {
    whereConditions.priority = filters.priority.toUpperCase();
  }

  // Fetch candidate grievances matching scope and filters
  const grievances = (await prisma.grievances.findMany({
    where: whereConditions,
    include: {
      categories: true,
      subcategories: true,
      grievance_departments: {
        include: {
          departments: true,
        },
      },
      resolutions: {
        include: {
          resolution_reviews: true,
        },
      },
      sla_tracking: {
        orderBy: { cycle_number: "desc" },
      },
    },
  })) as GrievanceWithResolutionRelations[];

  const now = new Date();

  // =================================================================
  // 5. END-TO-END TAT CALCULATION & DATA-QUALITY EXCEPTION HANDLING
  // =================================================================
  // Rule 1: Initial submission timestamp is strictly grievances.created_at.
  // Rule 2: Final closure timestamp is strictly grievances.closed_at.
  // Rule 3: DO NOT use grievances.updated_at as an automatic fallback for closed_at.
  // Rule 4: Closed records with missing closed_at are flagged as Data Quality Exceptions.
  // Rule 5: Unresolved grievances are strictly excluded from completed TAT calculations.
  // Rule 6: Reopened cycles span initial submission to final closure.

  const validClosedInPeriod: GrievanceWithResolutionRelations[] = [];
  const missingClosedAtInPeriod: GrievanceWithResolutionRelations[] = [];
  const tatHoursList: number[] = [];

  for (const g of grievances) {
    if (g.status === "CLOSED") {
      if (g.closed_at) {
        if (g.closed_at >= startDate && g.closed_at <= endDate) {
          validClosedInPeriod.push(g);
          const durationMs = g.closed_at.getTime() - g.created_at.getTime();
          const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
          tatHoursList.push(durationHours);
        }
      } else {
        // Closed without closed_at: inspect updated_at to check if closure occurred in reporting period
        if (g.updated_at >= startDate && g.updated_at <= endDate) {
          missingClosedAtInPeriod.push(g);
          // Strictly DO NOT fabricate a duration using updated_at!
        }
      }
    }
  }

  const totalClosedCount =
    validClosedInPeriod.length + missingClosedAtInPeriod.length;
  const closedWithValidTat = validClosedInPeriod.length;
  const missingClosedAtCount = missingClosedAtInPeriod.length;

  const avgTatHours = calculateAverage(tatHoursList);
  const medianTatHours = calculateMedian(tatHoursList);
  const avgTatDays = Number((avgTatHours / 24).toFixed(1));
  const medianTatDays = Number((medianTatHours / 24).toFixed(1));

  // =================================================================
  // 6. RESOLUTION SUBMISSIONS & ACTIVE WORKFLOW STAGES
  // =================================================================
  let totalSubmissionsInPeriod = 0;
  for (const g of grievances) {
    for (const r of g.resolutions) {
      if (r.submitted_at >= startDate && r.submitted_at <= endDate) {
        totalSubmissionsInPeriod++;
      }
    }
  }

  const pendingReviewsCount = grievances.filter(
    (g) => g.status === "RESOLUTION_PENDING_APPROVAL",
  ).length;

  const awaitingEmployeeReviewCount = grievances.filter(
    (g) => g.status === "RESOLVED" || g.status === "UNDER_REVIEW",
  ).length;

  const pendingCases = grievances.filter(
    (g) => g.status !== "CLOSED" && !g.closed_at,
  );

  // =================================================================
  // 7. DEPARTMENTAL PROCESSING TIME (SEQUENTIAL & PARALLEL AWARE)
  // =================================================================
  // Rule 1: Use actual grievance_departments.activated_at (or assigned_at).
  // Rule 2: DO NOT use grievance.created_at as a fallback for department activation.
  // Rule 3: DO NOT count time spent waiting for a prerequisite department while BLOCKED.
  // Rule 4: Handle missing activation timestamps separately as data quality exceptions.
  // Rule 5: Preserve Primary vs Supporting department distinctions.

  let totalMissingActivationCount = 0;

  const targetDepartments = scope.authorizedDepartmentId
    ? allDepartments.filter(
        (d) => d.department_id === scope.authorizedDepartmentId,
      )
    : allDepartments;

  const departmentProcessing: DepartmentProcessingTimeItem[] =
    targetDepartments.map((dept) => {
      const deptId = dept.department_id;
      let totalInvolved = 0;
      let completedStagesCount = 0;
      let completedWithValidDurationCount = 0;
      let missingActivationCount = 0;
      let pendingStagesCount = 0;
      let blockedStagesCount = 0;
      let primaryCount = 0;
      let supportingCount = 0;
      let deptSlaCompliantCount = 0;
      let deptSlaBreachedCount = 0;

      const allDeptDurations: number[] = [];
      const primaryDurations: number[] = [];
      const supportingDurations: number[] = [];

      for (const g of grievances) {
        const gd = g.grievance_departments.find(
          (d) => d.department_id === deptId,
        );
        if (!gd) continue;

        totalInvolved++;
        const isPrimary =
          gd.involvement_type === "PRIMARY" || gd.involvement_type === "EQUAL";
        if (isPrimary) {
          primaryCount++;
        } else {
          supportingCount++;
        }

        const isCompleted =
          gd.completed_at !== null &&
          (gd.status === "COMPLETED" || gd.status === "RESOLVED");

        if (isCompleted && gd.completed_at) {
          completedStagesCount++;

          // Authoritative start timestamp: activated_at, or assigned_at if activated_at not backfilled
          // STRICT RULE: Never fall back to grievance.created_at!
          const startTime = gd.activated_at || gd.assigned_at;

          if (!startTime) {
            missingActivationCount++;
            totalMissingActivationCount++;
            // Exclude from duration calculation to avoid fabricating duration
          } else {
            completedWithValidDurationCount++;
            const durationMs =
              new Date(gd.completed_at).getTime() -
              new Date(startTime).getTime();
            const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));

            allDeptDurations.push(durationHours);
            if (isPrimary) {
              primaryDurations.push(durationHours);
            } else {
              supportingDurations.push(durationHours);
            }
          }

          if (gd.sla_status === "BREACHED") {
            deptSlaBreachedCount++;
          } else {
            deptSlaCompliantCount++;
          }
        } else if (gd.status === "BLOCKED") {
          // Waiting for prerequisite department in sequential chain
          blockedStagesCount++;
        } else if (gd.status !== "REMOVED") {
          pendingStagesCount++;
        }
      }

      const avgHours = calculateAverage(allDeptDurations);
      const medianHours = calculateMedian(allDeptDurations);
      const avgPrimary = calculateAverage(primaryDurations);
      const avgSupporting = calculateAverage(supportingDurations);
      const totalDeptSla = deptSlaCompliantCount + deptSlaBreachedCount;
      const deptSlaRate =
        totalDeptSla > 0
          ? Number(((deptSlaCompliantCount / totalDeptSla) * 100).toFixed(1))
          : 100;

      return {
        departmentId: deptId.toString(),
        departmentName: dept.department_name,
        totalInvolved,
        completedStagesCount,
        completedWithValidDurationCount,
        missingActivationCount,
        pendingStagesCount,
        blockedStagesCount,
        avgProcessingTimeHours: avgHours,
        medianProcessingTimeHours: medianHours,
        avgProcessingTimeDays: Number((avgHours / 24).toFixed(1)),
        medianProcessingTimeDays: Number((medianHours / 24).toFixed(1)),
        primaryCount,
        supportingCount,
        avgPrimaryProcessingHours: avgPrimary,
        avgSupportingProcessingHours: avgSupporting,
        slaComplianceRate: deptSlaRate,
      };
    });

  const activeDepartmentProcessing =
    departmentProcessing.filter((d) => d.totalInvolved > 0).length > 0
      ? departmentProcessing.filter((d) => d.totalInvolved > 0)
      : departmentProcessing;

  // =================================================================
  // 8. SLA COMPLIANCE & CYCLE-LEVEL ACCOUNTING
  // =================================================================
  // Rule 1: Inspect actual sla_tracking records (completed_at, due_at, cycle_type, cycle_number, paused minutes).
  // Rule 2: DO NOT infer historical compliance solely from live grievances.sla_status.
  // Rule 3: Account for rework and reopened SLA cycles without double-counting grievances.
  // Rule 4: Clear denominator: Total closed grievances evaluated with an applicable SLA deadline.
  // Rule 5: Incomplete / unresolved cycles are strictly excluded from completed compliance.

  let overallCompliantClosedCount = 0;
  let overallBreachedClosedCount = 0;

  // Cycle type aggregation maps for completed cycles
  const cycleTypeStats: Record<
    "INITIAL" | "REWORK" | "REOPENED",
    {
      total: number;
      compliant: number;
      breached: number;
      pausedMinutes: number[];
    }
  > = {
    INITIAL: { total: 0, compliant: 0, breached: 0, pausedMinutes: [] },
    REWORK: { total: 0, compliant: 0, breached: 0, pausedMinutes: [] },
    REOPENED: { total: 0, compliant: 0, breached: 0, pausedMinutes: [] },
  };

  // Evaluate SLA compliance for each valid closed grievance
  for (const g of validClosedInPeriod) {
    const closedTime = g.closed_at as Date;

    // Fetch completed SLA cycles for this closed grievance
    const completedSlaCycles = g.sla_tracking.filter(
      (s) => s.completed_at !== null,
    );

    let hasSlaEvaluation = false;
    let isGrievanceBreached = false;

    if (completedSlaCycles.length > 0) {
      hasSlaEvaluation = true;

      // Evaluate each completed cycle for cycle-level breakdown
      for (const cycle of completedSlaCycles) {
        const cType: "INITIAL" | "REWORK" | "REOPENED" =
          cycle.cycle_type === "REOPENED"
            ? "REOPENED"
            : cycle.cycle_type === "REWORK"
              ? "REWORK"
              : "INITIAL";

        const stats = cycleTypeStats[cType];
        stats.total++;
        stats.pausedMinutes.push(cycle.accumulated_paused_minutes || 0);

        // A completed cycle breached if completed_at > due_at or status is BREACHED
        const isCycleBreached =
          (cycle.completed_at && cycle.completed_at > cycle.due_at) ||
          cycle.status === "BREACHED";

        if (isCycleBreached) {
          stats.breached++;
        } else {
          stats.compliant++;
        }
      }

      // Authoritative grievance-level outcome:
      // The final resolution cycle that finalized the case determines whether resolution was delivered within SLA
      const finalCycle = completedSlaCycles[0]; // ordered desc by cycle_number
      if (finalCycle) {
        isGrievanceBreached =
          (finalCycle.completed_at &&
            finalCycle.completed_at > finalCycle.due_at) ||
          finalCycle.status === "BREACHED";
      }
    } else if (g.due_at) {
      // Fallback to grievance master due_at if no sla_tracking cycle records exist
      hasSlaEvaluation = true;
      isGrievanceBreached = closedTime > g.due_at;
    }

    if (hasSlaEvaluation) {
      if (isGrievanceBreached) {
        overallBreachedClosedCount++;
      } else {
        overallCompliantClosedCount++;
      }
    }
  }

  const totalEvaluatedSla =
    overallCompliantClosedCount + overallBreachedClosedCount;
  const overallSlaComplianceRate =
    totalEvaluatedSla > 0
      ? Number(
          ((overallCompliantClosedCount / totalEvaluatedSla) * 100).toFixed(1),
        )
      : 100;

  const byCycleType: SlaCycleComplianceItem[] = [
    {
      cycleType: "INITIAL",
      label: "Initial Investigation Cycles",
      totalCompletedCycles: cycleTypeStats.INITIAL.total,
      compliantCycles: cycleTypeStats.INITIAL.compliant,
      breachedCycles: cycleTypeStats.INITIAL.breached,
      complianceRate:
        cycleTypeStats.INITIAL.total > 0
          ? Number(
              (
                (cycleTypeStats.INITIAL.compliant /
                  cycleTypeStats.INITIAL.total) *
                100
              ).toFixed(1),
            )
          : 100,
      avgPausedMinutes: calculateAverage(cycleTypeStats.INITIAL.pausedMinutes),
    },
    {
      cycleType: "REWORK",
      label: "Resolution Rework Cycles",
      totalCompletedCycles: cycleTypeStats.REWORK.total,
      compliantCycles: cycleTypeStats.REWORK.compliant,
      breachedCycles: cycleTypeStats.REWORK.breached,
      complianceRate:
        cycleTypeStats.REWORK.total > 0
          ? Number(
              (
                (cycleTypeStats.REWORK.compliant /
                  cycleTypeStats.REWORK.total) *
                100
              ).toFixed(1),
            )
          : 100,
      avgPausedMinutes: calculateAverage(cycleTypeStats.REWORK.pausedMinutes),
    },
    {
      cycleType: "REOPENED",
      label: "Post-Closure Reopened Cycles",
      totalCompletedCycles: cycleTypeStats.REOPENED.total,
      compliantCycles: cycleTypeStats.REOPENED.compliant,
      breachedCycles: cycleTypeStats.REOPENED.breached,
      complianceRate:
        cycleTypeStats.REOPENED.total > 0
          ? Number(
              (
                (cycleTypeStats.REOPENED.compliant /
                  cycleTypeStats.REOPENED.total) *
                100
              ).toFixed(1),
            )
          : 100,
      avgPausedMinutes: calculateAverage(cycleTypeStats.REOPENED.pausedMinutes),
    },
  ];

  // =================================================================
  // 9. TAT BY PRIORITY BREAKDOWN
  // =================================================================
  const priorities = ["URGENT", "HIGH", "NORMAL", "LOW"];
  const tatByPriority: PriorityTatItem[] = priorities.map((priority) => {
    const priorityGrievances = grievances.filter(
      (g) => (g.priority || "").toUpperCase() === priority,
    );
    const prioValidClosed = validClosedInPeriod.filter(
      (g) => (g.priority || "").toUpperCase() === priority,
    );
    const prioMissingClosed = missingClosedAtInPeriod.filter(
      (g) => (g.priority || "").toUpperCase() === priority,
    );

    const prioHoursList: number[] = [];
    let compliantCount = 0;
    let breachedCount = 0;

    for (const g of prioValidClosed) {
      const closedTime = g.closed_at as Date;
      const diffHours = Math.max(
        0,
        (closedTime.getTime() - g.created_at.getTime()) / (1000 * 60 * 60),
      );
      prioHoursList.push(diffHours);

      // Check SLA compliance
      const completedCycles = g.sla_tracking.filter(
        (s) => s.completed_at !== null,
      );
      let isBreached = false;
      let evaluated = false;

      if (completedCycles.length > 0) {
        evaluated = true;
        const finalCycle = completedCycles[0];
        isBreached =
          (finalCycle.completed_at &&
            finalCycle.completed_at > finalCycle.due_at) ||
          finalCycle.status === "BREACHED";
      } else if (g.due_at) {
        evaluated = true;
        isBreached = closedTime > g.due_at;
      }

      if (evaluated) {
        if (isBreached) {
          breachedCount++;
        } else {
          compliantCount++;
        }
      }
    }

    const avgHours = calculateAverage(prioHoursList);
    const medianHours = calculateMedian(prioHoursList);
    const totalPrioSla = compliantCount + breachedCount;
    const slaRate =
      totalPrioSla > 0
        ? Number(((compliantCount / totalPrioSla) * 100).toFixed(1))
        : 100;

    return {
      priority,
      totalGrievances: priorityGrievances.length,
      closedCount: prioValidClosed.length + prioMissingClosed.length,
      closedWithValidTat: prioValidClosed.length,
      missingClosedAtCount: prioMissingClosed.length,
      avgResolutionTimeHours: avgHours,
      medianResolutionTimeHours: medianHours,
      avgResolutionTimeDays: Number((avgHours / 24).toFixed(1)),
      medianResolutionTimeDays: Number((medianHours / 24).toFixed(1)),
      slaCompliantCount: compliantCount,
      slaBreachedCount: breachedCount,
      slaComplianceRate: slaRate,
    };
  });

  // =================================================================
  // 10. REOPENING & REWORK FREQUENCY (SINGLE UNIQUE COUNTING)
  // =================================================================
  const reopenedGrievances = grievances.filter((g) => g.reopen_count > 0);
  const reopenedGrievancesCount = reopenedGrievances.length;
  const totalVolume = grievances.length;
  const reopenedRate =
    totalVolume > 0
      ? Number(((reopenedGrievancesCount / totalVolume) * 100).toFixed(1))
      : 0;

  let totalReopenAttempts = 0;
  const reopenDistributionMap = new Map<number, number>();
  for (const g of grievances) {
    if (g.reopen_count > 0) {
      totalReopenAttempts += g.reopen_count;
      reopenDistributionMap.set(
        g.reopen_count,
        (reopenDistributionMap.get(g.reopen_count) || 0) + 1,
      );
    }
  }

  const reopenDistribution = Array.from(reopenDistributionMap.entries())
    .map(([reopenCount, grievanceCount]) => ({
      reopenCount,
      grievanceCount,
    }))
    .sort((a, b) => a.reopenCount - b.reopenCount);

  let reworkReviewRejectionsCount = 0;
  let multiResolutionGrievancesCount = 0;

  for (const g of grievances) {
    if (g.resolutions.length > 1) {
      multiResolutionGrievancesCount++;
    }
    for (const r of g.resolutions) {
      for (const rev of r.resolution_reviews) {
        if (rev.decision === "REJECTED") {
          reworkReviewRejectionsCount++;
        }
      }
    }
  }

  const reworkCount = Math.max(
    reworkReviewRejectionsCount,
    multiResolutionGrievancesCount,
  );

  // =================================================================
  // 11. UNRESOLVED PENDING CASES (SEPARATE FROM COMPLETED TAT)
  // =================================================================
  const pendingAgesDays: number[] = [];
  let under7Days = 0;
  let between7And14 = 0;
  let between15And30 = 0;
  let over30Days = 0;

  const recentPendingItems: PendingCaseItem[] = [];

  for (const g of pendingCases) {
    const ageMs = now.getTime() - g.created_at.getTime();
    const ageDays = Number((ageMs / (1000 * 60 * 60 * 24)).toFixed(1));
    const ageHours = Math.round(ageMs / (1000 * 60 * 60));
    pendingAgesDays.push(ageDays);

    if (ageDays < 7) {
      under7Days++;
    } else if (ageDays <= 14) {
      between7And14++;
    } else if (ageDays <= 30) {
      between15And30++;
    } else {
      over30Days++;
    }

    const primaryDept =
      g.grievance_departments.find((d) => d.involvement_type === "PRIMARY")
        ?.departments?.department_name ||
      g.grievance_departments[0]?.departments?.department_name ||
      "Unassigned";

    recentPendingItems.push({
      grievanceId: g.grievance_id.toString(),
      grievanceNumber: g.grievance_number,
      title: g.title,
      priority: g.priority,
      status: g.status,
      departmentName: primaryDept,
      daysOpen: ageDays,
      hoursOpen: ageHours,
      createdAt: g.created_at.toISOString(),
    });
  }

  recentPendingItems.sort((a, b) => b.daysOpen - a.daysOpen);

  const totalPending = pendingCases.length;
  const ageBuckets: PendingCaseAgeBucket[] = [
    {
      range: "< 7 Days",
      count: under7Days,
      percentage:
        totalPending > 0
          ? Number(((under7Days / totalPending) * 100).toFixed(1))
          : 0,
    },
    {
      range: "7 – 14 Days",
      count: between7And14,
      percentage:
        totalPending > 0
          ? Number(((between7And14 / totalPending) * 100).toFixed(1))
          : 0,
    },
    {
      range: "15 – 30 Days",
      count: between15And30,
      percentage:
        totalPending > 0
          ? Number(((between15And30 / totalPending) * 100).toFixed(1))
          : 0,
    },
    {
      range: "> 30 Days",
      count: over30Days,
      percentage:
        totalPending > 0
          ? Number(((over30Days / totalPending) * 100).toFixed(1))
          : 0,
    },
  ];

  const pendingCasesSummary: PendingCasesSummary = {
    totalPendingCount: totalPending,
    avgDaysOpen: calculateAverage(pendingAgesDays),
    maxDaysOpen: pendingAgesDays.length > 0 ? Math.max(...pendingAgesDays) : 0,
    ageBuckets,
    recentPendingCases: recentPendingItems.slice(0, 10),
  };

  // =================================================================
  // 12. SUMMARY OBJECTS & METADATA
  // =================================================================
  const totalExceptions = missingClosedAtCount + totalMissingActivationCount;

  const dataQuality: DataQualityExceptionsSummary = {
    missingClosedAtCount,
    missingDepartmentActivationCount: totalMissingActivationCount,
    totalExceptionsCount: totalExceptions,
  };

  const overview: ResolutionOverviewSummary = {
    totalSubmissions: totalSubmissionsInPeriod,
    totalClosed: totalClosedCount,
    closedWithValidTat,
    dataQualityExceptionsCount: totalExceptions,
    pendingReviews: pendingReviewsCount,
    awaitingEmployeeReview: awaitingEmployeeReviewCount,
    avgResolutionTimeHours: avgTatHours,
    medianResolutionTimeHours: medianTatHours,
    avgResolutionTimeDays: avgTatDays,
    medianResolutionTimeDays: medianTatDays,
    slaComplianceRate: overallSlaComplianceRate,
    totalSlaBreaches: overallBreachedClosedCount,
    reopenedGrievancesCount,
    reopenedRate,
    reworkCount,
  };

  const totalTrackedStages =
    totalSubmissionsInPeriod +
    pendingReviewsCount +
    awaitingEmployeeReviewCount +
    totalClosedCount;

  const stages: ResolutionStageItem[] = [
    {
      stage: "SUBMISSIONS",
      label: "Resolution Submissions",
      count: totalSubmissionsInPeriod,
      percentage:
        totalTrackedStages > 0
          ? Number(
              ((totalSubmissionsInPeriod / totalTrackedStages) * 100).toFixed(
                1,
              ),
            )
          : 0,
      description: "Formal resolution drafts submitted by investigating staff",
    },
    {
      stage: "PENDING_REVIEW",
      label: "Pending Head Review",
      count: pendingReviewsCount,
      percentage:
        totalTrackedStages > 0
          ? Number(
              ((pendingReviewsCount / totalTrackedStages) * 100).toFixed(1),
            )
          : 0,
      description:
        "Resolutions awaiting Department Head verification and approval",
    },
    {
      stage: "AWAITING_EMPLOYEE",
      label: "Awaiting Employee Confirmation",
      count: awaitingEmployeeReviewCount,
      percentage:
        totalTrackedStages > 0
          ? Number(
              (
                (awaitingEmployeeReviewCount / totalTrackedStages) *
                100
              ).toFixed(1),
            )
          : 0,
      description:
        "Approved resolutions presented to employee for review and acceptance",
    },
    {
      stage: "CLOSED",
      label: "Final Closures",
      count: totalClosedCount,
      percentage:
        totalTrackedStages > 0
          ? Number(((totalClosedCount / totalTrackedStages) * 100).toFixed(1))
          : 0,
      description:
        "Cases successfully resolved and accepted or confirmed closed in period",
    },
  ];

  const slaComplianceSummary: SlaResolutionComplianceSummary = {
    totalEvaluated: totalEvaluatedSla,
    compliantCount: overallCompliantClosedCount,
    breachedCount: overallBreachedClosedCount,
    compliancePercentage: overallSlaComplianceRate,
    breachPercentage:
      totalEvaluatedSla > 0
        ? Number(
            ((overallBreachedClosedCount / totalEvaluatedSla) * 100).toFixed(1),
          )
        : 0,
    byPriority: tatByPriority.map((p) => ({
      priority: p.priority,
      total: p.slaCompliantCount + p.slaBreachedCount,
      compliant: p.slaCompliantCount,
      breached: p.slaBreachedCount,
      complianceRate: p.slaComplianceRate,
    })),
    byCycleType,
  };

  const reworkAndReopenSummary: ReworkAndReopenSummary = {
    reopenedGrievancesCount,
    reopenedRate,
    totalReopenAttempts,
    reworkReviewRejectionsCount,
    multiResolutionGrievancesCount,
    reopenDistribution,
  };

  // Daily Trends
  const trendMap = new Map<
    string,
    { submissions: number; closures: number; tatHours: number[] }
  >();

  const cur = new Date(startDate);
  while (cur <= endDate) {
    const key = cur.toISOString().split("T")[0];
    trendMap.set(key, { submissions: 0, closures: 0, tatHours: [] });
    cur.setDate(cur.getDate() + 1);
  }

  for (const g of validClosedInPeriod) {
    if (g.closed_at) {
      const d = g.closed_at.toISOString().split("T")[0];
      const item = trendMap.get(d) || {
        submissions: 0,
        closures: 0,
        tatHours: [],
      };
      item.closures++;
      const tatHours = Math.max(
        0,
        (g.closed_at.getTime() - g.created_at.getTime()) / (1000 * 60 * 60),
      );
      item.tatHours.push(tatHours);
      trendMap.set(d, item);
    }
  }

  for (const g of grievances) {
    for (const r of g.resolutions) {
      if (r.submitted_at >= startDate && r.submitted_at <= endDate) {
        const d = r.submitted_at.toISOString().split("T")[0];
        const item = trendMap.get(d) || {
          submissions: 0,
          closures: 0,
          tatHours: [],
        };
        item.submissions++;
        trendMap.set(d, item);
      }
    }
  }

  const trends: ResolutionTrendItem[] = Array.from(trendMap.entries())
    .map(([date, val]) => ({
      date,
      submissions: val.submissions,
      closures: val.closures,
      avgTatHours: calculateAverage(val.tatHours),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const metadata: ReportMetadata = {
    reportingPeriod: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      label: periodLabel,
    },
    generatedAt: now.toISOString(),
    generatedBy: {
      userId: currentUser.user_id.toString(),
      name: `${currentUser.first_name} ${currentUser.last_name || ""}`.trim(),
      role: currentUser.roles.role_name,
    },
    scope: {
      departmentId: scope.authorizedDepartmentId
        ? scope.authorizedDepartmentId.toString()
        : null,
      departmentName: scopedDepartmentName,
      isOrganizationWide: scope.isOrganizationWide,
    },
  };

  const filterOptions: ResolutionAnalyticsFilterOptions = {
    departments: allDepartments.map((d) => ({
      id: d.department_id.toString(),
      name: d.department_name,
    })),
    categories: allCategories.map((c) => ({
      id: c.category_id.toString(),
      name: c.category_name,
      subcategories: c.subcategories.map((sc) => ({
        id: sc.subcategory_id.toString(),
        name: sc.subcategory_name,
      })),
    })),
    priorities: ["ALL", "URGENT", "HIGH", "NORMAL", "LOW"],
  };

  const responseData: ResolutionAnalyticsData = {
    metadata,
    overview,
    dataQuality,
    stages,
    tatByPriority,
    departmentProcessing: activeDepartmentProcessing,
    slaCompliance: slaComplianceSummary,
    reworkAndReopen: reworkAndReopenSummary,
    pendingCases: pendingCasesSummary,
    trends,
  };

  return {
    success: true,
    data: responseData,
    filterOptions,
  };
}
