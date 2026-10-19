"use client";

import { useEffect, useState } from "react";
import type { StaffView } from "@/types/staff";

export function useStaffNavigation(defaultView: StaffView = "overview") {
  const [activeView, setActiveView] = useState<StaffView>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (hash === "queue" || hash === "assigned") {
        return "queue";
      }
      if (hash === "profile" || hash === "activity") {
        return hash as StaffView;
      }
      if (hash === "overview") {
        return "overview";
      }
    }
    return defaultView;
  });

  useEffect(() => {
    const handleHash = () => {
      if (typeof window === "undefined") return;
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
