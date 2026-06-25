import type { ComponentType, ReactNode } from "react";

/**
 * A layout/structure theme key. The three first-party themes are listed for
 * editor autocomplete, but the type is open (`string & {}`) so future themes
 * can be added by dropping a new folder under /themes and registering it —
 * no change to this union required.
 */
export type ThemeKey = "default" | "diamond" | "betfair" | (string & {});

/**
 * Props every theme "shell" receives. A shell owns ONLY the visual chrome
 * (header / nav / sidebar / footer arrangement) around the page content.
 * All business logic (auth, websockets, data fetching, route guards) stays in
 * `MainLayout` and the pages — themes never re-implement it. This is the
 * separation-of-concerns boundary that keeps themes swappable at runtime.
 */
export interface ThemeShellProps {
  children: ReactNode;
  /** True on routes that render their own header (unified casino, game launcher). */
  hideHeader: boolean;
  /** True on casino routes — content runs full-width with no app sidebar. */
  isCasinoRoute: boolean;
  /** True on `/` and `/home`. */
  isHomeOrRoot: boolean;
}

export type ThemeShell = ComponentType<ThemeShellProps>;

/**
 * Lightweight, presentation-only metadata for a theme. Safe to import anywhere
 * (admin panel, switcher) without pulling in the heavy layout components —
 * those live in the separate shell registry.
 */
export interface ThemeMeta {
  key: ThemeKey;
  name: string;
  description: string;
  /** Short tag shown in the admin list / switcher (e.g. "Classic", "New"). */
  badge?: string;
  /** Accent color used for the switcher swatch + admin preview dot. */
  swatch: string;
}
