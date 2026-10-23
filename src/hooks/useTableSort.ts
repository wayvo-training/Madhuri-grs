import { useMemo, useState } from "react";
import type { SortState } from "@/components/ui/sortable-table-head";

export function useTableSort<T>(
  items: T[],
  defaultSort?: SortState,
): {
  sortState: SortState;
  handleSort: (field: string, direction: SortState["direction"]) => void;
  sortedItems: T[];
} {
  const [sortState, setSortState] = useState<SortState>(
    defaultSort || { field: null, direction: null },
  );

  const handleSort = (field: string, direction: SortState["direction"]) => {
    setSortState({ field, direction });
  };

  const sortedItems = useMemo((): T[] => {
    if (!sortState.field || !sortState.direction) return items;

    return [...items].sort((a, b) => {
      const rawA = a[sortState.field as keyof T];
      const rawB = b[sortState.field as keyof T];

      const valA: unknown = rawA ?? "";
      const valB: unknown = rawB ?? "";

      // Special handling for date fields
      if (sortState.field === "timestamp" || sortState.field === "createdAt") {
        const timeA = new Date(String(valA)).getTime();
        const timeB = new Date(String(valB)).getTime();
        if (!Number.isNaN(timeA) && !Number.isNaN(timeB)) {
          if (timeA < timeB) return sortState.direction === "asc" ? -1 : 1;
          if (timeA > timeB) return sortState.direction === "asc" ? 1 : -1;
          return 0;
        }
      }

      // Special handling for numbers and numeric strings
      const numA =
        typeof valA === "number"
          ? valA
          : typeof valA === "string" && valA.trim() !== ""
            ? Number(valA)
            : NaN;
      const numB =
        typeof valB === "number"
          ? valB
          : typeof valB === "string" && valB.trim() !== ""
            ? Number(valB)
            : NaN;
      if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
        if (numA < numB) return sortState.direction === "asc" ? -1 : 1;
        if (numA > numB) return sortState.direction === "asc" ? 1 : -1;
        return 0;
      }

      const strA = typeof valA === "string" ? valA : String(valA);
      const strB = typeof valB === "string" ? valB : String(valB);

      const comparison = strA.localeCompare(strB, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return sortState.direction === "asc" ? comparison : -comparison;
    });
  }, [items, sortState]);

  return { sortState, handleSort, sortedItems };
}
