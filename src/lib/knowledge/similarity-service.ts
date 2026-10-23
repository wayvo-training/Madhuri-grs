import { prisma } from "@/lib/prisma";
import { calculateFieldSimilarity } from "./tfidf-service";

export type SimilarityClassification =
  | "LIKELY_DUPLICATE"
  | "SIMILAR"
  | "NO_SIGNIFICANT_MATCH";

export interface SimilarityCandidateResult {
  articleId: string;
  articleTitle: string;
  status: string;
  categoryId: string | null;
  subcategoryId: string | null;
  categoryName?: string;
  subcategoryName?: string;
  titleSimilarity: number;
  descriptionSimilarity: number;
  problemSimilarity: number;
  resolutionSimilarity: number;
  metadataScore: number;
  finalScore: number;
  classification: SimilarityClassification;
  descriptionText?: string;
  problemText?: string;
  resolutionText?: string;
  createdAt?: string;
}

export interface CheckDuplicatesParams {
  title: string;
  description?: string;
  problem?: string;
  resolution?: string;
  categoryId?: string | bigint | null;
  subcategoryId?: string | bigint | null;
  categoryName?: string | null;
  subcategoryName?: string | null;
  excludeArticleId?: string | bigint | null;
}

export interface SimilarityCheckResult {
  totalCandidatesCompared: number;
  highestMatch: SimilarityCandidateResult | null;
  highestClassification: SimilarityClassification;
  candidates: SimilarityCandidateResult[];
}

/**
 * Classifies a final similarity score (0..100):
 * - 90–100: LIKELY_DUPLICATE ("Likely Duplicate")
 * - 75–89:  SIMILAR ("Similar Knowledge")
 * - 0–74:   NO_SIGNIFICANT_MATCH ("No Significant Match")
 */
export function classifyScore(score: number): SimilarityClassification {
  if (score >= 90) {
    return "LIKELY_DUPLICATE";
  }
  if (score >= 75) {
    return "SIMILAR";
  }
  return "NO_SIGNIFICANT_MATCH";
}

/**
 * Knowledge Base Similarity & Duplicate Detection Service.
 *
 * Enforces:
 * 1. Taxonomy Filtering (Category + Subcategory match, status IN PUBLISHED / PENDING_REVIEW).
 * 2. Deterministic text preprocessing via Natural.
 * 3. TF-IDF vectorization and cosine similarity via Natural.
 * 4. Weighted scoring (aligned with Grievance Domain Model):
 *    - Problem Statement: 50%
 *    - Resolution: 40%
 *    - Taxonomy Metadata Match (Category + Subcategory): 10%
 * 5. Returns sorted candidates by finalScore DESC.
 */
