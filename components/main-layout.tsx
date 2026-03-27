"use client";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider, useSidebar } from "./ui/sidebar";
import Header from "./layout/header";
import { AppSidebar } from "./layout/app-sidebar-new";
import { useWhitelabelInfo } from "@/hooks/useAuth";
import { useAuth } from "@/contexts/AuthContext";
import { PanelLeftOpen } from "lucide-react";

function SidebarOpenButton() {
  const { open, toggleSidebar, isMobile } = useSidebar();
  if (open || isMobile) return null;
  return (
    <button
      onClick={toggleSidebar}
      className="hidden md:flex fixed left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white/60 hover:text-white hover:bg-slate-700 transition-colors shadow-lg"
      title="Open sidebar"
    >
      <PanelLeftOpen className="h-4 w-4" />
    </button>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: whitelabelInfo, isLoading: whitelabelLoading } = useWhitelabelInfo();
  const { isLoggedIn } = useAuth();
  const isOwnerRoute = pathname?.startsWith("/owner");
  const isAuthRoute =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/forgot-password");

  const isHomeOrRoot = pathname === "/" || pathname === "/home";
  const whitelabelNotFound =
    !whitelabelLoading && whitelabelInfo?.whitelabelType == null;

  useEffect(() => {
    if (isOwnerRoute || isAuthRoute) return;
    if (whitelabelLoading) return;
    if (whitelabelNotFound) {
      router.replace("/login");
      return;
    }
    if (!isLoggedIn && isHomeOrRoot) {
      router.replace("/login");
    }
  }, [isOwnerRoute, isAuthRoute, whitelabelLoading, whitelabelNotFound, isLoggedIn, isHomeOrRoot, router]);

  if (isOwnerRoute || isAuthRoute) {
    return <>{children}</>;
  }

  if (whitelabelNotFound || (!isLoggedIn && isHomeOrRoot)) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 w-full flex flex-col">
        {/* Fixed Header - always visible at top */}
        <Header />

        {/* Floating button to reopen sidebar when collapsed */}
        <SidebarOpenButton />

        {/* Main Content Area - only this part scrolls; header and (on mobile) bottom tab stay fixed */}
        <div className="flex flex-1 min-h-0 mt-14 md:mt-30 max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-7.5rem)]">
          {/* <div className= "flex flex-1 min-h-0 mt-14 lg:mt-24 max-h-[calc(100vh-3.5rem)] lg:max-h-[calc(100vh-6rem)]"> */}
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

      </div>
    </SidebarProvider>
  );
}
