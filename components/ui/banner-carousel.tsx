"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface Banner {
  id?: string;
  title?: string;
  imageUrl?: string;
  image?: string;
  alt?: string;
  linkUrl?: string;
  status?: string;
  order?: number;
}

interface BannerCarouselProps {
  banners?: Banner[];
  slides?: any[];
  height?: string;
  autoPlay?: boolean;
  interval?: number;
}

export function BannerCarousel({
  banners,
  slides,
  height = "h-[200px] md:h-[300px]",
  autoPlay = true,
  interval = 5000,
}: BannerCarouselProps) {
  const items: Banner[] = banners || slides || [];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const userInteractingRef = useRef(false);
  const interactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const scrollToIndex = (index: number, behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    const slideWidth = el.clientWidth;
    el.scrollTo({ left: slideWidth * index, behavior });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const slideWidth = el.clientWidth;
        if (slideWidth === 0) return;
        const index = Math.round(el.scrollLeft / slideWidth);
        setCurrentSlide((prev) => (prev === index ? prev : index));
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const markInteracting = () => {
      userInteractingRef.current = true;
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
      interactionTimeoutRef.current = setTimeout(() => {
        userInteractingRef.current = false;
      }, 2000);
    };

    el.addEventListener("pointerdown", markInteracting);
    el.addEventListener("touchstart", markInteracting, { passive: true });
    el.addEventListener("wheel", markInteracting, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", markInteracting);
      el.removeEventListener("touchstart", markInteracting);
      el.removeEventListener("wheel", markInteracting);
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!autoPlay || items.length <= 1) return;
    const timer = setInterval(() => {
      if (userInteractingRef.current) return;
      const next = (currentSlide + 1) % items.length;
      scrollToIndex(next);
    }, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, items.length, currentSlide]);

  useEffect(() => {
    const onResize = () => scrollToIndex(currentSlide, "auto");
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [currentSlide]);

  if (!items.length) return null;

  return (
    <div className={`relative w-full ${height} md:mb-2 md:px-4 `}>
      <div
        ref={scrollRef}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar rounded md:rounded-2xl"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item, index) => {
          const src = item.imageUrl || item.image;
          const alt = item.title || item.alt || `Banner ${index + 1}`;
          const href = item.linkUrl;
          const isFirst = index === 0;
          const slide = (
            <div className="relative w-full h-full overflow-hidden md:rounded-2xl shadow-2xl bg-gray-200">
              {src ? (
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="100vw"
                  priority={isFirst}
                  fetchPriority={isFirst ? "high" : "low"}
                  loading={isFirst ? "eager" : "lazy"}
                  className="object-contain md:object-cover object-center"
                  draggable={false}
                />
              ) : null}
            </div>
          );
          return (
            <div
              key={item.id ?? index}
              className="relative shrink-0 w-full h-full snap-center"
            >
              {href ? (
                <a href={href} className="block w-full h-full">
                  {slide}
                </a>
              ) : (
                slide
              )}
            </div>
          );
        })}
      </div>

      {items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 pointer-events-auto">
          {items.map((_, index) => {
            const isActive = index === currentSlide;
            return (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`transition-all duration-200 cursor-pointer rounded-full ${
                  isActive
                    ? "w-6 h-2 md:w-8 md:h-2 bg-white"
                    : "w-2 h-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            );
          })}
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
