import { prisma } from "@/lib/prisma";

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

// Category-to-skill affinity keywords
const CATEGORY_SKILL_AFFINITY: Record<string, string[]> = {
  "compensation & benefits": [
    "payroll management",
    "policy interpretation",
    "employee relations",
  ],
  "leave & attendance": [
    "policy interpretation",
    "employee relations",
    "compliance management",
  ],
  "workplace conduct": [
    "conflict resolution",
    "employee relations",
    "compliance management",
  ],
  "hr & employment": [
    "performance management",
    "employee relations",
    "policy interpretation",
  ],
  "management & leadership": [
    "conflict resolution",
    "policy interpretation",
    "employee relations",
  ],
  "policy & process": [
    "policy interpretation",
    "compliance management",
    "employee relations",
  ],
  "work environment": [
    "workplace safety",
    "facilities management",
    "compliance management",
  ],
  "ethics & compliance": [
    "compliance management",
    "policy interpretation",
    "conflict resolution",
  ],
  "career & development": [
    "performance management",
    "employee relations",
    "policy interpretation",
  ],
  "workplace services": [
    "facilities management",
    "workplace safety",
    "employee relations",
  ],
};

const PROFICIENCY_MULTIPLIERS: Record<string, number> = {
  EXPERT: 1.0,
  ADVANCED: 0.85,
  INTERMEDIATE: 0.7,
  BEGINNER: 0.5,
};

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

  const categoryName = (
    grievance.categories?.category_name || ""
  ).toLowerCase();
  const subcategoryName = (
    grievance.subcategories?.subcategory_name || ""
  ).toLowerCase();
  const priority = (grievance.priority || "MEDIUM").toUpperCase();
  const targetDeptId =
    grievance.grievance_departments?.department_id || departmentId;

  // Active assignment if already assigned
  const activeAssignment = grievance.grievance_departments?.assignments;
  const currentAssignedUser =
    activeAssignment?.users_assignments_staff_idTousers;

  // 2. Fetch eligible staff in this department
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

  const affinityKeywords = CATEGORY_SKILL_AFFINITY[categoryName] || [];

  const maxCapacity = 8;

  // 3. Score each candidate
  const scoredList: StaffRecommendationResult[] = candidates.map((staff) => {
    const staffName = `${staff.first_name} ${staff.last_name || ""}`.trim();

    // Workload calculation
    const activeAssignments =
      staff.assignments_assignments_staff_idTousers.filter(
        (a) => a.assignment_status === "ASSIGNED",
      );
    const activeWorkload = activeAssignments.length;

    // Availability status
    let availabilityStatus: "AVAILABLE" | "BUSY" | "ON_LEAVE" = "AVAILABLE";
    if (staff.status === "INACTIVE" || staff.status === "ON_LEAVE") {
      availabilityStatus = "ON_LEAVE";
    } else if (activeWorkload >= maxCapacity) {
      availabilityStatus = "BUSY";
    }

    // --- Factor 1: Skill / Category Match (35%) ---
    let skillScore = 0;
    const matchedSkills: string[] = [];

    for (const us of staff.user_skills) {
      const skillName = us.skills.skill_name.toLowerCase();
      const mult =
        PROFICIENCY_MULTIPLIERS[us.proficiency_level || "INTERMEDIATE"] || 0.7;

      let matchWeight = 0;
      if (affinityKeywords.includes(skillName)) {
        matchWeight = 25 * mult;
        matchedSkills.push(us.skills.skill_name);
      } else if (
        categoryName.includes(skillName) ||
        skillName.includes(categoryName) ||
        subcategoryName.includes(skillName)
      ) {
        matchWeight = 20 * mult;
        matchedSkills.push(us.skills.skill_name);
      } else {
        // Partial relevance
        matchWeight = 8 * mult;
      }
      skillScore = Math.max(skillScore, matchWeight);
    }

    // Boost if multiple relevant skills matched
    if (matchedSkills.length > 1) {
      skillScore = Math.min(35, skillScore + 5 * (matchedSkills.length - 1));
    }
    skillScore = Math.min(35, Math.round(skillScore));

    // --- Factor 2: Relevant Previous Experience (25%) ---
    // Count previous assignments or resolutions in this category or subcategory
    let pastCategoryCases = 0;
    let pastSubcategoryCases = 0;

    for (const a of staff.assignments_assignments_staff_idTousers) {
      if (a.grievance_id !== grievanceId) {
        if (a.grievances?.subcategory_id === grievance.subcategory_id) {
          pastSubcategoryCases++;
        } else if (a.grievances?.category_id === grievance.category_id) {
          pastCategoryCases++;
        }
      }
    }

    for (const r of staff.resolutions) {
      if (r.grievance_id !== grievanceId) {
        if (r.grievances?.subcategory_id === grievance.subcategory_id) {
          pastSubcategoryCases++;
        } else if (r.grievances?.category_id === grievance.category_id) {
          pastCategoryCases++;
        }
      }
    }

    let experienceScore = 0;
    if (pastSubcategoryCases >= 2) {
      experienceScore = 25;
    } else if (pastSubcategoryCases === 1) {
      experienceScore = 22;
    } else if (pastCategoryCases >= 3) {
      experienceScore = 20;
    } else if (pastCategoryCases >= 1) {
      experienceScore = 15;
    } else if (
      staff.user_skills.some((us) => (Number(us.experience_years) || 0) >= 3)
    ) {
      experienceScore = 12;
    } else {
      experienceScore = 8;
    }

    // --- Factor 3: Current Workload (20%) ---
    let workloadScore = 0;
    if (activeWorkload === 0) workloadScore = 20;
    else if (activeWorkload === 1) workloadScore = 19;
    else if (activeWorkload === 2) workloadScore = 18;
    else if (activeWorkload === 3) workloadScore = 15;
    else if (activeWorkload === 4) workloadScore = 12;
    else if (activeWorkload === 5) workloadScore = 9;
    else if (activeWorkload === 6) workloadScore = 6;
    else if (activeWorkload === 7) workloadScore = 3;
    else workloadScore = 0;

    // --- Factor 4: Availability (10%) ---
    let availabilityScore = 0;
    if (availabilityStatus === "AVAILABLE") {
      availabilityScore = activeWorkload <= 4 ? 10 : 7;
    } else if (availabilityStatus === "BUSY") {
      availabilityScore = 2;
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
      if (hasExpertSkill && activeWorkload <= 3) {
        slaScore = 10;
      } else if (hasExpertSkill || activeWorkload <= 4) {
        slaScore = 7;
      } else {
        slaScore = 4;
      }
    } else {
      // Normal/Medium priority
      slaScore = activeWorkload <= 5 ? 10 : 6;
    }

    // Total Score (0 - 100)
    const totalScore = Math.min(
      99,
      Math.max(
        35,
        skillScore +
          experienceScore +
          workloadScore +
          availabilityScore +
          slaScore,
      ),
    );

    // Build human-friendly explainable bullet points
    const bulletReasons: string[] = [];

    if (skillScore >= 20 && matchedSkills.length > 0) {
      bulletReasons.push(
        `Strong category/skill match (${matchedSkills.slice(0, 2).join(", ")})`,
      );
    } else if (matchedSkills.length > 0) {
      bulletReasons.push(`Relevant skills: ${matchedSkills[0]}`);
    } else {
      bulletReasons.push("General departmental competency");
    }

    const totalRelevantPast = pastSubcategoryCases + pastCategoryCases;
    if (totalRelevantPast > 0) {
      bulletReasons.push(
        `Relevant previous experience (${totalRelevantPast} similar case${totalRelevantPast > 1 ? "s" : ""} handled)`,
      );
    } else {
      bulletReasons.push("Qualified for category procedures");
    }

    if (availabilityStatus === "AVAILABLE") {
      bulletReasons.push("Available on active duty");
    } else if (availabilityStatus === "BUSY") {
      bulletReasons.push("Currently near maximum assignment capacity");
    } else {
      bulletReasons.push("On approved leave");
    }

    if (activeWorkload <= 2) {
      bulletReasons.push(
        `Low current workload (${activeWorkload} / ${maxCapacity} assigned)`,
      );
    } else if (activeWorkload <= 5) {
      bulletReasons.push(
        `Moderate workload (${activeWorkload} / ${maxCapacity} assigned)`,
      );
    } else {
      bulletReasons.push(
        `High active workload (${activeWorkload} / ${maxCapacity} assigned)`,
      );
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

  // Sort by score descending (and lower workload secondary)
  scoredList.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.activeWorkload - b.activeWorkload;
  });

  // Flag the top recommendation
  if (
    scoredList.length > 0 &&
    scoredList[0].availabilityStatus === "AVAILABLE"
  ) {
    scoredList[0].isTopRecommendation = true;
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
        grievance.grievance_departments?.departments?.department_name ||
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
