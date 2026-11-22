import { type NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/permissions";
import {
  generateOperationalReport,
  getOperationalReportFilterOptions,
} from "@/lib/reports/operational-reports";
import type { OperationalReportFilters } from "@/types/reports";

export async function GET(request: NextRequest) {
  try {
    // 1. Authorize API with VIEW_REPORTS permission and required roles
    const auth = await authorizeApi({
      permission: "VIEW_REPORTS",
      role: ["ADMIN", "DEPARTMENT_HEAD"],
    });

    if ("error" in auth) {
      return auth.error;
    }

    const { user } = auth;

    // 2. Parse Query Parameters
    const searchParams = request.nextUrl.searchParams;

    const filters: OperationalReportFilters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      subcategoryId: searchParams.get("subcategoryId") || undefined,
      priority: searchParams.get("priority") || undefined,
      status: searchParams.get("status") || undefined,
      slaStatus: searchParams.get("slaStatus") || undefined,
      assignmentStatus:
        (searchParams.get("assignmentStatus") as
          | "ALL"
          | "ASSIGNED"
          | "UNASSIGNED") || undefined,
      search: searchParams.get("search") || undefined,
    };

    // 3. Generate Report Data and Filter Options in Parallel
    const [reportData, filterOptions] = await Promise.all([
      generateOperationalReport(filters, user),
      getOperationalReportFilterOptions(user),
    ]);

    return NextResponse.json({
      success: true,
      data: reportData,
      filterOptions,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to generate operational report";

    const isClientError =
      errorMessage.includes("Forbidden") ||
      errorMessage.includes("not authorized") ||
      errorMessage.includes("no assigned department");

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: isClientError ? 403 : 500 },
    );
  }
}
