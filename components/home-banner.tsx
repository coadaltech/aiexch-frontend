"use client";

import { BannerCarousel } from "@/components/ui/banner-carousel";
import { usePublicBanners } from "@/hooks/usePublic";
import { CarouselSkeleton } from "@/components/skeletons/carousel-skeleton";

export default function HomeBanner() {
  const { data: banners, isLoading } = usePublicBanners("home");

  if (isLoading) {
    return (
      <CarouselSkeleton itemCount={1} className="h-[200px] md:h-[400px]" />
    );
  }

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative">
      <BannerCarousel
        banners={banners}
        height="h-[200px] md:h-[400px]"
        autoPlay={true}
        interval={5000}
      />

      {/* Decorative corners */}
      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-primary/30 z-20"></div>
      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-primary/30 z-20"></div>
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-primary/30 z-20"></div>
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-primary/30 z-20"></div>
    </div>
  );
}
