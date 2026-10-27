import { NextResponse } from "next/server";
import { calculateFieldSimilarity } from "@/lib/knowledge/tfidf-service";
import { prisma } from "@/lib/prisma";
import { resolveStaffAuth } from "@/lib/staff/permissions";

interface ParsedKbContent {
  problem?: string;
  solutionSteps?: string;
  resolution?: string;
  considerations?: string;
  keyPoints?: string;
  references?: string;
  description?: string;
}

interface RecommendationParams {
  categoryId?: string | bigint | null;
  subcategoryId?: string | bigint | null;
  category?: string | null;
  subcategory?: string | null;
  title?: string | null;
  description?: string | null;
}

async function processRecommendations(params: RecommendationParams) {
  const {
    categoryId,
    subcategoryId,
    category: categoryNameParam,
    subcategory: subcategoryNameParam,
    title,
    description,
  } = params;

  try {
    let catId: bigint | null = null;
    let subCatId: bigint | null = null;

    if (categoryId) {
      const raw = String(categoryId).trim();
      if (/^\d+$/.test(raw)) {
        try {
          catId = BigInt(raw);
        } catch {
          catId = null;
        }
      }
    }

    if (subcategoryId) {
      const raw = String(subcategoryId).trim();
      if (/^\d+$/.test(raw)) {
        try {
          subCatId = BigInt(raw);
        } catch {
          subCatId = null;
        }
      }
    }

    if (!catId && categoryNameParam?.trim()) {
      const cat = await prisma.categories.findFirst({
        where: {
          category_name: {
            equals: categoryNameParam.trim(),
            mode: "insensitive",
          },
        },
        select: { category_id: true },
      });
      if (cat) catId = cat.category_id;
    }

    if (!subCatId && subcategoryNameParam?.trim()) {
      const sub = await prisma.subcategories.findFirst({
        where: {
          subcategory_name: {
            equals: subcategoryNameParam.trim(),
            mode: "insensitive",
          },
        },
        select: { subcategory_id: true },
      });
      if (sub) subCatId = sub.subcategory_id;
    }

    // 1. Fetch candidate PUBLISHED knowledge articles
    // First attempt: fetch published articles in the target category (if known)
    const candidateWhere: {
      status: string;
      category_id?: bigint;
    } = {
      status: "PUBLISHED",
      ...(catId ? { category_id: catId } : {}),
    };

    let articles = await prisma.knowledge_articles.findMany({
      where: candidateWhere,
      include: {
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
        users: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 40,
    });

    // Fallback: If no published articles exist in this category yet, search across all published articles
    if (articles.length === 0 && catId) {
      articles = await prisma.knowledge_articles.findMany({
        where: { status: "PUBLISHED" },
        include: {
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
          users: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: 40,
      });
    }

    const trimmedTitle = (title || "").trim();
    const trimmedDesc = (description || "").trim();
    const hasText = trimmedTitle.length > 0 || trimmedDesc.length > 0;

    // 2. Score each candidate article using NLP TF-IDF text similarity + taxonomy matching
    const scoredArticles = articles.map((art) => {
      let parsedContent: ParsedKbContent = {};

      try {
        parsedContent = JSON.parse(art.content) as ParsedKbContent;
      } catch {
        parsedContent = { solutionSteps: art.content };
      }

      const resolutionText =
        parsedContent.resolution || parsedContent.solutionSteps || "";
      const keyPointsText =
        parsedContent.keyPoints || parsedContent.considerations || null;

      const problemText =
        parsedContent.problem?.trim() ||
        parsedContent.description?.trim() ||
        art.resolutions?.problem_summary?.trim() ||
        art.resolutions?.grievances?.description?.trim() ||
        art.resolutions?.grievances?.title?.trim() ||
        (parsedContent.solutionSteps
          ? `Standard redressal procedure and recurring pattern for ${art.title}.`
          : "");

      // Comprehensive article text extraction across all sections
      const fullArticleContent = [
        art.title,
        problemText,
        resolutionText,
        keyPointsText,
        art.resolutions?.grievances?.description,
      ]
        .filter(
          (t): t is string => typeof t === "string" && t.trim().length > 0,
        )
        .join(" ");

      // A. Taxonomy matching score:
      // Exact Category + Subcategory match: 100
      // Same Category, different / general subcategory: 60
      // Different Category: 0
      let taxonomyScore = 0;
      const isSameCategory =
        catId &&
        art.category_id &&
        catId.toString() === art.category_id.toString();
      const isExactSubcategory =
        subCatId &&
        art.subcategory_id &&
        subCatId.toString() === art.subcategory_id.toString();

      if (isSameCategory) {
        taxonomyScore = isExactSubcategory ? 100 : 60;
      }

      // B. NLP TF-IDF Text Similarity Component Scores:
      const titleSim = trimmedTitle
        ? calculateFieldSimilarity(trimmedTitle, art.title)
        : 0;

      // Compare grievance description against both problemText and full article content
      const descSim = trimmedDesc
        ? Math.max(
            calculateFieldSimilarity(trimmedDesc, problemText),
            calculateFieldSimilarity(trimmedDesc, fullArticleContent),
          )
        : 0;

      const fullGrievanceText = `${trimmedTitle} ${trimmedDesc}`.trim();
      const combinedSim = hasText
        ? calculateFieldSimilarity(fullGrievanceText, fullArticleContent)
        : 0;

      // Best text match score
      const textScore = Math.max(
        combinedSim,
        descSim * 0.7 + titleSim * 0.3,
        titleSim,
      );

      // C. Weighted relevance score:
      let rawScore = 0;
      if (hasText && isSameCategory) {
        // Balanced 40% Taxonomy baseline + 60% Text matching
        rawScore = taxonomyScore * 0.4 + textScore * 0.6;
      } else if (hasText) {
        // Different category: rely primarily on text relevance
        rawScore = textScore;
      } else {
        // Fallback to pure taxonomy matching when no text is provided
        rawScore = taxonomyScore;
      }

      const matchScore = Math.min(
        100,
        Math.max(0, Math.round(rawScore * 100) / 100),
      );

      const creator = art.users;
      const creatorName = creator
        ? `${creator.first_name} ${creator.last_name || ""}`.trim()
        : "Staff Member";

      return {
        id: art.article_id.toString(),
        title: art.title,
        problem: problemText,
        solutionSteps: resolutionText,
        resolution: resolutionText,
        considerations: keyPointsText,
        keyPoints: keyPointsText,
        references: parsedContent.references || null,
        category: art.categories?.category_name || "General",
        subcategory: art.subcategories?.subcategory_name || "General",
        categoryId: art.category_id?.toString() || null,
        subcategoryId: art.subcategory_id?.toString() || null,
        createdBy: creatorName,
        createdAt: art.created_at.toISOString(),
        status: art.status as
          | "DRAFT"
          | "PENDING_REVIEW"
          | "PUBLISHED"
          | "REJECTED",
        matchScore,
        isExactSubcategory,
      };
    });

    // 3. Filter and Rank:
    // Strictly refer KB only if the relevance score matches at least 75%
    const relevantArticles = scoredArticles.filter((a) => a.matchScore >= 75);

    // Sort descending by matchScore (highest relevance first)
    relevantArticles.sort((a, b) => b.matchScore - a.matchScore);

    // Strip internal helper flags and return top 10
    const finalResult = relevantArticles
      .slice(0, 10)
      .map(({ isExactSubcategory, ...rest }) => rest);

    return NextResponse.json({
      success: true,
      articles: finalResult,
    });
  } catch (error) {
    console.error("Error in processRecommendations:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch knowledge recommendations" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const auth = await resolveStaffAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  return processRecommendations({
    categoryId: searchParams.get("categoryId"),
    subcategoryId: searchParams.get("subcategoryId"),
    category: searchParams.get("category"),
    subcategory: searchParams.get("subcategory"),
    title: searchParams.get("title"),
    description: searchParams.get("description"),
  });
}

export async function POST(request: Request) {
  const auth = await resolveStaffAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  let body: RecommendationParams = {};
  try {
    body = (await request.json()) as RecommendationParams;
  } catch {
    body = {};
  }

  return processRecommendations(body);
}
