import HomeBanner from "@/components/home-banner";
import HomePromotionsSection from "@/components/home-promotions-section";
import DynamicHomeSections from "@/components/dynamic-home-sections";
import QuickLinksSection from "@/components/quick-links-section";
import Footer from "@/components/layout/footer";

const Homepage = () => {
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
