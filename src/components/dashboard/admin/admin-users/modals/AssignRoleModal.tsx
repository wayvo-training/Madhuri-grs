"use client";

import {
  AlertCircle,
  Check,
  Info,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  SerializedUser,
  UserDepartmentOption,
  UserRoleOption,
} from "@/types/admin/users";

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SerializedUser | null;
  availableRoles: UserRoleOption[];
  availableDepartments: UserDepartmentOption[];
  onSave: (
    userId: string,
    roleId: string,
    departmentId: string | null,
  ) => Promise<void>;
  isSubmitting: boolean;
}

export function AssignRoleModal({
  isOpen,
  onClose,
  user,
  availableRoles,
  availableDepartments,
  onSave,
  isSubmitting,
}: AssignRoleModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state when user changes or modal opens
  useEffect(() => {
    if (user && isOpen) {
      const isWithoutRole =
        !user.role_name ||
        user.role_name === "NO_ROLE" ||
        user.role_name === "UNASSIGNED" ||
        (user.role_name === "END_USER" && !user.department_id);
      setSelectedRoleId(isWithoutRole ? "" : user.role_id || "");
      setSelectedDeptId(user.department_id || "");
      setValidationError(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  // Filter out any deactivated roles
  const activeRoles = availableRoles.filter(
    (r) => !r.status || r.status === "ACTIVE",
  );

  // Filter out any deactivated departments
  const activeDepartments = availableDepartments.filter(
    (d) => !d.status || d.status === "ACTIVE",
  );

  const selectedRoleObj = activeRoles.find((r) => r.role_id === selectedRoleId);
  const normalizedRoleName = selectedRoleObj
    ? selectedRoleObj.role_name.trim().toUpperCase()
    : "";

  const isDepartmentRequired =
    normalizedRoleName === "STAFF" || normalizedRoleName === "DEPARTMENT_HEAD";

  // Check if form is valid
  const isFormValid = Boolean(
    selectedRoleId && (!isDepartmentRequired || selectedDeptId.trim() !== ""),
  );

  const handleRoleChange = (newRoleId: string | null) => {
    if (!newRoleId) return;
    setSelectedRoleId(newRoleId);
    setValidationError(null);

    const newRole = activeRoles.find((r) => r.role_id === newRoleId);
    const newRoleName = newRole?.role_name.trim().toUpperCase();

    // If changing to END_USER or ADMIN, auto-clear department if desired or keep optional
    if (newRoleName === "END_USER" || newRoleName === "ADMIN") {
      // Don't force department for these roles
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRoleId) {
      setValidationError("Please select a role.");
      return;
    }

    if (isDepartmentRequired && !selectedDeptId.trim()) {
      setValidationError(
        `Department is required for the ${
          normalizedRoleName === "DEPARTMENT_HEAD" ? "Department Head" : "Staff"
        } role.`,
      );
      return;
    }

    setValidationError(null);
    const finalDeptId = isDepartmentRequired
      ? selectedDeptId.trim()
      : selectedDeptId.trim() || null;

    await onSave(user.user_id, selectedRoleId, finalDeptId);
  };

  const getRoleDescription = (roleName: string) => {
    switch (roleName) {
      case "ADMIN":
        return "Full administrative access to manage all departments, users, grievances, and system configurations.";
      case "DEPARTMENT_HEAD":
        return "Responsible for managing and overseeing all grievances, staff assignments, and resolutions within their designated department.";
      case "STAFF":
        return "Department-level grievance handler assigned to investigate, respond to, and resolve citizen grievances.";
      case "END_USER":
        return "Standard user account capable of submitting, monitoring, and providing feedback on their grievances.";
      default:
        return "System user role with designated permissions.";
    }
  };

  const getRoleDisplayName = (roleName?: string | null) => {
    switch (roleName?.trim()?.toUpperCase()) {
      case "ADMIN":
        return "System Administrator (ADMIN)";
      case "DEPARTMENT_HEAD":
        return "Department Head";
      case "STAFF":
        return "Grievance Staff Officer";
      case "END_USER":
        return "Employee (End User)";
      default:
        return roleName || "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Assign Role & Department
              </h3>
              <p className="text-xs text-slate-500">
                Configure access privileges and organizational unit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User Context Card */}
        <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs uppercase tracking-wider">
                {user.first_name?.[0] || ""}
                {user.last_name?.[0] || ""}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {user.first_name} {user.last_name || ""}
                  </h4>
                  <span className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    {user.employee_code}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Current Role:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#0F766E]" />
              {!user.role_name ||
              (user.role_name === "END_USER" && !user.department_id)
                ? "No Role Assigned"
                : getRoleDisplayName(user.role_name)}
              {user.department_name ? ` (${user.department_name})` : ""}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {validationError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label
              htmlFor="assign-role-select"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Role <span className="text-rose-500">*</span>
            </label>
            <Select value={selectedRoleId} onValueChange={handleRoleChange}>
              <SelectTrigger
                id="assign-role-select"
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-[#0F766E] focus:bg-white dark:focus:bg-slate-900"
              >
                <SelectValue placeholder="— Select Role —">
                  {selectedRoleObj ? (
                    getRoleDisplayName(selectedRoleObj.role_name)
                  ) : (
                    <span className="text-slate-400">— Select Role —</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
                {activeRoles.map((r) => (
                  <SelectItem
                    key={r.role_id}
                    value={r.role_id}
                    className="text-xs cursor-pointer"
                  >
                    <span>{getRoleDisplayName(r.role_name)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {normalizedRoleName && (
              <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-slate-500">
                <Info className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
                <span>{getRoleDescription(normalizedRoleName)}</span>
              </p>
            )}
          </div>

          {/* Department Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="assign-department-select"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Department{" "}
                {isDepartmentRequired ? (
                  <span className="text-rose-500">
                    * (Required for {selectedRoleObj?.role_name})
                  </span>
                ) : (
                  <span className="text-slate-400 font-normal">
                    (Optional for {selectedRoleObj?.role_name || "this role"})
                  </span>
                )}
              </label>
            </div>

            <Select
              value={selectedDeptId}
              onValueChange={(val) => {
                setSelectedDeptId(!val || val === "NONE" ? "" : val);
                setValidationError(null);
              }}
            >
              <SelectTrigger
                id="assign-department-select"
                className={`w-full h-9 rounded-xl border px-3 py-2 text-xs outline-none transition-colors ${
                  isDepartmentRequired && !selectedDeptId
                    ? "border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/20 text-slate-900 dark:text-slate-100"
                    : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:border-[#0F766E] focus:bg-white dark:focus:bg-slate-900"
                }`}
              >
                <SelectValue placeholder="— Select Department —">
                  {selectedDeptId ? (
                    activeDepartments.find(
                      (d) => d.department_id === selectedDeptId,
                    )?.department_name || (
                      <span className="text-slate-400">
                        — Select Department —
                      </span>
                    )
                  ) : (
                    <span className="text-slate-400">
                      {isDepartmentRequired
                        ? "— Select Required Department —"
                        : "— No Department Assigned —"}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg max-h-56">
                {!isDepartmentRequired && (
                  <SelectItem
                    value="NONE"
                    className="text-xs cursor-pointer text-slate-500 italic"
                  >
                    — No Department (Unassigned) —
                  </SelectItem>
                )}
                {activeDepartments.map((d) => (
                  <SelectItem
                    key={d.department_id}
                    value={d.department_id}
                    className="text-xs cursor-pointer"
                  >
                    {d.department_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isDepartmentRequired && !selectedDeptId && (
              <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                A department must be assigned when granting the{" "}
                {selectedRoleObj?.role_name} role.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
                isFormValid && !isSubmitting
                  ? "bg-[#0F766E] text-white hover:bg-[#115E59] cursor-pointer shadow-xs"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Update Assignment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
