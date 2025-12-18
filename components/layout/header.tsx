"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Wallet, LogIn, Search, LogOut, User } from "lucide-react";
import { Game, HomeSection } from "@/types";
import { GameCard } from "../cards/game-card";
import { AuthModal } from "../modals/auth-modal";
import TransactionModal from "../modals/transaction-modal";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/hooks/useUserQueries";
import { formatBalance } from "@/lib/format-balance";
import Logo from "./logo";
import { useSettings } from "@/hooks/usePublic";
import { publicApi } from "@/lib/api";

export default function Header() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearchActive, setIsSearchActive] = React.useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const { user, isLoggedIn, logout, isLoading } = useAuth();
  const { data: balance, isLoading: balanceLoading } = useBalance(isLoggedIn);

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

  if (pathname.includes("/admin")) return null;
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="flex  flex-wrap items-center justify-between h-16 px-4 lg:px-6">
          {/* Left Section: Logo & Menu */}
          <Logo onClick={() => router.push("/")} settings={settings} />

          {/* <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
            <div
              className="relative w-full cursor-pointer"
              onClick={handleSearchClick}
            >
              <Input
                type="text"
                placeholder="Search games..."
                className="pl-10"
                readOnly
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div> */}

          {/* Right Section */}
          <div className="flex items-center gap-3 sm:gap-4 order-2 sm:order-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={handleSearchClick}
            >
              <Search size={20} />
            </Button>

            {isLoading ? (
              /* Header Skeleton */
              <div className="flex items-center gap-2 animate-pulse">
                <div className="hidden md:block w-20 h-8 bg-primary/20 rounded"></div>
                <div className="w-16 h-8 bg-primary/20 rounded"></div>
                <div className="w-8 h-8 bg-primary/20 rounded-full"></div>
                <div className="w-8 h-8 bg-primary/20 rounded"></div>
              </div>
            ) : isLoggedIn ? (
              <>
                {/* Balance (hidden on small screens) */}
                <div className="hidden md:flex items-center gap-3">
                  <Button
                    onClick={() => setIsTransactionModalOpen(true)}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Funds
                  </Button>
                </div>

                {/* User Menu */}
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => router.push("/profile")}>
                    <Wallet className="h-4 w-4" />
                    {isLoading || balanceLoading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      <span>
                        ₹{formatBalance(balance || user?.balance || "0.00").inr}
                      </span>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push("/profile")}
                    className="hidden md:flex gap-2"
                  >
                    <User className="h-4 w-4" />
                    <span className="ml-1">{user?.username}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={logout}
                    className="hidden md:block"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              /* Fixed login button background and text contrast */
              <Button
                size="sm"
                onClick={() => {
                  setAuthModal(true);
                }}
              >
                <LogIn className="h-4 w-4 mr-2" />
                <span className="sm:inline">Login</span>
              </Button>
            )}
          </div>
        </div>
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
            const gamesRes = await publicApi.getSectionGames(section.id);
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
