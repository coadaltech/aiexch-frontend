"use client";

import { BannerCarousel } from "@/components/ui/banner-carousel";
import { usePublicBanners } from "@/hooks/usePublic";

export default function HomeBanner() {
  const { data: banners, isLoading } = usePublicBanners("home");

  if (isLoading) {
    return (
      <div className="mx-4 h-[180px] sm:h-[240px] md:h-[280px] rounded-xl bg-gray-200 animate-pulse" />
    );
  }

  return (
    // <div className="mx-4 bg-red-600 rounded-xl overflow-hidden border border-[#1e4088]/40 shadow-lg shadow-black/30">
    <>
      <BannerCarousel
        banners={banners}
        height="h-[220px] sm:h-[240px] md:h-[320px]"
        autoPlay={true}
        interval={5000}
        />
        </>
    // </div>
  );
}
