import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_SLA_DURATIONS_MINUTES } from "@/lib/constants/sla";
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
    const userPriority = (formData.get("priority") as string)?.trim();
    const problemStatement =
      descriptionFromForm || (formData.get("problemStatement") as string) || "";
    const title =
      titleFromForm ||
      (problemStatement.length > 50
        ? `${problemStatement.substring(0, 50)}...`
        : problemStatement);
    const files = formData.getAll("files") as File[];

    if (
      !categoryId ||
      !subcategoryId ||
      !title ||
      !problemStatement ||
      problemStatement.trim().length < 5
    ) {
      return NextResponse.json(
        {
          error: "Category, Subcategory, Title, and Description are mandatory.",
        },
        { status: 400 },
      );
    }

    // Generate unique grievance number
    const year = new Date().getFullYear();
    // find count of grievances to generate sequence number
    const count = await prisma.grievances.count();
    const seq = String(count + 1).padStart(4, "0");
    const grievanceNumber = `GRS-${year}-${seq}`;

    // Apply Routing Rules
    let activeRule = await prisma.routing_rules.findFirst({
      where: {
        category_id: BigInt(categoryId),
        subcategory_id: BigInt(subcategoryId),
        status: "ACTIVE",
      },
    });

    if (!activeRule) {
      activeRule = await prisma.routing_rules.findFirst({
        where: {
          category_id: BigInt(categoryId),
          subcategory_id: null,
          status: "ACTIVE",
        },
      });
    }

    if (!activeRule) {
      activeRule = await prisma.routing_rules.findFirst({
        where: {
          category_id: null,
          subcategory_id: null,
          status: "ACTIVE",
        },
      });
    }

    // Resolve category and subcategory names for priority matching
    const subcategoryRecord = await prisma.subcategories.findUnique({
      where: { subcategory_id: BigInt(subcategoryId) },
      include: { categories: true },
    });

    // Apply Priority Rules
    const { determinePriority } = await import("@/lib/engines/priority-engine");
    const priorityResult = await determinePriority({
      categoryId: categoryId,
      categoryName: subcategoryRecord?.categories?.category_name,
      subcategoryId: subcategoryId,
      subcategoryName: subcategoryRecord?.subcategory_name,
      title: title,
      description: problemStatement,
    });

    const priorityLevel =
      priorityResult.isDefault &&
      userPriority &&
      ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(userPriority.toUpperCase())
        ? userPriority.toUpperCase()
        : priorityResult.priority || "MEDIUM";

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
      2880;
    const now = new Date();
    const dueAt = new Date(now.getTime() + targetMinutes * 60 * 1000);

    const isAutoRouted = Boolean(activeRule?.department_id);
    const initialStatus = isAutoRouted ? "ROUTED" : "SUBMITTED";

    // Create the grievance with status ROUTED (if rule matched) or SUBMITTED (if manual routing needed), priority, calculated due_at, and sla_status
    const newGrievance = await prisma.grievances.create({
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

    // 1. Resolve primary department if routing rule exists
    let primaryDept = null;
    if (activeRule?.department_id) {
      primaryDept = await prisma.departments.findFirst({
        where: {
          department_id: activeRule.department_id,
          status: "ACTIVE",
        },
      });
    }

    // If there is an active routing rule and active department, assign it
    if (activeRule && primaryDept) {
      const mainInvolvement =
        (activeRule.involvement_type as "PRIMARY" | "SUPPORTING" | "EQUAL") ||
        "PRIMARY";
      const supportingInvolvement =
        mainInvolvement === "EQUAL" ? "EQUAL" : "SUPPORTING";

      await prisma.grievance_departments.create({
        data: {
          grievance_id: newGrievance.grievance_id,
          department_id: primaryDept.department_id,
          involvement_type: mainInvolvement,
          status: "ASSIGNED",
        },
      });

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
          remarks: `Auto-routed to ${primaryDept.department_name}`,
        },
      });

      const departmentIdsToNotify = new Set<bigint>();
      departmentIdsToNotify.add(primaryDept.department_id);

      // Also attach supporting or co-equal departments:
      if (
        activeRule.supporting_departments &&
        Array.isArray(activeRule.supporting_departments)
      ) {
        for (const suppName of activeRule.supporting_departments) {
          const suppDept = await prisma.departments.findFirst({
            where: {
              department_name: suppName as string,
              status: "ACTIVE",
            },
          });

          if (suppDept) {
            await prisma.grievance_departments.create({
              data: {
                grievance_id: newGrievance.grievance_id,
                department_id: suppDept.department_id,
                involvement_type: supportingInvolvement,
                status: "PENDING_ASSIGNMENT",
              },
            });
            departmentIdsToNotify.add(suppDept.department_id);
          }
        }
      }

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

    // Handle File Uploads to Supabase Storage
    if (files && files.length > 0) {
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

        await prisma.attachments.create({
          data: {
            grievance_id: newGrievance.grievance_id,
            file_name: file.name,
            file_path: uploadResult.publicUrl || uploadResult.path,
            file_type: file.type,
            file_size: BigInt(file.size),
            uploaded_by: user.user_id,
          },
        });
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
