"use client";

import { useEffect, useState } from "react";
import type { StaffView } from "@/types/staff";

export function useStaffNavigation(defaultView: StaffView = "overview") {
  // SSR-safe view: must NOT reference window during state initialization to avoid React hydration mismatches!
  const [activeView, setActiveView] = useState<StaffView>(defaultView);

  useEffect(() => {
    const handleHash = () => {
      if (typeof window === "undefined") return;
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get("view");
      if (
        viewParam === "profile" ||
        viewParam === "queue" ||
        viewParam === "activity"
      ) {
        setActiveView(viewParam as StaffView);
        return;
      }

      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (hash === "queue" || hash === "assigned") {
        setActiveView("queue");
      } else if (hash === "profile" || hash === "activity") {
        setActiveView(hash as StaffView);
      } else if (hash === "overview") {
        setActiveView("overview");
      } else {
        setActiveView(defaultView);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    window.addEventListener("popstate", handleHash);

    return () => {
      window.removeEventListener("hashchange", handleHash);
      window.removeEventListener("popstate", handleHash);
    };
  }, [defaultView]);

  const switchView = (view: StaffView) => {
    setActiveView(view);
    if (typeof window !== "undefined") {
      if (view === "overview") {
        if (window.location.hash || window.location.search) {
          history.replaceState(null, "", window.location.pathname);
        }
      } else {
        window.location.hash = view;
      }
      window.dispatchEvent(new Event("hashchange"));
    }
  };

  return {
    activeView,
    switchView,
  };
}
