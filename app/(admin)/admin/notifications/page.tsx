"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Bell, Send, Loader2 } from "lucide-react";
import {
  useNotifications,
  useCreateNotification,
  useDeleteNotification,
} from "@/hooks/useAdmin";
import { useFilters } from "@/hooks/useFilters";
import { usePagination } from "@/hooks/usePagination";
import { NotificationListSkeleton } from "@/components/admin/skeletons";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const confirmDialog = useConfirm();

  const { data: notifications = [], isLoading } = useNotifications();
  const createNotification = useCreateNotification();
  const deleteNotification = useDeleteNotification();

  const { filters, filteredData, updateFilter } = useFilters({
    data: notifications,
    initialFilters: {
      type: "all",
    },
  });

  const {
    items: paginatedNotifications,
    totalPages,
    currentPage,
    goToPage,
  } = usePagination({
    data: filteredData,
    itemsPerPage: 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    createNotification.mutate({
      title,
      message,
      type,
    });

    setTitle("");
    setMessage("");
    setType("info");
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Notifications
        </h1>
        <p className="text-muted-foreground">Send notifications to users</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Notification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-input border mt-2"
                  placeholder="Notification title"
                  required
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-input border mt-2"
                  placeholder="Notification message"
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-input border mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border">
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={createNotification.isPending}
                className="w-full bg-primary text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createNotification.isPending
                  ? "Sending..."
                  : "Send Notification"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <NotificationListSkeleton />
            ) : paginatedNotifications.length > 0 ? (
              <div className="space-y-4">
                {paginatedNotifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className="p-3 sm:p-4 bg-casino-darker rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                            {notification.title}
                          </h3>
                          <Badge
                            className={`${getTypeColor(
                              notification.type
                            )} text-white text-xs flex-shrink-0`}
                          >
                            {notification.type}
                          </Badge>
                        </div>
                        <p className="text-foreground text-sm mb-2 break-words">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          confirmDialog.confirm(
                            "Delete Notification",
                            "Are you sure you want to delete this notification? This action cannot be undone.",
                            () => deleteNotification.mutate(notification.id)
                          )
                        }
                        disabled={deleteNotification.isPending}
                        className="text-red-400 hover:text-red-300 h-8 w-8 p-0 flex-shrink-0"
                      >
                        {deleteNotification.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="px-3 py-1 text-sm">
                        {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No notifications sent yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.config?.title || ""}
        message={confirmDialog.config?.message || ""}
        onConfirm={confirmDialog.handleConfirm}
        onCancel={confirmDialog.handleCancel}
      />
    </div>
  );
}
