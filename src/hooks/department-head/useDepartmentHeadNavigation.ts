"use client";

import { useEffect, useState } from "react";
import type { DepartmentHeadView } from "@/types/department-head";

export function useDepartmentHeadNavigation() {
  const [activeView, setActiveView] = useState<DepartmentHeadView>("overview");

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (
        hash === "queue" ||
        hash === "staff" ||
        hash === "sla" ||
        hash === "activity" ||
        hash === "knowledge"
      ) {
        setActiveView(hash as DepartmentHeadView);
      } else {
        setActiveView("overview");
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const switchView = (view: DepartmentHeadView) => {
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
