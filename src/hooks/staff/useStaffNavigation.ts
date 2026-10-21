"use client";

import { useEffect, useState } from "react";
import type { StaffView } from "@/types/staff";

export function useStaffNavigation(defaultView: StaffView = "overview") {
  const [activeView, setActiveView] = useState<StaffView>(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get("view");
      if (
        viewParam === "profile" ||
        viewParam === "queue" ||
        viewParam === "activity"
      ) {
        return viewParam as StaffView;
      }
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
