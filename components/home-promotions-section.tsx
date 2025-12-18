"use client";

import { NewPromotionCard } from "@/components/cards/new-promotion-card";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePublicPromotions } from "@/hooks/usePublic";
import { PromotionSkeleton } from "@/components/skeletons/promotion-skeleton";

export default function HomePromotionsSection() {
  const { data: promotions, isLoading } = usePublicPromotions();
  const featuredPromotions = (promotions || []).slice(0, 3);

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
    <div className=" ">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-primary">OFFERS</h2>
        </div>
        <Link
          href="/promotions"
          className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground p-2 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mr-4 pr-4 scroll-smooth pb-4">
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
