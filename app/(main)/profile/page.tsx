"use client";
import { Button } from "@/components/ui/button";
import {
  Banknote,
  Bell,
  CreditCard,
  LogOut,
  Tag,
  User,
  History,
  Trophy,
  ChevronRight,
  Wallet,
  SlidersHorizontal,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWhitelabelInfo } from "@/hooks/useAuth";
import { ProfileDashboardSkeleton } from "@/components/skeletons/profile-skeletons";
import { formatBalance } from "@/lib/format-balance";
import { useLedger } from "@/hooks/useUserQueries";

const TransactionModal = lazy(
  () => import("@/components/modals/transaction-modal")
);

export default function DashboardContent() {
  const { user, isLoggedIn, logout, isLoading } = useAuth();
  const { data: whitelabelInfo } = useWhitelabelInfo();
  const isB2C = String(whitelabelInfo?.whitelabelType ?? "").toUpperCase() === "B2C";
  const { data: ledger, isLoading: ledgerLoading } = useLedger(
    isLoggedIn && !user?.isDemo
  );
  const [transactionModalType, setTransactionModalType] = useState<
    "deposit" | "withdraw"
  >("deposit");
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const router = useRouter();

  // finalLimit from ledger = available credit (userLimit - limitConsumed)
  const displayBalance = ledger?.finalLimit ?? "0.00";
  const formattedBalance = formatBalance(displayBalance);
  const formattedExposure = formatBalance(ledger?.limitConsumed ?? "0.00");

  if (!isLoggedIn) {
    return <ProfileDashboardSkeleton />;
  }

  const handleOpenTransactionModal = (type: string) => {
    setTransactionModalType(type as "deposit" | "withdraw");
    setIsTransactionModalOpen(true);
  };

  const menuItems = [
    {
      icon: User,
      title: "Personal Information",
      description: "Manage your account details",
      href: "/profile/personal-info",
    },
    {
      icon: History,
      title: "Transaction History",
      description: "View all transactions",
      href: "/profile/transaction-history",
    },
    {
      icon: Trophy,
      title: "Bet History",
      description: "Track your gaming activity",
      href: "/profile/bet-history",
    },
    {
      icon: Tag,
      title: "Promo Codes",
      description: "Redeem promotional offers",
      href: "/profile/promocode",
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Manage your alerts",
      href: "/profile/notifications",
    },
    {
      icon: SlidersHorizontal,
      title: "Stake Settings",
      description: "Customise your quick-stake buttons",
      href: "/profile/stake-settings",
    },
    {
      icon: History,
      title: "Last Logins",
      description: "View your recent sign-in activity",
      href: "/profile/last-logins",
    },
  ];

  return (
    <>
      <div className="w-full px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* ── Header card ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            {/* User */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--header-primary)]/10 text-[var(--header-text)] sm:h-20 sm:w-20">
                  <User className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">
                  {user?.username}
                </h1>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600 sm:text-xs">
                  <Trophy className="h-3 w-3" />
                  {user?.isDemo ? "Demo Account" : "Premium Member"}
                </span>
              </div>
            </div>

            {/* Balance */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:min-w-[240px]">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Wallet className="h-4 w-4" />
                Available Balance
              </div>
              {isLoading || ledgerLoading ? (
                <div className="mt-2 animate-pulse space-y-2">
                  <div className="h-7 w-28 rounded bg-gray-200" />
                  <div className="h-3 w-20 rounded bg-gray-200" />
                </div>
              ) : (
                <>
                  <div className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    ₹{formattedBalance.inr}
                  </div>
                  {ledger && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      Exposure:
                      <span className="font-semibold text-rose-500">
                        ₹{formattedExposure.inr}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {isB2C && (
            <div className="mt-5 flex gap-3">
              <Button
                onClick={() => handleOpenTransactionModal("deposit")}
                className="h-11 flex-1 bg-[var(--header-primary)] font-semibold text-white hover:bg-[var(--header-primary)]/90 sm:h-12 sm:text-base"
              >
                <Banknote className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Deposit
              </Button>
              <Button
                onClick={() => handleOpenTransactionModal("withdraw")}
                variant="outline"
                className="h-11 flex-1 border-gray-300 font-semibold text-gray-800 bg-white hover:bg-gray-100 hover:cursor-pointer sm:h-12 sm:text-base"
              >
                <CreditCard className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Withdraw
              </Button>
            </div>
          )}
        </div>

        {/* ── Account menu ── */}
        <div>
          <h2 className="mb-2.5 px-1 text-xs font-bold uppercase tracking-wider text-gray-500 sm:mb-3 sm:text-sm">
            Account
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {menuItems.map((item) => (
              <MenuCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => router.push(item.href)}
              />
            ))}
            {/* <MenuCard
              icon={LogOut}
              title="Sign Out"
              description="Logout from your account"
              onClick={logout}
              variant="danger"
            /> */}
          </div>
        </div>
      </div>

      {isTransactionModalOpen && (
        <Suspense fallback={<div />}>
          <TransactionModal
            isOpen={isTransactionModalOpen}
            onClose={() => setIsTransactionModalOpen(false)}
            type={transactionModalType}
          />
        </Suspense>
      )}
    </>
  );
}

function MenuCard({
  icon: Icon,
  title,
  description,
  onClick,
  variant = "default",
}: {
  icon: any;
  title: string;
  description: string;
  onClick?: () => void;
  variant?: "default" | "danger";
}) {
  const isDanger = variant === "danger";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl border bg-white p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:gap-4 sm:p-4 ${
        isDanger
          ? "border-gray-200 hover:border-destructive/50"
          : "border-gray-200 hover:border-[var(--header-primary)]/50"
      }`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors sm:h-12 sm:w-12 ${
          isDanger
            ? "bg-destructive/10 text-destructive"
            : "bg-[var(--header-primary)]/10 text-[var(--header-text)]"
        }`}
      >
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h3
          className={`truncate text-sm font-semibold transition-colors sm:text-base ${
            isDanger
              ? "text-destructive"
              : "text-gray-900 "
          }`}
        >
          {title}
        </h3>
        <p className="truncate text-xs text-gray-500 sm:text-sm">
          {description}
        </p>
      </div>
      <ChevronRight
        className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5 ${
          isDanger
            ? "text-destructive"
            : "text-gray-400"
        }`}
      />
    </button>
  );
}
