import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { CACHE_TAGS, serverCache } from "@/lib/cache";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;

  try {
    const users = await prisma.users.findMany({
      orderBy: { created_at: "desc" },
      include: {
        roles: true,
        departments: true,
      },
    });

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

    return NextResponse.json({ success: true, users: serialized });
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
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, message: "user_id is required for update." },
        { status: 400 },
      );
    }

    const userIdBigInt = BigInt(user_id);
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

    const updatedUser = await prisma.$transaction(async (tx) => {
      const result = await tx.users.update({
        where: { user_id: userIdBigInt },
        data: updateData,
        include: { roles: true, departments: true },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action:
            status !== undefined && status !== existing.status
              ? "TOGGLE_USER_STATUS"
              : "UPDATE_USER",
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
