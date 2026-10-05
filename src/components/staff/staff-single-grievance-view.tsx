"use client";

import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type DocumentPreviewData,
  DocumentViewerModal,
} from "@/components/dashboard/department-head/document-viewer-modal";
import { GrievanceDetails } from "@/components/staff/grievance-details";
import { ResolutionForm } from "@/components/staff/resolution-form";
import type { StaffGrievanceItem, StaffResolutionData } from "@/types/staff";

interface StaffSingleGrievanceViewProps {
  grievanceId: string;
  staffName: string;
  staffEmail: string;
  hodEmail?: string;
  hodName?: string;
}

export function StaffSingleGrievanceView({
  grievanceId,
  staffName,
  staffEmail,
  hodEmail,
  hodName,
}: StaffSingleGrievanceViewProps) {
  const [grievance, setGrievance] = useState<StaffGrievanceItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
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

  const fetchGrievance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/grievances/${grievanceId}`);
      if (!res.ok) {
        throw new Error(`Failed to load grievance details (${res.status})`);
      }
      const data: StaffGrievanceItem = await res.json();
      setGrievance(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error loading grievance");
    } finally {
      setIsLoading(false);
    }
  }, [grievanceId]);

  useEffect(() => {
    fetchGrievance();
  }, [fetchGrievance]);

  const handleAddNote = async (
    id: string,
    noteText: string,
    parentId?: string,
    replyToAuthor?: string,
  ) => {
    const res = await fetch(`/api/staff/grievances/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ADD_NOTE",
        note: noteText,
        parentId,
        replyToAuthor,
      }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || errJson.error || "Failed to add note");
    }
    await fetchGrievance();
  };

  const handleStartInvestigation = async (id: string) => {
    const res = await fetch(`/api/staff/grievances/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "START_INVESTIGATION" }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(
        errJson.message || errJson.error || "Failed to start investigation",
      );
    }
    await fetchGrievance();
  };

  const handleRequestAdditionalInfo = async (
    id: string,
    payload: {
      channels: ("IN_APP" | "EMAIL")[];
      subject: string;
      message: string;
      requestedDocs: string[];
    },
  ) => {
    const res = await fetch(`/api/staff/grievances/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "REQUEST_ADDITIONAL_INFO", ...payload }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(
        errJson.message ||
          errJson.error ||
          "Failed to request additional information",
      );
    }
    await fetchGrievance();
  };

  const handleSubmitResolution = async (
    id: string,
    resolution: StaffResolutionData,
  ) => {
    const res = await fetch("/api/staff/resolutions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grievanceId: id, ...resolution }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(
        errJson.message || errJson.error || "Failed to submit resolution",
      );
    }

    setIsResolving(false);
    await fetchGrievance();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
        <p className="text-xs font-medium text-slate-500">
          Loading assigned grievance details...
        </p>
      </div>
    );
  }

  if (error || !grievance) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-xl border border-rose-200 bg-rose-50 text-center space-y-3">
        <h3 className="text-sm font-bold text-rose-900">
          Grievance Not Available
        </h3>
        <p className="text-xs text-rose-700">
          {error ||
            "The requested grievance could not be found or is not assigned to you."}
        </p>
        <Link
          href="/staff/dashboard"
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/staff/grievances"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Grievances</span>
        </Link>
      </div>

      <GrievanceDetails
        grievance={grievance}
        staffName={staffName}
        staffEmail={staffEmail}
        hodEmail={hodEmail}
        hodName={hodName}
        isOpen={true}
        onClose={() => {}}
        onAddNote={handleAddNote}
        onStartInvestigation={handleStartInvestigation}
        onRequestAdditionalInfo={handleRequestAdditionalInfo}
        onOpenDocumentPreview={setPreviewDocument}
        onOpenResolveModal={() => {
          if (grievance.status === "ASSIGNED") {
            toast.error(
              "Investigation has not been started yet. Please click 'Start Investigation' before submitting final resolution.",
            );
            return;
          }
          if (grievance.isPrimaryOwner === false) {
            toast.error(
              "Supporting Department contributor: Only the Primary Lead department staff can submit the final customer resolution.",
            );
            return;
          }
          setIsResolving(true);
        }}
      />

      {isResolving && (
        <ResolutionForm
          grievance={grievance}
          isOpen={true}
          onClose={() => setIsResolving(false)}
          onSubmit={handleSubmitResolution}
          onResolutionSuccess={async () => {
            setIsResolving(false);
            await fetchGrievance();
          }}
        />
      )}

      {/* Document Proof Previewer Modal */}
      <DocumentViewerModal
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
        onDownload={handleDownloadDocument}
        onRequestAdditionalDocs={() => {
          // Switch to investigation tab and trigger request info
        }}
      />
    </div>
  );
}
