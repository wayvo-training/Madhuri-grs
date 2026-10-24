import { DEFAULT_ASSIGNMENT_CONFIG } from "@/lib/constants/assignment";
import { prisma } from "@/lib/prisma";
import { getPrimaryDepartment } from "@/lib/utils/grievance-departments";

export interface RecommendationFactorBreakdown {
  skillScore: number; // max 35
  experienceScore: number; // max 25
  workloadScore: number; // max 20
  availabilityScore: number; // max 10
  slaScore: number; // max 10
}

export interface StaffRecommendationResult {
  staffId: string;
  name: string;
  email: string;
  designation: string;
  score: number; // 0 - 100
  isTopRecommendation: boolean;
  activeWorkload: number;
  maxCapacity: number;
  availabilityStatus: "AVAILABLE" | "BUSY" | "ON_LEAVE";
  matchedSkills: string[];
  bulletReasons: string[];
  rawReasons: {
    matched_skills: string[];
    experience_match: boolean;
    workload: "LOW" | "MEDIUM" | "HIGH";
    availability: "AVAILABLE" | "BUSY";
    sla_risk: "LOW" | "MEDIUM" | "HIGH";
  };
  factorBreakdown: RecommendationFactorBreakdown;
}

export async function calculateStaffRecommendations(
  grievanceId: bigint,
  departmentId: bigint,
): Promise<{
  grievance: {
    id: string;
    grievanceNumber: string;
    title: string;
    category: string;
    subcategory: string;
    priority: string;
    slaStatus: string;
    dueAt: string | null;
    departmentName: string;
    assignedStaffId: string | null;
    assignedStaffName: string | null;
  };
  recommendations: StaffRecommendationResult[];
}> {
  // 1. Fetch grievance details
  const grievance = await prisma.grievances.findUnique({
    where: { grievance_id: grievanceId },
    include: {
      categories: true,
      subcategories: true,
      grievance_departments: {
        include: {
          departments: true,
          assignments: {
            where: { assignment_status: "ASSIGNED" },
            include: {
              users_assignments_staff_idTousers: true,
            },
          },
        },
      },
    },
  });

  if (!grievance) {
    throw new Error(`Grievance ${grievanceId} not found`);
  }

  const categoryName = grievance.categories?.category_name || "";
  const subcategoryName = grievance.subcategories?.subcategory_name || "";
  const priority = (grievance.priority || "MEDIUM").toUpperCase();
  const targetDeptRecord = departmentId
    ? grievance.grievance_departments.find(
        (gd) => BigInt(gd.department_id) === BigInt(departmentId),
      )
    : getPrimaryDepartment(grievance);

  const targetDeptId = departmentId
    ? BigInt(departmentId)
    : targetDeptRecord?.department_id ||
      getPrimaryDepartment(grievance)?.department_id;

  if (!targetDeptId) {
    throw new Error(
      `Target department could not be resolved for grievance ${grievanceId}`,
    );
  }

  // Active assignment if already assigned in this specific department
  const activeAssignment = targetDeptRecord?.assignments;
  const currentAssignedUser =
    activeAssignment?.assignment_status === "ASSIGNED"
      ? activeAssignment.users_assignments_staff_idTousers
      : null;

  let resolvedDeptName = targetDeptRecord?.departments?.department_name;
  if (!resolvedDeptName && targetDeptId) {
    const dept = await prisma.departments.findUnique({
      where: { department_id: targetDeptId },
      select: { department_name: true },
    });
    resolvedDeptName = dept?.department_name;
  }

  // 2. Fetch eligible staff in this department (includes STAFF and fallback to DEPARTMENT_HEAD)
  const eligibleStaff = await prisma.users.findMany({
    where: {
      department_id: targetDeptId,
      status: "ACTIVE",
      roles: {
        role_name: { in: ["STAFF", "DEPARTMENT_HEAD"] },
      },
    },
    include: {
      roles: true,
      departments: true,
      user_skills: {
        include: {
          skills: true,
        },
      },
      assignments_assignments_staff_idTousers: {
        include: {
          grievances: {
            select: {
              category_id: true,
              subcategory_id: true,
              priority: true,
              status: true,
            },
          },
        },
      },
      resolutions: {
        include: {
          grievances: {
            select: {
              category_id: true,
              subcategory_id: true,
            },
          },
        },
      },
    },
    orderBy: { first_name: "asc" },
  });

  // Filter: Prefer STAFF role members over DEPARTMENT_HEAD unless no staff members exist
  const hasDedicatedStaff = eligibleStaff.some(
    (u) => u.roles.role_name === "STAFF",
  );
  const candidates = hasDedicatedStaff
    ? eligibleStaff.filter((u) => u.roles.role_name === "STAFF")
    : eligibleStaff;

  const maxCapacity = DEFAULT_ASSIGNMENT_CONFIG.MAX_STAFF_CAPACITY;

  // 3. Score each candidate
  const scoredList: StaffRecommendationResult[] = candidates.map((staff) => {
    const staffName = `${staff.first_name} ${staff.last_name || ""}`.trim();

    // Workload calculation:
    // Only active assigned cases, strictly excluding:
    // 1. The current grievance being viewed/assigned
    // 2. Resolved, under-review, or closed cases
    const activeAssignments =
      staff.assignments_assignments_staff_idTousers.filter((a) => {
        if (a.grievance_id === grievanceId) return false;
        if (a.assignment_status !== "ASSIGNED") return false;
        const gStatus = a.grievances?.status || "";
        return !DEFAULT_ASSIGNMENT_CONFIG.INACTIVE_WORKLOAD_STATUSES.includes(
          gStatus as (typeof DEFAULT_ASSIGNMENT_CONFIG.INACTIVE_WORKLOAD_STATUSES)[number],
        );
      });
    const activeWorkload = activeAssignments.length;

    // Availability status
    let availabilityStatus: "AVAILABLE" | "BUSY" | "ON_LEAVE" = "AVAILABLE";
    if (staff.status === "INACTIVE" || staff.status === "ON_LEAVE") {
      availabilityStatus = "ON_LEAVE";
    } else if (activeWorkload >= maxCapacity) {
      availabilityStatus = "BUSY";
    }

    // --- Factor 1: Dynamic Skill / Grievance Text Match (35%) ---
    let skillScore = 0;
    const matchedSkills: string[] = [];
    const catLower = categoryName.toLowerCase().trim();
    const subcatLower = subcategoryName.toLowerCase().trim();
    const grievanceTitleLower = (grievance.title || "").toLowerCase().trim();
    const grievanceDescLower = (grievance.description || "")
      .toLowerCase()
      .trim();

    // Combined context tokens from category, subcategory, and grievance content
    const grievanceTokens =
      `${catLower} ${subcatLower} ${grievanceTitleLower} ${grievanceDescLower}`
        .split(/[\s/&,-]+/)
        .filter((w) => w.length > 2);
    const tokenSet = new Set(grievanceTokens);

    for (const us of staff.user_skills) {
      const rawSkillName = us.skills.skill_name;
      const skillNameLower = rawSkillName.toLowerCase().trim();
      const mult =
        DEFAULT_ASSIGNMENT_CONFIG.PROFICIENCY_MULTIPLIERS[
          us.proficiency_level || "INTERMEDIATE"
        ] || 0.7;

      let matchWeight = 0;

      // 1. Exact or direct match with Category or Subcategory
      const isDirectTaxonomyMatch =
        (catLower &&
          (catLower === skillNameLower ||
            catLower.includes(skillNameLower) ||
            skillNameLower.includes(catLower))) ||
        (subcatLower &&
          (subcatLower === skillNameLower ||
            subcatLower.includes(skillNameLower) ||
            skillNameLower.includes(subcatLower)));

      // 2. Token overlap with grievance content
      const skillWords = skillNameLower
        .split(/[\s/&,-]+/)
        .filter((w) => w.length > 2);
      const matchedTokensCount = skillWords.filter((w) =>
        tokenSet.has(w),
      ).length;
      const hasSignificantTokenOverlap =
        skillWords.length > 0 &&
        matchedTokensCount >= Math.ceil(skillWords.length / 2);

      if (isDirectTaxonomyMatch) {
        matchWeight = 25 * mult;
        if (!matchedSkills.includes(rawSkillName)) {
          matchedSkills.push(rawSkillName);
        }
      } else if (
        hasSignificantTokenOverlap ||
        grievanceTitleLower.includes(skillNameLower)
      ) {
        matchWeight = 20 * mult;
        if (!matchedSkills.includes(rawSkillName)) {
          matchedSkills.push(rawSkillName);
        }
      } else {
        // No match with grievance category, subcategory, or content
        matchWeight = 0;
      }

      skillScore = Math.max(skillScore, matchWeight);
    }

    // Boost if multiple relevant skills matched the actual grievance
    if (matchedSkills.length > 1) {
      skillScore = Math.min(
        DEFAULT_ASSIGNMENT_CONFIG.WEIGHTS.SKILL,
        skillScore + 5 * (matchedSkills.length - 1),
      );
    }
    skillScore = Math.min(
      DEFAULT_ASSIGNMENT_CONFIG.WEIGHTS.SKILL,
      Math.round(skillScore),
    );

    // --- Factor 2: Relevant Previous Experience (25%) ---
    // Count previous resolved/closed assignments or resolutions in this category or subcategory
    let pastCategoryCases = 0;
    let pastSubcategoryCases = 0;
    const resolvedGrievanceIds = new Set<string>();

    for (const r of staff.resolutions) {
      if (r.grievance_id !== grievanceId) {
        resolvedGrievanceIds.add(r.grievance_id.toString());
        if (
          r.grievances?.subcategory_id &&
          String(r.grievances.subcategory_id) ===
            String(grievance.subcategory_id)
        ) {
          pastSubcategoryCases++;
        } else if (
          r.grievances?.category_id &&
          String(r.grievances.category_id) === String(grievance.category_id)
        ) {
          pastCategoryCases++;
        }
      }
    }

    for (const a of staff.assignments_assignments_staff_idTousers) {
      const gidStr = a.grievance_id.toString();
      // Only count completed/resolved cases (not active, in-flight assignments) that haven't been counted via resolutions
      if (
        a.grievance_id !== grievanceId &&
        !resolvedGrievanceIds.has(gidStr) &&
        (a.assignment_status === "COMPLETED" ||
          a.grievances?.status === "RESOLVED" ||
          a.grievances?.status === "CLOSED")
      ) {
        resolvedGrievanceIds.add(gidStr);
        if (
          a.grievances?.subcategory_id &&
          String(a.grievances.subcategory_id) ===
            String(grievance.subcategory_id)
        ) {
          pastSubcategoryCases++;
        } else if (
          a.grievances?.category_id &&
          String(a.grievances.category_id) === String(grievance.category_id)
        ) {
          pastCategoryCases++;
        }
      }
    }

    let experienceScore = 0;
    if (
      pastSubcategoryCases >= 2 ||
      (pastSubcategoryCases >= 1 && pastCategoryCases >= 2)
    ) {
      experienceScore = 25;
    } else if (pastSubcategoryCases === 1 || pastCategoryCases >= 4) {
      experienceScore = 22;
    } else if (pastCategoryCases >= 2) {
      experienceScore = 20;
    } else if (pastCategoryCases >= 1) {
      experienceScore = 15;
    } else {
      experienceScore = 0;
    }

    // --- Factor 3: Current Workload (20%) ---
    // Clear tiered penalty: score reliably decreases with each additional active case assigned
    let workloadScore = 0;
    if (activeWorkload === 0) workloadScore = 20;
    else if (activeWorkload === 1) workloadScore = 17;
    else if (activeWorkload === 2) workloadScore = 14;
    else if (activeWorkload === 3) workloadScore = 11;
    else if (activeWorkload === 4) workloadScore = 9;
    else if (activeWorkload === 5) workloadScore = 7;
    else if (activeWorkload === 6) workloadScore = 5;
    else if (activeWorkload === 7) workloadScore = 3;
    else if (activeWorkload === 8) workloadScore = 2;
    else if (activeWorkload === 9) workloadScore = 1;
    else workloadScore = 0;

    // --- Factor 4: Availability (10%) ---
    let availabilityScore = 0;
    if (availabilityStatus === "AVAILABLE" && activeWorkload < maxCapacity) {
      if (activeWorkload <= 2) availabilityScore = 10;
      else if (activeWorkload <= 4) availabilityScore = 8;
      else if (activeWorkload <= 6) availabilityScore = 6;
      else if (activeWorkload <= 8) availabilityScore = 4;
      else availabilityScore = 2;
    } else if (availabilityStatus === "BUSY" || activeWorkload >= maxCapacity) {
      availabilityScore = 1;
    } else {
      availabilityScore = 0;
    }

    // --- Factor 5: Priority / SLA Suitability (10%) ---
    let slaScore = 0;
    const isHighPriority = priority === "CRITICAL" || priority === "HIGH";

    if (isHighPriority) {
      // High priority demands experienced staff with low current load
      const hasExpertSkill = staff.user_skills.some(
        (us) =>
          us.proficiency_level === "EXPERT" ||
          us.proficiency_level === "ADVANCED",
      );
      if (hasExpertSkill && activeWorkload <= 2) {
        slaScore = 10;
      } else if (hasExpertSkill && activeWorkload <= 4) {
        slaScore = 8;
      } else if (activeWorkload <= 5) {
        slaScore = 5;
      } else {
        slaScore = 2;
      }
    } else {
      // Normal/Medium priority
      if (activeWorkload <= 2) slaScore = 10;
      else if (activeWorkload <= 4) slaScore = 8;
      else if (activeWorkload <= 6) slaScore = 6;
      else if (activeWorkload <= 8) slaScore = 4;
      else slaScore = 2;
    }

    // Total Score (0 - 100): natural range without artificial floor, capped at 100
    const rawScore =
      skillScore +
      experienceScore +
      workloadScore +
      availabilityScore +
      slaScore;
    const totalScore = Math.min(100, Math.max(0, rawScore));

    // Build human-friendly explainable bullet points
    const bulletReasons: string[] = [];

    if (skillScore >= 20 && matchedSkills.length > 0) {
      bulletReasons.push(
        `Strong category/skill match (${matchedSkills.slice(0, 2).join(", ")})`,
      );
    } else if (matchedSkills.length > 0) {
      bulletReasons.push(`Relevant skills: ${matchedSkills[0]}`);
    } else {
      bulletReasons.push("No direct skill match for this category");
    }

    const totalRelevantPast = pastSubcategoryCases + pastCategoryCases;
    if (totalRelevantPast > 0) {
      bulletReasons.push(
        `Relevant previous experience (${totalRelevantPast} similar case${totalRelevantPast > 1 ? "s" : ""} handled)`,
      );
    } else {
      bulletReasons.push("No previous cases resolved in this category");
    }

    if (availabilityStatus === "AVAILABLE" && activeWorkload < maxCapacity) {
      bulletReasons.push("Available on active duty");
    } else if (activeWorkload >= maxCapacity) {
      bulletReasons.push(
        `Maximum active capacity reached (${activeWorkload} / ${maxCapacity} assigned) - Ineligible for new assignments`,
      );
    } else if (availabilityStatus === "BUSY") {
      bulletReasons.push("Currently near maximum assignment capacity");
    } else {
      bulletReasons.push("On approved leave");
    }

    if (activeWorkload >= maxCapacity) {
      bulletReasons.push("Available Capacity: 0");
    } else {
      const availCap = maxCapacity - activeWorkload;
      if (activeWorkload <= 2) {
        bulletReasons.push(
          `Low current workload (${activeWorkload} / ${maxCapacity} assigned, Available Capacity: ${availCap})`,
        );
      } else if (activeWorkload <= 6) {
        bulletReasons.push(
          `Moderate workload (${activeWorkload} / ${maxCapacity} assigned, Available Capacity: ${availCap})`,
        );
      } else {
        bulletReasons.push(
          `High active workload (${activeWorkload} / ${maxCapacity} assigned, Available Capacity: ${availCap})`,
        );
      }
    }

    if (isHighPriority) {
      bulletReasons.push(`Suitable for ${priority} priority SLA turnaround`);
    } else {
      bulletReasons.push("Suitable for standard SLA resolution");
    }

    const rawWorkload: "LOW" | "MEDIUM" | "HIGH" =
      activeWorkload <= 2 ? "LOW" : activeWorkload <= 5 ? "MEDIUM" : "HIGH";

    const rawSlaRisk: "LOW" | "MEDIUM" | "HIGH" =
      isHighPriority && activeWorkload >= 5
        ? "HIGH"
        : isHighPriority
          ? "MEDIUM"
          : "LOW";

    return {
      staffId: staff.user_id.toString(),
      name: staffName,
      email: staff.email,
      designation:
        staff.roles.role_name === "DEPARTMENT_HEAD"
          ? `Department Head (${staff.departments?.department_name || "Operations"})`
          : `Grievance Staff (${staff.departments?.department_name || "Operations"})`,
      score: totalScore,
      isTopRecommendation: false, // will set below
      activeWorkload,
      maxCapacity,
      availabilityStatus,
      matchedSkills,
      bulletReasons,
      rawReasons: {
        matched_skills: matchedSkills,
        experience_match: totalRelevantPast > 0,
        workload: rawWorkload,
        availability: availabilityStatus === "AVAILABLE" ? "AVAILABLE" : "BUSY",
        sla_risk: rawSlaRisk,
      },
      factorBreakdown: {
        skillScore,
        experienceScore,
        workloadScore,
        availabilityScore,
        slaScore,
      },
    };
  });

  // Sort candidates:
  // 1. Prefer eligible Staff whose active workload is below max capacity (ranked ahead of max capacity candidates)
  // 2. Score descending
  // 3. Lower active workload secondary
  scoredList.sort((a, b) => {
    const aEligible =
      a.activeWorkload < maxCapacity && a.availabilityStatus !== "ON_LEAVE";
    const bEligible =
      b.activeWorkload < maxCapacity && b.availabilityStatus !== "ON_LEAVE";
    if (aEligible !== bEligible) {
      return aEligible ? -1 : 1;
    }
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.activeWorkload - b.activeWorkload;
  });

  // Flag the top recommendation (ONLY eligible staff with activeWorkload < maxCapacity can be top recommendation)
  const topEligible = scoredList.find(
    (c) =>
      c.availabilityStatus === "AVAILABLE" && c.activeWorkload < maxCapacity,
  );
  if (topEligible) {
    topEligible.isTopRecommendation = true;
  }

  return {
    grievance: {
      id: grievance.grievance_id.toString(),
      grievanceNumber: grievance.grievance_number,
      title: grievance.title,
      category: grievance.categories?.category_name || "General",
      subcategory: grievance.subcategories?.subcategory_name || "General",
      priority: grievance.priority,
      slaStatus: grievance.sla_status || "ON_TRACK",
      dueAt: grievance.due_at ? grievance.due_at.toISOString() : null,
      departmentName:
        resolvedDeptName ||
        targetDeptRecord?.departments?.department_name ||
        "Department Queue",
      assignedStaffId: currentAssignedUser
        ? currentAssignedUser.user_id.toString()
        : null,
      assignedStaffName: currentAssignedUser
        ? `${currentAssignedUser.first_name} ${currentAssignedUser.last_name || ""}`.trim()
        : null,
    },
    recommendations: scoredList,
  };
}
