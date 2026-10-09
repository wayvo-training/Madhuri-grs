"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

import { Logo } from "@/components/ui/logo";

export default function Navbar() {
  const pathname = usePathname();

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      const mainEl = document.querySelector("main");
      if (mainEl && mainEl.scrollTop > 0) {
        mainEl.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 shrink-0 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          onClick={handleHomeClick}
          className="flex items-center gap-3 cursor-pointer"
        >
          <Logo size={40} />

          <div className="hidden sm:block">
            <p className="text-base font-bold tracking-tight text-slate-900">
              GRS
            </p>
            <p className="text-2.5 font-medium uppercase tracking-wider text-slate-500">
              Grievance Resolution System
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            onClick={handleHomeClick}
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#0F766E] sm:block cursor-pointer"
          >
            Home
          </Link>

          <Link
            href="/#track"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#0F766E] sm:block"
          >
            Track Status
          </Link>

          <Link
            href="/#how-it-works"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#0F766E] md:block"
          >
            How It Works
          </Link>

          <Link
            href="/faq"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#0F766E] sm:block"
          >
            FAQ
          </Link>

          <Link href="/login">
            <Button className="rounded-xl bg-[#0F766E] px-5 font-medium text-white shadow-sm transition-all hover:bg-[#115E59]">
              Login
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
