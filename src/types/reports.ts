export interface OperationalReportFilters {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  categoryId?: string;
  subcategoryId?: string;
  priority?: string;
  status?: string;
  slaStatus?: string;
  assignmentStatus?: "ALL" | "ASSIGNED" | "UNASSIGNED";
}

export interface ReportMetadata {
  reportingPeriod: {
    startDate: string;
    endDate: string;
    label: string;
  };
  generatedAt: string;
  generatedBy: {
    userId: string;
    name: string;
    role: string;
  };
  scope: {
    departmentId: string | null;
    departmentName: string | null;
    isOrganizationWide: boolean;
  };
}

export interface GrievanceVolumeSummary {
  totalUniqueGrievances: number;
  activeGrievances: number;
  resolvedGrievances: number;
  closedGrievances: number;
  slaBreachedGrievances: number;
  slaApproachingGrievances: number;
  escalatedGrievances: number;
  unassignedGrievances: number;
}

export interface StatusDistributionItem {
  status: string;
  count: number;
  percentage: number;
}

export interface DepartmentDistributionItem {
  departmentId: string;
  departmentName: string;
  primaryCount: number;
  supportingCount: number;
  totalInvolvement: number;
  percentageOfTotal: number;
}

export interface SubcategoryDistributionItem {
  subcategoryId: string;
  subcategoryName: string;
  count: number;
  percentage: number;
}

export interface CategoryDistributionItem {
  categoryId: string;
  categoryName: string;
  count: number;
  percentage: number;
  subcategories: SubcategoryDistributionItem[];
}

export interface PriorityDistributionItem {
  priority: string;
  count: number;
  percentage: number;
}

export interface StaffWorkloadItem {
  staffId: string;
  staffName: string;
  email: string;
  departmentId: string;
  departmentName: string;
  activeAssignmentsCount: number;
}

export interface AssignmentActivitiesSummary {
  totalAssignmentsInPeriod: number;
  initialAssignmentsCount: number;
  reassignmentsCount: number;
}

export interface StaffAssignmentReport {
  currentStaffWorkload: StaffWorkloadItem[];
  assignedGrievancesCount: number;
  unassignedGrievancesCount: number;
  activities: AssignmentActivitiesSummary;
}

export interface SlaGrievanceItem {
  grievanceId: string;
  grievanceNumber: string;
  title: string;
  priority: string;
  status: string;
  slaStatus: string;
  dueAt: string | null;
  primaryDepartmentName: string;
}

export interface SlaMonitoringReport {
  onTrackCount: number;
  approachingDeadlineCount: number;
  breachedDeadlineCount: number;
  approachingGrievances: SlaGrievanceItem[];
  breachedGrievances: SlaGrievanceItem[];
}

export interface EscalationEventItem {
  escalationId: string;
  grievanceId: string;
  grievanceNumber: string;
  grievanceTitle: string;
  escalationLevel: number;
  escalatedToName: string;
  reason: string;
  status: string;
  createdAt: string;
}

export interface EscalationsReport {
  totalEscalationsInPeriod: number;
  byLevel: Array<{ level: number; count: number }>;
  events: EscalationEventItem[];
}

export interface FilterOptionItem {
  id: string;
  name: string;
}

export interface CategoryFilterOptionItem extends FilterOptionItem {
  subcategories: FilterOptionItem[];
}

export interface OperationalReportFilterOptions {
  departments: FilterOptionItem[];
  categories: CategoryFilterOptionItem[];
  priorities: string[];
  statuses: string[];
  slaStatuses: string[];
  assignmentStatuses: Array<{
    value: "ALL" | "ASSIGNED" | "UNASSIGNED";
    label: string;
  }>;
}

export interface OperationalReportData {
  metadata: ReportMetadata;
  summary: GrievanceVolumeSummary;
  statusDistribution: StatusDistributionItem[];
  departmentDistribution: DepartmentDistributionItem[];
  categoryDistribution: CategoryDistributionItem[];
  priorityDistribution: PriorityDistributionItem[];
  staffAssignments: StaffAssignmentReport;
  slaMonitoring: SlaMonitoringReport;
  escalations: EscalationsReport;
}

export interface OperationalReportApiResponse {
  success: boolean;
  data: OperationalReportData;
  filterOptions: OperationalReportFilterOptions;
  message?: string;
}

// ==========================================
// RESOLUTION ANALYTICS (TAT) TYPES - LLD 3.10.3
// ==========================================

export interface ResolutionAnalyticsFilters {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  categoryId?: string;
  subcategoryId?: string;
  priority?: string;
}

export interface DataQualityExceptionsSummary {
  missingClosedAtCount: number;
  missingDepartmentActivationCount: number;
  totalExceptionsCount: number;
}

export interface ResolutionOverviewSummary {
  totalSubmissions: number;
  totalClosed: number;
  closedWithValidTat: number;
  dataQualityExceptionsCount: number;
  pendingReviews: number;
  awaitingEmployeeReview: number;
  avgResolutionTimeHours: number;
  medianResolutionTimeHours: number;
  avgResolutionTimeDays: number;
  medianResolutionTimeDays: number;
  slaComplianceRate: number;
  totalSlaBreaches: number;
  reopenedGrievancesCount: number;
  reopenedRate: number;
  reworkCount: number;
}

export interface ResolutionStageItem {
  stage: string;
  label: string;
  count: number;
  percentage: number;
  description: string;
}

