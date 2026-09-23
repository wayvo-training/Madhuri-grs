import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { CACHE_TAGS, serverCache } from "@/lib/cache";
import { getPaginationParams, paginatedJsonResponse } from "@/lib/pagination";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(request, 10);

    const search = searchParams.get("search")?.trim();
    const departmentId = searchParams.get("department_id")?.trim();
    const roleId = searchParams.get("role_id")?.trim();
    const status = searchParams.get("status")?.trim().toUpperCase();

    // Build dynamic Prisma where clause
    const conditions: Record<string, unknown>[] = [];

    if (search) {
      conditions.push({
        OR: [
          { first_name: { contains: search, mode: "insensitive" } },
          { last_name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { employee_code: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (departmentId && departmentId !== "ALL") {
      try {
        conditions.push({ department_id: BigInt(departmentId) });
      } catch {
        // Ignore invalid bigint
      }
    }

    if (roleId && roleId !== "ALL") {
      try {
        conditions.push({ role_id: BigInt(roleId) });
      } catch {
        // Ignore invalid bigint
      }
    }

    if (status && status !== "ALL") {
      conditions.push({ status });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const [total, users] = await Promise.all([
      prisma.users.count({ where }),
      prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        include: {
          roles: true,
          departments: true,
        },
      }),
    ]);

    const serialized = users.map((u) => ({
      user_id: u.user_id.toString(),
      employee_code: u.employee_code,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      role_name: u.roles.role_name,
      role_id: u.role_id.toString(),
      department_name: u.departments?.department_name || null,
      department_id: u.department_id ? u.department_id.toString() : null,
      status: u.status,
      created_at: u.created_at.toISOString(),
    }));

    return paginatedJsonResponse("users", serialized, total, page, limit);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error fetching users." },
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
    const {
      employee_code,
      first_name,
      last_name,
      email,
      password,
      role_id,
      department_id,
    } = body;

    if (!employee_code || !first_name || !email || !password || !role_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Employee code, first name, email, password, and role are required.",
        },
        { status: 400 },
      );
    }

    const trimmedCode = employee_code.trim().toUpperCase();
    const trimmedEmail = email.trim().toLowerCase();

    // Check duplicate code or email
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [{ employee_code: trimmedCode }, { email: trimmedEmail }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            existingUser.employee_code === trimmedCode
              ? `Employee code "${trimmedCode}" is already taken.`
              : `Email "${trimmedEmail}" is already registered.`,
        },
        { status: 409 },
      );
    }

    // Check role exists
    const roleId = BigInt(role_id);
    const role = await prisma.roles.findUnique({
      where: { role_id: roleId },
    });

    if (!role) {
      return NextResponse.json(
        { success: false, message: "Selected role does not exist." },
        { status: 404 },
      );
    }

    // Validate department if provided
    let departmentIdBigInt: bigint | null = null;
    if (department_id) {
      departmentIdBigInt = BigInt(department_id);
      const dept = await prisma.departments.findUnique({
        where: { department_id: departmentIdBigInt },
      });
      if (!dept) {
        return NextResponse.json(
          { success: false, message: "Selected department does not exist." },
          { status: 404 },
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.users.create({
        data: {
          employee_code: trimmedCode,
          first_name: first_name.trim(),
          last_name: last_name?.trim() || null,
          email: trimmedEmail,
          password_hash: passwordHash,
          role_id: roleId,
          department_id: departmentIdBigInt,
          status: "ACTIVE",
        },
        include: {
          roles: true,
          departments: true,
        },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "CREATE_USER",
          entity_type: "USER",
          entity_id: created.user_id,
          new_value: {
            employee_code: created.employee_code,
            name: `${created.first_name} ${created.last_name || ""}`.trim(),
            email: created.email,
            role: created.roles.role_name,
            department: created.departments?.department_name || null,
          },
        },
      });

      return created;
    });

    serverCache.invalidateTags([CACHE_TAGS.USERS]);

    return NextResponse.json({
      success: true,
      message: `User ${newUser.first_name} (${newUser.employee_code}) created successfully.`,
      user: {
        user_id: newUser.user_id.toString(),
        employee_code: newUser.employee_code,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role_name: newUser.roles.role_name,
        department_name: newUser.departments?.department_name || null,
        status: newUser.status,
        created_at: newUser.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error creating user." },
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
    const {
      user_id,
      first_name,
      last_name,
      email,
      role_id,
      department_id,
      status,
      reason,
      reason_category,
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, message: "user_id is required for update." },
        { status: 400 },
      );
    }

    const userIdBigInt = BigInt(user_id);

    // Prevent administrators from suspending their own active account
    if (status === "INACTIVE" && user.user_id === userIdBigInt) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Security restriction: You cannot suspend your own administrative account.",
        },
        { status: 400 },
      );
    }

    const existing = await prisma.users.findUnique({
      where: { user_id: userIdBigInt },
      include: { roles: true, departments: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    // Require reason when suspending an active user
    if (status === "INACTIVE" && existing.status === "ACTIVE") {
      const fullReason = [reason_category, reason].filter(Boolean).join(" - ");
      if (!fullReason.trim()) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A documented justification reason is required to suspend an account.",
          },
          { status: 400 },
        );
      }
    }

    const updateData: {
      first_name?: string;
      last_name?: string | null;
      email?: string;
      status?: string;
      role_id?: bigint;
      department_id?: bigint | null;
    } = {};

    if (first_name !== undefined) updateData.first_name = first_name.trim();
    if (last_name !== undefined)
      updateData.last_name = last_name?.trim() || null;
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (status !== undefined) updateData.status = status;

    if (role_id !== undefined) {
      const rId = BigInt(role_id);
      const roleExists = await prisma.roles.findUnique({
        where: { role_id: rId },
      });
      if (!roleExists) {
        return NextResponse.json(
          { success: false, message: "Role does not exist." },
          { status: 404 },
        );
      }
      updateData.role_id = rId;
    }

    if (department_id !== undefined) {
      if (department_id === null || department_id === "") {
        updateData.department_id = null;
      } else {
        const dId = BigInt(department_id);
        const deptExists = await prisma.departments.findUnique({
          where: { department_id: dId },
        });
        if (!deptExists) {
          return NextResponse.json(
            { success: false, message: "Department does not exist." },
            { status: 404 },
          );
        }
        updateData.department_id = dId;
      }
    }

    const isSuspending =
      status === "INACTIVE" && existing.status !== "INACTIVE";
    const isReactivating =
      status === "ACTIVE" && existing.status === "INACTIVE";
    const auditAction = isSuspending
      ? "SUSPEND_USER"
      : isReactivating
        ? "REACTIVATE_USER"
        : status !== undefined && status !== existing.status
          ? "TOGGLE_USER_STATUS"
          : "UPDATE_USER";

    const updatedUser = await prisma.$transaction(async (tx) => {
      const result = await tx.users.update({
        where: { user_id: userIdBigInt },
        data: updateData,
        include: { roles: true, departments: true },
      });

      // Immediately revoke all active sessions if user is being suspended
      if (isSuspending) {
        await tx.sessions.updateMany({
          where: { user_id: userIdBigInt, revoked_at: null },
          data: { revoked_at: new Date() },
        });
      }

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: auditAction,
          entity_type: "USER",
          entity_id: result.user_id,
          old_value: {
            name: `${existing.first_name} ${existing.last_name || ""}`.trim(),
            email: existing.email,
            role: existing.roles.role_name,
            department: existing.departments?.department_name || null,
            status: existing.status,
          },
          new_value: {
            name: `${result.first_name} ${result.last_name || ""}`.trim(),
            email: result.email,
            role: result.roles.role_name,
            department: result.departments?.department_name || null,
            status: result.status,
            ...(reason_category ? { reason_category } : {}),
            ...(reason ? { reason: reason.trim() } : {}),
          },
        },
      });

      return result;
    });

    serverCache.invalidateTags([CACHE_TAGS.USERS]);

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.first_name} updated successfully.`,
      user: {
        user_id: updatedUser.user_id.toString(),
        employee_code: updatedUser.employee_code,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        role_name: updatedUser.roles.role_name,
        department_name: updatedUser.departments?.department_name || null,
        status: updatedUser.status,
        created_at: updatedUser.created_at.toISOString(),
      },
    });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update user." },
      { status: 500 },
    );
  }
}
