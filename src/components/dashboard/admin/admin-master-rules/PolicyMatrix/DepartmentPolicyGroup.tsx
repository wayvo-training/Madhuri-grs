import { Building2, ChevronDown, ChevronRight } from "lucide-react";
import type { MatrixDepartmentNode } from "@/types/admin/master-rules";
import { CategoryPolicyGroup } from "./CategoryPolicyGroup";

export interface DepartmentPolicyGroupProps {
  department: MatrixDepartmentNode;
  isDeptOpen: boolean;
  onToggleDept: (deptName: string) => void;
  expandedMatrixCats: Set<string>;
  isSearching: boolean;
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

export function DepartmentPolicyGroup({
  department,
  isDeptOpen,
  onToggleDept,
  expandedMatrixCats,
  isSearching,
  onToggleCat,
  expandedRoutingViews,
  onToggleRoutingView,
  onOpenConfigureRow,
  onToggleStatus,
  onConfirmDelete,
}: DepartmentPolicyGroupProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs transition-shadow">
      {/* LEVEL 1: Department Header */}
      <button
        type="button"
        onClick={() => onToggleDept(department.departmentName)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          {isDeptOpen ? (
            <ChevronDown className="h-4 w-4 text-slate-600 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          )}
          <span className="rounded-lg bg-emerald-50 p-1 text-emerald-800">
            <Building2 className="h-4 w-4" />
          </span>
          <span className="text-sm font-bold text-slate-900">
            {department.departmentName}
          </span>
        </div>
        <span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          {department.count} {department.count === 1 ? "type" : "types"}
        </span>
      </button>

      {/* LEVEL 2: Categories */}
      {isDeptOpen && (
        <div className="border-t border-slate-200/80 divide-y divide-slate-100">
          {department.categories.map((catNode) => {
            const catKey = `${department.departmentName}::${catNode.categoryName}`;
            const isCatOpen = isSearching || expandedMatrixCats.has(catKey);

            return (
              <CategoryPolicyGroup
                key={catKey}
                departmentName={department.departmentName}
                category={catNode}
                isCatOpen={isCatOpen}
                onToggleCat={onToggleCat}
                expandedRoutingViews={expandedRoutingViews}
                onToggleRoutingView={onToggleRoutingView}
                onOpenConfigureRow={onOpenConfigureRow}
                onToggleStatus={onToggleStatus}
                onConfirmDelete={onConfirmDelete}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
