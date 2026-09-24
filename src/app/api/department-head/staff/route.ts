import { NextResponse } from "next/server";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await resolveDepartmentHeadAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { departmentId } = auth;

  try {
    const rawStaff = await prisma.users.findMany({
      where: {
        department_id: departmentId,
        roles: {
          role_name: { in: ["STAFF", "DEPARTMENT_HEAD"] },
        },
      },
      include: {
        roles: true,
        departments: true,
        assignments_assignments_staff_idTousers: {
          where: {
            assignment_status: "ASSIGNED",
          },
          select: {
            assignment_id: true,
          },
        },
      },
      orderBy: [{ role_id: "desc" }, { first_name: "asc" }],
    });

    const staffMembers = rawStaff.map((u) => {
      const activeTickets = u.assignments_assignments_staff_idTousers.length;
      const maxCapacity = 8;

      let status: "ACTIVE" | "ON_LEAVE" | "BUSY" = "ACTIVE";
      if (u.status === "ON_LEAVE" || u.status === "INACTIVE") {
        status = "ON_LEAVE";
      } else if (activeTickets >= maxCapacity) {
        status = "BUSY";
      }

      const roleDisplay =
        u.roles.role_name === "DEPARTMENT_HEAD"
          ? "Department Head"
          : "Grievance Officer";

      return {
        id: u.user_id.toString(),
        name: `${u.first_name} ${u.last_name || ""}`.trim(),
        designation: `${roleDisplay} (${u.departments?.department_name || "Operations"})`,
        email: u.email,
        activeTickets,
        maxCapacity,
        status,
      };
    });

    return NextResponse.json({
      success: true,
      staff: staffMembers,
    });
  } catch (error) {
    console.error("Error in /api/department-head/staff:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch department staff",
      },
      { status: 500 },
    );
  }
}
