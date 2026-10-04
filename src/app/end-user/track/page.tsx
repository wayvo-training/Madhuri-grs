import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { TrackSearch } from "@/components/end-user/track-search";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/dashboard/badges";
import { Check, SearchX } from "lucide-react";
import { ReopenButton } from "@/components/end-user/reopen-button";
import { AcceptResolutionButton } from "@/components/end-user/accept-resolution-button";

interface PageProps {
  searchParams: Promise<{
    id?: string;
  }>;
}

const mapStatusToStage = (status: string) => {
  switch (status) {
    case 'PENDING':
    case 'SUBMITTED': return 'SUBMITTED';
    case 'ROUTED': return 'ROUTED';
    case 'ASSIGNED': return 'ASSIGNED';
    case 'IN_PROGRESS':
    case 'ESCALATED': return 'IN_PROGRESS';
    case 'REOPENED': return 'REOPENED';
    case 'UNDER_REVIEW': return 'HEAD_REVIEW';
    case 'RESOLVED':
    case 'RESOLUTION': return 'RESOLUTION';
    case 'EMPLOYEE_REVIEW': return 'EMPLOYEE_REVIEW';
    case 'CLOSED': return 'CLOSED';
    default: return null;
  }
};

const getStageInfo = (id: string, grievance: any) => {
  switch (id) {
    case "SUBMITTED": return { label: "Submitted", desc: "Grievance submitted successfully." };
    case "ROUTED": return { label: "Routed", desc: `Routed to ${grievance?.grievance_departments?.[0]?.departments?.department_name || "department"}.` };
    case "ASSIGNED": return { label: "Assigned", desc: "Assigned for investigation." };
    case "IN_PROGRESS": return { label: "In Progress", desc: "Investigation is in progress." };
    case "HEAD_REVIEW": return { label: "Head Review", desc: "Department Head is reviewing the resolution." };
    case "RESOLUTION": return { label: "Resolution", desc: "Resolution proposed." };
    case "EMPLOYEE_REVIEW": return { label: "Citizen Review", desc: "Awaiting your review." };
    case "REOPENED": return { label: "Reopened", desc: "Grievance has been reopened." };
    case "CLOSED": return { label: "Closed", desc: "Grievance is closed." };
    default: return { label: id, desc: "" };
  }
};

