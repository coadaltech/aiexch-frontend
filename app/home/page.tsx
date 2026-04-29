"use client";

import HomeBanner from "@/components/home-banner";
import HomePromotionsSection from "@/components/home-promotions-section";
import DynamicHomeSections from "@/components/dynamic-home-sections";
import Footer from "../../components/layout/footer";
import { CricketMatchesList } from "@/components/sports/cricket-matches-list";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import { toast } from "sonner";
import {
  Bell, ChevronRight, Flame, Trophy, Dices,
  Volleyball, Zap, Target, Star, Users, Tv,
  TrendingUp, Gift, Shield, Flag, Dog, Wind,
} from "lucide-react";

/* ─── Lazy mount: defers child render + API calls until scrolled near viewport ─── */
function LazyMount({
  children,
  minHeight = 200,
  rootMargin = "300px",
}: {
  children: React.ReactNode;
  minHeight?: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show, rootMargin]);

  return (
    <div ref={ref} style={show ? undefined : { minHeight }}>
      {show ? children : null}
    </div>
  );
}

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
    <div className="flex items-center bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-secondary)] border-b border-[#1e4088]/60 h-8 overflow-hidden">
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
          <span className="text-[#ffffff] text-[11px] px-4 inline-block animate-ticker">
            {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Sport category tabs ─── */
const SPORT_TABS = [
  { label: "Live", icon: Zap, href: "/sports/all", color: "var(--header-secondary)", live: true },
  { label: "Cricket", icon: Trophy, href: "/sports/cricket", color: "var(--header-secondary)" },
  { label: "Football", icon: Volleyball, href: "/sports/soccer", color: "var(--header-secondary)" },
  { label: "Tennis", icon: Target, href: "/sports/tennis", color: "var(--header-secondary)" },
  { label: "Casino", icon: Dices, href: "/casino", color: "#f5a0b4" },
  { label: "Matka", icon: Star, href: "/matka", color: "#f0a050" },
  { label: "Promotions", icon: Gift, href: "/promotions", color: "#9dd0f5" },
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
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[var(--header-secondary)] rounded-full animate-pulse" />
              )}
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: tab.color }} />
            </div>
            <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium whitespace-nowrap group-hover:text-gray-900 transition-colors">
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
  { label: "Live Events", value: "240+", icon: Tv, color: "var(--header-secondary)" },
  { label: "Active Users", value: "12K+", icon: Users, color: "var(--header-secondary)" },
  { label: "Markets", value: "1800+", icon: TrendingUp, color: "#f0a050" },
  { label: "Paid Today", value: "₹2.4Cr", icon: Flame, color: "#f06888" },
];

