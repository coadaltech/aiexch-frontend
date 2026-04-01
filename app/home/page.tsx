"use client";

import HomeBanner from "@/components/home-banner";
import HomePromotionsSection from "@/components/home-promotions-section";
import DynamicHomeSections from "@/components/dynamic-home-sections";
import Footer from "../../components/layout/footer";
import { CricketMatchesList } from "@/components/sports/cricket-matches-list";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";
import {
  Bell, ChevronRight, Flame, Trophy, Dices,
  Volleyball, Zap, Target, Star, Users, Tv,
  TrendingUp, Gift, Shield,
} from "lucide-react";

/* ─── Error handler ─── */
const ErrorHandler = () => {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  useEffect(() => {
    if (!errorCode) return;
    const msgs: Record<string, string> = {
      "0": "Payload decode failed in middleware",
      "1": "Access denied: Admins only.",
      "2": "Error verifying owner access.",
    };
    toast.error(msgs[errorCode] ?? "An unknown error occurred.");
  }, [errorCode]);
  return null;
};

/* ─── Scrolling notice ticker ─── */
const NOTICES = [
  "🎯 Welcome to AIEXCH — India's Premier Betting Exchange",
  "⚡ Minimum bet ₹100 | Maximum bet ₹5,00,000",
  "🏏 Live Cricket odds updated every second",
  "🔒 Secure & Responsible Gaming — Bet Wisely",
  "💰 Instant withdrawals within 30 minutes",
  "📱 Download our app for the best experience",
  "🎁 New users get exclusive welcome bonus — Check Promotions",
];

