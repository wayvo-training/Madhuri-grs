import React from "react";
import { X, Send } from "lucide-react";
import { PriorityBadge } from "@/components/dashboard/badges";
import { useDepartmentHead } from "../DepartmentHeadContext";

export function AssignModal() {
  const {
    assignModalGrievance,
    setAssignModalGrievance,
    selectedStaffId,
    setSelectedStaffId,
    assignmentNote,
    setAssignmentNote,
    staffList,
    setStaffList,
    setGrievances,
    setActionSuccessMessage,
    loadData,
    currentDepartmentName,
  } = useDepartmentHead();

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalGrievance || !selectedStaffId) return;

    const staffMember = staffList.find((s) => s.id === selectedStaffId);
    if (!staffMember) return;

    setStaffList((prev) =>
      prev.map((s) => {
        if (s.id === selectedStaffId) {
          return { ...s, activeTickets: s.activeTickets + 1 };
        }
        if (assignModalGrievance.assignedStaffId === s.id) {
          return { ...s, activeTickets: Math.max(0, s.activeTickets - 1) };
        }
        return s;
      }),
    );

    setGrievances((prev) =>
      prev.map((g) =>
        g.id === assignModalGrievance.id
          ? {
              ...g,
              assignedStaffId: staffMember.id,
              assignedStaffName: staffMember.name,
              status: "ASSIGNED",
            }
          : g,
      ),
    );

    setActionSuccessMessage(
      `Dispatched ${assignModalGrievance.ticketCode} to ${staffMember.name}.`,
    );

    // Persist to real API
    fetch(`/api/department-head/grievances/${assignModalGrievance.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId: staffMember.id, note: assignmentNote }),
    })
      .then(() => loadData(undefined, true))
      .catch((err) => console.error("Failed to assign staff:", err));

    setAssignModalGrievance(null);
    setSelectedStaffId("");
    setAssignmentNote("");
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  if (!assignModalGrievance) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {assignModalGrievance.assignedStaffName
                  ? "Reassign Grievance"
                  : "Assign Grievance to Staff"}
              </h3>
              <p className="text-xs font-normal text-slate-500">
                Dispatching{" "}
                <span className="font-mono font-semibold text-[#064E3B]">
                  {assignModalGrievance.ticketCode}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAssignModalGrievance(null)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleAssignSubmit} className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
              <div className="font-semibold text-slate-900">
                {assignModalGrievance.title}
              </div>
              <div className="font-normal text-slate-600">
                Category: {assignModalGrievance.category} &rsaquo;{" "}
                {assignModalGrievance.subcategory}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <PriorityBadge priority={assignModalGrievance.priority} />
                <span className="font-normal text-slate-500">
                  Target SLA: {assignModalGrievance.slaDeadline}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="staff-select"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Select Department Officer{" "}
                <span className="text-rose-500">*</span>
              </label>
              <select
                id="staff-select"
                required
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
              >
                <option value="">
                  -- Choose an Officer from {currentDepartmentName} --
                </option>
                {staffList.map((staff) => (
                  <option
                    key={staff.id}
                    value={staff.id}
                    disabled={staff.status === "ON_LEAVE"}
                  >
                    {staff.name} ({staff.designation}) — {staff.activeTickets}
                    /{staff.maxCapacity} active tickets{" "}
                    {staff.status === "ON_LEAVE" ? "[ON LEAVE]" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="internal-instructions"
                className="block text-xs font-semibold text-slate-800 mb-1.5"
              >
                Internal Instructions & Priority Notes (Optional)
              </label>
              <textarea
                id="internal-instructions"
                rows={3}
                value={assignmentNote}
                onChange={(e) => setAssignmentNote(e.target.value)}
                placeholder="e.g. Please verify with payroll register for Feb before responding. Expedite due to high priority."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAssignModalGrievance(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedStaffId}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#064E3B] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-900 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Confirm Assignment</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}