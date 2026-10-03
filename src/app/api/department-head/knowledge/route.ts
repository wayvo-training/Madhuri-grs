import { NextResponse } from "next/server";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await resolveDepartmentHeadAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  try {
    const articles = await prisma.knowledge_articles.findMany({
      where: {
        ...(statusParam ? { status: statusParam } : {}),
      },
      include: {
        categories: { select: { category_name: true } },
        subcategories: { select: { subcategory_name: true } },
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            roles: { select: { role_name: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const result = articles.map((art) => {
      let parsedContent: {
        problem?: string;
        solutionSteps?: string;
        resolution?: string;
        considerations?: string;
        keyPoints?: string;
        references?: string;
        rejectionReason?: string;
      } = {};

      try {
        parsedContent = JSON.parse(art.content);
      } catch {
        parsedContent = { solutionSteps: art.content };
      }

      const creator = art.users;
      const creatorName = creator
        ? `${creator.first_name} ${creator.last_name || ""}`.trim()
        : "Staff Member";

      const resolutionText =
        parsedContent.resolution || parsedContent.solutionSteps || "";
      const keyPointsText =
        parsedContent.keyPoints || parsedContent.considerations || null;

      return {
        id: art.article_id.toString(),
        title: art.title,
        problem: parsedContent.problem || "",
        solutionSteps: resolutionText,
        resolution: resolutionText,
        considerations: keyPointsText,
        keyPoints: keyPointsText,
        references: parsedContent.references || null,
        rejectionReason: parsedContent.rejectionReason || null,
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
      };
    });

    return NextResponse.json({
      success: true,
      articles: result,
    });
  } catch (error) {
    console.error("Error in GET /api/department-head/knowledge:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch knowledge articles" },
      { status: 500 },
    );
  }
}
