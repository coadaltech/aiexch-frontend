"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
} from "lucide-react";
import { MenuGroup, MenuItem } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Series } from "@/components/sports/types";
import axios from "axios";
import { UseSportsSeries } from "@/hooks/UseSportsSeries";
import { SPORT_ROUTES, type SportSlug } from "@/lib/sports-config";

type SportRouteKey = SportSlug;

// Sport link mapping derived from shared config
const SPORT_LINK_MAPPING: Record<string, string> = Object.fromEntries(
  Object.entries(SPORT_ROUTES).map(([, config]) => [
    config.eventTypeId,
    `/sports/${config.basePath}`,
  ])
);
// Keep fallbacks for other event types that may come from API
SPORT_LINK_MAPPING["-4"] = "/sports/-4";
SPORT_LINK_MAPPING["-17"] = "/sports/-17";

// Helper: Get menu groups
const getMenuGroups = (isLoggedIn: boolean, games: any[]): MenuGroup[] => {
  const baseGroups: MenuGroup[] = [
    {
      title: "",
      items: [
        { title: "Home", icon: Home, link: "/" },
        { title: "Casino", icon: Dice6, link: "/casino" },
        { title: "Sport", icon: Trophy, link: "/sports", subItems: games },
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

// Helper: Detect sport route
const detectSportRoute = (pathname: string): SportRouteKey | null => {
  for (const [key, config] of Object.entries(SPORT_ROUTES)) {
    const { basePath, eventTypeId } = config;
    if (
      pathname === `/sports/${basePath}` ||
      pathname.startsWith(`/sports/${basePath}/`) ||
      pathname.startsWith(`/sports/${eventTypeId}/`)
    ) {
      return key as SportRouteKey;
    }
  }
  return null;
};

// Helper: Check if sports list route
const isSportsListRoute = (pathname: string): boolean => {
  if (pathname === "/sports" || pathname === "/sports/all" || pathname === "/live") {
    return true;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 2 || segments[0] !== "sports") {
    return false;
  }

  // Check if it's not a known sport route
  return !Object.values(SPORT_ROUTES).some(
    (config) => segments[1] === config.basePath || segments[1] === config.eventTypeId
  );
};

// Helper: Get match ID from path
const getMatchIdFromPath = (pathname: string, basePath: string, eventTypeId: string): string | null => {
  const segments = pathname.split("/").filter(Boolean);
  const isMatchByName = segments.length === 4 && segments[0] === "sports" && segments[1] === basePath;
  const isMatchById = segments.length === 4 && segments[0] === "sports" && segments[1] === eventTypeId;
  return isMatchByName || isMatchById ? segments[3] : null;
};

// Helper: Check if item is active
const isItemActive = (itemLink: string | undefined, pathname: string): boolean => {
  if (!itemLink) return false;
  return pathname === itemLink || pathname.startsWith(itemLink + "/");
};

// Helper: Check if series is active
const isSeriesActive = (
  series: Series,
  pathname: string,
  basePath: string,
  eventTypeId: string
): boolean => {
  const matchId = getMatchIdFromPath(pathname, basePath, eventTypeId);
  return (
    pathname === `/sports/${basePath}/${series.id}` ||
    pathname === `/sports/${eventTypeId}/${series.id}` ||
    (matchId !== null &&
      series.matches?.some(
        (match) => (match as any).id === matchId || match.event?.id === matchId
      )) ||
    false
  );
};

export function AppSidebar() {
  const { isLoggedIn, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Sport"]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [games, setGames] = useState<any[]>([]);

  // Detect current route type
  const sportRoute = detectSportRoute(pathname);
  const isSportsList = isSportsListRoute(pathname);
  const isAdminRoute = pathname.includes("/admin");

  // Fetch sports list
  useEffect(() => {
    const fetchSportsList = async () => {
      try {
        setLoadingGames(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/sports/sports-list`);
        const data = await response.data.data;

        const transformedData = data.map((sport: any) => {
          const eventType = String(sport.id || sport.eventType || "");
          const sportName = sport.name || sport.title || sport.displayName || "Unknown Sport";
          const link = SPORT_LINK_MAPPING[eventType] || `/sports/${eventType}`;

          return { title: sportName, link };
        });

        setGames(transformedData);
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

  // Fetch series data for current sport route
  const sportConfig = sportRoute ? SPORT_ROUTES[sportRoute] : null;
  const { seriesData, loading: loadingSeries } = UseSportsSeries(
    sportConfig?.eventTypeId || null
  );

  // Menu groups
  const menuGroups = useMemo(
    () => getMenuGroups(mounted ? isLoggedIn : false, games),
    [mounted, isLoggedIn, games]
  );

  // Handle item click
  const handleItemClick = (item: MenuItem) => {
    if (item.title === "Logout") {
      logout();
      return;
    }

    if (item.subItems) {
      if (item.title === "Sport") router.push("/sports");
      // setExpandedItems((prev) =>
      //   prev.includes(item.title)
      //     ? prev.filter((title) => title !== item.title)
      //     : [...prev, item.title]
      // );
    } else if (item.link) {
      router.push(item.link);
    }
  };

  // Early return for admin routes
  if (isAdminRoute) return null;

  // Loading state
  const isLoading = !mounted || loadingGames || loadingSeries;

  // Sidebar classes
  const sidebarClassName = "w-64 fixed h-[calc(100vh-8rem)] ml-2 rounded-2xl bg-[#1a2b47] relative overflow-hidden";
  const contentClassName = "p-3 pt-4 h-full bg-gradient-to-br from-slate-900 to-slate-800 pb-6";

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

  // Single return statement with all rendering logic
  return (
    <Sidebar className={sidebarClassName}>
      <SidebarContent className={contentClassName}>
        {/* Sports List View */}
        {isSportsList && (
          <>
            <div className="mb-3 px-2">
              <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                {pathname === "/live" || pathname === "/sports/all" ? "Live Sports" : "Sports"}
              </h3>
            </div>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={`group relative w-full h-full justify-start px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer ${pathname === "/sports" || pathname === "/sports/all"
                    ? "bg-[#3730a3] hover:bg-[#3730a3]/80 text-white shadow-md"
                    : "bg-transparent text-white hover:bg-[#3730a3]/20 border border-transparent"
                    }`}
                  onClick={() => router.push("/sports")}
                >
                  <div className="relative flex items-center w-full gap-3">
                    <Trophy className="h-5 w-5 transition-all duration-200 flex-shrink-0 text-white" />
                    <span className="flex-1 text-sm font-medium transition-colors duration-200 text-white">
                      All
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {games.map((sport) => {
                const isActive = isItemActive(sport.link, pathname);
                return (
                  <SidebarMenuItem key={sport.title}>
                    <SidebarMenuButton
                      className={`group relative w-full h-full justify-start px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer ${isActive
                        ? "bg-[#3730a3] hover:bg-[#3730a3]/80 text-white shadow-md"
                        : "bg-transparent text-white hover:bg-[#3730a3]/20 border border-transparent"
                        }`}
                      onClick={() => router.push(sport.link)}
                    >
                      <div className="relative flex items-center w-full gap-3">
                        <Trophy
                          className={`h-5 w-5 transition-all duration-200 flex-shrink-0 ${isActive ? "text-white" : "text-white/80 group-hover:text-white"
                            }`}
                        />
                        <span
                          className={`flex-1 text-sm font-medium transition-colors duration-200 ${isActive ? "text-white" : "text-white/90 group-hover:text-white"
                            }`}
                        >
                          {sport.title}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </>
        )}

        {/* Sport Series View */}
        {sportRoute && sportConfig && (
          <>
            <div className="mb-3 px-2">
              <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                {sportConfig.title}
              </h3>
            </div>
            <SidebarMenu className="space-y-1">
              {seriesData.length === 0 ? (
                <div className="px-3 py-2 text-sm text-white/60">{sportConfig.emptyText}</div>
              ) : (
                seriesData.map((series: Series) => {
                  const isActive = isSeriesActive(series, pathname, sportConfig.basePath, sportConfig.eventTypeId);
                  return (
                    <SidebarMenuItem key={series.id}>
                      <SidebarMenuButton
                        className={`group relative w-full h-full justify-start px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer ${isActive
                          ? "bg-[#3730a3] hover:bg-[#3730a3]/80 text-white shadow-md"
                          : "bg-transparent text-white hover:bg-[#3730a3]/20 border border-transparent"
                          }`}
                        onClick={() => router.push(`/sports/${sportConfig.basePath}/${series.id}`)}
                      >
                        <div className="relative flex items-center w-full gap-3">
                          <Trophy
                            className={`h-5 w-5 transition-all duration-200 flex-shrink-0 ${isActive ? "text-white" : "text-white/80 group-hover:text-white"
                              }`}
                          />
                          <span
                            className={`flex-1 text-sm font-medium transition-colors duration-200 ${isActive ? "text-white" : "text-white/90 group-hover:text-white"
                              }`}
                          >
                            {series.name}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </>
        )}

        {/* Default Menu View */}
        {!isSportsList && !sportRoute && (
          <div className="space-y-1">
            {menuGroups.map((group) => (
              <div key={group.title} className="mb-6">
                {group.title && (
                  <div className="mb-3 px-2">
                    <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                      {group.title}
                    </h3>
                  </div>
                )}
                <SidebarMenu className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = isItemActive(item.link, pathname);
                    const isLogout = item.title === "Logout";
                    const hasSubItems = item.subItems && item.subItems.length > 0;
                    const isExpanded = hasSubItems && expandedItems.includes(item.title);

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          className={`group relative w-full justify-start px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer ${isLogout
                            ? "bg-[#3730a3]/20 text-white hover:bg-[#3730a3]/30 border border-[#3730a3]/30"
                            : isActive
                              ? "bg-[#3730a3] hover:bg-[#3730a3]/80 text-white shadow-md"
                              : "bg-transparent text-white hover:bg-[#3730a3]/20 border border-transparent"
                            }`}
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="relative flex items-center w-full gap-3">
                            <item.icon
                              className={`h-5 w-5 transition-all duration-200 flex-shrink-0 ${isActive || isLogout
                                ? "text-white"
                                : "text-white/80 group-hover:text-white"
                                }`}
                            />
                            <span
                              className={`flex-1 text-sm font-medium transition-colors duration-200 ${isActive || isLogout
                                ? "text-white"
                                : "text-white/90 group-hover:text-white"
                                }`}
                            >
                              {item.title}
                            </span>
                            {hasSubItems && item.title !== "Sport" && (
                              isExpanded ? (
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ${isActive ? "text-white" : "text-white/60 group-hover:text-white"
                                    }`}
                                />
                              ) : (
                                <ChevronRight
                                  className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ${isActive ? "text-white" : "text-white/60 group-hover:text-white"
                                    }`}
                                />
                              )
                            )}
                          </div>
                        </SidebarMenuButton>
                        {hasSubItems && isExpanded && (
                          <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-[#3730a3]/30 pl-3 py-1">
                            {item.subItems.map((subItem) => {
                              const isSubActive = isItemActive(subItem.link, pathname);
                              return (
                                <SidebarMenuButton
                                  key={subItem.title}
                                  className={`group relative w-full justify-start px-3 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer ${isSubActive
                                    ? "bg-[#3730a3]/30 text-white border-l-2 border-[#3730a3]"
                                    : "text-white/70 hover:text-white hover:bg-[#3730a3]/10"
                                    }`}
                                  onClick={() => router.push(subItem.link)}
                                >
                                  <span className="relative font-normal">{subItem.title}</span>
                                </SidebarMenuButton>
                              );
                            })}
                          </div>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </div>
            ))}
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
