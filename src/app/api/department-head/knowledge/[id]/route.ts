import { NextResponse } from "next/server";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await resolveDepartmentHeadAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const hodId = auth.user.user_id;
  const { id } = await params;

  try {
    const articleId = BigInt(id);

    const body = (await request.json()) as {
      action: "PUBLISH" | "REJECT";
      rejectionReason?: string;
    };

    const { action, rejectionReason } = body;

    if (!action || (action !== "PUBLISH" && action !== "REJECT")) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid action ('PUBLISH' or 'REJECT') is required",
        },
        { status: 400 },
      );
    }

    if (action === "REJECT" && !rejectionReason?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Rejection reason is required when rejecting an article",
        },
        { status: 400 },
      );
    }

    const existingArticle = await prisma.knowledge_articles.findUnique({
      where: { article_id: articleId },
      include: {
        users: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            department_id: true,
            departments: {
              select: {
                department_id: true,
                department_name: true,
              },
            },
          },
        },
        resolutions: {
          select: {
            resolution_id: true,
            submitted_by: true,
            users: {
              select: {
                department_id: true,
                departments: {
                  select: {
                    department_id: true,
                    department_name: true,
                  },
                },
              },
            },
            grievances: {
              select: {
                grievance_id: true,
                grievance_departments: {
                  select: {
                    department_id: true,
                    departments: {
                      select: {
                        department_id: true,
                        department_name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        categories: {
          select: {
            category_id: true,
            routing_rules: {
              where: { status: "ACTIVE" },
              select: {
                department_id: true,
                departments: {
                  select: {
                    department_id: true,
                    department_name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { success: false, message: "Knowledge article record not found" },
        { status: 404 },
      );
    }

    // Determine the article's respective department(s)
    const allDepartmentIds = new Set<bigint>();
    let primaryDeptName = "";

    // 1. From source grievance departments (if linked to a grievance resolution)
    const gDept =
      existingArticle.resolutions?.grievances?.grievance_departments;
    if (gDept) {
      allDepartmentIds.add(gDept.department_id);
      if (!primaryDeptName) {
        primaryDeptName = gDept.departments?.department_name || "";
      }
    }

    // 2. From author's department
    if (existingArticle.users?.department_id) {
      allDepartmentIds.add(existingArticle.users.department_id);
      if (!primaryDeptName) {
        primaryDeptName =
          existingArticle.users.departments?.department_name || "";
      }
    }

    // 3. From resolution submitter's department
    if (existingArticle.resolutions?.users?.department_id) {
      allDepartmentIds.add(existingArticle.resolutions.users.department_id);
      if (!primaryDeptName) {
        primaryDeptName =
          existingArticle.resolutions.users.departments?.department_name || "";
      }
    }

    // 4. From category routing rules
    const routingRules = existingArticle.categories?.routing_rules;
    if (routingRules && routingRules.length > 0) {
      for (const rr of routingRules) {
        allDepartmentIds.add(rr.department_id);
        if (!primaryDeptName) {
          primaryDeptName = rr.departments?.department_name || "";
        }
      }
    }

    // Strict authority check: Only respective Department Head (or Admin) can publish or reject
    if (!auth.isAdmin) {
      const isRespectiveHead =
        auth.departmentId && allDepartmentIds.has(auth.departmentId);

      if (!isRespectiveHead) {
        return NextResponse.json(
          {
            success: false,
            message: `Forbidden: Only the respective Department Head${
              primaryDeptName ? ` (${primaryDeptName})` : ""
            } has authority to publish or reject this knowledge article.`,
          },
          { status: 403 },
        );
      }
    }

    let parsedContent: Record<string, unknown> = {};
    try {
      parsedContent = JSON.parse(existingArticle.content);
    } catch {
      parsedContent = { solutionSteps: existingArticle.content };
    }

    const newStatus = action === "PUBLISH" ? "PUBLISHED" : "REJECTED";
    if (action === "REJECT" && rejectionReason) {
      parsedContent.rejectionReason = rejectionReason.trim();
    }

    const updatedArticle = await prisma.knowledge_articles.update({
      where: { article_id: articleId },
      data: {
        status: newStatus,
        content: JSON.stringify(parsedContent),
        updated_at: new Date(),
      },
    });

    // Log audit entry
    await prisma.audit_logs.create({
      data: {
        user_id: hodId,
        action:
          action === "PUBLISH"
            ? "KNOWLEDGE_ARTICLE_PUBLISHED"
            : "KNOWLEDGE_ARTICLE_REJECTED",
        entity_type: "KNOWLEDGE_ARTICLE",
        entity_id: articleId,
        new_value: {
          title: existingArticle.title,
          newStatus,
          rejectionReason: rejectionReason?.trim() || null,
          department: primaryDeptName || null,
        },
      },
    });

    // Notify authoring staff member
    await NotificationService.send({
      userId: existingArticle.created_by,
      type:
        action === "PUBLISH"
          ? "KNOWLEDGE_ARTICLE_PUBLISHED"
          : "KNOWLEDGE_ARTICLE_REJECTED",
      title:
        action === "PUBLISH"
          ? `Knowledge Article Published: ${existingArticle.title}`
          : `Knowledge Article Rejected: ${existingArticle.title}`,
      message:
        action === "PUBLISH"
          ? `Your proposed Knowledge Article "${existingArticle.title}" has been approved and published by your Department Head.`
          : `Your Knowledge Article proposal "${existingArticle.title}" has been rejected. Reason: ${rejectionReason?.trim()}`,
    });

    return NextResponse.json({
      success: true,
      message:
        action === "PUBLISH"
          ? "Knowledge article approved and published successfully"
          : "Knowledge article rejected with feedback",
      articleId: updatedArticle.article_id.toString(),
      status: newStatus,
    });
  } catch (error) {
    console.error("Error in PATCH /api/department-head/knowledge/[id]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update knowledge article" },
      { status: 500 },
    );
  }
}
