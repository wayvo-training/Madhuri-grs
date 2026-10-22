"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DepartmentHeadView } from "@/types/department-head";

export function useDepartmentHeadNavigation(
  initialView: DepartmentHeadView = "overview",
) {
  const pathname = usePathname();
  const router = useRouter();

  const getInitialView = (): DepartmentHeadView => {
    if (pathname === "/department-head/workload") return "staff";
    if (pathname === "/department-head/queue") return "queue";
    if (pathname === "/department-head/activity") return "activity";
    if (pathname === "/department-head/knowledge") return "knowledge";
    return initialView;
  };

  const [activeView, setActiveView] =
    useState<DepartmentHeadView>(getInitialView);

  useEffect(() => {
    // If the path itself corresponds to a view, synchronize
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

    // Otherwise, support hash fallback on /department-head/dashboard
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "").toLowerCase();
      if (hash === "sla") {
        setActiveView("queue");
      } else if (
        hash === "queue" ||
        hash === "staff" ||
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
  }, [pathname]);

  const switchView = (
    view: DepartmentHeadView,
    query?: Record<string, string>,
  ) => {
    setActiveView(view);

    const queryString = query
      ? `?${new URLSearchParams(query).toString()}`
      : "";

    // If navigating between dedicated sub-routes
    if (view === "overview") {
      router.push(`/department-head/dashboard${queryString}`);
    } else if (view === "staff") {
      router.push(`/department-head/workload${queryString}`);
    } else if (view === "queue") {
      router.push(`/department-head/queue${queryString}`);
    } else if (view === "activity") {
      router.push(`/department-head/activity${queryString}`);
    } else if (view === "knowledge") {
      router.push(`/department-head/knowledge${queryString}`);
    } else if (view === "sla") {
      router.push(`/department-head/queue${queryString}`);
    }
  };

  return {
    activeView,
    switchView,
  };
}
