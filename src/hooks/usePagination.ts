"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface UsePaginationOptions {
  initialPageSize?: number;
  pageSizeOptions?: number[];
  serverSide?: boolean; // If true, syncs with URL search params and assumes items are pre-sliced
  totalCount?: number; // Must be provided if serverSide is true
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {},
) {
  const { 
    initialPageSize = 10, 
    pageSizeOptions = [5, 10, 20, 50],
    serverSide = false,
    totalCount: explicitTotalCount
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [localPage, setLocalPage] = useState(1);
  const [localSize, setLocalSize] = useState(initialPageSize);

  const currentPage = serverSide ? (Number(searchParams.get("page")) || 1) : localPage;
  const pageSize = serverSide ? (Number(searchParams.get("limit")) || initialPageSize) : localSize;

  const totalCount = explicitTotalCount ?? items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = useMemo(() => {
    // If true server-side pagination, items are already sliced by the backend
    if (serverSide) return items;
    
    const startIndex = (safePage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, safePage, pageSize, serverSide]);

  const onPageChange = useCallback((page: number) => {
    if (serverSide) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(pathname + '?' + params.toString(), { scroll: false });
    } else {
      setLocalPage(page);
    }
  }, [serverSide, router, pathname, searchParams]);

  const onPageSizeChange = useCallback((newSize: number) => {
    if (serverSide) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("limit", newSize.toString());
      params.set("page", "1");
      router.push(pathname + '?' + params.toString(), { scroll: false });
    } else {
      setLocalSize(newSize);
      setLocalPage(1);
    }
  }, [serverSide, router, pathname, searchParams]);

  const resetPage = useCallback(() => {
    if (serverSide) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      router.push(pathname + '?' + params.toString(), { scroll: false });
    } else {
      setLocalPage(1);
    }
  }, [serverSide, router, pathname, searchParams]);

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
