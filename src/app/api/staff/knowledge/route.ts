import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";
import { resolveStaffAuth } from "@/lib/staff/permissions";

export async function POST(request: Request) {
  const auth = await resolveStaffAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { staffId, departmentId } = auth;

  try {
    const body = (await request.json()) as {
      title: string;
      problemSummary: string;
      solutionSteps: string;
      considerations?: string;
      references?: string;
      categoryId?: string;
      subcategoryId?: string;
      sourceResolutionId?: string;
      status?: "DRAFT" | "PENDING_REVIEW";
    };

    const {
      title,
      problemSummary,
      solutionSteps,
      considerations,
      references,
      categoryId,
      subcategoryId,
      sourceResolutionId,
      status = "PENDING_REVIEW",
    } = body;

    if (!title?.trim() || !problemSummary?.trim() || !solutionSteps?.trim()) {
      return NextResponse.json(
        { success: false, message: "Article title, problem summary, and solution steps are required." },
        { status: 400 },
      );
    }

    // Format content as structured JSON object
    const structuredContent = JSON.stringify({
      problem: problemSummary.trim(),
      solutionSteps: solutionSteps.trim(),
      considerations: considerations?.trim() || null,
      references: references?.trim() || null,
    });

    const catId = categoryId ? BigInt(categoryId) : null;
    const subCatId = subcategoryId ? BigInt(subcategoryId) : null;
    const resId = sourceResolutionId ? BigInt(sourceResolutionId) : null;

    const article = await prisma.knowledge_articles.create({
      data: {
        title: title.trim(),
        content: structuredContent,
        category_id: catId,
        subcategory_id: subCatId,
        source_resolution_id: resId,
        created_by: staffId,
        status,
      },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        user_id: staffId,
        action: "KNOWLEDGE_ARTICLE_SUGGESTED",
        entity_type: "KNOWLEDGE_ARTICLE",
        entity_id: article.article_id,
        new_value: {
          title: title.trim(),
          status,
          categoryId,
          subcategoryId,
        },
      },
    });

    // Notify Department Head if submitted for review
    if (status === "PENDING_REVIEW" && departmentId) {
      const hod = await prisma.users.findFirst({
        where: {
          department_id: departmentId,
          roles: { role_name: "DEPARTMENT_HEAD" },
          status: "ACTIVE",
        },
        select: { user_id: true },
      });

      if (hod) {
        await NotificationService.send({
          userId: hod.user_id,
          type: "KNOWLEDGE_ARTICLE_SUBMITTED",
          title: `Knowledge Article Pending Review: ${title.trim()}`,
          message: `A staff member has submitted a new Knowledge Base article proposal "${title.trim()}" for your review.`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message:
        status === "PENDING_REVIEW"
          ? "Knowledge article submitted for Department Head review"
          : "Knowledge article draft saved",
      articleId: article.article_id.toString(),
    });
  } catch (error) {
    console.error("Error in POST /api/staff/knowledge:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create knowledge article" },
      { status: 500 },
    );
  }
}
