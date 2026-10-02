import { MessageSquare } from "lucide-react";

export default function MessagesIndexPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-900/50">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-full shadow-sm mb-6 border border-slate-100 dark:border-slate-700">
        <MessageSquare className="h-10 w-10 text-indigo-300 dark:text-indigo-600" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Your Messages</h2>
      <p className="text-sm text-slate-500 max-w-sm">
        Select a grievance from the sidebar to view communication history, respond to requests, and check resolution updates.
      </p>
    </div>
  );
}
