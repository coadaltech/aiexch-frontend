"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  History,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLoginLogs } from "@/hooks/useUserQueries";
import { formatLocalDateTime } from "@/lib/date-utils";

function formatDate(dateString?: string | null) {
  if (!dateString) return "—";
  return formatLocalDateTime(dateString, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getDeviceIcon(deviceType?: string | null) {
  const t = (deviceType ?? "").toLowerCase();
  if (t.includes("mobile") || t.includes("phone")) return Smartphone;
  if (t.includes("tablet")) return Tablet;
  return Monitor;
}

function joinParts(...parts: (string | null | undefined)[]) {
  const cleaned = parts.filter((p) => p && String(p).trim()).map((p) => String(p).trim());
  return cleaned.length ? cleaned.join(" ") : null;
}

export default function LastLogins() {
  const router = useRouter();
  const { data: logs = [], isLoading } = useLoginLogs();

  const cardCls = "rounded-2xl border border-gray-200 bg-white shadow-sm";

  return (
    <div className="w-full min-w-0 px-3 sm:px-4 py-4 sm:py-6 space-y-4">
      {/* ── Header ── */}
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
          <History className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg lg:text-2xl">
            Last Logins
          </h1>
          <p className="hidden truncate text-xs text-gray-500 sm:block">
            Recent sign-in activity on your account
          </p>
        </div>
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`${cardCls} p-4`}>
              <div className="animate-pulse space-y-2">
                <div className="h-4 w-40 rounded bg-gray-200" />
                <div className="h-3 w-24 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className={`${cardCls} p-10 text-center`}>
          <History className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p className="font-medium text-gray-900">No login history yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Your recent sign-ins will show up here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => {
            const DeviceIcon = getDeviceIcon(log.deviceType);
            const isSuccess = (log.status ?? "success").toLowerCase() === "success";
            const location = joinParts(log.city, log.country);
            const device =
              joinParts(log.deviceBrand, log.deviceModel) ||
              (log.deviceType ? String(log.deviceType) : null);
            const browser = joinParts(log.browser, log.browserVersion);
            const os = joinParts(log.os, log.osVersion);
            const duration = formatDuration(log.sessionDurationSeconds);

            return (
              <div key={log.id} className={`${cardCls} overflow-hidden`}>
                {/* Top row */}
                <div className="flex items-center gap-3 px-3 pt-3 pb-2 sm:px-4">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      isSuccess
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-500"
                    }`}
                  >
                    <DeviceIcon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatDate(log.loginAt)}
                      </span>
                      <Badge
                        variant="outline"
                        className={`border px-1.5 py-0 text-[10px] ${
                          isSuccess
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                        ) : (
                          <XCircle className="mr-0.5 h-2.5 w-2.5" />
                        )}
                        {isSuccess ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    {location && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-gray-100 px-3 pb-3 pt-2 sm:grid-cols-3 sm:px-4">
                  {log.ipAddress && (
                    <div>
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-400">
                        <Globe className="h-2.5 w-2.5" /> IP Address
                      </span>
                      <p className="break-all text-xs font-medium text-gray-900">
                        {log.ipAddress}
                      </p>
                    </div>
                  )}
                  {device && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                        Device
                      </span>
                      <p className="text-xs font-medium capitalize text-gray-900">
                        {device}
                      </p>
                    </div>
                  )}
                  {browser && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                        Browser
                      </span>
                      <p className="text-xs font-medium text-gray-900">{browser}</p>
                    </div>
                  )}
                  {os && (
                    <div>
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                        OS
                      </span>
                      <p className="text-xs font-medium text-gray-900">{os}</p>
                    </div>
                  )}
                  {duration && (
                    <div>
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-gray-400">
                        <Clock className="h-2.5 w-2.5" /> Session
                      </span>
                      <p className="text-xs font-medium text-gray-900">{duration}</p>
                    </div>
                  )}
                  {!isSuccess && log.failureReason && (
                    <div className="col-span-2 sm:col-span-3">
                      <span className="text-[10px] uppercase tracking-wide text-gray-400">
                        Reason
                      </span>
                      <p className="text-xs font-medium text-rose-600">
                        {log.failureReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
