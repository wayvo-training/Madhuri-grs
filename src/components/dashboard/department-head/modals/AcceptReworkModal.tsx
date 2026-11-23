"use client";

import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Shield,
  UserPlus,
  X,
} from "lucide-react";
import { PriorityBadge } from "@/components/dashboard/badges";
import type { GrievanceItem } from "@/types/department-head";

interface AcceptReworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  grievance: GrievanceItem | null;
  onAssignStaff: (grievance: GrievanceItem) => void;
  onDirectIntervene: (grievance: GrievanceItem) => void;
}

export function AcceptReworkModal({
  isOpen,
  onClose,
  grievance,
  onAssignStaff,
  onDirectIntervene,
}: AcceptReworkModalProps) {
  if (!isOpen || !grievance) return null;

  const isRework = grievance.status === "REWORK";
  const modalTitle = isRework
    ? "Accept Employee Rework Request"
    : "Accept Employee Reopening Request";
  const summaryDesc = isRework
    ? "The employee was unsatisfied with the earlier resolution and has requested rework. By accepting, a new SLA cycle begins for your department. Choose how this rework investigation will be handled:"
    : "The employee requested to reopen this closed grievance. By accepting, a new SLA cycle begins for your department. Choose how this investigation will be handled:";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200 shadow-2xs">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {modalTitle}
              </h3>
              <p className="text-xs text-slate-500">
                Ticket:{" "}
                <span className="font-medium text-slate-700">
                  {grievance.ticketCode}
                </span>{" "}
                · Select resolution pathway
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* Grievance Summary Box */}
          <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3.5 text-xs text-teal-950 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-teal-900 line-clamp-1">
                {grievance.title}
              </span>
              <PriorityBadge priority={grievance.priority} />
            </div>
            <p className="text-[11px] text-teal-800 leading-relaxed">
              {summaryDesc}
            </p>
          </div>

          {/* Action Choice Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Card 1: Assign to Staff */}
            <button
              type="button"
              onClick={() => onAssignStaff(grievance)}
              className="group relative flex flex-col justify-between text-left rounded-xl border-2 border-slate-200 bg-white p-4.5 hover:border-teal-500 hover:bg-teal-50/30 transition shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100/70 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    Delegated
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 group-hover:text-teal-950">
                    Assign Grievance Staff
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Delegate rework investigation to an eligible departmental
                    grievance staff using smart workload & skill
                    recommendations.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-teal-700 group-hover:translate-x-0.5 transition-transform">
                <span>Assign Grievance Staff</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>

            {/* Card 2: Assume Authority */}
            <button
              type="button"
              onClick={() => onDirectIntervene(grievance)}
              className="group relative flex flex-col justify-between text-left rounded-xl border-2 border-slate-200 bg-white p-4.5 hover:border-emerald-500 hover:bg-emerald-50/30 transition shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Direct Ownership
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-950">
                    Assume Authority
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Take personal responsibility as Department Head to lead
                    investigation and submit the revised resolution directly.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                <span>Assume Authority Directly</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-600 flex items-center gap-2">
            <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>
              Both options accept the rework request and allocate the dedicated
              rework SLA cycle.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-3 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
