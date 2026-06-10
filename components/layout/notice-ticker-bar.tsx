"use client";

import { Bell } from "lucide-react";

const NOTICES = [
  "🎯 Welcome to AIEXCH — India's Premier Betting Exchange",
  "⚡ Minimum bet ₹100 | Maximum bet ₹5,00,000",
  "🏏 Live Cricket odds updated every second",
  "🔒 Secure & Responsible Gaming — Bet Wisely",
  "💰 Instant withdrawals within 30 minutes",
  "📱 Download our app for the best experience",
  "🎁 New users get exclusive welcome bonus — Check Promotions",
];

/** Scrolling notice marquee. Shared by the main layout and the casino pages. */
export function NoticeTickerBar() {
  const text = NOTICES.join("   •••   ");
  return (
    <div className="flex items-center  bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-secondary)] border-b border-[#1e4088]/60 h-8 overflow-hidden">
      {/* Label */}
      <div className="flex items-center gap-1.5 text-black bg-[#ede105] px-3 h-full shrink-0 z-10">
        <Bell className="h-3 w-3 text-black" />
        <span className="text-black text-[11px] font-bold tracking-wide whitespace-nowrap">
          NOTICE
        </span>
      </div>
      {/* Scrolling text */}
      <div className="flex-1 overflow-hidden relative">
        <div className="ticker-track flex whitespace-nowrap">
          <span className="text-[#ffffff] text-[15px] px-4 inline-block font-bold animate-ticker">
            {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
          </span>
        </div>
      </div>
    </div>
  );
}
