"use client";

import { AlertOctagon, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type DocumentPreviewData,
  DocumentViewerModal,
} from "@/components/dashboard/department-head/document-viewer-modal";
import { GrievanceDetails } from "@/components/staff/grievance-details";
import { GrievanceQueue } from "@/components/staff/grievance-queue";
import { ResolutionForm } from "@/components/staff/resolution-form";
import type {
  StaffDashboardData,
  StaffGrievanceItem,
  StaffResolutionData,
} from "@/types/staff";

interface StaffGrievanceManagerProps {
  staffName: string;
  staffEmail: string;
  initialTab?:
    | "all"
    | "in_progress"
    | "at_risk"
    | "breached"
    | "reopened"
    | "completed";
  pageTitle: string;
  pageSubtitle: string;
}

export function StaffGrievanceManager({
  staffName,
  staffEmail,
  initialTab = "all",
  pageTitle,
  pageSubtitle,
}: StaffGrievanceManagerProps) {
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedGrievance, setSelectedGrievance] =
    useState<StaffGrievanceItem | null>(null);
  const [resolvingGrievance, setResolvingGrievance] =
    useState<StaffGrievanceItem | null>(null);
  const [previewDocument, setPreviewDocument] =
    useState<DocumentPreviewData | null>(null);

  const handleDownloadDocument = (doc: DocumentPreviewData) => {
    if (doc.path) {
      const link = document.createElement("a");
      link.href = doc.path;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await fetch("/api/staff/dashboard");
      if (!res.ok) throw new Error("Failed to load grievances");
      const json: StaffDashboardData = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddNote = async (grievanceId: string, noteText: string) => {
    const res = await fetch(`/api/staff/grievances/${grievanceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ADD_NOTE", note: noteText }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || errJson.error || "Failed to add note");
    }
    const gRes = await fetch(`/api/staff/grievances/${grievanceId}`);
    if (gRes.ok) {
      const gJson = await gRes.json();
      if (gJson?.success && gJson?.data) {
        setSelectedGrievance(gJson.data);
      }
    }
    await fetchData(true);
  };

  const handleExamine = (g: StaffGrievanceItem) => {
    setSelectedGrievance(g);
    fetch(`/api/staff/grievances/${g.id}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((json) => {
        if (json?.success && json?.data) {
          setSelectedGrievance((prev) =>
            prev?.id === g.id ? json.data : prev,
          );
        }
      })
      .catch((err) =>
        console.warn("Failed to fetch fresh grievance details:", err),
      );
  };

  const handleStartInvestigation = async (grievanceId: string) => {
    const res = await fetch(`/api/staff/grievances/${grievanceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "START_INVESTIGATION" }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(
        errJson.message || errJson.error || "Failed to update status",
      );
    }
    await fetchData(true);
  };

  const handleSubmitResolution = async (
    grievanceId: string,
    resolution: StaffResolutionData,
  ) => {
    const res = await fetch("/api/staff/resolutions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grievanceId, ...resolution }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || "Failed to submit resolution");
    }

    setResolvingGrievance(null);
    setSelectedGrievance(null);
    await fetchData(true);
  };

  const handleResolveGrievance = (g: StaffGrievanceItem) => {
    if (g.status === "ASSIGNED") {
      toast.error(
        "Investigation has not been started yet. Please click 'Start Investigation' before submitting final resolution.",
      );
      handleExamine(g);
      return;
    }
    if (g.isPrimaryOwner === false) {
      toast.error(
        "Supporting Department contributor: Only the Primary Lead department staff can submit the final customer resolution.",
      );
      return;
    }
    setResolvingGrievance(g);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
        <p className="text-xs font-medium text-slate-500">
          Loading assigned grievances...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl border border-rose-200 bg-rose-50 text-center max-w-md mx-auto space-y-2">
        <AlertOctagon className="w-6 h-6 text-rose-600 mx-auto" />
        <h4 className="text-xs font-bold text-rose-900">
          Failed to Load Grievances
        </h4>
        <p className="text-xs text-rose-700">{error}</p>
        <button
          type="button"
          onClick={() => fetchData()}
          className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-md transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const items = data?.assignedGrievances || [];
  const profile = data?.profile;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">{pageTitle}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{pageSubtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span>{isRefreshing ? "Syncing..." : "Refresh Queue"}</span>
        </button>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <GrievanceQueue
          grievances={items}
          staffName={staffName}
          staffEmail={staffEmail}
          initialTab={initialTab}
          onExamine={handleExamine}
          onResolve={handleResolveGrievance}
        />
      </div>

      {selectedGrievance && (
        <GrievanceDetails
          grievance={selectedGrievance}
          staffName={staffName}
          staffEmail={staffEmail}
          hodEmail={profile?.hodEmail || undefined}
          hodName={profile?.hodName || undefined}
          isOpen={true}
          onClose={() => setSelectedGrievance(null)}
          onAddNote={handleAddNote}
          onStartInvestigation={handleStartInvestigation}
          onOpenDocumentPreview={setPreviewDocument}
          onOpenResolveModal={() => {
            const target = selectedGrievance;
            if (!target) return;
            handleResolveGrievance(target);
          }}
        />
      )}

      {resolvingGrievance && (
        <ResolutionForm
          grievance={resolvingGrievance}
          isOpen={true}
          onClose={() => setResolvingGrievance(null)}
          onSubmit={handleSubmitResolution}
        />
      )}

      {/* Document Proof Previewer Modal */}
      <DocumentViewerModal
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
        onDownload={handleDownloadDocument}
      />
    </div>
  );
}
