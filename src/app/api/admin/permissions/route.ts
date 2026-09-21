import { NextResponse } from "next/server";
import { CACHE_TAGS, serverCache } from "@/lib/cache";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;

  try {
    const permissions = await prisma.permissions.findMany({
      orderBy: { permission_id: "asc" },
    });

    return NextResponse.json({
      success: true,
      permissions: permissions.map((p) => ({
        permission_id: p.permission_id.toString(),
        permission_code: p.permission_code,
        permission_name: p.permission_name,
        description: p.description,
        status: p.status || "ACTIVE",
      })),
    });
  } catch (error) {
    console.error("Failed to fetch permissions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch permissions." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await request.json();
    const { permission_id, status } = body;

    if (!permission_id) {
      return NextResponse.json(
        { success: false, message: "permission_id is required." },
        { status: 400 },
      );
    }

    if (status !== "ACTIVE" && status !== "INACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message: "Status must be either 'ACTIVE' or 'INACTIVE'.",
        },
        { status: 400 },
      );
    }

    const permIdBigInt = BigInt(permission_id);
    const existing = await prisma.permissions.findUnique({
      where: { permission_id: permIdBigInt },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Permission not found." },
        { status: 404 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const permUpdate = await tx.permissions.update({
        where: { permission_id: permIdBigInt },
        data: { status },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "UPDATE_PERMISSION_STATUS",
          entity_type: "PERMISSION",
          entity_id: permIdBigInt,
          old_value: {
            permission_code: existing.permission_code,
            status: existing.status,
          },
          new_value: {
            permission_code: permUpdate.permission_code,
            status: permUpdate.status,
            updated_by: user.email,
          },
        },
      });

      return permUpdate;
    });

    serverCache.invalidateTags([CACHE_TAGS.PERMISSIONS, CACHE_TAGS.ROLES]);

    return NextResponse.json({
      success: true,
      message: `Permission '${updated.permission_code}' status updated to ${updated.status}.`,
      permission: {
        permission_id: updated.permission_id.toString(),
        permission_code: updated.permission_code,
        permission_name: updated.permission_name,
        description: updated.description,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("Failed to update permission status:", error);
    return NextResponse.json(
      { success: false, message: "Internal error updating permission status." },
      { status: 500 },
    );
  }
}
