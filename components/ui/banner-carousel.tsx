"use client";

import { useState, useEffect } from "react";

interface Banner {
  id: string;
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevSlide, setPrevSlide] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<"forward" | "backward">(
    "forward"
  );

  useEffect(() => {
    if (!isAutoPlaying || items.length <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, interval);

    return () => clearInterval(timer);
  }, [isAutoPlaying, items.length, interval, currentSlide]);

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setSlideDirection("forward");
    setPrevSlide(currentSlide);
    setCurrentSlide((prev) => (prev + 1) % items.length);
    setTimeout(() => {
      setIsTransitioning(false);
      setPrevSlide(null);
    }, 600);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setSlideDirection("backward");
    setPrevSlide(currentSlide);
    setCurrentSlide((prev) => (prev - 1 + items.length) % items.length);
    setTimeout(() => {
      setIsTransitioning(false);
      setPrevSlide(null);
    }, 600);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    // Determine direction
    const nextIndex = (currentSlide + 1) % items.length;
    const prevIndex = (currentSlide - 1 + items.length) % items.length;
    if (
      index === nextIndex ||
      (currentSlide === items.length - 1 && index === 0)
    ) {
      setSlideDirection("forward");
    } else if (
      index === prevIndex ||
      (currentSlide === 0 && index === items.length - 1)
    ) {
      setSlideDirection("backward");
    } else {
      // For direct jumps, determine by shortest path
      const forwardDist =
        index > currentSlide
          ? index - currentSlide
          : items.length - currentSlide + index;
      const backwardDist =
        currentSlide > index
          ? currentSlide - index
          : currentSlide + items.length - index;
      setSlideDirection(forwardDist <= backwardDist ? "forward" : "backward");
    }
    setPrevSlide(currentSlide);
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => {
      setIsTransitioning(false);
      setPrevSlide(null);
      setIsAutoPlaying(autoPlay);
    }, 600);
  };

  if (!items.length) {
    return null;
  }

  // Get next slides to show previews (up to 2 next slides)
  // During transition, use prevSlide to calculate previews so the transitioning slide doesn't show as preview
  const baseSlide =
    isTransitioning && prevSlide !== null ? prevSlide : currentSlide;

  const getNextSlides = () => {
    const nextSlides = [];
    for (let i = 1; i <= 2 && i < items.length; i++) {
      const nextIndex = (baseSlide + i) % items.length;
      // Don't show the slide that's transitioning in as a preview
      if (isTransitioning && prevSlide !== null && nextIndex === currentSlide)
        continue;
      nextSlides.push({
        item: items[nextIndex],
        index: nextIndex,
        offset: i,
      });
    }
    return nextSlides;
  };

  const nextSlides = getNextSlides();
  const nextSlideIndex = (baseSlide + 1) % items.length;
  const prevSlideIndex = (baseSlide - 1 + items.length) % items.length;
  const isNextSlideTransitioning =
    isTransitioning &&
    prevSlide !== null &&
    nextSlideIndex === currentSlide &&
    slideDirection === "forward";
  const isPrevSlideTransitioning =
    isTransitioning &&
    prevSlide !== null &&
    prevSlideIndex === currentSlide &&
    slideDirection === "backward";

  return (
    <div className={`relative w-full ${height} mb-2 px-4`}>
      {/* Main Container */}
      <div className="relative w-full h-full mt-2  overflow-hidden">
        {/* Slides Container */}
        <div className="relative w-full h-full flex items-center">
          {/* Previous Slide - sliding out during transition */}
          {isTransitioning && prevSlide !== null && (
            <div
              key={`prev-${prevSlide}`}
              className={`absolute left-0 w-[70%] h-full z-30 will-change-transform ${
                slideDirection === "forward"
                  ? "animate-[slideOutLeft_0.6s_ease-in-out_forwards]"
                  : "animate-[slideOutRight_0.6s_ease-in-out_forwards]"
              }`}
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={items[prevSlide].imageUrl || items[prevSlide].image}
                  alt={items[prevSlide].title || items[prevSlide].alt}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          )}

          {/* Current Slide - 70% width, positioned from left (only when not transitioning) */}
          {!isTransitioning && (
            <div
              key={`current-${currentSlide}`}
              className="absolute left-0 w-[70%] h-full z-30 transition-opacity duration-300"
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={
                    items[currentSlide].imageUrl || items[currentSlide].image
                  }
                  alt={items[currentSlide].title || items[currentSlide].alt}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          )}

          {/* Next Slide - Preview on the right, slides into current position (forward) */}
          {items.length > 1 && (
            <div
              key={`next-main-${nextSlideIndex}`}
              onClick={() =>
                !isNextSlideTransitioning &&
                !isPrevSlideTransitioning &&
                goToSlide(nextSlideIndex)
              }
              className={`absolute h-full z-20 cursor-pointer will-change-[left,width,opacity] ${
                isNextSlideTransitioning
                  ? "left-[70%] w-[15%] animate-[slideFromPreview_0.6s_ease-in-out_forwards] z-40"
                  : "left-[70%] w-[15%] opacity-80 hover:opacity-100 transition-all duration-[600ms] ease-in-out"
              }`}
            >
              <div
                className={`relative w-full h-full overflow-hidden shadow-2xl transition-all duration-[600ms] ease-in-out ${
                  isNextSlideTransitioning ? "rounded-2xl" : "rounded-xl"
                }`}
              >
                <img
                  src={
                    items[nextSlideIndex].imageUrl ||
                    items[nextSlideIndex].image
                  }
                  alt={items[nextSlideIndex].title || items[nextSlideIndex].alt}
                  className="w-full h-full object-cover object-top"
                />
                {!isNextSlideTransitioning && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/40 transition-opacity duration-300" />
                )}
              </div>
            </div>
          )}

          {/* Previous Slide - Preview on the left, slides into current position (backward) */}
          {items.length > 1 && (
            <div
              key={`prev-main-${prevSlideIndex}-${isPrevSlideTransitioning}`}
              className={`absolute h-full z-20 cursor-pointer will-change-[left,width,opacity] ${
                isPrevSlideTransitioning
                  ? "left-[-15%] w-[15%] animate-[slideFromLeft_0.6s_ease-in-out_forwards] z-40"
                  : "left-[-15%] w-[15%] opacity-80 hover:opacity-100 transition-all duration-[600ms] ease-in-out"
              }`}
            >
              <div
                className={`relative w-full h-full overflow-hidden shadow-2xl transition-all duration-[600ms] ease-in-out ${
                  isPrevSlideTransitioning ? "rounded-2xl" : "rounded-xl"
                }`}
              >
                <img
                  src={
                    items[prevSlideIndex].imageUrl ||
                    items[prevSlideIndex].image
                  }
                  alt={items[prevSlideIndex].title || items[prevSlideIndex].alt}
                  className="w-full h-full object-cover object-top"
                />
                {!isPrevSlideTransitioning && (
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/20 to-black/40 transition-opacity duration-300" />
                )}
              </div>
            </div>
          )}

          {/* Additional Next Slides - Preview on the right */}
          {nextSlides
            .filter(
              ({ offset }) =>
                offset > 1 || (offset === 1 && !isNextSlideTransitioning)
            )
            .map(({ item, index, offset }) => {
              // Calculate position: starts at 70% (end of current slide) + spacing
              const leftPosition = 70 + (offset - 1) * 15; // 15% spacing between previews
              const previewWidth = 15; // Each preview is 15% width

              // Check if this preview slide should animate (when first preview slides in, second one moves left)
              const shouldAnimate = isNextSlideTransitioning && offset === 2;
              // Rightmost image (offset === 2) should not be clickable
              const isRightmost = offset === 2;

              return (
                <div
                  key={`next-${index}-${isTransitioning}`}
                  onClick={() => !isRightmost && goToSlide(index)}
                  className={`absolute h-full z-10 will-change-[left,opacity] ${
                    isRightmost ? "cursor-default" : "cursor-pointer"
                  } ${
                    shouldAnimate
                      ? "animate-[slidePreviewLeft_0.6s_ease-in-out_forwards]"
                      : "transition-all duration-300 hover:scale-105"
                  }`}
                  style={{
                    left: shouldAnimate ? "85%" : `${leftPosition}%`,
                    width: `${previewWidth}%`,
                  }}
                >
                  <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg opacity-70 hover:opacity-100 transition-opacity">
                    <img
                      src={item.imageUrl || item.image}
                      alt={item.title || item.alt}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/40" />
                  </div>
                </div>
              );
            })}
        </div>

        {/* Navigation Dots - Fixed position at bottom center of 70% image area */}
        <div className="absolute bottom-4 left-[35%] flex items-center space-x-4 z-50 pointer-events-auto">
          {items.map((_, index) => {
            const isActive = index === currentSlide;

            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`
                  transition-all duration-200 cursor-pointer
                  transform rounded-full
                  ${
                    isActive
                      ? "md:w-8 w-6 md:h-2 h-1 bg-white scale-110"
                      : "md:w-2 md:h-2 w-1 h-1 border border-white/40 bg-white/30 hover:border-white/40 hover:scale-105"
                  }
                `}
              />
            );
          })}
        </div>

        {/* Navigation Arrows - Fixed position at bottom right of 70% image area */}
        {items.length > 1 && (
          <div className=" md:block hidden">
            <div className="absolute bottom-4 right-[31%] flex items-center gap-2 z-50 pointer-events-auto">
              <button
                onClick={handlePrev}
                disabled={isTransitioning}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Previous slide"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={handleNext}
                disabled={isTransitioning}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Next slide"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tailwind Keyframe Animations */}
      <style jsx global>{`
        @keyframes slideFromPreview {
          0% {
            left: 70%;
            width: 15%;
            opacity: 0.8;
          }
          100% {
            left: 0%;
            width: 70%;
            opacity: 1;
          }
        }

        @keyframes slidePreviewLeft {
          0% {
            left: 85%;
            opacity: 0.7;
          }
          100% {
            left: 70%;
            opacity: 0.7;
          }
        }

        @keyframes slideOutLeft {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
        }

        @keyframes slideOutRight {
          0% {
            transform: translateX(0);
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes slideFromLeft {
          0% {
            left: -15%;
            width: 15%;
            opacity: 0.8;
          }
          100% {
            left: 0%;
            width: 70%;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
