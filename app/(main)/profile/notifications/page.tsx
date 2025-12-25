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
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

  const markAsRead = (id: number) => {
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
    <div className="max-w-md min-h-screen mx-auto lg:max-w-6xl">
      <div className="md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between  lg:p-0 lg:mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-foreground">
                Notifications
              </h1>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              size="sm"
              variant="outline"
            >
              {/* <MarkAsRead className="w-4 h-4 mr-2" /> */}
              Mark All Read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className=" lg:p-0 mt-4 lg:mb-6">
          <div className="flex gap-2 overflow-x-auto">
            <Button
              onClick={() => setFilter("all")}
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
            >
              All ({notifications.length})
            </Button>
            <Button
              onClick={() => setFilter("unread")}
              size="sm"
              variant={filter === "unread" ? "default" : "outline"}
            >
              Unread ({unreadCount})
            </Button>
            <Button
              onClick={() => setFilter("read")}
              size="sm"
              variant={filter === "read" ? "default" : "outline"}
            >
              Read ({notifications.length - unreadCount})
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 mt-6 lg:px-0">
          {filteredNotifications.length === 0 ? (
            <Card className="p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No notifications found
              </p>
            </Card>
          ) : (
            filteredNotifications.map((notification: Notification) => (
              <Card
                key={notification.id}
                className="p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={`font-semibold ${
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
                            {formatTimestamp(notification.createdAt)}
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
