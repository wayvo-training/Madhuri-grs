"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { StaffProfileSkeleton } from "@/components/staff/skeletons";
import { ProfileView } from "@/components/staff/views";
import type {
  StaffDashboardData,
  StaffKpiStats,
  StaffMemberProfile,
} from "@/types/staff";

interface StaffProfileClientProps {
  initialProfile?: StaffMemberProfile | null;
  initialStats?: StaffKpiStats | null;
}

export function StaffProfileClient({
  initialProfile,
  initialStats,
}: StaffProfileClientProps) {
  const [profile, setProfile] = useState<StaffMemberProfile | null>(
    initialProfile || null,
  );
  const [stats, setStats] = useState<StaffKpiStats | undefined>(
    initialStats || undefined,
  );
  const [isLoading, setIsLoading] = useState(!initialProfile);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/staff/dashboard");
      if (!res.ok) {
        throw new Error(`Failed to load staff profile (${res.status})`);
      }
      const json: StaffDashboardData = await res.json();
      if (json.profile) {
        setProfile(json.profile);
      }
      if (json.stats) {
        setStats(json.stats);
      }
    } catch (err) {
      console.error("Failed to load staff profile:", err);
      setError(
        err instanceof Error ? err.message : "Error loading profile details",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialProfile) {
      fetchProfileData();
    }
  }, [initialProfile, fetchProfileData]);

  if (isLoading) {
    return <StaffProfileSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            Profile Unavailable
          </h3>
          <p className="text-xs text-slate-500">
            {error || "Unable to retrieve your staff profile records."}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchProfileData}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  return (
    <ProfileView profile={profile} stats={stats} onRefresh={fetchProfileData} />
  );
}
