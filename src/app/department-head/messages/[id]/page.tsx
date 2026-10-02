import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AlertCircle, ExternalLink, MessageSquare, Paperclip } from "lucide-react";
import Link from "next/link";
import { StaffMessageComposer } from "@/components/staff/staff-message-composer";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DepartmentHeadGrievanceMessagesPage({ params }: PageProps) {
  const user = await requirePageRole(["DEPARTMENT_HEAD", "ADMIN"]);
  const { id } = await params;
  const isAdmin = user.roles.role_name === "ADMIN";

  let grievanceId = parseInt(id, 10);
  if (isNaN(grievanceId)) return notFound();

  let deptId = user.department_id;
  if (!deptId && isAdmin) {
    const firstDept = await prisma.departments.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { department_id: "asc" },
    });
    if (firstDept) deptId = firstDept.department_id;
  }

  // Ensure DH can only view messages for grievances in their department
  const grievance = await prisma.grievances.findUnique({
    where: {
      grievance_id: grievanceId,
      grievance_departments: {
        department_id: deptId,
      }
    },
    include: {
      users: true, // to get end user name
      audit_logs: {
        where: {
          action: {
            in: ["ADDITIONAL_INFO_REQUESTED", "USER_INFO_SUBMITTED", "USER_ADDITIONAL_INFO_PROVIDED"]
          }
        },
        orderBy: { created_at: "asc" }
      },
      resolutions: {
        orderBy: { submitted_at: "asc" }
      }
    },
  });

  if (!grievance) return notFound();

  const endUserName = `${grievance.users.first_name} ${grievance.users.last_name || ""}`.trim();

  // Combine audit_logs and resolutions into a single timeline
  type TimelineItem = {
    id: string;
    type: "REQUEST" | "RESPONSE" | "RESOLUTION";
    timestamp: Date;
    author: string;
    role: string;
    message: string;
    attachments: string[];
    isStaff: boolean;
  };

  const timeline: TimelineItem[] = [];

  // Always start the conversation with the submission event
  timeline.push({
    id: `submission-${grievance.grievance_id}`,
    type: "RESPONSE",
    timestamp: grievance.created_at,
    author: endUserName,
    role: "End User",
    message: "Grievance submitted by the user. Initial review is required.",
    attachments: [],
    isStaff: false,
  });

  grievance.audit_logs.forEach((log) => {
    const info = log.new_value as any;
    if (log.action === "ADDITIONAL_INFO_REQUESTED") {
      timeline.push({
        id: `audit-${log.audit_log_id}`,
        type: "REQUEST",
        timestamp: log.created_at,
        author: info?.author || "Staff Member",
        role: "Staff",
        message: info?.message || "Requested additional information.",
        attachments: info?.requestedDocs || [],
        isStaff: true,
      });
    } else if (log.action === "USER_INFO_SUBMITTED" || log.action === "USER_ADDITIONAL_INFO_PROVIDED") {
      timeline.push({
        id: `audit-${log.audit_log_id}`,
        type: "RESPONSE",
        timestamp: log.created_at,
        author: endUserName,
        role: "End User",
        message: info?.response || info?.message || "Additional information submitted.",
        attachments: info?.uploadedFiles || [],
        isStaff: false,
      });
    }
  });

  grievance.resolutions.forEach((res) => {
    timeline.push({
      id: `res-${res.resolution_id}`,
      type: "RESOLUTION",
      timestamp: res.submitted_at,
      author: "Processing Team",
      role: "Staff",
      message: res.action_taken || "Resolution provided.",
      attachments: [],
      isStaff: true,
    });
  });

  // Sort by timestamp asc
  timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden relative">
      {/* Header Area */}
      <div className="flex-none p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 shadow-sm flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
          {grievance.grievance_number}
        </h2>
        <Link
          href={`/department-head/dashboard?grievance=${grievance.grievance_id}`}
          className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1.5"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Open in Dashboard</span>
          <span className="sm:hidden">Dashboard</span>
        </Link>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/50 space-y-6">

        {timeline.length === 0 ? (
          <div className="text-center p-8 text-slate-500 my-auto">
            <MessageSquare className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p>No messages in this conversation yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timeline.map((item) => (
              <div key={item.id} className={`flex flex-col ${item.isStaff ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{item.author}</span>
                  <span>•</span>
                  <span>{item.role}</span>
                  <span>•</span>
                  <span>
                    {item.timestamp.toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                  item.isStaff 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : item.type === 'RESOLUTION'
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 rounded-tl-sm'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                }`}>
                  <p className={`whitespace-pre-wrap text-[13px] leading-relaxed ${item.author === 'System' ? 'text-slate-500 dark:text-slate-400 italic' : ''}`}>
                    {item.message}
                  </p>
                  
                  {item.attachments.length > 0 && (
                    <div className="mt-3 space-y-1 border-t border-black/10 dark:border-white/10 pt-2">
                      <span className={`text-[11px] font-bold ${item.isStaff ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {item.type === 'REQUEST' ? 'Requested Documents:' : 'Attached Documents:'}
                      </span>
                      <ul className={`list-disc pl-5 text-[13px] ${item.isStaff ? 'text-indigo-50' : 'text-slate-600 dark:text-slate-300'} space-y-0.5`}>
                        {item.attachments.map((doc, idx) => (
                          <li key={idx}>
                            {item.isStaff ? (
                              doc
                            ) : (
                              <div className="flex items-center gap-1">
                                <Paperclip className="h-3.5 w-3.5" /> {doc}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {grievance.status !== "CLOSED" && grievance.status !== "RESOLVED" ? (
          <div className="pt-4">
            <StaffMessageComposer grievanceId={grievance.grievance_id.toString()} />
          </div>
        ) : (
          <div className="mt-8 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              This grievance has been {grievance.status.toLowerCase()}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
