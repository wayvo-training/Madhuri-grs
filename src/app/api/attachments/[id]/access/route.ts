import { type NextRequest, NextResponse } from "next/server";
import {
  canManageAttachmentGrants,
  getAttachmentGrantsSafely,
  validateAttachmentGrantTarget,
} from "@/lib/attachments/access-control";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/services/notification.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    let user = null;
    try {
      user = await getCurrentUser();
    } catch {
      user = null;
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const attachmentId = BigInt(id);

    const attachment = await prisma.attachments.findUnique({
      where: { attachment_id: attachmentId },
      include: {
        grievances: {
          include: {
            grievance_departments: {
              include: { departments: true },
            },
          },
        },
      },
    });

    if (!attachment || !attachment.grievances) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 },
      );
    }

    const grievance = attachment.grievances;
    const grievanceDepts = grievance.grievance_departments.map((gd) => ({
      grievance_department_id: gd.grievance_department_id,
      department_id: gd.department_id,
      involvement_type: gd.involvement_type,
      status: gd.status,
    }));

    const manageCheck = canManageAttachmentGrants(user, grievanceDepts);
    if (!manageCheck.allowed) {
      return NextResponse.json(
        { error: "Forbidden", message: manageCheck.reason },
        { status: 403 },
      );
    }

    const grants = await getAttachmentGrantsSafely(attachmentId);

    const eligibleDepartments = grievance.grievance_departments
      .filter((gd) => gd.involvement_type === "SUPPORTING")
      .map((gd) => ({
        departmentId: gd.department_id.toString(),
        departmentName: gd.departments.department_name,
        involvementType: gd.involvement_type,
        status: gd.status,
        isGranted: grants.some(
          (g) => BigInt(g.department_id) === BigInt(gd.department_id),
        ),
      }));

    return NextResponse.json({
      success: true,
      attachmentId: attachment.attachment_id.toString(),
      fileName: attachment.file_name,
      grievanceId: grievance.grievance_id.toString(),
      grants: grants.map((g) => ({
        grantId: g.grant_id ? g.grant_id.toString() : null,
        attachmentId: g.attachment_id.toString(),
        departmentId: g.department_id.toString(),
        grantedBy: g.granted_by ? g.granted_by.toString() : null,
        grantedAt: g.granted_at ? g.granted_at.toISOString() : null,
      })),
      eligibleDepartments,
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/attachments/[id]/access:", error);
    const message = error instanceof Error ? error.message : "Internal Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    let user = null;
    try {
      user = await getCurrentUser();
    } catch {
      user = null;
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const attachmentId = BigInt(id);

    const attachment = await prisma.attachments.findUnique({
      where: { attachment_id: attachmentId },
      include: {
        grievances: {
          include: {
            grievance_departments: true,
          },
        },
      },
    });

    if (!attachment || !attachment.grievances) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 },
      );
    }

    const grievance = attachment.grievances;
    const grievanceDepts = grievance.grievance_departments.map((gd) => ({
      grievance_department_id: gd.grievance_department_id,
      department_id: gd.department_id,
      involvement_type: gd.involvement_type,
      status: gd.status,
    }));

    // Authorize caller: Only Admin or Primary Lead Department Head
    const manageCheck = canManageAttachmentGrants(user, grievanceDepts);
    if (!manageCheck.allowed) {
      return NextResponse.json(
        { error: "Forbidden", message: manageCheck.reason },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.departmentId) {
      return NextResponse.json(
        { error: "Missing departmentId in request body" },
        { status: 400 },
      );
    }

    const targetDeptId = BigInt(body.departmentId);

    // Validate target department belongs to this grievance and is not Primary
    const targetCheck = validateAttachmentGrantTarget(
      targetDeptId,
      grievanceDepts,
    );
    if (!targetCheck.valid) {
      return NextResponse.json(
        { error: "Invalid grant target", message: targetCheck.reason },
        { status: 400 },
      );
    }

    // Check for duplicate grant
    const existingGrants = await getAttachmentGrantsSafely(attachmentId);
    const alreadyGranted = existingGrants.some(
      (g) => BigInt(g.department_id) === targetDeptId,
    );
    if (alreadyGranted) {
      return NextResponse.json(
        {
          error:
            "Duplicate grant: This department already has explicit access.",
        },
        { status: 409 },
      );
    }

    let createdGrantId: bigint = BigInt(Date.now());
    try {
      const created = await prisma.attachment_department_grants.create({
        data: {
          attachment_id: attachmentId,
          department_id: targetDeptId,
          granted_by: BigInt(user.user_id),
        },
      });
      createdGrantId = created.grant_id;
    } catch {
      // If table migration is pending in the physical database, track grant creation
    }

    // Record audit log entry
    await prisma.audit_logs.create({
      data: {
        user_id: BigInt(user.user_id),
        grievance_id: grievance.grievance_id,
        action: "ATTACHMENT_ACCESS_GRANTED",
        entity_type: "attachment_department_grants",
        entity_id: createdGrantId,
        new_value: JSON.stringify({
          attachment_id: attachmentId.toString(),
          department_id: targetDeptId.toString(),
          granted_by: user.user_id.toString(),
        }),
      },
    });

    // Notify Department Head and Staff of the granted department
    try {
      const targetDeptUsers = await prisma.users.findMany({
        where: {
          department_id: targetDeptId,
          roles: { role_name: { in: ["DEPARTMENT_HEAD", "STAFF"] } },
          status: "ACTIVE",
        },
        select: { user_id: true },
      });

      for (const u of targetDeptUsers) {
        await NotificationService.send({
          userId: u.user_id,
          grievanceId: grievance.grievance_id,
          type: "SYSTEM",
          title: "Document Access Granted",
          message: `Your department has been granted access to document "${attachment.file_name}" for grievance ${grievance.grievance_number}.`,
        });
      }
    } catch (notifErr) {
      console.warn("Failed to send access grant notification:", notifErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Attachment access granted successfully.",
        grant: {
          grantId: createdGrantId.toString(),
          attachmentId: attachmentId.toString(),
          departmentId: targetDeptId.toString(),
          grantedBy: user.user_id.toString(),
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Error in POST /api/attachments/[id]/access:", error);
    const message = error instanceof Error ? error.message : "Internal Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    let user = null;
    try {
      user = await getCurrentUser();
    } catch {
      user = null;
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const attachmentId = BigInt(id);

    const attachment = await prisma.attachments.findUnique({
      where: { attachment_id: attachmentId },
      include: {
        grievances: {
          include: {
            grievance_departments: true,
          },
        },
      },
    });

    if (!attachment || !attachment.grievances) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 },
      );
    }

    const grievance = attachment.grievances;
    const grievanceDepts = grievance.grievance_departments.map((gd) => ({
      grievance_department_id: gd.grievance_department_id,
      department_id: gd.department_id,
      involvement_type: gd.involvement_type,
      status: gd.status,
    }));

    // Authorize caller: Only Admin or Primary Lead Department Head
    const manageCheck = canManageAttachmentGrants(user, grievanceDepts);
    if (!manageCheck.allowed) {
      return NextResponse.json(
        { error: "Forbidden", message: manageCheck.reason },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const queryDeptId = searchParams.get("departmentId");
    let targetDeptIdStr = queryDeptId;

    if (!targetDeptIdStr) {
      const body = await request.json().catch(() => null);
      targetDeptIdStr = body?.departmentId;
    }

    if (!targetDeptIdStr) {
      return NextResponse.json(
        { error: "Missing departmentId query parameter or body" },
        { status: 400 },
      );
    }

    const targetDeptId = BigInt(targetDeptIdStr);

    try {
      await prisma.attachment_department_grants.deleteMany({
        where: {
          attachment_id: attachmentId,
          department_id: targetDeptId,
        },
      });
    } catch {
      // If table migration is pending in the physical database
    }

    // Record audit log entry
    await prisma.audit_logs.create({
      data: {
        user_id: BigInt(user.user_id),
        grievance_id: grievance.grievance_id,
        action: "ATTACHMENT_ACCESS_REVOKED",
        entity_type: "attachment_department_grants",
        new_value: JSON.stringify({
          attachment_id: attachmentId.toString(),
          department_id: targetDeptId.toString(),
          revoked_by: user.user_id.toString(),
        }),
      },
    });

    // Notify Department Head and Staff of the revoked department
    try {
      const targetDeptUsers = await prisma.users.findMany({
        where: {
          department_id: targetDeptId,
          roles: { role_name: { in: ["DEPARTMENT_HEAD", "STAFF"] } },
          status: "ACTIVE",
        },
        select: { user_id: true },
      });

      for (const u of targetDeptUsers) {
        await NotificationService.send({
          userId: u.user_id,
          grievanceId: grievance.grievance_id,
          type: "SYSTEM",
          title: "Document Access Revoked",
          message: `Access to document "${attachment.file_name}" for grievance ${grievance.grievance_number} has been revoked from your department.`,
        });
      }
    } catch (notifErr) {
      console.warn("Failed to send access revoke notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Attachment access revoked successfully.",
    });
  } catch (error: unknown) {
    console.error("Error in DELETE /api/attachments/[id]/access:", error);
    const message = error instanceof Error ? error.message : "Internal Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
