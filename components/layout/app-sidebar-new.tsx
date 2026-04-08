"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Trophy,
  Gift,
  Headphones,
  User,
  Club,
  Shield,
  FileText,
  UserCheck,
  BookOpen,
  Receipt,
  LogOut,
  Info,
  Home,
  Dice6,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  SlidersHorizontal,
  Clock,
} from "lucide-react";
import { MenuGroup, MenuItem } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { isPanelPath } from "@/lib/panel-utils";
import { Series, Match } from "@/components/sports/types";
import axios from "axios";
import { useSeries } from "@/hooks/useSportsApi";
import { SPORT_ROUTES } from "@/lib/sports-config";

// Sport link mapping derived from shared config
const SPORT_LINK_MAPPING: Record<string, { basePath: string; eventTypeId: string }> =
  Object.fromEntries(
    Object.entries(SPORT_ROUTES).map(([, config]) => [
      config.eventTypeId,
      { basePath: config.basePath, eventTypeId: config.eventTypeId },
    ])
  );

// Helper: Get menu groups
const getMenuGroups = (isLoggedIn: boolean): MenuGroup[] => {
  const baseGroups: MenuGroup[] = [
    {
      title: "",
      items: [
        { title: "Home", icon: Home, link: "/" },
        { title: "Casino", icon: Dice6, link: "/casino" },
        { title: "Promotions", icon: Gift, link: "/promotions" },
      ],
    },
    {
      title: "Support & Info",
      items: [
        { title: "Live Support", icon: Headphones, link: "/live-support" },
        { title: "Faqs", icon: Info, link: "/faqs" },
        { title: "Game Rules", icon: BookOpen, link: "/game-rules" },
        { title: "Terms & Conditions", icon: FileText, link: "/terms" },
        { title: "Privacy Policy", icon: Shield, link: "/privacy" },
        { title: "Responsible Gaming", icon: UserCheck, link: "/responsible-gaming" },
      ],
    },
  ];

  if (!isLoggedIn) return baseGroups;

  return [
    baseGroups[0],
    {
      title: "Account",
      items: [
        { title: "Profile", icon: User, link: "/profile" },
        { title: "Bet History", icon: Club, link: "/profile/bet-history" },
        { title: "Stake Settings", icon: SlidersHorizontal, link: "/profile/stake-settings" },
        { title: "Account Statement", icon: Receipt, link: "/profile/account-statement" },
      ],
    },
    baseGroups[1],
    {
      title: "Account Actions",
      items: [{ title: "Logout", icon: LogOut }],
    },
  ];
};

const isItemActive = (itemLink: string | undefined, pathname: string): boolean => {
  if (!itemLink) return false;
  return pathname === itemLink || pathname.startsWith(itemLink + "/");
};

