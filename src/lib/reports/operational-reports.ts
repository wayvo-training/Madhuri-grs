import type { Prisma } from "@prisma/client";
import type { AuthUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type {
  CategoryDistributionItem,
  CategoryFilterOptionItem,
  DepartmentDistributionItem,
  EscalationEventItem,
  FilterOptionItem,
  GrievanceVolumeSummary,
  OperationalReportData,
  OperationalReportFilterOptions,
  OperationalReportFilters,
  PriorityDistributionItem,
  ReportMetadata,
  SlaGrievanceItem,
  SlaMonitoringReport,
  StaffAssignmentReport,
  StaffWorkloadItem,
  StatusDistributionItem,
} from "@/types/reports";

/**
 * Parses and normalizes date ranges with safe defaults (last 30 days).
 */
export function normalizeDateRange(
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
      // Set to end of day if only YYYY-MM-DD or midnight
      const isDateOnly =
        endDateStr.length <= 10 ||
        (endDate.getHours() === 0 &&
          endDate.getMinutes() === 0 &&
          endDate.getSeconds() === 0);
      if (isDateOnly) {
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

  // Ensure startDate is not after endDate
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
    label: `${startFormatted} – ${endFormatted}`,
  };
}

/**
 * Resolves authorized department scope based on user role.
 * - Admin: can view all or filter by a specific department.
 * - Department Head: strictly locked to user's assigned department. Client departmentId is ignored.
 */
export function resolveDepartmentScope(
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
          departmentName: null, // Will be resolved if needed
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
    "User role is not authorized to generate operational reports.",
  );
}

/**
 * Core Operational Report Aggregator conforming strictly to Section 3.10.2 of GRS LLD.
 */
