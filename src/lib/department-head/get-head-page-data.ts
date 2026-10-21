import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function getDepartmentHeadPageData() {
  const user = await requirePageRole(["DEPARTMENT_HEAD", "ADMIN"]);
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const isAdmin = user.roles.role_name === "ADMIN";

  let deptName = user.departments?.department_name;
  let hodName = fullName;
  let hodEmail = user.email;
  let employeeCode = user.employee_code || "HOD-DEPT-01";

  // If Admin previewing without an assigned department, resolve to first active department in DB
  if (!deptName && isAdmin) {
    const firstDept = await prisma.departments.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { department_id: "asc" },
      include: {
        users: {
          where: { roles: { role_name: "DEPARTMENT_HEAD" }, status: "ACTIVE" },
          take: 1,
        },
      },
    });

    if (firstDept) {
      deptName = firstDept.department_name;
      if (firstDept.users[0]) {
        const head = firstDept.users[0];
        hodName = `${head.first_name} ${head.last_name || ""}`.trim();
        hodEmail = head.email;
        employeeCode = head.employee_code || "HOD-DEPT-01";
      }
    }
  }

  const finalDeptName = deptName || "Department Operations";

  return {
    finalDeptName,
    hodName,
    hodEmail,
    employeeCode,
    isAdmin,
  };
}
