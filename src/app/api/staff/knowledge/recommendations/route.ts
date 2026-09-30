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

  try {
    const catId = categoryIdParam ? BigInt(categoryIdParam) : null;
    const subCatId = subcategoryIdParam ? BigInt(subcategoryIdParam) : null;

    // Find only PUBLISHED knowledge articles matching category or subcategory
    const articles = await prisma.knowledge_articles.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          ...(catId ? [{ category_id: catId }] : []),
          ...(subCatId ? [{ subcategory_id: subCatId }] : []),
        ],
      },
      include: {
        categories: { select: { category_name: true } },
        subcategories: { select: { subcategory_name: true } },
      },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    const result = articles.map((art) => {
      let parsedContent: {
        problem?: string;
        solutionSteps?: string;
        considerations?: string;
        references?: string;
      } = {};

      try {
        parsedContent = JSON.parse(art.content);
      } catch {
        parsedContent = { solutionSteps: art.content };
      }

      return {
        id: art.article_id.toString(),
        title: art.title,
        problem: parsedContent.problem || "",
        solutionSteps: parsedContent.solutionSteps || "",
        considerations: parsedContent.considerations || null,
        references: parsedContent.references || null,
        category: art.categories?.category_name || "General",
        subcategory: art.subcategories?.subcategory_name || "General",
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
