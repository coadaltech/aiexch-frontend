"use client";

import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add("admin-light");
    return () => document.documentElement.classList.remove("admin-light");
  }, []);

  return (
    <>
      <div className="min-h-screen admin-light">
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        {/* Mobile header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-sidebar-border px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-sidebar-primary">
              Admin Panel
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="lg:pl-64">
          <main className="p-4 lg:p-6 pt-16 lg:pt-6">{children}</main>
        </div>
      </div>
    </>
  );
}
