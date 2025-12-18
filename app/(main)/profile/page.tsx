"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Banknote,
  Bell,
  CreditCard,
  Gift,
  LogOut,
  Tag,
  User,
  History,
  Trophy,
  Shield,
  ChevronRight,
  Wallet,
  Info,
  FileText,
  UserCheck,
  Briefcase,
  Headphones,
  BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileDashboardSkeleton } from "@/components/skeletons/profile-skeletons";
import { formatBalance } from "@/lib/format-balance";
import { useBalance } from "@/hooks/useUserQueries";

const TransactionModal = lazy(
  () => import("@/components/modals/transaction-modal")
);

export default function DashboardContent() {
  const { user, isLoggedIn, logout, isLoading } = useAuth();
  const { data: balance, isLoading: balanceLoading } = useBalance(isLoggedIn);
  const [transactionModalType, setTransactionModalType] = useState<
    "deposit" | "withdraw"
  >("deposit");
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const router = useRouter();

  const formattedBalance = formatBalance(balance || user?.balance || "0.00");

  if (!isLoggedIn) {
    return <ProfileDashboardSkeleton />;
  }

  const handleOpenTransactionModal = (type: string) => {
    setTransactionModalType(type as "deposit" | "withdraw");
    setIsTransactionModalOpen(true);
  };

  return (
    <>
      <div className="min-h-screen ">
        <div className="max-w-7xl mx-auto lg:p-8">
          {/* Profile Header */}
          <Card className="p-4 lg:p-8 mb-4 lg:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 lg:w-20 lg:h-20 bg-primary rounded-xl lg:rounded-2xl flex items-center justify-center">
                    <User className="w-6 h-6 lg:w-10 lg:h-10 text-primary-foreground" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 lg:w-6 lg:h-6 bg-green-500 rounded-full border-2 border-background"></div>
                </div>
                <div>
                  <h1 className="text-lg lg:text-3xl font-bold text-foreground">
                    {user?.username}
                  </h1>
                  <p className="text-muted-foreground text-xs lg:text-base">
                    Premium Member
                  </p>
                </div>
              </div>

              {/* Balance Card */}
              <Card className="bg-primary/10 border-primary/30 p-4 lg:p-6 lg:min-w-[280px]">
                <div className="flex items-center gap-2 mb-1 lg:mb-2">
                  <Wallet className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                  <span className="text-muted-foreground text-xs lg:text-sm">
                    Available Balance
                  </span>
                </div>
                {isLoading || balanceLoading ? (
                  <div className="animate-pulse">
                    <div className="h-6 lg:h-8 bg-primary/20 rounded w-24 lg:w-32"></div>
                  </div>
                ) : (
                  <div className="text-2xl lg:text-4xl font-bold text-primary">
                    ₹{formattedBalance.inr}
                  </div>
                )}
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 lg:gap-4 mt-4 lg:mt-8">
              <Button
                onClick={() => handleOpenTransactionModal("deposit")}
                className="flex-1 h-11 lg:h-14 text-sm lg:text-lg font-semibold"
              >
                <Banknote className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                Deposit
              </Button>
              <Button
                onClick={() => handleOpenTransactionModal("withdraw")}
                variant="outline"
                className="flex-1 h-11 lg:h-14 text-sm lg:text-lg font-semibold"
              >
                <CreditCard className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                Withdraw
              </Button>
            </div>
          </Card>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4">
            <MenuCard
              icon={User}
              title="Personal Information"
              description="Manage your account details"
              onClick={() => router.push("/profile/personal-info")}
            />
            {/* <MenuCard
              icon={Shield}
              title="KYC Verification"
              description="Verify your identity"
              onClick={() => router.push("/kyc")}
            /> */}
            <MenuCard
              icon={History}
              title="Transaction History"
              description="View all transactions"
              onClick={() => router.push("/profile/transaction-history")}
            />
            <MenuCard
              icon={Trophy}
              title="Bet History"
              description="Track your gaming activity"
              onClick={() => router.push("/profile/bet-history")}
            />
            {/* <MenuCard
              icon={Gift}
              title="Bonuses & Gifts"
              description="Manage your rewards"
              onClick={() => router.push("/profile/bonus")}
            /> */}
            <MenuCard
              icon={Tag}
              title="Promo Codes"
              description="Redeem promotional offers"
              onClick={() => router.push("/profile/promocode")}
            />
            <MenuCard
              icon={Bell}
              title="Notifications"
              description="Manage your alerts"
              onClick={() => router.push("/profile/notifications")}
            />
            {/* <MenuCard
              icon={Info}
              title="FAQs"
              description="Frequently asked questions"
              onClick={() => router.push("/faqs")}
            />
            <MenuCard
              icon={BookOpen}
              title="Game Rules"
              description="Learn game rules"
              onClick={() => router.push("/game-rules")}
            />
            <MenuCard
              icon={FileText}
              title="Terms & Conditions"
              description="Read our terms"
              onClick={() => router.push("/terms")}
            />
            <MenuCard
              icon={Shield}
              title="Privacy Policy"
              description="Your privacy matters"
              onClick={() => router.push("/privacy")}
            />
            <MenuCard
              icon={UserCheck}
              title="Responsible Gaming"
              description="Play responsibly"
              onClick={() => router.push("/responsible-gaming")}
            />
            <MenuCard
              icon={Briefcase}
              title="White Labeling"
              description="Business solutions"
              onClick={() => router.push("/white-labeling")}
            />
            <MenuCard
              icon={Headphones}
              title="Live Support"
              description="Get help now"
              onClick={() => router.push("/live-support")}
            /> */}
            <MenuCard
              icon={LogOut}
              title="Sign Out"
              description="Logout from your account"
              onClick={logout}
              variant="danger"
            />
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
    <Card
      onClick={onClick}
      className={`group w-full cursor-pointer p-4 lg:p-6 transition-all duration-300 hover:scale-[1.02] ${
        isDanger ? "hover:border-destructive/40" : "hover:border-primary/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 lg:gap-4">
          <div
            className={`w-10 h-10 lg:w-12 lg:h-12 rounded-md flex items-center justify-center transition-colors ${
              isDanger
                ? "bg-destructive/10 group-hover:bg-destructive/20"
                : "bg-primary/10 group-hover:bg-primary/20"
            }`}
          >
            <Icon
              className={`w-5 h-5 lg:w-6 lg:h-6 ${
                isDanger ? "text-destructive" : "text-primary"
              }`}
            />
          </div>
          <div className="text-left">
            <h3
              className={`font-semibold text-base lg:text-lg mb-0.5 lg:mb-1 ${
                isDanger ? "text-destructive" : "text-foreground"
              }`}
            >
              {title}
            </h3>
            <p className="text-muted-foreground text-xs lg:text-sm">
              {description}
            </p>
          </div>
        </div>
        <ChevronRight
          className={`w-4 h-4 lg:w-5 lg:h-5 transition-transform group-hover:translate-x-1 ${
            isDanger ? "text-destructive" : "text-muted-foreground"
          }`}
        />
      </div>
    </Card>
  );
}
