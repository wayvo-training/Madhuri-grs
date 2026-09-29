import { useState, useMemo } from "react";
import { type SortState } from "@/components/ui/sortable-table-head";

export function useTableSort<T>(items: T[], defaultSort?: SortState) {
  const [sortState, setSortState] = useState<SortState>(
    defaultSort || { field: null, direction: null }
  );

  const handleSort = (field: string, direction: SortState["direction"]) => {
    setSortState({ field, direction });
  };

  const sortedItems = useMemo(() => {
    if (!sortState.field || !sortState.direction) return items;
    
    return [...items].sort((a, b) => {
      let valA: any = a[sortState.field as keyof T] || "";
      let valB: any = b[sortState.field as keyof T] || "";
      
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      
      if (valA < valB) return sortState.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortState.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [items, sortState]);

  return { sortState, handleSort, sortedItems };
}
