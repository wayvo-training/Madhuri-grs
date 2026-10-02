import { NextResponse } from "next/server";
import { CACHE_TAGS, serverCache } from "@/lib/cache";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;

  try {
    const [roles, permissions] = await Promise.all([
      prisma.roles.findMany({
        where: {
          role_name: {
            not: "ADMIN",
          },
        },
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
        orderBy: { permission_id: "asc" },
      }),
    ]);

    const serializedRoles = roles.map((r) => ({
      role_id: r.role_id.toString(),
      role_name: r.role_name,
      description: r.description,
      status: r.status || "ACTIVE",
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
      status: p.status || "ACTIVE",
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
    const { role_name, description, permission_ids, status } = body;

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

    const roleStatus = status === "INACTIVE" ? "INACTIVE" : "ACTIVE";

    const permissionBigInts: bigint[] = Array.isArray(permission_ids)
      ? permission_ids.map((id: string | number) => BigInt(id))
      : [];

    // Create role and attach role_permissions in a single transaction
    const newRole = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRawUnsafe<
        {
          role_id: bigint;
          role_name: string;
          description: string | null;
          status: string;
        }[]
      >(
        "INSERT INTO roles (role_name, description, status) VALUES ($1, $2, $3) RETURNING role_id, role_name, description, status",
        normalizedRoleName,
        description?.trim() || null,
        roleStatus,
      );
      const createdRole = rows[0];

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
            status: roleStatus,
            assigned_permissions: permission_ids,
            created_by: user.email,
          },
        },
      });

      return createdRole;
    });

    serverCache.invalidateTags([CACHE_TAGS.ROLES]);

    return NextResponse.json({
      success: true,
      message: `Role '${normalizedRoleName}' created successfully.`,
      role: {
        role_id: newRole.role_id.toString(),
        role_name: newRole.role_name,
        description: newRole.description,
        status: newRole.status,
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

export async function PATCH(request: Request) {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const body = await request.json();
    const { role_id, description, permission_ids, status } = body;

    if (!role_id) {
      return NextResponse.json(
        { success: false, message: "role_id is required." },
        { status: 400 },
      );
    }

    const roleIdBigInt = BigInt(role_id);
    const existingRole = await prisma.roles.findUnique({
      where: { role_id: roleIdBigInt },
      include: { role_permissions: true },
    });

    if (!existingRole) {
      return NextResponse.json(
        { success: false, message: "Role not found." },
        { status: 404 },
      );
    }

    // Security check: Never allow deactivating the ADMIN system role
    if (existingRole.role_name === "ADMIN" && status === "INACTIVE") {
      return NextResponse.json(
        {
          success: false,
          message:
            "The System Administrator (ADMIN) role cannot be deactivated.",
        },
        { status: 400 },
      );
    }

    const permissionBigInts: bigint[] = Array.isArray(permission_ids)
      ? permission_ids.map((id: string | number) => BigInt(id))
      : [];

    const targetStatus =
      status === "ACTIVE" || status === "INACTIVE"
        ? status
        : existingRole.status;

    const newDesc =
      description !== undefined
        ? description?.trim() || null
        : existingRole.description;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        "UPDATE roles SET description = $1, status = $2 WHERE role_id = $3",
        newDesc,
        targetStatus,
        roleIdBigInt,
      );

      const roleUpdate = {
        role_id: existingRole.role_id,
        role_name: existingRole.role_name,
        description: newDesc,
        status: targetStatus,
      };

      if (Array.isArray(permission_ids)) {
        await tx.role_permissions.deleteMany({
          where: { role_id: roleIdBigInt },
        });

        if (permissionBigInts.length > 0) {
          await tx.role_permissions.createMany({
            data: permissionBigInts.map((pid) => ({
              role_id: roleIdBigInt,
              permission_id: pid,
            })),
          });
        }
      }

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "UPDATE_ROLE",
          entity_type: "ROLE",
          entity_id: roleIdBigInt,
          old_value: {
            role_name: existingRole.role_name,
            description: existingRole.description,
            status: existingRole.status,
            permissions_count: existingRole.role_permissions.length,
          },
          new_value: {
            role_name: roleUpdate.role_name,
            description: roleUpdate.description,
            status: roleUpdate.status,
            assigned_permissions: permission_ids,
            updated_by: user.email,
          },
        },
      });

      return roleUpdate;
    });

    serverCache.invalidateTags([CACHE_TAGS.ROLES]);

    return NextResponse.json({
      success: true,
      message: `Role '${updated.role_name}' updated successfully.`,
      role: {
        role_id: updated.role_id.toString(),
        role_name: updated.role_name,
        description: updated.description,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error("Failed to update role:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update role.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
