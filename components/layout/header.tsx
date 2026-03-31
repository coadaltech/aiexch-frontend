"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Wallet,
  LogIn,
  Search,
  LogOut,
  User,
  Gift,
  Settings,
  Globe,
  Clock,
  ChevronDown,
  Bell,
  History,
  FileText,
} from "lucide-react";
import { Game, HomeSection } from "@/types";
import { GameCard } from "../cards/game-card";
import { AuthModal } from "../modals/auth-modal";
import TransactionModal from "../modals/transaction-modal";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWhitelabelInfo } from "@/hooks/useAuth";
import { useLedger } from "@/hooks/useUserQueries";
import { formatBalance } from "@/lib/format-balance";
import Logo from "./logo";
import { useSettings } from "@/hooks/usePublic";
import { publicApi } from "@/lib/api";
import Dropheader from "./dropheader";
import { isPanelPath } from "@/lib/panel-utils";

const leftMenu = [
  { label: "Home", link: "/home" },
  { label: "Cricket", link: "/sports/4" },
  { label: "Sports", link: "/sports" },
  { label: "Tennis", link: "/sports/tennis" },
  { label: "Soccer", link: "/sports/soccer" },
  { label: "Horse Racing", link: "/sports/horse-racing" },
  { label: "Greyhound Racing", link: "/sports/greyhound-racing" },
  { label: "Matka", link: "/matka" },
  { label: "Lotry", link: "/lotry" },
  { label: "Skil Games", link: "/skil-games" },
  { label: "Jambo", link: "/jambo" },
  { label: "Live Casino", link: "/casino" },
  // { label: "Live", link: "/live" },
  { label: "Promotions", link: "/promotions" },
];

const rightMenu = [
  { label: "Profile", link: "/profile" },
  { label: "Bet History", link: "/profile/bet-history" },
  { label: "Account Statement", link: "/profile/account-statement" },
];

