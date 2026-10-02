import { MessageSquare } from "lucide-react";

export default function AdminMessagesPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 h-full w-full">
      <MessageSquare className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4 opacity-50" />
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">System Messages</h3>
      <p className="max-w-sm text-sm text-slate-500 mx-auto">
        Select a grievance from the sidebar to view communication history between staff and end users.
      </p>
    </div>
  );
}
