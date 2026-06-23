"use client";

import { useState } from "react";
import {
  Home,
  User,
  Receipt,
  Shield,
  Info,
  FileText,
  UserCheck,
  Briefcase,
  Headphones,
  LogOut,
  X,
  BookOpen,
  Volleyball,
  Gift,
  Dices,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import TransactionModal from "../modals/transaction-modal";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Sheet, SheetContent } from "../ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { isPanelPath } from "@/lib/panel-utils";

const navItems = [
  { id: "home", label: "Home", icon: Home, link: "/" },
  { id: "sports", label: "Sports", icon: Volleyball, link: "/sports" },
  { id: "casino", label: "Casino", icon: Dices, link: "/casino" },
  { id: "promotions", label: "Promotions", icon: Gift, link: "/promotions" },
  { id: "profile", label: "Profile", icon: User, link: "/profile" },
];

const getMoreMenuItems = (
  isLoggedIn: boolean,
): Array<{
  title: string;
  icon: any;
  link?: string;
}> => {
  const baseItems = [
    { title: "FAQs", icon: Info, link: "/faqs" },
    { title: "Game Rules", icon: BookOpen, link: "/game-rules" },
    { title: "Terms & Conditions", icon: FileText, link: "/terms" },
    { title: "Privacy Policy", icon: Shield, link: "/privacy" },
    {
      title: "Responsible Gaming",
      icon: UserCheck,
      link: "/responsible-gaming",
    },
    { title: "White Labeling", icon: Briefcase, link: "/white-labeling" },
    { title: "Live Support", icon: Headphones, link: "/live-support" },
  ];

  if (isLoggedIn) {
    return [
      { title: "Profile", icon: User, link: "/profile" },
      ...baseItems,
      { title: "Logout", icon: LogOut },
    ];
  }

  return baseItems;
};