export default function Header() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchActive, setIsSearchActive] = React.useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const { user, isLoggedIn, logout, isLoading } = useAuth();
  const { data: whitelabelInfo } = useWhitelabelInfo();
  const isB2C = String(whitelabelInfo?.whitelabelType ?? "").toUpperCase() === "B2C";
  const { data: ledger, isLoading: ledgerLoading } = useLedger(
    isLoggedIn && !user?.isDemo
  );

  const { data: settings } = useSettings();
  const router = useRouter();
  const pathname = usePathname();

  // Listen for custom event to open auth modal
  React.useEffect(() => {
    const handleOpenAuthModal = () => {
      setAuthModal(true);
    };

    window.addEventListener("openAuthModal", handleOpenAuthModal);
    return () => {
      window.removeEventListener("openAuthModal", handleOpenAuthModal);
    };
  }, []);

  const handleSearchClick = () => {
    setIsSearchActive(true);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close user dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isPanelPath(pathname)) return null;
  return (
    <>
      <header className="fixed w-full pb-2 top-0 z-50 shadow-lg bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50">
        {/* Top Header Bar - Modern Dark Theme */}
        <div className="">
          <div className="flex items-center justify-between h-11 sm:h-12 px-2 sm:px-4 lg:px-6">
            {/* Left: Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
              <Logo onClick={() => router.push("/")} settings={settings} />
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
              {
                isLoggedIn ? (
                  <>
                    {/* Gift Icon with Badge - Always visible */}
                    {/* <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 sm:h-9 sm:w-9 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg touch-manipulation"
                    aria-label="Gifts"
                  >
                    <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 bg-emerald-500 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold">
                      1
                    </span>
                  </Button> */}

                    {/* Add Funds Button - Hidden on very small screens, B2C only */}
                    {isB2C && (
                      <div className="md:block hidden">
                        <Button
                          onClick={() => setIsTransactionModalOpen(true)}
                          size="sm"
                          className="xs:flex h-7 sm:h-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-2 sm:px-3 md:px-4 rounded-lg shadow-md text-xs sm:text-sm"
                        >
                          <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                          <span className="hidden sm:inline">Add Funds</span>
                          <span className="sm:hidden">Add</span>
                        </Button>
                      </div>
                    )}

                    {/* Balance + Exposure Display */}
                    <Button
                      size="sm"
                      onClick={() => router.push("/profile")}
                      className="h-auto py-0.5 bg-slate-700/50 hover:bg-slate-700 text-white font-medium px-2 sm:px-3 rounded-lg text-xs sm:text-sm touch-manipulation min-w-0"
                    >
                      <Wallet className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 flex-shrink-0" />
                      {isLoading || ledgerLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <div className="flex flex-col items-start leading-tight">
                          <span className="truncate max-w-[70px] sm:max-w-none font-semibold py-1">
                            ₹{formatBalance(ledger?.finalLimit ?? "0.00").inr}
                          </span>
                          {/* <span className="text-[10px] text-amber-400 font-normal truncate max-w-[70px] sm:max-w-none">
                            Exp: ₹{formatBalance(ledger?.limitConsumed ?? "0.00").inr}
                          </span> */}
                        </div>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push("/profile")}
                      className="h-auto py-0.5 bg-slate-700/50 hover:bg-slate-700 text-white font-medium px-2 sm:px-3 rounded-lg text-xs sm:text-sm touch-manipulation min-w-0"
                    >
                      {/* <Wallet className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5 flex-shrink-0" /> */}
                      {isLoading || ledgerLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <div className="flex flex-col items-start leading-tight">
                          {/* <span className="truncate max-w-[70px] sm:max-w-none font-semibold">
                            ₹{formatBalance(ledger?.finalLimit ?? "0.00").inr}
                          </span> */}
                          <span className="truncate max-w-[70px] sm:max-w-none font-semibold py-1">
                            Exp: ₹{formatBalance(ledger?.limitConsumed ?? "0.00").inr}
                          </span>
                        </div>
                      )}
                    </Button>

                    {/* User Dropdown */}
                    <div
                      ref={userDropdownRef}
                      className="relative"
                      onMouseEnter={() => setIsUserDropdownOpen(true)}
                      onMouseLeave={() => setIsUserDropdownOpen(false)}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                        className="flex h-7 sm:h-8 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg px-2 sm:px-3 text-xs sm:text-sm touch-manipulation items-center gap-1"
                      >
                        <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="hidden sm:inline truncate max-w-[80px] lg:max-w-none">
                          {user?.username}
                          {user?.isDemo && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                              Demo
                            </span>
                          )}
                        </span>
                        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isUserDropdownOpen ? "rotate-180" : ""}`} />
                      </Button>

                      {/* Dropdown Menu */}
                      {isUserDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 w-48 sm:w-56 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl shadow-black/20 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          {/* User info header */}
                          <div className="px-3 py-2 border-b border-slate-700/50">
                            <p className="text-sm font-semibold text-white truncate">
                              {user?.username}
                            </p>
                            {user?.isDemo && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                                Demo
                              </span>
                            )}
                          </div>

                          {/* Menu Items */}
                          <div className="py-1">
                            <button
                              onClick={() => { router.push("/profile"); setIsUserDropdownOpen(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
                            >
                              <User className="h-4 w-4 flex-shrink-0" />
                              Profile
                            </button>
                            <button
                              onClick={() => { router.push("/profile/bet-history"); setIsUserDropdownOpen(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
                            >
                              <History className="h-4 w-4 flex-shrink-0" />
                              Bet History
                            </button>
                            <button
                              onClick={() => { router.push("/profile/account-statement"); setIsUserDropdownOpen(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
                            >
                              <FileText className="h-4 w-4 flex-shrink-0" />
                              Account Statement
                            </button>
                            <button
                              onClick={() => { router.push("/settings"); setIsUserDropdownOpen(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
                            >
                              <Settings className="h-4 w-4 flex-shrink-0" />
                              Settings
                            </button>
                          </div>

                          {/* Logout */}
                          <div className="border-t border-slate-700/50 pt-1">
                            <button
                              onClick={() => { logout(); setIsUserDropdownOpen(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-slate-700/50 transition-colors cursor-pointer"
                            >
                              <LogOut className="h-4 w-4 flex-shrink-0" />
                              Logout
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Gift Icon - Always visible */}
                    {/* <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-8 w-8 sm:h-9 sm:w-9 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg touch-manipulation"
                    aria-label="Gifts"
                  >
                    <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 bg-emerald-500 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold">
                      1
                    </span>
                  </Button> */}

                    {/* Registration Button - Compact on mobile */}
                    {/* <Button
                    size="sm"
                    onClick={() => {
                      setAuthModal(true);
                    }}
                    className="h-7 sm:h-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-2 sm:px-3 md:px-4 rounded-lg shadow-md text-xs sm:text-sm touch-manipulation"
                  >
                    <span className="hidden sm:inline">Registration</span>
                    <span className="sm:hidden">Reg</span>
                  </Button> */}

                    {/* Login Button - Compact on mobile */}
                    <Button
                      size="sm"
                      onClick={() => {
                        setAuthModal(true);
                      }}
                      className="h-7 sm:h-8 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold px-2 sm:px-3 md:px-4 rounded-lg shadow-md text-xs sm:text-sm touch-manipulation"
                    >
                      <LogIn className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                      <span className="hidden sm:inline">Log In</span>
                      <span className="sm:hidden">Login</span>
                    </Button>

                    {/* Settings - Hidden on very small screens */}
                    {/* <Button
                    size="sm"
                    variant="ghost"
                    className="hidden xs:flex h-7 w-7 sm:h-8 sm:w-8 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg p-0 touch-manipulation"
                    aria-label="Settings"
                  >
                    <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-0.5 hidden sm:block" />
                  </Button> */}

                    {/* Language & Time - Hidden on mobile and tablet */}
                    {/* <Button
                    size="sm"
                    variant="ghost"
                    className="hidden xl:flex h-7 sm:h-8 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg px-2 sm:px-3 gap-1.5 sm:gap-2 touch-manipulation"
                    aria-label="Language and Time"
                  >
                    <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="text-[10px] sm:text-xs font-medium">
                      EN
                    </span>
                    <span className="text-[10px] sm:text-xs">/</span>
                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="text-[10px] sm:text-xs">
                      {currentTime}
                    </span>
                    <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Button> */}
                  </>
                )}

              {/* Search Button - Mobile only */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg touch-manipulation"
                onClick={handleSearchClick}
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Menu Bar */}
        <Dropheader leftMenu={leftMenu} rightMenu={rightMenu} />
      </header>

      <SearchOverlay
        isOpen={isSearchActive}
        onClose={() => setIsSearchActive(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        type="deposit"
      />
      <AuthModal isOpen={authModal} onClose={() => setAuthModal(false)} />
    </>
  );
}

function SearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
}: {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}) {
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [games, setGames] = useState<Array<Game & { sectionTitle: string }>>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sectionsRes = await publicApi.getHomeSections();
        const activeSections: HomeSection[] = (sectionsRes.data.data || [])
          .filter((s: HomeSection) => s.status === "active")
          .sort(
            (a: HomeSection, b: HomeSection) => (a.order ?? 0) - (b.order ?? 0)
          );

        setSections(activeSections);

        const allGames = await Promise.all(
          activeSections.map(async (section) => {
            const gamesRes = await publicApi.getSectionGames(Number(section.id));
            const sectionGames: Game[] = gamesRes.data.data || [];
            return sectionGames
              .filter((g) => g.status === "active")
              .map((g) => ({ ...g, sectionTitle: section.title }));
          })
        );

        setGames(allGames.flat());
      } catch (error) {
        console.error("Failed to fetch games:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) fetchData();
  }, [isOpen]);

  const filteredGames = games.filter((game) => {
    const matchesSearch = game.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesSection =
      selectedSection === "" || game.sectionTitle === selectedSection;
    return matchesSearch && matchesSection;
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] pb-24 bg-background overflow-y-auto">
      <div className="container mx-auto px-4 py-6">
        {/* Search Input */}
        <div className="relative mb-6">
          <Input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-6 py-4 pl-14 rounded-xl text-lg h-auto"
            autoFocus
          />
          <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>

        {/* Sections */}
        <div className="mb-4">
          <div className="flex gap-2 mb-3 flex-wrap">
            <Button
              size="sm"
              onClick={() => setSelectedSection("")}
              className={
                selectedSection === ""
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }
            >
              All
            </Button>
            {sections.map((section) => (
              <Button
                key={section.id}
                size="sm"
                onClick={() => setSelectedSection(section.title)}
                className={
                  selectedSection === section.title
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }
              >
                {section.title}
              </Button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Loading games...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredGames.map((game) => (
                <GameCard
                  variant="default"
                  type="sports"
                  width={"relative"}
                  key={game.id}
                  game={game}
                />
              ))}
            </div>

            {/* No Results */}
            {filteredGames.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No games found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
