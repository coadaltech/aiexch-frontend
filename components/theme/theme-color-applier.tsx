"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import { useSiteTheme } from "@/contexts/ThemeContext";
import { THEME_COLOR_SCHEMAS } from "@/themes/theme-colors";

/**
 * Applies the active white label's per-theme colour overrides at runtime.
 *
 * The admin sets these in Owner → White Labels → edit → Layout Theme. They're
 * served on `/public/settings` as `themeColors[<themeKey>]` and written here onto
 * the corresponding CSS custom properties (which the theme's stylesheet and
 * components read). Only the active theme's overrides are applied; switching
 * theme cleans up the previous set, so no theme leaks colours into another.
 * Unset colours fall back to each theme's built-in defaults — no deploy needed.
 */
export function ThemeColorApplier() {
  const { theme } = useSiteTheme();
  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => publicApi.getSettings().then((r) => r.data?.data ?? {}),
    staleTime: 5 * 60 * 1000,
  });
  const appliedRef = useRef<string[]>([]);

  useEffect(() => {
    const root = document.documentElement;

    // Remove whatever this applier set last time before re-applying.
    appliedRef.current.forEach((cssVar) => root.style.removeProperty(cssVar));
    appliedRef.current = [];

    const schema = THEME_COLOR_SCHEMAS[theme];
    if (!schema) return;

    const overrides: Record<string, string> =
      (settings as any)?.themeColors?.[theme] ?? {};
    const applied: string[] = [];
    for (const field of schema) {
      const value = overrides[field.key];
      if (typeof value === "string" && value.trim()) {
        root.style.setProperty(field.cssVar, value);
        applied.push(field.cssVar);
      }
    }

    // TomExch: compose the header background from the chosen style + colours so a
    // white label can use a 2-colour gradient or a single flat colour. Resolve
    // each value from the override (falling back to the schema default), then
    // write the final --tx-header-bg the header reads.
    if (theme === "tomexch") {
      const byKey = Object.fromEntries(schema.map((f) => [f.key, f]));
      const resolve = (k: string) => overrides[k] ?? byKey[k]?.default ?? "";
      const mode = resolve("headerMode");
      const c1 = resolve("headerFrom");
      const c2 = resolve("headerTo");
      const bg =
        mode === "solid"
          ? c1
          : `linear-gradient(90deg, ${c1} 50.05%, ${c2} 99%)`;
      if (bg) {
        root.style.setProperty("--tx-header-bg", bg);
        applied.push("--tx-header-bg");
      }
    }

    appliedRef.current = applied;
  }, [theme, settings]);

  return null;
}