export default function BottomNavigation() {
  const { isLoggedIn, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const router = useRouter();
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);
  const [isBetsModalOpen, setIsBetsModalOpen] = useState(false);
  const pathname = usePathname();

  const moreMenuItems = getMoreMenuItems(isLoggedIn);

  const closeMoreModal = () => {
    setIsMoreModalOpen(false);
    document.body.style.overflow = "unset";
  };

  const hiddenRoutes = ["/login", "/signup", "/forgot-password"];
  // Hide the bottom nav only inside a launched casino game (full-bleed iframe);
  // the lobby (/casino) and category views (/casino/category/...) keep it.
  const isCasinoGame = pathname?.startsWith("/casino/play/") ?? false;

  if (hiddenRoutes.some((route) => pathname?.includes(route)) || isPanelPath(pathname) || isCasinoGame)
    return null;

  const visibleNavItems = navItems.filter(
    (item) => item.id !== "profile" || isLoggedIn,
  );

  // Home is rendered as the lifted center FAB; the rest flank it left/right.
  const homeItem = visibleNavItems.find((item) => item.id === "home")!;
  const sideItems = visibleNavItems.filter((item) => item.id !== "home");
  const half = Math.ceil(sideItems.length / 2);
  const leftItems = sideItems.slice(0, half);
  const rightItems = sideItems.slice(half);

  const isItemActive = (link?: string) =>
    link === "/"
      ? pathname === "/" || pathname === "/home"
      : !!pathname &&
        !!link &&
        (pathname === link || pathname.startsWith(link + "/"));

  const go = (item: { id: string; link?: string }) => {
    setActiveTab(item.id);
    if (item.link) router.push(item.link);
  };

  const renderTab = (item: { id: string; label: string; icon: any; link?: string }) => {
    const Icon = item.icon;
    const isActive = isItemActive(item.link);
    return (
      <button
        key={item.id}
        onClick={() => go(item)}
        aria-current={isActive ? "page" : undefined}
        className={`group relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5 transition-colors duration-300 ${
          isActive
            ? "text-[var(--header-secondary)]"
            : "text-[color-mix(in_srgb,var(--header-text)_62%,transparent)] active:text-[var(--header-text)]"
        }`}
      >
        {/* active pill behind the icon */}
        <span
          className={`absolute -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--header-secondary)] transition-all duration-300 ${
            isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
          }`}
        />
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 ${
            isActive
              ? "bg-[color-mix(in_srgb,var(--header-secondary)_18%,transparent)] -translate-y-0.5"
              : "bg-transparent"
          }`}
        >
          <Icon size={20} className="stroke-[2.2]" />
        </span>
        <span className="text-[10px] font-medium leading-none tracking-wide truncate max-w-full">
          {item.label}
        </span>
      </button>
    );
  };

  const homeActive = isItemActive(homeItem.link);
  const HomeIcon = homeItem.icon;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden body-modal-open:hidden">
        {/* The bar itself */}
        <div
          className="relative flex items-stretch justify-around px-2 pt-2 border-t border-[color-mix(in_srgb,var(--header-text)_14%,transparent)] bg-gradient-to-b from-[color-mix(in_srgb,var(--header-primary)_92%,#000)] to-[var(--header-primary)] shadow-[0_-6px_24px_-8px_rgba(0,0,0,0.5)]"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          {leftItems.map(renderTab)}

          {/* Center slot — reserves space for the floating Home button + label */}
          <div className="relative flex w-16 shrink-0 flex-col items-center justify-end">
            <span
              className={`pb-1.5 text-[10px] font-medium leading-none tracking-wide transition-colors duration-300 ${
                homeActive
                  ? "text-[var(--header-secondary)]"
                  : "text-[color-mix(in_srgb,var(--header-text)_62%,transparent)]"
              }`}
            >
              {homeItem.label}
            </span>
          </div>

          {rightItems.map(renderTab)}

          {/* Floating, half-lifted Home button — shining glossy circle.
              borderRadius is set inline to beat the global unlayered
              `button { border-radius: 0.5rem }` rule (globals.css) that would
              otherwise square off the corners. */}
          <button
            onClick={() => go(homeItem)}
            aria-label={homeItem.label}
            aria-current={homeActive ? "page" : undefined}
            style={{ borderRadius: "9999px" }}
            className="absolute left-1/2 -top-6 -translate-x-1/2 flex h-14 w-14 items-center justify-center overflow-hidden bg-gradient-to-b from-[color-mix(in_srgb,var(--header-secondary)_78%,#fff)] to-[var(--header-secondary)] transition-transform duration-300 active:scale-95 animate-fab-home-glow"
          >
            {/* moving sheen sweep */}
            <span
              aria-hidden
              className="animate-fab-home-shine pointer-events-none absolute -top-1/4 left-0 h-[150%] w-7 bg-gradient-to-r from-transparent via-white/70 to-transparent"
            />
            {/* soft top gloss */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-2.5 top-1.5 h-1/3 rounded-full bg-white/35 blur-[1.5px]"
            />
            <HomeIcon
              size={26}
              className="relative stroke-[2.4] text-[var(--header-primary)]"
            />
          </button>
        </div>
      </div>

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setActiveTab("");
        }}
        type={"deposit"}
      />

      {/* Current Bets Modal */}
      <Sheet open={isBetsModalOpen} onOpenChange={setIsBetsModalOpen}>
        <SheetContent
          side="bottom"
          className="bg-background border-border [&>button]:text-white"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Current Bets
            </h3>
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active bets</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* More Menu Modal */}
      {isMoreModalOpen && (
        <div className="fixed inset-0 bg-black/40  z-50 flex items-end lg:hidden overflow-hidden">
          <Card className="w-full bg-card backdrop-blur-3xl border-border rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Menu</h2>
              <Button
                onClick={closeMoreModal}
                variant="ghost"
                size="sm"
                className="text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {moreMenuItems.map((item) => (
                <button
                  key={item.title}
                  onClick={() => {
                    if (item.title === "Logout") {
                      logout();
                      closeMoreModal();
                      return;
                    }
                    if (item.link) {
                      router.push(item.link);
                    }
                    closeMoreModal();
                  }}
                  className="flex flex-col bg-white/10 backdrop-blur-3xl items-center gap-2 p-4  rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <item.icon className="w-6 h-6 text-primary" />
                  <span className="text-sm text-foreground text-center">
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
