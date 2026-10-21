import { NextResponse } from "next/server";
import { populateGrievanceDepartments } from "@/lib/engines/routing-engine";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";
import { validateRoutingPolicy } from "@/lib/validations/dependency-graph";

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
    const {
      department_id,
      supporting_department_ids,
      dependency_type,
      dependencies,
    } = body;

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

    // Validate sequential dependencies if provided
    if (
      dependency_type === "SEQUENTIAL" &&
      Array.isArray(dependencies) &&
      dependencies.length > 0
    ) {
      const policyValidation = validateRoutingPolicy({
        primary_department_name: primaryDept.department_name,
        primary_department_id: primaryDepartmentId,
        supporting_departments: validSupportingDepts.map(
          (d) => d.department_name,
        ),
        dependency_type: "SEQUENTIAL",
        dependencies,
      });

      if (!policyValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            message: policyValidation.errors[0],
            errors: policyValidation.errors,
          },
          { status: 400 },
        );
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

    const depType =
      dependency_type === "SEQUENTIAL" ? "SEQUENTIAL" : "PARALLEL";

    let isPrimaryBlocked = false;

    // Perform database transaction for manual routing exception
    await prisma.$transaction(async (tx) => {
      const popResult = await populateGrievanceDepartments(
        grievanceId,
        {
          departmentId: primaryDepartmentId,
          departmentName: primaryDept.department_name,
          involvementType: "PRIMARY",
          supportingDepartments: validSupportingDepts.map(
            (d) => d.department_name,
          ),
          supportingDepartmentIds: validSupportingDepts.map(
            (d) => d.department_id,
          ),
          dependencyType: depType,
          dependencies: Array.isArray(dependencies) ? dependencies : undefined,
          routingRuleId: BigInt(0),
          matchedRuleName: "MANUAL_ADMIN_ROUTING",
          matchType: "CATEGORY_FALLBACK",
        },
        tx,
        {
          dependencyType: depType,
          dependencies: Array.isArray(dependencies) ? dependencies : undefined,
        },
      );

      isPrimaryBlocked = popResult.blockedDeptIds.includes(primaryDepartmentId);

      // Update grievance status to ROUTED and increment manual review counter
      await tx.grievances.update({
        where: { grievance_id: grievanceId },
        data: {
          status: "ROUTED",
          manual_review_count: { increment: 1 },
          updated_at: new Date(),
        },
      });

      // Record status transition history
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

      // Record audit log
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

    // Send notification to the new Primary Department Head
    const primaryHead = await prisma.users.findFirst({
      where: {
        department_id: primaryDepartmentId,
        roles: { role_name: "DEPARTMENT_HEAD" },
        status: "ACTIVE",
      },
    });

    if (primaryHead && !isPrimaryBlocked) {
      await NotificationService.send({
        userId: primaryHead.user_id,
        grievanceId: grievanceId,
        type: "ASSIGNMENT",
        channel: "IN_APP",
        title: "New Case Assigned",
        message: `Grievance ${grievance.grievance_number} has been routed to your department for review by Admin.`,
      });
    }

    const suppSummaryMsg =
      validSupportingDepts.length > 0
        ? ` with supporting departments: ${validSupportingDepts.map((d) => d.department_name).join(", ")}`
        : "";

    // Confirmation notification for the routing Admin
    await NotificationService.send({
      userId: user.user_id,
      grievanceId: grievanceId,
      type: "ASSIGNMENT",
      channel: "IN_APP",
      title: `Routing Confirmed: ${grievance.grievance_number}`,
      message: `You successfully routed grievance ${grievance.grievance_number} to ${primaryDept.department_name}${suppSummaryMsg}.`,
    });

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
    const msg =
      error instanceof Error
        ? error.message
        : "Internal server error during routing.";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}
