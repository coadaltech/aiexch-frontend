"use client"

import HomeBanner from "@/components/home-banner";
import HomePromotionsSection from "@/components/home-promotions-section";
import DynamicHomeSections from "@/components/dynamic-home-sections";
import QuickLinksSection from "@/components/quick-links-section";
import Footer from "@/components/layout/footer";
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
          message = "Error verifying admin access.";
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
    <div className="">
      <Suspense fallback={null}>
        <ErrorHandler />
      </Suspense>
      <HomeBanner />
      <HomePromotionsSection />
      <QuickLinksSection />
      <DynamicHomeSections />
      {/* <CasinoStats /> */}
      {/* <LiveWinners /> */}
      {/* <Tournaments /> */}
      {/* <PaymentMethods /> */}
      {/* <GamesProviderSection /> */}
      <Footer />
    </div>
  );
};

export default Homepage;
