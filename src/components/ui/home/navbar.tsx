"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function Navbar() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string>("home");
  const activeSectionRef = useRef<string>("home");
  const isClickScrollingRef = useRef(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync active section based on initial URL hash or pathname
  useEffect(() => {
    if (pathname !== "/") {
      activeSectionRef.current = pathname.replace("/", "");
      setActiveSection(pathname.replace("/", ""));
      return;
    }

    const currentHash = window.location.hash.replace("#", "");
    if (currentHash === "track" || currentHash === "how-it-works") {
      activeSectionRef.current = currentHash;
      setActiveSection(currentHash);
      const timer = setTimeout(() => {
        const el = document.getElementById(currentHash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      activeSectionRef.current = "home";
      setActiveSection("home");
    }
  }, [pathname]);

  // Scroll listener on the scroll container (<main> or window)
  useEffect(() => {
    if (pathname !== "/") return;

    const handleScroll = () => {
      // Avoid route flutter while smooth scrolling from click
      if (isClickScrollingRef.current) return;

      const trackEl = document.getElementById("track");
      const howEl = document.getElementById("how-it-works");

      let current = "home";

      if (howEl) {
        const rect = howEl.getBoundingClientRect();
        if (rect.top <= 250) {
          current = "how-it-works";
        } else if (trackEl) {
          const trackRect = trackEl.getBoundingClientRect();
          if (trackRect.top <= 250) {
            current = "track";
          }
        }
      } else if (trackEl) {
        const trackRect = trackEl.getBoundingClientRect();
        if (trackRect.top <= 250) {
          current = "track";
        }
      }

      if (current !== activeSectionRef.current) {
        activeSectionRef.current = current;
        setActiveSection(current);

        const targetUrl = current === "home" ? "/" : `/#${current}`;
        setTimeout(() => {
          if (window.location.pathname + window.location.hash !== targetUrl) {
            window.history.replaceState(null, "", targetUrl);
          }
        }, 0);
      }
    };

    const target = document.querySelector("main");
    if (target) {
      target.addEventListener("scroll", handleScroll, { passive: true });
    }
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (target) {
        target.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  const scrollToSection = (sectionId: string) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    isClickScrollingRef.current = true;
    activeSectionRef.current = sectionId;
    setActiveSection(sectionId);

    const targetUrl = sectionId === "home" ? "/" : `/#${sectionId}`;
    setTimeout(() => {
      window.history.replaceState(null, "", targetUrl);
    }, 0);

    const mainEl = document.querySelector("main");

    if (sectionId === "home") {
      if (mainEl) {
        mainEl.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      const targetEl = document.getElementById(sectionId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth" });
      }
    }

    clickTimeoutRef.current = setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 800);
  };

  const handleNavClick =
    (sectionId: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (pathname === "/") {
        e.preventDefault();
        scrollToSection(sectionId);
      }
    };

  const getLinkClasses = (section: string) => {
    const isActive =
      pathname === "/"
        ? activeSection === section
        : section === "faq" && pathname === "/faq";

    return `hidden rounded-xl px-3.5 py-2 text-sm transition-all sm:block cursor-pointer ${
      isActive
        ? "bg-[#F0FDFA] text-[#0F766E] font-semibold"
        : "font-medium text-slate-600 hover:bg-slate-100 hover:text-[#0F766E]"
    }`;
  };

  return (
    <nav className="sticky top-0 z-50 shrink-0 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          onClick={handleNavClick("home")}
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
            onClick={handleNavClick("home")}
            className={getLinkClasses("home")}
          >
            Home
          </Link>

          <Link
            href="/#track"
            onClick={handleNavClick("track")}
            className={getLinkClasses("track")}
          >
            Track Status
          </Link>

          <Link
            href="/#how-it-works"
            onClick={handleNavClick("how-it-works")}
            className={getLinkClasses("how-it-works")}
          >
            How It Works
          </Link>

          <Link href="/faq" className={getLinkClasses("faq")}>
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
