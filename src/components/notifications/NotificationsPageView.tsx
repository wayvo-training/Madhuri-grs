"use client";

import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Clock,
  Info,
  MailCheck,
  ShieldAlert,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { UserRole } from "@/components/dashboard/navigation";
import {
  AdvancedTableSearch,
  type FilterMode,
  type SearchCondition,
  type SearchFieldDef,
} from "@/components/ui/advanced-table-search";

export interface GrievanceSummary {
  id: string;
  number: string;
  title: string;
  status: string;
  priority: string;
  slaStatus: string | null;
  categoryName: string | null;
  createdAt: string;
  dueAt: string | null;
}

export interface DetailedNotification {
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
  actionLabel?: string | null;
  actionUrl?: string | null;
  category?: "ACTION_REQUIRED" | "SLA_ESCALATION" | "UPDATE";
  grievance?: GrievanceSummary | null;
}

interface NotificationsPageViewProps {
  userRole: UserRole;
  currentUserId?: string;
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getSemanticIcon(type: string, title = "") {
  const t = title.toLowerCase();
  if (
    type === "SLA_BREACH" ||
    type === "SLA_BREACHED" ||
    t.includes("breach")
  ) {
    return {
      icon: ShieldAlert,
      iconColor: "text-rose-600 dark:text-rose-400",
      bgColor:
        "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60",
      label: "SLA Breached",
    };
  }
  if (
    type === "SLA_URGENT" ||
    type === "SLA_WARNING" ||
    type === "SLA_AT_RISK" ||
    t.includes("urgent") ||
    t.includes("at risk")
  ) {
    return {
      icon: AlertTriangle,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgColor:
        "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60",
      label: "SLA Alert",
    };
  }
  if (
    type === "SLA_HALF_TIME" ||
    t.includes("reminder") ||
    t.includes("nudge")
  ) {
    return {
      icon: Clock,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgColor:
        "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/50",
      label: "Reminder",
    };
  }
  if (
    type === "ASSIGNMENT" ||
    type === "NEW_ASSIGNMENT" ||
    type === "REASSIGNMENT"
  ) {
    return {
      icon: Briefcase,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      bgColor:
        "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60",
      label: "Assignment",
    };
  }
  if (
    type === "RESOLUTION_SUBMITTED" ||
    type === "RESOLUTION_ACCEPTED" ||
    t.includes("resolution")
  ) {
    return {
      icon: CheckCircle2,
      iconColor: "text-teal-600 dark:text-teal-400",
      bgColor:
        "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/60",
      label: "Resolution",
    };
  }
  if (type.includes("INFO_REQUESTED") || t.includes("action required")) {
    return {
      icon: AlertCircle,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgColor:
        "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60",
      label: "Action Required",
    };
  }
  if (type.startsWith("KNOWLEDGE_ARTICLE") || t.includes("knowledge")) {
    return {
      icon: BookOpen,
      iconColor: "text-teal-600 dark:text-teal-400",
      bgColor:
        "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/60",
      label: "Knowledge Article",
    };
  }
  if (type === "ROUTING_EXCEPTION" || t.includes("routing")) {
    return {
      icon: SlidersHorizontal,
      iconColor: "text-purple-600 dark:text-purple-400",
      bgColor:
        "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/60",
      label: "Routing",
    };
  }
  return {
    icon: Info,
    iconColor: "text-blue-600 dark:text-blue-400",
    bgColor:
      "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60",
    label: "Update",
  };
}

function evaluateNotificationCondition(
  item: DetailedNotification,
  cond: SearchCondition,
): boolean {
  if (cond.field === "search") {
    const q = String(cond.value).toLowerCase();
    const matchTitle = item.title.toLowerCase().includes(q);
    const matchMsg = item.message.toLowerCase().includes(q);
    const matchGrievance = (
      item.grievanceNumber ||
      item.grievance?.number ||
      ""
    )
      .toLowerCase()
      .includes(q);
    const matchCategory = (item.grievance?.categoryName || "")
      .toLowerCase()
      .includes(q);
    return matchTitle || matchMsg || matchGrievance || matchCategory;
  }

  let itemVal = "";
  if (cond.field === "grievanceNumber") {
    itemVal = item.grievanceNumber || item.grievance?.number || "";
  } else if (cond.field === "title") {
    itemVal = item.title;
  } else if (cond.field === "message") {
    itemVal = item.message;
  } else if (cond.field === "type") {
    itemVal = item.type;
  } else if (cond.field === "priority") {
    itemVal = item.grievance?.priority || "";
  } else if (cond.field === "readStatus") {
    itemVal = item.isRead ? "READ" : "UNREAD";
  }

  const valArray = Array.isArray(cond.value) ? cond.value : [cond.value];
  const itemStr = itemVal.toLowerCase();

  switch (cond.operator) {
    case "equals":
      return valArray.some((v) => String(v).toLowerCase() === itemStr);
    case "not_equals":
      return !valArray.some((v) => String(v).toLowerCase() === itemStr);
    case "is_in":
      return valArray.some((v) => {
        const needle = String(v).toLowerCase();
        if (cond.field === "type") {
          return itemStr.includes(needle);
        }
        return needle === itemStr;
      });
    case "is_not_in":
      return !valArray.some((v) => {
        const needle = String(v).toLowerCase();
        if (cond.field === "type") {
          return itemStr.includes(needle);
        }
        return needle === itemStr;
      });
    case "contains":
      return valArray.some((v) => itemStr.includes(String(v).toLowerCase()));
    case "does_not_contain":
      return !valArray.some((v) => itemStr.includes(String(v).toLowerCase()));
    case "starts_with":
      return valArray.some((v) => itemStr.startsWith(String(v).toLowerCase()));
    case "ends_with":
      return valArray.some((v) => itemStr.endsWith(String(v).toLowerCase()));
    case "is_empty":
      return itemStr === "";
    case "is_not_empty":
      return itemStr !== "";
    default:
      return true;
  }
}

export function NotificationsPageView({
  userRole,
  currentUserId,
}: NotificationsPageViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const _initialId = searchParams.get("id");
  const targetGrievanceParam =
    searchParams.get("grievanceNumber") ||
    searchParams.get("grievanceId") ||
    "";

  const [notifications, setNotifications] = useState<DetailedNotification[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [activeTab, setActiveTab] = useState<
    "ALL" | "ACTION_REQUIRED" | "SLA" | "UPDATES"
  >("ALL");
  const [selectedGrievanceNumber, setSelectedGrievanceNumber] =
    useState<string>(targetGrievanceParam);
  const [advancedConditions, setAdvancedConditions] = useState<
    SearchCondition[]
  >([]);
  const [advancedMode, setAdvancedMode] = useState<FilterMode>("AND");

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers: HeadersInit = currentUserId
        ? { "x-user-id": currentUserId }
        : {};
      const res = await fetch("/api/notifications", { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const g =
      searchParams.get("grievanceNumber") ||
      searchParams.get("grievanceId") ||
      "";
    if (g) {
      setSelectedGrievanceNumber(g);
    }
  }, [searchParams]);

  const markAsRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await fetch("/api/notifications/read-all", { method: "PATCH" });
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleRowClick = (notification: DetailedNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    const targetGrievance =
      notification.grievanceNumber || notification.grievance?.number;
    if (targetGrievance) {
      setSelectedGrievanceNumber(targetGrievance);
    }
  };

  // Helper to classify notifications for summary cards and tabs
  const classifiedNotifications = useMemo(() => {
    return notifications.map((n) => {
      const isAction =
        n.category === "ACTION_REQUIRED" ||
        (!n.isRead &&
          (n.type.includes("INFO_REQUESTED") ||
            n.type === "REWORK_REQUIRED" ||
            n.type === "REOPENED" ||
            n.type === "GRIEVANCE_REOPENED" ||
            n.type === "ROUTING_EXCEPTION" ||
            n.type === "KNOWLEDGE_ARTICLE_SUBMITTED" ||
            (userRole === "STAFF" &&
              (n.type === "ASSIGNMENT" || n.type === "NEW_ASSIGNMENT")) ||
            (userRole === "END_USER" && n.type === "RESOLUTION_SUBMITTED") ||
            (userRole === "DEPARTMENT_HEAD" &&
              (n.type === "SLA_BREACHED" ||
                n.type === "SLA_AT_RISK" ||
                n.type === "RESOLUTION_SUBMITTED")) ||
            n.title.toLowerCase().includes("action required") ||
            n.title.toLowerCase().includes("review required") ||
            n.title.toLowerCase().includes("priority nudge")));

      const isSla =
        n.category === "SLA_ESCALATION" ||
        n.type.startsWith("SLA_") ||
        n.type === "GRIEVANCE_ESCALATED" ||
        n.title.toLowerCase().includes("sla") ||
        n.title.toLowerCase().includes("breach") ||
        n.title.toLowerCase().includes("escalat");

      const isUpdate = !isAction && !isSla;

      return {
        ...n,
        isActionRequiredComputed: isAction,
        isSlaComputed: isSla,
        isUpdateComputed: isUpdate,
      };
    });
  }, [notifications, userRole]);

  // Summary counts
  const summaryCounts = useMemo(() => {
    const total = classifiedNotifications.length;
    const actionRequired = classifiedNotifications.filter(
      (n) => n.isActionRequiredComputed,
    ).length;
    const sla = classifiedNotifications.filter((n) => n.isSlaComputed).length;
    const updates = classifiedNotifications.filter(
      (n) => n.isUpdateComputed,
    ).length;
    const unread = classifiedNotifications.filter((n) => !n.isRead).length;

    return { total, actionRequired, sla, updates, unread };
  }, [classifiedNotifications]);

  // Role-relevant notification types for the dropdown filter (without Reopen)
  const availableTypes = useMemo(() => {
    switch (userRole) {
      case "ADMIN":
        return [
          { value: "ROUTING", label: "Routing Exceptions" },
          { value: "SLA", label: "SLA Governance" },
          { value: "KNOWLEDGE", label: "Knowledge Governance" },
          { value: "SYSTEM", label: "System Alerts" },
        ];
      case "DEPARTMENT_HEAD":
        return [
          { value: "ASSIGNMENT", label: "Staff Assignments" },
          { value: "SLA", label: "SLA & Escalations" },
          { value: "RESOLUTION", label: "Resolution Reviews" },
          { value: "INFO", label: "Additional Info" },
          { value: "KNOWLEDGE", label: "Knowledge Reviews" },
        ];
      case "STAFF":
        return [
          { value: "ASSIGNMENT", label: "New Assignments" },
          { value: "SLA", label: "SLA Thresholds" },
          { value: "RESOLUTION", label: "Resolutions" },
          { value: "INFO", label: "Additional Info Requests" },
        ];
      default:
        return [
          { value: "SUBMISSION", label: "Grievance Submissions" },
          { value: "RESOLUTION", label: "Resolutions" },
          { value: "INFO", label: "Action Required / Info" },
          { value: "STATUS", label: "Investigation Updates" },
        ];
    }
  }, [userRole]);

  // Table Advanced Search Field Definitions (No Status, No Reopen)
  const searchFields: SearchFieldDef[] = useMemo(
    () => [
      { id: "search", label: "Search Keyword", type: "text" },
      { id: "grievanceNumber", label: "Grievance ID", type: "text" },
      { id: "title", label: "Title", type: "text" },
      { id: "message", label: "Message Content", type: "text" },
      {
        id: "type",
        label: "Notification Type",
        type: "select",
        options: availableTypes,
      },
      {
        id: "priority",
        label: "Priority",
        type: "select",
        options: [
          { label: "Critical", value: "CRITICAL" },
          { label: "High", value: "HIGH" },
          { label: "Medium", value: "MEDIUM" },
          { label: "Low", value: "LOW" },
        ],
      },
      {
        id: "readStatus",
        label: "Read Status",
        type: "select",
        options: [
          { label: "Unread", value: "UNREAD" },
          { label: "Read", value: "READ" },
        ],
      },
    ],
    [availableTypes],
  );

  const handleAdvancedSearch = (
    conditions: SearchCondition[],
    mode: FilterMode,
  ) => {
    setAdvancedConditions(conditions);
    setAdvancedMode(mode);
  };

  // Filtered list evaluated through AdvancedTableSearch conditions & active grievance filter
  const filteredNotifications = useMemo(() => {
    return classifiedNotifications.filter((n) => {
      // 1. Primary Tab filter
      if (activeTab === "ACTION_REQUIRED" && !n.isActionRequiredComputed)
        return false;
      if (activeTab === "SLA" && !n.isSlaComputed) return false;
      if (activeTab === "UPDATES" && !n.isUpdateComputed) return false;

      // 2. Specific Grievance filter (when clicking grievance in notification)
      if (selectedGrievanceNumber.trim()) {
        const q = selectedGrievanceNumber.trim().toLowerCase();
        const matchesGrievance =
          n.grievanceNumber?.toLowerCase().includes(q) ||
          n.grievance?.number?.toLowerCase().includes(q) ||
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q);
        if (!matchesGrievance) return false;
      }

      // 3. Evaluate Advanced Search conditions
      if (advancedConditions.length > 0) {
        if (advancedMode === "AND") {
          const pass = advancedConditions.every((c) =>
            evaluateNotificationCondition(n, c),
          );
          if (!pass) return false;
        } else if (advancedMode === "OR") {
          const pass = advancedConditions.some((c) =>
            evaluateNotificationCondition(n, c),
          );
          if (!pass) return false;
        } else if (advancedMode === "NOT") {
          const pass = !advancedConditions.some((c) =>
            evaluateNotificationCondition(n, c),
          );
          if (!pass) return false;
        }
      }

      return true;
    });
  }, [
    classifiedNotifications,
    activeTab,
    selectedGrievanceNumber,
    advancedConditions,
    advancedMode,
  ]);

  return (
    <div className="space-y-3.5 sm:space-y-4">
      {/* ========================================================================= */}
      {/* 1. COMPRESSED SUMMARY CARDS                                               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Card 1: Total */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 shadow-2xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
              Total
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-none mt-0.5">
              {summaryCounts.total}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate pt-0.5">
              Across notifications
            </p>
          </div>
          <div className="p-1 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 self-center">
            <Bell className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: Action Required */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 shadow-2xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
              {summaryCounts.actionRequired > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              )}
              Action Required
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-none mt-0.5">
              {summaryCounts.actionRequired}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate pt-0.5">
              Requires attention
            </p>
          </div>
          <div className="p-1 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 self-center">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: SLA & Escalations */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 shadow-2xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
              SLA & Escalations
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-none mt-0.5">
              {summaryCounts.sla}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate pt-0.5">
              SLA-related events
            </p>
          </div>
          <div className="p-1 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 self-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 4: Updates */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 shadow-2xs flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
              Updates
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-none mt-0.5">
              {summaryCounts.updates}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate pt-0.5">
              Informational updates
            </p>
          </div>
          <div className="p-1 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 self-center">
            <MailCheck className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABS & ACTIONS ROW                                                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-2">
        {/* Four Primary Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("ACTION_REQUIRED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "ACTION_REQUIRED"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>Action Required</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "ACTION_REQUIRED"
                  ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {summaryCounts.actionRequired}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("SLA")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "SLA"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>SLA & Escalations</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "SLA"
                  ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {summaryCounts.sla}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("UPDATES")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "UPDATES"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>Case Updates</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "UPDATES"
                  ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {summaryCounts.updates}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "ALL"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>All</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === "ALL"
                  ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {summaryCounts.total}
            </span>
          </button>
        </div>

        {/* Quick Actions (Mark Read) */}
        {summaryCounts.unread > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer whitespace-nowrap"
            >
              Mark all read
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. ADVANCED TABLE SEARCH (TABLES ADVANCED SEARCH SYSTEM)                 */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 sm:p-2.5 shadow-2xs">
        <AdvancedTableSearch
          fields={searchFields}
          onSearch={handleAdvancedSearch}
          className="w-full"
        />
      </div>

      {/* Active Grievance Filter Banner */}
      {selectedGrievanceNumber && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200">
            <span className="font-semibold">Showing notifications for:</span>
            <span className="font-mono font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-100 shadow-2xs">
              {selectedGrievanceNumber}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              ({filteredNotifications.length} notification
              {filteredNotifications.length !== 1 ? "s" : ""})
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedGrievanceNumber("");
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                url.searchParams.delete("grievanceNumber");
                url.searchParams.delete("grievanceId");
                router.replace(
                  url.pathname +
                    (url.searchParams.toString()
                      ? `?${url.searchParams.toString()}`
                      : ""),
                );
              }
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:text-teal-900 dark:hover:text-teal-100 hover:underline cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Show all notifications</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. COMPACT NOTIFICATION LIST (WITH INTERNAL SCROLLING TO FIT ONE PAGE)    */}
      {/* ========================================================================= */}
      {isLoading && notifications.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-slate-500 shadow-2xs">
          <div className="w-5 h-5 border-2 border-slate-900 dark:border-slate-100 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center shadow-2xs">
          <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
            <Bell className="w-4.5 h-4.5" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No notifications found
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {selectedGrievanceNumber
              ? `No notifications found for case ${selectedGrievanceNumber}.`
              : advancedConditions.length > 0
                ? "No alerts match your filter criteria. Try clearing your conditions."
                : "You are all caught up. No notifications in this category."}
          </p>
          {(selectedGrievanceNumber || advancedConditions.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setSelectedGrievanceNumber("");
                setAdvancedConditions([]);
              }}
              className="mt-2.5 inline-flex items-center text-xs font-semibold text-slate-800 dark:text-slate-200 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[300px] custom-scrollbar">
          {filteredNotifications.map((item) => {
            const semantic = getSemanticIcon(item.type, item.title);
            const Icon = semantic.icon;
            const grievanceContext =
              item.grievanceNumber && item.grievance?.categoryName
                ? `${item.grievanceNumber} · ${item.grievance.categoryName}`
                : item.grievanceNumber || item.grievance?.number || null;

            return (
              // biome-ignore lint/a11y/useSemanticElements: card contains inner interactive buttons
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => handleRowClick(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleRowClick(item);
                  }
                }}
                className={`py-2.5 px-3 sm:py-3 sm:px-4 transition flex items-start gap-3 relative cursor-pointer ${
                  !item.isRead
                    ? "bg-slate-50/70 dark:bg-slate-800/35 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                    : "hover:bg-slate-50/40 dark:hover:bg-slate-800/20"
                }`}
              >
                {/* Left: Semantic Icon + small unread dot */}
                <div className="relative mt-0.5 shrink-0">
                  <div
                    className={`p-1.5 sm:p-2 rounded-lg border ${semantic.bgColor} ${semantic.iconColor}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {!item.isRead && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                    </span>
                  )}
                </div>

                {/* Center / Body: Compact Scannable Content */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  {/* Row 1: Title + Timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate ${
                        !item.isRead ? "font-bold" : "font-medium"
                      }`}
                    >
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>

                  {/* Row 2: Grievance Case Badge · Category */}
                  {grievanceContext && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetNum =
                            item.grievanceNumber || item.grievance?.number;
                          if (targetNum) {
                            setSelectedGrievanceNumber(targetNum);
                          }
                        }}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 transition cursor-pointer"
                        title="View all notifications for this grievance"
                      >
                        Case: {item.grievanceNumber || item.grievance?.number}
                      </button>
                      {item.grievance?.categoryName && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          · {item.grievance.categoryName}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Row 3: Short Message */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 sm:line-clamp-2 leading-relaxed pt-0.5">
                    {item.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
