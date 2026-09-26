import { RotateCcw } from "lucide-react";
import type { MatrixDepartmentNode } from "@/types/admin/master-rules";
import { DepartmentPolicyGroup } from "./DepartmentPolicyGroup";

export interface PolicyMatrixProps {
  matrixTree: MatrixDepartmentNode[];
  totalMatrixGrievanceTypes: number;
  isSearching: boolean;
  expandedMatrixDepts: Set<string>;
  expandedMatrixCats: Set<string>;
  expandedRoutingViews: Set<string>;
  onToggleDept: (deptName: string) => void;
  onToggleCat: (catKey: string) => void;
  onToggleRoutingView: (rowKey: string) => void;
  onResetFilters: () => void;
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

export function PolicyMatrix({
  matrixTree,
  totalMatrixGrievanceTypes,
  isSearching,
  expandedMatrixDepts,
  expandedMatrixCats,
  expandedRoutingViews,
  onToggleDept,
  onToggleCat,
  onToggleRoutingView,
  onResetFilters,
  onOpenConfigureRow,
  onToggleStatus,
  onConfirmDelete,
}: PolicyMatrixProps) {
  return (
    <div id="policy-matrix-section" className="space-y-4">
      {/* Policy Matrix Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Policy Matrix</h3>
          <p className="text-xs text-slate-500">
            Configure and review priority, routing, and SLA policies for
            grievance types.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-[#064E3B]">
            {totalMatrixGrievanceTypes} Grievance{" "}
            {totalMatrixGrievanceTypes === 1 ? "Type" : "Types"} Configured
          </span>
        </div>
      </div>

      {matrixTree.length === 0 ? (
        <div className="rounded-xl border border-slate-200/80 bg-white py-12 text-center">
          <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
            <p className="font-semibold text-slate-700">
              No grievance policies match your search or filter.
            </p>
            <p className="text-xs text-slate-400">
              Try adjusting your department, category, or status filters.
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {matrixTree.map((deptNode) => {
            const isDeptOpen =
              isSearching || expandedMatrixDepts.has(deptNode.departmentName);

            return (
              <DepartmentPolicyGroup
                key={deptNode.departmentName}
                department={deptNode}
                isDeptOpen={isDeptOpen}
                onToggleDept={onToggleDept}
                expandedMatrixCats={expandedMatrixCats}
                isSearching={isSearching}
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
