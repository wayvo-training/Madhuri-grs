"use client";

import { useCallback, useMemo, useState } from "react";

export interface UsePaginationOptions {
  initialPageSize?: number;
  pageSizeOptions?: number[];
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {},
) {
  const { initialPageSize = 10, pageSizeOptions = [5, 10, 20, 50] } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Keep currentPage strictly within valid boundaries
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, safePage, pageSize]);

  const onPageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const onPageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage: safePage,
    pageSize,
    totalPages,
    totalCount,
    paginatedItems,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions,
    resetPage,
  };
}
