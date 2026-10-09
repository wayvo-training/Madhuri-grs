"use client";

import { FileText } from "lucide-react";
import { GrievanceQueue } from "@/components/staff/grievance-queue";
import type { StaffGrievanceItem } from "@/types/staff";

interface QueueViewProps {
  grievances: StaffGrievanceItem[];
  categories?: string[];
  staffName: string;
  staffEmail: string;
  onExamine: (grievance: StaffGrievanceItem) => void;
  onResolve: (grievance: StaffGrievanceItem) => void;
  initialTab?:
    | "all"
    | "in_progress"
    | "at_risk"
    | "breached"
    | "reopened"
    | "completed";
}

export function QueueView({
  grievances,
  categories,
  staffName,
  staffEmail,
  onExamine,
  onResolve,
  initialTab = "all",
}: QueueViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0F766E]" />
            My Grievances Queue
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete list of grievances assigned to you for investigation,
            inquiry, and resolution processing.
          </p>
        </div>
      </div>

      <GrievanceQueue
        grievances={grievances}
        categories={categories}
        staffName={staffName}
        staffEmail={staffEmail}
        onExamine={onExamine}
        onResolve={onResolve}
        initialTab={initialTab}
      />
    </div>
  );
}
