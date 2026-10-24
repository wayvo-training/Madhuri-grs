"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { DepartmentHeadView } from "@/types/department-head";

export function useDepartmentHeadNavigation(
  initialView: DepartmentHeadView = "overview",
) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // SSR-safe view: must NOT reference typeof window !== 'undefined' to prevent React hydration mismatch!
  const getSsrSafeView = (): DepartmentHeadView => {
    if (pathname === "/department-head/workload") return "staff";
    if (pathname === "/department-head/queue") return "queue";
    if (pathname === "/department-head/activity") return "activity";
    if (pathname === "/department-head/knowledge") return "knowledge";
    if (pathname === "/department-head/notifications") return "notifications";
    return initialView;
  };

  const [activeView, setActiveView] =
    useState<DepartmentHeadView>(getSsrSafeView);

  useEffect(() => {
    const syncView = () => {
      // 1. Path-based routing
      if (pathname === "/department-head/workload") {
        setActiveView("staff");
        return;
      }
      if (pathname === "/department-head/queue") {
        setActiveView("queue");
        return;
      }
      if (pathname === "/department-head/activity") {
        setActiveView("activity");
        return;
      }
      if (pathname === "/department-head/knowledge") {
        setActiveView("knowledge");
        return;
      }
      if (pathname === "/department-head/notifications") {
        setActiveView("notifications");
        return;
      }

      // 2. Hash-based tabs
      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash.replace("#", "").toLowerCase();
        if (hash === "sla") {
          setActiveView("queue");
          return;
        }
        if (
          hash === "queue" ||
          hash === "staff" ||
          hash === "activity" ||
          hash === "knowledge" ||
          hash === "notifications"
        ) {
          setActiveView(hash as DepartmentHeadView);
          return;
        }
      }

      // 3. SearchParam tab (?tab=... or ?view=...)
      const querySearch =
        typeof window !== "undefined" ? window.location.search : "";
      const urlParams = querySearch
        ? new URLSearchParams(querySearch)
        : searchParams;
      const tabParam = urlParams.get("tab") || urlParams.get("view");
      if (tabParam) {
        const lower = tabParam.toLowerCase();
        if (
          lower === "queue" ||
          lower === "staff" ||
          lower === "activity" ||
          lower === "knowledge" ||
          lower === "notifications"
        ) {
          setActiveView(lower as DepartmentHeadView);
          return;
        }
      }

      setActiveView(initialView || "overview");
    };

    syncView();
    window.addEventListener("hashchange", syncView);
    window.addEventListener("popstate", syncView);
    return () => {
      window.removeEventListener("hashchange", syncView);
      window.removeEventListener("popstate", syncView);
    };
  }, [initialView, pathname, searchParams]);

  const switchView = (
    view: DepartmentHeadView,
    query?: Record<string, string>,
  ) => {
    setActiveView(view);

    const params = new URLSearchParams(query);
    if (view !== "overview") {
      params.set("tab", view);
    }
    const queryString = params.toString() ? `?${params.toString()}` : "";

    if (typeof window !== "undefined") {
      const newUrl = `/department-head/dashboard${queryString}`;
      window.history.pushState(null, "", newUrl);
      window.dispatchEvent(new Event("hashchange"));
      window.dispatchEvent(new Event("popstate"));
    }
  };

  return {
    activeView,
    switchView,
  };
}
