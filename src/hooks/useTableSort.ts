import { useMemo, useState } from "react";
import type { SortState } from "@/components/ui/sortable-table-head";

export function useTableSort<T>(items: T[], defaultSort?: SortState) {
  const [sortState, setSortState] = useState<SortState>(
    defaultSort || { field: null, direction: null },
  );

  const handleSort = (field: string, direction: SortState["direction"]) => {
    setSortState({ field, direction });
  };

  const sortedItems = useMemo(() => {
    if (!sortState.field || !sortState.direction) return items;

    return [...items].sort((a, b) => {
      let valA: any = a[sortState.field as keyof T] || "";
      let valB: any = b[sortState.field as keyof T] || "";

      // Special handling for date fields
      if (sortState.field === "timestamp" || sortState.field === "createdAt") {
        const timeA = new Date(valA).getTime();
        const timeB = new Date(valB).getTime();
        if (!isNaN(timeA) && !isNaN(timeB)) {
          if (timeA < timeB) return sortState.direction === "asc" ? -1 : 1;
          if (timeA > timeB) return sortState.direction === "asc" ? 1 : -1;
          return 0;
        }
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortState.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortState.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [items, sortState]);

  return { sortState, handleSort, sortedItems };
}
