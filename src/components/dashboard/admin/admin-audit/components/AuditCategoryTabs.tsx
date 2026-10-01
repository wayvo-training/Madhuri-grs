"use client";

import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
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
  const filterFields: SearchFieldDef[] = [
    { id: "timestamp", label: "Timestamp", type: "date" },
    { id: "user", label: "User", type: "text" },
    { id: "action", label: "Action", type: "text" },
    { id: "entity_type", label: "Target Entity", type: "text" },
    { id: "ip_address", label: "IP Address", type: "text" },
  ];

  const handleSearchChange = (conditions: SearchCondition[], mode: string) => {
    onSearchChange("");
    let newSearch = "";

    conditions.forEach((condition) => {
      let valArray = Array.isArray(condition.value) ? condition.value : [condition.value as string];
      
      // All field searches collapse into the unified text search for this view
      newSearch = valArray[0] || newSearch;
    });

    if (newSearch) onSearchChange(newSearch);
  };

  return (
    <div className="mt-4">
      <AdvancedTableSearch
        fields={filterFields}
        onSearch={handleSearchChange}
        className="w-full"
      />
    </div>
  );
}
