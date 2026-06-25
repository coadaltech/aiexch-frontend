"use client";

import { BannerCarousel } from "@/components/ui/banner-carousel";
import { usePublicBanners } from "@/hooks/usePublic";

/**
 * TomExch home banner — the same admin-configured banners as the Default theme
 * (usePublicBanners("home")), rendered in the reference carousel style: smooth
 * slides, circular prev/next arrows and dot indicators. Data is shared, so
 * whatever the owner sets shows here too — only the chrome differs.
 */
export function TomexchBanner() {
  const { data: banners, isLoading } = usePublicBanners("home");

  if (isLoading) {
    return (
      <div className="px-2 md:px-4">
        <div className="w-full h-[160px] sm:h-[220px] md:h-[300px] rounded-md md:rounded-2xl bg-gray-200 animate-pulse" />
      </div>
    );
  }

  return (
    <BannerCarousel
      banners={banners}
      height="h-[160px] sm:h-[220px] md:h-[300px]"
      autoPlay
      interval={5000}
      showArrows
    />
  );
}
