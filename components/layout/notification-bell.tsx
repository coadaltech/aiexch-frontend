"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useChannelWatcher } from "@/hooks/useChannelWatcher";

type UserNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  addedDate: string;
  data?: Record<string, any> | null;
};

function timeAgo(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
}

export function NotificationBell() {
  const { user, isLoggedIn } = useAuth();
  const userId = user?.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["my-notifications", userId],
    queryFn: () => userApi.getMyNotifications().then((r) => r.data),
    enabled: !!userId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const notifications: UserNotification[] = data?.data || [];
  const unread: number = data?.unreadCount ?? 0;

  // Real-time push: when the operator deletes this user's bets, the backend
  // broadcasts on the "user-notifications" channel; we filter to our own id.
  const onPush = useCallback(
    (msg: { userId?: string }) => {
      if (!userId || msg.userId !== userId) return;
      qc.invalidateQueries({ queryKey: ["my-notifications", userId] });
    },
    [userId, qc]
  );
  useChannelWatcher("user-notifications", onPush);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    // Opening the panel marks everything as read (clears the badge).
    if (next && unread > 0) {
      try {
        await userApi.markMyNotificationsRead();
        qc.invalidateQueries({ queryKey: ["my-notifications", userId] });
      } catch {
        /* ignore — badge just stays until next refresh */
      }
    }
  };

  if (!isLoggedIn || !userId) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-nav-text hover:text-white hover:bg-nav-btn/50 rounded-lg touch-manipulation transition-colors"
      >
        <Bell className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-black" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-600 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[300px] sm:w-[360px] max-w-[92vw] bg-white rounded-lg border border-gray-200 shadow-xl z-[60] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-bold text-gray-800">Notifications</span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-400">
                You have no notifications.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`px-3 py-2.5 ${n.isRead ? "bg-white" : "bg-blue-50"}`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                          n.type === "bet_deleted" ? "bg-red-500" : "bg-blue-500"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                            {timeAgo(n.addedDate)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 break-words">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
