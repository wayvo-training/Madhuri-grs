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
    const { department_name, description } = body;

    if (!department_name || !department_name.trim()) {
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

    const department = await prisma.$transaction(async (tx) => {
      const created = await tx.departments.create({
        data: {
          department_name: trimmedName,
          description: description?.trim() || null,
          status: "ACTIVE",
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
