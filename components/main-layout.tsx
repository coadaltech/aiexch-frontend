"use client";
import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarProvider } from "./ui/sidebar";
import Header from "./layout/header";
import { AppSidebar } from "./layout/app-sidebar-new";
import { useWhitelabelInfo } from "@/hooks/useAuth";
import { useAuth } from "@/contexts/AuthContext";
import { isPanelPath } from "@/lib/panel-utils";

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: whitelabelInfo, isLoading: whitelabelLoading } = useWhitelabelInfo();
  const { isLoggedIn } = useAuth();
  const isOwnerRoute = isPanelPath(pathname);
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
      <div style={{ height: 'var(--vh-full)' }} className="overflow-hidden bg-gradient-to-br from-nav-dark via-nav-dark to-nav-dark w-full flex flex-col">
        {/* Fixed Header - always visible at top */}
        <Header />

        {/* Main Content Area - only this part scrolls; header and (on mobile) bottom tab stay fixed */}
        <div className="flex flex-1 min-h-0 mt-14 md:mt-30 max-h-[calc(var(--vh-full)-4rem)] md:max-h-[calc(var(--vh-full)-7.5rem)] gap-2 p-2">
          {/* Sidebar - Starts below header */}
          <AppSidebar />

          {/* Main Content - scrollable area; pb for mobile so content clears fixed bottom tab */}
          <main
            className="min-h-0 flex-1 w-full overflow-y-auto overflow-x-hidden transition-all duration-300 pb-20 lg:pb-0 bg-white rounded-xl"
            id="main-content"
          >
            {children}
          </main>
        </div>

      </div>
    </SidebarProvider>
  );
}
