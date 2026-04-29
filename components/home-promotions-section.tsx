"use client";

import { NewPromotionCard } from "@/components/cards/new-promotion-card";
import { ChevronRight, Gift } from "lucide-react";
import Link from "next/link";
import { usePublicPromotions } from "@/hooks/usePublic";

export default function HomePromotionsSection() {
  const { data: promotions, isLoading } = usePublicPromotions();
  const featuredPromotions = promotions || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
          <div className="w-1 h-5 bg-[var(--header-secondary)] rounded-full" />
          <Gift className="h-4 w-4 text-[var(--header-primary)]" />
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 px-4 py-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 w-52 shrink-0 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (featuredPromotions.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5 bg-[var(--header-secondary)] rounded-full" />
          <Gift className="h-4 w-4 text-[var(--header-primary)]" />
          <h2 className="text-sm font-bold text-gray-900 font-condensed tracking-wide">
            EXCLUSIVE OFFERS
          </h2>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#f06888] text-white">
            HOT
          </span>
        </div>
        <Link
          href="/promotions"
          className="flex items-center gap-1 text-[var(--header-primary)] text-xs font-medium hover:text-[var(--header-secondary)] transition-colors"
        >
          View All <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Scrollable promotions */}
      <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide scroll-smooth">
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
