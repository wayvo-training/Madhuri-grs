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

  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none bg-transparent hover:bg-slate-100/70 transition-colors group",
        className,
      )}
      onClick={handleToggle}
      {...props}
    >
      <div className="flex items-center gap-1.5">
        <span>{children}</span>
        <span className="flex flex-col items-center justify-center shrink-0">
          {direction === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 text-emerald-600 font-bold" />
          ) : direction === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5 text-emerald-600 font-bold" />
          ) : (
            <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
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

  return (
    <th
      className={cn(
        "cursor-pointer select-none bg-transparent hover:bg-slate-100/70 transition-colors group",
        className,
      )}
      onClick={handleToggle}
      {...props}
    >
      <div className="flex items-center gap-1.5">
        <span>{children}</span>
        <span className="flex flex-col items-center justify-center shrink-0">
          {direction === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 text-emerald-600 font-bold" />
          ) : direction === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5 text-emerald-600 font-bold" />
          ) : (
            <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </span>
      </div>
    </th>
  );
}
