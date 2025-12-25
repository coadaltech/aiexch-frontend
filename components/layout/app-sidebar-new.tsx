"use client";

import { useEffect, useState } from "react";
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

const getIconColor = (title: string) => {
  const colors: Record<string, string> = {
    Home: "text-blue-400",
    Casino: "text-amber-400",
    Sport: "text-green-400",
    Promotions: "text-purple-400",
    "Live Support": "text-yellow-400",
    Faqs: "text-cyan-400",
    "Game Rules": "text-orange-400",
    "Terms & Conditions": "text-red-400",
    "Privacy Policy": "text-indigo-400",
    "Responsible Gaming": "text-pink-400",
    Profile: "text-emerald-400",
    Transactions: "text-amber-400",
    "Bet History": "text-violet-400",
    "Account Statement": "text-teal-400",
    Logout: "text-rose-400",
  };
  return colors[title] || "text-primary";
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
            { title: "Cricket", link: "/sports/4" },
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

export function AppSidebar() {
  const { isLoggedIn } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Sport"]);
  const router = useRouter();
  const pathname = usePathname();
  console.log("path", pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show base menu during loading to prevent layout shift
  const menuGroups = getMenuGroups(mounted ? isLoggedIn : false);

  const handleItemClick = (item: MenuItem) => {
    if (item.subItems) {
      if (item.title === "Sport") return;
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
      <Sidebar className="w-64 md:hidden lg:block border-r border-primary/20">
        <SidebarContent className="p-4 pt-6 md:pt-24 lg:pt-6 bg-card">
          <div className="space-y-8 animate-pulse">
            {[1, 2, 3].map((section) => (
              <div key={section}>
                <div className="h-3 bg-primary/30 rounded w-20 mb-4 px-2"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl"
                    >
                      <div className="w-5 h-5 bg-primary/20 rounded"></div>
                      <div className="h-4 bg-primary/20 rounded flex-1"></div>
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
    <Sidebar className="w-64 md:hidden lg:block border-r border-primary/20">
      <SidebarContent className="p-4 pt-6 lg:pt-0 bg-card/50">
        <div className="space-y-8">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4 px-2">
                {group.title}
              </h3>
              <SidebarMenu className="space-y-2">
                {group.items.map((item) => {
                  const isActive = item.link && pathname == item.link;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        className={`w-full justify-start px-3 py-6 transition-all duration-200 group ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground bg-secondary"
                        }`}
                        onClick={() => handleItemClick(item)}
                      >
                        <item.icon
                          className={`h-7 w-7 mr-3 transition-transform group-hover:scale-110 ${
                            isActive
                              ? "text-primary-foreground"
                              : getIconColor(item.title)
                          }`}
                        />
                        <span className="font-medium flex-1">{item.title}</span>
                        {item.subItems && item.title !== "Sport" &&
                          (expandedItems.includes(item.title) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          ))}
                      </SidebarMenuButton>
                      {item.subItems && expandedItems.includes(item.title) && (
                        <div className="mt-2 space-y-1">
                          {item.subItems.map((subItem) => (
                            <SidebarMenuButton
                              key={subItem.title}
                              className={`w-full justify-start px-3 py-2 text-sm transition-all duration-200 ${
                                pathname === subItem.link
                                  ? "bg-primary/20 text-primary"
                                  : "text-muted-foreground"
                              }`}
                              onClick={() => router.push(subItem.link)}
                            >
                              {subItem.title}
                            </SidebarMenuButton>
                          ))}
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
