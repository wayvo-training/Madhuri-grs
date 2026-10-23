import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type {
  DepartmentHeadInitialData,
  EscalationAuditRecord,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";
import {
  fetchDepartmentHeadGrievances,
  fetchDepartmentHeadOverview,
  fetchDepartmentHeadStaff,
} from "./loaders";

export interface DepartmentHeadPageDataResult {
  finalDeptName: string;
  hodName: string;
  hodEmail: string;
  employeeCode: string;
  isAdmin: boolean;
  initialData: DepartmentHeadInitialData;
}

export async function getDepartmentHeadPageData(options?: {
  deptId?: string;
  page?: number;
  limit?: number;
  tab?: string;
  search?: string;
  priority?: string;
  staffId?: string;
}): Promise<DepartmentHeadPageDataResult> {
  const user = await requirePageRole(["DEPARTMENT_HEAD", "ADMIN"]);
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const isAdmin = user.roles.role_name === "ADMIN";

  const page = options?.page ? Math.max(1, options.page) : 1;
  const limit = options?.limit ? Math.max(1, options.limit) : 5;
  const skip = (page - 1) * limit;

  let deptName = user.departments?.department_name;
  let hodName = fullName;
  let hodEmail = user.email;
  let employeeCode = user.employee_code || "HOD-DEPT-01";

  let targetDeptId: bigint | null = user.department_id
    ? BigInt(user.department_id)
    : null;

  if (isAdmin && options?.deptId) {
    try {
      targetDeptId = BigInt(options.deptId);
    } catch {
      // ignore invalid deptId format
    }
  }

  // If Admin previewing or user has targetDeptId specified
  if (targetDeptId) {
    const dept = await prisma.departments.findUnique({
      where: { department_id: targetDeptId },
      include: {
        users: {
          where: { roles: { role_name: "DEPARTMENT_HEAD" }, status: "ACTIVE" },
          take: 1,
        },
      },
    });

    if (dept) {
      deptName = dept.department_name;
      if (isAdmin && dept.users[0]) {
        const head = dept.users[0];
        hodName = `${head.first_name} ${head.last_name || ""}`.trim();
        hodEmail = head.email;
        employeeCode = head.employee_code || "HOD-DEPT-01";
      }
    }
  } else {
    // Resolve to first active department in DB if unassigned
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
      targetDeptId = firstDept.department_id;
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
  const validDeptId = targetDeptId || BigInt(1);

  // Fetch full department head data in parallel on the server with exact requested page limit
  const [overviewData, grievancesData, staffData] = await Promise.all([
    fetchDepartmentHeadOverview(validDeptId),
    fetchDepartmentHeadGrievances({
      departmentId: validDeptId,
      user,
      isAdmin,
      tab: options?.tab,
      search: options?.search,
      priority: options?.priority,
      staffId: options?.staffId,
      skip,
      limit,
    }),
    fetchDepartmentHeadStaff(validDeptId),
  ]);

  if (overviewData.department?.name) {
    deptName = overviewData.department.name;
  }
  if (overviewData.head && isAdmin) {
    hodName = overviewData.head.name;
    hodEmail = overviewData.head.email;
    employeeCode = overviewData.head.employeeCode;
  }

  return {
    finalDeptName: deptName || finalDeptName,
    hodName,
    hodEmail,
    employeeCode,
    isAdmin,
    initialData: {
      grievances: grievancesData.items,
      staffList: staffData.staff,
      governanceAuditFeed: overviewData.auditFeed,
      availableDepartments: overviewData.availableDepartments,
      selectedDeptId: validDeptId.toString(),
      totalCount: grievancesData.total,
      page,
      limit,
    },
  };
}
