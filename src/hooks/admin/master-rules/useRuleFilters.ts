import { useEffect, useMemo, useState } from "react";
import type {
  MainTab,
  SerializedRoutingRule,
} from "@/types/admin/master-rules";

export interface UseRuleFiltersParams {
  routingRules: SerializedRoutingRule[];
}

export function useRuleFilters({ routingRules }: UseRuleFiltersParams) {
  const [activeTab, setActiveTab] = useState<MainTab>("matrix");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [catFilter, setCatFilter] = useState("ALL");

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
    statusFilter !== "ALL" ||
    deptFilter !== "ALL" ||
    catFilter !== "ALL";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setDeptFilter("ALL");
    setCatFilter("ALL");
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
    isFiltered,
    handleResetFilters,
    categoryOptions,
  };
}
