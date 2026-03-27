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
  Loader2,
} from "lucide-react";
import { MenuGroup, MenuItem } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
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

// Helper: Get menu groups (without Sport sub-items since accordion handles that)
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

// Helper: Check if item is active
const isItemActive = (itemLink: string | undefined, pathname: string): boolean => {
  if (!itemLink) return false;
  return pathname === itemLink || pathname.startsWith(itemLink + "/");
};

/** Accordion item for a single sport — fetches series on expand */
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

  const { data: seriesData = [], isLoading } = useSeries(
    sport.eventTypeId,
    expanded // only fetch when expanded
  );

  // Auto-expand sport if the current path is within this sport
  useEffect(() => {
    if (
      pathname.startsWith(`/sports/${sport.basePath}`) ||
      pathname.startsWith(`/sports/${sport.eventTypeId}`)
    ) {
      setExpanded(true);
    }
  }, [pathname, sport.basePath, sport.eventTypeId]);

  // Auto-expand the series that contains the current match
  useEffect(() => {
    if (!expanded || seriesData.length === 0) return;
    const segments = pathname.split("/").filter(Boolean);
    // /sports/{sport}/{seriesId}/...
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
    <div>
      {/* Sport Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
          isSportActive
            ? "bg-[#3730a3] text-white shadow-md"
            : "text-white/90 hover:bg-[#3730a3]/20"
        }`}
      >
        <Trophy className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left">{sport.title}</span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-white/60" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-white/60" />
        )}
      </button>

      {/* Series List */}
      {expanded && (
        <div className="ml-3 mt-0.5 border-l border-white/10 pl-2">
          {isLoading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-white/50">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading...
            </div>
          ) : seriesData.length === 0 ? (
            <div className="px-3 py-2 text-xs text-white/40">No matches available</div>
          ) : (
            seriesData.map((series: Series) => {
              const isSeriesExpanded = expandedSeries.includes(series.id);
              const isSeriesActive =
                pathname.includes(`/${series.id}`) && isSportActive;

              return (
                <div key={series.id}>
                  {/* Series Header */}
                  <button
                    onClick={() => toggleSeries(series.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
                      isSeriesActive
                        ? "bg-[#3730a3]/50 text-white"
                        : "text-white/75 hover:bg-[#3730a3]/15 hover:text-white"
                    }`}
                  >
                    <span className="flex-1 text-left truncate">{series.name}</span>
                    {series.matches && series.matches.length > 0 && (
                      isSeriesExpanded ? (
                        <ChevronDown className="h-3 w-3 text-white/50 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-white/50 flex-shrink-0" />
                      )
                    )}
                  </button>

                  {/* Matches List */}
                  {isSeriesExpanded && series.matches && series.matches.length > 0 && (
                    <div className="ml-2 border-l border-white/10 pl-2 mb-1">
                      {series.matches.map((match: Match) => {
                        const matchId = match.event?.id || (match as any).id || (match as any).bfid;
                        const matchName =
                          match.event?.name ||
                          (match as any).name ||
                          (match as any).eventName ||
                          (match as any).matchName ||
                          (match as any).selections ||
                          "Unknown Match";
                        const isMatchActive = pathname.includes(`/${matchId}`);

                        // Split "Team A v Team B" into two lines
                        const nameParts = matchName.split(/ v | vs /i);
                        const team1 = nameParts[0]?.trim();
                        const team2 = nameParts[1]?.trim();

                        return (
                          <button
                            key={matchId}
                            onClick={() =>
                              router.push(
                                `/sports/${sport.basePath}/${series.id}/${matchId}`
                              )
                            }
                            className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] transition-all duration-150 cursor-pointer ${
                              isMatchActive
                                ? "bg-[#3730a3]/40 text-white font-medium"
                                : "text-white/60 hover:text-white hover:bg-white/5"
                            }`}
                            title={matchName}
                          >
                            {team2 ? (
                              <div className="flex flex-col leading-tight">
                                <span className="truncate">{team1}</span>
                                <span className="truncate text-[10px] opacity-70">v {team2}</span>
                              </div>
                            ) : (
                              <span className="truncate block">{matchName}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export function AppSidebar() {
  const { isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  const [mounted, setMounted] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [sports, setSports] = useState<
    { title: string; eventTypeId: string; basePath: string }[]
  >([]);

  const isOwnerRoute = pathname.includes("/owner");
  const isSportsPage = pathname.startsWith("/sports");

  // Fetch sports list
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
          const sportName =
            sport.name || sport.title || sport.displayName || "Unknown Sport";
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

    if (mounted) {
      fetchSportsList();
    }
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Menu groups
  const menuGroups = useMemo(
    () => getMenuGroups(mounted ? isLoggedIn : false),
    [mounted, isLoggedIn]
  );

  // Handle item click
  const handleItemClick = (item: MenuItem) => {
    if (item.title === "Logout") {
      logout();
      return;
    }
    if (item.link) {
      router.push(item.link);
    }
  };

  // Early return for admin routes
  if (isOwnerRoute) return null;

  // Loading state
  const isLoading = !mounted || loadingGames;

  // Sidebar classes
  const sidebarClassName = "ml-2 rounded-2xl bg-[#1a2b47] overflow-hidden";
  const contentClassName =
    "p-3 pt-2 h-full bg-gradient-to-br from-slate-900 to-slate-800 pb-6";

  // Render loading skeleton
  if (isLoading) {
    return (
      <Sidebar className={sidebarClassName}>
        <SidebarContent className={contentClassName}>
          <div className="space-y-8 animate-pulse">
            {[1, 2, 3].map((section) => (
              <div key={section}>
                <div className="h-3 bg-blue-400/30 rounded w-20 mb-4 px-2" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg bg-blue-600/20"
                    >
                      <div className="w-5 h-5 bg-blue-400/20 rounded" />
                      <div className="h-4 bg-blue-400/20 rounded flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar className={sidebarClassName}>
      <SidebarContent className={contentClassName}>
        {/* Close / collapse button */}
        <div className="flex justify-end mb-1">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            title="Close sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {isSportsPage ? (
          /* ── Sports pages: only show sports accordion tree ── */
          <div>
            <div className="mb-2 px-2">
              <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Sports
              </h3>
            </div>
            <div className="space-y-0.5">
              {sports.map((sport) => (
                <SportAccordionItem
                  key={sport.eventTypeId}
                  sport={sport}
                  pathname={pathname}
                />
              ))}
              {/* Extra game links */}
              {[
                { title: "Matka", href: "/matka" },
                { title: "Lotry", href: "/lotry" },
                { title: "Skil Games", href: "/skil-games" },
                { title: "Jambo", href: "/jambo" },
              ].map((game) => (
                <button
                  key={game.title}
                  onClick={() => router.push(game.href)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    pathname.startsWith(game.href)
                      ? "bg-[#3730a3] text-white shadow-md"
                      : "text-white/90 hover:bg-[#3730a3]/20"
                  }`}
                >
                  <Trophy className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{game.title}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Non-sport pages: full menu ── */
          <>
            {/* Navigation Menu */}
            <div className="space-y-1 mb-4">
              {menuGroups[0].items.map((item) => {
                const isActive = isItemActive(item.link, pathname);
                return (
                  <SidebarMenu key={item.title} className="space-y-0">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        className={`group relative w-full h-full justify-start px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-[#3730a3] hover:bg-[#3730a3]/80 text-white shadow-md"
                            : "bg-transparent text-white hover:bg-[#3730a3]/20 border border-transparent"
                        }`}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="relative flex items-center w-full gap-3">
                          <item.icon className="h-5 w-5 flex-shrink-0 text-white" />
                          <span className="flex-1 text-sm font-medium text-white">
                            {item.title}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                );
              })}
            </div>

            {/* Sports Accordion Tree */}
            <div className="mb-4">
              <div className="mb-2 px-2">
                <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                  Sports
                </h3>
              </div>
              <div className="space-y-0.5">
                {sports.map((sport) => (
                  <SportAccordionItem
                    key={sport.eventTypeId}
                    sport={sport}
                    pathname={pathname}
                  />
                ))}
                {/* Extra game links */}
                {[
                  { title: "Matka", href: "/matka" },
                  { title: "Lotry", href: "/lotry" },
                  { title: "Skil Games", href: "/skil-games" },
                  { title: "Jambo", href: "/jambo" },
                ].map((game) => (
                  <button
                    key={game.title}
                    onClick={() => router.push(game.href)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                      pathname.startsWith(game.href)
                        ? "bg-[#3730a3] text-white shadow-md"
                        : "text-white/90 hover:bg-[#3730a3]/20"
                    }`}
                  >
                    <Trophy className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{game.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Remaining menu groups (Account, Support, etc.) */}
            <div className="space-y-1">
              {menuGroups.slice(1).map((group) => (
                <div key={group.title} className="mb-4">
                  {group.title && (
                    <div className="mb-2 px-2">
                      <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
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
                                ? "bg-[#3730a3]/20 text-white hover:bg-[#3730a3]/30 border border-[#3730a3]/30"
                                : isActive
                                  ? "bg-[#3730a3] hover:bg-[#3730a3]/80 text-white shadow-md"
                                  : "bg-transparent text-white hover:bg-[#3730a3]/20 border border-transparent"
                            }`}
                            onClick={() => handleItemClick(item)}
                          >
                            <div className="relative flex items-center w-full gap-3">
                              <item.icon className="h-5 w-5 flex-shrink-0 text-white" />
                              <span className="flex-1 text-sm font-medium text-white">
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
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
