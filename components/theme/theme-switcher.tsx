"use client";

import { Check, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSiteTheme } from "@/contexts/ThemeContext";
import { getThemeMeta } from "@/themes/registry";
import { cn } from "@/lib/utils";

interface ThemeSwitcherProps {
  /**
   * `header` (default) matches the site header buttons via the header CSS vars,
   * so it adapts to each theme/white-label automatically. `surface` is a neutral
   * card-styled pill for use on plain backgrounds.
   */
  variant?: "header" | "surface";
  className?: string;
}

/**
 * Lets users switch between the admin-enabled layout themes. The choice is
 * applied instantly (no reload) and persisted by the ThemeProvider to
 * localStorage + cookie, so it survives navigation and future sessions. When
 * only one theme is enabled the switcher hides itself.
 *
 * Styling follows the active theme: the `header` variant uses the same
 * `--header-*` CSS variables as the other header buttons, so it always matches
 * the current theme's header chrome.
 */
export function ThemeSwitcher({ variant = "header", className }: ThemeSwitcherProps) {
  const { theme, setTheme, themes } = useSiteTheme();

  if (themes.length <= 1) return null;
  const current = getThemeMeta(theme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg text-xs font-medium outline-none transition-colors touch-manipulation sm:text-sm",
          variant === "header"
            ? "h-7 px-2 font-condensed text-[var(--header-text)] bg-[var(--header-primary)] hover:bg-[var(--header-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--header-secondary)]/50 sm:h-8 sm:px-3"
            : "border border-border bg-card/80 px-3 py-1.5 text-foreground shadow-sm hover:bg-card focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        aria-label="Switch theme"
      >
        <Palette className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
        <span className="hidden sm:inline">{current?.name ?? "Theme"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Choose a theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((t) => {
          const active = t.key === theme;
          return (
            <DropdownMenuItem
              key={t.key}
              onSelect={() => setTheme(t.key)}
              className="flex items-start gap-3 py-2"
            >
              <span
                className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-black/10"
                style={{ background: t.swatch }}
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-2 font-medium">
                  {t.name}
                  {t.badge && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t.badge}
                    </span>
                  )}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {t.description}
                </span>
              </span>
              {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
