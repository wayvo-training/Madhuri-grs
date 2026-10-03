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

  const { staffId, departmentId, isAdmin } = auth;
  const { id } = await params;

  try {
    const grievanceId = BigInt(id);
    const body = await request.json();
    const { findings = "", actionTaken = "", notes = "" } = body;

    if (!findings.trim() && !notes.trim()) {
      return NextResponse.json(
        { success: false, message: "Findings or notes are required" },
        { status: 400 },
      );
    }

    const grievance = await prisma.grievances.findUnique({
      where: { grievance_id: grievanceId },
      include: {
        grievance_departments: {
          include: {
            departments: true,
            assignments: {
              include: {
                users_assignments_staff_idTousers: true,
              },
            },
          },
        },
      },
    });

    if (!grievance) {
      return NextResponse.json(
        { success: false, message: "Grievance not found" },
        { status: 404 },
      );
    }

    // Find all involved departments
    const allInvolvedDepts = await prisma.grievance_departments.findMany({
      where: { grievance_id: grievanceId },
      include: {
        departments: true,
        assignments: {
          include: {
            users_assignments_staff_idTousers: true,
          },
        },
      },
    });

    // Find the current staff member's department record
    const myDeptRecord = allInvolvedDepts.find((d) =>
      d.assignments?.staff_id === staffId ||
      (!isAdmin && departmentId ? d.department_id === departmentId : false)
    );

    if (!myDeptRecord && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: You are not assigned to this grievance",
        },
        { status: 403 },
      );
    }

    const deptName = myDeptRecord?.departments?.department_name || "Supporting Department";
    const authorUser = await prisma.users.findUnique({
      where: { user_id: staffId },
      select: { first_name: true, last_name: true },
    });
    const authorName = authorUser
      ? `${authorUser.first_name} ${authorUser.last_name || ""}`.trim()
      : "Staff Member";

    const formattedNote = `[Department Findings - ${deptName}]\n\nFindings: ${findings.trim()}\n\nAction Taken: ${actionTaken.trim() || "Inquiry completed."}\n\nNotes: ${notes.trim() || "Ready for Lead Department compilation."}`;

    await prisma.$transaction(async (tx) => {
      // 1. Mark this department's status and staff assignment as COMPLETED
      if (myDeptRecord) {
        await tx.grievance_departments.update({
          where: { grievance_department_id: myDeptRecord.grievance_department_id },
          data: {
            status: "COMPLETED",
            completed_at: new Date(),
          },
        });

        await tx.assignments.updateMany({
          where: {
            grievance_department_id: myDeptRecord.grievance_department_id,
            assignment_status: "ASSIGNED",
          },
          data: {
            assignment_status: "COMPLETED",
            completed_at: new Date(),
          },
        });
      }

      // 2. Create Audit Log
      await tx.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          user_id: staffId,
          action: "SUPPORTING_FINDINGS_SUBMITTED",
          entity_type: "grievance",
          entity_id: grievanceId,
          new_value: {
            department: deptName,
            submittedBy: authorName,
            findings: findings.trim(),
            actionTaken: actionTaken.trim(),
          },
        },
      });

      // 3. Post to Investigation Notes for Collaboration Timeline
      await tx.audit_logs.create({
        data: {
          grievance_id: grievanceId,
          user_id: staffId,
          action: "INVESTIGATION_NOTE_ADDED",
          entity_type: "GRIEVANCE",
          entity_id: grievanceId,
          new_value: {
            note: formattedNote,
            author: `Staff — ${authorName} (${deptName})`,
            role: "Staff",
            details: formattedNote,
          },
        },
      });
    });

    // 4. Notify Primary Department Lead and Primary HOD
    const primaryRecord = allInvolvedDepts.find((d) => d.involvement_type === "PRIMARY");
    const primaryStaffId = primaryRecord?.assignments?.staff_id;

    if (primaryStaffId && primaryStaffId !== staffId) {
      await NotificationService.send({
        userId: primaryStaffId,
        grievanceId,
        type: "HEAD_INTERNAL_NOTE",
        title: `Department Findings Submitted (${grievance.grievance_number})`,
        message: `${authorName} (${deptName}) has submitted departmental findings for ${grievance.grievance_number}. Review in Collaboration Tab to compile the final resolution.`,
      });
    }

    if (primaryRecord?.department_id) {
      const primaryHod = await prisma.users.findFirst({
        where: {
          department_id: primaryRecord.department_id,
          roles: { role_name: "DEPARTMENT_HEAD" },
          status: "ACTIVE",
        },
        select: { user_id: true },
      });

      if (primaryHod && primaryHod.user_id !== staffId) {
        await NotificationService.send({
          userId: primaryHod.user_id,
          grievanceId,
          type: "HEAD_INTERNAL_NOTE",
          title: `Supporting Findings Completed (${grievance.grievance_number})`,
          message: `${deptName} has completed their supporting investigation for ${grievance.grievance_number}.`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Department findings submitted successfully and shared with the Lead Department.",
    });
  } catch (error: unknown) {
    console.error("Error in POST /api/staff/grievances/[id]/findings:", error);
    const msg = error instanceof Error ? error.message : "Failed to submit findings";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