function StatsBar() {
  return (
    <div className="grid grid-cols-4 gap-px bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-primary)] rounded-xl overflow-hidden mx-4">
      {STATS.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className="flex flex-col items-center py-3 px-2 "
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
  oddsColumns,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  icon?: React.ElementType;
  badge?: string;
  oddsColumns?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-2 ${oddsColumns ? "pl-3 pr-0 sm:px-4" : "px-4"}`}>
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-6 bg-[var(--header-secondary)] rounded-full" />
        {Icon && <Icon className="h-4 w-4" />}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold  font-condensed tracking-wide">
              {title}
            </h2>
            {badge && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--header-primary)] text-[var(--header-text)] animate-pulse">
                {badge}
              </span>
            )}
          </div>
          {/* {subtitle && (
            <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
          )} */}
        </div>
      </div>
      {oddsColumns ? (
        <div className="flex items-center text-white text-[10px] sm:text-xs font-bold font-condensed tracking-wider">
          <div className="w-16 sm:w-40 md:w-48 text-center">1</div>
          <div className="w-16 sm:w-40 md:w-48 text-center">X</div>
          <div className="w-16 sm:w-40 md:w-48 text-center">2</div>
        </div>
      ) : href ? (
        <Link
          href={href}
          className="flex items-center gap-1 text-[var(--header-primary)] text-xs font-medium hover:text-[var(--header-secondary)] transition-colors"
        >
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
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
          className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 hover:border-[var(--header-primary)]/40 transition-all text-gray-700 text-xs font-medium"
        >
          <span>{s.emoji}</span>
          <span>{s.label}</span>
          {s.count && (
            <span className="text-[9px] bg-[var(--header-secondary)] text-white px-1 rounded font-bold">
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
    <div className="w-full min-w-0 bg-[#efefef] min-h-full">
      <Suspense fallback={null}>
        <ErrorHandler />
      </Suspense>

      {/* 1. Notice ticker
      <NoticeTickerBar /> */}

      {/* 2. Hero banner */}
      <div className="">
        <HomeBanner />
      </div>

        {/* 6. Quick sport pills */}
      <div className="mt-4">
        {/* <SectionHeader title="SPORTS" icon={Volleyball} href="/sports" /> */}
        <QuickSportsRow />
      </div>

      {/* 3. Sport category pill tabs */}
      {/* <SportCategoryTabs /> */}

      {/* 4. Stats bar */}
      {/* <StatsBar /> */}

      {/* 5. Live Cricket Matches */}
      <CricketMatchesList
        sport="cricket"
        eventTypeId="4"
        maxMatches={6}
        showHeader={false}
        wrapper={(content) => (
          <div className="mt-4">
            <div className="bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-primary)] text-[var(--header-text)] mx-0 sm:mx-4 rounded-none sm:rounded-xl overflow-hidden border-y sm:border border-[#1e4088]/50">
              <SectionHeader
                title="CRICKET"
                subtitle="Live & upcoming matches"
                href="/sports/cricket"
                icon={Trophy}
                badge="LIVE"
                oddsColumns
              />
              <div className="px-1 sm:px-2 pb-3">{content}</div>
            </div>
          </div>
        )}
      />

      {/* 5b. Football Matches */}
      <CricketMatchesList
        sport="soccer"
        eventTypeId="1"
        maxMatches={6}
        showHeader={false}
        wrapper={(content) => (
          <div className="mt-4">
            <div className="bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-primary)] text-[var(--header-text)] mx-0 sm:mx-4 rounded-none sm:rounded-xl overflow-hidden border-y sm:border border-[#1e4088]/50">
              <SectionHeader
                title="FOOTBALL"
                subtitle="Live & upcoming matches"
                href="/sports/soccer"
                icon={Volleyball}
                badge="LIVE"
                oddsColumns
              />
              <div className="px-1 sm:px-2 pb-3">{content}</div>
            </div>
          </div>
        )}
      />

      {/* 5c. Tennis Matches */}
      <LazyMount minHeight={320}>
        <CricketMatchesList
          sport="tennis"
          eventTypeId="2"
          maxMatches={6}
          showHeader={false}
          wrapper={(content) => (
            <div className="mt-4">
              <div className="bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-primary)] text-[var(--header-text)] mx-0 sm:mx-4 rounded-none sm:rounded-xl overflow-hidden border-y sm:border border-[#1e4088]/50">
                <SectionHeader
                  title="TENNIS"
                  subtitle="Live & upcoming matches"
                  href="/sports/tennis"
                  icon={Target}
                  badge="LIVE"
                  oddsColumns
                />
                <div className="px-1 sm:px-2 pb-3">{content}</div>
              </div>
            </div>
          )}
        />
      </LazyMount>

      {/* 5d. Horse Racing
      <div className="mt-4">
        <div className="bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-primary)] text-[var(--header-text)] mx-4 rounded-xl overflow-hidden border border-[#1e4088]/50">
          <SectionHeader
            title="HORSE RACING"
            subtitle="Live & upcoming races"
            href="/sports/horse-racing"
            icon={Wind}
            badge="LIVE"
          />
          <div className="px-3 pb-3">
            <CricketMatchesList sport="horse-racing" eventTypeId="7" maxMatches={6} emptyText="No races right now" />
          </div>
        </div>
      </div> */}

      {/* 5e. Greyhound Racing */}
      {/* <div className="mt-4">
        <div className="bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-primary)] text-[var(--header-text)] mx-4 rounded-xl overflow-hidden border border-[#1e4088]/50">
          <SectionHeader
            title="GREYHOUND RACING"
            subtitle="Live & upcoming races"
            href="/sports/greyhound-racing"
            icon={Dog}
            badge="LIVE"
          />
          <div className="px-3 pb-3">
            <CricketMatchesList sport="greyhound-racing" eventTypeId="4339" maxMatches={6} emptyText="No races right now" />
          </div>
        </div>
      </div> */}

      {/* 5f. Politics */}
      <LazyMount minHeight={320}>
        <CricketMatchesList
          sport="politics"
          eventTypeId="500"
          maxMatches={6}
          showHeader={false}
          wrapper={(content) => (
            <div className="mt-4">
              <div className="bg-gradient-to-r from-[var(--header-primary)] to-[var(--header-primary)] text-[var(--header-text)] mx-0 sm:mx-4 rounded-none sm:rounded-xl overflow-hidden border-y sm:border border-[#1e4088]/50">
                <SectionHeader
                  title="POLITICS"
                  subtitle="Live & upcoming markets"
                  href="/sports/politics"
                  icon={Flag}
                  badge="LIVE"
                  oddsColumns
                />
                <div className="px-1 sm:px-2 pb-3">{content}</div>
              </div>
            </div>
          )}
        />
      </LazyMount>

    

      {/* 7. Promotions */}
      <LazyMount minHeight={240}>
        <div className="mt-4 px-4">
          <HomePromotionsSection />
        </div>
      </LazyMount>

      {/* 8. Casino & dynamic sections */}
      <LazyMount minHeight={400}>
        <div className="px-4 pb-4">
          <DynamicHomeSections />
        </div>
      </LazyMount>

      <Footer />
    </div>
  );
};

export default Homepage;
