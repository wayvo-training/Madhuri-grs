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
  problemSimilarity: number;
  resolutionSimilarity: number;
  titleSimilarity: number;
  metadataScore: number;
  finalScore: number;
  classification: SimilarityClassification;
  problemText?: string;
  resolutionText?: string;
  createdAt?: string;
}

export interface CheckDuplicatesParams {
  title: string;
  problem: string;
  resolution: string;
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
 * 4. Weighted scoring:
 *    - Problem Similarity: 40%
 *    - Resolution Similarity: 35%
 *    - Title Similarity: 15%
 *    - Metadata Match: 10%
 * 5. Returns sorted candidates by finalScore DESC.
 */
export async function checkKnowledgeDuplicates(
  params: CheckDuplicatesParams,
): Promise<SimilarityCheckResult> {
  const {
    title,
    problem,
    resolution,
    categoryId,
    subcategoryId,
    categoryName,
    subcategoryName,
    excludeArticleId,
  } = params;

  const trimmedTitle = (title || "").trim();
  const trimmedProblem = (problem || "").trim();
  const trimmedResolution = (resolution || "").trim();

  // If required fields are empty, return safe empty result
  if (!trimmedTitle && !trimmedProblem && !trimmedResolution) {
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

  // TAXONOMY FILTERING (Section 4):
  // Only compare articles within the exact Category + Subcategory.
  // If category or subcategory is completely unknown/missing, we cannot taxonomy-filter safely,
  // so return 0 candidates to prevent cross-taxonomy false positives.
  if (!catId || !subCatId) {
    return {
      totalCandidatesCompared: 0,
      highestMatch: null,
      highestClassification: "NO_SIGNIFICANT_MATCH",
      candidates: [],
    };
  }

  let excludeId: bigint | null = null;
  if (excludeArticleId) {
    try {
      excludeId = BigInt(excludeArticleId);
    } catch {
      excludeId = null;
    }
  }

  // 2. Fetch candidate articles: Status IN ['PUBLISHED', 'PENDING_REVIEW']
  const candidatesFromDb = await prisma.knowledge_articles.findMany({
    where: {
      category_id: catId,
      subcategory_id: subCatId,
      status: { in: ["PUBLISHED", "PENDING_REVIEW"] },
      ...(excludeId ? { article_id: { not: excludeId } } : {}),
    },
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
        },
      },
    },
    orderBy: { created_at: "desc" },
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
    let candResolution = "";

    try {
      const parsed = JSON.parse(cand.content);
      candProblem = parsed.problem || "";
      candResolution = parsed.resolution || parsed.solutionSteps || "";
    } catch {
      candResolution = cand.content;
    }

    // Fallback from resolution if problem is absent
    if (!candProblem && cand.resolutions?.problem_summary) {
      candProblem = cand.resolutions.problem_summary;
    }
    if (!candResolution && cand.resolutions?.action_taken) {
      candResolution = cand.resolutions.action_taken;
    }

    // A. Calculate component scores (0..100)
    const problemSimilarity = calculateFieldSimilarity(
      trimmedProblem,
      candProblem,
    );
    const resolutionSimilarity = calculateFieldSimilarity(
      trimmedResolution,
      candResolution,
    );
    const titleSimilarity = calculateFieldSimilarity(trimmedTitle, cand.title);

    // B. Metadata matching score: deterministic 100 since taxonomy filtered
    const metadataScore = 100;

    // C. Weighted final score:
    // Final Score = (Problem * 0.40) + (Resolution * 0.35) + (Title * 0.15) + (Metadata * 0.10)
    const rawFinalScore =
      problemSimilarity * 0.4 +
      resolutionSimilarity * 0.35 +
      titleSimilarity * 0.15 +
      metadataScore * 0.1;

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
      problemSimilarity,
      resolutionSimilarity,
      titleSimilarity,
      metadataScore,
      finalScore,
      classification,
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
