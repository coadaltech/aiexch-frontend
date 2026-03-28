"use client";

import HomeBanner from "@/components/home-banner";
import HomePromotionsSection from "@/components/home-promotions-section";
import DynamicHomeSections from "@/components/dynamic-home-sections";
import QuickLinksSection from "@/components/quick-links-section";
import Footer from '../../components/layout/footer'
import { CricketMatchesList } from "@/components/sports/cricket-matches-list";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { toast } from "sonner";

const ErrorHandler = () => {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");

  useEffect(() => {
    if (errorCode) {
      let message = "";
      switch (errorCode) {
        case "0":
          message = "payload decode failed in middleware";
          break;
        case "1":
          message = "Access denied: Admins only.";
          break;
        case "2":
          message = "Error verifying owner access.";
          break;
        default:
          message = "An unknown error occurred.";
      }
      toast.error(message);
    }
  }, [errorCode]);

  return null;
};

const Homepage = () => {
  return (
    <div className="w-full min-w-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background effects */}
      {/* <div className="fixed inset-0 overflow-hidden pointer-events-none z-0"> */}
      {/*   <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div> */}
      {/*   <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div> */}
      {/*   <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div> */}
      {/* </div> */}

      <div className="w-full">
        <Suspense fallback={null}>
          <ErrorHandler />
        </Suspense>

        <HomeBanner />

        <div className="px-4 py-4 sm:py-6 w-full space-y-6">
          {/* Cricket Matches Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Cricket
                </h2>
                <span className="text-xs text-muted-foreground bg-white/5 rounded-full px-2 py-0.5">
                  Live & Upcoming
                </span>
              </div>
              <Link
                href="/sports/cricket"
                className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                View All
              </Link>
            </div>
            <CricketMatchesList sport="cricket" eventTypeId="4" />
          </section>

          <HomePromotionsSection />
          <QuickLinksSection />
          <DynamicHomeSections />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Homepage;

