"use client";

import { AlertOctagon, LogIn, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type DocumentPreviewData,
  DocumentViewerModal,
} from "@/components/dashboard/department-head/document-viewer-modal";
import { GrievanceDetails } from "@/components/staff/grievance-details";
import { ResolutionForm } from "@/components/staff/resolution-form";

import { StaffActivityView as FullActivityView } from "@/components/staff/staff-activity-view";
import { OverviewView, ProfileView, QueueView } from "@/components/staff/views";
import { useStaffNavigation } from "@/hooks/staff/useStaffNavigation";
import type {
  StaffAuditItem,
  StaffDashboardData,
  StaffGrievanceItem,
  StaffResolutionData,
} from "@/types/staff";

interface StaffDashboardProps {
  initialData?: StaffDashboardData | null;
  staffName: string;
  staffEmail: string;
  departmentName?: string;
  employeeCode?: string;
}

export function StaffDashboard({
  initialData,
  staffName,
  staffEmail,
  departmentName = "Operations",
  employeeCode = "STF-01",
}: StaffDashboardProps) {
  const [data, setData] = useState<StaffDashboardData | null>(
    initialData || null,
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronized Hash Navigation
  const { activeView, switchView } = useStaffNavigation("overview");

  // Modal states
  const [selectedGrievance, setSelectedGrievance] =
    useState<StaffGrievanceItem | null>(null);
  const [selectedInitialTab, setSelectedInitialTab] = useState<
    "statement" | "investigation" | "resolution"
  >("statement");
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

  // Fetch Dashboard Data from API
  const fetchDashboardData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await fetch("/api/staff/dashboard");
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        if (res.status === 403 || res.status === 401) {
          throw new Error(
            errJson?.message ||
              "Access restricted: Your current account does not have permission to access the staff workspace. Please switch to a Staff or Department Head account.",
          );
        }
        throw new Error(
          errJson?.message || `Failed to load staff dashboard (${res.status})`,
        );
      }
      const json: StaffDashboardData = await res.json();
      setData(json);
    } catch (err) {
      console.error("Staff dashboard fetch error:", err);
      setError(err instanceof Error ? err.message : "Error loading dashboard");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      fetchDashboardData();
    }
  }, [initialData, fetchDashboardData]);

  // Handle note addition in details modal
  const handleAddNote = async (
    grievanceId: string,
    noteText: string,
    parentId?: string,
    replyToAuthor?: string,
  ) => {
    try {
      const res = await fetch(`/api/staff/grievances/${grievanceId}`, {
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
        throw new Error(
          errJson.message || errJson.error || "Failed to add internal note",
        );
      }
      setSelectedGrievance((prev) => {
        if (!prev || prev.id !== grievanceId) return prev;
        const newAudit: StaffAuditItem = {
          id: `temp-${Date.now()}`,
          action: parentId ? "Internal Reply" : "Investigation Note",
          details: noteText,
          actor: `Staff — ${staffName}`,
          timestamp: new Date().toISOString(),
          relativeTime: "Just now",
        };
        const newNote = {
          id: `temp-note-${Date.now()}`,
          author: `Staff — ${staffName}`,
          role: "Staff",
          timestamp: "Just now",
          note: noteText,
          parentId,
          replyToAuthor,
        };
        return {
          ...prev,
          auditTrail: [newAudit, ...(prev.auditTrail || [])],
          internalNotes: [...(prev.internalNotes || []), newNote],
        };
      });

      // Fetch fresh grievance to ensure persistence and database sync
      const gRes = await fetch(`/api/staff/grievances/${grievanceId}`);
      if (gRes.ok) {
        const gJson = await gRes.json();
        if (gJson?.success && gJson?.data) {
          setSelectedGrievance(gJson.data);
        }
      }
      toast.success(parentId ? "Reply posted to thread." : "Internal note saved.");
      await fetchDashboardData(true);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleExamineGrievance = useCallback(
    (
      g: StaffGrievanceItem,
      initialTab: "statement" | "investigation" | "resolution" = "statement",
    ) => {
      setSelectedGrievance(g);
      setSelectedInitialTab(initialTab);
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
    },
    [],
  );

  // Handle start investigation in details modal
  const handleStartInvestigation = async (grievanceId: string) => {
    try {
      const res = await fetch(`/api/staff/grievances/${grievanceId}`, {
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
      setSelectedGrievance((prev) =>
        prev && prev.id === grievanceId
          ? { ...prev, status: "IN_PROGRESS" }
          : prev,
      );
      toast.success("Investigation started. Case status updated to In Progress.");
      await fetchDashboardData(true);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Handle request additional information from complainant
  const handleRequestAdditionalInfo = async (
    grievanceId: string,
    payload: {
      channels: ("IN_APP" | "EMAIL")[];
      subject: string;
      message: string;
      requestedDocs: string[];
    },
  ) => {
    try {
      const res = await fetch(`/api/staff/grievances/${grievanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_ADDITIONAL_INFO",
          ...payload,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.message ||
            errJson.error ||
            "Failed to request additional information",
        );
      }
      setSelectedGrievance((prev) =>
        prev && prev.id === grievanceId
          ? { ...prev, status: "WAITING_ON_USER" }
          : prev,
      );
      toast.success("Additional information request dispatched to complainant.");
      await fetchDashboardData(true);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Handle resume investigation manually
  const handleResumeInvestigation = async (grievanceId: string) => {
    try {
      const res = await fetch(`/api/staff/grievances/${grievanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESUME_INVESTIGATION" }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.message || errJson.error || "Failed to resume investigation",
        );
      }
      setSelectedGrievance((prev) =>
        prev && prev.id === grievanceId
          ? { ...prev, status: "IN_PROGRESS" }
          : prev,
      );
      toast.success("Investigation resumed successfully.");
      await fetchDashboardData(true);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Handle resolution submission in resolution modal
  const handleSubmitResolution = async (
    grievanceId: string,
    resolution: StaffResolutionData,
  ) => {
    const res = await fetch("/api/staff/resolutions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grievanceId,
        ...resolution,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || "Failed to submit resolution");
    }

    setResolvingGrievance(null);
    setSelectedGrievance(null);
    toast.success("Resolution submitted successfully for Department Head review!");
    await fetchDashboardData(true);
  };

  const handleResolveGrievance = (g: StaffGrievanceItem) => {
    if (g.status === "ASSIGNED") {
      toast.error(
        "Investigation has not been started yet. Please click 'Start Investigation' before submitting final resolution.",
      );
      handleExamineGrievance(g, "investigation");
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
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
        <p className="text-sm font-medium text-slate-500">
          Loading assigned grievances & workload...
        </p>
      </div>
    );
  }

  if (error) {
    const isAuthError =
      error.toLowerCase().includes("forbidden") ||
      error.toLowerCase().includes("access") ||
      error.toLowerCase().includes("403") ||
      error.toLowerCase().includes("401");

    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {isAuthError
              ? "Staff Access Required"
              : "Unable to Load Staff Dashboard"}
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            {error}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {isAuthError && (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0F766E] hover:bg-[#115E59] rounded-xl transition shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Switch / Sign In</span>
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                <span>My User Portal</span>
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => fetchDashboardData()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    activeGrievances: 0,
    slaAtRisk: 0,
    slaBreached: 0,
    resolutionPending: 0,
    reopenedCount: 0,
    completedCount: 0,
  };

  const profile = data?.profile || {
    id: "",
    name: staffName,
    email: staffEmail,
    employeeCode: employeeCode,
    departmentName: departmentName,
    roleName: "STAFF",
    activeWorkload: 0,
    maxCapacity: 10,
    hodName: null,
    hodEmail: null,
  };

  const assignedItems = data?.assignedGrievances || [];
  const activeCases = assignedItems.filter((g) => g.status !== "CLOSED");
  const investigationCount = activeCases.filter(
    (g) =>
      g.status === "IN_PROGRESS" ||
      g.status === "ASSIGNED" ||
      g.status === "WAITING_ON_USER",
  ).length;
  const resolutionCount = assignedItems.filter(
    (g) => g.hasResolution || g.status === "UNDER_REVIEW",
  ).length;

  return (
    <div className="flex-1 flex flex-col space-y-4">
      {/* Render Active View */}
      {activeView === "overview" && (
        <OverviewView
          data={data}
          profile={profile}
          onExamine={handleExamineGrievance}
          onSwitchView={switchView}
          onRefresh={() => fetchDashboardData(true)}
        />
      )}

      {activeView === "queue" && (
        <QueueView
          grievances={assignedItems}
          categories={data?.categories}
          staffName={staffName}
          staffEmail={staffEmail}
          onExamine={handleExamineGrievance}
          onResolve={handleResolveGrievance}
          initialTab="all"
        />
      )}

      {activeView === "profile" && (
        <ProfileView
          profile={profile}
          stats={stats}
          onRefresh={() => fetchDashboardData(true)}
        />
      )}

      {activeView === "activity" && <FullActivityView staffName={staffName} />}

      {/* Grievance Details Modal */}
      {selectedGrievance && (
        <GrievanceDetails
          grievance={selectedGrievance}
          initialTab={selectedInitialTab}
          staffName={staffName}
          staffEmail={staffEmail}
          hodName={profile.hodName || undefined}
          hodEmail={profile.hodEmail || undefined}
          onClose={() => setSelectedGrievance(null)}
          onAddNote={handleAddNote}
          onStartInvestigation={handleStartInvestigation}
          onRequestAdditionalInfo={handleRequestAdditionalInfo}
          onResumeInvestigation={handleResumeInvestigation}
          onOpenDocumentPreview={setPreviewDocument}
          onOpenResolutionForm={(g: StaffGrievanceItem) => {
            setSelectedGrievance(null);
            handleResolveGrievance(g);
          }}
        />
      )}

      {/* Resolution Submission Modal */}
      {resolvingGrievance && (
        <ResolutionForm
          isOpen={Boolean(resolvingGrievance)}
          grievance={resolvingGrievance}
          onClose={() => setResolvingGrievance(null)}
          onSubmit={handleSubmitResolution}
          onResolutionSuccess={async () => {
            setResolvingGrievance(null);
            setSelectedGrievance(null);
            await fetchDashboardData(true);
          }}
        />
      )}

      {/* Document Proof Previewer Modal */}
      <DocumentViewerModal
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
        onDownload={handleDownloadDocument}
        onRequestAdditionalDocs={
          selectedGrievance
            ? () => {
                setSelectedInitialTab("investigation");
              }
            : undefined
        }
      />
    </div>
  );
}
