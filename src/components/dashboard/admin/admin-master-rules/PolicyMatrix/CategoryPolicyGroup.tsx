import { ChevronDown, ChevronRight } from "lucide-react";
import type { MatrixCategoryNode } from "@/types/admin/master-rules";
import { GrievancePolicyTable } from "./GrievancePolicyTable";

export interface CategoryPolicyGroupProps {
  departmentName: string;
  category: MatrixCategoryNode;
  isCatOpen: boolean;
  onToggleCat: (catKey: string) => void;
  expandedRoutingViews: Set<string>;
  onToggleRoutingView: (rowKey: string) => void;
  onOpenConfigureRow: (
    deptName: string,
    catName: string,
    subcatName: string,
    currentPriority: string,
  ) => void;
  onToggleStatus: (
    ruleType: "routing",
    id: string,
    currentStatus: string,
  ) => void;
  onConfirmDelete: (ruleType: "routing", id: string, name: string) => void;
}

export function CategoryPolicyGroup({
  departmentName,
  category,
  isCatOpen,
  onToggleCat,
  expandedRoutingViews,
  onToggleRoutingView,
  onOpenConfigureRow,
  onToggleStatus,
  onConfirmDelete,
}: CategoryPolicyGroupProps) {
  const catKey = `${departmentName}::${category.categoryName}`;

  return (
    <div className="bg-white">
      <button
        type="button"
        onClick={() => onToggleCat(catKey)}
        className="w-full flex items-center justify-between pl-8 pr-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {isCatOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          )}
          <span className="text-xs font-bold text-slate-800">
            {category.categoryName}
          </span>
        </div>
        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
          {category.count} {category.count === 1 ? "type" : "types"}
        </span>
      </button>

      {/* LEVEL 3: Policy Matrix Table */}
      {isCatOpen && (
        <div className="pl-8 pr-4 py-3 bg-slate-50/60 border-t border-slate-100">
          <GrievancePolicyTable
            subcategories={category.subcategories}
            expandedRoutingViews={expandedRoutingViews}
            onToggleRoutingView={onToggleRoutingView}
            onOpenConfigureRow={onOpenConfigureRow}
            onToggleStatus={onToggleStatus}
            onConfirmDelete={onConfirmDelete}
          />
        </div>
      )}
    </div>
  );
}
