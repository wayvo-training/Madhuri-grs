"use client";

import { CheckCircle2, X } from "lucide-react";
import type { DepartmentHeadView } from "@/types/department-head";

export interface DepartmentHeadViewSwitcherProps {
  activeView: DepartmentHeadView;
  switchView: (view: DepartmentHeadView) => void;
  unassignedCount: number;
  staffCount: number;
  atRiskCount: number;
  escalatedCount: number;
  availableDepartments: { id: string; name: string }[];
  selectedDeptId: string;
  currentDepartmentName: string;
  onDepartmentChange: (deptId: string) => void;
  actionSuccessMessage: string | null;
  onClearSuccessMessage: () => void;
}

export function DepartmentHeadViewSwitcher({
  activeView: _activeView,
  switchView: _switchView,
  unassignedCount: _unassignedCount,
  staffCount: _staffCount,
  atRiskCount: _atRiskCount,
  escalatedCount: _escalatedCount,
  availableDepartments: _availableDepartments,
  selectedDeptId: _selectedDeptId,
  currentDepartmentName: _currentDepartmentName,
  onDepartmentChange: _onDepartmentChange,
  actionSuccessMessage,
  onClearSuccessMessage,
}: DepartmentHeadViewSwitcherProps) {
  if (!actionSuccessMessage) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-900 shadow-2xs animate-in fade-in duration-150">
        <div className="flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
        <button
          type="button"
          onClick={onClearSuccessMessage}
          className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
