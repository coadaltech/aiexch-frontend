"use client";

import { BannerCarousel } from "@/components/ui/banner-carousel";
import { usePublicBanners } from "@/hooks/usePublic";

export default function HomeBanner() {
  const { data: banners, isLoading } = usePublicBanners("home");

  if (isLoading) {
    return (
      <div className="mx-4 h-[180px] sm:h-[240px] md:h-[280px] rounded-xl bg-[#0a2a42] border border-[#1b5785]/50 animate-pulse" />
    );
  }

  return (
    <div className="mx-4 rounded-xl overflow-hidden border border-[#1b5785]/40 shadow-lg shadow-black/30">
      <BannerCarousel
        banners={banners}
        height="h-[180px] sm:h-[240px] md:h-[280px]"
        autoPlay={true}
        interval={5000}
      />
    </div>
  );
}
