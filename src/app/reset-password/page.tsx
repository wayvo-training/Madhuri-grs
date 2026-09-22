"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ResetPasswordFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL token (e.g. from http://localhost:3000/reset-password?token=...)
  const urlToken = searchParams.get("token");

  // Local token (if generated in Step 1 on the same page)
  const [activeToken, setActiveToken] = useState<string | null>(urlToken);

  // --- Step 1: Request Reset Token State ---
  const [email, setEmail] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // --- Step 2: Set New Password State ---
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Synchronize when URL token changes
  const effectiveToken = activeToken || urlToken;

  // Handle Step 1: Requesting Reset Token
  async function handleRequestToken(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRequestError(null);
    setRequestLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setRequestError(data.message || "Unable to process request.");
        setRequestLoading(false);
        return;
      }

      if (data.resetToken) {
        setActiveToken(data.resetToken);
      }
    } catch (err) {
      console.error("Forgot password failed:", err);
      setRequestError("Unable to connect to server. Please try again.");
    } finally {
      setRequestLoading(false);
    }
  }

  // Handle Step 2: Resetting Password with Token
  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!effectiveToken) {
      setResetError(
        "Missing or invalid reset token. Please request a new link.",
      );
      return;
    }

    if (!password || !confirmPassword) {
      setResetError("Please fill in both password fields.");
      return;
    }

    if (password.length < 8) {
      setResetError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: effectiveToken,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setResetError(data.message || "Unable to reset password.");
        setResetLoading(false);
        return;
      }

      setResetSuccess("Password reset successful! Redirecting to login...");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      console.error("Reset password failed:", err);
      setResetError("Unable to connect to server. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-xl shadow-slate-200/60">
      {/* ========================================================================= */}
      {/* CASE A: No Token Provided Yet -> Request Reset Link                       */}
      {/* ========================================================================= */}
      {!effectiveToken ? (
        <div>
          <div className="mb-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Password Recovery
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Forgot password?
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter your registered email address to receive password reset
              instructions.
            </p>
          </div>

          <form onSubmit={handleRequestToken} className="space-y-5">
            {requestError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>{requestError}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Registered Email Address
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
                  disabled={requestLoading}
                  placeholder="name@organization.com"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 disabled:opacity-60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={requestLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#064E3B] text-sm font-semibold text-white shadow-md shadow-emerald-950/25 transition-all duration-200 hover:bg-emerald-900 hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {requestLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* ========================================================================= */
        /* CASE B: Token Available -> Set New Password                               */
        /* ========================================================================= */
        <div>
          <div className="mb-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Account Security
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Set new password
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Enter and confirm your new password below.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-5">
            {resetError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {/* New Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                New Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={resetLoading || Boolean(resetSuccess)}
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
              <p className="mt-1.5 text-xs text-slate-500">
                Password must be at least 8 characters.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={resetLoading || Boolean(resetSuccess)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/20 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={resetLoading || Boolean(resetSuccess)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#064E3B] text-sm font-semibold text-white shadow-md shadow-emerald-950/25 transition-all duration-200 hover:bg-emerald-900 hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Security note */}
      <div className="mt-6 border-t border-slate-100 pt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>Controlled access & auditability</span>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-slate-50 py-12 sm:px-6 lg:px-8">
      {/* Ambient background glow */}
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

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-xl shadow-slate-200/60 text-center py-12">
              <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
              <p className="mt-3 text-sm text-slate-500">Loading form...</p>
            </div>
          }
        >
          <ResetPasswordFlow />
        </Suspense>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
