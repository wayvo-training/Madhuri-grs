"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Bell, X, Check, CircleAlert, Info, MessageSquare, Briefcase } from "lucide-react";

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

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const headers: HeadersInit = userId ? { "x-user-id": userId } : { "x-user-id": "1" };
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
  };

  const markAsRead = async (id: string) => {
    try {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const n of unread) {
      await markAsRead(n.id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "GRIEVANCE_UPDATE":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "SLA_BREACH":
        return <CircleAlert className="h-5 w-5 text-rose-500" />;
      case "SLA_WARNING":
        return <CircleAlert className="h-5 w-5 text-amber-500" />;
      case "ASSIGNMENT":
        return <Briefcase className="h-5 w-5 text-emerald-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-slate-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <button
        type="button"
        title="Notifications"
        onClick={() => setIsOpen(true)}
        className="relative rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs animate-in zoom-in">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
          </span>
        )}
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 overflow-hidden" style={{ position: 'fixed' }}>
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md transform transition-transform duration-300 ease-in-out">
              <div className="flex h-full flex-col overflow-y-scroll bg-background shadow-2xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                  <div className="flex items-center gap-4">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        Mark all as read
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-muted/20">
                  {isLoading && notifications.length === 0 ? (
                    <div className="flex h-32 items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                      <div className="rounded-full bg-muted p-4 mb-4">
                        <Bell className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-medium text-foreground">No notifications</h3>
                      <p className="mt-1 text-xs text-muted-foreground">You're all caught up!</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {notifications.map((notification) => (
                        <li
                          key={notification.id}
                          className={`relative p-4 transition hover:bg-muted/50 ${
                            !notification.isRead ? "bg-background" : "bg-muted/10"
                          }`}
                        >
                          <div className="flex gap-4">
                            <div className="mt-1">
                              {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm ${!notification.isRead ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>
                                  {notification.title}
                                </p>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                  {getRelativeTime(notification.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-foreground/70 line-clamp-2 leading-relaxed">
                                {notification.message}
                              </p>
                              
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#064E3B] hover:text-emerald-800"
                                >
                                  <Check className="h-3 w-3" /> Mark as read
                                </button>
                              )}
                            </div>
                          </div>
                          {!notification.isRead && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#064E3B]" />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
