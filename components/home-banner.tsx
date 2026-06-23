"use client";

import { BannerCarousel } from "@/components/ui/banner-carousel";
import { usePublicBanners } from "@/hooks/usePublic";

export default function HomeBanner() {
  const { data: banners, isLoading } = usePublicBanners("home");

  // Only show the skeleton on a genuine cold load (no cached/persisted data yet).
  // On refetches and back-navigation `banners` is already populated (kept via
  // placeholderData + the persisted query cache), so the carousel stays painted
  // instead of flashing a blank/gray box. Height matches the carousel to avoid
  // any layout shift when the real images swap in.
  const hasBanners = Array.isArray(banners) && banners.length > 0;
  if (isLoading && !hasBanners) {
    return (
      <div className="md:px-4 md:mb-2">
        <div className="w-full h-[180px] sm:h-[240px] md:h-[320px] md:rounded-2xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    // <div className="mx-4 bg-red-600 rounded-xl overflow-hidden border border-[#1e4088]/40 shadow-lg shadow-black/30">
    <>
      <BannerCarousel
        banners={banners}
        height="h-[180px] sm:h-[240px] md:h-[320px]"
        autoPlay={true}
        interval={5000}
        />
        </>
    // </div>
  );
}
