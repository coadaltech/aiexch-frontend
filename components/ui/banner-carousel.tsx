"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  status: string;
  order: number;
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
  const items = banners || slides || [];
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);

  useEffect(() => {
    if (!isAutoPlaying || items.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % items.length);
    }, interval);

    return () => clearInterval(timer);
  }, [isAutoPlaying, items.length, interval]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(autoPlay), 10000);
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % items.length);
  };

  const prevSlide = () => {
    goToSlide(currentSlide === 0 ? items.length - 1 : currentSlide - 1);
  };

  if (!items.length) {
    return null;
  }

  return (
    <div
      className={`relative w-full ${height} overflow-hidden rounded-md mb-8`}
    >
      <div
        className="flex w-full h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {items.map((item: any) => (
          <div key={item.id} className="w-full h-full flex-shrink-0 relative">
            <Image
              width={1000}
              height={1000}
              src={item.imageUrl || item.image}
              alt={item.title || item.alt}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute hidden md:block left-4 top-1/2 -translate-y-1/2 shadow z-10 bg-accent hover:bg-border text-accent-foreground  p-3 rounded-full transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 hidden md:block top-1/2 -translate-y-1/2 z-10 shadow  bg-accent hover:bg-border  text-accent-foreground p-3 rounded-full transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
            {items.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-4 h-4 rounded-full transition-all ${
                  index === currentSlide
                    ? "bg-primary scale-125"
                    : "bg-primary/30 hover:bg-primary/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
