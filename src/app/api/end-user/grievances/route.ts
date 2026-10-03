import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.roles?.role_name !== "END_USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const categoryId = formData.get("categoryId") as string;
    const subcategoryId = formData.get("subcategoryId") as string;
    const problemStatement = formData.get("problemStatement") as string;
    const files = formData.getAll("files") as File[];

    if (!categoryId || !subcategoryId || !problemStatement) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    let assignedDepartmentId = null;
    const title = problemStatement.length > 50 ? problemStatement.substring(0, 50) + '...' : problemStatement;

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

    const priorityLevel = priorityResult.priority || "MEDIUM";

    // Lookup active SLA Policy based on priority
    const slaPolicy = await prisma.sla_policies.findFirst({
      where: {
        priority_level: priorityLevel,
        status: "ACTIVE",
      },
    });

    const DEFAULT_DURATIONS: Record<string, number> = {
      CRITICAL: 12 * 60, // 720 mins (12h)
      HIGH: 24 * 60, // 1440 mins (24h)
      MEDIUM: 48 * 60, // 2880 mins (48h)
      LOW: 72 * 60, // 4320 mins (72h)
    };

    const targetMinutes =
      slaPolicy?.target_duration_minutes ||
      DEFAULT_DURATIONS[priorityLevel] ||
      2880;
    const now = new Date();
    const dueAt = new Date(now.getTime() + targetMinutes * 60 * 1000);

    const isAutoRouted = Boolean(activeRule && activeRule.department_id);
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
    const { NotificationService } = await import("@/lib/services/notification.service");
    await NotificationService.send({
      userId: user.user_id,
      grievanceId: newGrievance.grievance_id,
      type: "GRIEVANCE_SUBMITTED",
      title: "Grievance Submitted Successfully",
      message: `Your grievance ${newGrievance.grievance_number} has been submitted successfully and is being processed.`,
    });

    // If there is a routing rule, assign it to a department
    if (activeRule && activeRule.department_id) {
      await prisma.grievance_departments.create({
        data: {
          grievance_id: newGrievance.grievance_id,
          department_id: activeRule.department_id,
          involvement_type: "PRIMARY",
          status: "ASSIGNED",
        }
      });
      const departmentIdsToNotify = new Set<bigint>();
      departmentIdsToNotify.add(activeRule.department_id);

      // also if multiple support departments exist:
      if (activeRule.supporting_departments && Array.isArray(activeRule.supporting_departments)) {
        for (const suppName of activeRule.supporting_departments) {
          const suppDept = await prisma.departments.findFirst({
            where: { department_name: suppName as string },
          });

          if (suppDept) {
            await prisma.grievance_departments.create({
              data: {
                grievance_id: newGrievance.grievance_id,
                department_id: suppDept.department_id,
                involvement_type: "SUPPORTING",
                status: "PENDING_ASSIGNMENT",
              }
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
      // Notify all active Admins that a grievance needs manual routing
      const admins = await prisma.users.findMany({
        where: {
          roles: { role_name: "ADMIN" },
          status: "ACTIVE",
        },
      });

      for (const admin of admins) {
        await NotificationService.send({
          userId: admin.user_id,
          grievanceId: newGrievance.grievance_id,
          type: "ROUTING_EXCEPTION",
          title: "Manual Routing Required",
          message: `Grievance ${newGrievance.grievance_number} matched no active routing rules and requires manual routing.`,
        });
      }
    }

    // Handle File Uploads
    if (files && files.length > 0) {
      const uploadDir = path.join(process.cwd(), "public/uploads/grievances");
      await fs.mkdir(uploadDir, { recursive: true });

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `${newGrievance.grievance_number}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filePath = path.join(uploadDir, fileName);
        
        await fs.writeFile(filePath, buffer);

        await prisma.attachments.create({
          data: {
            grievance_id: newGrievance.grievance_id,
            file_name: file.name,
            file_path: `/uploads/grievances/${fileName}`,
            file_type: file.type,
            file_size: BigInt(file.size),
            uploaded_by: user.user_id,
          }
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        grievance_id: newGrievance.grievance_id.toString(),
        grievance_number: newGrievance.grievance_number,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error submitting grievance:", error);
    try {
      await fs.writeFile(path.join(process.cwd(), "error.log"), String(error.stack || error));
    } catch (e) {}
    return NextResponse.json(
      { error: "Failed to submit grievance", details: error.message },
      { status: 500 }
    );
  }
}
