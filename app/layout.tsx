import type React from "react";
import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import "./globals.css";
import BottomNavigation from "@/components/layout/bottom-tab";
import MainLayout from "@/components/main-layout";
import { PopupDisplay } from "@/components/popups/popup-display";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { BetSlipProvider } from "@/contexts/BetSlipContext";
import { SportsProvider } from "@/contexts/SportsContext";
import { Toaster } from "sonner";
import { MaintenanceWrapper } from "@/components/maintenance/maintenance-wrapper";
import { MetadataLoader } from "@/components/metadata-loader";
import { ThemeScript } from "@/components/theme-script";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
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
        className={`${inter.variable} ${cinzel.variable} min-h-screen overflow-x-hidden `}
        suppressHydrationWarning={true}
      >
        <NextTopLoader />
        {/* <ThemeLoader /> */}
        <MetadataLoader />
        <QueryProvider>
          <AuthProvider>
            <BetSlipProvider>
              <SportsProvider>
                <MaintenanceWrapper>
                  <MainLayout>
                    {children}
                    <PopupDisplay />
                    <BottomNavigation />
                  </MainLayout>
                </MaintenanceWrapper>
              </SportsProvider>
            </BetSlipProvider>
            <Toaster closeButton position="top-right" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
