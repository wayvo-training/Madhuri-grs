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
      category?: string;
      subcategory?: string;
      problemSummary?: string;
      problem?: string;
      solutionSteps?: string;
      resolution?: string;
      considerations?: string;
      keyPoints?: string;
      references?: string;
      categoryId?: string;
      subcategoryId?: string;
      sourceResolutionId?: string;
      grievanceId?: string;
      status?: "DRAFT" | "PENDING_REVIEW";
      duplicateJustification?: string;
      duplicateCheckResult?: unknown;
    };

    const {
      title,
      category,
      subcategory,
      problemSummary,
      problem,
      solutionSteps,
      resolution,
      considerations,
      keyPoints,
      references,
      categoryId,
      subcategoryId,
      sourceResolutionId,
      grievanceId,
      status = "PENDING_REVIEW",
      duplicateJustification,
      duplicateCheckResult,
    } = body;

    const finalProblem = (problemSummary || problem || "").trim();
    const finalResolution = (solutionSteps || resolution || "").trim();
    const finalKeyPoints = (keyPoints || considerations || "").trim();

    if (!title?.trim() || !finalProblem || !finalResolution) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Article title, problem / scenario, and resolution / recommended approach are required.",
        },
        { status: 400 },
      );
    }

    // Safely resolve category and subcategory IDs with verification
    let catId: bigint | null = null;
    let subCatId: bigint | null = null;

    if (categoryId) {
      try {
        const parsed = BigInt(categoryId);
        const exists = await prisma.categories.findUnique({
          where: { category_id: parsed },
          select: { category_id: true },
        });
        if (exists) catId = parsed;
      } catch {
        catId = null;
      }
    }

    if (!catId && category?.trim()) {
      try {
        const matchedCat = await prisma.categories.findFirst({
          where: {
            category_name: { equals: category.trim(), mode: "insensitive" },
          },
          select: { category_id: true },
        });
        if (matchedCat) catId = matchedCat.category_id;
      } catch {
        // Fallback without mode
        const matchedCat = await prisma.categories.findFirst({
          where: { category_name: category.trim() },
          select: { category_id: true },
        });
        if (matchedCat) catId = matchedCat.category_id;
      }
    }

    if (subcategoryId) {
      try {
        const parsed = BigInt(subcategoryId);
        const exists = await prisma.subcategories.findUnique({
          where: { subcategory_id: parsed },
          select: { subcategory_id: true },
        });
        if (exists) subCatId = parsed;
      } catch {
        subCatId = null;
      }
    }

    if (!subCatId && subcategory?.trim()) {
      try {
        const matchedSub = await prisma.subcategories.findFirst({
          where: {
            subcategory_name: {
              equals: subcategory.trim(),
              mode: "insensitive",
            },
          },
          select: { subcategory_id: true },
        });
        if (matchedSub) subCatId = matchedSub.subcategory_id;
      } catch {
        // Fallback without mode
        const matchedSub = await prisma.subcategories.findFirst({
          where: { subcategory_name: subcategory.trim() },
          select: { subcategory_id: true },
        });
        if (matchedSub) subCatId = matchedSub.subcategory_id;
      }
    }

    // Safely verify resolution exists to avoid foreign key errors
    let resId: bigint | null = null;
    if (sourceResolutionId) {
      try {
        const parsed = BigInt(sourceResolutionId);
        const exists = await prisma.resolutions.findUnique({
          where: { resolution_id: parsed },
          select: { resolution_id: true },
        });
        if (exists) resId = parsed;
      } catch {
        resId = null;
      }
    }

    let gId: bigint | null = null;
    if (grievanceId) {
      try {
        gId = BigInt(grievanceId);
      } catch {
        gId = null;
      }
    }

    // If source resolution not explicitly passed, find latest resolution for this grievance
    if (!resId && gId) {
      try {
        const latestRes = await prisma.resolutions.findFirst({
          where: { grievance_id: gId },
          orderBy: { submitted_at: "desc" },
          select: { resolution_id: true },
        });
        if (latestRes) resId = latestRes.resolution_id;
      } catch {
        // ignore
      }
    } else if (!gId && resId) {
      try {
        const resObj = await prisma.resolutions.findUnique({
          where: { resolution_id: resId },
          select: { grievance_id: true },
        });
        if (resObj) gId = resObj.grievance_id;
      } catch {
        // ignore
      }
    }

    // Format content as structured JSON
    const structuredContent = JSON.stringify({
      problem: finalProblem,
      resolution: finalResolution,
      solutionSteps: finalResolution, // backwards compatibility
      keyPoints: finalKeyPoints || null,
      considerations: finalKeyPoints || null, // backwards compatibility
      references: references?.trim() || null,
      duplicateJustification: duplicateJustification?.trim() || null,
      duplicateCheck: duplicateCheckResult || null,
    });

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

    // Safely log audit entry
    try {
      await prisma.audit_logs.create({
        data: {
          user_id: staffId,
          grievance_id: gId,
          action: "KNOWLEDGE_ARTICLE_SUGGESTED",
          entity_type: "KNOWLEDGE_ARTICLE",
          entity_id: article.article_id,
          new_value: {
            title: title.trim(),
            status,
            categoryId: catId?.toString(),
            subcategoryId: subCatId?.toString(),
          },
        },
      });
    } catch (auditErr) {
      console.error(
        "Non-fatal: Failed to write audit log for knowledge article:",
        auditErr,
      );
    }

    // Safely notify Department Head AND Proposed Person if submitted for review
    if (status === "PENDING_REVIEW") {
      try {
        // 1. Notify the person who proposed the knowledge article
        await NotificationService.send({
          userId: staffId,
          grievanceId: gId || undefined,
          type: "KNOWLEDGE_ARTICLE_SUBMITTED",
          title: `Knowledge Article Proposed: ${title.trim()}`,
          message: `Your Knowledge Base article proposal "${title.trim()}" has been submitted for Department Head review.`,
        });

        // 2. Notify Department Head(s)
        let targetDeptId = departmentId;
        if (!targetDeptId && gId) {
          const gDept = await prisma.grievance_departments.findFirst({
            where: { grievance_id: gId },
            select: { department_id: true },
          });
          targetDeptId = gDept?.department_id || null;
        }

        if (!targetDeptId) {
          const staffUser = await prisma.users.findUnique({
            where: { user_id: staffId },
            select: { department_id: true },
          });
          targetDeptId = staffUser?.department_id || null;
        }

        if (targetDeptId) {
          const hods = await prisma.users.findMany({
            where: {
              department_id: targetDeptId,
              roles: { role_name: { in: ["DEPARTMENT_HEAD", "ADMIN"] } },
              status: "ACTIVE",
            },
            select: { user_id: true },
          });

          for (const hod of hods) {
            // Avoid duplicate notification if proposing person is already this HOD
            if (hod.user_id !== staffId) {
              await NotificationService.send({
                userId: hod.user_id,
                grievanceId: gId || undefined,
                type: "KNOWLEDGE_ARTICLE_SUBMITTED",
                title: `Knowledge Article Pending Review: ${title.trim()}`,
                message: `A Knowledge Base article proposal "${title.trim()}" has been submitted for your review.`,
              });
            }
          }
        }
      } catch (notifyErr) {
        console.error(
          "Non-fatal: Failed to send knowledge article notification:",
          notifyErr,
        );
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
    const errorDetails =
      error instanceof Error
        ? error.message
        : "Failed to create knowledge article";
    return NextResponse.json(
      { success: false, message: errorDetails },
      { status: 500 },
    );
  }
}
