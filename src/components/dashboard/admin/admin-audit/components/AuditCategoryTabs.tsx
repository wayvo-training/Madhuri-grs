import { CATEGORY_TABS } from "@/lib/admin/audit/audit-constants";
import type { TabCategory } from "@/types/admin/audit";

interface AuditCategoryTabsProps {
  activeTab: TabCategory;
  onTabChange: (tab: TabCategory) => void;
}

export function AuditCategoryTabs({
  activeTab,
  onTabChange,
}: AuditCategoryTabsProps) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-4">
      {CATEGORY_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              isActive
                ? "bg-[#064E3B] text-white shadow-xs"
                : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
