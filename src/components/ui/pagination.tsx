"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  isLoading?: boolean;
  className?: string;
  compact?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions,
  itemLabel = "records",
  isLoading = false,
  className = "",
  compact = false,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  // Sync parent back to a valid page if currentPage was out of bounds
  useEffect(() => {
    if (totalCount > 0 && currentPage > safeTotalPages && safeTotalPages > 0) {
      onPageChange(safeTotalPages);
    } else if (totalCount > 0 && currentPage < 1) {
      onPageChange(1);
    }
  }, [currentPage, safeTotalPages, totalCount, onPageChange]);

  if (totalCount === 0) return null;

  const startRecord = Math.min(
    (safeCurrentPage - 1) * pageSize + 1,
    totalCount,
  );
  const endRecord = Math.min(safeCurrentPage * pageSize, totalCount);

  // Generate page numbers to display with smart windowing
  const getPageNumbers = () => {
    if (safeTotalPages <= 5) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }
    if (safeCurrentPage <= 3) {
      return [1, 2, 3, 4, "...", safeTotalPages];
    }
    if (safeCurrentPage >= safeTotalPages - 2) {
      return [
        1,
        "...",
        safeTotalPages - 3,
        safeTotalPages - 2,
        safeTotalPages - 1,
        safeTotalPages,
      ];
    }
    return [
      1,
      "...",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "...",
      safeTotalPages,
    ];
  };

  const handlePageSizeChange = (newSize: number) => {
    onPageSizeChange?.(newSize);
    onPageChange(1);
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 bg-white dark:bg-slate-900 px-4 py-3 sm:px-5 relative z-10 shadow-xs ${className}`}
    >
      {/* Record summary */}
      <div className="text-xs text-slate-500 font-medium">
        Showing{" "}
        <span className="font-semibold text-slate-800">{startRecord}</span> to{" "}
        <span className="font-semibold text-slate-800">{endRecord}</span> of{" "}
        <span className="font-semibold text-slate-800">{totalCount}</span>{" "}
        {itemLabel}
      </div>

      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
        {/* Optional Page Size Selector */}
        {onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 1 && (
          <div className="flex items-center gap-1.5 mr-2 text-xs text-slate-500">
            <span className="hidden sm:inline">Per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                if (val) handlePageSizeChange(Number(val));
              }}
            >
              <SelectTrigger
                aria-label="Items per page"
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] cursor-pointer min-w-16"
              >
                <SelectValue placeholder={String(pageSize)}>
                  {pageSize}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-50 bg-white border border-slate-200 shadow-lg min-w-16">
                {pageSizeOptions.map((opt) => (
                  <SelectItem
                    key={opt}
                    value={String(opt)}
                    className="text-xs cursor-pointer"
                  >
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="inline-flex items-center gap-1">
          {/* First page button for larger datasets */}
          {safeTotalPages > 5 && !compact && (
            <button
              type="button"
              disabled={safeCurrentPage <= 1 || isLoading}
              onClick={() => onPageChange(1)}
              title="First Page"
              aria-label="First Page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Previous page button */}
          <button
            type="button"
            disabled={safeCurrentPage <= 1 || isLoading}
            onClick={() => onPageChange(safeCurrentPage - 1)}
            title="Previous Page"
            aria-label="Previous Page"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className={compact ? "sr-only" : ""}>Prev</span>
          </button>

          {/* Page numbers (only when safeTotalPages > 1) */}
          {safeTotalPages > 1 && !compact && (
            <div className="hidden sm:flex items-center gap-1">
              {getPageNumbers().map((p, idx) => {
                if (p === "...") {
                  const ellipsisKey =
                    idx < 3 ? "ellipsis-start" : "ellipsis-end";
                  return (
                    <span
                      key={ellipsisKey}
                      className="px-1 text-xs text-slate-400 select-none"
                    >
                      ...
                    </span>
                  );
                }
                const pageNum = Number(p);
                const isActive = pageNum === safeCurrentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    disabled={isLoading}
                    onClick={() => onPageChange(pageNum)}
                    className={`inline-flex h-8 min-w-8 px-2 items-center justify-center rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? "bg-[#0F766E] text-white shadow-2xs font-bold"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          )}

          {/* Compact page display indicator */}
          {(compact || safeTotalPages <= 1) && (
            <span className="px-2 text-xs font-medium text-slate-600 select-none">
              Page {safeCurrentPage} of {safeTotalPages}
            </span>
          )}

          {/* Next page button */}
          <button
            type="button"
            disabled={safeCurrentPage >= safeTotalPages || isLoading}
            onClick={() => onPageChange(safeCurrentPage + 1)}
            title="Next Page"
            aria-label="Next Page"
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition"
          >
            <span className={compact ? "sr-only" : ""}>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>

          {/* Last page button for larger datasets */}
          {safeTotalPages > 5 && !compact && (
            <button
              type="button"
              disabled={safeCurrentPage >= safeTotalPages || isLoading}
              onClick={() => onPageChange(safeTotalPages)}
              title="Last Page"
              aria-label="Last Page"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
