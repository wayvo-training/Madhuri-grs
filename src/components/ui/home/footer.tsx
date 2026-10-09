"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";

export default function Footer() {
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
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 text-xs">
      <div className="mx-auto max-w-6xl px-6 py-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand */}
          <Link
            href="/"
            onClick={handleHomeClick}
            className="inline-flex items-center gap-2.5 cursor-pointer"
          >
            <Logo size={32} />
            <div>
              <span className="font-bold tracking-tight text-white text-sm">
                GRS
              </span>
              <span className="ml-2 text-2.75 text-slate-500 font-medium">
                Grievance Resolution System
              </span>
            </div>
          </Link>

          {/* Tagline based on place constraint */}
          <p className="text-xs text-slate-400 italic sm:text-right leading-relaxed max-w-md">
            <span className="hidden md:inline">
              “Every concern deserves to be heard, every issue deserves a
              resolution.”
            </span>
            <span className="md:hidden">
              “Listen with empathy. Resolve with integrity.”
            </span>
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col gap-2 border-t border-slate-900 pt-4 sm:flex-row sm:items-center sm:justify-between text-2.75 text-slate-500">
          <p>© 2026 Grievance Resolution System. Internal platform.</p>
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-500" />
            <span>Controlled access & immutable audit trails</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
