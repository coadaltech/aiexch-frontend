/**
 * Per-theme editable colour schema.
 *
 * Each layout theme exposes a small set of signature colours that an admin can
 * override per white label (Owner panel → White Labels → edit → Layout Theme).
 * Every field maps to a CSS custom property that the theme's stylesheet /
 * components consume (with the `default` as the built-in fallback). Overrides are
 * stored on the white label's `layout.themeColors[<themeKey>]` and applied at
 * runtime by ThemeColorApplier — so changing them needs no deploy.
 *
 * Adding colours to a theme = add fields here + have the theme read the CSS var.
 * Adding a whole new theme's palette = add a new key. No other code changes.
 */
export interface ThemeColorField {
  /** Stable key stored in the white label config. */
  key: string;
  /** Human label shown in the admin colour editor. */
  label: string;
  /** CSS custom property the theme reads. */
  cssVar: string;
  /** Built-in fallback (the theme's signature colour, or a select default). */
  default: string;
  /**
   * Field control type. Defaults to a colour picker. Use "select" for a small
   * set of named choices (e.g. a header style "Gradient" / "Solid" toggle) —
   * the chosen value is written to `cssVar` verbatim like any other override.
   */
  type?: "color" | "select";
  /** Options for a `select` field. */
  options?: { value: string; label: string }[];
}

export const THEME_COLOR_SCHEMAS: Record<string, ThemeColorField[]> = {
  diamond: [
    { key: "header", label: "Header Bar", cssVar: "--dx-header", default: "#3f8fd0" },
    { key: "nav", label: "Navigation Bar", cssVar: "--dx-nav", default: "#8a7c1c" },
    { key: "sidebarHead", label: "Sidebar Headers", cssVar: "--dx-sidebar-head", default: "#3f8fd0" },
    { key: "back", label: "Back Odds", cssVar: "--dx-back", default: "#bce6ff" },
    { key: "lay", label: "Lay Odds", cssVar: "--dx-lay", default: "#ffd1dc" },
    { key: "background", label: "Page Background", cssVar: "--dx-bg", default: "#f4f6f8" },
  ],
  betfair: [
    { key: "accent", label: "Accent Bar", cssVar: "--bf-accent", default: "#ffb80c" },
    { key: "back", label: "Back Odds", cssVar: "--back", default: "#84c2f1" },
    { key: "lay", label: "Lay Odds", cssVar: "--lay", default: "#f5a0b4" },
    { key: "background", label: "Page Background", cssVar: "--bf-bg", default: "#e9ebee" },
  ],
  tomexch: [
    // Header style: a 2-colour gradient or a single flat colour. In "solid" mode
    // only "Header Colour 1" is used; ThemeColorApplier composes --tx-header-bg.
    {
      key: "headerMode",
      label: "Header Style",
      cssVar: "--tx-header-mode",
      default: "gradient",
      type: "select",
      options: [
        { value: "gradient", label: "Gradient (two colours)" },
        { value: "solid", label: "Single colour" },
      ],
    },
    { key: "headerFrom", label: "Header Colour 1", cssVar: "--tx-header-from", default: "#142969" },
    { key: "headerTo", label: "Header Colour 2", cssVar: "--tx-header-to", default: "#84c2f1" },
    { key: "sidebarHead", label: "Sidebar Headers", cssVar: "--tx-sidebar-head", default: "#4f93d9" },
    { key: "section", label: "Section Bar", cssVar: "--tx-section", default: "#3a3f47" },
    { key: "back", label: "Back Odds", cssVar: "--tx-back", default: "#72bbef" },
    { key: "lay", label: "Lay Odds", cssVar: "--tx-lay", default: "#f9a8ba" },
    { key: "background", label: "Page Background", cssVar: "--tx-bg", default: "#eef1f4" },
  ],
};

/** Themes that expose an editable colour palette. */
export function themeHasColors(key: string): boolean {
  return Array.isArray(THEME_COLOR_SCHEMAS[key]) && THEME_COLOR_SCHEMAS[key].length > 0;
}

/** Default colour map for a theme (key → hex), used to seed the editor. */
export function defaultThemeColors(key: string): Record<string, string> {
  const fields = THEME_COLOR_SCHEMAS[key] ?? [];
  return Object.fromEntries(fields.map((f) => [f.key, f.default]));
}