export async function checkKnowledgeDuplicates(
  params: CheckDuplicatesParams,
): Promise<SimilarityCheckResult> {
  const {
    title,
    description,
    problem,
    resolution,
    categoryId,
    subcategoryId,
    categoryName,
    subcategoryName,
    excludeArticleId,
  } = params;

  const trimmedTitle = (title || "").trim();
  const rawProblem = (problem || "").trim();
  const rawDescription = (description || "").trim();
  // If only one of problem/description is provided, use it for both without pretending they are distinct inputs.
  const trimmedProblem = rawProblem || rawDescription;
  const trimmedDescription = rawDescription || rawProblem;
  const trimmedResolution = (resolution || "").trim();

  // If required fields are empty, return safe empty result
  if (
    !trimmedTitle &&
    !trimmedDescription &&
    !trimmedProblem &&
    !trimmedResolution
  ) {
    return {
      totalCandidatesCompared: 0,
      highestMatch: null,
      highestClassification: "NO_SIGNIFICANT_MATCH",
      candidates: [],
    };
  }

  // 1. Resolve category_id and subcategory_id
  let catId: bigint | null = null;
  let subCatId: bigint | null = null;

  if (categoryId) {
    try {
      catId = BigInt(categoryId);
    } catch {
      catId = null;
    }
  }

  if (subcategoryId) {
    try {
      subCatId = BigInt(subcategoryId);
    } catch {
      subCatId = null;
    }
  }

  if (!catId && categoryName?.trim()) {
    try {
      const found = await prisma.categories.findFirst({
        where: {
          category_name: {
            equals: categoryName.trim(),
            mode: "insensitive",
          },
        },
        select: { category_id: true },
      });
      if (found) catId = found.category_id;
    } catch {
      const found = await prisma.categories.findFirst({
        where: { category_name: categoryName.trim() },
        select: { category_id: true },
      });
      if (found) catId = found.category_id;
    }
  }

  if (!subCatId && subcategoryName?.trim()) {
    try {
      const found = await prisma.subcategories.findFirst({
        where: {
          subcategory_name: {
            equals: subcategoryName.trim(),
            mode: "insensitive",
          },
        },
        select: { subcategory_id: true },
      });
      if (found) subCatId = found.subcategory_id;
    } catch {
      const found = await prisma.subcategories.findFirst({
        where: { subcategory_name: subcategoryName.trim() },
        select: { subcategory_id: true },
      });
      if (found) subCatId = found.subcategory_id;
    }
  }

  let excludeId: bigint | null = null;
  if (excludeArticleId) {
    try {
      excludeId = BigInt(excludeArticleId);
    } catch {
      excludeId = null;
    }
  }

  // TAXONOMY FILTERING:
  // If category and subcategory are known, filter strictly by category to keep comparisons focused,
  // while allowing both exact subcategory matches (full score 100) and sibling subcategory matches (score 50)
  // to detect misclassified duplicate articles.
  // If no category is known, compare across all published/pending articles with 0 metadata bonus.
  const whereClause: {
    status: { in: string[] };
    article_id?: { not: bigint };
    category_id?: bigint;
  } = {
    status: { in: ["PUBLISHED", "PENDING_REVIEW"] },
    ...(excludeId ? { article_id: { not: excludeId } } : {}),
  };

  if (catId) {
    whereClause.category_id = catId;
  }

  // 2. Fetch candidate articles: Status IN ['PUBLISHED', 'PENDING_REVIEW']
  const candidatesFromDb = await prisma.knowledge_articles.findMany({
    where: whereClause,
    select: {
      article_id: true,
      title: true,
      content: true,
      status: true,
      category_id: true,
      subcategory_id: true,
      created_at: true,
      categories: { select: { category_name: true } },
      subcategories: { select: { subcategory_name: true } },
      resolutions: {
        select: {
          problem_summary: true,
          action_taken: true,
          findings: true,
          grievances: {
            select: {
              title: true,
              description: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  if (candidatesFromDb.length === 0) {
    return {
      totalCandidatesCompared: 0,
      highestMatch: null,
      highestClassification: "NO_SIGNIFICANT_MATCH",
      candidates: [],
    };
  }

  // 3. Compare each candidate article
  const results: SimilarityCandidateResult[] = [];

  for (const cand of candidatesFromDb) {
    let candProblem = "";
    let candDescription = "";
    let candResolution = "";

    try {
      const parsed = JSON.parse(cand.content);
      if (parsed && typeof parsed === "object") {
        candDescription = parsed.description || parsed.problem || "";
        candProblem = parsed.problem || parsed.description || "";
        candResolution = parsed.resolution || parsed.solutionSteps || "";
      } else {
        candDescription = String(cand.content || "");
        candProblem = String(cand.content || "");
        candResolution = "";
      }
    } catch {
      // Raw plain text article content represents problem/description, NOT a resolution
      candDescription = cand.content || "";
      candProblem = cand.content || "";
      candResolution = "";
    }

    // Fallback from resolution / grievance if problem/description is absent
    if (!candDescription) {
      candDescription =
        cand.resolutions?.grievances?.description ||
        cand.resolutions?.problem_summary ||
        "";
    }
    if (!candProblem) {
      candProblem = candDescription || cand.resolutions?.problem_summary || "";
    }
    if (!candResolution && cand.resolutions?.action_taken) {
      candResolution = cand.resolutions.action_taken;
    }

    // A. Calculate component scores (0..100)
    const titleSimilarity = calculateFieldSimilarity(trimmedTitle, cand.title);
    const descriptionSimilarity = calculateFieldSimilarity(
      trimmedDescription || trimmedProblem,
      candDescription || candProblem,
    );
    const problemSimilarity = calculateFieldSimilarity(
      trimmedProblem || trimmedDescription,
      candProblem || candDescription,
    );
    const resolutionSimilarity = trimmedResolution
      ? calculateFieldSimilarity(trimmedResolution, candResolution)
      : 0;

    // B. Metadata matching score:
    // Exact Category + Subcategory match: 100
    // Same Category match (different/unspecified subcategory): 50
    // Cross Category: 0
    let metadataScore = 0;
    if (
      catId &&
      cand.category_id &&
      catId.toString() === cand.category_id.toString()
    ) {
      if (
        subCatId &&
        cand.subcategory_id &&
        subCatId.toString() === cand.subcategory_id.toString()
      ) {
        metadataScore = 100;
      } else {
        metadataScore = 50;
      }
    }

    // C. Weighted final score:
    // With resolution: Title (20%), Problem (25%), Description (20%), Resolution (25%), Taxonomy (10%)
    // Without resolution: Title (25%), Problem (35%), Description (30%), Taxonomy (10%)
    const hasResolution = trimmedResolution.length > 0;
    const titleWeight = hasResolution ? 0.2 : 0.25;
    const problemWeight = hasResolution ? 0.25 : 0.35;
    const descriptionWeight = hasResolution ? 0.2 : 0.3;
    const resolutionWeight = hasResolution ? 0.25 : 0.0;
    const metadataWeight = 0.1;

    const rawFinalScore =
      titleSimilarity * titleWeight +
      problemSimilarity * problemWeight +
      descriptionSimilarity * descriptionWeight +
      resolutionSimilarity * resolutionWeight +
      metadataScore * metadataWeight;

    const finalScore = Math.min(
      100,
      Math.max(0, Math.round(rawFinalScore * 100) / 100),
    );
    const classification = classifyScore(finalScore);

    results.push({
      articleId: cand.article_id.toString(),
      articleTitle: cand.title,
      status: cand.status,
      categoryId: cand.category_id?.toString() || null,
      subcategoryId: cand.subcategory_id?.toString() || null,
      categoryName: cand.categories?.category_name || undefined,
      subcategoryName: cand.subcategories?.subcategory_name || undefined,
      titleSimilarity,
      descriptionSimilarity,
      problemSimilarity,
      resolutionSimilarity,
      metadataScore,
      finalScore,
      classification,
      descriptionText: candDescription || undefined,
      problemText: candProblem || undefined,
      resolutionText: candResolution || undefined,
      createdAt: cand.created_at.toISOString(),
    });
  }

  // 4. Sort candidates by finalScore DESC
  results.sort((a, b) => b.finalScore - a.finalScore);

  const highestMatch = results[0] || null;
  const highestClassification = highestMatch
    ? highestMatch.classification
    : "NO_SIGNIFICANT_MATCH";

  return {
    totalCandidatesCompared: results.length,
    highestMatch,
    highestClassification,
    candidates: results,
  };
}

export const KnowledgeSimilarityService = {
  checkDuplicates: checkKnowledgeDuplicates,
};
