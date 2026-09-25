"use client";

import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-xs">
      <div className="mx-auto max-w-6xl px-6 py-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand */}
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#064E3B] text-sm font-bold text-white shadow-xs">
              G
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-sm">
                GRS
              </span>
              <span className="ml-2 text-2.75 text-slate-500 font-medium">
                Grievance Resolution System
              </span>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav className="flex flex-wrap items-center gap-5 sm:gap-6 text-xs">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/#track" className="hover:text-white transition-colors">
              Track Status
            </Link>
            <Link
              href="/#how-it-works"
              className="hover:text-white transition-colors"
            >
              How It Works
            </Link>
            <Link href="/faq" className="hover:text-white transition-colors">
              FAQ
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Login
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col gap-2 border-t border-slate-900 pt-4 sm:flex-row sm:items-center sm:justify-between text-2.75 text-slate-500">
          <p>© 2026 Grievance Resolution System. Internal platform.</p>
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Controlled access & immutable audit trails</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
