import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await authorizeApi({ role: "ADMIN" });
  if ("error" in auth) return auth.error;

  try {
    const departments = await prisma.departments.findMany({
      orderBy: { department_name: "asc" },
      include: {
        _count: {
          select: {
            users: true,
            grievance_departments: true,
          },
        },
      },
    });

    const serialized = departments.map((d) => ({
      department_id: d.department_id.toString(),
      department_name: d.department_name,
      description: d.description,
      status: d.status,
      user_count: d._count.users,
      grievance_count: d._count.grievance_departments,
      created_at: d.created_at.toISOString(),
    }));

    return NextResponse.json({ success: true, departments: serialized });
  } catch (error) {
    console.error("Failed to fetch departments:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error fetching departments.",
      },
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
    const { department_name, description, status } = body;

    if (!department_name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Department name is required." },
        { status: 400 },
      );
    }

    const trimmedName = department_name.trim();

    // Check duplicate
    const existing = await prisma.departments.findFirst({
      where: { department_name: { equals: trimmedName, mode: "insensitive" } },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `Department "${trimmedName}" already exists.`,
        },
        { status: 409 },
      );
    }

    const departmentStatus = status === "INACTIVE" ? "INACTIVE" : "ACTIVE";

    const department = await prisma.$transaction(async (tx) => {
      const created = await tx.departments.create({
        data: {
          department_name: trimmedName,
          description: description?.trim() || null,
          status: departmentStatus,
        },
      });

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action: "CREATE_DEPARTMENT",
          entity_type: "DEPARTMENT",
          entity_id: created.department_id,
          new_value: {
            department_name: created.department_name,
            description: created.description,
            status: created.status,
          },
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      message: `Department "${department.department_name}" created successfully.`,
      department: {
        department_id: department.department_id.toString(),
        department_name: department.department_name,
        description: department.description,
        status: department.status,
        user_count: 0,
        grievance_count: 0,
      },
    });
  } catch (error) {
    console.error("Failed to create department:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error creating department." },
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
    const { department_id, department_name, description, status } = body;

    if (!department_id) {
      return NextResponse.json(
        { success: false, message: "Department ID is required." },
        { status: 400 },
      );
    }

    let deptId: bigint;
    try {
      deptId = BigInt(department_id);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid department ID." },
        { status: 400 },
      );
    }

    const existing = await prisma.departments.findUnique({
      where: { department_id: deptId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Department not found." },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      const upperStatus = status.trim().toUpperCase();
      if (!["ACTIVE", "INACTIVE"].includes(upperStatus)) {
        return NextResponse.json(
          { success: false, message: "Status must be ACTIVE or INACTIVE." },
          { status: 400 },
        );
      }
      updateData.status = upperStatus;
    }

    if (department_name !== undefined) {
      const trimmedName = department_name.trim();
      if (!trimmedName) {
        return NextResponse.json(
          { success: false, message: "Department name cannot be empty." },
          { status: 400 },
        );
      }
      if (
        trimmedName.toLowerCase() !== existing.department_name.toLowerCase()
      ) {
        const duplicate = await prisma.departments.findFirst({
          where: {
            department_name: { equals: trimmedName, mode: "insensitive" },
            department_id: { not: deptId },
          },
        });
        if (duplicate) {
          return NextResponse.json(
            {
              success: false,
              message: `Department "${trimmedName}" already exists.`,
            },
            { status: 409 },
          );
        }
      }
      updateData.department_name = trimmedName;
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    updateData.updated_at = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const dept = await tx.departments.update({
        where: { department_id: deptId },
        data: updateData,
        include: {
          _count: {
            select: { users: true, grievance_departments: true },
          },
        },
      });

      const action =
        status && status !== existing.status
          ? status === "ACTIVE"
            ? "ACTIVATE_DEPARTMENT"
            : "DEACTIVATE_DEPARTMENT"
          : "UPDATE_DEPARTMENT";

      await tx.audit_logs.create({
        data: {
          user_id: user.user_id,
          action,
          entity_type: "DEPARTMENT",
          entity_id: dept.department_id,
          old_value: {
            department_name: existing.department_name,
            description: existing.description,
            status: existing.status,
          },
          new_value: {
            department_name: dept.department_name,
            description: dept.description,
            status: dept.status,
          },
        },
      });

      return dept;
    });

    return NextResponse.json({
      success: true,
      message: `Department "${updated.department_name}" updated successfully.`,
      department: {
        department_id: updated.department_id.toString(),
        department_name: updated.department_name,
        description: updated.description,
        status: updated.status,
        user_count: updated._count.users,
        grievance_count: updated._count.grievance_departments,
      },
    });
  } catch (error) {
    console.error("Failed to update department:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error updating department." },
      { status: 500 },
    );
  }
}
