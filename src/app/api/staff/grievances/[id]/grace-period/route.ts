import { NextResponse } from "next/server";
import { requestSlaExtension } from "@/lib/engines/sla-engine";
import { prisma } from "@/lib/prisma";
import { resolveStaffAuth } from "@/lib/staff/permissions";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await resolveStaffAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { user } = auth;
  const { id } = await params;

  try {
    const grievanceId = BigInt(id);
    const body = await request.json().catch(() => ({}));
    const { reason, requestedMinutes } = body;

    const cleanReason = typeof reason === "string" ? reason.trim() : "";
    if (cleanReason.length < 15) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a descriptive reason of at least 15 characters for requesting an SLA extension.",
        },
        { status: 400 },
      );
    }

    const duration = Number(requestedMinutes);
    if (!duration || duration <= 0 || Number.isNaN(duration)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please specify a valid positive extension duration in minutes.",
        },
        { status: 400 },
      );
    }

    const result = await requestSlaExtension({
      grievanceId,
      staffId: user.user_id,
      reason: cleanReason,
      requestedDurationMinutes: duration,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      extensionId: result.extensionId?.toString(),
      grantedMinutes: result.grantedMinutes,
    });
  } catch (error) {
    console.error("Error submitting SLA extension request:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
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

    const extensions = await prisma.sla_extensions.findMany({
      where: { grievance_id: grievanceId },
      include: {
        users_requested_by: {
          select: { first_name: true, last_name: true },
        },
        users_reviewed_by: {
          select: { first_name: true, last_name: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const serialized = extensions.map((e) => ({
      extensionId: e.extension_id.toString(),
      grievanceId: e.grievance_id.toString(),
      slaTrackingId: e.sla_tracking_id.toString(),
      requestedBy:
        `${e.users_requested_by.first_name} ${e.users_requested_by.last_name || ""}`.trim(),
      reason: e.reason,
      requestedDurationMinutes: e.requested_duration_minutes,
      grantedDurationMinutes: e.granted_duration_minutes,
      status: e.status,
      reviewedBy: e.users_reviewed_by
        ? `${e.users_reviewed_by.first_name} ${e.users_reviewed_by.last_name || ""}`.trim()
        : null,
      reviewedAt: e.reviewed_at ? e.reviewed_at.toISOString() : null,
      rejectionReason: e.rejection_reason,
      createdAt: e.created_at.toISOString(),
    }));

    return NextResponse.json({ success: true, extensions: serialized });
  } catch (error) {
    console.error("Error fetching SLA extensions:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
