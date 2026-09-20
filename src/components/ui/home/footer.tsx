"use client";

import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold">
                G
              </div>

              <div>
                <p className="text-base font-bold tracking-tight">GRS</p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Grievance Resolution System
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-6 text-slate-400">
              A structured platform for submitting, processing, tracking, and
              resolving workplace grievances with clear ownership and
              visibility.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-white">Platform</h3>

            <div className="mt-4 space-y-3">
              <Link
                href="/"
                className="block text-sm text-slate-400 transition-colors hover:text-white"
              >
                Home
              </Link>

              <Link
                href="#how-it-works"
                className="block text-sm text-slate-400 transition-colors hover:text-white"
              >
                How It Works
              </Link>

              <Link
                href="#faq"
                className="block text-sm text-slate-400 transition-colors hover:text-white"
              >
                FAQ
              </Link>

              <Link
                href="/login"
                className="flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-white"
              >
                Login
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Process */}
          <div>
            <h3 className="text-sm font-semibold text-white">Process</h3>

            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-400">Submit Grievance</p>

              <p className="text-sm text-slate-400">Review & Routing</p>

              <p className="text-sm text-slate-400">Staff Resolution</p>

              <p className="text-sm text-slate-400">Review & Closure</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            © 2026 Grievance Resolution System. Internal platform.
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-teal-500" />
            Controlled access & auditability
          </div>
        </div>
      </div>
    </footer>
  );
}
