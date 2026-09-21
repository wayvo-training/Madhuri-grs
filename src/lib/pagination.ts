import { NextResponse } from "next/server";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Extracts and sanitizes standard pagination parameters from a Next.js Request.
 */
export function getPaginationParams(
  request: Request,
  defaultLimit = 10,
): PaginationParams {
  const { searchParams } = new URL(request.url);
  const rawPage = searchParams.get("page");
  const rawLimit = searchParams.get("limit");

  const parsedPage = rawPage ? Number.parseInt(rawPage, 10) : 1;
  const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : defaultLimit;

  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit =
    Number.isInteger(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, 100)
      : defaultLimit;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Formats a standardized JSON response envelope with pagination metadata.
 */
export function paginatedJsonResponse<T>(
  dataKey: string,
  data: T[],
  total: number,
  page: number,
  limit: number,
  extraMeta?: Record<string, unknown>,
) {
  const totalPages = Math.ceil(total / limit) || 1;

  return NextResponse.json({
    success: true,
    [dataKey]: data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    ...extraMeta,
  });
}
