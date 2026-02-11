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
  Wallet,
  LogOut,
  Info,
  Home,
  Club,
  Shield,
  FileText,
  UserCheck,
  BookOpen,
  Receipt,
  ChevronDown,
  ChevronRight,
  Dice6,
} from "lucide-react";
import { MenuGroup, MenuItem } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Series } from "@/components/sports/types";
import { sportsList } from "@/data";
import axios from "axios";
import { UseSportsSeries } from "@/hooks/UseSportsSeries";
import { formatToIST } from "@/lib/date-utils";

const getIconColor = (title: string) => {
  const colors: Record<string, string> = {
    Home: "text-white",
    Casino: "text-white",
    Sport: "text-white",
    Promotions: "text-white",
    "Live Support": "text-white",
    Faqs: "text-white",
    "Game Rules": "text-white",
    "Terms & Conditions": "text-white",
    "Privacy Policy": "text-white",
    "Responsible Gaming": "text-white",
    Profile: "text-white",
    Transactions: "text-white",
    "Bet History": "text-white",
    "Account Statement": "text-white",
    Logout: "text-white",
  };
  return colors[title] || "text-white";
};

const getMenuGroups = (isLoggedIn: boolean, games: any[]): MenuGroup[] => {
  const baseGroups = [
    {
      title: "",
      items: [
        { title: "Home", icon: Home, link: "/" },
        { title: "Casino", icon: Dice6, link: "/casino" },
        {
          title: "Sport",
          icon: Trophy,
          link: "/sports",
          subItems: games,
        },
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
        {
          title: "Responsible Gaming",
          icon: UserCheck,
          link: "/responsible-gaming",
        },
      ],
    },
  ];

  if (isLoggedIn) {
    return [
      ...baseGroups.slice(0, 1),
      {
        title: "Account",
        items: [
          { title: "Profile", icon: User, link: "/profile" },
          { title: "Bet History", icon: Club, link: "/profile/bet-history" },
          {
            title: "Account Statement",
            icon: Receipt,
            link: "/profile/account-statement",
          },
        ],
      },
      ...baseGroups.slice(1),
      {
        title: "Account Actions",
        items: [{ title: "Logout", icon: LogOut }],
      },
    ];
  }

  return baseGroups;
};

