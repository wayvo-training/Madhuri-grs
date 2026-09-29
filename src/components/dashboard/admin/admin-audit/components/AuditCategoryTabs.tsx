"use client";

import {
  AdvancedFilterBar,
  type FilterCondition,
} from "@/components/filters/advanced-filter-bar";
import { CATEGORY_TABS } from "@/lib/admin/audit/audit-constants";
import type { TabCategory } from "@/types/admin/audit";

interface AuditCategoryTabsProps {
  activeTab: TabCategory;
  onTabChange: (tab: TabCategory) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export function AuditCategoryTabs({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}: AuditCategoryTabsProps) {
  // Exclude "ALL" from options — empty filter = all
  const filterFields = [
    {
      id: "category",
      label: "Activity Type",
      type: "select" as const,
      options: CATEGORY_TABS.filter((t) => t.id !== "ALL").map((tab) => ({
        label: tab.label,
        value: tab.id,
      })),
    },
  ];

  const currentFilters: FilterCondition[] =
    activeTab !== "ALL"
      ? [
          {
            id: `cat-${activeTab}`,
            fieldId: "category",
            operator: "Is" as const,
            value: activeTab,
          },
        ]
      : [];

  const handleFiltersChange = (newFilters: FilterCondition[]) => {
    // Audit API supports a single category param — take the latest selection
    // If the user deselects all, revert to "ALL"
    const catConds = newFilters.filter((f) => f.fieldId === "category");
    if (catConds.length === 0) {
      onTabChange("ALL");
    } else {
      // Keep only the most recently added (last) selection
      const latest = catConds[catConds.length - 1];
      onTabChange(latest.value as TabCategory);
    }
  };

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <AdvancedFilterBar
        fields={filterFields}
        filters={currentFilters}
        onFiltersChange={handleFiltersChange}
        search={searchQuery}
        onSearchChange={onSearchChange}
        placeholder="Search actor, email, IP, action..."
      />
    </div>
  );
}
