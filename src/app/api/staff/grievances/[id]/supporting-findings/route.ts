import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";
import { resolveStaffAuth } from "@/lib/staff/permissions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await resolveStaffAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { user, staffId, departmentId, isAdmin } = auth;
  const { id } = await params;

  try {
    const grievanceId = BigInt(id);
    const body = (await request.json()) as { findings?: string };
    const rawFindings = body.findings?.trim() || "";

    if (!rawFindings) {
      return NextResponse.json(
        {
          success: false,
          message: "Investigation findings text is mandatory.",
        },
        { status: 400 },
      );
    }

    if (rawFindings.length < 20) {
      return NextResponse.json(
        {
          success: false,
          message: `Investigation findings must be at least 20 characters (currently ${rawFindings.length}).`,
        },
        { status: 400 },
      );
    }

    if (
      !/[a-zA-Z]/.test(rawFindings) ||
      /^\d+$/.test(rawFindings.replace(/\s+/g, ""))
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Investigation findings must contain words/letters and cannot consist only of numbers.",
        },
        { status: 400 },
      );
    }

    // Verify staff has an active assignment for this grievance
    let assignment = await prisma.assignments.findFirst({
      where: {
        grievance_id: grievanceId,
        staff_id: staffId,
        assignment_status: "ASSIGNED",
      },
      include: {
        grievance_departments: {
          include: { departments: true },
        },
        grievances: true,
      },
    });

    if (!assignment && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: You do not have an active assignment on this grievance.",
        },
        { status: 403 },
      );
    }

    if (!assignment && isAdmin) {
      // Find or create assignment for admin if not assigned
      const primaryAssignment = await prisma.assignments.findFirst({
        where: {
          grievance_id: grievanceId,
          assignment_status: "ASSIGNED",
        },
        include: {
          grievance_departments: {
            include: { departments: true },
          },
          grievances: true,
        },
      });
      assignment = primaryAssignment;
    }

    if (!assignment) {
      return NextResponse.json(
        {
          success: false,
          message: "No active department assignment found for this grievance.",
        },
        { status: 404 },
      );
    }

    const grievanceDeptId = assignment.grievance_department_id;
    const deptName =
      assignment.grievance_departments.departments?.department_name ||
      "Department";

    const staffFullName = `${user.first_name} ${user.last_name || ""}`.trim();
    const grievanceNumber = assignment.grievances.grievance_number;

    // 1. Insert in-department investigation finding
    const newFinding = await prisma.staff_investigation_findings.create({
      data: {
        grievance_id: grievanceId,
        grievance_department_id: grievanceDeptId,
        assignment_id: assignment.assignment_id,
        staff_id: staffId,
        finding_content: rawFindings,
      },
    });

    // 2. Log audit event
    await prisma.audit_logs.create({
      data: {
        grievance_id: grievanceId,
        user_id: staffId,
        action: "SUPPORTING_STAFF_FINDING_SUBMITTED",
        entity_type: "GRIEVANCE",
        entity_id: grievanceId,
        new_value: {
          finding_id: newFinding.finding_id.toString(),
          staff_id: staffId.toString(),
          staff_name: staffFullName,
          findings: rawFindings,
          department_id:
            assignment?.grievance_departments?.department_id?.toString() ||
            departmentId?.toString() ||
            null,
          department_name: deptName,
          stage: "INVESTIGATION",
          details: `Supporting Staff ${staffFullName} submitted investigation findings for ${deptName}.`,
        },
      },
    });

    // 3. Notify the Primary Investigator of this department
    const primaryAssignment = await prisma.assignments.findFirst({
      where: {
        grievance_department_id: grievanceDeptId,
        assignment_status: "ASSIGNED",
        assignment_role: "PRIMARY",
      },
    });

    if (primaryAssignment && primaryAssignment.staff_id !== staffId) {
      await NotificationService.send({
        userId: primaryAssignment.staff_id,
        grievanceId,
        type: "HEAD_INTERNAL_NOTE",
        title: `Supporting Findings Added: ${grievanceNumber}`,
        message: `${staffFullName} submitted supporting investigation findings on ${grievanceNumber} for your review.`,
      });
    }

    // 4. Notify Department Head(s)
    if (assignment?.grievance_departments?.department_id || departmentId) {
      const targetDeptId =
        assignment?.grievance_departments?.department_id || departmentId;
      const deptHeads = await prisma.users.findMany({
        where: {
          department_id: targetDeptId,
          roles: { role_name: "DEPARTMENT_HEAD" },
          status: "ACTIVE",
        },
      });

      for (const dh of deptHeads) {
        if (dh.user_id !== staffId) {
          await NotificationService.send({
            userId: dh.user_id,
            grievanceId,
            type: "HEAD_INTERNAL_NOTE",
            title: `Supporting Findings Added: ${grievanceNumber}`,
            message: `${staffFullName} submitted supporting investigation findings on ${grievanceNumber}.`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Supporting investigation findings submitted successfully.",
      data: {
        id: newFinding.finding_id.toString(),
        staffId: staffId.toString(),
        staffName: staffFullName,
        findings: newFinding.finding_content,
        submittedAt: newFinding.submitted_at.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in POST supporting-findings:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to submit supporting findings",
      },
      { status: 500 },
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await resolveStaffAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await params;

  try {
    const grievanceId = BigInt(id);
    const findings = await prisma.staff_investigation_findings.findMany({
      where: { grievance_id: grievanceId },
      include: {
        users: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        grievance_departments: {
          include: { departments: true },
        },
      },
      orderBy: { submitted_at: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: findings.map((f) => ({
        id: f.finding_id.toString(),
        staffId: f.staff_id.toString(),
        staffName: `${f.users.first_name} ${f.users.last_name || ""}`.trim(),
        departmentId: f.grievance_departments.department_id.toString(),
        departmentName:
          f.grievance_departments.departments?.department_name || "Department",
        findings: f.finding_content,
        submittedAt: f.submitted_at.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error in GET supporting-findings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch supporting findings" },
      { status: 500 },
    );
  }
}
