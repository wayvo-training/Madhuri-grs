"use client";

import { Loader2, Plus, UserPlus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserDepartmentOption, UserRoleOption } from "@/types/admin/users";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;

  employeeCode: string;
  onSetEmployeeCode: (val: string) => void;
  firstName: string;
  onSetFirstName: (val: string) => void;
  lastName: string;
  onSetLastName: (val: string) => void;
  email: string;
  onSetEmail: (val: string) => void;
  password: string;
  onSetPassword: (val: string) => void;
  roleId: string;
  onSetRoleId: (val: string) => void;
  departmentId: string;
  onSetDepartmentId: (val: string) => void;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  onSetStatus?: (val: "ACTIVE" | "INACTIVE" | "SUSPENDED") => void;

  availableRoles: UserRoleOption[];
  availableDepartments: UserDepartmentOption[];
}

export function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  employeeCode,
  onSetEmployeeCode,
  firstName,
  onSetFirstName,
  lastName,
  onSetLastName,
  email,
  onSetEmail,
  password,
  onSetPassword,
  roleId,
  onSetRoleId,
  departmentId,
  onSetDepartmentId,
  availableRoles,
  availableDepartments,
}: CreateUserModalProps) {
  if (!isOpen) return null;

  // Filter only active roles and remove ADMIN
  const selectableRoles = availableRoles.filter(
    (r) =>
      r.role_name.trim().toUpperCase() !== "ADMIN" &&
      (!r.status || r.status === "ACTIVE"),
  );

  // Filter only active departments
  const selectableDepartments = availableDepartments.filter(
    (d) => !d.status || d.status === "ACTIVE",
  );

  // Enable Create Account only after filling all required details
  const isFormValid = Boolean(
    employeeCode.trim() &&
      firstName.trim() &&
      email.trim() &&
      email.includes("@") &&
      password.length >= 6 &&
      roleId.trim() &&
      departmentId.trim(),
  );

  const selectedRole = selectableRoles.find((r) => r.role_id === roleId);
  const selectedDept = selectableDepartments.find(
    (d) => d.department_id === departmentId,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Create New User
              </h3>
              <p className="text-xs text-slate-500">
                Register a new employee, grievance staff, or officer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form - do not fill with initial values & disable browser autofill */}
        <form onSubmit={onSubmit} autoComplete="off" className="mt-5 space-y-4">
          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="create-first-name"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-first-name"
                type="text"
                required
                placeholder="First name"
                value={firstName}
                onChange={(e) => onSetFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-600 outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="create-last-name"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Last Name
              </label>
              <input
                id="create-last-name"
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => onSetLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Employee Code & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="create-employee-code"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Employee Code <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-employee-code"
                type="text"
                required
                placeholder="e.g. EMP102"
                value={employeeCode}
                onChange={(e) => onSetEmployeeCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-600 outline-none uppercase font-mono"
              />
            </div>
            <div>
              <label
                htmlFor="create-email"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="create-email"
                type="email"
                autoComplete="off"
                required
                placeholder="user@company.com"
                value={email}
                onChange={(e) => onSetEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Role & Department (Mandatory - Using shadcn Select components) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="create-role"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Role Assignment <span className="text-rose-500">*</span>
              </label>
              <Select
                value={roleId}
                onValueChange={(val) => {
                  if (val) onSetRoleId(val);
                }}
              >
                <SelectTrigger
                  id="create-role"
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900"
                >
                  <SelectValue placeholder="— Select Role —">
                    {selectedRole ? (
                      selectedRole.role_name
                    ) : (
                      <span className="text-slate-400">— Select Role —</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
                  {selectableRoles.map((r) => (
                    <SelectItem
                      key={r.role_id}
                      value={r.role_id}
                      className="text-xs cursor-pointer"
                    >
                      {r.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label
                htmlFor="create-department"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Department <span className="text-rose-500">*</span>
              </label>
              <Select
                value={departmentId}
                onValueChange={(val) => {
                  if (val) onSetDepartmentId(val);
                }}
              >
                <SelectTrigger
                  id="create-department"
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900"
                >
                  <SelectValue placeholder="— Select Department —">
                    {selectedDept ? (
                      selectedDept.department_name
                    ) : (
                      <span className="text-slate-400">
                        — Select Department —
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg max-h-56">
                  {selectableDepartments.map((d) => (
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
            </div>
          </div>

          {/* Initial Password */}
          <div>
            <label
              htmlFor="create-password"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Initial Password <span className="text-rose-500">*</span>
            </label>
            <input
              id="create-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => onSetPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-900 outline-none"
            />
          </div>

          {/* Actions */}
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
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Creating User...</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
