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
            className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-1 whitespace-nowrap ${
              isActive
                ? "bg-[#0F766E] text-white shadow-sm ring-1 ring-[#0F766E]"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 shadow-2xs"
            }`}
          >
            <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-teal-600"}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
