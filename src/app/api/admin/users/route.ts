import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { invalidateUserSessionCache } from "@/lib/auth";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  validateCreateUserFields,
  validateEditUserFields,
} from "@/lib/validations/user-validations";
import type { SerializedUser } from "@/types/admin/users";

export async function GET() {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;

  try {
    const [rawUsers, rawRoles, rawDepartments] = await Promise.all([
      prisma.users.findMany({
        orderBy: { user_id: "desc" },
        include: {
          roles: true,
          departments: true,
          _count: {
            select: {
              assignments_assignments_staff_idTousers: true,
              grievances: true,
            },
          },
        },
      }),
      prisma.roles.findMany({
        where: { status: "ACTIVE" },
        orderBy: { role_id: "asc" },
      }),
      prisma.departments.findMany({
        where: { status: "ACTIVE" },
        orderBy: { department_name: "asc" },
      }),
    ]);

    const serializedUsers: SerializedUser[] = rawUsers.map((u) => ({
      user_id: u.user_id.toString(),
      employee_code: u.employee_code,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      role_id: u.role_id.toString(),
      role_name: u.roles.role_name,
      department_id: u.department_id ? u.department_id.toString() : null,
      department_name: u.departments ? u.departments.department_name : null,
      status: (u.status as "ACTIVE" | "INACTIVE" | "SUSPENDED") || "ACTIVE",
      created_at: u.created_at.toISOString(),
      assigned_grievances_count:
        u._count.assignments_assignments_staff_idTousers,
      filed_grievances_count: u._count.grievances,
    }));

    const availableRoles = rawRoles.map((r) => ({
      role_id: r.role_id.toString(),
      role_name: r.role_name,
      description: r.description,
    }));

    const availableDepartments = rawDepartments.map((d) => ({
      department_id: d.department_id.toString(),
      department_name: d.department_name,
    }));

    const stats = {
      total: serializedUsers.length,
      active: serializedUsers.filter((u) => u.status === "ACTIVE").length,
      inactive: serializedUsers.filter((u) => u.status === "INACTIVE").length,
      suspended: serializedUsers.filter((u) => u.status === "SUSPENDED").length,
      admins: serializedUsers.filter((u) => u.role_name === "ADMIN").length,
      departmentHeads: serializedUsers.filter(
        (u) => u.role_name === "DEPARTMENT_HEAD",
      ).length,
      staff: serializedUsers.filter((u) => u.role_name === "STAFF").length,
      endUsers: serializedUsers.filter((u) => u.role_name === "END_USER")
        .length,
    };

    return NextResponse.json({
      success: true,
      users: serializedUsers,
      roles: availableRoles,
      departments: availableDepartments,
      stats,
    });
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
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
      status,
    } = body;

    // Common User Validations
    const validation = validateCreateUserFields({
      employee_code,
      first_name,
      last_name,
      email,
      password,
    });

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return NextResponse.json(
        {
          success: false,
          message: firstError || "Invalid user inputs provided.",
        },
        { status: 400 },
      );
    }

    let targetRoleId: bigint;
    if (role_id) {
      const chosenRole = await prisma.roles.findUnique({
        where: { role_id: BigInt(role_id) },
      });
      if (!chosenRole) {
        return NextResponse.json(
          { success: false, message: "Invalid role specified." },
          { status: 400 },
        );
      }
      if (chosenRole.role_name === "STAFF" && !department_id) {
        return NextResponse.json(
          {
            success: false,
            message: "Department is required for Staff role.",
          },
          { status: 400 },
        );
      }
      targetRoleId = chosenRole.role_id;
    } else {
      const endUserRole = await prisma.roles.findFirst({
        where: { role_name: "END_USER" },
        select: { role_id: true },
      });
      if (!endUserRole) {
        return NextResponse.json(
          { success: false, message: "Default role 'END_USER' not found." },
          { status: 500 },
        );
      }
      targetRoleId = endUserRole.role_id;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedEmpCode = employee_code.trim().toUpperCase();

    // Check uniqueness of email and employee_code
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: { equals: normalizedEmail, mode: "insensitive" } },
          { employee_code: { equals: normalizedEmpCode, mode: "insensitive" } },
        ],
      },
    });

    if (existingUser) {
      const isEmailDup = existingUser.email.toLowerCase() === normalizedEmail;
      return NextResponse.json(
        {
          success: false,
          message: isEmailDup
            ? `User with email '${normalizedEmail}' already exists.`
            : `User with employee code '${normalizedEmpCode}' already exists.`,
        },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userStatus =
      status === "INACTIVE" || status === "SUSPENDED" ? status : "ACTIVE";

    const createdUser = await prisma.$transaction(async (tx) => {
      const newUser = await tx.users.create({
        data: {
          employee_code: normalizedEmpCode,
          first_name: first_name.trim(),
          last_name: last_name ? last_name.trim() : null,
          email: normalizedEmail,
          password_hash: passwordHash,
          role_id: targetRoleId,
          department_id: department_id ? BigInt(department_id) : null,
          status: userStatus,
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
          entity_id: newUser.user_id,
          new_value: {
            employee_code: newUser.employee_code,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            email: newUser.email,
            role_id: newUser.role_id.toString(),
            department_id: newUser.department_id
              ? newUser.department_id.toString()
              : null,
            status: newUser.status,
            created_by: user.email,
          },
        },
      });

      return newUser;
    });

    const serialized: SerializedUser = {
      user_id: createdUser.user_id.toString(),
      employee_code: createdUser.employee_code,
      first_name: createdUser.first_name,
      last_name: createdUser.last_name,
      email: createdUser.email,
      role_id: createdUser.role_id.toString(),
      role_name: createdUser.roles.role_name,
      department_id: createdUser.department_id
        ? createdUser.department_id.toString()
        : null,
      department_name: createdUser.departments
        ? createdUser.departments.department_name
        : null,
      status:
        (createdUser.status as "ACTIVE" | "INACTIVE" | "SUSPENDED") || "ACTIVE",
      created_at: createdUser.created_at.toISOString(),
      assigned_grievances_count: 0,
      filed_grievances_count: 0,
    };

    return NextResponse.json({
      success: true,
      message: `User '${createdUser.first_name} ${createdUser.last_name || ""}' (${createdUser.employee_code}) created successfully.`,
      user: serialized,
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
      employee_code,
      first_name,
      last_name,
      email,
      role_id,
      department_id,
      status,
    } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, message: "User ID is required." },
        { status: 400 },
      );
    }

    // Common User Validations on patch
    const patchValidation = validateEditUserFields({
      employee_code,
      first_name,
      last_name,
      email,
    });

    if (!patchValidation.isValid) {
      const firstError = Object.values(patchValidation.errors)[0];
      return NextResponse.json(
        {
          success: false,
          message: firstError || "Invalid user inputs provided.",
        },
        { status: 400 },
      );
    }

    const targetUserId = BigInt(user_id);
    const existing = await prisma.users.findUnique({
      where: { user_id: targetUserId },
      include: { roles: true, departments: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    // Check collision if email or employee_code are changing
    const normalizedEmail = email ? email.trim().toLowerCase() : undefined;
    const normalizedEmpCode = employee_code
      ? employee_code.trim().toUpperCase()
      : undefined;

    if (normalizedEmail || normalizedEmpCode) {
      const collision = await prisma.users.findFirst({
        where: {
          user_id: { not: targetUserId },
          OR: [
            ...(normalizedEmail
              ? [
                  {
                    email: {
                      equals: normalizedEmail,
                      mode: "insensitive" as const,
                    },
                  },
                ]
              : []),
            ...(normalizedEmpCode
              ? [
                  {
                    employee_code: {
                      equals: normalizedEmpCode,
                      mode: "insensitive" as const,
                    },
                  },
                ]
              : []),
          ],
        },
      });

      if (collision) {
        const isEmailDup =
          normalizedEmail && collision.email.toLowerCase() === normalizedEmail;
        return NextResponse.json(
          {
            success: false,
            message: isEmailDup
              ? `Another user with email '${normalizedEmail}' already exists.`
              : `Another user with employee code '${normalizedEmpCode}' already exists.`,
          },
          { status: 409 },
        );
      }
    }

    let roleUpdateId: bigint | undefined;
    if (role_id !== undefined || department_id !== undefined) {
      let activeRole = existing.roles;
      if (role_id) {
        const fetchedRole = await prisma.roles.findUnique({
          where: { role_id: BigInt(role_id) },
        });
        if (!fetchedRole) {
          return NextResponse.json(
            { success: false, message: "Invalid role specified." },
            { status: 400 },
          );
        }
        activeRole = fetchedRole;
        roleUpdateId = fetchedRole.role_id;
      }

      const effectiveDeptId =
        department_id !== undefined
          ? department_id
            ? BigInt(department_id)
            : null
          : existing.department_id;

      if (activeRole.role_name === "STAFF" && !effectiveDeptId) {
        return NextResponse.json(
          {
            success: false,
            message: "Department is required for Staff role.",
          },
          { status: 400 },
        );
      }

      if (effectiveDeptId) {
        const deptExists = await prisma.departments.findUnique({
          where: { department_id: effectiveDeptId },
        });
        if (!deptExists) {
          return NextResponse.json(
            { success: false, message: "Selected department does not exist." },
            { status: 400 },
          );
        }
      }
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.users.update({
        where: { user_id: targetUserId },
        data: {
          ...(normalizedEmpCode ? { employee_code: normalizedEmpCode } : {}),
          ...(first_name ? { first_name: first_name.trim() } : {}),
          ...(last_name !== undefined
            ? { last_name: last_name ? last_name.trim() : null }
            : {}),
          ...(normalizedEmail ? { email: normalizedEmail } : {}),
          ...(roleUpdateId
            ? { role_id: roleUpdateId }
            : role_id
              ? { role_id: BigInt(role_id) }
              : {}),
          ...(department_id !== undefined
            ? { department_id: department_id ? BigInt(department_id) : null }
            : {}),
          ...(status ? { status } : {}),
        },
        include: {
          roles: true,
          departments: true,
          _count: {
            select: {
              assignments_assignments_staff_idTousers: true,
              grievances: true,
            },
          },
        },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "UPDATE_USER",
          entity_type: "USER",
          entity_id: targetUserId,
          old_value: {
            employee_code: existing.employee_code,
            first_name: existing.first_name,
            last_name: existing.last_name,
            email: existing.email,
            role_id: existing.role_id.toString(),
            department_id: existing.department_id
              ? existing.department_id.toString()
              : null,
            status: existing.status,
          },
          new_value: {
            employee_code: updated.employee_code,
            first_name: updated.first_name,
            last_name: updated.last_name,
            email: updated.email,
            role_id: updated.role_id.toString(),
            department_id: updated.department_id
              ? updated.department_id.toString()
              : null,
            status: updated.status,
            updated_by: user.email,
          },
        },
      });

      if (status && status !== "ACTIVE" && existing.status === "ACTIVE") {
        const activeAssignments = await tx.assignments.findMany({
          where: {
            staff_id: targetUserId,
            assignment_status: "ASSIGNED",
            grievances: {
              status: { notIn: ["CLOSED", "RESOLVED"] },
            },
          },
          include: {
            grievances: {
              select: {
                grievance_id: true,
                grievance_number: true,
                title: true,
              },
            },
          },
        });

        if (activeAssignments.length > 0) {
          const deptId = updated.department_id || existing.department_id;
          if (deptId) {
            const departmentHeads = await tx.users.findMany({
              where: {
                department_id: deptId,
                roles: { role_name: "DEPARTMENT_HEAD" },
                status: "ACTIVE",
              },
              select: { user_id: true },
            });

            const staffFullName =
              `${updated.first_name} ${updated.last_name || ""}`.trim();
            for (const head of departmentHeads) {
              for (const asgn of activeAssignments) {
                await tx.notifications.create({
                  data: {
                    user_id: head.user_id,
                    notification_type: "STAFF_DEACTIVATED",
                    channel: "IN_APP",
                    title: `Staff Deactivated: ${staffFullName}`,
                    message: `Staff member ${staffFullName} was deactivated by Admin. Case ${asgn.grievances.grievance_number} requires immediate reassignment.`,
                    grievance_id: asgn.grievances.grievance_id,
                    status: "PENDING",
                  },
                });

                await tx.audit_logs.create({
                  data: {
                    user_id: user.user_id,
                    grievance_id: asgn.grievances.grievance_id,
                    action: "STAFF_DEACTIVATED_REASSIGNMENT_REQUIRED",
                    entity_type: "GRIEVANCE",
                    entity_id: asgn.grievances.grievance_id,
                    new_value: {
                      staffId: targetUserId.toString(),
                      staffName: staffFullName,
                      reason:
                        "Assigned staff member was deactivated by Admin. Reassignment required.",
                      deactivatedBy: user.email,
                    },
                  },
                });
              }
            }
          }
        }
      }

      return updated;
    });

    invalidateUserSessionCache(targetUserId);

    const serialized: SerializedUser = {
      user_id: updatedUser.user_id.toString(),
      employee_code: updatedUser.employee_code,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      email: updatedUser.email,
      role_id: updatedUser.role_id.toString(),
      role_name: updatedUser.roles.role_name,
      department_id: updatedUser.department_id
        ? updatedUser.department_id.toString()
        : null,
      department_name: updatedUser.departments
        ? updatedUser.departments.department_name
        : null,
      status:
        (updatedUser.status as "ACTIVE" | "INACTIVE" | "SUSPENDED") || "ACTIVE",
      created_at: updatedUser.created_at.toISOString(),
      assigned_grievances_count:
        updatedUser._count.assignments_assignments_staff_idTousers,
      filed_grievances_count: updatedUser._count.grievances,
    };

    return NextResponse.json({
      success: true,
      message: `User '${serialized.first_name} ${serialized.last_name || ""}' updated successfully.`,
      user: serialized,
    });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error updating user." },
      { status: 500 },
    );
  }
}
