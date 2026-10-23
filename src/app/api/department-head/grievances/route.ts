import { NextResponse } from "next/server";
import { resolveDepartmentHeadAuth } from "@/lib/department-head";
import { fetchDepartmentHeadGrievances } from "@/lib/department-head/loaders";
import { getPaginationParams, paginatedJsonResponse } from "@/lib/pagination";

export async function GET(request: Request) {
  const auth = await resolveDepartmentHeadAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const { user, departmentId, isAdmin } = auth;
  const { searchParams } = new URL(request.url);
  const { page, limit, skip } = getPaginationParams(request, 20);

  const tab = (searchParams.get("tab") || "ALL").toUpperCase();
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const priority = (searchParams.get("priority") || "ALL").toUpperCase();
  const staffId = searchParams.get("staffId") || "ALL";

  try {
    const { items, total } = await fetchDepartmentHeadGrievances({
      departmentId,
      user,
      isAdmin,
      tab,
      search,
      priority,
      staffId,
      skip,
      limit,
    });

    return paginatedJsonResponse("grievances", items, total, page, limit);
  } catch (error) {
    console.error("Error in /api/department-head/grievances:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch grievances",
      },
      { status: 500 },
    );
  }
}
