"use client";

import { BannerCarousel } from "@/components/ui/banner-carousel";
import { usePublicBanners } from "@/hooks/usePublic";
import { CarouselSkeleton } from "@/components/skeletons/carousel-skeleton";

export default function HomeBanner() {
  const { data: banners, isLoading } = usePublicBanners("home");

  // if (isLoading) {
  //   return (
  //     <CarouselSkeleton itemCount={1} className="h-[200px] md:h-[400px]" />
  //   );
  // }

  // if (!banners || banners.length === 0) return null;

  return (
    <div className="mx-auto px-4 -mt-5">
      <div className="relative group">
        {/* Glowing border effect */}
        {/* <div className="absolute -inset-0.5 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 animate-pulse"></div> */}

        {isLoading ? (
          <CarouselSkeleton
            itemCount={1}
            className="h-[200px] sm:h-[250px] md:h-[300px] lg:h-[300px] rounded-2xl mt-7 "
          />
        ) : (
          <div className="relative rounded-2xl overflow-hidden ">
            <BannerCarousel
              banners={banners}
              height="h-[200px] sm:h-[250px] md:h-[300px] lg:h-[300px]"
              autoPlay={true}
              interval={5000}
            />
          </div>
        )}

        {/* Casino-style decorative corners with animation */}
        {/* <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-primary/50 z-20 animate-pulse"></div>
        <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-primary/50 z-20 animate-pulse"></div>
        <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-primary/50 z-20 animate-pulse"></div>
        <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-primary/50 z-20 animate-pulse"></div> */}
      </div>
    </div>
  );
}
