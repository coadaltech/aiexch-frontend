import type { ThemeKey, ThemeMeta } from "./types";

/**
 * ── Theme registry (metadata) ────────────────────────────────────────────────
 *
 * The single source of truth for which layout themes exist and how they're
 * described in the UI. Adding a new theme is a two-step, business-logic-free
 * change:
 *   1. Add an entry here.
 *   2. Add its shell component to `themes/shell-registry.tsx`.
 * Nothing else in the app needs to change.
 *
 * This file is intentionally component-free so it can be imported by the admin
 * panel and the user switcher without dragging in layout code.
 */
export const THEMES: ThemeMeta[] = [
  {
    key: "default",
    name: "Default",
    description: "The classic AIEXCH layout with the left sports sidebar.",
    badge: "Classic",
    swatch: "#ffd85c",
  },
  {
    key: "diamond",
    name: "Diamond",
    description:
      "Classic exchange skin — blue top bar, olive nav and blue/pink odds, like a premium sportsbook.",
    // badge: "Premium",
    swatch: "#3f9bd7",
  },
  {
    key: "betfair",
    name: "Betfair",
    description:
      "Exchange-style layout with a left markets rail and a distinct accent bar.",
    // badge: "New",
    swatch: "#ffb80c",
  },
  {
    key: "tomexch",
    name: "TomExch",
    description:
      "Navy-and-blue exchange skin — gradient top bar, white icon nav and blue/pink odds rows.",
    // badge: "New",
    swatch: "#2f6bb0",
  },
];

export const DEFAULT_THEME_KEY: ThemeKey = "default";

/** Storage key used in both localStorage and the cookie for the user's choice. */
export const THEME_STORAGE_KEY = "site-theme";

const THEME_MAP: Record<string, ThemeMeta> = Object.fromEntries(
  THEMES.map((t) => [t.key, t])
);

export function isKnownTheme(key?: string | null): key is ThemeKey {
  return !!key && key in THEME_MAP;
}

export function getThemeMeta(key?: string | null): ThemeMeta | undefined {
  return key ? THEME_MAP[key] : undefined;
}

/**
 * Resolve the theme actually shown to the user, in priority order:
 *   1. The user's saved selection — but only if it's a known, enabled theme.
 *   2. The admin-configured default theme — if known and enabled.
 *   3. The first enabled theme.
 *   4. The hard fallback (`default`).
 * This guarantees a valid theme even if an admin disables the one a user picked.
 */
export function resolveThemeKey(opts: {
  selected?: string | null;
  adminDefault?: string | null;
  enabled?: string[] | null;
}): ThemeKey {
  const enabled = (opts.enabled ?? [])
    .filter(isKnownTheme)
    // never let the list become empty — `default` is always available
    .concat(DEFAULT_THEME_KEY);
  const enabledSet = new Set<string>(enabled);

  if (opts.selected && enabledSet.has(opts.selected)) {
    return opts.selected as ThemeKey;
  }
  if (opts.adminDefault && enabledSet.has(opts.adminDefault)) {
    return opts.adminDefault as ThemeKey;
  }
  const firstEnabled = opts.enabled?.find(isKnownTheme);
  return (firstEnabled as ThemeKey) ?? DEFAULT_THEME_KEY;
}

/** The metadata for every enabled + known theme, in registry order. */
export function listEnabledThemes(enabled?: string[] | null): ThemeMeta[] {
  const enabledSet = new Set(
    (enabled ?? [DEFAULT_THEME_KEY]).filter(isKnownTheme)
  );
  enabledSet.add(DEFAULT_THEME_KEY);
  return THEMES.filter((t) => enabledSet.has(t.key));
}
