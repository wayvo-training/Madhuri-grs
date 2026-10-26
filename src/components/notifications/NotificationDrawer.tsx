"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BookOpen,
  Briefcase,
  CheckCircle2,
  CircleAlert,
  Info,
  MessageSquare,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export interface Notification {
  id: string;
  userId: string;
  grievanceId?: string | null;
  grievanceNumber?: string | null;
  type: string;
  channel: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
  readAt: string | null;
  isRead: boolean;
}

function getRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationDrawer({
  userId,
  userRole,
}: {
  userId?: string;
  userRole?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications", userId || "me"],
    queryFn: async () => {
      const headers: HeadersInit = userId ? { "x-user-id": userId } : {};
      const res = await fetch("/api/notifications", { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return data.success && Array.isArray(data.notifications)
        ? data.notifications
        : [];
    },
    staleTime: 5 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    const handleNotificationsChanged = () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", userId || "me"],
      });
    };
    if (typeof window !== "undefined") {
      window.addEventListener(
        "notifications-changed",
        handleNotificationsChanged,
      );
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "notifications-changed",
          handleNotificationsChanged,
        );
      }
    };
  }, [queryClient, userId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      queryClient.setQueryData<Notification[]>(
        ["notifications", userId || "me"],
        (old) =>
          old ? old.map((n) => (n.id === id ? { ...n, isRead: true } : n)) : [],
      );
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      queryClient.invalidateQueries({
        queryKey: ["notifications", userId || "me"],
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notifications-changed"));
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const getNotificationsUrl = () => {
    switch (userRole) {
      case "ADMIN":
        return "/admin/notifications";
      case "DEPARTMENT_HEAD":
        return "/department-head/notifications";
      case "STAFF":
        return "/staff/notifications";
      case "END_USER":
        return "/end-user/notifications";
      default:
        return "/end-user/notifications";
    }
  };

  const pathname = usePathname();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    const baseUrl = getNotificationsUrl();
    const params = new URLSearchParams();
    params.set("id", notification.id);
    if (notification.grievanceNumber) {
      params.set("grievanceNumber", notification.grievanceNumber);
    } else if (notification.grievanceId) {
      params.set("grievanceId", notification.grievanceId);
    }

    const [basePath, baseHash] = baseUrl.split("#");
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const hashStr = baseHash ? `#${baseHash}` : "";
    const targetUrl = `${basePath}${queryStr}${hashStr}`;

    if (pathname === basePath) {
      window.history.pushState(null, "", targetUrl);
      window.dispatchEvent(new Event("hashchange"));
    } else {
      router.push(targetUrl);
    }
  };

  const markAllAsRead = async () => {
    try {
      queryClient.setQueryData<Notification[]>(
        ["notifications", userId || "me"],
        (old) => (old ? old.map((n) => ({ ...n, isRead: true })) : []),
      );
      await fetch(`/api/notifications/read-all`, { method: "PATCH" });
      queryClient.invalidateQueries({
        queryKey: ["notifications", userId || "me"],
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notifications-changed"));
      }
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const getIcon = (type: string, title: string = "") => {
    const t = title.toLowerCase();
    if (
      type.startsWith("KNOWLEDGE_ARTICLE") ||
      t.includes("knowledge article")
    ) {
      return <BookOpen className="h-4 w-4 text-[#0F766E]" />;
    }
    if (
      type === "SLA_BREACH" ||
      type === "SLA_BREACHED" ||
      t.includes("breach")
    ) {
      return <CircleAlert className="h-4 w-4 text-red-500" />;
    }
    if (
      type.includes("CRITICAL") ||
      type === "SLA_URGENT" ||
      t.includes("urgent") ||
      t.includes("critical")
    ) {
      return (
        <CircleAlert className="h-4 w-4 text-orange-600 dark:text-orange-500" />
      );
    }
    if (
      type.includes("RISK") ||
      type === "SLA_AT_RISK" ||
      t.includes("at risk") ||
      t.includes("risk")
    ) {
      return <CircleAlert className="h-4 w-4 text-orange-500" />;
    }
    if (
      type.includes("WARN") ||
      type.includes("HALF_TIME") ||
      t.includes("warning") ||
      t.includes("reminder")
    ) {
      return <CircleAlert className="h-4 w-4 text-amber-500" />;
    }
    if (type === "GRIEVANCE_UPDATE" || t.includes("internal note")) {
      return <Info className="h-4 w-4 text-blue-500" />;
    }
    if (
      type === "ROUTING_EXCEPTION" ||
      t.includes("manual routing") ||
      t.includes("routing exception")
    ) {
      return (
        <CircleAlert className="h-4 w-4 text-amber-600 dark:text-amber-500" />
      );
    }
    if (
      type === "ADDITIONAL_INFO_REQUESTED" ||
      t.includes("additional info") ||
      t.includes("action required")
    ) {
      return <CircleAlert className="h-4 w-4 text-amber-500" />;
    }
    if (
      type === "ADDITIONAL_INFO_SUBMITTED" ||
      t.includes("responded with documents")
    ) {
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    }
    if (type === "ASSIGNMENT") {
      return <Briefcase className="h-4 w-4 text-emerald-500" />;
    }
    if (t.includes("success") || t.includes("resolv")) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        title="Notifications"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="relative rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-in zoom-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-80 sm:w-88 ${showAll ? "max-h-[80vh]" : "max-h-112"} overflow-hidden rounded-xl border border-border bg-background shadow-2xl z-9999 flex flex-col animate-in slide-in-from-top-2 fade-in duration-200`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex h-24 items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-6 w-6 text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {(showAll ? notifications : notifications.slice(0, 5)).map(
                  (notification) => (
                    // biome-ignore lint/a11y/useKeyWithClickEvents: non-interactive element
                    <li
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`relative p-3 cursor-pointer transition hover:bg-muted/50 ${
                        !notification.isRead ? "bg-muted/20" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="mt-0.5 shrink-0">
                          {getIcon(notification.type, notification.title)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-xs truncate ${!notification.isRead ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}
                            >
                              {notification.title}
                            </p>
                            <span className="text-[11px] text-muted-foreground shrink-0 font-normal">
                              {getRelativeTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {notification.message}
                          </p>
                          {notification.grievanceNumber && (
                            <div className="pt-1">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/70 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800">
                                Case: {notification.grievanceNumber}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500" />
                      )}
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2.5 border-t border-border bg-muted/20 text-center">
              <button
                type="button"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 cursor-pointer inline-flex items-center gap-1"
                onClick={() => {
                  setIsOpen(false);
                  const targetUrl = getNotificationsUrl();
                  const [basePath] = targetUrl.split("#");
                  if (pathname === basePath) {
                    window.history.pushState(null, "", targetUrl);
                    window.dispatchEvent(new Event("hashchange"));
                  } else {
                    router.push(targetUrl);
                  }
                }}
              >
                <span>View all notifications</span>
                <span>→</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
