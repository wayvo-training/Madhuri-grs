"use client";

import {
  AdvancedTableSearch,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";
import type { TabCategory } from "@/types/admin/audit";

interface AuditCategoryTabsProps {
  activeTab: TabCategory;
  onTabChange: (tab: TabCategory) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export function AuditCategoryTabs({
  activeTab: _activeTab,
  onTabChange: _onTabChange,
  searchQuery: _searchQuery,
  onSearchChange,
}: AuditCategoryTabsProps) {
  const filterFields: SearchFieldDef[] = [
    { id: "timestamp", label: "Timestamp", type: "date" },
    { id: "user", label: "User", type: "text" },
    { id: "action", label: "Action", type: "text" },
    { id: "entity_type", label: "Target Entity", type: "text" },
    { id: "ip_address", label: "IP Address", type: "text" },
  ];

  const handleSearchChange = (conditions: SearchCondition[], _mode: string) => {
    let newSearch = "";

    conditions.forEach((condition) => {
      const isNegative =
        condition.operator === "not_equals" ||
        condition.operator === "is_not_in" ||
        condition.operator === "does_not_contain";
      const valArray = Array.isArray(condition.value)
        ? condition.value
        : [condition.value as string];

      const firstVal = valArray[0] || "";
      if (firstVal) {
        newSearch = isNegative ? `!${firstVal}` : firstVal;
      }
    });

    onSearchChange(newSearch);
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
