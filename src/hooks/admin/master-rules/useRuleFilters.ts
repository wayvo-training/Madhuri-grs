import { useEffect, useMemo, useState } from "react";
import type {
  FilterMode,
  SearchCondition,
} from "@/components/ui/advanced-table-search";
import type {
  MainTab,
  SerializedRoutingRule,
} from "@/types/admin/master-rules";

export interface UseRuleFiltersParams {
  routingRules: SerializedRoutingRule[];
}

export function useRuleFilters({ routingRules }: UseRuleFiltersParams) {
  const [activeTab, setActiveTab] = useState<MainTab>("routing");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [catFilter, setCatFilter] = useState("ALL");
  const [searchConditions, setSearchConditions] = useState<SearchCondition[]>(
    [],
  );
  const [filterMode, setFilterMode] = useState<FilterMode>("AND");

  // Sync with global header search bar
  useEffect(() => {
    const handleHeaderSearch = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (typeof customEvent.detail === "string") {
        setSearchQuery(customEvent.detail);
      }
    };
    window.addEventListener("grs:header-search", handleHeaderSearch);
    return () => {
      window.removeEventListener("grs:header-search", handleHeaderSearch);
    };
  }, []);

  // Read initial search query from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const initial = new URLSearchParams(window.location.search).get("search");
      if (initial) {
        setSearchQuery(initial);
      }
    }
  }, []);

  const isFiltered =
    Boolean(searchQuery.trim()) ||
    statusFilter.length > 0 ||
    deptFilter !== "ALL" ||
    catFilter !== "ALL" ||
    searchConditions.length > 0;

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setDeptFilter("ALL");
    setCatFilter("ALL");
    setSearchConditions([]);
    setFilterMode("AND");
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("grs:component-search", { detail: "" }),
      );
    }
  };

  // Unique Categories list for filter dropdown
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of routingRules) {
      if (r.category_name) set.add(r.category_name);
    }
    return Array.from(set).sort();
  }, [routingRules]);

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    deptFilter,
    setDeptFilter,
    catFilter,
    setCatFilter,
    searchConditions,
    setSearchConditions,
    filterMode,
    setFilterMode,
    isFiltered,
    handleResetFilters,
    categoryOptions,
  };
}
