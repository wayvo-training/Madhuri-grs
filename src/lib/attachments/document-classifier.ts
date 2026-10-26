/**
 * Document Visibility & Intelligent Department Classifier
 *
 * Classifies attachments uploaded during grievance lifecycle against
 * participating departments using file metadata, content keywords,
 * and grievance category/subcategory taxonomy.
 */

export interface DepartmentProfile {
  department_id: bigint | number;
  department_name: string;
  involvement_type?: string;
}

export interface DocumentClassificationInput {
  fileName: string;
  fileType?: string;
  fileSize?: number;
  textContent?: string;
  grievanceTitle?: string;
  grievanceDescription?: string;
  categoryName?: string;
  subcategoryName?: string;
  participatingDepartments: DepartmentProfile[];
}

export interface DocumentClassificationResult {
  targetDepartmentIds: bigint[];
  matchedDepartmentNames: string[];
  confidence: number;
  matchedKeywords: string[];
  classificationMethod:
    | "FILE_NAME"
    | "FILE_CONTENT"
    | "TAXONOMY_MATCH"
    | "ALL_PARTICIPATING";
  reason: string;
}

// Predefined domain keyword profiles mapped by department domain category
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  FINANCE: [
    "salary",
    "pay",
    "payroll",
    "payslip",
    "pay-slip",
    "bonus",
    "tax",
    "tds",
    "form16",
    "form-16",
    "allowance",
    "deduction",
    "reimbursement",
    "invoice",
    "bill",
    "receipt",
    "bank",
    "statement",
    "account",
    "pf",
    "epf",
    "provident",
    "gratuity",
    "compensation",
    "arrears",
    "financial",
    "expense",
    "cheque",
    "ledger",
    "pension",
    "wage",
    "fund",
    "remittance",
    "transaction",
  ],
  HR: [
    "leave",
    "attendance",
    "appraisal",
    "promotion",
    "warning",
    "termination",
    "resignation",
    "contract",
    "appointment",
    "conduct",
    "harassment",
    "policy",
    "disciplinary",
    "performance",
    "medical",
    "health",
    "fitness",
    "probation",
    "onboarding",
    "experience",
    "relieving",
    "joining",
    "increment",
    "posh",
    "ethics",
    "transfer",
    "recruitment",
    "memo",
    "notice",
    "offer",
  ],
  IT: [
    "laptop",
    "system",
    "hardware",
    "software",
    "vpn",
    "network",
    "access",
    "wifi",
    "email",
    "server",
    "bug",
    "error",
    "license",
    "portal",
    "credentials",
    "password",
    "login",
    "domain",
    "monitor",
    "firewall",
    "it",
    "technical",
    "cyber",
    "security",
    "database",
    "sql",
    "injection",
    "hack",
    "malware",
    "breach",
    "phishing",
    "unauthorized",
    "log",
    "leak",
    "vulnerability",
    "incident",
    "stack",
    "techstack",
    "table",
    "query",
    "code",
    "script",
  ],
  FACILITIES: [
    "desk",
    "chair",
    "facility",
    "building",
    "maintenance",
    "transport",
    "cab",
    "food",
    "cafeteria",
    "badge",
    "parking",
    "security",
    "cleaning",
    "ac",
    "electricity",
    "washroom",
    "housekeeping",
    "admin",
  ],
  LEGAL: [
    "legal",
    "compliance",
    "audit",
    "regulation",
    "statutory",
    "violation",
    "notice",
    "court",
    "dispute",
    "litigation",
    "clause",
    "agreement",
    "nda",
    "complaint",
  ],
  ELECTRICAL: [
    "electric",
    "electricity",
    "power",
    "voltage",
    "meter",
    "transformer",
    "blackout",
    "wire",
    "short_circuit",
    "outage",
    "substation",
    "cable",
  ],

  HEALTH_SAFETY: [
    "hospital",
    "medical",
    "clinic",
    "injury",
    "health",
    "hazard",
    "chemical",
    "contamination",
    "doctor",
    "prescription",
    "patient",
    "safety",
  ],
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-_]/g, " ");
}

function resolveDepartmentDomain(deptName: string): string | null {
  const normalized = deptName.toLowerCase();
  if (
    normalized.includes("finan") ||
    normalized.includes("account") ||
    normalized.includes("payroll") ||
    normalized.includes("billing") ||
    normalized.includes("tax") ||
    normalized.includes("treasur")
  ) {
    return "FINANCE";
  }
  if (
    normalized.includes("hr") ||
    normalized.includes("human resource") ||
    normalized.includes("people") ||
    normalized.includes("talent") ||
    normalized.includes("personnel") ||
    normalized.includes("staff")
  ) {
    return "HR";
  }
  if (
    normalized.includes("cyber") ||
    normalized.includes("crime") ||
    normalized.includes("security") ||
    normalized.includes("infosec") ||
    normalized.includes("it") ||
    normalized.includes("tech") ||
    normalized.includes("information tech") ||
    normalized.includes("software") ||
    normalized.includes("infra")
  ) {
    return "IT";
  }
  if (
    normalized.includes("facilit") ||
    normalized.includes("admin") ||
    normalized.includes("operat") ||
    normalized.includes("estate")
  ) {
    return "FACILITIES";
  }
  if (
    normalized.includes("legal") ||
    normalized.includes("complian") ||
    normalized.includes("vigilan")
  ) {
    return "LEGAL";
  }
  if (
    normalized.includes("electr") ||
    normalized.includes("power") ||
    normalized.includes("energy")
  ) {
    return "ELECTRICAL";
  }

  if (
    normalized.includes("health") ||
    normalized.includes("medic") ||
    normalized.includes("hospit") ||
    normalized.includes("safety")
  ) {
    return "HEALTH_SAFETY";
  }
  return null;
}

