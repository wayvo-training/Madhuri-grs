"use client";

import { AlertCircle, Loader2, Plus, UserPlus, X } from "lucide-react";
import { useState } from "react";
import {
  validateEmail,
  validateEmployeeCode,
  validateFirstName,
  validateLastName,
  validatePassword,
} from "@/lib/validations/user-validations";

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
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  onSetStatus?: (val: "ACTIVE" | "INACTIVE" | "SUSPENDED") => void;
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
}: CreateUserModalProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  // Validation using common rules
  const fnValidation = validateFirstName(firstName);
  const lnValidation = validateLastName(lastName);
  const empValidation = validateEmployeeCode(employeeCode);
  const emailValidation = validateEmail(email);
  const pwValidation = validatePassword(password);

  const isFormValid =
    fnValidation.isValid &&
    lnValidation.isValid &&
    empValidation.isValid &&
    emailValidation.isValid &&
    pwValidation.isValid;

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
      password: true,
    });
    if (!isFormValid) return;
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#0F766E] dark:text-teal-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Create New User
              </h3>
              <p className="text-xs text-slate-500">
                Register a new account with basic credentials
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

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="mt-5 space-y-4"
        >
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
                placeholder="e.g. John"
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
                htmlFor="create-last-name"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Last Name{" "}
                <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="create-last-name"
                type="text"
                placeholder="e.g. Doe"
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
                onChange={(e) => {
                  onSetEmployeeCode(e.target.value);
                  markTouched("employeeCode");
                }}
                onBlur={() => markTouched("employeeCode")}
                className={`w-full rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none uppercase font-mono transition-colors ${
                  touched.employeeCode && !empValidation.isValid
                    ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20"
                    : "border-slate-200 dark:border-slate-700 focus:border-[#0F766E] focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-[#0F766E]"
                }`}
              />
              {touched.employeeCode && !empValidation.isValid ? (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{empValidation.error}</span>
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-slate-400">
                  Must combine letters & numbers (min 6 characters, e.g. EMP001)
                </p>
              )}
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
              onChange={(e) => {
                onSetPassword(e.target.value);
                markTouched("password");
              }}
              onBlur={() => markTouched("password")}
              className={`w-full rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none transition-colors ${
                touched.password && !pwValidation.isValid
                  ? "border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/20"
                  : "border-slate-200 dark:border-slate-700 focus:border-[#0F766E] focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-[#0F766E]"
              }`}
            />
            {touched.password && !pwValidation.isValid && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{pwValidation.error}</span>
              </p>
            )}
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
                  <span>Creating User...</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create User</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
