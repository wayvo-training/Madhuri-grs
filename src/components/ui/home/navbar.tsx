"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 shrink-0 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#064E3B] text-lg font-bold text-white shadow-sm shadow-emerald-950/20">
            G
          </div>

          <div className="hidden sm:block">
            <p className="text-base font-bold tracking-tight text-slate-900">
              GRS
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Grievance Resolution System
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-emerald-700 sm:block"
          >
            Home
          </Link>

          <Link
            href="/#track"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-emerald-700 sm:block"
          >
            Track Status
          </Link>

          <Link
            href="/#how-it-works"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-emerald-700 md:block"
          >
            How It Works
          </Link>

          <Link
            href="/faq"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-emerald-700 sm:block"
          >
            FAQ
          </Link>

          <Link href="/login">
            <Button className="rounded-xl bg-[#064E3B] px-5 font-medium text-white shadow-sm transition-all hover:bg-emerald-900">
              Login
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
