"use client";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider } from "./ui/sidebar";
import Header from "./layout/header";
import { AppSidebar } from "./layout/app-sidebar-new";
import Dropheader from "./layout/dropheader";
import Footer from "./layout/footer";

export default function MainLayout({ children }: { children: ReactNode }) {
  const [is_home_route, setIsHomeRoute] = useState(false)
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isAuthRoute =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/forgot-password");

  if (isAdminRoute || isAuthRoute) {
    return <>{children}</>;
  }
  useEffect(() => {
    setIsHomeRoute(pathname === "/home");
  }, [pathname])


  return (
    <SidebarProvider>
      <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 w-full flex flex-col">
        {/* Fixed Header - Full Width */}
        {/* <div className="fixed top-0 left-0 right-0 z-50 w-full"> */}
        <Header />
        {/* </div> */}

        {/* Main Content Area - Below Header */}
        <div className="flex mt-30">
          {/* Sidebar - Starts below header */}
          <AppSidebar />

          {/* Main Content */}
          <main
            className="h-full w-full transition-all duration-300"
            id="main-content"
          >
            {children}
          </main>
        </div>

        {/* Footer - Only on /home route, full width break out of sidebar constraints */}
        {is_home_route && (
          <div className="w-screen relative ml-[calc((100%-100vw)/2)] mr-[calc((100%-100vw)/2)]">
            <Footer />
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}
