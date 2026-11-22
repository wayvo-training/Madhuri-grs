import { type NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/permissions";
import { generateResolutionAnalytics } from "@/lib/reports/resolution-reports";
import type { ResolutionAnalyticsFilters } from "@/types/reports";

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

    const filters: ResolutionAnalyticsFilters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      subcategoryId: searchParams.get("subcategoryId") || undefined,
      priority: searchParams.get("priority") || undefined,
    };

    // 3. Generate Resolution Analytics
    const result = await generateResolutionAnalytics(filters, user);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      filterOptions: result.filterOptions,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to generate resolution analytics report";

    const isClientError =
      errorMessage.includes("Forbidden") ||
      errorMessage.includes("Unauthorized");

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: isClientError ? 403 : 500 },
    );
  }
}
