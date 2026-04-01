import type React from "react";
import type { Metadata } from "next";
import { Roboto, Roboto_Condensed } from "next/font/google";
import "./globals.css";
import BottomNavigation from "@/components/layout/bottom-tab";
import MainLayout from "@/components/main-layout";
import { PopupDisplay } from "@/components/popups/popup-display";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { BetSlipProvider } from "@/contexts/BetSlipContext";
import { DatabaseErrorProvider } from "@/contexts/DatabaseErrorContext";
// import { SportsProvider } from "@/contexts/SportsContext";
import { Toaster } from "sonner";
import { MaintenanceWrapper } from "@/components/maintenance/maintenance-wrapper";
import { MetadataLoader } from "@/components/metadata-loader";
import { ThemeScript } from "@/components/theme-script";
import NextTopLoader from "nextjs-toploader";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-roboto-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AIEXCH - Gaming Exchange Platform",
  description:
    "Experience the ultimate gaming exchange platform with casino games, sports betting, and live tournaments",
  metadataBase: new URL("https://aiexch-zeta.vercel.app"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${roboto.variable} ${robotoCondensed.variable} font-roboto min-h-screen`}
        suppressHydrationWarning={true}
      >
        <Toaster closeButton position="bottom-right" />
        <NextTopLoader />
        {/* <ThemeLoader /> */}
        <MetadataLoader />
        <QueryProvider>
          {/* <UseSportsSeries> */}
          <AuthProvider>
            <BetSlipProvider>
              <DatabaseErrorProvider>
                {/* <SportsProvider> */}
                <MaintenanceWrapper>
                  <MainLayout>
                    {children}
                    <PopupDisplay />
                    <BottomNavigation />
                  </MainLayout>
                </MaintenanceWrapper>
                {/* </SportsProvider> */}
              </DatabaseErrorProvider>
            </BetSlipProvider>
          </AuthProvider>
          {/* </UseSportsSeries> */}
        </QueryProvider>
      </body>
    </html>
  );
}