function NoticeTickerBar() {
  const text = NOTICES.join("   •••   ");
  return (
    <div className="flex items-center bg-[#0a2a42] border-b border-[#1b5785]/60 h-8 overflow-hidden">
      {/* Label */}
      <div className="flex items-center gap-1.5 bg-[#79a430] px-3 h-full shrink-0 z-10">
        <Bell className="h-3 w-3 text-white" />
        <span className="text-white text-[11px] font-bold tracking-wide whitespace-nowrap">
          NOTICE
        </span>
      </div>
      {/* Scrolling text */}
      <div className="flex-1 overflow-hidden relative">
        <div className="ticker-track flex whitespace-nowrap">
          <span className="text-[#66c4ff] text-[11px] px-4 inline-block animate-ticker">
            {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Sport category tabs ─── */
const SPORT_TABS = [
  { label: "Live", icon: Zap, href: "/sports/all", color: "#79a430", live: true },
  { label: "Cricket", icon: Trophy, href: "/sports/cricket", color: "#66c4ff" },
  { label: "Football", icon: Volleyball, href: "/sports/soccer", color: "#66c4ff" },
  { label: "Tennis", icon: Target, href: "/sports/tennis", color: "#66c4ff" },
  { label: "Casino", icon: Dices, href: "/casino", color: "#f5a0b4" },
  { label: "Matka", icon: Star, href: "/matka", color: "#f0a050" },
  { label: "Promotions", icon: Gift, href: "/promotions", color: "#93c738" },
  { label: "Responsible", icon: Shield, href: "/responsible-gaming", color: "#94b8cc" },
];

function SportCategoryTabs() {
  const router = useRouter();
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
      {SPORT_TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.label}
            onClick={() => router.push(tab.href)}
            className="flex flex-col items-center gap-1 shrink-0 group"
          >
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center relative overflow-hidden transition-transform group-hover:scale-105"
              style={{ background: `${tab.color}18`, border: `1.5px solid ${tab.color}40` }}
            >
              {tab.live && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#79a430] rounded-full animate-pulse" />
              )}
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: tab.color }} />
            </div>
            <span className="text-[10px] sm:text-[11px] text-white/80 font-medium whitespace-nowrap group-hover:text-white transition-colors">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Stats bar ─── */
const STATS = [
  { label: "Live Events", value: "240+", icon: Tv, color: "#79a430" },
  { label: "Active Users", value: "12K+", icon: Users, color: "#66c4ff" },
  { label: "Markets", value: "1800+", icon: TrendingUp, color: "#f0a050" },
  { label: "Paid Today", value: "₹2.4Cr", icon: Flame, color: "#f06888" },
];

function StatsBar() {
  return (
    <div className="grid grid-cols-4 gap-px bg-[#1b5785]/30 rounded-xl overflow-hidden mx-4">
      {STATS.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="flex flex-col items-center py-3 px-2 bg-[#0a2a42]"
          >
            <Icon className="h-4 w-4 mb-1" style={{ color: s.color }} />
            <span className="text-sm sm:text-base font-bold text-white font-condensed">
              {s.value}
            </span>
            <span className="text-[9px] sm:text-[10px] text-white/50 text-center leading-tight mt-0.5">
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Section header ─── */
function SectionHeader({
  title,
  subtitle,
  href,
  icon: Icon,
  badge,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  icon?: React.ElementType;
  badge?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-6 bg-[#79a430] rounded-full" />
        {Icon && <Icon className="h-4 w-4 text-[#66c4ff]" />}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-white font-condensed tracking-wide">
              {title}
            </h2>
            {badge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#79a430] text-white animate-pulse">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[10px] text-white/40 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-[#66c4ff] text-xs font-medium hover:text-white transition-colors"
        >
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

/* ─── Quick sport links row ─── */
const QUICK_SPORTS = [
  { label: "Cricket", href: "/sports/cricket", emoji: "🏏", count: "Live" },
  { label: "Football", href: "/sports/soccer", emoji: "⚽", count: "" },
  { label: "Tennis", href: "/sports/tennis", emoji: "🎾", count: "" },
  { label: "Horse Racing", href: "/sports/horse-racing", emoji: "🏇", count: "" },
  { label: "Matka", href: "/matka", emoji: "🎯", count: "" },
  { label: "Kabaddi", href: "/sports/kabaddi", emoji: "🤼", count: "" },
];

function QuickSportsRow() {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 pb-1">
      {QUICK_SPORTS.map((s) => (
        <Link
          key={s.label}
          href={s.href}
          className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg bg-[#174b73] hover:bg-[#1b5785] border border-[#1b5785] hover:border-[#66c4ff]/40 transition-all text-white text-xs font-medium"
        >
          <span>{s.emoji}</span>
          <span>{s.label}</span>
          {s.count && (
            <span className="text-[9px] bg-[#79a430] text-white px-1 rounded font-bold">
              {s.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

/* ─── Main homepage ─── */
const Homepage = () => {
  return (
    <div className="w-full min-w-0 bg-[#0c314d] min-h-full">
      <Suspense fallback={null}>
        <ErrorHandler />
      </Suspense>

      {/* 1. Notice ticker */}
      <NoticeTickerBar />

      {/* 2. Hero banner */}
      <div className="pt-2">
        <HomeBanner />
      </div>

      {/* 3. Sport category pill tabs */}
      <SportCategoryTabs />

      {/* 4. Stats bar */}
      <StatsBar />

      {/* 5. Live Cricket Matches */}
      <div className="mt-4">
        <div className="bg-[#0a2a42] mx-4 rounded-xl overflow-hidden border border-[#1b5785]/50">
          <SectionHeader
            title="CRICKET"
            subtitle="Live & upcoming matches"
            href="/sports/cricket"
            icon={Trophy}
            badge="LIVE"
          />
          <div className="px-3 pb-3">
            <CricketMatchesList sport="cricket" eventTypeId="4" maxMatches={6} emptyText="No matches right now" />
          </div>
        </div>
      </div>

      {/* 6. Quick sport pills */}
      <div className="mt-4">
        <SectionHeader title="SPORTS" icon={Volleyball} href="/sports" />
        <QuickSportsRow />
      </div>

      {/* 7. Promotions */}
      <div className="mt-4 px-4">
        <HomePromotionsSection />
      </div>

      {/* 8. Casino & dynamic sections */}
      <div className="px-4 pb-4">
        <DynamicHomeSections />
      </div>

      <Footer />
    </div>
  );
};

export default Homepage;
