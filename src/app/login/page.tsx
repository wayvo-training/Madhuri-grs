"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getRoleDashboardPath } from "@/lib/role-redirect";

export default function LoginPage() {
  const _router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      const targetPath = getRoleDashboardPath(data.user?.role);
      window.location.href = targetPath;
    } catch (err) {
      console.error("Login failed:", err);
      setError("Unable to connect to server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-slate-50 py-12 sm:px-6 lg:px-8">
      {/* Ambient background glow matching hero */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-b from-emerald-100/50 via-emerald-50/25 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo Header */}
        <Link
          href="/"
          className="group inline-flex items-center gap-3 transition-transform hover:scale-[1.02]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#064E3B] text-lg font-bold text-white shadow-md shadow-emerald-950/25">
            G
          </div>
          <div className="text-left">
            <p className="text-lg font-bold tracking-tight text-slate-900">
              GRS
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Grievance Resolution System
            </p>
          </div>
        </Link>
      </div>

      {/* Login Card */}
      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-xl shadow-slate-200/60">
          <div className="mb-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Secure Portal
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in with your organizational credentials
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="name@organization.com"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-emerald-700 transition hover:text-emerald-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#064E3B] accent-[#064E3B] focus:ring-emerald-600 cursor-pointer"
              />
              <label
                htmlFor="remember"
                className="text-sm text-slate-600 select-none cursor-pointer"
              >
                Remember me on this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#064E3B] text-sm font-semibold text-white shadow-md shadow-emerald-950/25 transition-all duration-200 hover:bg-emerald-900 hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Assurance */}
          <div className="mt-6 border-t border-slate-100 pt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Controlled access & auditability</span>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
