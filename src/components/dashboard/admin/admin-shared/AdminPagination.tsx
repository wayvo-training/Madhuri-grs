import { ChevronLeft, ChevronRight } from "lucide-react";

export interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  isLoading = false,
}: AdminPaginationProps) {
  if (totalCount === 0 || totalPages <= 1) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 sm:px-6">
      <div className="text-xs text-slate-500">
        Showing{" "}
        <span className="font-semibold text-slate-800">{startRecord}</span> to{" "}
        <span className="font-semibold text-slate-800">{endRecord}</span> of{" "}
        <span className="font-semibold text-slate-800">{totalCount}</span>{" "}
        records
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          type="button"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Previous</span>
        </button>

        <span className="px-2 text-xs font-medium text-slate-600">
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
        >
          <span>Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
