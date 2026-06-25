"use client";

import { usePathname } from "next/navigation";
import { ThemeSwitcher } from "./theme-switcher";
import { isPanelPath } from "@/lib/panel-utils";

/**
 * Always-visible theme switcher, floating bottom-right. Rendered once at the app
 * root so it works on EVERY non-admin route (including login) and in EVERY theme
 * — independent of whichever header is on screen. This guarantees users can
 * always switch themes. Hidden on admin/panel routes.
 */
export function GlobalThemeSwitcher() {
  const pathname = usePathname();
  if (isPanelPath(pathname)) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[200] lg:bottom-4">
      <ThemeSwitcher variant="surface" className="shadow-lg" />
    </div>
  );
}
