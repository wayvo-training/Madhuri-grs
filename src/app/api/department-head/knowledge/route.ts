import { NextResponse } from "next/server";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import { KnowledgeSimilarityService } from "@/lib/knowledge/similarity-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await resolveDepartmentHeadAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { departmentId, isAdmin } = auth;
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  try {
    const articles = await prisma.knowledge_articles.findMany({
      where: {
        ...(statusParam ? { status: statusParam } : {}),
      },
      include: {
        categories: {
          select: {
            category_name: true,
            routing_rules: {
              where: { status: "ACTIVE" },
              select: {
                department_id: true,
                departments: {
                  select: { department_id: true, department_name: true },
                },
              },
            },
          },
        },
        subcategories: { select: { subcategory_name: true } },
        resolutions: {
          select: {
            problem_summary: true,
            action_taken: true,
            findings: true,
            users: {
              select: {
                department_id: true,
                departments: {
                  select: { department_id: true, department_name: true },
                },
              },
            },
            grievances: {
              select: {
                title: true,
                description: true,
                grievance_departments: {
                  select: {
                    department_id: true,
                    departments: {
                      select: { department_id: true, department_name: true },
                    },
                  },
                },
              },
            },
          },
        },
        users: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            department_id: true,
            departments: {
              select: { department_id: true, department_name: true },
            },
            roles: { select: { role_name: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const result = (
      await Promise.all(
        articles.map(async (art) => {
          let parsedContent: {
            problem?: string;
            solutionSteps?: string;
            resolution?: string;
            considerations?: string;
            keyPoints?: string;
            references?: string;
            rejectionReason?: string;
            duplicateJustification?: string;
            duplicateCheck?: {
              highestScore: number;
              highestClassification:
                | "LIKELY_DUPLICATE"
                | "SIMILAR"
                | "NO_SIGNIFICANT_MATCH";
              matchedArticleId?: string;
              matchedArticleTitle?: string;
              matchedArticleStatus?: string;
              problemSimilarity?: number;
              resolutionSimilarity?: number;
              titleSimilarity?: number;
              metadataScore?: number;
              candidates?: unknown[];
            };
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

          const problemText =
            parsedContent.problem?.trim() ||
            art.resolutions?.problem_summary?.trim() ||
            art.resolutions?.grievances?.description?.trim() ||
            art.resolutions?.grievances?.title?.trim() ||
            (parsedContent.solutionSteps
              ? `Standard redressal procedure and recurring pattern for ${art.title}.`
              : "");

          // Determine respective department(s)
          const allDepartmentIds = new Set<bigint>();
          let primaryDeptId: bigint | null = null;
          let primaryDeptName = "";

          // 1. From source grievance departments
          const gDept = art.resolutions?.grievances?.grievance_departments;
          if (gDept) {
            allDepartmentIds.add(gDept.department_id);
            if (!primaryDeptId) {
              primaryDeptId = gDept.department_id;
              primaryDeptName = gDept.departments?.department_name || "";
            }
          }

          // 2. From author's department
          if (art.users?.department_id) {
            allDepartmentIds.add(art.users.department_id);
            if (!primaryDeptId) {
              primaryDeptId = art.users.department_id;
              primaryDeptName = art.users.departments?.department_name || "";
            }
          }

          // 3. From resolution submitter's department
          if (art.resolutions?.users?.department_id) {
            allDepartmentIds.add(art.resolutions.users.department_id);
            if (!primaryDeptId) {
              primaryDeptId = art.resolutions.users.department_id;
              primaryDeptName =
                art.resolutions.users.departments?.department_name || "";
            }
          }

          // 4. From category routing rules
          const routingRules = art.categories?.routing_rules;
          if (routingRules && routingRules.length > 0) {
            for (const rr of routingRules) {
              allDepartmentIds.add(rr.department_id);
              if (!primaryDeptId) {
                primaryDeptId = rr.department_id;
                primaryDeptName = rr.departments?.department_name || "";
              }
            }
          }

          // Authority check for this user
          const canApprove =
            isAdmin ||
            (departmentId !== null && allDepartmentIds.has(departmentId));

          // Run or extract duplicate check for review decision support
          let duplicateCheck = parsedContent.duplicateCheck || null;
          if (
            !duplicateCheck &&
            art.status === "PENDING_REVIEW" &&
            art.category_id &&
            art.subcategory_id
          ) {
            try {
              const dupRes = await KnowledgeSimilarityService.checkDuplicates({
                title: art.title,
                problem: problemText,
                resolution: resolutionText,
                categoryId: art.category_id,
                subcategoryId: art.subcategory_id,
                excludeArticleId: art.article_id,
              });

              if (dupRes.highestMatch) {
                duplicateCheck = {
                  highestScore: dupRes.highestMatch.finalScore,
                  highestClassification: dupRes.highestClassification,
                  matchedArticleId: dupRes.highestMatch.articleId,
                  matchedArticleTitle: dupRes.highestMatch.articleTitle,
                  matchedArticleStatus: dupRes.highestMatch.status,
                  problemSimilarity: dupRes.highestMatch.problemSimilarity,
                  resolutionSimilarity:
                    dupRes.highestMatch.resolutionSimilarity,
                  titleSimilarity: dupRes.highestMatch.titleSimilarity,
                  metadataScore: dupRes.highestMatch.metadataScore,
                  candidates: dupRes.candidates,
                };
              } else {
                duplicateCheck = {
                  highestScore: 0,
                  highestClassification: "NO_SIGNIFICANT_MATCH",
                  candidates: [],
                };
              }
            } catch {
              // Non-fatal duplicate detection fallback
            }
          }

          return {
            id: art.article_id.toString(),
            title: art.title,
            problem: problemText,
            solutionSteps: resolutionText,
            resolution: resolutionText,
            considerations: keyPointsText,
            keyPoints: keyPointsText,
            references: parsedContent.references || null,
            rejectionReason: parsedContent.rejectionReason || null,
            duplicateJustification:
              parsedContent.duplicateJustification || null,
            duplicateCheck,
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
            departmentId: primaryDeptId ? primaryDeptId.toString() : null,
            departmentName: primaryDeptName || "General",
            canApprove,
          };
        }),
      )
    ).filter((art) => {
      // If reviewing pending items and user is not an Admin,
      // only show pending items belonging to their respective department
      if (statusParam === "PENDING_REVIEW" && !isAdmin) {
        return art.canApprove;
      }
      return true;
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
