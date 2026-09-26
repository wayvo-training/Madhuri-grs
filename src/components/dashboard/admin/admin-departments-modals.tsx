import {
  Building2,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Pencil,
  X,
} from "lucide-react";

interface DepartmentHeadOption {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface DepartmentModalsProps {
  isModalOpen: boolean;
  feedback: { type: "success" | "error"; text: string } | null;
  deptName: string;
  deptCode: string;
  selectedHeadId: string;
  description: string;
  contactEmail: string;
  deptStatus: "ACTIVE" | "INACTIVE";
  isSubmitting: boolean;
  departmentHeads: DepartmentHeadOption[];
  onCloseCreate: () => void;
  onSubmitCreate: (e: React.FormEvent) => void;
  onSetDeptName: (value: string) => void;
  onSetDeptCode: (value: string) => void;
  onSetSelectedHeadId: (value: string) => void;
  onSetDescription: (value: string) => void;
  onSetContactEmail: (value: string) => void;
  onSetDeptStatus: (value: "ACTIVE" | "INACTIVE") => void;
  isEditModalOpen: boolean;
  editDeptName: string;
  editDescription: string;
  editStatus: "ACTIVE" | "INACTIVE";
  isEditSubmitting: boolean;
  editFeedback: { type: "success" | "error"; text: string } | null;
  onCloseEdit: () => void;
  onSubmitEdit: (e: React.FormEvent) => void;
  onSetEditDeptName: (value: string) => void;
  onSetEditDescription: (value: string) => void;
  onSetEditStatus: (value: "ACTIVE" | "INACTIVE") => void;
}

export function DepartmentModals({
  isModalOpen,
  feedback,
  deptName,
  deptCode,
  selectedHeadId,
  description,
  contactEmail,
  deptStatus,
  isSubmitting,
  departmentHeads,
  onCloseCreate,
  onSubmitCreate,
  onSetDeptName,
  onSetDeptCode,
  onSetSelectedHeadId,
  onSetDescription,
  onSetContactEmail,
  onSetDeptStatus,
  isEditModalOpen,
  editDeptName,
  editDescription,
  editStatus,
  isEditSubmitting,
  editFeedback,
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
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white"
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

              <div>
                <label
                  htmlFor="new-dept-status"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Initial Status
                </label>
                <div className="relative mt-1">
                  <select
                    id="new-dept-status"
                    value={deptStatus}
                    onChange={(e) =>
                      onSetDeptStatus(e.target.value as "ACTIVE" | "INACTIVE")
                    }
                    className="h-9 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-3 pr-8 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white"
                  >
                    <option value="ACTIVE">ACTIVE (Accepts grievances)</option>
                    <option value="INACTIVE">
                      INACTIVE (Routing suspended)
                    </option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 disabled:opacity-50"
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

              <div>
                <label
                  htmlFor="edit-dept-status"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Department Status
                </label>
                <div className="relative mt-1">
                  <select
                    id="edit-dept-status"
                    value={editStatus}
                    onChange={(e) =>
                      onSetEditStatus(e.target.value as "ACTIVE" | "INACTIVE")
                    }
                    className="h-9 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-3 pr-8 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white"
                  >
                    <option value="ACTIVE">ACTIVE (Accepts grievances)</option>
                    <option value="INACTIVE">
                      INACTIVE (Routing suspended)
                    </option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-900 disabled:opacity-50"
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
    </>
  );
}
