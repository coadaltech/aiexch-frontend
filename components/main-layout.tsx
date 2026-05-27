"use client";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider } from "./ui/sidebar";
import Header from "./layout/header";
import { AppSidebar } from "./layout/app-sidebar-new";
import { useWhitelabelInfo } from "@/hooks/useAuth";
import { useAuth } from "@/contexts/AuthContext";
import { isPanelPath } from "@/lib/panel-utils";
import { Bell } from "lucide-react";

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: whitelabelInfo, isLoading: whitelabelLoading } = useWhitelabelInfo();
  const { isLoggedIn } = useAuth();
  const isOwnerRoute = isPanelPath(pathname);
  const isAuthRoute =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/forgot-password");

  const isHomeOrRoot = pathname === "/" || pathname === "/home";
  // Casino runs as a full-width "system" page: header + dropheader + content,
  // but NO sidebar. The dropheader shows an Exchange button to return.
  const isCasinoRoute =
    (pathname?.startsWith("/casino-ace") || pathname?.startsWith("/qtech-casino")) ?? false;
  const whitelabelNotFound =
    !whitelabelLoading && whitelabelInfo?.whitelabelType == null;

  useEffect(() => {
    if (isOwnerRoute || isAuthRoute) return;
    if (whitelabelLoading) return;
    if (whitelabelNotFound) {
      router.replace("/login");
      return;
    }
    if (!isLoggedIn && isHomeOrRoot) {
      router.replace("/login");
    }
  }, [isOwnerRoute, isAuthRoute, whitelabelLoading, whitelabelNotFound, isLoggedIn, isHomeOrRoot, router]);

  if (isOwnerRoute || isAuthRoute) {
    return <>{children}</>;
  }

  if (whitelabelNotFound || (!isLoggedIn && isHomeOrRoot)) {
    return null;
  }
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
          <span className="text-[#ffffff] text-[15px] px-4 inline-block font-bold animate-ticker">
            {text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}
          </span>
        </div>
      </div>
    </div>
  );
}

  return (
    <SidebarProvider>
      <div style={{ height: 'var(--vh-full)' }} className="overflow-hidden bg-gray-200 w-full flex flex-col">
        {/* Fixed Header - always visible at top */}
        <Header />

        {/* Main Content Area - only this part scrolls; header and (on mobile) bottom tab stay fixed.
            Casino pages hide the dropheader, so they only need to clear the ~3.5rem top bar
            (no md:mt-30) — otherwise an empty grey gap appears. They're also flush (no padding). */}
        <div
          className={`flex flex-1 min-h-0 mt-14 ${
            isCasinoRoute
              ? "max-h-[calc(var(--vh-full)-3.5rem)]"
              : "md:mt-30 max-h-[calc(var(--vh-full)-4rem)] md:max-h-[calc(var(--vh-full)-7.5rem)] gap-2 p-2"
          }`}
        >
          {/* Sidebar - Starts below header. Hidden on casino (full-width). */}
          {!isCasinoRoute && <AppSidebar />}

          {/* Main Content - scrollable area; pb for mobile so content clears fixed bottom tab */}
          <main
            className={`min-h-0 flex-1 w-full overflow-y-auto overflow-x-hidden transition-all duration-300 ${
              isCasinoRoute ? "" : "pb-20 lg:pb-0 bg-[#efefef] rounded-xl"
            }`}
            id="main-content"
          >
            {children}
            {/* 1. Notice ticker */}
          </main>
        </div>
      <NoticeTickerBar />

      </div>
    </SidebarProvider>
  );
}
