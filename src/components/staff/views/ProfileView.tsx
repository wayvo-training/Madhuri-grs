"use client";

import {
  CheckCircle2,
  ExternalLink,
  Info,
  Mail,
  RefreshCw,
  Shield,
  User,
  Users,
} from "lucide-react";
import {
  buildGmailComposeUrl,
  buildStaffHodEscalationEmail,
} from "@/lib/email";
import type { StaffKpiStats, StaffMemberProfile } from "@/types/staff";

interface ProfileViewProps {
  profile: StaffMemberProfile;
  stats?: StaffKpiStats;
  onRefresh?: () => void;
}

export function ProfileView({ profile, stats, onRefresh }: ProfileViewProps) {
  const maxCapacity = 10;
  const availableCapacity = Math.max(0, maxCapacity - profile.activeWorkload);
  const loadPercent = Math.min(
    Math.round((profile.activeWorkload / maxCapacity) * 100),
    100,
  );

  const directGmailUrl = `https://mail.google.com/mail/?authuser=${encodeURIComponent(
    profile.email,
  )}`;

  const hodComposeUrl = profile.hodEmail
    ? buildGmailComposeUrl(
        buildStaffHodEscalationEmail({
          hodEmail: profile.hodEmail,
          hodName: profile.hodName || "Department Head",
          staffName: profile.name,
          staffEmail: profile.email,
          grievance: {
            ticketCode: "GENERAL",
            title: "Department Guidance Request",
            priority: "NORMAL",
          },
        }),
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Top Profile Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0E7490] text-white shadow-md">
              <User className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">
                  {profile.name}
                </h2>
                <span className="rounded-full bg-[#ECFEFF] border border-[#A5F3FC] px-3 py-0.5 text-xs font-semibold text-[#0E7490]">
                  {profile.departmentName}
                </span>
                <span className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs font-medium">
                  {profile.roleName || "Grievance Staff"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Employee Code:{" "}
                <span className="font-mono font-bold text-slate-700">
                  {profile.employeeCode}
                </span>{" "}
                &bull; {profile.email}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={directGmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F766E] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#115E59] transition cursor-pointer"
            >
              <Mail className="h-4 w-4" />
              <span>Open Official Gmail</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>

            {hodComposeUrl && (
              <a
                href={hodComposeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
              >
                <Shield className="h-4 w-4 text-[#0E7490]" />
                <span>Contact HOD ({profile.hodName || "Head"})</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            )}


          </div>
        </div>

        {/* Workload Capacity Section */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0E7490]" />
                Active Workload Capacity Policy
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Maximum active capacity is fixed at 10 grievances. Completed
                cases do not count against this limit.
              </p>
            </div>

            <div className="text-right sm:border-l sm:pl-6 border-slate-200">
              <span className="text-xs text-slate-500 font-medium block">
                Active Workload:{" "}
                <strong className="text-slate-900">
                  {profile.activeWorkload} / {maxCapacity}
                </strong>
              </span>
              <span
                className={`text-xs font-semibold block mt-0.5 ${
                  availableCapacity === 0 ? "text-rose-600" : "text-[#0E7490]"
                }`}
              >
                Available Capacity: {availableCapacity}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>
                Current Allocation: {profile.activeWorkload} active cases
              </span>
              <span>{loadPercent}% Capacity</span>
            </div>
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  loadPercent >= 90
                    ? "bg-rose-500"
                    : loadPercent >= 75
                      ? "bg-amber-500"
                      : "bg-[#0F766E]"
                }`}
                style={{ width: `${loadPercent}%` }}
              />
            </div>
          </div>

          {/* Policy Callout */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">
                Business Rule Enforcement:
              </strong>{" "}
              A Staff member can have a maximum of 10 ACTIVE assigned grievances
              at a time. The system will prevent any 11th active assignment.
              When an active grievance is completed or closed, capacity
              immediately restores (e.g. from 10 to 9, freeing 1 slot).
            </div>
          </div>
        </div>
      </div>

      {/* Supervisor & Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Supervisor Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#0E7490]" />
            Supervisory Department Head
          </h3>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm">
                {profile.hodName || "Department Head"}
              </span>
              <span className="text-[#0E7490] bg-[#ECFEFF] px-2 py-0.5 rounded text-[11px] font-semibold border border-[#A5F3FC]">
                Department Head
              </span>
            </div>
            <p className="text-slate-500">
              Department:{" "}
              <strong className="text-slate-700">
                {profile.departmentName}
              </strong>
            </p>
            <p className="text-slate-500">
              Email:{" "}
              <span className="font-mono text-slate-700">
                {profile.hodEmail || "hod@company.com"}
              </span>
            </p>
          </div>
        </div>

        {/* Operational Statistics */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            Operational Statistics
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Completed Redressals</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {stats?.completedCount || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">
                Resolutions Pending Review
              </span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {stats?.resolutionPending || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">SLA Breached Cases</span>
              <span className="text-base font-bold text-rose-600 mt-1 block">
                {stats?.slaBreached || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Reopened Cases</span>
              <span className="text-base font-bold text-purple-700 mt-1 block">
                {stats?.reopenedCount || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
