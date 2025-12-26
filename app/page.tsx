"use client"

import HomeBanner from "@/components/home-banner";
import HomePromotionsSection from "@/components/home-promotions-section";
import DynamicHomeSections from "@/components/dynamic-home-sections";
import QuickLinksSection from "@/components/quick-links-section";
import Footer from "@/components/layout/footer";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const Homepage = () => {
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
      toast.error(message); // Replace with your preferred notification method
    }
  }, []);

  return (
    <div className="">
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
