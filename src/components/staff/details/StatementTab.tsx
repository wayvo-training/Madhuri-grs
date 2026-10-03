"use client";

import {
  AlertCircle,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  FileQuestion,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Mail,
  Play,
  Send,
  Shield,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import {
  type KnowledgeArticleData,
  KnowledgeArticleViewerModal,
} from "@/components/knowledge/KnowledgeArticleViewerModal";
import type { StaffGrievanceItem } from "@/types/staff";
import { toast } from "sonner";

interface StatementTabProps {
  grievance: StaffGrievanceItem;
  inquiryUrl: string;
  hodEscalationUrl: string | null;
  hodName?: string;
  isWaitingOnUser?: boolean;
  isInProgress?: boolean;
  autoOpenRequestModal?: boolean;
  onResumeInvestigation?: (grievanceId: string) => Promise<void>;
  onRequestAdditionalInfo?: (
    grievanceId: string,
    payload: {
      channels: ("IN_APP" | "EMAIL")[];
      subject: string;
      message: string;
      requestedDocs: string[];
    },
  ) => Promise<void>;
  onOpenDocumentPreview?: (doc: {
    name: string;
    size: string;
    type: string;
    path?: string;
    uploadedAt?: string;
    grievanceNumber?: string;
    category?: string;
    title?: string;
    submitterName?: string;
    submitterRole?: string;
  }) => void;
}

export function StatementTab({
  grievance,
  inquiryUrl,
  hodEscalationUrl,
  hodName,
  isWaitingOnUser,
  isInProgress,
  autoOpenRequestModal,
  onResumeInvestigation,
  onRequestAdditionalInfo,
  onOpenDocumentPreview,
}: StatementTabProps) {
  // Knowledge Base recommendations state
  const [kbRecommendations, setKbRecommendations] = useState<
    KnowledgeArticleData[]
  >([]);
  const [selectedKbArticle, setSelectedKbArticle] =
    useState<KnowledgeArticleData | null>(null);
  const [isKbModalOpen, setIsKbModalOpen] = useState(false);

  useEffect(() => {
    const fetchKb = async () => {
      try {
        const catId =
          grievance.categoryId ||
          (grievance as unknown as Record<string, unknown>).category_id ||
          "";
        const subCatId =
          grievance.subcategoryId ||
          (grievance as unknown as Record<string, unknown>).subcategory_id ||
          "";
        const catName = encodeURIComponent(grievance.category || "");
        const subCatName = encodeURIComponent(grievance.subcategory || "");
        const res = await fetch(
          `/api/staff/knowledge/recommendations?categoryId=${catId}&subcategoryId=${subCatId}&category=${catName}&subcategory=${subCatName}`,
        );
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.articles)) {
          setKbRecommendations(data.articles);
        }
      } catch (err) {
        console.warn("Failed to fetch KB recommendations:", err);
      }
    };
    fetchKb();
  }, [grievance]);
  // Additional Information Request State
  const [isRequestInfoOpen, setIsRequestInfoOpen] = useState(
    Boolean(autoOpenRequestModal),
  );
  const [selectedChannels, setSelectedChannels] = useState<
    ("IN_APP" | "EMAIL")[]
  >(["IN_APP", "EMAIL"]);
  const [inquirySubject, setInquirySubject] = useState(
    `Additional documentation required for ${grievance.grievanceNumber}`,
  );
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [customDocInput, setCustomDocInput] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);
  const [isResuming, setIsResuming] = useState(false);

  useEffect(() => {
    if (autoOpenRequestModal) {
      setIsRequestInfoOpen(true);
    }
  }, [autoOpenRequestModal]);

  const hasChannel = selectedChannels.length > 0;
  const hasContent =
    Boolean(inquiryMessage.trim()) ||
    selectedDocs.length > 0 ||
    Boolean(customDocInput.trim());
  const isFormValid = hasChannel && hasContent;

  const handleRequestInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSendingRequest || !onRequestAdditionalInfo) return;
    setIsSendingRequest(true);
    setRequestSuccess(null);

    const docsToSend = [...selectedDocs];
    if (customDocInput.trim()) {
      docsToSend.push(customDocInput.trim());
    }

    try {
      await onRequestAdditionalInfo(grievance.id, {
        channels: selectedChannels,
        subject: inquirySubject.trim(),
        message: inquiryMessage.trim(),
        requestedDocs: docsToSend,
      });
      toast.success(`Request dispatched via ${selectedChannels.join(" & ")}.`);
      setIsRequestInfoOpen(false);
      setInquiryMessage("");
      setSelectedDocs([]);
      setCustomDocInput("");
    } catch (err: unknown) {
      console.error("Failed to request additional info:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to request additional information",
      );
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleResume = async () => {
    if (isResuming || !onResumeInvestigation) return;
    setIsResuming(true);
    try {
      await onResumeInvestigation(grievance.id);
    } catch (err: unknown) {
      console.error("Failed to resume investigation:", err);
      alert(
        err instanceof Error ? err.message : "Failed to resume investigation",
      );
    } finally {
      setIsResuming(false);
    }
  };

  const toggleChannel = (channel: "IN_APP" | "EMAIL") => {
    if (selectedChannels.includes(channel)) {
      if (selectedChannels.length > 1) {
        setSelectedChannels(selectedChannels.filter((c) => c !== channel));
      }
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Employee Profile */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Employee Profile
          </span>
          <span className="text-2.75 text-slate-400">Registered Submitter</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
              {grievance.submitterName.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-slate-900">
                {grievance.submitterName}
              </div>
              <div className="text-slate-500 text-[11px]">
                {grievance.submitterRole}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-slate-500 text-[11px]">Contact Email</span>
            <a
              href={inquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-700 hover:underline inline-flex items-center gap-1"
            >
              <Mail className="h-3 w-3" />
              <span>{grievance.submitterEmail}</span>
            </a>
            {hodEscalationUrl && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Department Head:</span>
                <a
                  href={hodEscalationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  <Shield className="h-3 w-3" />
                  <span>Consult Supervisor ({hodName || "HOD"})</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Success Alert Banner */}
      {requestSuccess && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{requestSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setRequestSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950 font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Status: WAITING ON USER Banner */}
      {isWaitingOnUser && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <Clock className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Waiting on Employee Response
                  </h4>
                  <span className="rounded-md bg-amber-200/80 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                    WAITING_ON_USER
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Additional information or documents requested from{" "}
                  <strong>{grievance.submitterName}</strong>. Investigation is
                  paused.
                </p>
              </div>
            </div>

            {onResumeInvestigation && (
              <button
                type="button"
                onClick={handleResume}
                disabled={isResuming}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs cursor-pointer transition disabled:opacity-50 shrink-0"
              >
                <Play className="h-3 w-3" />
                <span>{isResuming ? "Resuming..." : "Resume Manually"}</span>
              </button>
            )}
          </div>

          <div className="rounded-lg bg-white/90 border border-amber-200 p-3 text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              <span>Two-Way Inquiry Active:</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              The employee has been notified via In-App Notification and Email.
              Once {grievance.submitterName} submits their response or uploads
              the requested documents, the status will automatically update to{" "}
              <strong>In Progress</strong> and you will receive a notification.
            </p>
          </div>
        </div>
      )}

      {/* Request Additional Information or Documents from Employee Card */}
      {isInProgress && onRequestAdditionalInfo && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                <FileQuestion className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-950">
                  Need Additional Information or Documents from Employee?
                </h4>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Request clarification or documents via In-App Notification and
                  Email.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsRequestInfoOpen(!isRequestInfoOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-2xs transition cursor-pointer shrink-0"
            >
              <Send className="h-3 w-3" />
              <span>
                {isRequestInfoOpen
                  ? "Close Request Form"
                  : "Request Additional Info"}
              </span>
            </button>
          </div>

          {/* Interactive Request Additional Info Modal */}
          {isRequestInfoOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl sticky top-0 z-10">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <FileQuestion className="h-4 w-4 text-blue-600" />
                    Request Additional Information
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsRequestInfoOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form
                  onSubmit={handleRequestInfoSubmit}
                  className="p-5 space-y-4"
                >
                  {/* Notification Channels Selection */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Select Notification Channels:</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        (Email and In-App Notifications)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-1">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedChannels.includes("IN_APP")}
                          onChange={() => toggleChannel("IN_APP")}
                          className="rounded border-slate-300 text-[#0F766E] focus:ring-teal-600 h-4 w-4 cursor-pointer"
                        />
                        <span className="flex items-center gap-1.5">
                          <Bell className="h-3.5 w-3.5 text-[#0F766E]" />
                          <strong>In-App Notification</strong> (Employee Portal)
                        </span>
                      </label>

                      <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedChannels.includes("EMAIL")}
                          onChange={() => toggleChannel("EMAIL")}
                          className="rounded border-slate-300 text-[#0F766E] focus:ring-teal-600 h-4 w-4 cursor-pointer"
                        />
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-emerald-600" />
                          <strong>Email</strong> ({grievance.submitterEmail})
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Request Subject */}
                  <div className="space-y-1">
                    <label
                      htmlFor="inquiry-subject"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Inquiry Subject / Topic:
                    </label>
                    <input
                      id="inquiry-subject"
                      type="text"
                      required
                      value={inquirySubject}
                      onChange={(e) => setInquirySubject(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-[#0F766E] focus:outline-hidden"
                      placeholder="e.g. Additional documentation required: Performance evaluation records"
                    />
                  </div>

                  {/* Message / Information Needed */}
                  <div className="space-y-1">
                    <label
                      htmlFor="inquiry-message"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Specific Questions &amp; Clarification Needed:
                    </label>
                    <textarea
                      id="inquiry-message"
                      rows={3}
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0F766E] focus:outline-hidden leading-relaxed"
                      placeholder="Describe the exact information or clarification needed from the employee..."
                    />
                  </div>

                  {/* Required Documents Checklist */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-700">
                      Documents Required:
                    </div>
                    <div className="space-y-3">
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && !selectedDocs.includes(val)) {
                            setSelectedDocs([...selectedDocs, val]);
                          }
                          e.target.value = "";
                        }}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:border-[#0F766E] focus:outline-hidden bg-slate-50/50"
                      >
                        <option value="">
                          Select a document to request...
                        </option>
                        {[
                          "Appraisal / Scorecard Sheet",
                          "Salary Slip / Remuneration Sheet",
                          "Written Email / Chat Proofs",
                          "Medical Certificate / Official Proof",
                          "Company Policy / Contract Copy",
                        ].map((doc) => (
                          <option key={doc} value={doc}>
                            {doc}
                          </option>
                        ))}
                      </select>

                      {selectedDocs.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedDocs.map((doc) => (
                            <span
                              key={doc}
                              className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-md text-[11px] font-medium border border-blue-200 shadow-xs"
                            >
                              {doc}
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedDocs(
                                    selectedDocs.filter((d) => d !== doc),
                                  )
                                }
                                className="text-blue-400 hover:text-blue-700 hover:bg-blue-100 rounded-sm p-0.5 transition"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Custom Doc Add */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={customDocInput}
                        onChange={(e) => setCustomDocInput(e.target.value)}
                        placeholder="Add another required document..."
                        className="flex-1 rounded-lg border border-slate-300 p-1.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Action Submission */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end pt-3 border-t border-slate-100 gap-2">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsRequestInfoOpen(false)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSendingRequest || !isFormValid}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition shadow-2xs disabled:opacity-50 cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>
                          {isSendingRequest ? "Dispatching..." : "Send Request"}
                        </span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Departments Involved (Multi-department only) */}
      {grievance.departmentsInvolved &&
        grievance.departmentsInvolved.length > 1 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Departments Involved
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {grievance.departmentsInvolved.map((dept) => (
                <div
                  key={dept.id}
                  className={`rounded-xl border p-4 shadow-2xs ${
                    dept.involvementType === "PRIMARY"
                      ? "border-teal-200 bg-teal-50/50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="font-semibold text-slate-900 text-sm">
                      {dept.departmentName}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        dept.involvementType === "PRIMARY"
                          ? "bg-teal-100 text-teal-800"
                          : dept.involvementType === "EQUAL"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {dept.involvementType}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Assigned Staff:</span>
                      <span className="font-medium text-slate-900">
                        {dept.assignedStaff || "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="font-medium text-slate-900">
                        {dept.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* MY ASSIGNMENT (Multi-department only) */}
      {grievance.departmentsInvolved &&
        grievance.departmentsInvolved.length > 1 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              My Assignment
            </h4>
            {grievance.departmentsInvolved
              .filter((d) => d.isMyAssignment)
              .map((myDept) => (
                <div
                  key={`my-${myDept.id}`}
                  className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs"
                >
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Department:</span>
                      <span className="font-semibold text-slate-900">
                        {myDept.departmentName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Role:</span>
                      <span className="font-semibold text-slate-900 capitalize">
                        {myDept.involvementType.toLowerCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Staff:</span>
                      <span className="font-semibold text-slate-900">
                        {myDept.assignedStaff}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="font-semibold text-slate-900">
                        {myDept.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

      {/* Written Grievance Statement */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Grievance Statement &amp; Particulars
        </h4>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs font-normal leading-relaxed text-slate-800 shadow-2xs">
          {grievance.description || "No written statement provided."}
        </div>
      </div>

      {/* Related Published Knowledge Base Guidance */}
      {kbRecommendations.length > 0 && (
        <div className="rounded-xl border border-teal-200/90 bg-[#F0FDFA]/60 p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
            <div className="flex items-center gap-2 font-bold text-teal-950 text-xs">
              <BookOpen className="h-4 w-4 text-[#0F766E]" />
              <span>Related Knowledge Base Guidance</span>
            </div>
            <span className="text-[10px] font-semibold text-teal-700 bg-teal-100 px-2.5 py-0.5 rounded-full border border-teal-200">
              Informational Reference Only
            </span>
          </div>

          <div className="space-y-2">
            {kbRecommendations.map((art) => (
              <div
                key={art.id}
                className="flex items-center justify-between rounded-xl border border-teal-200 bg-white p-3 text-xs shadow-2xs hover:border-teal-400 transition"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="font-bold text-slate-900 truncate">
                    {art.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Published &bull; Relevant to {art.category} /{" "}
                    {art.subcategory}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedKbArticle(art);
                    setIsKbModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-800 text-xs font-semibold hover:bg-teal-100 transition shrink-0 cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Guidance</span>
                </button>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-teal-800 italic pt-0.5 leading-relaxed">
            Note: Recommendations are informational reference material. The
            system does not automatically resolve or modify this grievance.
          </div>
        </div>
      )}

      {/* Attached Documents / Proofs */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Attached Proofs &amp; Documentation (
          {grievance.attachments?.length || 0})
        </h4>
        {grievance.attachments && grievance.attachments.length > 0 ? (
          <div className="space-y-2">
            {grievance.attachments.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs transition hover:border-emerald-300 hover:shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() =>
                    onOpenDocumentPreview?.({
                      name: file.name,
                      size: file.size,
                      type: file.type || "Document",
                      path: file.path,
                      uploadedAt: file.uploadedAt,
                      grievanceNumber: grievance.grievanceNumber,
                      category: `${grievance.category} / ${grievance.subcategory}`,
                      title: grievance.title,
                      submitterName: grievance.submitterName,
                      submitterRole: grievance.submitterRole,
                    })
                  }
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 text-left bg-transparent border-0 p-0"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F0FDFA] text-[#0F766E] border border-teal-200/60 shrink-0">
                    {file.name.endsWith(".pdf") ? (
                      <FileText className="h-4.5 w-4.5 text-rose-600" />
                    ) : file.name.endsWith(".jpg") ||
                      file.name.endsWith(".jpeg") ||
                      file.name.endsWith(".png") ? (
                      <ImageIcon className="h-4.5 w-4.5 text-blue-600" />
                    ) : file.name.endsWith(".xlsx") ||
                      file.name.endsWith(".xls") ||
                      file.name.endsWith(".csv") ? (
                      <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-700" />
                    ) : (
                      <FileText className="h-4.5 w-4.5 text-emerald-700" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 truncate hover:text-emerald-800 transition">
                      {file.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {file.size} &bull; {file.type || "Document"}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onOpenDocumentPreview?.({
                      name: file.name,
                      size: file.size,
                      type: file.type || "Document",
                      path: file.path,
                      uploadedAt: file.uploadedAt,
                      grievanceNumber: grievance.grievanceNumber,
                      category: `${grievance.category} / ${grievance.subcategory}`,
                      title: grievance.title,
                      submitterName: grievance.submitterName,
                      submitterRole: grievance.submitterRole,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-600/30 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs cursor-pointer ml-3 shrink-0"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>View Proof</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            No attachments uploaded with this grievance.
          </p>
        )}
      </div>

      <KnowledgeArticleViewerModal
        isOpen={isKbModalOpen}
        onClose={() => setIsKbModalOpen(false)}
        article={selectedKbArticle}
      />
    </div>
  );
}
