"use client";

import { useSettings } from "@/hooks/usePublic";

/** Built-in fallback notices, used until an admin sets a custom home notice. */
const DEFAULT_NOTICES = [
  "🎯 Welcome to AIEXCH — India's Premier Betting Exchange",
  "⚡ Minimum bet ₹100 | Maximum bet ₹5,00,000",
  "🏏 Live Cricket odds updated every second",
  "🔒 Secure & Responsible Gaming — Bet Wisely",
  "💰 Instant withdrawals within 30 minutes",
  "📱 Download our app for the best experience",
  "🎁 New users get exclusive welcome bonus — Check Promotions",
];

/**
 * Scrolling notice marquee. Shared by the main layout and the casino pages.
 * The text is admin-editable: it comes from `settings.homeNotice` (set in
 * Admin → Settings → Preferences), one notice per line. Falls back to the
 * built-in defaults when no custom notice is configured.
 */
export function NoticeTickerBar() {
  const { data: settings } = useSettings();

  const custom = String(settings?.homeNotice ?? "").trim();
  const items = custom
    ? custom
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : DEFAULT_NOTICES;
  const text = items.join("   •••   ");

  return (
    <div className="flex items-center  bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-secondary)] border-b border-[#1e4088]/60 h-8 overflow-hidden">
      {/* Scrolling text */}
      <div className="flex-1 overflow-hidden relative">
        <div className="ticker-track flex whitespace-nowrap">
          <span className="text-[var(--header-text)] text-[15px] px-4 inline-block font-bold animate-ticker">
            {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
          </span>
        </div>
      </div>
    </div>
  );
}
