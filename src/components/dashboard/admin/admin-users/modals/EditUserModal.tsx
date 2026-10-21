"use client";

import { Loader2, Pencil, X } from "lucide-react";
import type {
  SerializedUser,
  UserDepartmentOption,
  UserRoleOption,
} from "@/types/admin/users";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  editingUser: SerializedUser | null;

  employeeCode: string;
  onSetEmployeeCode: (val: string) => void;
  firstName: string;
  onSetFirstName: (val: string) => void;
  lastName: string;
  onSetLastName: (val: string) => void;
  email: string;
  onSetEmail: (val: string) => void;
  roleId: string;
  onSetRoleId: (val: string) => void;
  departmentId: string;
  onSetDepartmentId: (val: string) => void;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  onSetStatus: (val: "ACTIVE" | "INACTIVE" | "SUSPENDED") => void;

  availableRoles: UserRoleOption[];
  availableDepartments: UserDepartmentOption[];
}

export function EditUserModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  editingUser,
  employeeCode,
  onSetEmployeeCode,
  firstName,
  onSetFirstName,
  lastName,
  onSetLastName,
  email,
  onSetEmail,
  roleId,
  onSetRoleId,
  departmentId,
  onSetDepartmentId,
  status,
  onSetStatus,
  availableRoles,
  availableDepartments,
}: EditUserModalProps) {
  if (!isOpen || !editingUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Pencil className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Edit User Account
              </h3>
              <p className="text-xs text-slate-500">
                Modify profile, role authorization, and organizational
                assignment
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

        {/* Form */}
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {/* Employee Code & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="edit-employee-code"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Employee Code <span className="text-rose-500">*</span>
              </label>
              <input
                id="edit-employee-code"
                type="text"
                required
                value={employeeCode}
                onChange={(e) => onSetEmployeeCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-600 outline-none uppercase font-mono"
              />
            </div>
            <div>
              <label
                htmlFor="edit-status"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Account Status
              </label>
              <select
                id="edit-status"
                value={status}
                onChange={(e) =>
                  onSetStatus(
                    e.target.value as "ACTIVE" | "INACTIVE" | "SUSPENDED",
                  )
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 outline-none"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="edit-first-name"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="edit-first-name"
                type="text"
                required
                value={firstName}
                onChange={(e) => onSetFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-600 outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="edit-last-name"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Last Name
              </label>
              <input
                id="edit-last-name"
                type="text"
                value={lastName}
                onChange={(e) => onSetLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="edit-email"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-email"
              type="email"
              required
              value={email}
              onChange={(e) => onSetEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 outline-none"
            />
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="edit-role"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Role Assignment <span className="text-rose-500">*</span>
              </label>
              <select
                id="edit-role"
                required
                value={roleId}
                onChange={(e) => onSetRoleId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 outline-none"
              >
                {availableRoles.map((r) => (
                  <option key={r.role_id} value={r.role_id}>
                    {r.role_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="edit-department"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Department
              </label>
              <select
                id="edit-department"
                value={departmentId}
                onChange={(e) => onSetDepartmentId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 outline-none"
              >
                <option value="">— Central / No Department —</option>
                {availableDepartments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </div>
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
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
