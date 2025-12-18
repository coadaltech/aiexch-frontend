"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider } from "./ui/sidebar";
import Header from "./layout/header";
import { AppSidebar } from "./layout/app-sidebar-new";

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
      <div className="min-h-screen w-full flex flex-col lg:flex-row">
        <AppSidebar />
        {/* Main Content */}
        <main
          className="flex-1 min-h-screen p-4 md:p-6 overflow-y-auto"
          id="main-content"
        >
          {/* Fixed Header */}
          <div className="fixed top-0 left-0 lg:left-[256px] right-0 z-30">
            <Header />
          </div>

          {/* Content with top padding to avoid overlap */}
          <div className="pt-20 md:mt-4 mx-auto w-full lg:pb-0 pb-20">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
