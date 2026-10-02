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
    const activeRule = await prisma.routing_rules.findFirst({
      where: {
        category_id: BigInt(categoryId),
        subcategory_id: BigInt(subcategoryId),
        status: "ACTIVE",
      },
    });

    let assignedDepartmentId = null;
    const title = problemStatement.length > 50 ? problemStatement.substring(0, 50) + '...' : problemStatement;
    
    // Create the grievance first with status SUBMITTED
    const newGrievance = await prisma.grievances.create({
      data: {
        grievance_number: grievanceNumber,
        category_id: BigInt(categoryId),
        subcategory_id: BigInt(subcategoryId),
        title: title,
        description: problemStatement,
        status: "SUBMITTED", // Changed to SUBMITTED to satisfy Postgres check constraint
        priority: "MEDIUM",
        submitted_by: user.user_id,
      },
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
            roles: { role_name: "DEPARTMENT_HEAD" },
          },
        });

        for (const head of departmentHeads) {
          await prisma.notifications.create({
            data: {
              user_id: head.user_id,
              grievance_id: newGrievance.grievance_id,
              notification_type: "NEW_ASSIGNMENT",
              channel: "IN_APP",
              title: "New Grievance Assigned",
              message: `Grievance ${newGrievance.grievance_number} has been routed to your department for review.`,
              status: "PENDING",
            }
          });
        }
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
