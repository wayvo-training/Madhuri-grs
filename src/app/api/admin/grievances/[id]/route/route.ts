import { NextResponse } from "next/server";
import { DEFAULT_SLA_DURATIONS_MINUTES } from "@/lib/constants/sla";
import {
  buildDepartmentMdiData,
  calculateDepartmentDeadline,
  calculateDepartmentSlaDuration,
} from "@/lib/engines/routing-engine";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";
import {
  type DepartmentDependencyNode,
  validateRoutingPolicy,
} from "@/lib/validations/dependency-graph";

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

    let isPrimaryBlocked = false;

    // Perform database transaction for manual routing exception
    await prisma.$transaction(async (tx) => {
      // 1. Handle primary department assignment
      const existingPrimary = await tx.grievance_departments.findFirst({
        where: {
          grievance_id: grievanceId,
          involvement_type: "PRIMARY",
        },
      });

      let totalDurationMinutes: number =
        DEFAULT_SLA_DURATIONS_MINUTES[
          grievance.priority?.toUpperCase() || "MEDIUM"
        ] || 2880;

      if (grievance.due_at && grievance.created_at) {
        const diffMinutes = Math.round(
          (grievance.due_at.getTime() - grievance.created_at.getTime()) / 60000,
        );
        if (diffMinutes > 0) totalDurationMinutes = diffMinutes;
      }

      const primaryDepNode = Array.isArray(dependencies)
        ? dependencies.find(
            (n: DepartmentDependencyNode) =>
              (n.department_id &&
                n.department_id.toString() ===
                  primaryDepartmentId.toString()) ||
              (n.department_name &&
                n.department_name.toLowerCase() ===
                  primaryDept.department_name.toLowerCase()),
          )
        : undefined;

      const primaryAlloc = calculateDepartmentSlaDuration(
        totalDurationMinutes,
        primaryDepNode,
      );
      const depType =
        dependency_type === "SEQUENTIAL" ? "SEQUENTIAL" : "PARALLEL";

      const allActiveDepts = [primaryDept, ...validSupportingDepts];
      let primaryExecutionOrder = 1;
      const primaryPrereqIds: bigint[] = [];

      if (depType === "SEQUENTIAL" && primaryDepNode) {
        primaryExecutionOrder = primaryDepNode.execution_order ?? 1;
        const rawPrereqs = (primaryDepNode.prerequisites || [])
          .map((p: string) => p.trim())
          .filter((p: string) => p.length > 0);

        if (rawPrereqs.length > 0) {
          isPrimaryBlocked = true;
          for (const p of rawPrereqs) {
            const matched = allActiveDepts.find(
              (d) =>
                (d.department_id.toString() === p ||
                  d.department_name.toLowerCase() === p.toLowerCase()) &&
                d.department_id !== primaryDepartmentId,
            );
            if (matched && !primaryPrereqIds.includes(matched.department_id)) {
              primaryPrereqIds.push(matched.department_id);
            }
          }
        }
      }

      const isSamePrimary =
        existingPrimary &&
        existingPrimary.department_id === primaryDepartmentId;

      if (
        isSamePrimary &&
        (existingPrimary.status === "COMPLETED" ||
          existingPrimary.status === "RESOLVED") &&
        isPrimaryBlocked
      ) {
        throw new Error(
          `Cannot block primary department "${primaryDept.department_name}" because it has already completed investigation.`,
        );
      }

      let primaryStatus = isPrimaryBlocked ? "BLOCKED" : "PENDING_ASSIGNMENT";
      let primaryActivatedAt: Date | null = isPrimaryBlocked
        ? null
        : new Date();
      let primaryDueAt: Date | null = isPrimaryBlocked
        ? null
        : calculateDepartmentDeadline(
            primaryActivatedAt,
            primaryAlloc.allocatedDurationMinutes,
            grievance.due_at,
          ) ||
          grievance.due_at ||
          new Date(Date.now() + totalDurationMinutes * 60 * 1000);

      if (isSamePrimary && existingPrimary) {
        if (
          existingPrimary.status === "COMPLETED" ||
          existingPrimary.status === "RESOLVED"
        ) {
          primaryStatus = existingPrimary.status;
        } else if (existingPrimary.status !== "BLOCKED" && !isPrimaryBlocked) {
          primaryStatus = existingPrimary.status;
        }

        if (existingPrimary.activated_at && !isPrimaryBlocked) {
          primaryActivatedAt = existingPrimary.activated_at;
          primaryDueAt = existingPrimary.due_at ?? primaryDueAt;
        }
      }

      const primaryMdiData = buildDepartmentMdiData(primaryDepartmentId, {
        involvementType: "PRIMARY",
        dependencyType: depType,
        executionOrder: primaryExecutionOrder,
        prerequisiteDepartmentIds: primaryPrereqIds,
        slaPercentAllocation: primaryAlloc.slaPercentAllocation,
        allocatedDurationMinutes: primaryAlloc.allocatedDurationMinutes,
        dueAt: primaryDueAt,
        status: primaryStatus,
        activatedAt: primaryActivatedAt,
        assignedAt:
          isSamePrimary && existingPrimary
            ? existingPrimary.assigned_at
            : undefined,
      });

      if (existingPrimary) {
        await tx.grievance_departments.update({
          where: {
            grievance_department_id: existingPrimary.grievance_department_id,
          },
          data: primaryMdiData,
        });
      } else {
        await tx.grievance_departments.create({
          data: {
            grievance_id: grievanceId,
            ...primaryMdiData,
          },
        });
      }

      // 2. Preserve audit history: soft-remove removed supporting departments with history, delete empty placeholders
      const existingSupporting = await tx.grievance_departments.findMany({
        where: {
          grievance_id: grievanceId,
          involvement_type: "SUPPORTING",
        },
        include: {
          assignments: true,
          attachments: true,
        },
      });

      const existingSuppMap = new Map(
        existingSupporting.map((s) => [s.department_id.toString(), s]),
      );
      const newSuppIds = new Set(
        validSupportingDepts.map((d) => d.department_id),
      );

      for (const supp of existingSupporting) {
        if (!newSuppIds.has(supp.department_id)) {
          const hasHistory =
            supp.assignments !== null ||
            supp.attachments.length > 0 ||
            supp.status === "COMPLETED";

          if (hasHistory) {
            await tx.grievance_departments.update({
              where: { grievance_department_id: supp.grievance_department_id },
              data: { status: "REMOVED" },
            });
          } else {
            await tx.grievance_departments.delete({
              where: { grievance_department_id: supp.grievance_department_id },
            });
          }
        }
      }

      // 3. Upsert fresh SUPPORTING entries
      for (let i = 0; i < validSupportingDepts.length; i++) {
        const supp = validSupportingDepts[i];
        const depNode = Array.isArray(dependencies)
          ? dependencies.find(
              (n: DepartmentDependencyNode) =>
                (n.department_id &&
                  n.department_id.toString() ===
                    supp.department_id.toString()) ||
                (n.department_name &&
                  n.department_name.toLowerCase() ===
                    supp.department_name.toLowerCase()),
            )
          : undefined;

        let executionOrder = 1;
        let prereqDepartmentIds: bigint[] = [];
        let isBlocked = false;

        if (depType === "SEQUENTIAL") {
          if (depNode) {
            executionOrder = depNode.execution_order || i + 2;
            const rawPrereqs = (depNode.prerequisites || [])
              .map((p: string) => p.trim())
              .filter((p: string) => p.length > 0);

            if (rawPrereqs.length > 0) {
              isBlocked = true;
              for (const prereqStr of rawPrereqs) {
                const matched = allActiveDepts.find(
                  (d) =>
                    (d.department_id.toString() === prereqStr ||
                      d.department_name.toLowerCase() ===
                        prereqStr.toLowerCase()) &&
                    d.department_id !== supp.department_id,
                );
                if (
                  matched &&
                  !prereqDepartmentIds.includes(matched.department_id)
                ) {
                  prereqDepartmentIds.push(matched.department_id);
                }
              }
            }
          } else {
            executionOrder = i + 2;
            prereqDepartmentIds = [primaryDepartmentId];
            isBlocked = true;
          }
        }

        const existingRecord = existingSuppMap.get(
          supp.department_id.toString(),
        );

        if (
          existingRecord &&
          (existingRecord.status === "COMPLETED" ||
            existingRecord.status === "RESOLVED") &&
          isBlocked
        ) {
          throw new Error(
            `Cannot block department "${supp.department_name}" because it has already completed investigation.`,
          );
        }

        const suppAlloc = calculateDepartmentSlaDuration(
          totalDurationMinutes,
          depNode,
        );

        let suppStatus = isBlocked ? "BLOCKED" : "PENDING_ASSIGNMENT";
        let suppActivatedAt: Date | null = isBlocked ? null : new Date();
        let suppDueAt: Date | null = isBlocked
          ? null
          : calculateDepartmentDeadline(
              suppActivatedAt,
              suppAlloc.allocatedDurationMinutes,
              grievance.due_at,
            );

        if (existingRecord) {
          if (
            existingRecord.status === "COMPLETED" ||
            existingRecord.status === "RESOLVED"
          ) {
            suppStatus = existingRecord.status;
          } else if (existingRecord.status !== "BLOCKED" && !isBlocked) {
            suppStatus = existingRecord.status;
          }

          if (existingRecord.activated_at && !isBlocked) {
            suppActivatedAt = existingRecord.activated_at;
            suppDueAt = existingRecord.due_at ?? suppDueAt;
          }
        }

        const suppMdiData = buildDepartmentMdiData(supp.department_id, {
          involvementType: "SUPPORTING",
          dependencyType: depType,
          executionOrder,
          prerequisiteDepartmentIds: prereqDepartmentIds,
          slaPercentAllocation: suppAlloc.slaPercentAllocation,
          allocatedDurationMinutes: suppAlloc.allocatedDurationMinutes,
          dueAt: suppDueAt,
          status: suppStatus,
          activatedAt: suppActivatedAt,
          assignedAt: existingRecord ? existingRecord.assigned_at : undefined,
        });

        if (existingRecord) {
          await tx.grievance_departments.update({
            where: {
              grievance_department_id: existingRecord.grievance_department_id,
            },
            data: suppMdiData,
          });
        } else {
          await tx.grievance_departments.create({
            data: {
              grievance_id: grievanceId,
              ...suppMdiData,
            },
          });
        }
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
