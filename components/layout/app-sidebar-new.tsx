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
import { useSportsSeries } from "@/contexts/SportsContext";
import { Series } from "@/components/sports/types";
import { sportsList } from "@/data";
import axios from "axios";
import { UseSportsSeries } from "@/hooks/UseSportsSeries";

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

const getMenuGroups = (isLoggedIn: boolean): MenuGroup[] => {
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
          subItems: [
            { title: "Cricket", link: "/sports/cricket" },
            { title: "Kabaddi", link: "/sports/-4" },
            { title: "Virtual T10", link: "/sports/-17" },
            { title: "Greyhound Racing", link: "/sports/4339" },
            { title: "Horse Racing", link: "/sports/7" },
            { title: "Football", link: "/sports/1" },
            { title: "Tennis", link: "/sports/2" },
          ],
        },
        // { title: "Live Casino", icon: Leaf, link: "/live-casino" },
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

interface ApiResponse {
  success: boolean;
  eventTypeId: string;
  data: Series[];
}

export function AppSidebar() {
  const { isLoggedIn, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Sport"]);
  const router = useRouter();
  const pathname = usePathname();
  console.log("path", pathname);

  // Check if we're on the cricket route (including match detail pages)
  const isCricketRoute =
    pathname === "/sports/cricket" ||
    pathname.startsWith("/sports/cricket/") ||
    pathname.startsWith("/sports/4/");

  // Check if we're on sports or live route (show sport types)
  // Exclude cricket route, all route, and match detail pages
  const pathSegments = pathname.split("/").filter(Boolean);
  const isSportsOrLiveRoute =
    pathname === "/sports" ||
    pathname === "/sports/all" ||
    pathname === "/live" ||
    (pathname.startsWith("/sports/") &&
      !pathname.startsWith("/sports/cricket") &&
      pathSegments.length === 2 &&
      pathSegments[0] === "sports"); // /sports/[eventType] only, not deeper routes

  // Fetch series data for cricket

  // const [cricketSeries, setCricketSeries] = useState<Series[]>([]);
  // const [loadingCricket, setLoadingCricket] = useState(false);

 

   const {
     seriesData: cricketSeries,
     loading: loadingCricket,
     error: cricketError,
     refetch: refetchCricket,
   } = UseSportsSeries("4");

  //  const fetchCricketSeries = async () => {
  //    try {
  //      setLoadingCricket(true);
  //      const response = await axios.get<ApiResponse>(
  //        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/sports/series/4`,
  //      );

  //      if (response.data.success && response.data.data) {
  //        setCricketSeries(response.data.data);
  //      } else {
  //        setCricketSeries([]);
  //      }
  //    } catch (error) {
  //      console.error("Error fetching cricket series:", error);
  //      setCricketSeries([]);
  //    } finally {
  //      setLoadingCricket(false);
  //    }
  //  };


  // Filter live and upcoming series
  const filteredSeries = useMemo(() => {
    if (!isCricketRoute || !cricketSeries.length) return [];


    return cricketSeries.filter((series) => {
      if (!series.matches || series.matches.length === 0) return false;

      // Check if series has live matches
   const hasLiveMatches = series.matches.some((match) =>
     match.odds?.some((odd) => odd?.inPlay === true),
   );
      // Check if series has upcoming matches (not live but has future date)
      const hasUpcomingMatches = series.matches.some((match) => {
        // Check if ANY odds entry shows the match is live
        const isLive = match.odds?.some((odd) => odd?.inPlay === true);
        if (isLive) return false;

        if (!match.event?.openDate) return false;
        const matchDate = new Date(match.event.openDate);
        const now = new Date();
        return matchDate > now;
      });

      return hasLiveMatches || hasUpcomingMatches;
    });
  }, [cricketSeries, isCricketRoute]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show base menu during loading to prevent layout shift
  const menuGroups = getMenuGroups(mounted ? isLoggedIn : false);

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
          : [...prev, item.title]
      );
    } else if (item.link) {
      router.push(item.link);
    }
  };

  if (pathname.includes("/admin")) return null;

  // Show loading skeleton during auth check
  if (!mounted) {
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
            {sportsList.map((sport) => {
              const isActive =
                pathname === `/sports/${sport.eventType}` ||
                (pathname.startsWith("/sports/") &&
                  pathname.split("/")[2] === sport.eventType);

              // Special handling for Cricket - navigate to /sports/cricket
              const sportLink =
                sport.eventType === "4"
                  ? "/sports/cricket"
                  : `/sports/${sport.eventType}`;

              return (
                <SidebarMenuItem key={sport.eventType}>
                  <SidebarMenuButton
                    className={`group relative w-full h-full justify-start px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-[#3730a3] hover:bg-[#3730a3]/80 text-white shadow-md"
                        : "bg-transparent text-white hover:bg-[#3730a3]/20 border border-transparent"
                    }`}
                    onClick={() => router.push(sportLink)}
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
                        {sport.name}
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

  // Show series list when on cricket route
  if (isCricketRoute) {
    return (
      <Sidebar className="w-64 h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] rounded-2xl md:h-[calc(100vh-7rem)] border-r border-blue-700/30 bg-[#1a2b47] relative overflow-hidden">
        <SidebarContent className="p-3 pt-4 h-full overflow-y-auto overflow-x-hidden sidebar-scrollbar bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 pb-6">
          <div className="mb-3 px-2">
            <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Cricket Series
            </h3>
          </div>
          <SidebarMenu className="space-y-1">
            {filteredSeries.length === 0 ? (
              <div className="px-3 py-2 text-sm text-white/60">
                No live or upcoming series available
              </div>
            ) : (
              filteredSeries.map((series) => {
                // Check if this series is active
                // 1. On series page: /sports/cricket/[seriesId]
                // 2. On match detail page: /sports/4/[marketId]/[matchId] - check if matchId matches
                const pathSegments = pathname.split("/").filter(Boolean);
                const isOnMatchDetailPage =
                  pathSegments.length === 4 &&
                  pathSegments[0] === "sports" &&
                  pathSegments[1] === "4";
                const matchIdFromPath = isOnMatchDetailPage
                  ? pathSegments[3]
                  : null;

                const isActive =
                  pathname === `/sports/cricket/${series.id}` ||
                  (matchIdFromPath &&
                    series.matches?.some(
                      (match) => match.event?.id === matchIdFromPath
                    ));
              const hasLiveMatches = series.matches?.some((match) =>
                match.odds?.some((odd) => odd?.odds?.inplay === true),
              );

                return (
                  <SidebarMenuItem key={series.id}>
                    <SidebarMenuButton
                      className={`group relative w-full h-full justify-start px-3 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-[#3730a3] hover:bg-[#3730a3]/80 text-white shadow-md"
                          : "bg-transparent text-white hover:bg-[#3730a3]/20 border border-transparent"
                      }`}
                      onClick={() =>
                        router.push(`/sports/cricket/${series.id}`)
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
                        {hasLiveMatches && (
                          <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            LIVE
                          </span>
                        )}
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
  }

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
