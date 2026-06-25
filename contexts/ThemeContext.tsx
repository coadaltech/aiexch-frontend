"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";
import {
  DEFAULT_THEME_KEY,
  THEME_STORAGE_KEY,
  isKnownTheme,
  listEnabledThemes,
  resolveThemeKey,
} from "@/themes/registry";
import type { ThemeKey, ThemeMeta } from "@/themes/types";

interface SiteThemeContextValue {
  /** The theme currently applied to the UI. */
  theme: ThemeKey;
  /** Switch the layout theme instantly (no reload) and persist the choice. */
  setTheme: (key: ThemeKey) => void;
  /** Themes the user is allowed to switch between (enabled + known). */
  themes: ThemeMeta[];
  /** The admin-configured default theme key. */
  defaultTheme: ThemeKey;
  /** True once the admin config has loaded and the theme is reconciled. */
  isReady: boolean;
}

const SiteThemeContext = createContext<SiteThemeContextValue | null>(null);

/** Read the user's saved theme from localStorage (falls back to the cookie). */
function readStoredTheme(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const ls = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (ls) return ls;
  } catch {
    /* localStorage blocked (private mode) — fall through to cookie */
  }
  const m = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${THEME_STORAGE_KEY}=([^;]*)`)
  );
  return m ? decodeURIComponent(m[1]) : null;
}

function persistTheme(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, key);
  } catch {
    /* ignore */
  }
  // 1-year cookie so the choice survives sessions and is readable server-side.
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${THEME_STORAGE_KEY}=${encodeURIComponent(
    key
  )}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

/** Apply the theme to <html data-theme> so CSS can scope theme-specific rules. */
function applyThemeAttr(key: string) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = key;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Whether the user has explicitly chosen a theme this/previous session.
  // While false we keep following the admin default as it loads.
  const [hasExplicitChoice, setHasExplicitChoice] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  // Admin config (active default + enabled list) comes from the public settings
  // endpoint — the same source the color overlay already uses, so no extra
  // round-trip cost beyond one cached query.
  const { data: settings, isSuccess } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => publicApi.getSettings().then((res) => res.data?.data ?? {}),
    staleTime: 5 * 60 * 1000,
  });

  // Hydrate the saved choice on mount (client only) to avoid SSR mismatch.
  useEffect(() => {
    const stored = readStoredTheme();
    if (stored && isKnownTheme(stored)) {
      setSelected(stored);
      setHasExplicitChoice(true);
    }
  }, []);

  const adminDefault: ThemeKey = isKnownTheme(settings?.activeTheme)
    ? (settings!.activeTheme as ThemeKey)
    : DEFAULT_THEME_KEY;

  const enabled: string[] = Array.isArray(settings?.enabledThemes)
    ? (settings!.enabledThemes as string[])
    : [DEFAULT_THEME_KEY, "diamond", "betfair", "tomexch"];

  const themes = useMemo(() => listEnabledThemes(enabled), [enabled]);

  const theme = useMemo(
    () =>
      resolveThemeKey({
        selected: hasExplicitChoice ? selected : null,
        adminDefault,
        enabled,
      }),
    [hasExplicitChoice, selected, adminDefault, enabled]
  );

  // Reflect the resolved theme onto <html> whenever it changes — this is what
  // makes the swap instant and reload-free.
  useEffect(() => {
    applyThemeAttr(theme);
  }, [theme]);

  const setTheme = useCallback((key: ThemeKey) => {
    setSelected(key);
    setHasExplicitChoice(true);
    persistTheme(key);
    applyThemeAttr(key);
  }, []);

  const value = useMemo<SiteThemeContextValue>(
    () => ({ theme, setTheme, themes, defaultTheme: adminDefault, isReady: isSuccess }),
    [theme, setTheme, themes, adminDefault, isSuccess]
  );

  return (
    <SiteThemeContext.Provider value={value}>
      {children}
    </SiteThemeContext.Provider>
  );
}

/** Access the active site theme. Safe outside the provider (returns defaults). */
export function useSiteTheme(): SiteThemeContextValue {
  const ctx = useContext(SiteThemeContext);
  if (ctx) return ctx;
  return {
    theme: DEFAULT_THEME_KEY,
    setTheme: () => {},
    themes: listEnabledThemes(null),
    defaultTheme: DEFAULT_THEME_KEY,
    isReady: false,
  };
}
