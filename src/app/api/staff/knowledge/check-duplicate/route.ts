import { NextResponse } from "next/server";
import { KnowledgeSimilarityService } from "@/lib/knowledge/similarity-service";
import { resolveStaffAuth } from "@/lib/staff/permissions";

export async function POST(request: Request) {
  const auth = await resolveStaffAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      problem?: string;
      problemSummary?: string;
      resolution?: string;
      solutionSteps?: string;
      categoryId?: string | null;
      subcategoryId?: string | null;
      category?: string | null;
      subcategory?: string | null;
      excludeArticleId?: string | null;
    };

    const title = (body.title || "").trim();
    const problem = (body.problemSummary || body.problem || "").trim();
    const resolution = (body.solutionSteps || body.resolution || "").trim();

    const result = await KnowledgeSimilarityService.checkDuplicates({
      title,
      problem,
      resolution,
      categoryId: body.categoryId,
      subcategoryId: body.subcategoryId,
      categoryName: body.category,
      subcategoryName: body.subcategory,
      excludeArticleId: body.excludeArticleId,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in POST /api/staff/knowledge/check-duplicate:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to perform knowledge duplicate check";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
