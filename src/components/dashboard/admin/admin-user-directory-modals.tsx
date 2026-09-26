import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  UserCheck,
  UserX,
  X,
} from "lucide-react";

import type { SerializedUser } from "@/components/dashboard/admin/admin-user-directory";

interface UserDirectoryModalsProps {
  isModalOpen: boolean;
  isSubmitting: boolean;
  feedback: { type: "success" | "error"; text: string } | null;
  empCode: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  showPassword: boolean;
  hasCopiedPassword: boolean;
  selectedRoleId: string;
  selectedDeptId: string;
  departments: { department_id: string; department_name: string }[];
  roles: { role_id: string; role_name: string }[];
  onCloseCreate: () => void;
  onSubmitCreate: (e: React.FormEvent) => void;
  onSetEmpCode: (value: string) => void;
  onSetFirstName: (value: string) => void;
  onSetLastName: (value: string) => void;
  onSetEmail: (value: string) => void;
  onSetPassword: (value: string) => void;
  onSetShowPassword: (value: boolean) => void;
  onCopyPassword: () => void;
  onSetSelectedRoleId: (value: string) => void;
  onSetSelectedDeptId: (value: string) => void;
  isEditModalOpen: boolean;
  editingUserId: string | null;
  editFirstName: string;
  editLastName: string;
  editEmail: string;
  editRoleId: string;
  editDeptId: string;
  editStatus: string;
  editFeedback: { type: "success" | "error"; text: string } | null;
  isEditSubmitting: boolean;
  onCloseEdit: () => void;
  onSubmitEdit: (e: React.FormEvent) => void;
  onSetEditFirstName: (value: string) => void;
  onSetEditLastName: (value: string) => void;
  onSetEditEmail: (value: string) => void;
  onSetEditRoleId: (value: string) => void;
  onSetEditDeptId: (value: string) => void;
  onSetEditStatus: (value: "ACTIVE" | "INACTIVE") => void;
  suspensionModalUser: SerializedUser | null;
  suspensionCategory: string;
  suspensionReason: string;
  suspensionFeedback: { type: "success" | "error"; text: string } | null;
  isSubmittingSuspension: boolean;
  onCloseSuspend: () => void;
  onSubmitSuspend: (e: React.FormEvent) => void;
  onSetSuspensionCategory: (value: string) => void;
  onSetSuspensionReason: (value: string) => void;
  reactivationModalUser: SerializedUser | null;
  reactivationReason: string;
  reactivationFeedback: { type: "success" | "error"; text: string } | null;
  isSubmittingReactivation: boolean;
  onCloseReactivate: () => void;
  onSubmitReactivate: (e: React.FormEvent) => void;
  onSetReactivationReason: (value: string) => void;
}

