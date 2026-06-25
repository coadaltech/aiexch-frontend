import type React from "react";
import type { Metadata } from "next";
import { Roboto, Roboto_Condensed } from "next/font/google";
import "./globals.css";
// Diamond theme re-skin — fully scoped to [data-theme="diamond"], inert otherwise.
import "@/themes/diamond/diamond.css";
// Betfair theme re-skin — fully scoped to [data-theme="betfair"], inert otherwise.
import "@/themes/betfair/betfair.css";
// TomExch theme re-skin — fully scoped to [data-theme="tomexch"], inert otherwise.
import "@/themes/tomexch/tomexch.css";
import BottomNavigation from "@/components/layout/bottom-tab";
import MainLayout from "@/components/main-layout";
import { PopupDisplay } from "@/components/popups/popup-display";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionProvider } from "@/contexts/PermissionContext";
import { BetSlipProvider } from "@/contexts/BetSlipContext";
import { DatabaseErrorProvider } from "@/contexts/DatabaseErrorContext";
// import { SportsProvider } from "@/contexts/SportsContext";
import { Toaster } from "sonner";
import { MaintenanceWrapper } from "@/components/maintenance/maintenance-wrapper";
import { MetadataLoader } from "@/components/metadata-loader";
import { ThemeScript } from "@/components/theme-script";
import { ThemeInitScript } from "@/components/theme/theme-init-script";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeColorApplier } from "@/components/theme/theme-color-applier";
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
        <ThemeScript />
      </head>
      <body
        className={`${roboto.variable} ${robotoCondensed.variable} min-h-screen`}
        suppressHydrationWarning={true}
      >
        <Toaster
          closeButton
          richColors
          position="top-right"
          toastOptions={{
            classNames: {
              toast:
                "!text-[15px] sm:!text-base !py-3.5 !px-4 !min-h-[56px] !shadow-lg",
              title: "!text-[15px] sm:!text-base !font-medium !leading-snug",
              description: "!text-[13px] sm:!text-sm !leading-snug",
            },
          }}
        />
        <NextTopLoader />
        {/* <ThemeLoader /> */}
        <MetadataLoader />
        <QueryProvider>
          {/* <UseSportsSeries> */}
          <ThemeProvider>
          <ThemeColorApplier />
          <AuthProvider>
            <PermissionProvider>
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
            </PermissionProvider>
          </AuthProvider>
          </ThemeProvider>
          {/* </UseSportsSeries> */}
        </QueryProvider>
      </body>
    </html>
  );
}