export function AppSidebar() {
  const { isLoggedIn, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Sport"]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [games, setGames] = useState<any[]>([]); // ✅ MOVED HERE

  const router = useRouter();
  const pathname = usePathname();

  // Fetch sports list from API - ✅ MOVED HERE
  useEffect(() => {
    const fetchSportsList = async () => {
      try {
        setLoadingGames(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/sports/sports-list`,
        );

        console.log("API Response:", response);

        const data = await response.data.data;

        // Map of special eventTypes to their exact link paths
        const sportLinkMapping: Record<string, string> = {
          "4": "/sports/cricket",
          "-4": "/sports/-4",
          "-17": "/sports/-17",
          "4339": "/sports/greyhound-racing",
          "7": "/sports/horse-racing",
          "1": "/sports/soccer",
          "2": "/sports/tennis",
        };

        const transformedData = data.map((sport: any) => {
          const eventType = String(sport.id || sport.eventType || "");
          const sportName =
            sport.name || sport.title || sport.displayName || "Unknown Sport";

          const link = sportLinkMapping[eventType] || `/sports/${eventType}`;

          return {
            title: sportName,
            link: link,
          };
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

  // Check routes
  const isCricketRoute =
    pathname === "/sports/cricket" ||
    pathname.startsWith("/sports/cricket/") ||
    pathname.startsWith("/sports/4/");

  const isTennisRoute =
    pathname === "/sports/tennis" ||
    pathname.startsWith("/sports/tennis/") ||
    pathname.startsWith("/sports/2/");

  const isSoccerRoute =
    pathname === "/sports/soccer" ||
    pathname.startsWith("/sports/soccer/") ||
    pathname.startsWith("/sports/1/");

  const isHorseRacingRoute =
    pathname === "/sports/horse-racing" ||
    pathname.startsWith("/sports/horse-racing/") ||
    pathname.startsWith("/sports/7/");

  const isGreyhoundRacingRoute =
    pathname === "/sports/greyhound-racing" ||
    pathname.startsWith("/sports/greyhound-racing/") ||
    pathname.startsWith("/sports/4339/");

  const pathSegments = pathname.split("/").filter(Boolean);
  const isSportsOrLiveRoute =
    pathname === "/sports" ||
    pathname === "/sports/all" ||
    pathname === "/live" ||
    (pathname.startsWith("/sports/") &&
      !pathname.startsWith("/sports/cricket") &&
      !pathname.startsWith("/sports/tennis") &&
      !pathname.startsWith("/sports/soccer") &&
      !pathname.startsWith("/sports/horse-racing") &&
      !pathname.startsWith("/sports/greyhound-racing") &&
      pathSegments.length === 2 &&
      pathSegments[0] === "sports");

  // Fetch cricket series data
  const { seriesData: cricketSeries, loading: loadingCricket } =
    UseSportsSeries(isCricketRoute ? "4" : null); // Pass null if not needed

  console.log("datt", cricketSeries);

  const { seriesData: tennisSeries, loading: loadingTennis } = UseSportsSeries(
    isTennisRoute ? "2" : null,
  ); // Pass null if not needed

  const { seriesData: soccerSeries, loading: loadingSoccer } = UseSportsSeries(
    isSoccerRoute ? "1" : null,
  );

  const { seriesData: horseRacingSeries, loading: loadingHorseRacing } =
    UseSportsSeries(isHorseRacingRoute ? "7" : null);

  const { seriesData: greyhoundSeries, loading: loadingGreyhound } =
    UseSportsSeries(isGreyhoundRacingRoute ? "4339" : null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get menu groups with games data
  const menuGroups = getMenuGroups(mounted ? isLoggedIn : false, games);

  const handleItemClick = (item: MenuItem) => {
    if (item.title === "Logout") {
      logout();
      return;
    }

    if (item.subItems) {
      if (item.title === "Sport") router.push("/sports");
      setExpandedItems((prev) =>
        prev.includes(item.title)
          ? prev.filter((title) => title !== item.title)
          : [...prev, item.title],
      );
    } else if (item.link) {
      router.push(item.link);
    }
  };

  if (pathname.includes("/admin")) return null;

  // Show loading skeleton
  if (
    !mounted ||
    loadingCricket ||
    loadingTennis ||
    loadingSoccer ||
    loadingHorseRacing ||
    loadingGreyhound
  ) {
    return (
      <Sidebar className="w-64 h-full border-r border-blue-700/30 bg-[#1a2b47]">
        <SidebarContent className="p-4 pt-4 h-full overflow-y-auto overflow-x-hidden sidebar-scrollbar">
          <div className="space-y-8 animate-pulse">
            {[1, 2, 3].map((section) => (
              <div key={section}>
                <div className="h-3 bg-blue-400/30 rounded w-20 mb-4 px-2"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg bg-blue-600/20"
                    >
                      <div className="w-5 h-5 bg-blue-400/20 rounded"></div>
                      <div className="h-4 bg-blue-400/20 rounded flex-1"></div>
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

  // Show sport types when on /sports or /live route
  if (isSportsOrLiveRoute) {
    const isAllActive = pathname === "/sports" || pathname === "/sports/all";
    const headerTitle =
      pathname === "/live" || pathname === "/sports/all"
        ? "Live Sports"
        : "Sports";

    return (
      <Sidebar className="w-64 h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] rounded-2xl md:h-[calc(100vh-7rem)] border-r border-blue-700/30 bg-[#1a2b47] relative overflow-hidden">
        <SidebarContent className="p-3 pt-4 h-full overflow-y-auto overflow-x-hidden sidebar-scrollbar bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 pb-6">
          <div className="mb-3 px-2">
            <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              {headerTitle}
            </h3>
          </div>
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem key="all">
              <SidebarMenuButton
                className={`group relative w-full h-full justify-start px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  isAllActive
                    ? "bg-[#3730a3] hover:bg-[#3730a3]/80 text-white shadow-md"
                    : "bg-transparent text-white hover:bg-[#3730a3]/20 border border-transparent"
                }`}
                onClick={() => router.push("/sports")}
              >
                <div className="relative flex items-center w-full gap-3">
                  <Trophy
                    className={`h-5 w-5 transition-all duration-200 flex-shrink-0 ${
                      isAllActive
                        ? "text-white"
                        : "text-white/80 group-hover:text-white"
                    }`}
                  />
                  <span
                    className={`flex-1 text-sm font-medium transition-colors duration-200 ${
                      isAllActive
                        ? "text-white"
                        : "text-white/90 group-hover:text-white"
                    }`}
                  >
                    All
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {games.map((sport) => {
              const isActive =
                pathname === sport.link ||
                (pathname.startsWith("/sports/") &&
                  pathname.split("/")[2] === sport.link.split("/")[2]);

              return (
                <SidebarMenuItem key={sport.title}>
                  <SidebarMenuButton
                    className={`group relative w-full h-full justify-start px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-[#3730a3] hover:bg-[#3730a3]/80 text-white shadow-md"
                        : "bg-transparent text-white hover:bg-[#3730a3]/20 border border-transparent"
                    }`}
                    onClick={() => router.push(sport.link)}
                  >
                    <div className="relative flex items-center w-full gap-3">
                      <Trophy
                        className={`h-5 w-5 transition-all duration-200 flex-shrink-0 ${
                          isActive
                            ? "text-white"
                            : "text-white/80 group-hover:text-white"
                        }`}
                      />
                      <span
                        className={`flex-1 text-sm font-medium transition-colors duration-200 ${
                          isActive
                            ? "text-white"
                            : "text-white/90 group-hover:text-white"
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
        </SidebarContent>
      </Sidebar>
    );
  }

  const getMatchIdFromPath = (basePath: string, eventTypeId: string) => {
    const segments = pathname.split("/").filter(Boolean);
    const isMatchByName =
      segments.length === 4 &&
      segments[0] === "sports" &&
      segments[1] === basePath;
    const isMatchById =
      segments.length === 4 &&
      segments[0] === "sports" &&
      segments[1] === eventTypeId;

    if (isMatchByName || isMatchById) return segments[3];
    return null;
  };

  const renderSeriesSidebar = (
    title: string,
    seriesList: Series[],
    basePath: string,
    eventTypeId: string,
    emptyText: string,
  ) => {
    const matchIdFromPath = getMatchIdFromPath(basePath, eventTypeId);

    return (
      <Sidebar className="w-64 h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] rounded-2xl md:h-[calc(100vh-7rem)] border-r border-blue-700/30 bg-[#1a2b47] relative overflow-hidden">
        <SidebarContent className="p-3 pt-4 h-full overflow-y-auto overflow-x-hidden sidebar-scrollbar bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 pb-6">
          <div className="mb-3 px-2">
            <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              {title}
            </h3>
          </div>
          <SidebarMenu className="space-y-1">
            {seriesList.length === 0 ? (
              <div className="px-3 py-2 text-sm text-white/60">{emptyText}</div>
            ) : (
              seriesList.map((series) => {
                const isActive =
                  pathname === `/sports/${basePath}/${series.id}` ||
                  pathname === `/sports/${eventTypeId}/${series.id}` ||
                  (matchIdFromPath &&
                    series.matches?.some(
                      (match) => match.id === matchIdFromPath,
                    ));

                return (
                  <SidebarMenuItem key={series.id}>
                    <SidebarMenuButton
                      className={`group relative w-full h-full justify-start px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-[#3730a3] hover:bg-[#3730a3]/80 text-white shadow-md"
                          : "bg-transparent text-white hover:bg-[#3730a3]/20 border border-transparent"
                      }`}
                      onClick={() =>
                        router.push(`/sports/${basePath}/${series.id}`)
                      }
                    >
                      <div className="relative flex items-center w-full gap-3">
                        <Trophy
                          className={`h-5 w-5 transition-all duration-200 flex-shrink-0 ${
                            isActive
                              ? "text-white"
                              : "text-white/80 group-hover:text-white"
                          }`}
                        />
                        <span
                          className={`flex-1 text-sm font-medium transition-colors duration-200 ${
                            isActive
                              ? "text-white"
                              : "text-white/90 group-hover:text-white"
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
        </SidebarContent>
      </Sidebar>
    );
  };

  if (isTennisRoute) {
    return renderSeriesSidebar(
      "Tennis Tournaments",
      tennisSeries,
      "tennis",
      "2",
      "No tournaments available",
    );
  }

  if (isCricketRoute) {
    return renderSeriesSidebar(
      "Cricket Series",
      cricketSeries,
      "cricket",
      "4",
      "No cricket series available",
    );
  }

  if (isSoccerRoute) {
    return renderSeriesSidebar(
      "Soccer Leagues",
      soccerSeries,
      "soccer",
      "1",
      "No soccer leagues available",
    );
  }

  if (isHorseRacingRoute) {
    return renderSeriesSidebar(
      "Horse Racing",
      horseRacingSeries,
      "horse-racing",
      "7",
      "No horse racing events available",
    );
  }

  if (isGreyhoundRacingRoute) {
    return renderSeriesSidebar(
      "Greyhound Racing",
      greyhoundSeries,
      "greyhound-racing",
      "4339",
      "No greyhound racing events available",
    );
  }
  // Default sidebar
  return (
    <Sidebar className="w-64 h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] rounded-2xl md:h-[calc(100vh-7rem)] border-r border-blue-700/30 bg-[#1a2b47] relative overflow-hidden">
      <SidebarContent className="p-3 pt-4 h-full overflow-y-auto overflow-x-hidden sidebar-scrollbar bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 pb-6">
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
                  const isActive =
                    item.link &&
                    (pathname === item.link ||
                      pathname.startsWith(item.link + "/"));
                  const isLogout = item.title === "Logout";
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isExpanded =
                    hasSubItems && expandedItems.includes(item.title);

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        className={`group relative w-full justify-start px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                          isLogout
                            ? "bg-[#3730a3]/20 text-white hover:bg-[#3730a3]/30 border border-[#3730a3]/30"
                            : isActive
                              ? "bg-[#3730a3] hover:bg-[#3730a3]/80 text-white shadow-md"
                              : "bg-transparent text-white hover:bg-[#3730a3]/20 border border-transparent"
                        }`}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="relative flex items-center w-full gap-3">
                          <item.icon
                            className={`h-5 w-5 transition-all duration-200 flex-shrink-0 ${
                              isActive || isLogout
                                ? "text-white"
                                : "text-white/80 group-hover:text-white"
                            }`}
                          />
                          <span
                            className={`flex-1 text-sm font-medium transition-colors duration-200 ${
                              isActive || isLogout
                                ? "text-white"
                                : "text-white/90 group-hover:text-white"
                            }`}
                          >
                            {item.title}
                          </span>
                          {hasSubItems &&
                            item.title !== "Sport" &&
                            (isExpanded ? (
                              <ChevronDown
                                className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ${
                                  isActive
                                    ? "text-white"
                                    : "text-white/60 group-hover:text-white"
                                }`}
                              />
                            ) : (
                              <ChevronRight
                                className={`h-4 w-4 transition-transform duration-200 flex-shrink-0 ${
                                  isActive
                                    ? "text-white"
                                    : "text-white/60 group-hover:text-white"
                                }`}
                              />
                            ))}
                        </div>
                      </SidebarMenuButton>
                      {hasSubItems && isExpanded && (
                        <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-[#3730a3]/30 pl-3 py-1">
                          {item.subItems.map((subItem) => {
                            const isSubActive =
                              pathname === subItem.link ||
                              pathname.startsWith(subItem.link + "/");
                            return (
                              <SidebarMenuButton
                                key={subItem.title}
                                className={`group relative w-full justify-start px-3 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer ${
                                  isSubActive
                                    ? "bg-[#3730a3]/30 text-white border-l-2 border-[#3730a3]"
                                    : "text-white/70 hover:text-white hover:bg-[#3730a3]/10"
                                }`}
                                onClick={() => router.push(subItem.link)}
                              >
                                <span className="relative font-normal">
                                  {subItem.title}
                                </span>
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
      </SidebarContent>
    </Sidebar>
  );
}