/** Accordion item for a single sport */
function SportAccordionItem({
  sport,
  pathname,
}: {
  sport: { title: string; eventTypeId: string; basePath: string };
  pathname: string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [expandedSeries, setExpandedSeries] = useState<string[]>([]);

  const { data: seriesData = [], isLoading } = useSeries(sport.eventTypeId, expanded);

  useEffect(() => {
    if (
      pathname.startsWith(`/sports/${sport.basePath}`) ||
      pathname.startsWith(`/sports/${sport.eventTypeId}`)
    ) {
      setExpanded(true);
    }
  }, [pathname, sport.basePath, sport.eventTypeId]);

  useEffect(() => {
    if (!expanded || seriesData.length === 0) return;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length >= 3 && segments[0] === "sports") {
      const seriesId = segments[2];
      if (seriesId && !expandedSeries.includes(seriesId)) {
        setExpandedSeries((prev) => [...prev, seriesId]);
      }
    }
  }, [expanded, seriesData, pathname, expandedSeries]);

  const isSportActive =
    pathname.startsWith(`/sports/${sport.basePath}`) ||
    pathname.startsWith(`/sports/${sport.eventTypeId}`);

  const toggleSeries = (seriesId: string) => {
    setExpandedSeries((prev) =>
      prev.includes(seriesId)
        ? prev.filter((id) => id !== seriesId)
        : [...prev, seriesId]
    );
  };

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
          isSportActive ? "bg-[#1a3578] text-white" : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <Trophy className="h-4 w-4 flex-shrink-0" />
        <span className={`flex-1 text-left font-bold text-base ${isSportActive ? "text-white" : "text-black"}`}>{sport.title}</span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        )}
      </button>

      {expanded && (
        <div className="ml-3 border-l border-gray-200 pl-2">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading...
            </div>
          ) : seriesData.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">No matches available</div>
          ) : (
            seriesData.map((series: Series) => {
              const isSeriesExpanded = expandedSeries.includes(series.id);
              const isSeriesActive = pathname.includes(`/${series.id}`) && isSportActive;

              return (
                <div key={series.id}>
                  <button
                    onClick={() => toggleSeries(series.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 text-sm transition-colors cursor-pointer border-b border-gray-100 ${
                      isSeriesActive
                        ? "bg-[#1a3578]/10 text-[#1a3578] font-bold"
                        : "text-black font-bold hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex-1 text-left truncate">{series.name}</span>
                    {series.matches && series.matches.length > 0 && (
                      isSeriesExpanded
                        ? <ChevronDown className="h-3 w-3 flex-shrink-0 opacity-50" />
                        : <ChevronRight className="h-3 w-3 flex-shrink-0 opacity-50" />
                    )}
                  </button>

                  {isSeriesExpanded && series.matches && series.matches.length > 0 && (() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const seriesNameLower = series.name?.toLowerCase().trim() || "";
                    const upcomingMatches = series.matches.filter((match: Match) => {
                      const matchName = (match.event?.name || (match as any).name || "").toLowerCase().trim();
                      if (seriesNameLower && matchName === seriesNameLower) return true;
                      const openDate = match.event?.openDate || (match as any).openDate;
                      if (!openDate) return true;
                      return new Date(openDate) >= today;
                    });
                    if (upcomingMatches.length === 0) return null;
                    const sortedMatches = [...upcomingMatches].sort((a: Match, b: Match) => {
                      const dateA = new Date(a.event?.openDate || (a as any).openDate || 0).getTime();
                      const dateB = new Date(b.event?.openDate || (b as any).openDate || 0).getTime();
                      return dateA - dateB;
                    });
                    return (
                    <div className="ml-2 border-l border-gray-200 pl-2 mb-1">
                      {sortedMatches.map((match: Match) => {
                        const matchId = match.event?.id || (match as any).id || (match as any).bfid;
                        const matchName =
                          match.event?.name || (match as any).name || (match as any).eventName ||
                          (match as any).matchName || (match as any).selections || "Unknown Match";
                        const isMatchActive = pathname.includes(`/${matchId}`);
                        const nameParts = matchName.split(/ v | vs /i);
                        const team1 = nameParts[0]?.trim();
                        const team2 = nameParts[1]?.trim();

                        return (
                          <button
                            key={matchId}
                            onClick={() => router.push(`/sports/${sport.basePath}/${series.id}/${matchId}`)}
                            className={`w-full text-left px-2.5 py-1.5 text-xs transition-colors cursor-pointer border-b border-gray-100 ${
                              isMatchActive
                                ? "bg-[#1a3578]/10 text-[#1a3578] font-bold"
                                : "text-black font-bold hover:bg-gray-50"
                            }`}
                            title={matchName}
                          >
                            {team2 ? (
                              <div className="flex flex-col leading-tight">
                                <span className="truncate">{team1}</span>
                                <span className="truncate text-[11px] opacity-80">v {team2}</span>
                              </div>
                            ) : (
                              <span className="truncate block">{matchName}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/** Accordion item for Matka with Shifts / Transactions sub-tabs */
function MatkaAccordionItem({ pathname }: { pathname: string }) {
  const router = useRouter();
  const isMatkaActive = pathname.startsWith("/matka");
  const [expanded, setExpanded] = useState(isMatkaActive);

  useEffect(() => {
    if (isMatkaActive) setExpanded(true);
  }, [isMatkaActive]);

  const subTabs = [
    { title: "Shifts", href: "/matka" },
    { title: "Transactions", href: "/matka/transactions" },
  ];

  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
          isMatkaActive ? "bg-[#1a3578] text-white" : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <Trophy className="h-4 w-4 flex-shrink-0" />
        <span className={`flex-1 text-left font-bold text-base ${isMatkaActive ? "text-white" : "text-black"}`}>
          Matka
        </span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
        )}
      </button>

      {expanded && (
        <div className="ml-3 border-l border-gray-200 pl-2">
          {subTabs.map((tab) => {
            const isActive =
              tab.href === "/matka"
                ? pathname === "/matka" || (pathname.startsWith("/matka/") && !pathname.startsWith("/matka/transactions"))
                : pathname.startsWith(tab.href);
            return (
              <button
                key={tab.href}
                onClick={() => router.push(tab.href)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 text-sm transition-colors cursor-pointer border-b border-gray-100 ${
                  isActive
                    ? "bg-[#1a3578]/10 text-[#1a3578] font-bold"
                    : "text-black font-bold hover:bg-gray-50"
                }`}
              >
                {tab.title === "Shifts" ? (
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                ) : (
                  <Receipt className="h-3.5 w-3.5 flex-shrink-0" />
                )}
                <span className="flex-1 text-left">{tab.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppSidebar() {
  const { isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { open, toggleSidebar } = useSidebar();

  const [mounted, setMounted] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [sports, setSports] = useState<
    { title: string; eventTypeId: string; basePath: string }[]
  >([]);
  const [liveTab, setLiveTab] = useState<"live" | "sports">("sports");

  const isOwnerRoute = isPanelPath(pathname);
  const isSportsPage = pathname.startsWith("/sports");

  useEffect(() => {
    const fetchSportsList = async () => {
      try {
        setLoadingGames(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/sports/sports-list`
        );
        const data = await response.data.data;
        const transformedData = data.map((sport: any) => {
          const eventTypeId = String(sport.id || sport.eventType || "");
          const sportName = sport.name || sport.title || sport.displayName || "Unknown Sport";
          const config = SPORT_LINK_MAPPING[eventTypeId];
          return {
            title: sportName,
            eventTypeId,
            basePath: config?.basePath || eventTypeId,
          };
        });
        setSports(transformedData);
      } catch (error) {
        console.error("Error fetching sports list:", error);
      } finally {
        setLoadingGames(false);
      }
    };

    if (mounted) fetchSportsList();
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuGroups = useMemo(
    () => getMenuGroups(mounted ? isLoggedIn : false),
    [mounted, isLoggedIn]
  );

  const handleItemClick = (item: MenuItem) => {
    if (item.title === "Logout") {
      logout();
      return;
    }
    if (item.link) router.push(item.link);
  };

  if (isOwnerRoute) return null;

  const isLoading = !mounted || loadingGames;

  const sidebarClassName = "rounded-xl bg-white overflow-hidden border border-gray-200";
  const contentClassName = "p-0 h-full bg-white pb-6";

  // ── All icon-only items for collapsed state ────────────────────────────
  const allIconItems = [
    { icon: Home, link: "/", title: "Home" },
    { icon: Dice6, link: "/casino", title: "Casino" },
    { icon: Gift, link: "/promotions", title: "Promotions" },
    { icon: Trophy, link: "/sports", title: "Sports" },
    ...(isLoggedIn ? [
      { icon: User, link: "/profile", title: "Profile" },
      { icon: Club, link: "/profile/bet-history", title: "Bet History" },
      { icon: Receipt, link: "/profile/account-statement", title: "Statement" },
    ] : []),
    { icon: Headphones, link: "/live-support", title: "Support" },
    { icon: Info, link: "/faqs", title: "FAQs" },
    { icon: BookOpen, link: "/game-rules", title: "Game Rules" },
    { icon: Shield, link: "/responsible-gaming", title: "Responsible" },
    ...(isLoggedIn ? [{ icon: LogOut, link: null, title: "Logout" }] : []),
  ];

  return (
    <Sidebar collapsible="icon" className={sidebarClassName}>
      <SidebarContent className={contentClassName}>

        {/* ── Toggle button (always visible at top) ── */}
        <div className={`pt-2 mb-1 ${open ? "flex justify-end px-2" : ""}`}>
          <button
            onClick={toggleSidebar}
            title={open ? "Collapse sidebar" : "Expand sidebar"}
            className={`p-1.5 rounded-lg text-gray-400 hover:text-[#1a3578] hover:bg-gray-100 transition-colors ${!open ? "w-full flex items-center justify-center h-9" : ""}`}
          >
            {open
              ? <PanelLeftClose className="h-4 w-4" />
              : <PanelLeftOpen className="h-4 w-4" />
            }
          </button>
        </div>

        {/* ── COLLAPSED: icon-only column ── */}
        {!open && (
          <div className="flex flex-col gap-0.5">
            {allIconItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.link ? isItemActive(item.link, pathname) : false;
              const isLogoutItem = item.title === "Logout";
              return (
                <button
                  key={item.title}
                  onClick={() => {
                    if (isLogoutItem) { logout(); return; }
                    if (item.link) router.push(item.link);
                  }}
                  title={item.title}
                  className={`w-full h-9 flex items-center justify-center rounded-lg transition-colors ${
                    isLogoutItem
                      ? "text-red-500 hover:bg-red-50"
                      : isActive
                        ? "bg-[#1a3578] text-white"
                        : "text-gray-500 hover:bg-gray-100 hover:text-[#1a3578]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        )}

        {/* ── EXPANDED: full sidebar ── */}
        {open && (
          <>
            {isLoading ? (
              <div className="space-y-8 animate-pulse px-3">
                {[1, 2, 3].map((section) => (
                  <div key={section}>
                    <div className="h-3 bg-gray-200 rounded w-20 mb-4" />
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg bg-gray-100">
                          <div className="w-5 h-5 bg-gray-200 rounded" />
                          <div className="h-4 bg-gray-200 rounded flex-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : isSportsPage ? (
              /* ── Sports pages ── */
              <div className="px-2">
                {/* Header buttons */}
                <div className="space-y-1 mb-3">
                  {[
                    { label: "Favorite matches", icon: Gift },
                    { label: "Recommended", icon: Home },
                    { label: "Top competitions", icon: Trophy },
                  ].map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold bg-gradient-to-r from-[#142969] via-[#142669] to-[#84c2f1] hover:bg-[#0b1545] text-white transition-colors cursor-pointer"
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{label}</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    </button>
                  ))}
                </div>

                {/* LIVE / SPORTS toggle */}
                <div className="flex mb-3 rounded-md overflow-hidden border border-gray-200">
                  <button
                    onClick={() => setLiveTab("live")}
                    className={`flex-1 py-1.5 text-xs font-bold tracking-wide transition-colors cursor-pointer ${
                      liveTab === "live" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    ● LIVE
                  </button>
                  <button
                    onClick={() => setLiveTab("sports")}
                    className={`flex-1 py-1.5 text-xs font-bold tracking-wide transition-colors cursor-pointer ${
                      liveTab === "sports" ? "bg-[#1a3578] text-white" : "bg-gray-100 text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    SPORTS
                  </button>
                </div>

                <div className="mb-1 px-1">
                  <span className="text-[10px] font-bold text-[#1a3578] uppercase tracking-widest">Top</span>
                </div>

                <div className="space-y-0">
                  {sports.map((sport) => (
                    <SportAccordionItem key={sport.eventTypeId} sport={sport} pathname={pathname} />
                  ))}
                  <MatkaAccordionItem pathname={pathname} />
                  {[
                    { title: "Lotry", href: "/lotry" },
                    { title: "Skil Games", href: "/skil-games" },
                    { title: "Jambo", href: "/jambo" },
                  ].map((game) => (
                    <button
                      key={game.title}
                      onClick={() => router.push(game.href)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-bold transition-colors cursor-pointer border-b border-gray-100 ${
                        pathname.startsWith(game.href) ? "bg-[#1a3578] text-white" : "text-black hover:bg-gray-50"
                      }`}
                    >
                      <Trophy className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{game.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ── Non-sport pages ── */
              <div className="px-2">
                {/* Header buttons */}
                <div className="space-y-1 mb-4">
                  {[
                    { label: "Favorite matches", icon: Gift },
                    { label: "Recommended", icon: Home },
                    { label: "Top competitions", icon: Trophy },
                  ].map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold bg-gradient-to-r from-[#142969] via-[#142669] to-[#84c2f1] hover:bg-[#0b1545] text-white transition-colors cursor-pointer"
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{label}</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                    </button>
                  ))}
                </div>

                {/* Nav items */}
                <div className="space-y-1 mb-4">
                  {menuGroups[0].items.map((item) => {
                    const isActive = isItemActive(item.link, pathname);
                    return (
                      <SidebarMenu key={item.title} className="space-y-0">
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            className={`group relative w-full h-full justify-start px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                              isActive
                                ? "bg-gradient-to-r from-[#142969] to-[#84c2f1]  text-white shadow-md"
                                : "bg-transparent text-gray-700 hover:bg-gray-100 border border-transparent"
                            }`}
                            onClick={() => handleItemClick(item)}
                          >
                            <div className="relative flex items-center w-full gap-3">
                              <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-white" : "text-gray-500"}`} />
                              <span className={`flex-1 text-sm font-bold ${isActive ? "text-white" : "text-black"}`}>
                                {item.title}
                              </span>
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    );
                  })}
                </div>

                {/* Sports section */}
                <div className="mb-4">
                  <div className="mb-2 px-2">
                    <h3 className="text-xs font-bold text-[#1a3578] uppercase tracking-wider">Sports</h3>
                  </div>
                  <div className="space-y-0.5">
                    {sports.map((sport) => (
                      <SportAccordionItem key={sport.eventTypeId} sport={sport} pathname={pathname} />
                    ))}
                    <MatkaAccordionItem pathname={pathname} />
                    {[
                      { title: "Lotry", href: "/lotry" },
                      { title: "Skil Games", href: "/skil-games" },
                      { title: "Jambo", href: "/jambo" },
                    ].map((game) => (
                      <button
                        key={game.title}
                        onClick={() => router.push(game.href)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 cursor-pointer ${
                          pathname.startsWith(game.href)
                            ? "bg-[#1a3578] text-white shadow-md"
                            : "text-black hover:bg-gray-100"
                        }`}
                      >
                        <Trophy className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{game.title}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Remaining groups */}
                <div className="space-y-1">
                  {menuGroups.slice(1).map((group) => (
                    <div key={group.title} className="mb-4">
                      {group.title && (
                        <div className="mb-2 px-2">
                          <h3 className="text-xs font-bold text-[#1a3578] uppercase tracking-wider">
                            {group.title}
                          </h3>
                        </div>
                      )}
                      <SidebarMenu className="space-y-0.5">
                        {group.items.map((item) => {
                          const isActive = isItemActive(item.link, pathname);
                          const isLogoutItem = item.title === "Logout";
                          return (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton
                                className={`group relative w-full justify-start px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                                  isLogoutItem
                                    ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                    : isActive
                                      ? "bg-[#1a3578] text-white shadow-md"
                                      : "bg-transparent text-gray-700 hover:bg-gray-100 border border-transparent"
                                }`}
                                onClick={() => handleItemClick(item)}
                              >
                                <div className="relative flex items-center w-full gap-3">
                                  <item.icon className={`h-5 w-5 flex-shrink-0 ${isLogoutItem ? "text-red-500" : isActive ? "text-white" : "text-gray-500"}`} />
                                  <span className={`flex-1 text-sm font-bold ${isLogoutItem ? "text-red-600" : isActive ? "text-white" : "text-black"}`}>
                                    {item.title}
                                  </span>
                                </div>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
