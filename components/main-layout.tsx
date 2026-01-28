"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider } from "./ui/sidebar";
import Header from "./layout/header";
import { AppSidebar } from "./layout/app-sidebar-new";
import Dropheader from "./layout/dropheader";

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isAuthRoute =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/forgot-password");

  if (isAdminRoute || isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 w-full flex flex-col">
        {/* Fixed Header - Full Width */}
        <div className="fixed top-0 left-0 right-0 z-50 w-full">
          <Header />
        </div>

        {/* Main Content Area - Below Header */}
        <div className="flex flex-col lg:flex-row w-full mt-20 sm:mt-24 md:mt-28">
          {/* Sidebar - Starts below header */}
          <div className="hidden lg:block fixed left-0 top-20 sm:top-24 md:top-32  bottom-0 mx-6 z-40">
            <AppSidebar />
          </div>

          {/* Main Content */}
          <main
            className="flex-1 min-h-screen lg:ml-64 transition-all duration-300"
            id="main-content"
          >
            {/* Content with padding */}
            <div className="mx-auto w-full lg:pb-0 pb-20">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
