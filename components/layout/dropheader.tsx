"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface MenuItem {
  label: string;
  link?: string;
}

interface HeaderProps {
  leftMenu: MenuItem[];
  rightMenu: MenuItem[];
}

export default function Dropheader({ leftMenu, rightMenu }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, logout, isLoading } = useAuth();

  const handleNavigation = (link?: string, label?: string) => {
    if (link && link !== "#") {
      // Special handling for specific menu items
      if (label === "Cricket") {
        router.push("/sports/cricket");
      } else if (label === "Sports") {
        router.push("/sports");
      } else if (label === "Live") {
        router.push("/sports/all");
      } else {
        router.push(link);
      }
    }
  };

  const isActive = (link?: string, label?: string) => {
    if (!link || link === "#") return false;

    // Special handling for specific menu items
    if (label === "Cricket") {
      return (
        pathname === "/sports/cricket" ||
        pathname.startsWith("/sports/cricket/")
      );
    } else if (label === "Sports") {
      return (
        pathname === "/sports" ||
        (pathname.startsWith("/sports/") &&
          !pathname.startsWith("/sports/cricket") &&
          !pathname.startsWith("/sports/all"))
      );
    } else if (label === "Live") {
      return pathname === "/sports/all";
    } else {
      return pathname === link || pathname.startsWith(link + "/");
    }
  };

  return (
    <div className="lg:block hidden bg-gradient-to-r from-slate-800 via-slate-750 to-slate-800 border-b border-slate-700/30 shadow-sm mx-6 rounded-2xl">
      <div className="flex items-center justify-between w-full px-2 sm:px-4 lg:px-6 py-2 sm:py-2.5 gap-2">
        {/* LEFT SECTION - Main Navigation */}
        <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide whitespace-nowrap flex-1 min-w-0">
          {leftMenu.map((item, index) => {
            const active = isActive(item.link, item.label);
            return (
              <button
                key={index}
                onClick={() => handleNavigation(item.link, item.label)}
                className={cn(`group relative px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 rounded-lg flex items-center gap-1 sm:gap-1.5 touch-manipulation flex-shrink-0 cursor-pointer ${active
                  ? "text-white bg-slate-700/40"
                  : "text-slate-200 hover:text-white hover:bg-slate-700/40"
                  }`, item.label == "Cricket" && "bg-slate-700/50 hover:bg-slate-700 rounded-r-none -mr-1", item.label == "Sports" && "bg-slate-700/50 hover:bg-slate-700 rounded-l-none", (item.label == "Sports" && active) && "bg-[#00BC8A]/50", (item.label == "Cricket" && active) && "bg-[#00BC8A]/50")}
              >
                <span className="whitespace-nowrap">{item.label}</span>
                {/* <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0" /> */}
              </button>
            );
          })}
        </nav>

        {/* RIGHT SECTION - User Menu */}
        {
          isLoggedIn &&
          <nav className="hidden md:flex items-center gap-1 flex-shrink-0">
            {rightMenu.map((item, index) => {
              const active = isActive(item.link);
              return (
                <button
                  key={index}
                  onClick={() => handleNavigation(item.link)}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 rounded-lg touch-manipulation whitespace-nowrap cursor-pointer ${active
                    ? "text-white bg-slate-700/40"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/40"
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        }
      </div>
    </div >
  );
}
