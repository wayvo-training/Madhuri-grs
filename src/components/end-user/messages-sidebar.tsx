"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Clock, Paperclip } from "lucide-react";

export function MessagesSidebar({ messages, basePath = "/end-user/messages" }: { messages: any[], basePath?: string }) {
  const pathname = usePathname();

  return (
    <>
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Messages</h2>
        <p className="text-xs text-slate-500 mb-4">View and respond to communication on your grievances.</p>
        
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search messages..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition"
          />
        </div>

        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          <button className="whitespace-nowrap px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-medium">
            All ({messages.length})
          </button>
          <button className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-medium">
            Action Required
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="text-sm">No messages found.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {messages.map((msg) => {
              const isActive = pathname === `${basePath}/${msg.id}`;
              
              return (
                <Link
                  key={msg.id}
                  href={`${basePath}/${msg.id}`}
                  className={`block p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    isActive ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-l-4 border-indigo-600" : "border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {msg.grievanceNumber}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(msg.timestamp).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <h4 className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate mb-2">{msg.title}</h4>
                  
                  {msg.requiresResponse && (
                    <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                      Action Required
                    </span>
                  )}
                  
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                    {msg.preview}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>{msg.sender}</span>
                    {msg.hasAttachments && (
                      <span className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" /> 1 Attachment
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
