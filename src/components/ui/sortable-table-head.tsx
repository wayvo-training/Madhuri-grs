import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type React from "react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  field: string | null;
  direction: SortDirection;
}

interface SortableTableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  field: string;
  currentSort: SortState;
  onSort: (field: string, direction: SortDirection) => void;
  children: React.ReactNode;
}

export function SortableTableHead({
  field,
  currentSort,
  onSort,
  children,
  className,
  ...props
}: SortableTableHeadProps) {
  const isSorted = currentSort.field === field;
  const direction = isSorted ? currentSort.direction : null;

  const handleToggle = () => {
    if (!isSorted) {
      onSort(field, "asc");
    } else if (direction === "asc") {
      onSort(field, "desc");
    } else {
      onSort(field, null);
    }
  };

  const isCenter = className?.includes("text-center");
  const isRight = className?.includes("text-right");
  const justifyClass = isCenter
    ? "justify-center"
    : isRight
      ? "justify-end"
      : "justify-start";

  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none bg-slate-50 dark:bg-slate-800/95 text-slate-600 dark:text-slate-400 hover:bg-slate-100/90 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors duration-150 group whitespace-nowrap",
        className,
      )}
      onClick={handleToggle}
      {...props}
    >
      <div className={cn("flex items-center gap-1.5 w-full", justifyClass)}>
        <span className="whitespace-nowrap select-none">{children}</span>
        <span className="flex flex-col items-center justify-center shrink-0">
          {direction === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 font-bold" />
          ) : direction === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 font-bold" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-all duration-150" />
          )}
        </span>
      </div>
    </TableHead>
  );
}

export function SortableTh({
  field,
  currentSort,
  onSort,
  children,
  className,
  ...props
}: SortableTableHeadProps) {
  const isSorted = currentSort.field === field;
  const direction = isSorted ? currentSort.direction : null;

  const handleToggle = () => {
    if (!isSorted) {
      onSort(field, "asc");
    } else if (direction === "asc") {
      onSort(field, "desc");
    } else {
      onSort(field, null);
    }
  };

  const isCenter = className?.includes("text-center");
  const isRight = className?.includes("text-right");
  const justifyClass = isCenter
    ? "justify-center"
    : isRight
      ? "justify-end"
      : "justify-start";

  return (
    <th
      className={cn(
        "cursor-pointer select-none bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors duration-150 group whitespace-nowrap",
        className,
      )}
      onClick={handleToggle}
      {...props}
    >
      <div className={cn("flex items-center gap-1.5 w-full", justifyClass)}>
        <span className="whitespace-nowrap select-none">{children}</span>
        <span className="flex flex-col items-center justify-center shrink-0">
          {direction === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 font-bold" />
          ) : direction === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 font-bold" />
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-all duration-150" />
          )}
        </span>
      </div>
    </th>
  );
}
