"use client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Bell,
  Gift,
  CreditCard,
  Shield,
  Settings,
  Award as MarkAsRead,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useUserQueries";
import { userApi } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationsSkeleton } from "@/components/skeletons/profile-skeletons";
import { Notification } from "@/types";

const CARD_CLS = "rounded-2xl border border-gray-200 bg-white shadow-sm";

export default function Notifications() {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: notifications = [], isLoading } = useNotifications(user?.id);

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) =>
      userApi.markNotificationAsRead(user?.id!, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  if (isLoading) {
    return <NotificationsSkeleton />;
  }

  const filteredNotifications = notifications
    .filter((notification: Notification) => {
      if (filter === "all") return true;
      if (filter === "unread") return !notification.isRead;
      if (filter === "read") return notification.isRead;
      return true;
    })
    .sort(
      (a: Notification, b: Notification) =>
        new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
    );

  const unreadCount = notifications.filter(
    (n: Notification) => !n.isRead
  ).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "bonus":
        return <Gift className="h-5 w-5 text-[var(--header-text)]" />;
      case "transaction":
        return <CreditCard className="h-5 w-5 text-emerald-600" />;
      case "security":
        return <Shield className="h-5 w-5 text-amber-600" />;
      case "system":
        return <Settings className="h-5 w-5 text-slate-600" />;
      case "promotion":
        return <Bell className="h-5 w-5 text-violet-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "bonus":
        return "bg-[var(--header-primary)]/10";
      case "transaction":
        return "bg-emerald-50";
      case "security":
        return "bg-amber-50";
      case "system":
        return "bg-slate-100";
      case "promotion":
        return "bg-violet-50";
      default:
        return "bg-gray-100";
    }
  };

  const markAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const markAllAsRead = () => {
    notifications.forEach((notification: Notification) => {
      if (!notification.isRead) {
        markAsReadMutation.mutate(notification.id);
      }
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full min-w-0 px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="shrink-0 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-900 sm:h-10 sm:w-10">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg lg:text-2xl">
            Notifications
          </h1>
        </div>

        {unreadCount > 0 && (
          <Button
            onClick={markAllAsRead}
            size="sm"
            variant="outline"
            className="w-full shrink-0 border-gray-300 text-gray-800 hover:bg-gray-100 sm:w-auto"
          >
            Mark All Read
          </Button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <Button
          onClick={() => setFilter("all")}
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          className="shrink-0"
        >
          All ({notifications.length})
        </Button>
        <Button
          onClick={() => setFilter("unread")}
          size="sm"
          variant={filter === "unread" ? "default" : "outline"}
          className="shrink-0"
        >
          Unread ({unreadCount})
        </Button>
        <Button
          onClick={() => setFilter("read")}
          size="sm"
          variant={filter === "read" ? "default" : "outline"}
          className="shrink-0"
        >
          Read ({notifications.length - unreadCount})
        </Button>
      </div>

      {/* ── Notifications List ── */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className={`${CARD_CLS} p-6 text-center sm:p-8`}>
            <Bell className="mx-auto mb-4 h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
            <p className="text-sm text-gray-500 sm:text-base">No notifications found</p>
          </div>
        ) : (
          filteredNotifications.map((notification: Notification) => (
            <div
              key={notification.id}
              className={`${CARD_CLS} p-3 transition-colors hover:bg-gray-50 sm:p-4`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className={`rounded-full p-2 ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3
                          className={`break-words text-sm font-semibold sm:text-base ${
                            notification.isRead ? "text-gray-500" : "text-gray-900"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-[var(--header-primary)]" />
                        )}
                      </div>
                      <p
                        className={`mb-2 text-sm ${
                          notification.isRead ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400">
                          {formatTimestamp(notification.addedDate)}
                        </span>
                        {notification.actionUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-[var(--header-text)] hover:bg-[var(--header-primary)]/10"
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <Button
                          onClick={() => markAsRead(notification.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          disabled={markAsReadMutation.isPending}
                        >
                          <MarkAsRead className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
