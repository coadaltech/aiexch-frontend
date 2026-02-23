"use client";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider } from "./ui/sidebar";
import Header from "./layout/header";
import { AppSidebar } from "./layout/app-sidebar-new";
import Dropheader from "./layout/dropheader";
import Footer from "./layout/footer";
import { useWhitelabelInfo } from "@/hooks/useAuth";
import { useAuth } from "@/contexts/AuthContext";

export default function MainLayout({ children }: { children: ReactNode }) {
  const [is_home_route, setIsHomeRoute] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: whitelabelInfo } = useWhitelabelInfo();
  const { isLoggedIn } = useAuth();
  const isOwnerRoute = pathname?.startsWith("/owner");
  const isAuthRoute =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/forgot-password");

  const isB2B = String(whitelabelInfo?.whitelabelType ?? "").toUpperCase() === "B2B";
  const isHomeOrRoot = pathname === "/" || pathname === "/home";

  useEffect(() => {
    if (isB2B && isHomeOrRoot && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isB2B, isHomeOrRoot, isLoggedIn, router]);

  if (isOwnerRoute || isAuthRoute) {
    return <>{children}</>;
  }

  if (isB2B && isHomeOrRoot && !isLoggedIn) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 w-full flex flex-col">
        {/* Fixed Header - always visible at top */}
        <Header />

        {/* Main Content Area - only this part scrolls; header and (on mobile) bottom tab stay fixed */}
        <div className="flex flex-1 min-h-0 mt-14 md:mt-30 max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-7.5rem)]">
          {/* Sidebar - Starts below header */}
          <AppSidebar />

          {/* Main Content - scrollable area; pb for mobile so content clears fixed bottom tab */}
          <main
            className="min-h-0 flex-1 w-full overflow-y-auto overflow-x-hidden transition-all duration-300 pb-20 lg:pb-0"
            id="main-content"
          >
            {children}
          </main>
        </div>

        {/* Footer - Only on /home route, full width break out of sidebar constraints */}
        {/* {is_home_route && (
          <div className="w-screen relative ml-[calc((100%-100vw)/2)] mr-[calc((100%-100vw)/2)]">
            <Footer />
          </div>
        )} */}
      </div>
    </SidebarProvider>
  );
}
