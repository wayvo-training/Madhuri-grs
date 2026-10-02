import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const { id } = await props.params;
  const grievanceId = BigInt(id);

  try {
    const body = await request.json();
    const { department_id, supporting_department_ids } = body;

    if (!department_id) {
      return NextResponse.json(
        { success: false, message: "Target Primary department is required." },
        { status: 400 },
      );
    }

    const primaryDepartmentId = BigInt(department_id);

    // Verify primary department exists and is active
    const primaryDept = await prisma.departments.findUnique({
      where: { department_id: primaryDepartmentId },
    });

    if (primaryDept?.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Selected primary department not found or inactive.",
        },
        { status: 404 },
      );
    }

    // Process and validate supporting departments if provided
    let validSupportingDepts: {
      department_id: bigint;
      department_name: string;
    }[] = [];

    if (
      Array.isArray(supporting_department_ids) &&
      supporting_department_ids.length > 0
    ) {
      // Filter out empty entries and any that match the primary department ID
      const sanitizedSuppIds = [
        ...new Set(
          supporting_department_ids
            .filter(
              (suppId) =>
                suppId && String(suppId) !== String(primaryDepartmentId),
            )
            .map((suppId) => BigInt(suppId)),
        ),
      ];

      if (sanitizedSuppIds.length > 0) {
        validSupportingDepts = await prisma.departments.findMany({
          where: {
            department_id: { in: sanitizedSuppIds },
            status: "ACTIVE",
          },
          select: {
            department_id: true,
            department_name: true,
          },
        });

        if (validSupportingDepts.length !== sanitizedSuppIds.length) {
          return NextResponse.json(
            {
              success: false,
              message:
                "One or more selected supporting departments are invalid or inactive.",
            },
            { status: 400 },
          );
        }
      }
    }

    // Verify grievance exists
    const grievance = await prisma.grievances.findUnique({
      where: { grievance_id: grievanceId },
    });

    if (!grievance) {
      return NextResponse.json(
        { success: false, message: "Grievance record not found." },
        { status: 404 },
      );
    }

    if (grievance.status === "CLOSED") {
      return NextResponse.json(
        { success: false, message: "Cannot route a closed grievance." },
        { status: 400 },
      );
    }

    // Perform database transaction for manual routing exception
    await prisma.$transaction(async (tx) => {
      // 1. Handle primary department assignment
      const existingPrimary = await tx.grievance_departments.findFirst({
        where: {
          grievance_id: grievanceId,
          involvement_type: "PRIMARY",
        },
      });

      if (existingPrimary) {
        await tx.grievance_departments.update({
          where: {
            grievance_department_id: existingPrimary.grievance_department_id,
          },
          data: {
            department_id: primaryDepartmentId,
            involvement_type: "PRIMARY",
            status: "PENDING_ASSIGNMENT",
            assigned_at: new Date(),
          },
        });
      } else {
        await tx.grievance_departments.create({
          data: {
            grievance_id: grievanceId,
            department_id: primaryDepartmentId,
            involvement_type: "PRIMARY",
            status: "PENDING_ASSIGNMENT",
            assigned_at: new Date(),
          },
        });
      }

      // 2. Clear old SUPPORTING entries for this ticket
      await tx.grievance_departments.deleteMany({
        where: {
          grievance_id: grievanceId,
          involvement_type: "SUPPORTING",
        },
      });

      // 3. Create fresh SUPPORTING entries
      for (const supp of validSupportingDepts) {
        await tx.grievance_departments.create({
          data: {
            grievance_id: grievanceId,
            department_id: supp.department_id,
            involvement_type: "SUPPORTING",
            status: "PENDING_ASSIGNMENT",
            assigned_at: new Date(),
          },
        });
      }

      // 4. Update grievance status to ROUTED and increment manual review counter
      await tx.grievances.update({
        where: { grievance_id: grievanceId },
        data: {
          status: "ROUTED",
          manual_review_count: { increment: 1 },
          updated_at: new Date(),
        },
      });

      // 5. Record status transition history
      const suppText =
        validSupportingDepts.length > 0
          ? ` | Supporting: ${validSupportingDepts.map((d) => d.department_name).join(", ")}`
          : "";

      await tx.grievance_status_history.create({
        data: {
          grievance_id: grievanceId,
          old_status: grievance.status,
          new_status: "ROUTED",
          changed_by: user.user_id,
          remarks: `Manual routing exception handled by Admin to Primary: ${primaryDept.department_name}${suppText}`,
        },
      });

      // 6. Record audit log
      await tx.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          entity_type: "GRIEVANCE",
          entity_id: grievanceId,
          user_id: user.user_id,
          action: "MANUAL_ROUTING_EXCEPTION",
          new_value: {
            primary_department_id: primaryDepartmentId.toString(),
            primary_department_name: primaryDept.department_name,
            supporting_departments: validSupportingDepts.map((d) => ({
              department_id: d.department_id.toString(),
              department_name: d.department_name,
            })),
            routed_by_email: user.email,
          },
        },
      });
    });

    const suppSummaryMsg =
      validSupportingDepts.length > 0
        ? ` with supporting departments: ${validSupportingDepts.map((d) => d.department_name).join(", ")}`
        : "";

    return NextResponse.json({
      success: true,
      message: `Grievance successfully routed to ${primaryDept.department_name}${suppSummaryMsg}.`,
      primary_department: {
        department_id: primaryDept.department_id.toString(),
        department_name: primaryDept.department_name,
      },
      supporting_departments: validSupportingDepts.map((d) => ({
        department_id: d.department_id.toString(),
        department_name: d.department_name,
      })),
    });
  } catch (error) {
    console.error("Manual routing exception failed:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error during routing." },
      { status: 500 },
    );
  }
}
