import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveStaffAuth } from "@/lib/staff/permissions";

export async function GET(request: Request) {
  const auth = await resolveStaffAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const categoryIdParam = searchParams.get("categoryId");
  const subcategoryIdParam = searchParams.get("subcategoryId");
  const categoryNameParam = searchParams.get("category");
  const subcategoryNameParam = searchParams.get("subcategory");

  try {
    let catId = categoryIdParam && /^\d+$/.test(categoryIdParam) ? BigInt(categoryIdParam) : null;
    let subCatId = subcategoryIdParam && /^\d+$/.test(subcategoryIdParam) ? BigInt(subcategoryIdParam) : null;

    if (!catId && categoryNameParam?.trim()) {
      const cat = await prisma.categories.findFirst({
        where: { category_name: { equals: categoryNameParam.trim(), mode: "insensitive" } },
        select: { category_id: true },
      });
      if (cat) catId = cat.category_id;
    }

    if (!subCatId && subcategoryNameParam?.trim()) {
      const sub = await prisma.subcategories.findFirst({
        where: { subcategory_name: { equals: subcategoryNameParam.trim(), mode: "insensitive" } },
        select: { subcategory_id: true },
      });
      if (sub) subCatId = sub.subcategory_id;
    }

    // Relevance criteria: Category + Subcategory as initial filter
    const orConditions = [];
    if (catId && subCatId) {
      orConditions.push({ category_id: catId, subcategory_id: subCatId });
      orConditions.push({ category_id: catId });
      orConditions.push({ subcategory_id: subCatId });
    } else if (catId) {
      orConditions.push({ category_id: catId });
    } else if (subCatId) {
      orConditions.push({ subcategory_id: subCatId });
    }

    // Find only PUBLISHED knowledge articles
    const articles = await prisma.knowledge_articles.findMany({
      where: {
        status: "PUBLISHED",
        ...(orConditions.length > 0 ? { OR: orConditions } : {}),
      },
      include: {
        categories: { select: { category_name: true } },
        subcategories: { select: { subcategory_name: true } },
        users: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    const result = articles.map((art) => {
      let parsedContent: {
        problem?: string;
        solutionSteps?: string;
        resolution?: string;
        considerations?: string;
        keyPoints?: string;
        references?: string;
      } = {};

      try {
        parsedContent = JSON.parse(art.content);
      } catch {
        parsedContent = { solutionSteps: art.content };
      }

      const resolutionText =
        parsedContent.resolution || parsedContent.solutionSteps || "";
      const keyPointsText =
        parsedContent.keyPoints || parsedContent.considerations || null;

      const creator = art.users;
      const creatorName = creator
        ? `${creator.first_name} ${creator.last_name || ""}`.trim()
        : "Staff Member";

      return {
        id: art.article_id.toString(),
        title: art.title,
        problem: parsedContent.problem || "",
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
        status: art.status,
      };
    });

    return NextResponse.json({
      success: true,
      articles: result,
    });
  } catch (error) {
    console.error("Error in GET /api/staff/knowledge/recommendations:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch knowledge recommendations" },
      { status: 500 },
    );
  }
}
