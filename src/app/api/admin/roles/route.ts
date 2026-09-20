import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;

  try {
    const [roles, permissions] = await Promise.all([
      prisma.roles.findMany({
        orderBy: { role_id: "asc" },
        include: {
          _count: { select: { users: true } },
          role_permissions: {
            include: {
              permissions: true,
            },
          },
        },
      }),
      prisma.permissions.findMany({
        where: { status: "ACTIVE" },
        orderBy: { permission_id: "asc" },
      }),
    ]);

    const serializedRoles = roles.map((r) => ({
      role_id: r.role_id.toString(),
      role_name: r.role_name,
      description: r.description,
      user_count: r._count.users,
      permissions: r.role_permissions.map((rp) => ({
        permission_id: rp.permissions.permission_id.toString(),
        permission_code: rp.permissions.permission_code,
        permission_name: rp.permissions.permission_name,
      })),
    }));

    const serializedPermissions = permissions.map((p) => ({
      permission_id: p.permission_id.toString(),
      permission_code: p.permission_code,
      permission_name: p.permission_name,
      description: p.description,
    }));

    return NextResponse.json({
      success: true,
      roles: serializedRoles,
      permissions: serializedPermissions,
    });
  } catch (error) {
    console.error("Failed to fetch roles & permissions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch roles." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await request.json();
    const { role_name, description, permission_ids } = body;

    if (!role_name || typeof role_name !== "string" || !role_name.trim()) {
      return NextResponse.json(
        { success: false, message: "Role name is required." },
        { status: 400 },
      );
    }

    const normalizedRoleName = role_name
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_");

    // Check if role name already exists
    const existing = await prisma.roles.findUnique({
      where: { role_name: normalizedRoleName },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `Role '${normalizedRoleName}' already exists.`,
        },
        { status: 409 },
      );
    }

    const permissionBigInts: bigint[] = Array.isArray(permission_ids)
      ? permission_ids.map((id: string | number) => BigInt(id))
      : [];

    // Create role and attach role_permissions in a single transaction
    const newRole = await prisma.$transaction(async (tx) => {
      const createdRole = await tx.roles.create({
        data: {
          role_name: normalizedRoleName,
          description: description?.trim() || null,
        },
      });

      if (permissionBigInts.length > 0) {
        await tx.role_permissions.createMany({
          data: permissionBigInts.map((pid) => ({
            role_id: createdRole.role_id,
            permission_id: pid,
          })),
        });
      }

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "CREATE_ROLE",
          entity_type: "ROLE",
          entity_id: createdRole.role_id,
          new_value: {
            role_name: normalizedRoleName,
            description: description?.trim() || null,
            assigned_permissions: permission_ids,
            created_by: user.email,
          },
        },
      });

      return createdRole;
    });

    return NextResponse.json({
      success: true,
      message: `Role '${normalizedRoleName}' created successfully.`,
      role: {
        role_id: newRole.role_id.toString(),
        role_name: newRole.role_name,
        description: newRole.description,
      },
    });
  } catch (error) {
    console.error("Failed to create role:", error);
    return NextResponse.json(
      { success: false, message: "Internal error creating role." },
      { status: 500 },
    );
  }
}
