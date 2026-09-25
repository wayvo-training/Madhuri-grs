"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { NotificationDrawer } from "./notifications/NotificationDrawer";
import { ThemeToggle } from "./theme-toggle";

interface DashboardHeaderProps {
  title: string;
  userRole: "ADMIN" | "DEPARTMENT_HEAD" | "STAFF" | "END_USER";
  roleLabel: string;
  userEmail?: string;
  userName?: string;
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  DEPARTMENT_HEAD: "bg-sky-100 text-sky-800 border-sky-200",
  STAFF: "bg-amber-100 text-amber-700 border-amber-200",
  END_USER: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function DashboardHeader({
  title,
  userRole,
  roleLabel,
  userName = "User",
  userEmail,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.refresh();
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand & Page title */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#064E3B] font-bold text-white shadow-sm">
              G
            </div>
            <span className="text-lg font-semibold tracking-tight text-black">
              GRS
            </span>
          </Link>
          <div className="h-4 w-px bg-gray-300" />
          <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              roleColors[userRole] ||
              "bg-gray-100 text-gray-700 border-gray-200"
            }`}
          >
            {roleLabel}
          </span>

          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-gray-800">
              {userName}
            </span>
            {userEmail && (
              <span className="text-[11px] text-gray-400">{userEmail}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationDrawer userId={userEmail} />
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-xs transition hover:bg-gray-50 hover:text-black active:scale-[0.98] disabled:opacity-60"
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </header>
  );
}
