"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  CaseDrawerTab,
  CaseProgressData,
  DocumentPreviewData,
  GrievanceItem,
  StaffMember,
} from "@/types/department-head";
import {
  CaseInspectionFooter,
  CaseInspectionHeader,
  CaseNotesTab,
  CaseProgressTab,
  CaseStatementTab,
  CaseActivityTab,
} from "./case-inspection";

export interface CaseFileInspectionModalProps {
  grievance: GrievanceItem;
  staffList: StaffMember[];
  currentHodName: string;
  hodName: string;
  currentHodEmail?: string;
  hodEmail?: string;
  initialTab?: CaseDrawerTab;
  onClose: () => void;
  onOpenDocumentPreview: (doc: DocumentPreviewData) => void;
  onDownloadDocument: (doc: DocumentPreviewData) => void;
  onAssignClick: (item: GrievanceItem) => void;
  onEscalateClick: (item: GrievanceItem) => void;
  onReviewResolutionClick: (item: GrievanceItem) => void;
  onAddInternalNote: (
    grievance: GrievanceItem,
    note: string,
  ) => Promise<GrievanceItem | undefined>;
}

export function CaseFileInspectionModal({
  grievance,
  staffList,
  currentHodName,
  hodName,
  currentHodEmail,
  hodEmail,
  initialTab = "progress",
  onClose,
  onOpenDocumentPreview,
  onDownloadDocument,
  onAssignClick,
  onEscalateClick,
  onReviewResolutionClick,
  onAddInternalNote,
}: CaseFileInspectionModalProps) {
  const [activeTab, setActiveTab] = useState<CaseDrawerTab>(initialTab);
  const [currentGrievance, setCurrentGrievance] =
    useState<GrievanceItem>(grievance);
  const [caseProgressLoading, setCaseProgressLoading] = useState(false);
  const [caseProgressData, setCaseProgressData] =
    useState<CaseProgressData | null>(null);

  useEffect(() => {
    setCurrentGrievance(grievance);
  }, [grievance]);

  useEffect(() => {
    let isMounted = true;
    setCaseProgressLoading(true);
    fetch(`/api/department-head/grievances/${currentGrievance.id}/progress`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load progress");
        return res.json();
      })
      .then((json) => {
        if (isMounted && json.success && json.data) {
          setCaseProgressData(json.data);
          if (json.data.internalNotes || json.data.grievance?.internalNotes) {
            setCurrentGrievance((prev) => ({
              ...prev,
              internalNotes:
                json.data.internalNotes || json.data.grievance?.internalNotes,
            }));
          }
        }
      })
      .catch((err) => {
        console.warn("Live case progress fetch error:", err);
      })
      .finally(() => {
        if (isMounted) setCaseProgressLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [currentGrievance.id]);

  const handleDocumentClick = useCallback(
    (file: {
      name: string;
      size: string;
      type: string;
      path?: string;
      uploadedAt?: string;
    }) => {
      onOpenDocumentPreview({
        name: file.name,
        size: file.size,
        type: file.type || "Document",
        path: file.path,
        uploadedAt: file.uploadedAt || currentGrievance.createdAt || "Recent",
        grievanceNumber: currentGrievance.ticketCode || "GRS-2026",
        category: `${currentGrievance.category || "General"} / ${currentGrievance.subcategory || "General"}`,
        title: currentGrievance.title || "Grievance Record",
        submitterName: currentGrievance.submitterName || "Complainant",
        submitterRole: currentGrievance.submitterRole || "Employee",
      });
    },
    [currentGrievance, onOpenDocumentPreview],
  );

  const slaState =
    caseProgressData?.sla?.state ||
    (currentGrievance.slaStatus === "BREACHED"
      ? "BREACHED"
      : currentGrievance.slaStatus === "AT_RISK"
        ? "SLA_AT_RISK"
        : "ON_TRACK");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <CaseInspectionHeader
          ticketCode={currentGrievance.ticketCode}
          title={currentGrievance.title}
          category={currentGrievance.category}
          subcategory={currentGrievance.subcategory}
          priority={currentGrievance.priority}
          slaState={slaState}
          hodIntervention={currentGrievance.hodIntervention}
          onClose={onClose}
        />

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-white gap-6 text-sm font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("progress")}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "progress"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Progress & SLA</span>
            {caseProgressLoading && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("statement")}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === "statement"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Statement & Proofs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`py-3 border-b-2 transition inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === "notes"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>Internal Notes</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-2.5 text-slate-600">
              {currentGrievance.internalNotes?.length || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activity")}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === "activity"
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Activity
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === "progress" && (
            <CaseProgressTab
              currentGrievance={currentGrievance}
              caseProgressData={caseProgressData}
              staffList={staffList}
              currentHodEmail={currentHodEmail}
              hodEmail={hodEmail}
              onAssignClick={onAssignClick}
            />
          )}

          {activeTab === "statement" && (
            <CaseStatementTab
              currentGrievance={currentGrievance}
              currentHodEmail={currentHodEmail}
              hodEmail={hodEmail}
              onDocumentClick={handleDocumentClick}
              onDownloadDocument={onDownloadDocument}
              onAssignClick={onAssignClick}
            />
          )}

          {activeTab === "notes" && (
            <CaseNotesTab
              currentGrievance={currentGrievance}
              onAddInternalNote={onAddInternalNote}
              onGrievanceUpdated={setCurrentGrievance}
            />
          )}

          {activeTab === "activity" && (
            <CaseActivityTab
              currentGrievance={currentGrievance}
              caseProgressData={caseProgressData}
            />
          )}
        </div>

        {/* Sticky Footer */}
        <CaseInspectionFooter
          currentGrievance={currentGrievance}
          caseProgressData={caseProgressData}
          staffList={staffList}
          currentHodName={currentHodName}
          hodName={hodName}
          currentHodEmail={currentHodEmail}
          hodEmail={hodEmail}
          onClose={onClose}
          onAssignClick={onAssignClick}
          onEscalateClick={onEscalateClick}
          onReviewResolutionClick={onReviewResolutionClick}
          onAddInternalNote={onAddInternalNote}
        />
      </div>
    </div>
  );
}
