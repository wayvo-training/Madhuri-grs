"use client";

import { AlertCircle, Loader2, Pencil, X } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  validateEmail,
  validateEmployeeCode,
  validateFirstName,
  validateLastName,
} from "@/lib/validations/user-validations";
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  if (!isOpen || !editingUser) return null;

  // Validation using common rules
  const fnValidation = validateFirstName(firstName);
  const lnValidation = validateLastName(lastName);
  const empValidation = validateEmployeeCode(employeeCode);
  const emailValidation = validateEmail(email);

  const isFormValid =
    fnValidation.isValid &&
    lnValidation.isValid &&
    empValidation.isValid &&
    emailValidation.isValid &&
    Boolean(roleId);

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      employeeCode: true,
      email: true,
    });
    if (!isFormValid) return;
    onSubmit(e);
  };

  const activeRoles = availableRoles.filter(
    (r) => !r.status || r.status === "ACTIVE",
  );
  const activeDepartments = availableDepartments.filter(
    (d) => !d.status || d.status === "ACTIVE",
  );

  const selectedRoleObj = activeRoles.find((r) => r.role_id === roleId);
  const selectedDeptObj = activeDepartments.find(
    (d) => d.department_id === departmentId,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400">
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
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
                onChange={(e) => {
                  onSetEmployeeCode(e.target.value);
                  markTouched("employeeCode");
                }}
                onBlur={() => markTouched("employeeCode")}
                className={`w-full rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 uppercase font-mono outline-none transition-colors ${
                  touched.employeeCode && !empValidation.isValid
                    ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20"
                    : "border-slate-200 dark:border-slate-700 focus:border-[#0F766E] focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-[#0F766E]"
                }`}
              />
              {touched.employeeCode && !empValidation.isValid && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{empValidation.error}</span>
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="edit-status"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Account Status
              </label>
              <Select
                value={status}
                onValueChange={(val) => {
                  if (
                    val === "ACTIVE" ||
                    val === "INACTIVE" ||
                    val === "SUSPENDED"
                  ) {
                    onSetStatus(val);
                  }
                }}
              >
                <SelectTrigger
                  id="edit-status"
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-[#0F766E] focus:bg-white dark:focus:bg-slate-900"
                >
                  <SelectValue>{status}</SelectValue>
                </SelectTrigger>
                <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
                  <SelectItem value="ACTIVE" className="text-xs cursor-pointer">
                    ACTIVE
                  </SelectItem>
                  <SelectItem
                    value="INACTIVE"
                    className="text-xs cursor-pointer"
                  >
                    INACTIVE
                  </SelectItem>
                  <SelectItem
                    value="SUSPENDED"
                    className="text-xs cursor-pointer text-rose-600 dark:text-rose-400"
                  >
                    SUSPENDED
                  </SelectItem>
                </SelectContent>
              </Select>
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
                onChange={(e) => {
                  onSetFirstName(e.target.value);
                  markTouched("firstName");
                }}
                onBlur={() => markTouched("firstName")}
                className={`w-full rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none transition-colors ${
                  touched.firstName && !fnValidation.isValid
                    ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20"
                    : "border-slate-200 dark:border-slate-700 focus:border-[#0F766E] focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-[#0F766E]"
                }`}
              />
              {touched.firstName && !fnValidation.isValid && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{fnValidation.error}</span>
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="edit-last-name"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Last Name{" "}
                <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="edit-last-name"
                type="text"
                value={lastName}
                onChange={(e) => {
                  onSetLastName(e.target.value);
                  markTouched("lastName");
                }}
                onBlur={() => markTouched("lastName")}
                className={`w-full rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none transition-colors ${
                  touched.lastName && !lnValidation.isValid
                    ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20"
                    : "border-slate-200 dark:border-slate-700 focus:border-[#0F766E] focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-[#0F766E]"
                }`}
              />
              {touched.lastName && !lnValidation.isValid && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{lnValidation.error}</span>
                </p>
              )}
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
              onChange={(e) => {
                onSetEmail(e.target.value);
                markTouched("email");
              }}
              onBlur={() => markTouched("email")}
              className={`w-full rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none transition-colors ${
                touched.email && !emailValidation.isValid
                  ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20"
                  : "border-slate-200 dark:border-slate-700 focus:border-[#0F766E] focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-[#0F766E]"
              }`}
            />
            {touched.email && !emailValidation.isValid && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{emailValidation.error}</span>
              </p>
            )}
          </div>

          {/* Role & Department (Using shadcn Select Component) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="edit-role-select"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Role Assignment <span className="text-rose-500">*</span>
              </label>
              <Select
                value={roleId}
                onValueChange={(val) => val && onSetRoleId(val)}
              >
                <SelectTrigger
                  id="edit-role-select"
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-[#0F766E] focus:bg-white dark:focus:bg-slate-900"
                >
                  <SelectValue placeholder="— Select Role —">
                    {selectedRoleObj?.role_name || "— Select Role —"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
                  {activeRoles.map((r) => (
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
                htmlFor="edit-department-select"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Department
              </label>
              <Select
                value={departmentId || "NONE"}
                onValueChange={(val) => {
                  onSetDepartmentId(!val || val === "NONE" ? "" : val);
                }}
              >
                <SelectTrigger
                  id="edit-department-select"
                  className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-[#0F766E] focus:bg-white dark:focus:bg-slate-900"
                >
                  <SelectValue placeholder="— Central / No Department —">
                    {selectedDeptObj?.department_name ||
                      "— Central / No Department —"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg max-h-56">
                  <SelectItem
                    value="NONE"
                    className="text-xs cursor-pointer text-slate-500 italic"
                  >
                    — Central / No Department —
                  </SelectItem>
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
              disabled={!isFormValid || isSubmitting}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
                isFormValid && !isSubmitting
                  ? "bg-[#0F766E] text-white hover:bg-[#115E59] active:bg-[#0D655E] cursor-pointer shadow-xs"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60"
              }`}
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
