"use client";

import {
  Bell,
  Briefcase,
  CheckCircle2,
  CircleAlert,
  Info,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Notification {
  id: string;
  userId: string;
  grievanceId?: string | null;
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

export function NotificationDrawer({ userId }: { userId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers: HeadersInit = userId
        ? { "x-user-id": userId }
        : { "x-user-id": "1" };
      const res = await fetch("/api/notifications", { headers });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

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
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.grievanceId) {
      // Navigate to the related grievance or dashboard if applicable
      router.push(
        `/department-head/dashboard?grievance=${notification.grievanceId}`,
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await fetch(`/api/notifications/read-all`, { method: "PATCH" });
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const getIcon = (type: string, title: string = "") => {
    const t = title.toLowerCase();
    if (type === "SLA_BREACH" || t.includes("breach")) {
      return <CircleAlert className="h-4 w-4 text-red-500" />;
    }
    if (t.includes("urgent") || t.includes("90%")) {
      return (
        <CircleAlert className="h-4 w-4 text-orange-600 dark:text-orange-500" />
      );
    }
    if (type === "SLA_WARNING" || t.includes("75%")) {
      return <CircleAlert className="h-4 w-4 text-orange-500" />;
    }
    if (t.includes("50%")) {
      return <CircleAlert className="h-4 w-4 text-amber-500" />;
    }
    if (type === "GRIEVANCE_UPDATE" || t.includes("internal note")) {
      return <Info className="h-4 w-4 text-blue-500" />;
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
          <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs animate-in zoom-in">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-80 ${showAll ? "max-h-[80vh]" : "max-h-[28rem]"} overflow-hidden rounded-xl border border-border bg-background shadow-2xl z-[9999] flex flex-col animate-in slide-in-from-top-2 fade-in duration-200`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <h2 className="text-sm font-semibold text-foreground">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400"
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
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {getRelativeTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-foreground/70 line-clamp-1">
                            {notification.message}
                          </p>
                          {notification.grievanceId && (
                            <p className="text-[10px] text-muted-foreground/80 mt-1">
                              {notification.grievanceId}
                            </p>
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

          {notifications.length > 5 && (
            <div className="p-2 border-t border-border bg-muted/10 text-center">
              <button
                type="button"
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? "Show less" : "View all notifications"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
