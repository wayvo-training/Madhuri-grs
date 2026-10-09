import { MessageSquare } from "lucide-react";

export function GrievanceCommunicationEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 h-full w-full bg-slate-50/30 dark:bg-slate-950/40">
      <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/40 flex items-center justify-center text-[#0F766E] mb-4 shadow-2xs">
        <MessageSquare className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">
        Grievance Communication
      </h3>
      <p className="max-w-md text-xs sm:text-sm text-slate-500 dark:text-slate-400 mx-auto leading-relaxed">
        Select a grievance from the left panel to review chronological
        communication history, discuss inquiries with involved participants, or
        submit clarifications.
      </p>
    </div>
  );
}
