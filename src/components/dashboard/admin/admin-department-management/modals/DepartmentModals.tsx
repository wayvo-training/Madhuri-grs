import { Building2, CheckCircle2, Loader2, Pencil, X } from "lucide-react";
import type { DepartmentHeadOption } from "@/types/admin/departments";

export interface DepartmentModalsProps {
  isModalOpen: boolean;

  deptName: string;
  deptCode: string;
  selectedHeadId: string;
  description: string;
  contactEmail: string;

  isSubmitting: boolean;
  departmentHeads: DepartmentHeadOption[];
  onCloseCreate: () => void;
  onSubmitCreate: (e: React.FormEvent) => void;
  onSetDeptName: (value: string) => void;
  onSetDeptCode: (value: string) => void;
  onSetSelectedHeadId: (value: string) => void;
  onSetDescription: (value: string) => void;
  onSetContactEmail: (value: string) => void;

  isEditModalOpen: boolean;
  editDeptName: string;
  editDescription: string;
  editStatus?: "ACTIVE" | "INACTIVE";
  onSetEditStatus?: (val: "ACTIVE" | "INACTIVE") => void;

  isEditSubmitting: boolean;

  onCloseEdit: () => void;
  onSubmitEdit: (e: React.FormEvent) => void;
  onSetEditDeptName: (value: string) => void;
  onSetEditDescription: (value: string) => void;
}

export function DepartmentModals({
  isModalOpen,

  deptName,
  deptCode,
  selectedHeadId,
  description,
  contactEmail,

  isSubmitting,
  departmentHeads,
  onCloseCreate,
  onSubmitCreate,
  onSetDeptName,
  onSetDeptCode,
  onSetSelectedHeadId,
  onSetDescription,
  onSetContactEmail,

  isEditModalOpen,
  editDeptName,
  editDescription,
  editStatus,

  isEditSubmitting,

  onCloseEdit,
  onSubmitEdit,
  onSetEditDeptName,
  onSetEditDescription,
  onSetEditStatus,
}: DepartmentModalsProps) {
  return (
    <>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-800">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Create New Department
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

            <form onSubmit={onSubmitCreate} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="new-dept-name"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Department Name <span className="text-amber-800">*</span>
                </label>
                <input
                  id="new-dept-name"
                  type="text"
                  required
                  placeholder="e.g. Legal & Compliance, Facilities Management, People Ops"
                  value={deptName}
                  onChange={(e) => onSetDeptName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="new-dept-code"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Department Code <span className="text-amber-800">*</span>
                </label>
                <input
                  id="new-dept-code"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. FIN, HR, IT, LEGAL"
                  value={deptCode}
                  onChange={(e) => onSetDeptCode(e.target.value.toUpperCase())}
                  className="mt-1 h-9 w-full uppercase font-mono rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="new-dept-head"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Department Head <span className="text-amber-800">*</span>
                </label>
                <select
                  id="new-dept-head"
                  required
                  value={selectedHeadId}
                  onChange={(e) => {
                    const id = e.target.value;
                    onSetSelectedHeadId(id);
                    const head = departmentHeads.find((h) => h.user_id === id);
                    if (head && !contactEmail) {
                      onSetContactEmail(head.email);
                    }
                  }}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white cursor-pointer"
                >
                  <option value="">Select Department Head</option>
                  {departmentHeads.map((head) => (
                    <option key={head.user_id} value={head.user_id}>
                      {head.first_name} {head.last_name} ({head.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="new-dept-email"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Department Contact Email{" "}
                  <span className="text-amber-800">*</span>
                </label>
                <input
                  id="new-dept-email"
                  type="email"
                  required
                  placeholder="finance@company.com"
                  value={contactEmail}
                  onChange={(e) => onSetContactEmail(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="new-dept-desc"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Mandate & Scope Description{" "}
                    <span className="text-amber-800">*</span>
                  </label>
                  <span
                    className={`text-xs font-mono ${
                      description.trim().length >= 20
                        ? "text-slate-500"
                        : "text-amber-800 font-semibold"
                    }`}
                  >
                    {description.length} / 255 (min 20 chars)
                  </span>
                </div>
                <textarea
                  id="new-dept-desc"
                  rows={3}
                  required
                  maxLength={255}
                  placeholder="Describe specific grievances handled (e.g. Responsible for workplace disputes, leave policies, payroll issues, and employee benefits)..."
                  value={description}
                  onChange={(e) => onSetDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseCreate}
                  className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !deptName.trim() ||
                    !deptCode.trim() ||
                    !selectedHeadId ||
                    !contactEmail.trim() ||
                    description.trim().length < 20
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] disabled:opacity-50 transition"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Create Department</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-800">
                  <Pencil className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Department
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseEdit}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onSubmitEdit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="edit-dept-name"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="edit-dept-name"
                  type="text"
                  required
                  value={editDeptName}
                  onChange={(e) => onSetEditDeptName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-dept-desc"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="edit-dept-desc"
                  rows={2}
                  value={editDescription}
                  onChange={(e) => onSetEditDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {onSetEditStatus && (
                  <button
                    type="button"
                    onClick={() =>
                      onSetEditStatus(
                        editStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                      )
                    }
                    className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition ${
                      editStatus === "ACTIVE"
                        ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                        : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    {editStatus === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                )}

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={onCloseEdit}
                    className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isEditSubmitting ||
                      !editDeptName.trim() ||
                      editDescription.trim().length < 20
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] disabled:opacity-50 transition"
                  >
                    {isEditSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Apply Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
