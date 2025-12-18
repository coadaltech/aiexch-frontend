"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Gift, Clock, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bonus } from "@/types";

const mockBonuses: Bonus[] = [
  {
    id: "1",
    title: "Welcome Bonus",
    description: "Get 100% match on your first deposit up to ₹5000",
    type: "welcome",
    amount: 5000,
    currency: "INR",
    status: "available",
    expiryDate: "2024-02-15",
    requirements: "Minimum deposit ₹200",
  },
  {
    id: "2",
    title: "Daily Free Spins",
    description: "Claim your daily free spins on selected slots",
    type: "free_spins",
    spins: 50,
    status: "claimed",
    expiryDate: "2024-01-16",
  },
  {
    id: "3",
    title: "Cashback Bonus",
    description: "Get 10% cashback on your losses this week",
    type: "cashback",
    amount: 255,
    currency: "INR",
    status: "available",
    progress: 75,
    maxProgress: 100,
    requirements: "Play ₹2500 to unlock",
  },
  {
    id: "4",
    title: "VIP Loyalty Reward",
    description: "Exclusive bonus for reaching VIP Level 2",
    type: "loyalty",
    amount: 1000,
    currency: "INR",
    status: "locked",
    requirements: "Reach VIP Level 2",
  },
  {
    id: "5",
    title: "Weekend Deposit Bonus",
    description: "50% bonus on weekend deposits",
    type: "deposit",
    amount: 2000,
    currency: "INR",
    status: "expired",
    expiryDate: "2024-01-14",
  },
];

export default function BonusesGifts() {
  const [filter, setFilter] = useState<
    "all" | "available" | "claimed" | "expired"
  >("all");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const filteredBonuses = mockBonuses
    .filter((bonus) => {
      if (filter === "all") return true;
      return bonus.status === filter;
    })
    .sort((a, b) => parseInt(b.id) - parseInt(a.id));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "claimed":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "expired":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case "locked":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available":
        return <Gift className="w-4 h-4" />;
      case "claimed":
        return <CheckCircle className="w-4 h-4" />;
      case "expired":
        return <XCircle className="w-4 h-4" />;
      case "locked":
        return <Clock className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getBonusTypeIcon = (type: string) => {
    switch (type) {
      case "welcome":
        return "🎉";
      case "deposit":
        return "💰";
      case "cashback":
        return "💸";
      case "free_spins":
        return "🎰";
      case "loyalty":
        return "👑";
      default:
        return "🎁";
    }
  };

  return (
    <div className="max-w-md mx-auto lg:max-w-6xl">
      <div className="md:pb-8">
        {/* Header */}
        <div className="flex items-center gap-4  lg:p-0 lg:mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            size="sm"
            className="text-foreground hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            My Bonuses & Gifts
          </h1>
        </div>

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 lg:p-0 lg:mb-6">
          <Card className="bg-casino-dark border-casino-primary/30 p-4 text-center">
            <div className="text-2xl font-bold text-casino-primary">3</div>
            <div className="text-sm text-casino-secondary-text">Available</div>
          </Card>
          <Card className="bg-casino-dark border-casino-primary/30 p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">1</div>
            <div className="text-sm text-casino-secondary-text">Claimed</div>
          </Card>
          <Card className="bg-casino-dark border-casino-primary/30 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">1</div>
            <div className="text-sm text-casino-secondary-text">Locked</div>
          </Card>
          <Card className="bg-casino-dark border-casino-primary/30 p-4 text-center">
            <div className="text-2xl font-bold text-casino-primary-text">
              $625
            </div>
            <div className="text-sm text-casino-secondary-text">Total Value</div>
          </Card>
        </div> */}

        {/* Filters */}
        <div className=" mt-4 lg:p-0 lg:mb-6">
          <div className="flex gap-2 overflow-x-auto">
            <Button
              onClick={() => setFilter("all")}
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              // variant={filter === "all" ? "default" : "outline"}
            >
              All
            </Button>
            <Button
              onClick={() => setFilter("available")}
              size="sm"
              variant={filter === "available" ? "default" : "outline"}
            >
              Available
            </Button>
            <Button
              onClick={() => setFilter("claimed")}
              size="sm"
              variant={filter === "claimed" ? "default" : "outline"}
            >
              Claimed
            </Button>
            <Button
              onClick={() => setFilter("expired")}
              size="sm"
              variant={filter === "expired" ? "default" : "outline"}
            >
              Expired
            </Button>
          </div>
        </div>

        {/* Bonuses List */}
        <div className="space-y-4 mt-4 lg:p-0">
          {filteredBonuses.map((bonus) => (
            <Card
              key={bonus.id}
              className="p-4 lg:p-6 hover:bg-muted/50 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Left Section */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-2xl shrink-0">
                    {getBonusTypeIcon(bonus.type)}
                  </div>
                  <div className="flex-1">
                    {/* Title + Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="text-foreground font-semibold text-base sm:text-lg">
                        {bonus.title}
                      </h3>
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          bonus.status
                        )}`}
                      >
                        {getStatusIcon(bonus.status)}
                        <span className="capitalize">{bonus.status}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm mb-3">
                      {bonus.description}
                    </p>

                    {/* Progress Bar */}
                    {bonus.progress !== undefined && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>
                            {bonus.progress}% / {bonus.maxProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${bonus.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Extra Info */}
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {bonus.requirements && (
                        <span className="bg-muted px-2 py-1 rounded">
                          {bonus.requirements}
                        </span>
                      )}
                      {bonus.expiryDate && (
                        <span className="bg-muted px-2 py-1 rounded">
                          Expires: {bonus.expiryDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2">
                  <div className="text-primary font-bold text-lg">
                    {bonus.amount && `₹${bonus.amount}`}
                    {bonus.spins && `${bonus.spins} Spins`}
                  </div>
                  {bonus.status === "available" && (
                    <Button size="sm">Claim</Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
