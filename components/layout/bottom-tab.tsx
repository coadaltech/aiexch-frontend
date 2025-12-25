"use client";

import { useState } from "react";
import {
  Home,
  User,
  Receipt,
  MoreHorizontal,
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

const navItems = [
  { id: "home", label: "Home", icon: Home, link: "/" },
  { id: "sports", label: "Sports", icon: Volleyball, link: "/sports" },
  { id: "casino", label: "Casino", icon: Dices, link: "/casino" },
  { id: "promotions", label: "Promotions", icon: Gift, link: "/promotions" },
  { id: "profile", label: "Profile", icon: User, link: "/profile" },
];

const getMoreMenuItems = (
  isLoggedIn: boolean
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

  const openMoreModal = () => {
    setIsMoreModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeMoreModal = () => {
    setIsMoreModalOpen(false);
    document.body.style.overflow = "unset";
  };

  const hiddenRoutes = ["/login", "/signup", "/forgot-password", "/admin"];
  const isCasinoGame =
    pathname?.startsWith("/casino/") && pathname !== "/casino";

  if (hiddenRoutes.some((route) => pathname?.includes(route)) || isCasinoGame)
    return null;

  const visibleNavItems = navItems.filter(item => 
    item.id !== 'profile' || isLoggedIn
  );

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 rounded-t-2xl z-40 bg-card border-t-border border backdrop-blur-lg lg:hidden body-modal-open:hidden">
        <div className="flex items-center justify-around  px-2 py-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.link) {
                    router.push(item.link);
                  }

                  if (item.id === "deposit") {
                    if (isLoggedIn) {
                      setIsTransactionModalOpen(true);
                    } else {
                      router.push("/");
                    }
                  }

                  if (item.id === "bets") {
                    setIsBetsModalOpen(true);
                  }
                }}
                className={`
                flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 min-w-0 flex-1
                ${
                  isActive
                    ? "text-primary"
                    : "text-slate-400 hover:text-primary hover:bg-slate-700/50"
                }
              `}
              >
                <div
                  className={`
                p-1.5 rounded-lg transition-all duration-300
                ${
                  isActive
                    ? "text-primary scale-110"
                    : "text-white bg-muted group-hover:bg-muted/80"
                }
              `}
                >
                  <Icon size={18} className="stroke-2" />
                </div>
                <span
                  className={`
                text-xs font-medium mt-1 transition-all duration-300 truncate
                ${isActive ? "text-primary" : "text-white"}
              `}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
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