export interface PriorityTatItem {
  priority: string;
  totalGrievances: number;
  closedCount: number;
  closedWithValidTat: number;
  missingClosedAtCount: number;
  avgResolutionTimeHours: number;
  medianResolutionTimeHours: number;
  avgResolutionTimeDays: number;
  medianResolutionTimeDays: number;
  slaCompliantCount: number;
  slaBreachedCount: number;
  slaComplianceRate: number;
}

export interface DepartmentProcessingTimeItem {
  departmentId: string;
  departmentName: string;
  totalInvolved: number;
  completedStagesCount: number;
  completedWithValidDurationCount: number;
  missingActivationCount: number;
  pendingStagesCount: number;
  blockedStagesCount: number;
  avgProcessingTimeHours: number;
  medianProcessingTimeHours: number;
  avgProcessingTimeDays: number;
  medianProcessingTimeDays: number;
  primaryCount: number;
  supportingCount: number;
  avgPrimaryProcessingHours: number;
  avgSupportingProcessingHours: number;
  slaComplianceRate: number;
}

export interface SlaCycleComplianceItem {
  cycleType: "INITIAL" | "REWORK" | "REOPENED";
  label: string;
  totalCompletedCycles: number;
  compliantCycles: number;
  breachedCycles: number;
  complianceRate: number;
  avgPausedMinutes: number;
}

export interface SlaResolutionComplianceSummary {
  totalEvaluated: number;
  compliantCount: number;
  breachedCount: number;
  compliancePercentage: number;
  breachPercentage: number;
  byPriority: Array<{
    priority: string;
    total: number;
    compliant: number;
    breached: number;
    complianceRate: number;
  }>;
  byCycleType: SlaCycleComplianceItem[];
}

export interface ReworkAndReopenSummary {
  reopenedGrievancesCount: number;
  reopenedRate: number;
  totalReopenAttempts: number;
  reworkReviewRejectionsCount: number;
  multiResolutionGrievancesCount: number;
  reopenDistribution: Array<{
    reopenCount: number;
    grievanceCount: number;
  }>;
}

export interface PendingCaseAgeBucket {
  range: string;
  count: number;
  percentage: number;
}

export interface PendingCaseItem {
  grievanceId: string;
  grievanceNumber: string;
  title: string;
  priority: string;
  status: string;
  departmentName: string;
  daysOpen: number;
  hoursOpen: number;
  createdAt: string;
}

export interface PendingCasesSummary {
  totalPendingCount: number;
  avgDaysOpen: number;
  maxDaysOpen: number;
  ageBuckets: PendingCaseAgeBucket[];
  recentPendingCases: PendingCaseItem[];
}

export interface ResolutionTrendItem {
  date: string;
  submissions: number;
  closures: number;
  avgTatHours: number;
}

export interface ResolutionAnalyticsData {
  metadata: ReportMetadata;
  overview: ResolutionOverviewSummary;
  dataQuality: DataQualityExceptionsSummary;
  stages: ResolutionStageItem[];
  tatByPriority: PriorityTatItem[];
  departmentProcessing: DepartmentProcessingTimeItem[];
  slaCompliance: SlaResolutionComplianceSummary;
  reworkAndReopen: ReworkAndReopenSummary;
  pendingCases: PendingCasesSummary;
  trends: ResolutionTrendItem[];
}

export interface ResolutionAnalyticsFilterOptions {
  departments: FilterOptionItem[];
  categories: CategoryFilterOptionItem[];
  priorities: string[];
}

export interface ResolutionAnalyticsApiResponse {
  success: boolean;
  data: ResolutionAnalyticsData;
  filterOptions: ResolutionAnalyticsFilterOptions;
  message?: string;
}

// ==========================================
// TREND ANALYSIS & RECURRING PATTERN TYPES - LLD 3.10.5
// ==========================================

export interface PatternFilters {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  categoryId?: string;
  priority?: string;
}

export interface RecurringGrievanceSummaryItem {
  grievanceId: string;
  grievanceNumber: string;
  title: string;
  priority: string;
  status: string;
  createdAt: string;
  subcategoryName: string;
}

export interface RecurringCategoryPatternItem {
  patternId: string;
  patternType: "CATEGORY_CLUSTERING";
  departmentId: string;
  departmentName: string;
  categoryId: string;
  categoryName: string;
  matchingCount: number;
  threshold: number;
  analysisPeriod: {
    startDate: string;
    endDate: string;
    label: string;
  };
  severity: "HIGH" | "CRITICAL";
  subcategoriesInvolved: Array<{
    subcategoryId: string;
    subcategoryName: string;
    count: number;
  }>;
  associatedGrievances: RecurringGrievanceSummaryItem[];
}

export interface DuplicateClusterItem {
  clusterId: string;
  patternType: "DUPLICATE_CLUSTER";
  rootIssueSummary: string;
  departmentId: string;
  departmentName: string;
  activeCount: number;
  associatedGrievances: RecurringGrievanceSummaryItem[];
}

export interface RecurringPatternsSummary {
  totalPatternsDetected: number;
  totalAffectedGrievances: number;
  departmentsWithPatternsCount: number;
  isInsufficientData: boolean;
  totalGrievancesInWindow: number;
  minThreshold: number;
}

export interface PatternDetectionData {
  metadata: ReportMetadata;
  summary: RecurringPatternsSummary;
  categoryPatterns: RecurringCategoryPatternItem[];
  duplicateClusters: DuplicateClusterItem[];
  dataLimitationNotice: string;
}

export interface PatternDetectionApiResponse {
  success: boolean;
  data: PatternDetectionData;
  filterOptions: {
    departments: FilterOptionItem[];
    categories: CategoryFilterOptionItem[];
    priorities: string[];
  };
  message?: string;
}
