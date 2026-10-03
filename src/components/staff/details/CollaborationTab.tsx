import { CheckCircle2, Clock, MessagesSquare, Send, Users } from "lucide-react";
import { useState } from "react";
import type { StaffGrievanceItem } from "@/types/staff";

interface CollaborationTabProps {
  grievance: StaffGrievanceItem;
  onAddNote?: (grievanceId: string, note: string) => Promise<void>;
}

export function CollaborationTab({
  grievance,
  onAddNote,
}: CollaborationTabProps) {
  const departments = grievance.departmentsInvolved || [];
  const crossDeptNotes = (grievance.internalNotes || []).filter(
    (n) => n.role.includes("Staff") || n.role.includes("Department Head"),
  );

  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !onAddNote || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddNote(grievance.id, noteText.trim());
      setNoteText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departments Involved Progress */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h4 className="font-bold">Department Progress</h4>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className={`p-3 rounded-xl border ${
                  dept.involvementType === "PRIMARY"
                    ? "border-teal-200 bg-teal-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-slate-800">
                    {dept.departmentName}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      dept.involvementType === "PRIMARY"
                        ? "bg-teal-100 text-teal-800"
                        : dept.involvementType === "EQUAL"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {dept.involvementType}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Staff Assigned:</span>
                    <span className="font-medium text-slate-900">
                      {dept.assignedStaff || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <span className="inline-flex items-center gap-1 font-medium text-slate-900">
                      {dept.status === "COMPLETED" ||
                      dept.status === "RESOLVED" ||
                      dept.status === "CLOSED" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Clock className="w-3 h-3 text-amber-500" />
                      )}
                      {dept.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-Department Notes & Communication */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2 text-slate-800">
              <MessagesSquare className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold">Cross-Department Collaboration</h4>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Shared case timeline
            </span>
          </div>

          {/* Notes Feed */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-[280px] overflow-y-auto space-y-3">
            {crossDeptNotes.length > 0 ? (
              crossDeptNotes.map((note) => (
                <div key={note.id} className="text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800 text-xs">
                      {note.author}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {note.timestamp}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs whitespace-pre-wrap text-xs leading-relaxed">
                    {note.note}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-slate-400 py-6">
                No cross-department communication yet. Use the box below to coordinate.
              </div>
            )}
          </div>

          {/* Direct Collaboration Composer */}
          {onAddNote && (
            <form onSubmit={handleSendNote} className="space-y-2 pt-1">
              <textarea
                rows={2}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Post an update for collaborating departments (e.g. 'Invoices audited. Finance sign-off completed; forwarding for Compliance review.')..."
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-teal-600 focus:ring-1 focus:ring-teal-600 shadow-2xs resize-none"
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">
                  Visible to all assigned officers & department heads
                </span>
                <button
                  type="submit"
                  disabled={!noteText.trim() || isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#115E59] disabled:opacity-50 transition cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSubmitting ? "Sending..." : "Send Note"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
