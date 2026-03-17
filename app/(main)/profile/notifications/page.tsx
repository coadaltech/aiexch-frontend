"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
        return <Gift className="w-5 h-5 text-primary" />;
      case "transaction":
        return <CreditCard className="w-5 h-5 text-green-400" />;
      case "security":
        return <Shield className="w-5 h-5 text-yellow-400" />;
      case "system":
        return <Settings className="w-5 h-5 text-blue-400" />;
      case "promotion":
        return <Bell className="w-5 h-5 text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "bonus":
        return "bg-primary/10";
      case "transaction":
        return "bg-green-400/10";
      case "security":
        return "bg-yellow-400/10";
      case "system":
        return "bg-blue-400/10";
      case "promotion":
        return "bg-purple-400/10";
      default:
        return "bg-muted";
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
    <div className="min-h-screen w-full min-w-0">
      <div className="pb-6 sm:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 sm:py-0 lg:mb-6">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-muted shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
              Notifications
            </h1>
          </div>

          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              size="sm"
              variant="outline"
              className="w-full sm:w-auto shrink-0"
            >
              Mark All Read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 lg:mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
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
        </div>

        {/* Notifications List */}
        <div className="space-y-3 mt-6">
          {filteredNotifications.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center">
              <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-sm sm:text-base">
                No notifications found
              </p>
            </Card>
          ) : (
            filteredNotifications.map((notification: Notification) => (
              <Card
                key={notification.id}
                className="p-3 sm:p-4 hover:bg-muted/50 transition-colors min-w-0"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div
                    className={`p-2 rounded-full ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3
                            className={`font-semibold text-sm sm:text-base break-words ${
                              notification.isRead
                                ? "text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                        <p
                          className={`text-sm ${
                            notification.isRead
                              ? "text-muted-foreground"
                              : "text-foreground"
                          } mb-2`}
                        >
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.addedDate)}
                          </span>
                          {notification.actionUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:bg-primary/10 h-auto p-0 text-xs"
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
                            className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8 p-0"
                            disabled={markAsReadMutation.isPending}
                          >
                            <MarkAsRead className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
