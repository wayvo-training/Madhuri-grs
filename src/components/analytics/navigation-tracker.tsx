"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * NavigationTracker observes route transitions and logs navigation events
 * to the enterprise audit log.
 */
export function NavigationTracker() {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    // Avoid logging duplicate visits to exact same path
    if (prevPathnameRef.current === pathname) {
      return;
    }

    const fromPath = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    // Send asynchronous navigation ping
    const payload = JSON.stringify({
      fromPath,
      toPath: pathname,
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/logs/navigation", blob);
    } else {
      fetch("/api/logs/navigation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // Ignored
      });
    }
  }, [pathname]);

  return null;
}
