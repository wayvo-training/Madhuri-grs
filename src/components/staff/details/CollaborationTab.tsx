import { formatRelativeTime } from "@/lib/staff/utils";
import type { StaffGrievanceItem } from "@/types/staff";
import { Users, MessagesSquare, CheckCircle2, Clock } from "lucide-react";

interface CollaborationTabProps {
  grievance: StaffGrievanceItem;
}

export function CollaborationTab({ grievance }: CollaborationTabProps) {
  const departments = grievance.departmentsInvolved || [];
  const crossDeptNotes = (grievance.internalNotes || []).filter(
    (n) => n.role.includes("Staff") || n.role.includes("Department Head"),
  );

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
                      {dept.status === "COMPLETED" || dept.status === "RESOLVED" || dept.status === "CLOSED" ? (
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

        {/* Cross-Department Notes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
            <MessagesSquare className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold">Cross-Department Collaboration</h4>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-[400px] overflow-y-auto">
            {crossDeptNotes.length > 0 ? (
              <div className="space-y-4">
                {crossDeptNotes.map((note) => (
                  <div key={note.id} className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800 text-xs">
                        {note.author}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {note.timestamp}
                      </span>
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-sm whitespace-pre-wrap">
                      {note.note}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-slate-500 py-6">
                No cross-department communication yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