export async function generateOperationalReport(
  filters: OperationalReportFilters,
  user: AuthUser,
): Promise<OperationalReportData> {
  // 1. Verify VIEW_REPORTS permission
  if (!hasPermission(user, "VIEW_REPORTS")) {
    throw new Error("Forbidden: VIEW_REPORTS permission required.");
  }

  // 2. Resolve Role-Based Department Scope
  const { authorizedDepartmentId, departmentName, isOrganizationWide } =
    resolveDepartmentScope(user, filters.departmentId);

  // 3. Resolve Date Boundaries
  const {
    startDate,
    endDate,
    label: periodLabel,
  } = normalizeDateRange(filters.startDate, filters.endDate);

  // 4. Build Grievances Filter Criteria (Grievances received or closed within the reporting period)
  const where: Prisma.grievancesWhereInput = {
    AND: [
      {
        OR: [
          {
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            closed_at: {
              gte: startDate,
              lte: endDate,
            },
          },
        ],
      },
    ],
  };

  // Apply Department Filter (Admin-selected or forced Department Head department)
  if (authorizedDepartmentId !== null) {
    where.grievance_departments = {
      some: {
        department_id: authorizedDepartmentId,
      },
    };
  }

  // Dimension: Category
  if (filters.categoryId && filters.categoryId.trim() !== "") {
    try {
      where.category_id = BigInt(filters.categoryId);
    } catch {
      // Ignore invalid bigint
    }
  }

  // Dimension: Subcategory
  if (filters.subcategoryId && filters.subcategoryId.trim() !== "") {
    try {
      where.subcategory_id = BigInt(filters.subcategoryId);
    } catch {
      // Ignore invalid bigint
    }
  }

  // Dimension: Priority
  if (
    filters.priority &&
    filters.priority.trim() !== "" &&
    filters.priority !== "ALL"
  ) {
    where.priority = filters.priority.toUpperCase();
  }

  // Dimension: Grievance Status
  if (
    filters.status &&
    filters.status.trim() !== "" &&
    filters.status !== "ALL"
  ) {
    where.status = filters.status.toUpperCase();
  }

  // Dimension: SLA Status
  if (
    filters.slaStatus &&
    filters.slaStatus.trim() !== "" &&
    filters.slaStatus !== "ALL"
  ) {
    where.sla_status = filters.slaStatus.toUpperCase();
  }

  // Dimension: Assignment Status
  if (filters.assignmentStatus === "ASSIGNED") {
    if (authorizedDepartmentId !== null) {
      where.grievance_departments = {
        some: {
          department_id: authorizedDepartmentId,
          assignments: {
            some: {
              assignment_status: "ASSIGNED",
            },
          },
        },
      };
    } else {
      where.assignments = {
        some: {
          assignment_status: "ASSIGNED",
        },
      };
    }
  } else if (filters.assignmentStatus === "UNASSIGNED") {
    if (authorizedDepartmentId !== null) {
      where.grievance_departments = {
        some: {
          department_id: authorizedDepartmentId,
          assignments: {
            none: {
              assignment_status: "ASSIGNED",
            },
          },
        },
      };
    } else {
      where.assignments = {
        none: {
          assignment_status: "ASSIGNED",
        },
      };
    }
  }

  // Dimension: Global Search Query
  if (filters.search && filters.search.trim() !== "") {
    const q = filters.search.trim();
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { grievance_number: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }

  // 5. Query Filtered Grievances (Unique Grievances in Scope)
  const grievances = await prisma.grievances.findMany({
    where,
    include: {
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
        include: {
          departments: {
            select: {
              department_id: true,
              department_name: true,
            },
          },
          assignments: {
            where: {
              assignment_status: "ASSIGNED",
            },
            include: {
              users_assignments_staff_idTousers: {
                select: {
                  user_id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  department_id: true,
                  departments: {
                    select: {
                      department_name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      escalations: {
        include: {
          users: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // 6. Query Assignment Activities in Period (Initial Assignments vs Reassignments)
  // A. Reassignment events that took place in this reporting period (timestamped by completed_at)
  const reassignmentRecords = await prisma.assignments.findMany({
    where: {
      assignment_status: "REASSIGNED",
      completed_at: {
        gte: startDate,
        lte: endDate,
      },
      ...(authorizedDepartmentId !== null
        ? {
            grievance_departments: {
              department_id: authorizedDepartmentId,
            },
          }
        : {}),
    },
    select: {
      assignment_id: true,
      grievance_id: true,
      grievance_department_id: true,
      staff_id: true,
      completed_at: true,
    },
  });

  // B. Assignments created in this period
  const assignmentsCreatedInPeriod = await prisma.assignments.findMany({
    where: {
      assigned_at: {
        gte: startDate,
        lte: endDate,
      },
      ...(authorizedDepartmentId !== null
        ? {
            grievance_departments: {
              department_id: authorizedDepartmentId,
            },
          }
        : {}),
    },
    select: {
      assignment_id: true,
      grievance_id: true,
      grievance_department_id: true,
      staff_id: true,
      assigned_at: true,
      assignment_role: true,
    },
    orderBy: {
      assigned_at: "asc",
    },
  });

  // Distinguish initial assignments from replacement assignments:
  // An assignment created in period is an initial assignment if no assignment for that
  // department and role existed prior to startDate, and it's the first one in this period.
  const deptIdsInPeriod = Array.from(
    new Set(assignmentsCreatedInPeriod.map((a) => a.grievance_department_id)),
  );

  const priorAssignments =
    deptIdsInPeriod.length > 0
      ? await prisma.assignments.findMany({
          where: {
            grievance_department_id: { in: deptIdsInPeriod },
            assigned_at: { lt: startDate },
          },
          select: {
            grievance_department_id: true,
            assignment_role: true,
          },
        })
      : [];

  const priorSet = new Set(
    priorAssignments.map(
      (p) => `${p.grievance_department_id.toString()}_${p.assignment_role}`,
    ),
  );

  const seenDeptRolesInPeriod = new Set<string>();
  let initialAssignmentsCount = 0;

  for (const assign of assignmentsCreatedInPeriod) {
    const key = `${assign.grievance_department_id.toString()}_${assign.assignment_role}`;
    if (!priorSet.has(key) && !seenDeptRolesInPeriod.has(key)) {
      initialAssignmentsCount++;
      seenDeptRolesInPeriod.add(key);
    }
  }

  const reassignmentsCount = reassignmentRecords.length;
  const totalAssignmentsInPeriod = initialAssignmentsCount + reassignmentsCount;

  // 7. Query Escalation Events in Period
  const escalationRecords = await prisma.escalations.findMany({
    where: {
      created_at: {
        gte: startDate,
        lte: endDate,
      },
      ...(authorizedDepartmentId !== null
        ? {
            OR: [
              {
                users: {
                  department_id: authorizedDepartmentId,
                },
              },
              {
                grievances: {
                  grievance_departments: {
                    some: {
                      department_id: authorizedDepartmentId,
                      involvement_type: "PRIMARY",
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      grievances: {
        select: {
          grievance_id: true,
          grievance_number: true,
          title: true,
        },
      },
      users: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // 8. Calculations & Aggregations

  // A. Total Unique Grievance Volume
  const totalUniqueGrievances = grievances.length;

  let activeCount = 0;
  let resolvedCount = 0;
  let closedCount = 0;
  let slaBreachedCount = 0;
  let slaApproachingCount = 0;
  let escalatedCount = 0;
  let assignedCount = 0;
  let unassignedCount = 0;

  // Status breakdown map
  const statusCountsMap: Record<string, number> = {};

  // Priority breakdown map
  const priorityCountsMap: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  // Department distribution maps
  const deptMap: Record<
    string,
    {
      departmentId: string;
      departmentName: string;
      primaryCount: number;
      supportingCount: number;
      totalInvolvement: number;
    }
  > = {};

  // Category and Subcategory distribution map
  const categoryMap: Record<
    string,
    {
      categoryId: string;
      categoryName: string;
      count: number;
      subcategories: Record<
        string,
        {
          subcategoryId: string;
          subcategoryName: string;
          count: number;
        }
      >;
    }
  > = {};

  // Active staff workload map
  const staffWorkloadMap: Record<
    string,
    {
      staffId: string;
      staffName: string;
      email: string;
      departmentId: string;
      departmentName: string;
      activeAssignmentsCount: number;
    }
  > = {};

  // SLA Approaching & Breached list
  const approachingGrievancesList: SlaGrievanceItem[] = [];
  const breachedGrievancesList: SlaGrievanceItem[] = [];

  for (const g of grievances) {
    const statusUpper = (g.status || "UNKNOWN").toUpperCase();
    statusCountsMap[statusUpper] = (statusCountsMap[statusUpper] || 0) + 1;

    // Terminal vs Active
    if (statusUpper === "RESOLVED") {
      resolvedCount++;
    } else if (statusUpper === "CLOSED") {
      closedCount++;
    } else {
      activeCount++;
    }

    // Escalated flag
    if (
      statusUpper === "ESCALATED" ||
      (g.escalations && g.escalations.length > 0)
    ) {
      escalatedCount++;
    }

    // SLA tracking
    let slaUpper = (g.sla_status || "ON_TRACK").toUpperCase();
    let effectiveDueAt = g.due_at;
    let effectiveStatusUpper = statusUpper;

    if (authorizedDepartmentId !== null) {
      const myDeptGd = g.grievance_departments.find(
        (gd) => gd.department_id === authorizedDepartmentId,
      );
      if (myDeptGd) {
        if (myDeptGd.sla_status) {
          slaUpper = myDeptGd.sla_status.toUpperCase();
        }
        if (myDeptGd.due_at) {
          effectiveDueAt = myDeptGd.due_at;
        }
        if (myDeptGd.status) {
          effectiveStatusUpper = myDeptGd.status.toUpperCase();
        }
      }
    }

    const isDeptCompleted =
      effectiveStatusUpper === "RESOLVED" ||
      effectiveStatusUpper === "CLOSED" ||
      effectiveStatusUpper === "COMPLETED" ||
      effectiveStatusUpper === "FINDINGS_SUBMITTED";

    if (slaUpper === "BREACHED" && !isDeptCompleted) {
      slaBreachedCount++;
    } else if (slaUpper === "AT_RISK" && !isDeptCompleted) {
      slaApproachingCount++;
    }

    // Priority
    const prioUpper = (g.priority || "MEDIUM").toUpperCase();
    if (priorityCountsMap[prioUpper] !== undefined) {
      priorityCountsMap[prioUpper]++;
    } else {
      priorityCountsMap[prioUpper] = 1;
    }

    // Department participation
    let primaryDeptName = "Unassigned";
    let hasActiveAssignment = false;

    for (const gd of g.grievance_departments) {
      const deptIdStr = gd.department_id.toString();
      const dName = gd.departments?.department_name || `Dept #${deptIdStr}`;
      const invType = (gd.involvement_type || "PRIMARY").toUpperCase();

      if (invType === "PRIMARY") {
        primaryDeptName = dName;
      }

      // If scoped to a specific department (Department Head), only include their department in department breakdown
      const isTargetDept =
        authorizedDepartmentId === null ||
        gd.department_id === authorizedDepartmentId;

      if (isTargetDept) {
        if (!deptMap[deptIdStr]) {
          deptMap[deptIdStr] = {
            departmentId: deptIdStr,
            departmentName: dName,
            primaryCount: 0,
            supportingCount: 0,
            totalInvolvement: 0,
          };
        }

        if (invType === "PRIMARY") {
          deptMap[deptIdStr].primaryCount++;
        } else {
          deptMap[deptIdStr].supportingCount++;
        }
        deptMap[deptIdStr].totalInvolvement++;
      }

      // Check active assignment for this grievance (scoped to target department if Department Head)
      if (isTargetDept && gd.assignments && gd.assignments.length > 0) {
        hasActiveAssignment = true;
      }

      // Active staff workload (strictly isolated to authorized department if Department Head)
      if (isTargetDept && gd.assignments && gd.assignments.length > 0) {
        for (const assign of gd.assignments) {
          const staffUser = assign.users_assignments_staff_idTousers;
          if (staffUser) {
            const staffIdStr = staffUser.user_id.toString();
            const fullName =
              `${staffUser.first_name} ${staffUser.last_name || ""}`.trim();
            const staffDeptName =
              staffUser.departments?.department_name || dName;
            const staffDeptIdStr = staffUser.department_id
              ? staffUser.department_id.toString()
              : deptIdStr;

            if (!staffWorkloadMap[staffIdStr]) {
              staffWorkloadMap[staffIdStr] = {
                staffId: staffIdStr,
                staffName: fullName,
                email: staffUser.email,
                departmentId: staffDeptIdStr,
                departmentName: staffDeptName,
                activeAssignmentsCount: 0,
              };
            }
            staffWorkloadMap[staffIdStr].activeAssignmentsCount++;
          }
        }
      }
    }

    if (hasActiveAssignment) {
      assignedCount++;
    } else {
      unassignedCount++;
    }

    // SLA Monitoring lists
    if (slaUpper === "AT_RISK" && !isDeptCompleted) {
      approachingGrievancesList.push({
        grievanceId: g.grievance_id.toString(),
        grievanceNumber: g.grievance_number,
        title: g.title,
        priority: g.priority,
        status:
          authorizedDepartmentId !== null ? effectiveStatusUpper : g.status,
        slaStatus: "AT_RISK",
        dueAt: effectiveDueAt ? effectiveDueAt.toISOString() : null,
        primaryDepartmentName: primaryDeptName,
      });
    } else if (slaUpper === "BREACHED" && !isDeptCompleted) {
      breachedGrievancesList.push({
        grievanceId: g.grievance_id.toString(),
        grievanceNumber: g.grievance_number,
        title: g.title,
        priority: g.priority,
        status:
          authorizedDepartmentId !== null ? effectiveStatusUpper : g.status,
        slaStatus: "BREACHED",
        dueAt: effectiveDueAt ? effectiveDueAt.toISOString() : null,
        primaryDepartmentName: primaryDeptName,
      });
    }

    // Category and Subcategory aggregation
    if (g.categories) {
      const catIdStr = g.category_id.toString();
      const catName = g.categories.category_name;
      if (!categoryMap[catIdStr]) {
        categoryMap[catIdStr] = {
          categoryId: catIdStr,
          categoryName: catName,
          count: 0,
          subcategories: {},
        };
      }
      categoryMap[catIdStr].count++;

      if (g.subcategories) {
        const subIdStr = g.subcategory_id.toString();
        const subName = g.subcategories.subcategory_name;
        if (!categoryMap[catIdStr].subcategories[subIdStr]) {
          categoryMap[catIdStr].subcategories[subIdStr] = {
            subcategoryId: subIdStr,
            subcategoryName: subName,
            count: 0,
          };
        }
        categoryMap[catIdStr].subcategories[subIdStr].count++;
      }
    }
  }

  // Format Status Distribution
  const statusDistribution: StatusDistributionItem[] = Object.entries(
    statusCountsMap,
  )
    .map(([status, count]) => ({
      status,
      count,
      percentage:
        totalUniqueGrievances > 0
          ? Number(((count / totalUniqueGrievances) * 100).toFixed(1))
          : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Format Department Distribution
  const departmentDistribution: DepartmentDistributionItem[] = Object.values(
    deptMap,
  )
    .map((item) => ({
      ...item,
      percentageOfTotal:
        totalUniqueGrievances > 0
          ? Number(
              ((item.totalInvolvement / totalUniqueGrievances) * 100).toFixed(
                1,
              ),
            )
          : 0,
    }))
    .sort((a, b) => b.totalInvolvement - a.totalInvolvement);

  // Format Category Distribution
  const categoryDistribution: CategoryDistributionItem[] = Object.values(
    categoryMap,
  )
    .map((cat) => {
      const subcategories = Object.values(cat.subcategories)
        .map((sub) => ({
          ...sub,
          percentage:
            cat.count > 0
              ? Number(((sub.count / cat.count) * 100).toFixed(1))
              : 0,
        }))
        .sort((a, b) => b.count - a.count);

      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        count: cat.count,
        percentage:
          totalUniqueGrievances > 0
            ? Number(((cat.count / totalUniqueGrievances) * 100).toFixed(1))
            : 0,
        subcategories,
      };
    })
    .sort((a, b) => b.count - a.count);

  // Format Priority Distribution
  const priorityDistribution: PriorityDistributionItem[] = Object.entries(
    priorityCountsMap,
  )
    .map(([priority, count]) => ({
      priority,
      count,
      percentage:
        totalUniqueGrievances > 0
          ? Number(((count / totalUniqueGrievances) * 100).toFixed(1))
          : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Format Staff Workload
  const currentStaffWorkload: StaffWorkloadItem[] = Object.values(
    staffWorkloadMap,
  ).sort((a, b) => b.activeAssignmentsCount - a.activeAssignmentsCount);

  const staffAssignments: StaffAssignmentReport = {
    currentStaffWorkload,
    assignedGrievancesCount: assignedCount,
    unassignedGrievancesCount: unassignedCount,
    activities: {
      totalAssignmentsInPeriod,
      initialAssignmentsCount,
      reassignmentsCount,
    },
  };

  // SLA Monitoring Report
  const onTrackCount = Math.max(
    0,
    totalUniqueGrievances - slaApproachingCount - slaBreachedCount,
  );

  const slaMonitoring: SlaMonitoringReport = {
    onTrackCount,
    approachingDeadlineCount: slaApproachingCount,
    breachedDeadlineCount: slaBreachedCount,
    approachingGrievances: approachingGrievancesList.slice(0, 50),
    breachedGrievances: breachedGrievancesList.slice(0, 50),
  };

  // Escalations Report
  const escalationLevelCounts: Record<number, number> = {};
  const formattedEscalations: EscalationEventItem[] = [];

  for (const esc of escalationRecords) {
    const lvl = esc.escalation_level || 1;
    escalationLevelCounts[lvl] = (escalationLevelCounts[lvl] || 0) + 1;

    formattedEscalations.push({
      escalationId: esc.escalation_id.toString(),
      grievanceId: esc.grievance_id.toString(),
      grievanceNumber:
        esc.grievances?.grievance_number || `#${esc.grievance_id}`,
      grievanceTitle: esc.grievances?.title || "Untitled Grievance",
      escalationLevel: lvl,
      escalatedToName: esc.users
        ? `${esc.users.first_name} ${esc.users.last_name || ""}`.trim()
        : "Unassigned",
      reason: esc.reason,
      status: esc.status,
      createdAt: esc.created_at.toISOString(),
    });
  }

  const byLevel = Object.entries(escalationLevelCounts)
    .map(([levelStr, count]) => ({
      level: Number(levelStr),
      count,
    }))
    .sort((a, b) => a.level - b.level);

  // Resolve scope display name
  let scopeDeptName = departmentName;
  if (!scopeDeptName && authorizedDepartmentId !== null) {
    const deptRecord = await prisma.departments.findUnique({
      where: { department_id: authorizedDepartmentId },
      select: { department_name: true },
    });
    if (deptRecord) {
      scopeDeptName = deptRecord.department_name;
    }
  }

  const metadata: ReportMetadata = {
    reportingPeriod: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      label: periodLabel,
    },
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
      departmentName: scopeDeptName,
      isOrganizationWide,
    },
  };

  const summary: GrievanceVolumeSummary = {
    totalUniqueGrievances,
    activeGrievances: activeCount,
    resolvedGrievances: resolvedCount,
    closedGrievances: closedCount,
    slaBreachedGrievances: slaBreachedCount,
    slaApproachingGrievances: slaApproachingCount,
    escalatedGrievances: escalatedCount,
    unassignedGrievances: unassignedCount,
  };

  return {
    metadata,
    summary,
    statusDistribution,
    departmentDistribution,
    categoryDistribution,
    priorityDistribution,
    staffAssignments,
    slaMonitoring,
    escalations: {
      totalEscalationsInPeriod: escalationRecords.length,
      byLevel,
      events: formattedEscalations.slice(0, 50),
    },
  };
}

/**
 * Retrieves valid filter options (Departments, Categories, Subcategories, Priorities, Statuses)
 * respecting role permissions.
 */
export async function getOperationalReportFilterOptions(
  user: AuthUser,
): Promise<OperationalReportFilterOptions> {
  const isDeptHead = user.roles.role_name === "DEPARTMENT_HEAD";
  const userDeptId = user.department_id ? BigInt(user.department_id) : null;

  // Query departments (Admin gets all active; Department Head gets only their own)
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

  return {
    departments,
    categories,
    priorities: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
    statuses: [
      "SUBMITTED",
      "ROUTED",
      "AWAITING_ROUTING",
      "ASSIGNED",
      "AWAITING_ASSIGNMENT",
      "IN_PROGRESS",
      "WAITING_ON_USER",
      "AWAITING_INFORMATION",
      "UNDER_REVIEW",
      "RESOLUTION_PENDING_APPROVAL",
      "REOPEN_REVIEW",
      "REWORK",
      "REOPENED",
      "RESOLVED",
      "CLOSED",
      "ESCALATED",
    ],
    slaStatuses: ["ON_TRACK", "AT_RISK", "BREACHED"],
    assignmentStatuses: [
      { value: "ALL", label: "All Assignment States" },
      { value: "ASSIGNED", label: "Assigned" },
      { value: "UNASSIGNED", label: "Unassigned" },
    ],
  };
}