export function UserDirectoryModals({
  isModalOpen,
  isSubmitting,
  feedback,
  empCode,
  firstName,
  lastName,
  email,
  password,
  showPassword,
  hasCopiedPassword,
  selectedRoleId,
  selectedDeptId,
  departments,
  roles,
  onCloseCreate,
  onSubmitCreate,
  onSetEmpCode,
  onSetFirstName,
  onSetLastName,
  onSetEmail,
  onSetPassword,
  onSetShowPassword,
  onCopyPassword,
  onSetSelectedRoleId,
  onSetSelectedDeptId,
  isEditModalOpen,
  editingUserId,
  editFirstName,
  editLastName,
  editEmail,
  editRoleId,
  editDeptId,
  editStatus,
  editFeedback,
  isEditSubmitting,
  onCloseEdit,
  onSubmitEdit,
  onSetEditFirstName,
  onSetEditLastName,
  onSetEditEmail,
  onSetEditRoleId,
  onSetEditDeptId,
  onSetEditStatus,
  suspensionModalUser,
  suspensionCategory,
  suspensionReason,
  suspensionFeedback,
  isSubmittingSuspension,
  onCloseSuspend,
  onSubmitSuspend,
  onSetSuspensionCategory,
  onSetSuspensionReason,
  reactivationModalUser,
  reactivationReason,
  reactivationFeedback,
  isSubmittingReactivation,
  onCloseReactivate,
  onSubmitReactivate,
  onSetReactivationReason,
}: UserDirectoryModalsProps) {
  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-800">
                  <UserCheck className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Onboard Enterprise User
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseCreate}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {feedback && (
              <div
                className={`mt-4 rounded-xl border p-3 text-xs ${
                  feedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {feedback.text}
              </div>
            )}

            <form
              onSubmit={onSubmitCreate}
              autoComplete="off"
              className="mt-4 space-y-3.5"
            >
              <input
                type="text"
                name="fake_username_autofill"
                style={{ display: "none" }}
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="off"
              />
              <input
                type="password"
                name="fake_password_autofill"
                style={{ display: "none" }}
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="new-password"
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="new-user-empcode"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Employee Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="new-user-empcode"
                    name="enterprise_user_empcode"
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="e.g. EMP-1055"
                    value={empCode}
                    onChange={(e) => onSetEmpCode(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 uppercase outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-user-email"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Corporate Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="new-user-email"
                    name="enterprise_user_email"
                    type="email"
                    required
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    placeholder="user@enterprise.com"
                    value={email}
                    onChange={(e) => onSetEmail(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="new-user-firstname"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="new-user-firstname"
                    type="text"
                    required
                    placeholder="e.g. Jane"
                    value={firstName}
                    onChange={(e) => onSetFirstName(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-user-lastname"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Last Name
                  </label>
                  <input
                    id="new-user-lastname"
                    type="text"
                    placeholder="e.g. Doe"
                    value={lastName}
                    onChange={(e) => onSetLastName(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="new-user-password"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Temporary Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      id="new-user-password"
                      name="enterprise_user_password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      data-lpignore="true"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => onSetPassword(e.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-3 pr-16 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
                      {password && (
                        <button
                          type="button"
                          onClick={onCopyPassword}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          title={
                            hasCopiedPassword ? "Copied!" : "Copy password"
                          }
                          aria-label="Copy password"
                        >
                          {hasCopiedPassword ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSetShowPassword(!showPassword)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        title={showPassword ? "Hide password" : "Show password"}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="new-user-dept"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Assigned Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="new-user-dept"
                    required
                    value={selectedDeptId}
                    onChange={(e) => onSetSelectedDeptId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white"
                  >
                    <option value="">Select department...</option>
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.department_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-user-role"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Organizational Role <span className="text-rose-500">*</span>
                </label>
                <select
                  id="new-user-role"
                  required
                  value={selectedRoleId}
                  onChange={(e) => onSetSelectedRoleId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white"
                >
                  <option value="">Select a role...</option>
                  {roles.map((r) => (
                    <option key={r.role_id} value={r.role_id}>
                      {r.role_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseCreate}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-900 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-800">
                  <Pencil className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit User Profile
                  </h3>
                  <p className="text-xs text-slate-500">{editEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseEdit}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editFeedback && (
              <div
                className={`mt-4 rounded-xl border p-3 text-xs ${
                  editFeedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {editFeedback.text}
              </div>
            )}

            <form onSubmit={onSubmitEdit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="edit-user-firstname"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="edit-user-firstname"
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => onSetEditFirstName(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-user-lastname"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Last Name
                  </label>
                  <input
                    id="edit-user-lastname"
                    type="text"
                    value={editLastName}
                    onChange={(e) => onSetEditLastName(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-user-email"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edit-user-email"
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => onSetEditEmail(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="edit-user-dept"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="edit-user-dept"
                    required
                    value={editDeptId}
                    onChange={(e) => onSetEditDeptId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white"
                  >
                    <option value="">Select department...</option>
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-user-role"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="edit-user-role"
                    required
                    value={editRoleId}
                    onChange={(e) => onSetEditRoleId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white"
                  >
                    <option value="">Select a role...</option>
                    {roles.map((r) => (
                      <option key={r.role_id} value={r.role_id}>
                        {r.role_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="edit-user-status"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="edit-user-status"
                    required
                    value={editStatus}
                    onChange={(e) =>
                      onSetEditStatus(e.target.value as "ACTIVE" | "INACTIVE")
                    }
                    className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseEdit}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-900 disabled:opacity-50"
                >
                  {isEditSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {suspensionModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-rose-50 p-1.5 text-rose-700">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Suspend User Account
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mandatory documented justification required
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseSuspend}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {suspensionFeedback && (
              <div
                className={`mt-4 rounded-xl border p-3 text-xs ${
                  suspensionFeedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {suspensionFeedback.text}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">
                    {suspensionModalUser.first_name}{" "}
                    {suspensionModalUser.last_name || ""}
                  </span>
                  <span className="ml-2 font-mono text-xs text-slate-500">
                    ({suspensionModalUser.employee_code})
                  </span>
                </div>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {suspensionModalUser.role_name}
                </span>
              </div>
              <div className="mt-1 text-slate-600">
                {suspensionModalUser.email}
                {suspensionModalUser.department_name && (
                  <span className="ml-2 text-slate-400">
                    • {suspensionModalUser.department_name}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-800">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                Security Impact Notice
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Suspending this user will immediately revoke all active sessions
                across all devices, block login attempts, and log an audit
                record with your justification.
              </p>
            </div>

            <form onSubmit={onSubmitSuspend} className="mt-4 space-y-3.5">
              <div>
                <label
                  htmlFor="suspension-category"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Suspension Category <span className="text-rose-500">*</span>
                </label>
                <select
                  id="suspension-category"
                  required
                  value={suspensionCategory}
                  onChange={(e) => onSetSuspensionCategory(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none focus:border-rose-600"
                >
                  <option value="POLICY_VIOLATION">
                    Policy / Code of Conduct Violation
                  </option>
                  <option value="SECURITY_INCIDENT">
                    Suspected Compromise / Security Risk
                  </option>
                  <option value="EMPLOYMENT_STATUS_CHANGE">
                    Separation / Offboarding / Leave
                  </option>
                  <option value="MALICIOUS_ACTIVITY">
                    Unauthorized Access / Malicious Grievance Activity
                  </option>
                  <option value="ADMINISTRATIVE_HOLD">
                    Administrative Review Hold
                  </option>
                  <option value="OTHER">Other Documented Reason</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="suspension-reason"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Documented Justification Reason{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="suspension-reason"
                  required
                  rows={3}
                  placeholder="Enter detailed justification for suspending this account. This will be preserved in the immutable audit log..."
                  value={suspensionReason}
                  onChange={(e) => onSetSuspensionReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600 placeholder:text-slate-400"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Audit logs require verifiable documentation for regulatory and
                  compliance review.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseSuspend}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSuspension || !suspensionReason.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-700 disabled:opacity-50"
                >
                  {isSubmittingSuspension ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Suspending...</span>
                    </>
                  ) : (
                    <>
                      <UserX className="h-3.5 w-3.5" />
                      <span>Confirm Account Suspension</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reactivationModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-emerald-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-800">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Reactivate User Account
                  </h3>
                  <p className="text-xs text-slate-500">
                    Restore authentication and enterprise access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseReactivate}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {reactivationFeedback && (
              <div
                className={`mt-4 rounded-xl border p-3 text-xs ${
                  reactivationFeedback.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {reactivationFeedback.text}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">
                    {reactivationModalUser.first_name}{" "}
                    {reactivationModalUser.last_name || ""}
                  </span>
                  <span className="ml-2 font-mono text-xs text-slate-500">
                    ({reactivationModalUser.employee_code})
                  </span>
                </div>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">
                  {reactivationModalUser.role_name}
                </span>
              </div>
              <div className="mt-1 text-slate-600">
                {reactivationModalUser.email}
                {reactivationModalUser.department_name && (
                  <span className="ml-2 text-slate-400">
                    • {reactivationModalUser.department_name}
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={onSubmitReactivate} className="mt-4 space-y-3.5">
              <div>
                <label
                  htmlFor="reactivation-reason"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Reactivation Notes / Reason (Optional)
                </label>
                <textarea
                  id="reactivation-reason"
                  rows={2}
                  placeholder="e.g. Investigation completed, clearance reinstated..."
                  value={reactivationReason}
                  onChange={(e) => onSetReactivationReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseReactivate}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReactivation}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-900 disabled:opacity-50"
                >
                  {isSubmittingReactivation ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Reactivating...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Confirm Reactivation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
