import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  MAX_ATTACHMENTS_PER_GRIEVANCE,
  validateUploadedFile,
} from "@/lib/attachments/file-validation";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_ROUTING_CONFIG } from "@/lib/constants/routing";
import { DEFAULT_SLA_DURATIONS_MINUTES } from "@/lib/constants/sla";
import {
  determineDepartmentRouting,
  populateGrievanceDepartments,
} from "@/lib/engines/routing-engine";
import { prisma } from "@/lib/prisma";
import { uploadToSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (user?.roles?.role_name !== "END_USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const categoryId = formData.get("categoryId") as string;
    const subcategoryId = formData.get("subcategoryId") as string;
    const titleFromForm = (formData.get("title") as string)?.trim();
    const descriptionFromForm = (formData.get("description") as string)?.trim();
    const _userPriority = (formData.get("priority") as string)?.trim();
    const impactFromForm = (formData.get("impact") as string)?.trim();
    const urgencyFromForm = (formData.get("urgency") as string)?.trim();
    const problemStatement =
      descriptionFromForm || (formData.get("problemStatement") as string) || "";
    const title =
      titleFromForm ||
      (problemStatement.length > 195
        ? problemStatement.substring(0, 195).trim()
        : problemStatement);
    const files = formData.getAll("files") as File[];

    if (files.length > MAX_ATTACHMENTS_PER_GRIEVANCE) {
      return NextResponse.json(
        {
          error: `A maximum of ${MAX_ATTACHMENTS_PER_GRIEVANCE} file attachments are allowed per grievance.`,
        },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (file && typeof file === "object" && "name" in file) {
        const check = validateUploadedFile(file.name, file.type, file.size);
        if (!check.valid) {
          return NextResponse.json({ error: check.error }, { status: 400 });
        }
      }
    }

    const cleanTitle = title.trim();
    const cleanDesc = problemStatement.trim();

    const isTitleOnlyDigits = /^\d+$/.test(cleanTitle.replace(/\s+/g, ""));
    const hasTitleLetters = /[a-zA-Z]/.test(cleanTitle);

    const isDescOnlyDigits = /^\d+$/.test(cleanDesc.replace(/\s+/g, ""));
    const hasDescLetters = /[a-zA-Z]/.test(cleanDesc);

    if (!categoryId || !subcategoryId) {
      return NextResponse.json(
        { error: "Category and Subcategory are mandatory." },
        { status: 400 },
      );
    }

    if (cleanTitle.length < 20) {
      return NextResponse.json(
        {
          error: `Title must be at least 20 characters long (currently ${cleanTitle.length}).`,
        },
        { status: 400 },
      );
    }

    if (!hasTitleLetters || isTitleOnlyDigits) {
      return NextResponse.json(
        {
          error:
            "Title must contain letters/words and cannot consist only of digits or numbers.",
        },
        { status: 400 },
      );
    }

    if (cleanDesc.length < 100) {
      return NextResponse.json(
        {
          error: `Description must be at least 100 characters long (currently ${cleanDesc.length}).`,
        },
        { status: 400 },
      );
    }

    if (!hasDescLetters || isDescOnlyDigits) {
      return NextResponse.json(
        {
          error:
            "Description must contain letters/words and cannot consist only of digits or numbers.",
        },
        { status: 400 },
      );
    }

    // Generate unique grievance number based on the latest grievance id
    const year = new Date().getFullYear();
    const prefix = `GRS-${year}-`;

    // Fetch the most recently created grievance by grievance_id (auto-increment primary key)
    const latestGrievance = await prisma.grievances.findFirst({
      orderBy: {
        grievance_id: "desc",
      },
      select: {
        grievance_id: true,
        grievance_number: true,
      },
    });

    let nextSeq = 1;
    if (latestGrievance) {
      const parts = latestGrievance.grievance_number?.split("-") || [];
      const lastNum = parseInt(parts[parts.length - 1], 10);
      const idNum = Number(latestGrievance.grievance_id);

      const highestExisting = Math.max(
        !Number.isNaN(lastNum) ? lastNum : 0,
        !Number.isNaN(idNum) ? idNum : 0,
      );
      nextSeq = highestExisting + 1;
    }

    let grievanceNumber = "";
    let candidateSeq = nextSeq;
    while (!grievanceNumber) {
      const candidateNumber = `${prefix}${String(candidateSeq).padStart(4, "0")}`;
      const existing = await prisma.grievances.findUnique({
        where: { grievance_number: candidateNumber },
        select: { grievance_id: true },
      });
      if (!existing) {
        grievanceNumber = candidateNumber;
      } else {
        candidateSeq++;
      }
    }

    // Apply Routing Rules via centralized routing engine
    const routingResult = await determineDepartmentRouting({
      categoryId,
      subcategoryId,
    });

    // Resolve category and subcategory names for priority matching
    const subcategoryRecord = await prisma.subcategories.findUnique({
      where: { subcategory_id: BigInt(subcategoryId) },
      include: { categories: true },
    });

    // Apply Priority Rules (Calculated strictly on the server)
    const { determinePriority } = await import("@/lib/engines/priority-engine");
    const priorityResult = await determinePriority({
      categoryId: categoryId,
      categoryName: subcategoryRecord?.categories?.category_name,
      subcategoryId: subcategoryId,
      subcategoryName: subcategoryRecord?.subcategory_name,
      title: title,
      description: problemStatement,
      impact: impactFromForm,
      urgency: urgencyFromForm,
    });

    const priorityLevel = priorityResult.priority;

    // Lookup active SLA Policy based on priority
    const slaPolicy = await prisma.sla_policies.findFirst({
      where: {
        priority_level: priorityLevel,
        status: "ACTIVE",
      },
    });

    const targetMinutes =
      slaPolicy?.target_duration_minutes ||
      DEFAULT_SLA_DURATIONS_MINUTES[priorityLevel] ||
      DEFAULT_ROUTING_CONFIG.FALLBACK_DURATION_MINUTES;
    const now = new Date();
    const dueAt = new Date(now.getTime() + targetMinutes * 60 * 1000);

    const isAutoRouted = Boolean(routingResult);
    const initialStatus = isAutoRouted ? "ROUTED" : "SUBMITTED";

    // Create the grievance with status ROUTED (if rule matched) or SUBMITTED (if manual routing needed), priority, calculated due_at, and sla_status
    let newGrievance: Awaited<
      ReturnType<typeof prisma.grievances.create>
    > | null = null;
    let createAttempts = 0;
    while (!newGrievance && createAttempts < 5) {
      try {
        newGrievance = await prisma.grievances.create({
          data: {
            grievance_number: grievanceNumber,
            category_id: BigInt(categoryId),
            subcategory_id: BigInt(subcategoryId),
            title: title,
            description: problemStatement,
            status: initialStatus,
            priority: priorityLevel,
            priority_rule_id: priorityResult.priorityRuleId,
            due_at: dueAt,
            sla_status: "ON_TRACK",
            submitted_by: user.user_id,
          },
        });
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          err.code === "P2002" &&
          createAttempts < 4
        ) {
          candidateSeq++;
          grievanceNumber = `${prefix}${String(candidateSeq).padStart(4, "0")}`;
          createAttempts++;
        } else {
          throw err;
        }
      }
    }

    if (!newGrievance) {
      throw new Error("Failed to create grievance after multiple attempts.");
    }

    // Initialize SLA tracking record
    if (slaPolicy) {
      await prisma.sla_tracking.create({
        data: {
          grievance_id: newGrievance.grievance_id,
          sla_policy_id: slaPolicy.sla_policy_id,
          cycle_number: 1,
          started_at: now,
          due_at: dueAt,
          status: "ON_TRACK",
        },
      });
    }

    // Notify the End User of successful submission
    const { NotificationService } = await import(
      "@/lib/services/notification.service"
    );
    await NotificationService.send({
      userId: user.user_id,
      grievanceId: newGrievance.grievance_id,
      type: "GRIEVANCE_SUBMITTED",
      title: "Grievance Submitted Successfully",
      message: `Your grievance ${newGrievance.grievance_number} has been submitted successfully and is being processed.`,
    });

    // If there is an active routing rule match with an active department, assign it
    if (routingResult) {
      const popResult = await populateGrievanceDepartments(
        newGrievance.grievance_id,
        routingResult,
        prisma,
      );

      // Log SUBMITTED and ROUTED in status history
      await prisma.grievance_status_history.create({
        data: {
          grievance_id: newGrievance.grievance_id,
          old_status: null,
          new_status: "SUBMITTED",
          changed_by: user.user_id,
          remarks: "Grievance submitted by complainant",
        },
      });

      await prisma.grievance_status_history.create({
        data: {
          grievance_id: newGrievance.grievance_id,
          old_status: "SUBMITTED",
          new_status: "ROUTED",
          changed_by: user.user_id,
          remarks: `Auto-routed to ${routingResult.departmentName || "Primary Department"}`,
        },
      });

      // Send initial assignment notifications ONLY to departments eligible to start (excluding blocked)
      const departmentIdsToNotify = new Set<bigint>(
        popResult.activatedDeptIds || [],
      );

      // Notify department heads
      if (departmentIdsToNotify.size > 0) {
        const departmentHeads = await prisma.users.findMany({
          where: {
            department_id: { in: Array.from(departmentIdsToNotify) },
            roles: { role_name: { in: ["DEPARTMENT_HEAD", "ADMIN"] } },
            status: "ACTIVE",
          },
        });

        for (const head of departmentHeads) {
          await NotificationService.send({
            userId: head.user_id,
            grievanceId: newGrievance.grievance_id,
            type: "NEW_ASSIGNMENT",
            title: "New Grievance Assigned",
            message: `Grievance ${newGrievance.grievance_number} has been routed to your department for review.`,
          });
        }
      }
    } else {
      // Manual Routing Fallback
      // Ensure status is explicitly SUBMITTED if not already
      if (newGrievance.status !== "SUBMITTED") {
        await prisma.grievances.update({
          where: { grievance_id: newGrievance.grievance_id },
          data: { status: "SUBMITTED" },
        });
      }

      await prisma.grievance_status_history.create({
        data: {
          grievance_id: newGrievance.grievance_id,
          old_status: null,
          new_status: "SUBMITTED",
          changed_by: user.user_id,
          remarks:
            "Grievance submitted by complainant (Pending manual routing)",
        },
      });

      // Record audit log for manual routing exception
      await prisma.audit_logs.create({
        data: {
          user_id: user.user_id,
          grievance_id: newGrievance.grievance_id,
          action: "ROUTING_EXCEPTION",
          entity_type: "GRIEVANCE",
          entity_id: newGrievance.grievance_id,
          new_value: {
            reason:
              "No active automated routing rule matched. Placed in Admin Manual Routing Queue.",
            stage: "SUBMITTED",
          },
        },
      });

      // Notify all active Admins that a grievance needs manual routing
      const admins = await prisma.users.findMany({
        where: {
          roles: { role_name: { in: ["ADMIN", "SUPER_ADMIN"] } },
          status: "ACTIVE",
        },
      });

      for (const admin of admins) {
        await NotificationService.send({
          userId: admin.user_id,
          grievanceId: newGrievance.grievance_id,
          type: "ROUTING_EXCEPTION",
          channel: "IN_APP",
          title: `Manual Routing Required: ${newGrievance.grievance_number}`,
          message: `Grievance ${newGrievance.grievance_number} (${newGrievance.title}) matched no automated routing rule and requires manual department assignment.`,
        });
      }
    }

    // Handle File Uploads to Supabase Storage with Intelligent Department Visibility Classification
    if (files && files.length > 0) {
      const participatingDepts = await prisma.grievance_departments.findMany({
        where: { grievance_id: newGrievance.grievance_id },
        include: { departments: true },
      });

      const participatingDeptProfiles = participatingDepts.map((gd) => ({
        department_id: gd.department_id,
        department_name: gd.departments.department_name,
        involvement_type: gd.involvement_type,
      }));

      const categoryRec = categoryId
        ? await prisma.categories.findUnique({
            where: { category_id: BigInt(categoryId) },
          })
        : null;
      const subcategoryRec = subcategoryId
        ? await prisma.subcategories.findUnique({
            where: { subcategory_id: BigInt(subcategoryId) },
          })
        : null;

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const storagePath = `grievances/${newGrievance.grievance_number}/${Date.now()}-${sanitizedName}`;

        const uploadResult = await uploadToSupabase(
          storagePath,
          buffer,
          file.type,
        );

        // 1. Extract real text from file buffer (PDF, text, CSV, etc.)
        let extractedText = "";
        try {
          const { extractTextFromFileBuffer } = await import(
            "@/lib/attachments/text-extractor"
          );
          extractedText = await extractTextFromFileBuffer(
            buffer,
            file.type,
            file.name,
          );
        } catch {
          extractedText = "";
        }

        const newAttachment = await prisma.attachments.create({
          data: {
            grievance_id: newGrievance.grievance_id,
            file_name: file.name,
            file_path: uploadResult.path,
            file_type: file.type,
            file_size: BigInt(file.size),
            uploaded_by: user.user_id,
          },
        });

        // 2. Classify document using real extracted text and create department grants
        if (participatingDeptProfiles.length > 1) {
          try {
            const { classifyAttachmentForDepartments } = await import(
              "@/lib/attachments/document-classifier"
            );
            const classification = classifyAttachmentForDepartments({
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              textContent: extractedText,
              categoryName: categoryRec?.category_name,
              subcategoryName: subcategoryRec?.subcategory_name,
              grievanceTitle: newGrievance.title,
              grievanceDescription: newGrievance.description,
              participatingDepartments: participatingDeptProfiles,
            });

            // Automatically grant access to target supporting departments
            for (const deptId of classification.targetDepartmentIds) {
              const matchedDept = participatingDepts.find(
                (d) => BigInt(d.department_id) === BigInt(deptId),
              );
              // Only create explicit grant if department is SUPPORTING (Primary already has full default access)
              if (
                matchedDept &&
                matchedDept.involvement_type === "SUPPORTING"
              ) {
                try {
                  await prisma.attachment_department_grants.create({
                    data: {
                      attachment_id: newAttachment.attachment_id,
                      department_id: BigInt(deptId),
                      granted_by: user.user_id,
                    },
                  });
                } catch {
                  // Fallback safely if attachment_department_grants table is not yet migrated
                }
              }
            }
          } catch (classifyErr) {
            console.warn(
              "Intelligent document classification failed:",
              classifyErr,
            );
          }
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        grievance_id: newGrievance.grievance_id.toString(),
        grievance_number: newGrievance.grievance_number,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Error submitting grievance:", error);
    const errMessage =
      error instanceof Error ? error.message : "Failed to submit grievance";
    const errStack = error instanceof Error ? error.stack : String(error);

    try {
      await fs.writeFile(
        path.join(process.cwd(), "error.log"),
        String(errStack || error),
      );
    } catch (_e) {}
    return NextResponse.json(
      { error: "Failed to submit grievance", details: errMessage },
      { status: 500 },
    );
  }
}
