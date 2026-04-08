"use client";

import { useState, useEffect } from "react";
import { OwnerSidebar } from "@/components/owner/owner-sidebar";
import { Button } from "@/components/ui/button";
import { Menu, LogOut, User, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLedger } from "@/hooks/useUserQueries";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user: currentUser, logout } = useAuth();
  const { data: ledger } = useLedger(!!currentUser && !currentUser.isDemo);

  useEffect(() => {
    document.documentElement.classList.add("admin-light");
    return () => document.documentElement.classList.remove("admin-light");
  }, []);

  return (
    <>
      <div className="min-h-screen admin-light">
        <OwnerSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        {/* Top header bar — visible on all screen sizes */}
        <div className="fixed top-0 left-0 right-0 z-40 lg:left-64 bg-sidebar border-b border-sidebar-border px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Mobile: hamburger + title */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <span className="lg:hidden text-base font-bold text-sidebar-primary">Panel</span>
            </div>

            {/* Right side: user info + limit + logout */}
            {currentUser && (
              <div className="flex items-center gap-3 ml-auto">
                {/* Balance / final limit */}
                <div className="hidden sm:flex items-center gap-1.5 bg-sidebar-accent/50 rounded-lg px-3 py-1.5">
                  <Wallet className="h-3.5 w-3.5 text-sidebar-foreground/70" />
                  <span className="text-xs font-semibold text-sidebar-primary">
                    ₹{ledger?.finalLimit ?? "—"}
                  </span>
                </div>

                {/* User info */}
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
                    <User className="h-4 w-4 text-sidebar-foreground" />
                  </div>
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-semibold text-sidebar-primary leading-tight">
                      {currentUser.username}
                    </p>
                    <p className="text-[10px] text-sidebar-foreground/70 capitalize leading-tight">
                      {currentUser.role}
                    </p>
                  </div>
                  {/* Mobile: compact name */}
                  <div className="sm:hidden text-right">
                    <p className="text-xs font-semibold text-sidebar-primary">{currentUser.username}</p>
                    <p className="text-[10px] text-sidebar-foreground/70">
                      ₹{ledger?.finalLimit ?? "—"}
                    </p>
                  </div>
                </div>

                {/* Logout */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive h-8 px-2"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:pl-64">
          <main className="px-4 pb-4 lg:px-6 lg:pb-6 pt-14">{children}</main>
        </div>
      </div>
    </>
  );
}
