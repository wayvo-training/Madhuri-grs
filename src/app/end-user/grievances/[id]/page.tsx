import { DashboardShell } from "@/components/dashboard/shell";
import { requirePageRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StatusBadge, PriorityBadge } from "@/components/dashboard/badges";
import { FileText, Paperclip, MessageSquare, Send, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PrintButton } from "@/components/end-user/print-button";
import { AdditionalInfoModal } from "@/components/end-user/additional-info-modal";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function GrievanceDetailsPage({ params }: PageProps) {
  const user = await requirePageRole("END_USER");
  const fullName = `${user.first_name} ${user.last_name || ""}`.trim();
  const { id } = await params;

  const grievanceId = parseInt(id, 10);
  if (isNaN(grievanceId)) return notFound();

  const grievance = await prisma.grievances.findUnique({
    where: {
      grievance_id: grievanceId,
      submitted_by: user.user_id, // Ensure user can only see their own
    },
    include: {
      categories: true,
      subcategories: true,
      attachments: true,
      grievance_departments: {
        include: { departments: true }
      },
      resolutions: true,
      grievance_status_history: {
        orderBy: { changed_at: "asc" },
        include: {
          users: {
            select: { first_name: true, last_name: true, roles: { select: { role_name: true } } }
          }
        }
      },
      audit_logs: {
        where: {
          action: {
            in: ["ADDITIONAL_INFO_REQUESTED", "USER_INFO_SUBMITTED", "USER_ADDITIONAL_INFO_PROVIDED"]
          }
        },
        orderBy: { created_at: "desc" }
      }
    },
  });

  if (!grievance) return notFound();

  const eligibleStatuses = ["PENDING", "SUBMITTED", "ROUTED", "ASSIGNED", "IN_PROGRESS", "WAITING_ON_USER", "WAITING_ON_EMPLOYEE", "REOPENED"];
  const canProvideAdditionalInfo = eligibleStatuses.includes(grievance.status);
  
  // Calculate messages count (1 submission message + audit logs + resolutions)
  const messagesCount = 1 + grievance.audit_logs.length + (grievance.resolutions?.length || 0);

  return (
    <DashboardShell
      userRole="END_USER"
      userName={fullName}
      userEmail={user.email}
      permissions={user.permissions}
      title={`Grievance ${grievance.grievance_number}`}
      subtitle="View full details and communication for your grievance."
    >
      <div className="max-w-4xl mx-auto h-full flex flex-col gap-6">
        

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col min-h-0 flex-1 shadow-sm">
              <div className="flex items-center justify-between mb-6 shrink-0 print:mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Grievance Details</h2>
                <div className="flex gap-3 print:hidden">
                  <PrintButton />
                  <Link href={`/end-user/track?id=${grievance.grievance_number}`}>
                    <Button variant="outline" className="flex items-center gap-2 rounded-xl text-sm font-medium">
                      Track Live
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-8 overflow-y-auto custom-scrollbar pr-2 min-h-0 flex-1 print:overflow-visible">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-3 uppercase">Grievance Statement & Particulars</h3>
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">Title</div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{grievance.title}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">Category</div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {grievance.categories?.category_name || "N/A"} • {grievance.subcategories?.subcategory_name || "N/A"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">Status</div>
                        <div><StatusBadge status={grievance.status} /></div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">Priority</div>
                        <div><PriorityBadge priority={grievance.priority} /></div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">Submitted On</div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {new Date(grievance.created_at).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                      <div className="text-xs font-medium text-slate-500 mb-2">Description</div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        {grievance.description}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-3 uppercase">
                    Attached Proofs & Documentation ({grievance.attachments?.length || 0})
                  </h3>
                  
                  {grievance.attachments && grievance.attachments.length > 0 ? (
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                      {grievance.attachments.map((doc: any, i: number) => {
                        const fileExt = doc.file_name.split('.').pop() || "unknown";
                        return (
                          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition hover:shadow-sm gap-4">
                            <div className="flex items-center gap-4">
                              <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-900/30 shrink-0">
                                <FileText className="h-5 w-5 text-rose-500" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{doc.file_name}</span>
                                <span className="text-xs text-slate-500 mt-0.5">
                                  {(Number(doc.file_size) / 1024).toFixed(0)} KB • {fileExt === 'pdf' ? 'application/pdf' : `image/${fileExt}`}
                                </span>
                              </div>
                            </div>
                            <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="shrink-0 print:hidden">
                              <Button variant="outline" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 rounded-full h-8 px-4 text-xs font-bold shadow-none w-full sm:w-auto">
                                <Eye className="h-3.5 w-3.5 mr-1.5" /> View Proof
                              </Button>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                      <p className="text-sm text-slate-500">No documents attached to this grievance.</p>
                    </div>
                  )}
                </div>

                {/* Additional Information Section */}
                {canProvideAdditionalInfo && (
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-8 print:hidden">
                    <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-3 uppercase">Additional Information</h3>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Need to provide additional clarification or documents?</h4>
                        <p className="text-xs text-slate-500 mt-1">You can provide additional information related to this grievance without changing your original submission.</p>
                      </div>
                      <div className="shrink-0">
                        <AdditionalInfoModal grievanceId={grievance.grievance_id.toString()} />
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
            
          </div>
    </DashboardShell>
  );
}