/**
 * Classifies an uploaded document against participating departments.
 */
export function classifyAttachmentForDepartments(
  input: DocumentClassificationInput,
): DocumentClassificationResult {
  const {
    fileName,
    textContent = "",
    categoryName = "",
    subcategoryName = "",
    grievanceTitle = "",
    participatingDepartments = [],
  } = input;

  if (participatingDepartments.length <= 1) {
    // If only one department is involved, they naturally receive access
    const allIds = participatingDepartments.map((d) => BigInt(d.department_id));
    return {
      targetDepartmentIds: allIds,
      matchedDepartmentNames: participatingDepartments.map(
        (d) => d.department_name,
      ),
      confidence: 1.0,
      matchedKeywords: [],
      classificationMethod: "ALL_PARTICIPATING",
      reason: "Single participating department receives attachment grant.",
    };
  }

  const normalizedFileName = normalizeText(fileName);
  const normalizedContent = normalizeText(textContent);

  // Score each participating department
  const deptScores = new Map<
    bigint,
    {
      score: number;
      matchedKeywords: string[];
      name: string;
      domain: string | null;
    }
  >();

  for (const dept of participatingDepartments) {
    const deptId = BigInt(dept.department_id);
    const domain = resolveDepartmentDomain(dept.department_name);
    deptScores.set(deptId, {
      score: 0,
      matchedKeywords: [],
      name: dept.department_name,
      domain,
    });

    if (!domain) continue;
    const keywords = DOMAIN_KEYWORDS[domain] || [];

    for (const kw of keywords) {
      // 1. Check filename matches (weight 5 per keyword match)
      const regex = new RegExp(`(^|[-_\\s])${kw}([-_\\s]|$)`, "i");
      if (regex.test(normalizedFileName)) {
        const entry = deptScores.get(deptId)!;
        entry.score += 5;
        if (!entry.matchedKeywords.includes(kw)) {
          entry.matchedKeywords.push(kw);
        }
      }

      // 2. Check text content matches (weight 2 per keyword match)
      if (normalizedContent && normalizedContent.includes(kw)) {
        const entry = deptScores.get(deptId)!;
        entry.score += 2;
        if (!entry.matchedKeywords.includes(kw)) {
          entry.matchedKeywords.push(kw);
        }
      }
    }

    // 3. Department name direct match in filename
    const deptNameNorm = normalizeText(dept.department_name);
    if (normalizedFileName.includes(deptNameNorm)) {
      const entry = deptScores.get(deptId)!;
      entry.score += 8;
      if (!entry.matchedKeywords.includes(dept.department_name)) {
        entry.matchedKeywords.push(dept.department_name);
      }
    }
  }

  // Find max scoring departments
  let maxScore = 0;
  for (const entry of deptScores.values()) {
    if (entry.score > maxScore) {
      maxScore = entry.score;
    }
  }

  // If we found definitive keyword matches (score >= 4)
  if (maxScore >= 4) {
    const matchedDeptIds: bigint[] = [];
    const matchedNames: string[] = [];
    const allKeywords: string[] = [];

    for (const [deptId, entry] of deptScores.entries()) {
      // Allow department if its score is close to the top score (within 60%)
      if (entry.score >= maxScore * 0.6 && entry.score >= 4) {
        matchedDeptIds.push(deptId);
        matchedNames.push(entry.name);
        allKeywords.push(...entry.matchedKeywords);
      }
    }

    if (matchedDeptIds.length > 0) {
      return {
        targetDepartmentIds: matchedDeptIds,
        matchedDepartmentNames: matchedNames,
        confidence: Math.min(1.0, 0.7 + maxScore * 0.05),
        matchedKeywords: Array.from(new Set(allKeywords)),
        classificationMethod:
          normalizedContent.length > 0 ? "FILE_CONTENT" : "FILE_NAME",
        reason: `Matched domain keywords [${Array.from(new Set(allKeywords)).join(", ")}] for department(s): ${matchedNames.join(", ")}.`,
      };
    }
  }

  // Fallback: Check category / subcategory affinity
  const contextText = normalizeText(
    `${categoryName} ${subcategoryName} ${grievanceTitle}`,
  );
  for (const [deptId, entry] of deptScores.entries()) {
    if (!entry.domain) continue;
    const keywords = DOMAIN_KEYWORDS[entry.domain] || [];
    for (const kw of keywords) {
      if (contextText.includes(kw)) {
        entry.score += 1;
        if (!entry.matchedKeywords.includes(kw)) {
          entry.matchedKeywords.push(kw);
        }
      }
    }
  }

  // If still ambiguous or general document (e.g. general grievance proof)
  // grant access to ALL participating departments so evidence is not lost
  const allDeptIds = participatingDepartments.map((d) =>
    BigInt(d.department_id),
  );
  return {
    targetDepartmentIds: allDeptIds,
    matchedDepartmentNames: participatingDepartments.map(
      (d) => d.department_name,
    ),
    confidence: 0.5,
    matchedKeywords: [],
    classificationMethod: "ALL_PARTICIPATING",
    reason:
      "General evidence applicable to all participating departments in the grievance dossier.",
  };
}