export default async function EndUserTrackPage(props: PageProps) {
  const user = await requirePageRole("END_USER");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  
  const searchParams = await props.searchParams;
  const trackId = searchParams.id;

  let grievance = null;
  let rawEvents: any[] = [];

  if (trackId) {
    const trimmed = trackId.trim();
    const isNumeric = /^\d+$/.test(trimmed);

    grievance = await prisma.grievances.findFirst({
      where: {
        OR: [
          { grievance_number: { equals: trimmed, mode: "insensitive" } },
          ...(isNumeric ? [{ grievance_id: BigInt(trimmed) }] : []),
        ],
        submitted_by: user.user_id,
      },
      include: {
        grievance_departments: {
          include: {
            departments: true,
          }
        }
      }
    });

    if (grievance) {
      const history = await prisma.grievance_status_history.findMany({
        where: { grievance_id: grievance.grievance_id },
        orderBy: { changed_at: "asc" },
      });

      // Fallback: If current status is not the last history event, append it manually
      // so the UI never falls out of sync with the actual db status.
      const lastEvent = history[history.length - 1];
      if (!lastEvent || lastEvent.new_status !== grievance.status) {
        history.push({
          history_id: "current_injected",
          new_status: grievance.status,
          changed_at: new Date(),
        } as any);
      }

      rawEvents = [
        {
          history_id: "submission",
          new_status: "SUBMITTED",
          changed_at: grievance.created_at,
        },
        ...history
      ];
    }
  }

  const timelineNodes: any[] = [];
  const seen = new Set();
  
  if (grievance) {
    // 1. Add historical stages
    rawEvents.forEach(evt => {
      const stageId = mapStatusToStage(evt.new_status);
      if (stageId && !seen.has(stageId)) {
        seen.add(stageId);
        timelineNodes.push({
          id: stageId,
          date: evt.changed_at,
          isCompleted: true,
          isCurrent: false,
          isFuture: false
        });
      }
    });

    // 2. Set current stage
    if (timelineNodes.length > 0) {
      timelineNodes[timelineNodes.length - 1].isCurrent = true;
      timelineNodes[timelineNodes.length - 1].isCompleted = false;
      if (timelineNodes[timelineNodes.length - 1].id === "CLOSED") {
         timelineNodes[timelineNodes.length - 1].isCompleted = true; 
      }
    }

    // 3. Add future stages
    const standardFlow = ["SUBMITTED", "ROUTED", "ASSIGNED", "IN_PROGRESS", "RESOLUTION", "EMPLOYEE_REVIEW", "CLOSED"];
    const lastNode = timelineNodes[timelineNodes.length - 1];
    
    if (lastNode && lastNode.id !== "CLOSED") {
      let lastIndex = standardFlow.indexOf(lastNode.id);
      
      // If we are currently at HEAD_REVIEW, skip to CLOSED
      if (lastNode.id === "HEAD_REVIEW") {
        lastIndex = standardFlow.indexOf("EMPLOYEE_REVIEW");
      }
      // If the last recognized step is REOPENED (missing from flow)
      else if (lastNode.id === "REOPENED") {
        lastIndex = standardFlow.indexOf("ASSIGNED");
      }

      const startIndex = lastIndex !== -1 ? lastIndex + 1 : standardFlow.indexOf("IN_PROGRESS");
      
      for (let i = startIndex; i < standardFlow.length; i++) {
        const futureId = standardFlow[i];
        if (!seen.has(futureId)) {
          timelineNodes.push({
            id: futureId,
            isCompleted: false,
            isCurrent: false,
            isFuture: true
          });
        }
      }
    }
  }

  return (
    <DashboardShell
      userRole="END_USER"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title="Track Your Grievance"
      subtitle="Enter your grievance number to view the current status."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Search Bar Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">Check Status</h2>
          <div className="w-full max-w-md">
            <TrackSearch />
          </div>
        </div>

        {/* Results Container */}
        {trackId && !grievance && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-12 shadow-sm text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
              <SearchX className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Grievance Not Found</h3>
            <p className="mt-2 text-sm text-slate-500">We couldn't find a grievance matching <span className="font-mono font-bold">"{trackId}"</span>.</p>
          </div>
        )}

        {trackId && grievance && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            
            {/* Compact Grievance Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-5 mb-8 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{grievance.grievance_number}</h3>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">{grievance.title}</p>
                <p className="text-xs text-slate-500 mt-1">Submitted: {new Date(grievance.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-500">Current Status</span>
                <StatusBadge status={grievance.status} />
              </div>
            </div>
            
            {/* Action Buttons */}
            {grievance.status === "RESOLVED" && (
              <div className="flex justify-end gap-3 mb-8">
                <AcceptResolutionButton grievanceId={grievance.grievance_id.toString()} />
                <ReopenButton grievanceId={grievance.grievance_id.toString()} />
              </div>
            )}
            
            {/* Stepper Timeline */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6">Grievance Progress</h4>
              
              <div className="flex flex-col md:flex-row md:items-start justify-between relative mt-2">
                {/* Horizontal progress line for desktop */}
                <div className="hidden md:block absolute top-[11px] left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700 z-0 mx-[50px]"></div>
                
                {timelineNodes.map((node, index) => {
                  const isLast = index === timelineNodes.length - 1;
                  const info = getStageInfo(node.id, grievance);
                  
                  return (
                    <div key={node.id} className="relative z-10 flex flex-row md:flex-col items-start md:items-center gap-4 md:gap-3 mb-8 md:mb-0 flex-1">
                      {/* Vertical progress line for mobile */}
                      {!isLast && <div className="md:hidden absolute left-[11px] top-6 bottom-[-32px] w-0.5 bg-slate-200 dark:bg-slate-700 z-0"></div>}
                      
                      {/* Node Circle */}
                      <div className="relative z-10 bg-white dark:bg-slate-900 md:px-2">
                        {node.isCompleted ? (
                          <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        ) : node.isCurrent ? (
                          <div className="h-6 w-6 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        ) : node.isFuture ? (
                          <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                          </div>
                        ) : null}
                      </div>

                      {/* Node Text */}
                      <div className="flex flex-col md:items-center text-left md:text-center mt-0.5 md:mt-0">
                        <div className={`text-sm font-bold ${node.isFuture ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                          {info.label}
                        </div>
                        {node.date && (
                          <div className="text-[11px] font-medium text-slate-500 mt-0.5 whitespace-nowrap">
                            {new Date(node.date).toLocaleString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                        )}
                        <div className={`text-[12px] mt-1 max-w-[140px] leading-tight ${node.isFuture ? 'text-slate-400 dark:text-slate-600' : 'text-slate-600 dark:text-slate-400'}`}>
                          {info.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
