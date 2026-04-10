"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { X, LogOut, ChevronDown, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWhitelabelInfo } from "@/hooks/useAuth";
import { usePanelPrefix } from "@/hooks/usePanelPrefix";
import { getNavigation } from "./data";
import { useState, useMemo } from "react";
import { useSettings } from "@/hooks/usePublic";

interface OwnerSidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function OwnerSidebar({ open, setOpen }: OwnerSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        <div
          className="fixed inset-0 bg-black/60"
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            "fixed left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent pathname={pathname} setOpen={setOpen} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:h-full lg:w-64 lg:block">
        <div className="h-full bg-sidebar border-r border-sidebar-border">
          <SidebarContent pathname={pathname} />
        </div>
      </div>
    </>
  );
}

function SidebarContent({
  pathname,
  setOpen,
}: {
  pathname: string;
  setOpen?: (open: boolean) => void;
}) {
  const { logout, user: currentUser } = useAuth();
  const { data: whitelabelInfo } = useWhitelabelInfo();
  const panelPrefix = usePanelPrefix();
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const { data: settings } = useSettings();
  const isWhitelabel = !!settings?.whitelabelTheme;
  const whitelabelType = whitelabelInfo?.whitelabelType ? String(whitelabelInfo.whitelabelType).toUpperCase() : null;
  const navigation = useMemo(() => getNavigation(panelPrefix), [panelPrefix]);

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 lg:p-6 border-b border-sidebar-border">
        <h2 className="text-lg lg:text-xl font-bold text-sidebar-primary">
          Manage Dashboard
        </h2>
        {setOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>


      <nav className="flex-1 overflow-y-auto py-4 px-3 lg:px-4 space-y-1">
        {navigation
          .filter((item) => {
            if (isWhitelabel && item.name === "Configuration") return false;
            if (item.name === "Manage Currency" && currentUser?.role !== "owner") return false;
            // Marketing is owner-only
            if (item.name === "Marketing" && currentUser?.role !== "owner") return false;
            // QR Codes: only for non-owner users on B2C whitelabels
            if (item.name === "QR Codes") {
              if (currentUser?.role === "owner") return false;
              if (whitelabelType !== "B2C") return false;
            }
            // Withdrawal Methods: only for non-owner users on B2C whitelabels
            if (item.name === "Withdrawal Methods") {
              if (currentUser?.role === "owner") return false;
              if (whitelabelType !== "B2C") return false;
            }
            return true;
          })
          .map((item) =>
            item.subItems ? (
              <div key={item.name}>
                <button
                  onClick={() => toggleGroup(item.name)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 touch-manipulation text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate flex-1 text-left">{item.name}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      openGroups.includes(item.name) && "rotate-180"
                    )}
                  />
                </button>
                {openGroups.includes(item.name) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                          pathname === subItem.href
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        )}
                        onClick={() => setOpen?.(false)}
                      >
                        <subItem.icon className="h-4 w-4 flex-shrink-0" />
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.name}
                href={item.href!}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 touch-manipulation",
                  pathname === item.href
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                    : "text-sidebar-foreground hover:bg-sidebar-accent active:bg-sidebar-accent/80"
                )}
                onClick={() => setOpen?.(false)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          )}
      </nav>

      <div className="p-3 lg:p-4 border-t border-sidebar-border mt-auto">
        {currentUser && (
          <div className="px-3 py-2 flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground">
              <User className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-sidebar-primary truncate">
                {currentUser.username ?? currentUser.email ?? "owner"}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate capitalize">
                {currentUser.role ? String(currentUser.role).toLowerCase() : "—"}
                {whitelabelType ? ` · ${whitelabelType}` : ""}
              </p>
            </div>
            <button
              onClick={() => {
                logout();
                setOpen?.(false);
              }}
              className="text-sidebar-foreground/70 hover:text-destructive transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
