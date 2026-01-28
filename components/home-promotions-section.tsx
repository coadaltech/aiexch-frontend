"use client";

import { NewPromotionCard } from "@/components/cards/new-promotion-card";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePublicPromotions } from "@/hooks/usePublic";
import { PromotionSkeleton } from "@/components/skeletons/promotion-skeleton";

export default function HomePromotionsSection() {
  const { data: promotions, isLoading } = usePublicPromotions();
  const featuredPromotions = (promotions || []);

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-primary">OFFERS</h2>
        </div>
        <PromotionSkeleton count={3} />
      </div>
    );
  }

  if (featuredPromotions.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 sm:mt-12 overflow-auto hide-scrollbar">
      <div className="flex items-center justify-between mb-4">
        <div className="relative group">
          <div className="absolute -inset-1  opacity-20 group-hover:opacity-30 transition duration-500"></div>
          <div className="relative flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-primary to-amber-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent animate-gradient">
              EXCLUSIVE OFFERS
            </h2>
          </div>
        </div>
        <Link
          href="/promotions"
          className="group relative bg-gradient-to-br from-slate-800 to-slate-900 text-primary hover:text-amber-400 p-2.5 rounded-full border border-primary/30 hover:border-primary/60 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/20 active:scale-95"
        >
          <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide -mr-4 pr-4 scroll-smooth pb-6">
        {featuredPromotions.map((promotion) => (
          <NewPromotionCard
            key={promotion.id}
            promotion={promotion}
            variant="compact"
          />
        ))}
      </div>
    </div>
  );
}
