"use client";

import { useEffect, useState } from "react";
import type { StaffView } from "@/types/staff";

export function useStaffNavigation(defaultView: StaffView = "overview") {
  const [activeView, setActiveView] = useState<StaffView>(defaultView);

  useEffect(() => {
    const handleHash = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (hash === "queue" || hash === "assigned") {
        setActiveView("queue");
      } else if (
        hash === "profile" ||
        hash === "activity"
      ) {
        setActiveView(hash as StaffView);
      } else {
        setActiveView("overview");
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    window.addEventListener("popstate", handleHash);

    return () => {
      window.removeEventListener("hashchange", handleHash);
      window.removeEventListener("popstate", handleHash);
    };
  }, []);

  const switchView = (view: StaffView) => {
    setActiveView(view);
    if (typeof window !== "undefined") {
      if (view === "overview") {
        if (window.location.hash) {
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
