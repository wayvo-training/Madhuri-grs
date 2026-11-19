import { NextResponse } from "next/server";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import { reviewSlaExtension } from "@/lib/engines/sla-engine";

export async function POST(
  request: Request,
  { params: _params }: { params: Promise<{ id: string }> },
) {
  const auth = await resolveDepartmentHeadAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { user } = auth;

  try {
    const body = await request.json().catch(() => ({}));
    const { extensionId, decision, grantedMinutes, rejectionReason } = body;

    if (!extensionId) {
      return NextResponse.json(
        { success: false, message: "Extension ID is required." },
        { status: 400 },
      );
    }

    if (decision !== "APPROVE" && decision !== "REJECT") {
      return NextResponse.json(
        { success: false, message: "Decision must be 'APPROVE' or 'REJECT'." },
        { status: 400 },
      );
    }

    const cleanRejection =
      typeof rejectionReason === "string" ? rejectionReason.trim() : "";
    if (decision === "REJECT" && cleanRejection.length < 10) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a rejection reason of at least 10 characters.",
        },
        { status: 400 },
      );
    }

    const result = await reviewSlaExtension({
      extensionId: BigInt(extensionId),
      reviewedBy: user.user_id,
      decision,
      grantedDurationMinutes: grantedMinutes
        ? Number(grantedMinutes)
        : undefined,
      rejectionReason: cleanRejection,
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
      newDueAt: result.newDueAt ? result.newDueAt.toISOString() : undefined,
    });
  } catch (error) {
    console.error("Error in department head grace period review:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
